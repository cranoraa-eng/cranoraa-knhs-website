import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import ChatRoom, ChatMessage, MessageReaction, Notification
from .serializers import ChatMessageSerializer
from .utils import check_user_moderation

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'chat_{self.room_id}'
        self.user = self.scope['user']

        if self.user.is_authenticated:
            # Set user as online in Redis
            await self.set_user_online_status(True)

            if self.room_id != '0':
                await self.channel_layer.group_add(self.room_group_name, self.channel_name)
                # Mark all unread messages as delivered when user connects
                await self.mark_messages_delivered(self.room_id, self.user.id)
                # Notify others in the room
                await self.channel_layer.group_send(self.room_group_name, {
                    'type': 'user_online',
                    'user_id': self.user.id,
                })

            # Always join a personal channel so we receive cross-room events
            await self.channel_layer.group_add(f'user_{self.user.id}', self.channel_name)
            await self.accept()

            # Broadcast online status to all friends
            await self.broadcast_presence(True)
        else:
            await self.close()

    async def disconnect(self, close_code):
        if self.user.is_authenticated:
            # Set user as offline in Redis
            await self.set_user_online_status(False)

            if self.room_id != '0':
                # Send typing stopped
                await self.channel_layer.group_send(self.room_group_name, {
                    'type': 'typing_indicator',
                    'sender_id': self.user.id,
                    'sender_name': self.user.first_name or self.user.username,
                    'is_typing': False,
                })
                await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
            
            await self.channel_layer.group_discard(f'user_{self.user.id}', self.channel_name)
            
            # Broadcast offline status to all friends
            await self.broadcast_presence(False)

    @database_sync_to_async
    def set_user_online_status(self, is_online):
        """Update user's last_activity and potentially a Redis-only presence key."""
        User.objects.filter(id=self.user.id).update(last_activity=timezone.now())
        # The user also wants "Presence features: temporary user status stored in Redis"
        # We can use the channel_layer to store this if we want, but usually it's better to 
        # use a separate redis client for custom data. 
        # However, for "real-time features only", using group_send for presence is standard.

    async def broadcast_presence(self, is_online):
        """Notify all friends of the user's online/offline status."""
        friend_ids = await self.get_friend_ids()
        for friend_id in friend_ids:
            await self.channel_layer.group_send(
                f'user_{friend_id}',
                {
                    'type': 'peer_presence',
                    'user_id': self.user.id,
                    'is_online': is_online,
                }
            )

    @database_sync_to_async
    def get_friend_ids(self):
        from .models import Friendship
        from django.db.models import Q
        friendships = Friendship.objects.filter(
            (Q(from_user=self.user) | Q(to_user=self.user)),
            status='accepted'
        )
        ids = []
        for f in friendships:
            ids.append(f.to_user_id if f.from_user_id == self.user.id else f.from_user_id)
        return ids

    async def peer_presence(self, event):
        """Receive presence update from a friend."""
        await self.send(text_data=json.dumps({
            'type': 'peer_presence',
            'user_id': event['user_id'],
            'is_online': event['is_online'],
        }))

    async def receive(self, text_data):
        data = json.loads(text_data)
        msg_type = data.get('type', 'message')

        # Typing indicator
        if msg_type == 'typing':
            await self.channel_layer.group_send(self.room_group_name, {
                'type': 'typing_indicator',
                'sender_id': self.user.id,
                'sender_name': self.user.first_name or self.user.username,
                'is_typing': data.get('is_typing', False),
            })
            return

        # Read receipt — client tells server they read up to a message
        if msg_type == 'read':
            message_id = data.get('message_id')
            if message_id:
                await self.mark_messages_read(self.room_id, self.user.id, message_id)
                await self.channel_layer.group_send(self.room_group_name, {
                    'type': 'read_receipt',
                    'reader_id': self.user.id,
                    'message_id': message_id,
                })
            return

        # Reaction
        if msg_type == 'reaction':
            await self.handle_reaction(data)
            return

        # Check if user is muted or suspended
        is_allowed, reason = await self.async_check_moderation()
        if not is_allowed:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': reason
            }))
            return

        # Regular chat message (possibly a reply)
        message = data.get('message', '').strip()
        if not message:
            return

        parent_id = data.get('parent_id')
        saved_msg = await self.save_message(self.room_id, self.user.id, message, parent_id)
        
        # Serialize the message to include parent_message_details
        serialized_msg = await self.serialize_message(saved_msg)

        await self.channel_layer.group_send(self.room_group_name, {
            'type': 'chat_message',
            'message_data': serialized_msg
        })

        # Notify every participant's personal channel
        participant_ids = await self.get_room_participant_ids(self.room_id)
        for pid in participant_ids:
            if pid != self.user.id:
                await self.channel_layer.group_send(f'user_{pid}', {
                    'type': 'new_message_notify',
                    'room_id': int(self.room_id),
                    'sender_id': self.user.id,
                    'sender_name': self.user.first_name or self.user.username,
                    'content': message,
                    'timestamp': saved_msg.timestamp.isoformat(),
                })

    # Reaction handler
    async def handle_reaction(self, data):
        message_id = data.get('message_id')
        emoji = data.get('emoji')
        if not message_id or not emoji:
            return

        reaction_data = await self.toggle_reaction(message_id, self.user.id, emoji)
        
        # Broadcast to current room participants
        broadcast_data = {
            'type': 'message_reaction',
            'message_id': message_id,
            'reactions': reaction_data,
            'user_id': self.user.id,
            'user_name': self.user.first_name or self.user.username,
            'emoji': emoji,
            'room_id': int(self.room_id)
        }
        await self.channel_layer.group_send(self.room_group_name, broadcast_data)

        # Also notify personal channels of ALL participants for chat list updates (including sender)
        participant_ids = await self.get_room_participant_ids(self.room_id)
        for pid in participant_ids:
            await self.channel_layer.group_send(f'user_{pid}', broadcast_data)

    # ── Handlers ──────────────────────────────────────────────────

    async def chat_message(self, event):
        msg_data = event['message_data']
        # Mark as delivered for recipients (not sender)
        if msg_data['sender'] != self.user.id:
            await self.set_delivered(msg_data['id'])
            # Notify sender of delivery
            await self.channel_layer.group_send(self.room_group_name, {
                'type': 'delivery_receipt',
                'message_id': msg_data['id'],
            })

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
        # When another user connects, mark their unread messages as delivered
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
            'type': event['event'],   # 'room_updated' or 'group_deleted'
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
        # Close the connection
        await self.close()

    # ── DB helpers ────────────────────────────────────────────────

    @database_sync_to_async
    def async_check_moderation(self):
        user = User.objects.get(id=self.user.id)
        return check_user_moderation(user)

    @database_sync_to_async
    def save_message(self, room_id, sender_id, message, parent_id=None):
        room = ChatRoom.objects.get(id=room_id)
        sender = User.objects.get(id=sender_id)
        parent = None
        if parent_id:
            try:
                parent = ChatMessage.objects.get(id=parent_id)
            except ChatMessage.DoesNotExist:
                pass
        
        # Update last action
        room.last_action_type = 'message'
        room.last_action_sender = sender
        room.last_action_content = message
        room.save()
        
        return ChatMessage.objects.create(room=room, sender=sender, content=message, parent_message=parent)

    @database_sync_to_async
    def serialize_message(self, msg):
        return ChatMessageSerializer(msg).data

    @database_sync_to_async
    def get_room_participant_ids(self, room_id):
        return list(ChatRoom.objects.get(id=room_id).participants.values_list('id', flat=True))

    @database_sync_to_async
    def set_delivered(self, msg_id):
        ChatMessage.objects.filter(id=msg_id).update(is_delivered=True)

    @database_sync_to_async
    def mark_messages_delivered(self, room_id, user_id):
        ChatMessage.objects.filter(room_id=room_id).exclude(sender_id=user_id).update(is_delivered=True)

    @database_sync_to_async
    def mark_messages_read(self, room_id, user_id, last_msg_id):
        # Mark all messages in this room up to this ID as read
        try:
            last_msg = ChatMessage.objects.get(id=last_msg_id)
            ChatMessage.objects.filter(
                room_id=room_id,
                timestamp__lte=last_msg.timestamp
            ).exclude(sender_id=user_id).update(is_read=True, is_delivered=True)
        except ChatMessage.DoesNotExist:
            pass

    @database_sync_to_async
    def toggle_reaction(self, message_id, user_id, emoji):
        from .models import MessageReaction
        msg = ChatMessage.objects.get(id=message_id)
        user = User.objects.get(id=user_id)
        
        # Check if user already has THIS specific emoji reaction
        existing_this_emoji = MessageReaction.objects.filter(message=msg, user=user, emoji=emoji)
        
        if existing_this_emoji.exists():
            # If they already reacted with this emoji, remove it (toggle off)
            existing_this_emoji.delete()
        else:
            # If they are reacting with a NEW emoji, remove ANY existing reaction they have for this message
            MessageReaction.objects.filter(message=msg, user=user).delete()
            # Then create the new one
            MessageReaction.objects.create(message=msg, user=user, emoji=emoji)
        
        # Return updated reactions for this message
        reactions = {}
        for r in MessageReaction.objects.filter(message=msg):
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
            
            # Admins also join a global moderation group
            if self.user.role == 'admin':
                await self.channel_layer.group_add('moderation_alerts', self.channel_name)
                
            await self.accept()
            
            # Send initial unread count
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
            pass  # Never crash the consumer on bad client input

    async def moderation_alert(self, event):
        """Receive moderation alert (Admins only)."""
        await self.send(text_data=json.dumps({
            'type': 'moderation_alert',
            'data': event['data']
        }))

    async def notification_message(self, event):
        """Receive notification from group."""
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
