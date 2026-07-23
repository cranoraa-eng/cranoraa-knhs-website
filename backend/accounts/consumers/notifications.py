import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from ..models import Notification

User = get_user_model()


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        self._authenticated = False

        if self.user and not self.user.is_anonymous:
            await self._join_groups()
            await self.accept()
            self._authenticated = True
            unread_count = await self.get_unread_count()
            await self.send(text_data=json.dumps({
                'type': 'auth_success',
                'user_id': self.user.id,
            }))
            await self.send(text_data=json.dumps({
                'type': 'unread_count',
                'count': unread_count,
            }))
        else:
            await self.accept()

    async def _join_groups(self):
        self.group_name = f'notifications_{self.user.id}'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.channel_layer.group_add('emergency_broadcast', self.channel_name)
        if self.user.role == 'admin':
            await self.channel_layer.group_add('moderation_alerts', self.channel_name)

    async def _leave_groups(self):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        await self.channel_layer.group_discard('emergency_broadcast', self.channel_name)
        if self.user and self.user.is_authenticated and self.user.role == 'admin':
            await self.channel_layer.group_discard('moderation_alerts', self.channel_name)

    async def disconnect(self, close_code):
        if self.user and self.user.is_authenticated:
            await self._leave_groups()

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except (json.JSONDecodeError, TypeError):
            return

        # Handle first-message auth
        if not self._authenticated:
            if data.get('type') == 'auth' and data.get('token'):
                from jwt import decode as jwt_decode
                from django.conf import settings as django_settings
                try:
                    decoded = jwt_decode(
                        data['token'],
                        django_settings.SECRET_KEY,
                        algorithms=['HS256']
                    )
                    self.user = await database_sync_to_async(User.objects.get)(id=decoded['user_id'])
                    await self._join_groups()
                    self._authenticated = True
                    unread_count = await self.get_unread_count()
                    await self.send(text_data=json.dumps({
                        'type': 'auth_success',
                        'user_id': self.user.id,
                    }))
                    await self.send(text_data=json.dumps({
                        'type': 'unread_count',
                        'count': unread_count,
                    }))
                except Exception:
                    await self.send(text_data=json.dumps({
                        'type': 'auth_failed',
                        'message': 'Invalid token'
                    }))
                    await self.close()
            else:
                await self.close()
            return

        action = data.get('action')

        if action == 'mark_read':
            notif_id = data.get('id')
            if notif_id:
                updated = await self.mark_notification_read(notif_id)
                if updated:
                    unread_count = await self.get_unread_count()
                    await self.send(text_data=json.dumps({
                        'type': 'notification_read',
                        'id': notif_id,
                        'unread_count': unread_count,
                    }))

        elif action == 'mark_all_read':
            await self.mark_all_notifications_read()
            await self.send(text_data=json.dumps({
                'type': 'unread_count',
                'count': 0,
            }))

    async def moderation_alert(self, event):
        await self.send(text_data=json.dumps({
            'type': 'moderation_alert',
            'data': event['data']
        }))

    async def emergency_alert(self, event):
        await self.send(text_data=json.dumps({
            'type': 'emergency_alert',
            'data': event['emergency']
        }))

    async def notification_message(self, event):
        await self.send(text_data=json.dumps(event['data']))

    @database_sync_to_async
    def get_unread_count(self):
        return Notification.objects.filter(recipient=self.user, is_read=False).count()

    @database_sync_to_async
    def mark_notification_read(self, notif_id):
        return Notification.objects.filter(
            pk=notif_id, recipient=self.user
        ).update(is_read=True)

    @database_sync_to_async
    def mark_all_notifications_read(self):
        Notification.objects.filter(recipient=self.user, is_read=False).update(is_read=True)
