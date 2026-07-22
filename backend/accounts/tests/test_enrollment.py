"""
Integration tests for enrollment flow: StudentClassEnrollment CRUD and EnrollmentApplication.
"""
from datetime import date
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model

from accounts.models import (
    Classroom, StudentClassEnrollment, ClassroomSubject, Subject,
)

User = get_user_model()


class EnrollmentCRUDTest(TestCase):
    """Tests for /api/v1/enrollments/ (StudentClassEnrollment)."""

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username='admin_enroll', password='pass', role='admin',
            is_staff=True, is_approved=True,
        )
        self.teacher = User.objects.create_user(
            username='teacher_enroll', password='pass', role='staff',
            staff_title='teacher', is_approved=True,
        )
        self.student = User.objects.create_user(
            username='student_enroll', password='pass', role='student', is_approved=True,
        )
        self.student2 = User.objects.create_user(
            username='student_enroll2', password='pass', role='student', is_approved=True,
        )
        self.classroom = Classroom.objects.create(name='7-A', school_year='2025-2026')
        self.subject = Subject.objects.create(name='English', code='ENG7', grade_level='7')

    def test_admin_can_enroll_student(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post('/api/v1/enrollments/', {
            'student': self.student.id,
            'classroom': self.classroom.id,
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(StudentClassEnrollment.objects.filter(
            student=self.student, classroom=self.classroom,
        ).exists())

    def test_duplicate_enrollment_returns_error(self):
        self.client.force_authenticate(user=self.admin)
        StudentClassEnrollment.objects.create(student=self.student, classroom=self.classroom)
        response = self.client.post('/api/v1/enrollments/', {
            'student': self.student.id,
            'classroom': self.classroom.id,
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_fields_returns_error(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post('/api/v1/enrollments/', {
            'student': self.student.id,
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_student_can_list_own_enrollments(self):
        StudentClassEnrollment.objects.create(student=self.student, classroom=self.classroom)
        self.client.force_authenticate(user=self.student)
        response = self.client.get('/api/v1/enrollments/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_student_cannot_enroll_others(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post('/api/v1/enrollments/', {
            'student': self.student2.id,
            'classroom': self.classroom.id,
        })
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_400_BAD_REQUEST])

    def test_admin_can_delete_enrollment(self):
        self.client.force_authenticate(user=self.admin)
        enrollment = StudentClassEnrollment.objects.create(
            student=self.student, classroom=self.classroom,
        )
        response = self.client.delete(f'/api/v1/enrollments/{enrollment.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(StudentClassEnrollment.objects.filter(id=enrollment.id).exists())

    def test_filter_by_classroom(self):
        self.client.force_authenticate(user=self.admin)
        StudentClassEnrollment.objects.create(student=self.student, classroom=self.classroom)
        response = self.client.get(f'/api/v1/enrollments/?classroom={self.classroom.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_teacher_can_list_enrolled_students(self):
        ClassroomSubject.objects.create(
            classroom=self.classroom, subject=self.subject, teacher=self.teacher,
        )
        StudentClassEnrollment.objects.create(student=self.student, classroom=self.classroom)
        self.client.force_authenticate(user=self.teacher)
        response = self.client.get(f'/api/v1/enrollments/?classroom={self.classroom.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
