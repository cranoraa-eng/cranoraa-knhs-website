import json
import asyncio
import time
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from ..models import Ticket, TicketMessage, TicketParticipant, Notification
from ..serializers import TicketMessageSerializer, TicketListSerializer
from .base import _rate_limiter, TYPING_THROTTLE_SECONDS, MESSAGE_RATE_LIMIT, MESSAGE_RATE_WINDOW

User = get_user_model()


class TicketConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        self.ticket_id = self.scope['url_route']['kwargs']['ticket_id']
        self.room_group_name = f'ticket_{self.ticket_id}'
        self._last_typing_sent = 0
        self._authenticated = False

        if self.user and not self.user.is_anonymous:
            if await self.has_ticket_access(self.ticket_id, self.user.id):
                await self._join_groups()
                await self.accept()
                await self.send(text_data=json.dumps({
                    'type': 'auth_success',
                    'user_id': self.user.id,
                }))
                self._authenticated = True
                await self.channel_layer.group_send(self.room_group_name, {
                    'type': 'user_joined',
                    'user_id': self.user.id,
                    'user_name': self.user.first_name or self.user.username,
                })
            else:
                await self.close(code=4003)
        else:
            await self.accept()

    async def _join_groups(self):
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.channel_layer.group_add(f'user_{self.user.id}', self.channel_name)

    async def _leave_groups(self):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        if self.user and self.user.is_authenticated:
            await self.channel_layer.group_discard(f'user_{self.user.id}', self.channel_name)

    async def disconnect(self, close_code):
        if self.user and self.user.is_authenticated:
            if hasattr(self, 'room_group_name') and self._authenticated:
                await self.channel_layer.group_send(self.room_group_name, {
                    'type': 'typing_indicator',
                    'sender_id': self.user.id,
                    'sender_name': self.user.first_name or self.user.username,
                    'is_typing': False,
                })
            await self._leave_groups()

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except (json.JSONDecodeError, TypeError):
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid message format.'
            }))
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
                    if self.user.is_anonymous:
                        await self.send(text_data=json.dumps({'type': 'auth_failed', 'message': 'Invalid token'}))
                        await self.close()
                        return
                    if not await self.has_ticket_access(self.ticket_id, self.user.id):
                        await self.send(text_data=json.dumps({'type': 'auth_failed', 'message': 'No access'}))
                        await self.close(code=4003)
                        return
                    await self._join_groups()
                    self._authenticated = True
                    await self.send(text_data=json.dumps({'type': 'auth_success', 'user_id': self.user.id}))
                    await self.channel_layer.group_send(self.room_group_name, {
                        'type': 'user_joined',
                        'user_id': self.user.id,
                        'user_name': self.user.first_name or self.user.username,
                    })
                except Exception:
                    await self.send(text_data=json.dumps({'type': 'auth_failed', 'message': 'Invalid token'}))
                    await self.close()
            else:
                await self.send(text_data=json.dumps({'type': 'error', 'message': 'Not authenticated'}))
                await self.close()
            return

        msg_type = data.get('type', 'message')

        # ── Typing indicator ──────────────────────────────────────────
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

        # ── Read receipt ──────────────────────────────────────────────
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

        # ── Update status via WS ──────────────────────────────────────
        if msg_type == 'update_status':
            if self.user.role not in ('staff', 'admin'):
                await self.send(text_data=json.dumps({'type': 'error', 'message': 'Only staff can change status'}))
                return
            new_status = data.get('status')
            if new_status not in ('open', 'pending', 'replied', 'resolved', 'closed'):
                await self.send(text_data=json.dumps({'type': 'error', 'message': 'Invalid status'}))
                return
            await self._update_ticket_status(new_status)
            await self.channel_layer.group_send(self.room_group_name, {
                'type': 'ticket_status_update',
                'ticket_id': int(self.ticket_id),
                'status': new_status,
                'updated_by': self.user.id,
                'updated_by_name': self.user.first_name or self.user.username,
            })
            await self._broadcast_ticket_list_update(int(self.ticket_id))
            await self.send(text_data=json.dumps({'type': 'status_update', 'ticket_id': int(self.ticket_id), 'status': new_status}))
            return

        # ── Update priority via WS ────────────────────────────────────
        if msg_type == 'update_priority':
            if self.user.role not in ('staff', 'admin'):
                await self.send(text_data=json.dumps({'type': 'error', 'message': 'Only staff can change priority'}))
                return
            new_priority = data.get('priority')
            if new_priority not in ('normal', 'high', 'urgent'):
                await self.send(text_data=json.dumps({'type': 'error', 'message': 'Invalid priority'}))
                return
            await self._update_ticket_priority(new_priority)
            await self._broadcast_ticket_list_update(int(self.ticket_id))
            await self.send(text_data=json.dumps({'type': 'priority_update', 'ticket_id': int(self.ticket_id), 'priority': new_priority}))
            return

        # ── Message send ──────────────────────────────────────────────
        rate_limit_key = f'ticket_msg_{self.user.id}'
        if _rate_limiter.is_rate_limited(rate_limit_key, MESSAGE_RATE_LIMIT, MESSAGE_RATE_WINDOW):
            await self.send(text_data=json.dumps({'type': 'error', 'message': 'Too many messages. Slow down.'}))
            return

        content = data.get('content', '').strip()
        if not content:
            return

        saved_msg = await self.save_ticket_message(self.ticket_id, self.user.id, content)
        if not saved_msg:
            await self.send(text_data=json.dumps({'type': 'error', 'message': 'No access to this ticket'}))
            return

        serialized = await self.serialize_ticket_message(saved_msg)

        await self.channel_layer.group_send(self.room_group_name, {
            'type': 'ticket_message',
            'message_data': serialized,
        })

        # Broadcast ticket list update to ALL participants
        await self._broadcast_ticket_list_update(int(self.ticket_id))

    # ── Group message handlers ────────────────────────────────────────

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

    async def ticket_list_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'ticket_list_update',
            'ticket': event['ticket'],
        }))

    async def forced_logout(self, event):
        await self.send(text_data=json.dumps({
            'type': 'forced_logout',
            'message': event.get('message', 'Your account has been suspended.')
        }))
        await self.close()

    # ── DB helpers ────────────────────────────────────────────────────

    def _build_ticket_list_data(self, ticket):
        return {
            'id': ticket.id,
            'ticket_id': ticket.ticket_id,
            'subject': ticket.subject,
            'category': ticket.category,
            'status': ticket.status,
            'priority': ticket.priority,
            'updated_at': ticket.updated_at.isoformat() if ticket.updated_at else None,
        }

    async def _broadcast_ticket_list_update(self, ticket_id):
        try:
            ticket_data = await self.get_ticket_list_summary(ticket_id)
            if not ticket_data:
                return
            participant_ids = await self.get_ticket_participant_ids(ticket_id)
            await asyncio.gather(*[
                self.channel_layer.group_send(f'user_{pid}', {
                    'type': 'ticket_list_update',
                    'ticket': ticket_data,
                })
                for pid in participant_ids
            ])
        except Exception:
            pass

    @database_sync_to_async
    def get_ticket_list_summary(self, ticket_id):
        try:
            ticket = Ticket.objects.get(id=ticket_id)
            last_msg = ticket.messages.order_by('-created_at').first()
            return {
                'id': ticket.id,
                'ticket_id': ticket.ticket_id,
                'subject': ticket.subject,
                'category': ticket.category,
                'status': ticket.status,
                'priority': ticket.priority,
                'updated_at': ticket.updated_at.isoformat() if ticket.updated_at else None,
                'last_message': (last_msg.content[:120] + '...') if last_msg and len(last_msg.content) > 120 else (last_msg.content if last_msg else ''),
                'last_message_time': last_msg.created_at.isoformat() if last_msg else ticket.updated_at.isoformat(),
            }
        except Ticket.DoesNotExist:
            return None

    @database_sync_to_async
    def _update_ticket_status(self, new_status):
        try:
            ticket = Ticket.objects.get(id=self.ticket_id)
            ticket.status = new_status
            ticket.save(update_fields=['status', 'updated_at'])
        except Ticket.DoesNotExist:
            pass

    @database_sync_to_async
    def _update_ticket_priority(self, new_priority):
        try:
            ticket = Ticket.objects.get(id=self.ticket_id)
            ticket.priority = new_priority
            ticket.save(update_fields=['priority', 'updated_at'])
        except Ticket.DoesNotExist:
            pass

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

        return msg

    @database_sync_to_async
    def serialize_ticket_message(self, msg):
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
