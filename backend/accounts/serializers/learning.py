from rest_framework import serializers

from ..models import LearningMaterial
from ._base import full_name


class LearningMaterialSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.SerializerMethodField()
    classroom_name = serializers.CharField(source='classroom.name', read_only=True)

    class Meta:
        model = LearningMaterial
        fields = ['id', 'title', 'description', 'material_type', 'classroom',
                  'classroom_name', 'uploaded_by', 'uploaded_by_name', 'file',
                  'original_filename', 'file_size_bytes',
                  'quarter', 'week', 'created_at', 'updated_at']
        read_only_fields = ['uploaded_by', 'file', 'original_filename', 'file_size_bytes']

    def get_uploaded_by_name(self, obj): return full_name(obj.uploaded_by)
