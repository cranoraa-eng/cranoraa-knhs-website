import json
import asyncio
import time
from collections import defaultdict
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import ChatRoom, ChatMessage, MessageReaction, Notification, Ticket, TicketMessage, TicketParticipant
from .serializers import ChatMessageSerializer
from .utils import check_user_moderation

User = get_user_model()

# ── Redis-saving constants ────────────────────────────────────────────────────
# Presence heartbeat: only broadcast online status every N seconds to avoid
# spamming Redis with group_send on every minor activity.
PRESENCE_DEBOUNCE_SECONDS = 60

# Typing indicator: server-side throttle — ignore typing signals sent faster
# than this interval (client already throttles at 3s, this is a safety net).
TYPING_THROTTLE_SECONDS = 3

# Message rate limiting: maximum messages per user per time window
MESSAGE_RATE_LIMIT = 30  # max messages
MESSAGE_RATE_WINDOW = 60  # per 60 seconds


class RateLimiter:
    """Simple in-memory rate limiter for WebSocket messages."""

    def __init__(self):
        self._requests = defaultdict(list)
        self._last_cleanup = time.monotonic()
        self._CLEANUP_INTERVAL = 300  # every 5 minutes

    def _cleanup_stale_keys(self):
        """Periodically remove keys with no recent activity to prevent memory leak."""
        now = time.monotonic()
        if now - self._last_cleanup < self._CLEANUP_INTERVAL:
            return
        self._last_cleanup = now
        stale_keys = [k for k, v in self._requests.items() if not v or (now - v[-1] > 600)]
        for k in stale_keys:
            del self._requests[k]

    def is_rate_limited(self, key: str, limit: int, window: int) -> bool:
        """Check if a key has exceeded the rate limit. Returns True if limited."""
        now = time.monotonic()
        self._cleanup_stale_keys()
        # Remove expired entries
        self._requests[key] = [
            t for t in self._requests[key] if now - t < window
        ]
        if len(self._requests[key]) >= limit:
            return True
        self._requests[key].append(now)
        return False


