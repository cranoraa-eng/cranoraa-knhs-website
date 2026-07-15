from rest_framework import serializers

from ..models import User, StudentClassEnrollment, Attendance, Grade, SystemSetting
from ._base import full_name


class ParentChildSummarySerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    profile_picture = serializers.CharField(source='profile.profile_picture', read_only=True)
    grade_level = serializers.CharField(source='profile.grade_level', read_only=True)
    classroom_name = serializers.SerializerMethodField()
    adviser_name = serializers.SerializerMethodField()
    attendance_rate = serializers.SerializerMethodField()
    general_average = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'full_name',
            'profile_picture', 'grade_level', 'classroom_name',
            'adviser_name', 'attendance_rate', 'general_average',
        ]

    def get_full_name(self, obj):
        return full_name(obj)

    def get_classroom_name(self, obj):
        enrollment = getattr(obj, '_enrollment_cache', None)
        if enrollment is None:
            enrollment = StudentClassEnrollment.objects.filter(student=obj).select_related('classroom').first()
        return enrollment.classroom.name if enrollment else None

    def get_adviser_name(self, obj):
        enrollment = getattr(obj, '_enrollment_cache', None)
        if enrollment is None:
            enrollment = StudentClassEnrollment.objects.filter(student=obj).select_related('classroom__teacher').first()
        if enrollment and enrollment.classroom.teacher:
            return full_name(enrollment.classroom.teacher)
        return None

    def get_attendance_rate(self, obj):
        from django.utils import timezone
        today = timezone.now().date()
        month_start = today.replace(day=1)
        records = Attendance.objects.filter(student=obj, date__gte=month_start, date__lte=today)
        records = [r for r in records if r.date.weekday() < 5]
        if not records:
            return None
        present = sum(1 for r in records if r.status in ['present', 'late'])
        return round(present / len(records) * 100, 1)

    def get_general_average(self, obj):
        grades = Grade.objects.filter(
            student=obj, grade_type='final_grade', raw_score__isnull=False
        )
        if not grades.exists():
            return None
        total = sum(float(g.raw_score) for g in grades)
        return round(total / grades.count(), 2)
