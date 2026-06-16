from rest_framework import serializers

from ..models import Department, StaffPerformance
from ._base import full_name


class DepartmentSerializer(serializers.ModelSerializer):
    head_name = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = ['id', 'name', 'code', 'description', 'head', 'head_name',
                  'member_count', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at']

    def get_head_name(self, obj): return full_name(obj.head) if obj.head else None
    def get_member_count(self, obj):
        return 0


class StaffPerformanceSerializer(serializers.ModelSerializer):
    staff_name = serializers.SerializerMethodField()
    evaluated_by_name = serializers.SerializerMethodField()

    class Meta:
        model = StaffPerformance
        fields = ['id', 'staff', 'staff_name', 'academic_year',
                  'evaluated_by', 'evaluated_by_name',
                  'teaching_quality', 'student_engagement', 'classroom_management',
                  'lesson_planning', 'professional_development',
                  'average_student_grade', 'attendance_rate', 'students_passed_pct',
                  'comments', 'overall_rating', 'created_at', 'updated_at']
        read_only_fields = ['overall_rating']

    def get_staff_name(self, obj): return full_name(obj.staff)
    def get_evaluated_by_name(self, obj): return full_name(obj.evaluated_by) if obj.evaluated_by else ''
