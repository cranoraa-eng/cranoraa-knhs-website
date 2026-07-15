from rest_framework import serializers

from ..models import ScratchCard, Fee
from ._base import full_name


class ScratchCardSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    student_email = serializers.CharField(source='student.email', read_only=True)

    class Meta:
        model = ScratchCard
        fields = ['id', 'serial_number', 'student', 'student_name',
                  'student_email', 'is_used', 'used_at', 'created_at']

    def get_student_name(self, obj): return full_name(obj.student)


class FeeSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    student_email = serializers.CharField(source='student.email', read_only=True)
    balance = serializers.ReadOnlyField()

    class Meta:
        model = Fee
        fields = ['id', 'student', 'student_name', 'student_email', 'fee_type',
                  'amount', 'amount_paid', 'status', 'balance', 'due_date',
                  'paid_date', 'description', 'created_at', 'updated_at']

    def get_student_name(self, obj): return full_name(obj.student)
