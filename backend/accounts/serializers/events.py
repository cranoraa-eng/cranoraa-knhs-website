from rest_framework import serializers

from ..models import SchoolEvent, WebsiteContent
from ._base import full_name


class SchoolEventSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = SchoolEvent
        fields = ['id', 'title', 'description', 'category', 'target_audience',
                  'start_date', 'start_time', 'end_date', 'end_time', 'is_all_day',
                  'location', 'created_by', 'created_by_name',
                  'created_at', 'updated_at']
        read_only_fields = ['created_by']

    def get_created_by_name(self, obj): return full_name(obj.created_by) if obj.created_by else ''


class WebsiteContentSerializer(serializers.ModelSerializer):
    section_display = serializers.CharField(source='get_section_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    updated_by_name = serializers.SerializerMethodField()
    image = serializers.URLField(required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = WebsiteContent
        fields = ['id', 'section', 'section_display', 'category', 'category_display',
                  'content', 'image', 'updated_at', 'updated_by', 'updated_by_name']
        read_only_fields = ['section', 'category', 'updated_at', 'updated_by']

    def get_updated_by_name(self, obj):
        return full_name(obj.updated_by) if obj.updated_by else ''
