from rest_framework import serializers

from ..models import ParentTeacherMeeting, BehavioralRecord
from ._base import full_name


class ParentTeacherMeetingSerializer(serializers.ModelSerializer):
    teacher_name = serializers.SerializerMethodField()
    parent_name = serializers.SerializerMethodField()
    student_name = serializers.SerializerMethodField()
    classroom_name = serializers.CharField(source='classroom.name', read_only=True)

    class Meta:
        model = ParentTeacherMeeting
        fields = ['id', 'teacher', 'teacher_name', 'parent', 'parent_name',
                  'student', 'student_name', 'classroom', 'classroom_name',
                  'scheduled_date', 'scheduled_time', 'duration_minutes',
                  'purpose', 'status', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['status']

    def get_teacher_name(self, obj): return full_name(obj.teacher)
    def get_parent_name(self, obj): return full_name(obj.parent)
    def get_student_name(self, obj): return full_name(obj.student)


class BehavioralRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    recorded_by_name = serializers.SerializerMethodField()
    classroom_name = serializers.CharField(source='classroom.name', read_only=True)
    incident_display = serializers.CharField(source='get_incident_type_display', read_only=True)
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    action_display = serializers.CharField(source='get_action_taken_display', read_only=True)

    class Meta:
        model = BehavioralRecord
        fields = ['id', 'student', 'student_name', 'classroom', 'classroom_name',
                  'recorded_by', 'recorded_by_name',
                  'incident_type', 'incident_display', 'severity', 'severity_display',
                  'action_taken', 'action_display', 'description', 'incident_date',
                  'parent_notified', 'parent_notified_at',
                  'created_at', 'updated_at']
        read_only_fields = ['recorded_by', 'parent_notified', 'parent_notified_at']

    def get_student_name(self, obj): return full_name(obj.student)
    def get_recorded_by_name(self, obj): return full_name(obj.recorded_by)
