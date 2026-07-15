from rest_framework import serializers

from ..models import (
    Announcement, AnnouncementAttachment, AnnouncementComment,
)
from ._base import full_name


class AnnouncementAttachmentSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()
    is_image = serializers.SerializerMethodField()

    class Meta:
        model = AnnouncementAttachment
        fields = ['id', 'filename', 'url', 'is_image', 'file_size_bytes', 'content_type', 'uploaded_at']

    def get_url(self, obj):
        return obj.file or None

    def get_is_image(self, obj):
        return obj.is_image


class AnnouncementCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    author_role = serializers.CharField(source='author.role', read_only=True)

    class Meta:
        model = AnnouncementComment
        fields = ['id', 'announcement', 'author', 'author_name', 'author_role', 'content', 'created_at', 'updated_at']
        read_only_fields = ['id', 'announcement', 'author', 'author_name', 'author_role', 'created_at', 'updated_at']

    def get_author_name(self, obj):
        return full_name(obj.author)


class AnnouncementSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    author_email = serializers.CharField(source='author.email', read_only=True)
    attachment_url = serializers.SerializerMethodField()
    read_count = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    is_read = serializers.SerializerMethodField()
    is_expired = serializers.BooleanField(read_only=True)
    attachments = AnnouncementAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = Announcement
        fields = [
            'id', 'title', 'content', 'category', 'priority', 'status',
            'target_audience', 'target_classrooms', 'author', 'author_name', 'author_email',
            'is_pinned', 'is_public', 'event_date', 'end_date', 'attachment',
            'attachment_url', 'attachments', 'read_by', 'read_count', 'comment_count',
            'is_read', 'is_expired', 'created_at', 'updated_at'
        ]
        read_only_fields = ['author', 'read_count', 'comment_count', 'is_read', 'is_expired', 'attachments']

    def get_author_name(self, obj): return full_name(obj.author)
    def get_attachment_url(self, obj):
        return obj.attachment or None
    def get_read_count(self, obj): return obj.read_by.count()
    def get_comment_count(self, obj):
        if hasattr(obj, 'comment_count_annotated'):
            return obj.comment_count_annotated
        return obj.comments.count()
    def get_is_read(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        if hasattr(obj, '_prefetched_objects_cache') and 'read_by' in obj._prefetched_objects_cache:
            return any(u.id == request.user.id for u in obj.read_by.all())
        return obj.read_by.filter(id=request.user.id).exists()
