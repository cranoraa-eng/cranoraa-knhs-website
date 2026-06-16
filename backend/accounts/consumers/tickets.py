import json
import asyncio
import time
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from ..models import Ticket, TicketMessage, TicketParticipant, Notification
from .base import _rate_limiter, TYPING_THROTTLE_SECONDS, MESSAGE_RATE_LIMIT, MESSAGE_RATE_WINDOW

User = get_user_model()


class TicketConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        if self.user.is_anonymous:
            await self.close()
            return

        self.ticket_id = self.scope['url_route']['kwargs']['ticket_id']
        self.room_group_name = f'ticket_{self.ticket_id}'
        self._last_typing_sent = 0

        if not await self.has_ticket_access(self.ticket_id, self.user.id):
            await self.close(code=4003)
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.channel_layer.group_add(f'user_{self.user.id}', self.channel_name)
        await self.accept()

        await self.channel_layer.group_send(self.room_group_name, {
            'type': 'user_joined',
            'user_id': self.user.id,
            'user_name': self.user.first_name or self.user.username,
        })

    async def disconnect(self, close_code):
        if self.user.is_authenticated:
            if hasattr(self, 'room_group_name'):
                await self.channel_layer.group_send(self.room_group_name, {
                    'type': 'typing_indicator',
                    'sender_id': self.user.id,
                    'sender_name': self.user.first_name or self.user.username,
                    'is_typing': False,
                })
                await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
            if hasattr(self, 'user'):
                await self.channel_layer.group_discard(f'user_{self.user.id}', self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except (json.JSONDecodeError, TypeError):
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid message format.'
            }))
            return
        msg_type = data.get('type', 'message')

        if msg_type == 'typing':
            now = time.monotonic()
            if (now - self._last_typing_sent) < TYPING_THROTTLE_SECONDS:
                return
            self._last_typing_sent = now
            await self.channel_layer.group_send(self.room_group_name, {
                'type': 'typing_indicator',
                'sender_id': self.user.id,
                'sender_name': self.user.first_name or self.user.username,
                'is_typing': data.get('is_typing', False),
            })
            return

        if msg_type == 'read':
            message_id = data.get('message_id')
            if message_id:
                await self.mark_ticket_messages_read(self.ticket_id, self.user.id, message_id)
                await self.channel_layer.group_send(self.room_group_name, {
                    'type': 'read_receipt',
                    'reader_id': self.user.id,
                    'message_id': message_id,
                })
            return

        rate_limit_key = f'ticket_msg_{self.user.id}'
        if _rate_limiter.is_rate_limited(rate_limit_key, MESSAGE_RATE_LIMIT, MESSAGE_RATE_WINDOW):
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'You are sending messages too quickly. Please slow down.'
            }))
            return

        content = data.get('content', '').strip()
        if not content:
            return

        saved_msg = await self.save_ticket_message(self.ticket_id, self.user.id, content)
        if not saved_msg:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'You do not have access to this ticket.'
            }))
            return

        serialized = await self.serialize_ticket_message(saved_msg)

        await self.channel_layer.group_send(self.room_group_name, {
            'type': 'ticket_message',
            'message_data': serialized,
        })

        participant_ids = await self.get_ticket_participant_ids(self.ticket_id)
        await asyncio.gather(*[
            self.channel_layer.group_send(f'user_{pid}', {
                'type': 'ticket_new_message_notify',
                'ticket_id': int(self.ticket_id),
                'sender_id': self.user.id,
                'sender_name': self.user.first_name or self.user.username,
                'content': content,
                'timestamp': saved_msg.created_at.isoformat(),
            })
            for pid in participant_ids if pid != self.user.id
        ])

    # ── Group message handlers ────────────────────────────────────────────

    async def ticket_message(self, event):
        msg_data = event['message_data']
        await self.send(text_data=json.dumps({
            'type': 'message',
            **msg_data,
            'ticket_id': int(self.ticket_id),
        }))

    async def typing_indicator(self, event):
        if event['sender_id'] == self.user.id:
            return
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'sender_id': event['sender_id'],
            'sender_name': event['sender_name'],
            'is_typing': event['is_typing'],
        }))

    async def read_receipt(self, event):
        await self.send(text_data=json.dumps({
            'type': 'read',
            'reader_id': event['reader_id'],
            'message_id': event['message_id'],
        }))

    async def user_joined(self, event):
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'user_joined',
                'user_id': event['user_id'],
                'user_name': event['user_name'],
            }))

    async def ticket_new_message_notify(self, event):
        await self.send(text_data=json.dumps({
            'type': 'new_message_notify',
            'ticket_id': event['ticket_id'],
            'sender_id': event['sender_id'],
            'sender_name': event['sender_name'],
            'content': event['content'],
            'timestamp': event['timestamp'],
        }))

    async def ticket_status_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'status_update',
            'ticket_id': event['ticket_id'],
            'status': event['status'],
            'updated_by': event.get('updated_by'),
            'updated_by_name': event.get('updated_by_name'),
        }))

    async def ticket_assignment_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'assignment_update',
            'ticket_id': event['ticket_id'],
            'assigned_to': event.get('assigned_to'),
            'assigned_to_name': event.get('assigned_to_name'),
        }))

    async def forced_logout(self, event):
        await self.send(text_data=json.dumps({
            'type': 'forced_logout',
            'message': event.get('message', 'Your account has been suspended.')
        }))
        await self.close()

    # ── DB helpers ────────────────────────────────────────────────────────

    @database_sync_to_async
    def has_ticket_access(self, ticket_id, user_id):
        try:
            ticket = Ticket.objects.get(id=ticket_id)
        except Ticket.DoesNotExist:
            return False
        user = User.objects.get(id=user_id)
        if user.role == 'admin':
            return True
        if ticket.created_by_id == user_id or (ticket.assigned_to_id and ticket.assigned_to_id == user_id):
            return True
        return TicketParticipant.objects.filter(ticket=ticket, user_id=user_id).exists()

    @database_sync_to_async
    def save_ticket_message(self, ticket_id, sender_id, content):
        try:
            ticket = Ticket.objects.get(id=ticket_id)
        except Ticket.DoesNotExist:
            return None

        sender = User.objects.get(id=sender_id)
        msg = TicketMessage.objects.create(ticket=ticket, sender=sender, content=content)

        if sender.role in ('staff', 'admin'):
            if ticket.status in ('open', 'pending'):
                ticket.status = 'replied'
                ticket.save(update_fields=['status', 'updated_at'])
        else:
            if ticket.status in ('open', 'replied'):
                ticket.status = 'pending'
                ticket.save(update_fields=['status', 'updated_at'])

        if not ticket.first_response_at and sender != ticket.created_by:
            from django.utils import timezone as _tz
            ticket.first_response_at = _tz.now()
            ticket.save(update_fields=['first_response_at', 'updated_at'])

        participant_ids = list(
            TicketParticipant.objects.filter(ticket=ticket).values_list('user_id', flat=True)
        )
        if ticket.created_by_id:
            participant_ids.append(ticket.created_by_id)
        if ticket.assigned_to_id:
            participant_ids.append(ticket.assigned_to_id)
        participant_ids = list(set(participant_ids))

        notified = set()
        preview = content[:100] + ('...' if len(content) > 100 else '')
        sender_name = sender.first_name or sender.username

        from django.utils import timezone as _tz
        import datetime
        five_mins_ago = _tz.now() - datetime.timedelta(minutes=5)

        for uid in participant_ids:
            if uid == sender_id or uid in notified:
                continue
            try:
                u = User.objects.get(id=uid)
                if u.last_activity and u.last_activity > five_mins_ago:
                    continue
            except User.DoesNotExist:
                continue
            Notification.objects.create(
                recipient_id=uid,
                notification_type='message',
                title=f'New message on {ticket.ticket_id}',
                message=f'{sender_name}: {preview}',
                link='/communication-center',
            )
            notified.add(uid)

        return msg

    @database_sync_to_async
    def serialize_ticket_message(self, msg):
        from ..serializers import TicketMessageSerializer
        return TicketMessageSerializer(msg).data

    @database_sync_to_async
    def get_ticket_participant_ids(self, ticket_id):
        try:
            ticket = Ticket.objects.get(id=ticket_id)
        except Ticket.DoesNotExist:
            return []
        ids = list(TicketParticipant.objects.filter(ticket=ticket).values_list('user_id', flat=True))
        if ticket.created_by_id:
            ids.append(ticket.created_by_id)
        if ticket.assigned_to_id:
            ids.append(ticket.assigned_to_id)
        return list(set(ids))

    @database_sync_to_async
    def mark_ticket_messages_read(self, ticket_id, user_id, last_msg_id):
        try:
            last_msg = TicketMessage.objects.get(id=last_msg_id, ticket_id=ticket_id)
            TicketMessage.objects.filter(
                ticket_id=ticket_id,
                created_at__lte=last_msg.created_at
            ).exclude(sender_id=user_id).update(is_read=True)
        except TicketMessage.DoesNotExist:
            pass
