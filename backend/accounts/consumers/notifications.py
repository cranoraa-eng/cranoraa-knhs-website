import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from ..models import Notification


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        if self.user.is_authenticated:
            self.group_name = f'notifications_{self.user.id}'
            await self.channel_layer.group_add(self.group_name, self.channel_name)

            if self.user.role == 'admin':
                await self.channel_layer.group_add('moderation_alerts', self.channel_name)

            await self.accept()

            unread_count = await self.get_unread_count()
            await self.send(text_data=json.dumps({
                'type': 'unread_count',
                'count': unread_count
            }))
        else:
            await self.close()

    async def disconnect(self, close_code):
        if self.user.is_authenticated and hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
            if self.user.role == 'admin':
                await self.channel_layer.group_discard('moderation_alerts', self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
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
        except Exception:
            pass

    async def moderation_alert(self, event):
        await self.send(text_data=json.dumps({
            'type': 'moderation_alert',
            'data': event['data']
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
