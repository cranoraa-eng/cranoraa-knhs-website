from rest_framework import serializers

from ..models import Assignment, Submission
from ._base import full_name


class AssignmentSerializer(serializers.ModelSerializer):
    teacher_name = serializers.ReadOnlyField(source='teacher.get_full_name')
    subject_name = serializers.ReadOnlyField(source='subject.name')
    classroom_name = serializers.ReadOnlyField(source='classroom.name')
    submission_count = serializers.IntegerField(read_only=True)
    is_visible_to_students = serializers.BooleanField(read_only=True)

    class Meta:
        model = Assignment
        fields = ['id', 'title', 'description', 'classroom', 'classroom_name', 'subject', 'subject_name',
                  'teacher', 'teacher_name', 'assignment_type', 'points', 'percentage_weight',
                  'file', 'original_filename', 'file_size_bytes',
                  'due_date', 'is_published', 'publish_at',
                  'allow_late_submissions', 'max_late_submissions', 'grade_component',
                  'is_template', 'template_name',
                  'submission_count', 'is_visible_to_students', 'created_at', 'updated_at']
        read_only_fields = ['file', 'original_filename', 'file_size_bytes']


class SubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='student.get_full_name')
    assignment_title = serializers.ReadOnlyField(source='assignment.title')
    graded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Submission
        fields = ['id', 'assignment', 'assignment_title', 'student', 'student_name',
                  'file', 'original_filename', 'file_size_bytes',
                  'submitted_at', 'grade', 'feedback', 'is_late',
                  'graded_at', 'graded_by', 'graded_by_name']
        read_only_fields = ['file', 'original_filename', 'file_size_bytes']

    def get_graded_by_name(self, obj):
        return full_name(obj.graded_by) if obj.graded_by else None
