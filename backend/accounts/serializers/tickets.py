from rest_framework import serializers

from ..models import (
    Ticket, TicketParticipant, TicketMessage, TicketAttachment, DepartmentContact,
    User,
)
from ._base import full_name


class TicketAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = TicketAttachment
        fields = ['id', 'file_name', 'file_url', 'file_size_bytes', 'content_type', 'uploaded_by', 'uploaded_by_name', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_by', 'uploaded_at']

    def get_uploaded_by_name(self, obj):
        return full_name(obj.uploaded_by)

    def validate_file_size_bytes(self, value):
        max_size = TicketAttachment.MAX_FILE_SIZE_BYTES
        if value > max_size:
            max_mb = max_size // (1024 * 1024)
            raise serializers.ValidationError(f'File size exceeds {max_mb} MB limit.')
        return value

    def validate_content_type(self, value):
        if value and value not in TicketAttachment.ALLOWED_CONTENT_TYPES:
            raise serializers.ValidationError(f'File type "{value}" is not allowed.')
        return value


class TicketMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    sender_role = serializers.CharField(source='sender.role', read_only=True)
    sender_initials = serializers.SerializerMethodField()

    class Meta:
        model = TicketMessage
        fields = ['id', 'ticket', 'sender', 'sender_name', 'sender_role', 'sender_initials', 'content', 'created_at', 'is_read']
        read_only_fields = ['id', 'sender', 'created_at']

    def get_sender_name(self, obj):
        return full_name(obj.sender)

    def get_sender_initials(self, obj):
        name = full_name(obj.sender)
        parts = name.split()
        if len(parts) >= 2:
            return (parts[0][0] + parts[-1][0]).upper()
        return name[:2].upper() if name else '??'


class TicketParticipantSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_role = serializers.CharField(source='user.role', read_only=True)
    user_initials = serializers.SerializerMethodField()

    class Meta:
        model = TicketParticipant
        fields = ['id', 'ticket', 'user', 'user_name', 'user_role', 'user_initials', 'role', 'added_at']
        read_only_fields = ['id', 'added_at']

    def get_user_name(self, obj):
        return full_name(obj.user)

    def get_user_initials(self, obj):
        name = full_name(obj.user)
        parts = name.split()
        if len(parts) >= 2:
            return (parts[0][0] + parts[-1][0]).upper()
        return name[:2].upper() if name else '??'


class TicketListSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    created_by_role = serializers.CharField(source='created_by.role', read_only=True)
    assigned_to_name = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    message_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    last_message_time = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = [
            'id', 'ticket_id', 'subject', 'category', 'status', 'priority',
            'created_by', 'created_by_name', 'created_by_role',
            'assigned_to', 'assigned_to_name', 'department',
            'unread_count', 'message_count', 'last_message', 'last_message_time',
            'is_archived', 'created_at', 'updated_at',
        ]

    def get_created_by_name(self, obj):
        return full_name(obj.created_by)

    def get_assigned_to_name(self, obj):
        return full_name(obj.assigned_to) if obj.assigned_to else None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
        return 0

    def get_message_count(self, obj):
        msgs = getattr(obj, '_prefetched_messages_cache', None)
        if msgs is not None:
            return len(msgs) if isinstance(msgs, list) else msgs.count()
        return obj.messages.count()

    def get_last_message(self, obj):
        msgs = getattr(obj, '_prefetched_messages_cache', None)
        if msgs is not None:
            last_msg = msgs[-1] if msgs else None
        else:
            last_msg = obj.messages.order_by('-created_at').first()
        if last_msg:
            content = last_msg.content
            if len(content) > 120:
                return content[:120] + '...'
            return content
        return ''

    def get_last_message_time(self, obj):
        msgs = getattr(obj, '_prefetched_messages_cache', None)
        if msgs is not None:
            last_msg = msgs[-1] if msgs else None
        else:
            last_msg = obj.messages.order_by('-created_at').first()
        return last_msg.created_at if last_msg else obj.updated_at


class TicketDetailSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    created_by_role = serializers.CharField(source='created_by.role', read_only=True)
    assigned_to_name = serializers.SerializerMethodField()
    messages = TicketMessageSerializer(many=True, read_only=True)
    participants = TicketParticipantSerializer(many=True, read_only=True)
    attachments = TicketAttachmentSerializer(many=True, read_only=True)
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = [
            'id', 'ticket_id', 'subject', 'category', 'status', 'priority',
            'created_by', 'created_by_name', 'created_by_role',
            'assigned_to', 'assigned_to_name', 'department',
            'messages', 'participants', 'attachments',
            'unread_count', 'is_archived', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'ticket_id', 'created_by', 'created_at', 'updated_at']

    def get_created_by_name(self, obj):
        return full_name(obj.created_by)

    def get_assigned_to_name(self, obj):
        return full_name(obj.assigned_to) if obj.assigned_to else None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return TicketMessage.objects.filter(
                ticket=obj, is_read=False
            ).exclude(sender=request.user).count()
        return 0


class TicketCreateSerializer(serializers.ModelSerializer):
    participant_ids = serializers.ListField(child=serializers.IntegerField(), required=False, write_only=True)

    class Meta:
        model = Ticket
        fields = ['id', 'subject', 'category', 'priority', 'assigned_to', 'department', 'participant_ids', 'status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'status', 'created_at', 'updated_at']

    def create(self, validated_data):
        participant_ids = validated_data.pop('participant_ids', [])
        ticket = Ticket.objects.create(**validated_data)

        TicketParticipant.objects.get_or_create(
            ticket=ticket,
            user=validated_data['created_by'],
            defaults={'role': 'collaborator'}
        )

        assigned = validated_data.get('assigned_to')
        if assigned and assigned != validated_data.get('created_by'):
            TicketParticipant.objects.get_or_create(
                ticket=ticket,
                user=assigned,
                defaults={'role': 'collaborator'}
            )

        for user_id in participant_ids:
            try:
                user = User.objects.get(id=user_id)
                TicketParticipant.objects.get_or_create(
                    ticket=ticket,
                    user=user,
                    defaults={'role': 'viewer'}
                )
            except User.DoesNotExist:
                pass

        return ticket


class DepartmentContactSerializer(serializers.ModelSerializer):
    contact_person_name = serializers.SerializerMethodField()
    contact_person_role = serializers.CharField(source='contact_person.role', read_only=True)

    class Meta:
        model = DepartmentContact
        fields = ['id', 'department', 'contact_person', 'contact_person_name', 'contact_person_role', 'description', 'is_active']
        read_only_fields = ['id']

    def get_contact_person_name(self, obj):
        return full_name(obj.contact_person) if obj.contact_person else None