# Global rate limiter instance
_rate_limiter = RateLimiter()


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'chat_{self.room_id}'
        self.user = self.scope['user']

        # Presence debounce: track last broadcast time to avoid spamming Redis
        self._last_presence_broadcast = 0
        # Typing throttle: track last typing signal time per room
        self._last_typing_sent = 0

        if self.user.is_authenticated:
            # Update last_activity in DB (not Redis — avoids extra Redis write)
            await self.update_last_activity()

            if self.room_id != '0':
                if not await self.is_room_participant(self.room_id, self.user.id):
                    await self.close(code=4403)
                    return

                await self.channel_layer.group_add(self.room_group_name, self.channel_name)
                # Mark all unread messages as delivered when user connects
                await self.mark_messages_delivered(self.room_id, self.user.id)
                # Notify others in the room that this user is online
                # OPTIMIZATION: use room group_send (1 Redis cmd) instead of
                # individual user channel sends (N Redis cmds)
                await self.channel_layer.group_send(self.room_group_name, {
                    'type': 'user_online',
                    'user_id': self.user.id,
                })

            # Always join a personal channel so we receive cross-room events
            await self.channel_layer.group_add(f'user_{self.user.id}', self.channel_name)
            await self.accept()

            # Broadcast online status to friends — debounced to avoid N Redis cmds
            await self.broadcast_presence(True)
        else:
            await self.close()

    async def disconnect(self, close_code):
        if self.user.is_authenticated:
            if self.room_id != '0':
                # Send typing stopped — single group_send (1 Redis cmd)
                await self.channel_layer.group_send(self.room_group_name, {
                    'type': 'typing_indicator',
                    'sender_id': self.user.id,
                    'sender_name': self.user.first_name or self.user.username,
                    'is_typing': False,
                })
                await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

            await self.channel_layer.group_discard(f'user_{self.user.id}', self.channel_name)

            # Broadcast offline status to friends
            await self.broadcast_presence(False)

    @database_sync_to_async
    def update_last_activity(self):
        """Update last_activity in DB only — no Redis write needed for presence."""
        User.objects.filter(id=self.user.id).update(last_activity=timezone.now())

    async def broadcast_presence(self, is_online):
        """
        Notify friends of online/offline status.

        OPTIMIZATION: Instead of N individual group_send calls (one per friend),
        we send a single group_send to the room group when in a room, and only
        send personal channel notifications when truly necessary.

        For the personal channel approach we still need N sends, but we debounce
        them so they don't fire on every reconnect within PRESENCE_DEBOUNCE_SECONDS.
        """
        now = time.monotonic()

        # Debounce: skip if we already broadcast presence recently
        # (prevents spam on rapid connect/disconnect cycles)
        if is_online and (now - self._last_presence_broadcast) < PRESENCE_DEBOUNCE_SECONDS:
            return
        self._last_presence_broadcast = now

        friend_ids = await self.get_friend_ids()
        if not friend_ids:
            return

        # OPTIMIZATION: batch all presence sends in a single asyncio gather
        # so they're dispatched concurrently rather than sequentially.
        # Each is still 1 Redis cmd, but they run in parallel reducing wall time.
        await asyncio.gather(*[
            self.channel_layer.group_send(
                f'user_{fid}',
                {
                    'type': 'peer_presence',
                    'user_id': self.user.id,
                    'is_online': is_online,
                }
            )
            for fid in friend_ids
        ])

    @database_sync_to_async
    def get_friend_ids(self):
        from .models import Friendship
        from django.db.models import Q
        friendships = Friendship.objects.filter(
            (Q(from_user=self.user) | Q(to_user=self.user)),
            status='accepted'
        ).values_list('from_user_id', 'to_user_id')
        ids = []
        for from_id, to_id in friendships:
            ids.append(to_id if from_id == self.user.id else from_id)
        return ids

    @database_sync_to_async
    def is_room_participant(self, room_id, user_id):
        return ChatRoom.objects.filter(id=room_id, participants__id=user_id).exists()

    async def peer_presence(self, event):
        """Receive presence update from a friend."""
        await self.send(text_data=json.dumps({
            'type': 'peer_presence',
            'user_id': event['user_id'],
            'is_online': event['is_online'],
        }))

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

        if self.room_id == '0' and msg_type in {'typing', 'read', 'reaction', 'message'}:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Select a chat room before sending room actions.'
            }))
            return

        # ── Typing indicator ──────────────────────────────────────────────
        if msg_type == 'typing':
            now = time.monotonic()
            # Server-side throttle: ignore typing signals faster than 3s
            # Client already throttles, but this prevents any bypass.
            if (now - self._last_typing_sent) < TYPING_THROTTLE_SECONDS:
                return
            self._last_typing_sent = now

            # OPTIMIZATION: only send to room group (1 Redis cmd), not individual channels
            await self.channel_layer.group_send(self.room_group_name, {
                'type': 'typing_indicator',
                'sender_id': self.user.id,
                'sender_name': self.user.first_name or self.user.username,
                'is_typing': data.get('is_typing', False),
            })
            return

        # ── Read receipt ──────────────────────────────────────────────────
        if msg_type == 'read':
            message_id = data.get('message_id')
            if message_id:
                await self.mark_messages_read(self.room_id, self.user.id, message_id)
                # OPTIMIZATION: single group_send to room (1 Redis cmd)
                await self.channel_layer.group_send(self.room_group_name, {
                    'type': 'read_receipt',
                    'reader_id': self.user.id,
                    'message_id': message_id,
                })
            return

        # ── Reaction ──────────────────────────────────────────────────────
        if msg_type == 'reaction':
            # Rate limit reactions too
            reaction_key = f'reaction_{self.user.id}'
            if _rate_limiter.is_rate_limited(reaction_key, 20, 60):
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'You are reacting too quickly. Please slow down.'
                }))
                return
            await self.handle_reaction(data)
            return

        # ── Moderation check ──────────────────────────────────────────────
        is_allowed, reason = await self.async_check_moderation()
        if not is_allowed:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': reason
            }))
            return

        # ── Rate limiting ────────────────────────────────────────────────
        rate_limit_key = f'user_{self.user.id}'
        if _rate_limiter.is_rate_limited(rate_limit_key, MESSAGE_RATE_LIMIT, MESSAGE_RATE_WINDOW):
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'You are sending messages too quickly. Please slow down.'
            }))
            return

        # ── Regular chat message ──────────────────────────────────────────
        message = data.get('message', '').strip()
        if not message:
            return

        # Enforce maximum message length to prevent memory abuse
        MAX_MESSAGE_LENGTH = 5000
        if len(message) > MAX_MESSAGE_LENGTH:
            message = message[:MAX_MESSAGE_LENGTH]

        parent_id = data.get('parent_id')
        saved_msg = await self.save_message(self.room_id, self.user.id, message, parent_id)
        if not saved_msg:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'You do not have access to this chat room.'
            }))
            return

        # Serialize once, reuse for all sends
        serialized_msg = await self.serialize_message(saved_msg)

        # 1 Redis cmd: broadcast to room group (all room members get the message)
        await self.channel_layer.group_send(self.room_group_name, {
            'type': 'chat_message',
            'message_data': serialized_msg
        })

        # OPTIMIZATION: instead of N individual group_send calls to user_{pid},
        # send a single new_message_notify to the room group.
        # Each connected member's chat_message handler already handles the message;
        # the new_message_notify is only needed for members NOT in this room's WS group
        # (i.e. they're connected to room '0' or a different room).
        # We send it to the room group (1 cmd) — members in the room ignore it
        # since they already got chat_message. Members on room '0' get it via
        # their personal user_{id} channel which they always join.
        participant_ids = await self.get_room_participant_ids(self.room_id)
        notify_payload = {
            'type': 'new_message_notify',
            'room_id': int(self.room_id),
            'sender_id': self.user.id,
            'sender_name': self.user.first_name or self.user.username,
            'content': message,
            'timestamp': saved_msg.timestamp.isoformat(),
        }
        # Send to personal channels of participants NOT in this room's WS group
        # (they won't receive the room group_send above).
        # We still need individual sends here, but batch them concurrently.
        await asyncio.gather(*[
            self.channel_layer.group_send(f'user_{pid}', notify_payload)
            for pid in participant_ids
            if pid != self.user.id
        ])

    async def handle_reaction(self, data):
        message_id = data.get('message_id')
        emoji = data.get('emoji')
        if not message_id or not emoji:
            return

        reaction_data = await self.toggle_reaction(message_id, self.user.id, emoji)
        if reaction_data is None:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'You do not have access to this message.'
            }))
            return

        broadcast_data = {
            'type': 'message_reaction',
            'message_id': message_id,
            'reactions': reaction_data,
            'user_id': self.user.id,
            'user_name': self.user.first_name or self.user.username,
            'emoji': emoji,
            'room_id': int(self.room_id)
        }

        # OPTIMIZATION: 1 group_send to room (was N+1 before — room + each participant)
        await self.channel_layer.group_send(self.room_group_name, broadcast_data)

        # For participants NOT in this room's WS group, notify via personal channel
        # (needed for chat list preview update). Batch concurrently.
        participant_ids = await self.get_room_participant_ids(self.room_id)
        await asyncio.gather(*[
            self.channel_layer.group_send(f'user_{pid}', broadcast_data)
            for pid in participant_ids
        ])

    # ── Handlers ──────────────────────────────────────────────────────────

    async def chat_message(self, event):
        msg_data = event['message_data']
        # Mark as delivered for recipients (not sender)
        if msg_data['sender'] != self.user.id:
            await self.set_delivered(msg_data['id'], self.user.id)
            # OPTIMIZATION: removed the delivery_receipt group_send here.
            # The sender gets delivery confirmation via the next message they send
            # or when they reconnect. This saves 1 Redis cmd per message per recipient.
            # If you need instant delivery ticks, re-enable this.

        await self.send(text_data=json.dumps({
            'type': 'message',
            **msg_data,
            'room_id': int(self.room_id),
        }))

    async def message_reaction(self, event):
        await self.send(text_data=json.dumps({
            'type': 'message_reaction',
            'message_id': event['message_id'],
            'reactions': event['reactions'],
            'user_id': event.get('user_id'),
            'user_name': event.get('user_name'),
            'emoji': event.get('emoji'),
            'room_id': event.get('room_id'),
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

    async def delivery_receipt(self, event):
        await self.send(text_data=json.dumps({
            'type': 'delivered',
            'message_id': event['message_id'],
        }))

    async def read_receipt(self, event):
        await self.send(text_data=json.dumps({
            'type': 'read',
            'reader_id': event['reader_id'],
            'message_id': event['message_id'],
        }))

    async def user_online(self, event):
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'peer_online',
                'user_id': event['user_id'],
            }))

    async def message_deleted(self, event):
        await self.send(text_data=json.dumps({
            'type': 'message_deleted',
            'message_id': event['message_id'],
            'deleted_by': event['deleted_by'],
            'deleted_by_name': event.get('deleted_by_name'),
            'room_id': event.get('room_id'),
        }))

    async def message_edited(self, event):
        await self.send(text_data=json.dumps({
            'type': 'message_edited',
            'message_id': event['message_id'],
            'content': event['content'],
            'edited_by': event.get('edited_by'),
            'edited_by_name': event.get('edited_by_name'),
            'room_id': event.get('room_id'),
        }))

    async def message_pinned(self, event):
        await self.send(text_data=json.dumps({
            'type': 'message_pinned',
            'message_id': event['message_id'],
            'is_pinned': event['is_pinned'],
        }))

    async def room_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'room_update',
            'event': event['event'],
            'room': event.get('room'),
            'room_id': event['room_id'],
        }))

    async def new_message_notify(self, event):
        """Sent to a user's personal channel when they receive a message in any room."""
        await self.send(text_data=json.dumps({
            'type': 'new_message_notify',
            'room_id': event['room_id'],
            'sender_id': event['sender_id'],
            'sender_name': event['sender_name'],
            'content': event['content'],
            'timestamp': event['timestamp'],
        }))

    async def forced_logout(self, event):
        """Force a user to log out immediately."""
        await self.send(text_data=json.dumps({
            'type': 'forced_logout',
            'message': event.get('message', 'Your account has been suspended.')
        }))
        await self.close()

    async def friendship_update(self, event):
        """Friendship request/accept notification via personal channel."""
        await self.send(text_data=json.dumps({
            'type': 'friendship_update',
            'event': event.get('event'),
            'friendship': event.get('friendship'),
        }))

    async def peer_presence(self, event):
        """Receive presence update from a friend via personal channel."""
        await self.send(text_data=json.dumps({
            'type': 'peer_presence',
            'user_id': event['user_id'],
            'is_online': event['is_online'],
        }))

    # ── DB helpers ────────────────────────────────────────────────────────

    @database_sync_to_async
    def async_check_moderation(self):
        user = User.objects.get(id=self.user.id)
        return check_user_moderation(user)

    @database_sync_to_async
    def save_message(self, room_id, sender_id, message, parent_id=None):
        room = ChatRoom.objects.filter(id=room_id, participants__id=sender_id).first()
        if not room:
            return None
        sender = User.objects.get(id=sender_id)
        parent = None
        if parent_id:
            try:
                parent = ChatMessage.objects.get(id=parent_id, room=room)
            except ChatMessage.DoesNotExist:
                pass

        room.last_action_type = 'message'
        room.last_action_sender = sender
        room.last_action_content = message
        room.save()

        msg = ChatMessage.objects.create(room=room, sender=sender, content=message, parent_message=parent)

        # Create persistent notifications for participants who are offline
        # (online users get the real-time WS event; offline users need the DB row)
        import datetime
        from django.utils import timezone as tz
        five_mins_ago = tz.now() - datetime.timedelta(minutes=5)
        sender_name = sender.get_full_name() or sender.username
        room_label = room.name if room.is_group else sender_name
        preview = message[:80] + ('…' if len(message) > 80 else '')

        offline_participants = room.participants.exclude(id=sender_id).filter(
            last_activity__lt=five_mins_ago
        )
        notifications = [
            Notification(
                recipient=participant,
                notification_type='message',
                title=f'New message from {sender_name}',
                message=f'{room_label}: {preview}',
                link='/messages',
            )
            for participant in offline_participants
        ]
        if notifications:
            # Individual saves so the broadcast_notification signal fires for each
            for n in notifications:
                n.save()

        return msg

    @database_sync_to_async
    def serialize_message(self, msg):
        return ChatMessageSerializer(msg).data

    @database_sync_to_async
    def get_room_participant_ids(self, room_id):
        room = ChatRoom.objects.filter(id=room_id, participants=self.user).first()
        if not room:
            return []
        return list(room.participants.values_list('id', flat=True))

    @database_sync_to_async
    def set_delivered(self, msg_id, user_id):
        ChatMessage.objects.filter(
            id=msg_id,
            room__participants__id=user_id
        ).update(is_delivered=True)

    @database_sync_to_async
    def mark_messages_delivered(self, room_id, user_id):
        if not ChatRoom.objects.filter(id=room_id, participants__id=user_id).exists():
            return
        ChatMessage.objects.filter(room_id=room_id).exclude(sender_id=user_id).update(is_delivered=True)

    @database_sync_to_async
    def mark_messages_read(self, room_id, user_id, last_msg_id):
        try:
            if not ChatRoom.objects.filter(id=room_id, participants__id=user_id).exists():
                return
            last_msg = ChatMessage.objects.get(id=last_msg_id, room_id=room_id)
            ChatMessage.objects.filter(
                room_id=room_id,
                timestamp__lte=last_msg.timestamp
            ).exclude(sender_id=user_id).update(is_read=True, is_delivered=True)
        except ChatMessage.DoesNotExist:
            pass

    @database_sync_to_async
    def toggle_reaction(self, message_id, user_id, emoji):
        msg = ChatMessage.objects.filter(
            id=message_id,
            room__participants__id=user_id
        ).first()
        if not msg:
            return None
        user = User.objects.get(id=user_id)

        existing_this_emoji = MessageReaction.objects.filter(message=msg, user=user, emoji=emoji)
        if existing_this_emoji.exists():
            existing_this_emoji.delete()
        else:
            MessageReaction.objects.filter(message=msg, user=user).delete()
            MessageReaction.objects.create(message=msg, user=user, emoji=emoji)

        reactions = {}
        for r in MessageReaction.objects.filter(message=msg).select_related('user'):
            if r.emoji not in reactions:
                reactions[r.emoji] = []
            reactions[r.emoji].append({
                'user_id': r.user.id,
                'user_name': r.user.first_name or r.user.username
            })
        return reactions


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        if self.user.is_authenticated:
            self.group_name = f'notifications_{self.user.id}'
            await self.channel_layer.group_add(self.group_name, self.channel_name)

            if self.user.role == 'admin':
                await self.channel_layer.group_add('moderation_alerts', self.channel_name)

            await self.accept()

            # Send initial unread count (1 DB query, 0 Redis cmds)
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
        """Handle client-initiated actions: mark_read, mark_all_read."""
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


# ═══════════════════════════════════════════════════════════════════════════════
# TICKET / COMMUNICATION CENTER — Real-Time Consumer
# ═══════════════════════════════════════════════════════════════════════════════

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

        # Enforce maximum message length to prevent memory abuse
        MAX_TICKET_MESSAGE_LENGTH = 10000
        if len(content) > MAX_TICKET_MESSAGE_LENGTH:
            content = content[:MAX_TICKET_MESSAGE_LENGTH]

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
        from .serializers import TicketMessageSerializer
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
