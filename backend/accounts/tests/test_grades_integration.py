"""
Integration tests for grading flow: Grade CRUD, upsert, permissions.
"""
from decimal import Decimal
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model

from accounts.models import (
    Grade, Classroom, Subject, ClassroomSubject,
)

User = get_user_model()


class GradeCRUDTest(TestCase):
    """Tests for /api/v1/grades/ (GradeViewSet)."""

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username='admin_grade', password='pass', role='admin',
            is_staff=True, is_approved=True,
        )
        self.teacher = User.objects.create_user(
            username='teacher_grade', password='pass', role='staff',
            staff_title='teacher', is_approved=True,
        )
        self.student = User.objects.create_user(
            username='student_grade', password='pass', role='student', is_approved=True,
        )
        self.other_teacher = User.objects.create_user(
            username='teacher_grade2', password='pass', role='staff',
            staff_title='teacher', is_approved=True,
        )
        self.classroom = Classroom.objects.create(name='10-A', school_year='2025-2026')
        self.subject = Subject.objects.create(name='Math', code='MATH10', grade_level='10')
        ClassroomSubject.objects.create(
            classroom=self.classroom, subject=self.subject, teacher=self.teacher,
        )

    def test_admin_can_create_grade(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post('/api/v1/grades/', {
            'student': self.student.id,
            'subject': self.subject.id,
            'classroom': self.classroom.id,
            'grade_type': 'written_work',
            'quarter': 1,
            'raw_score': 85,
            'total_score': 100,
            'academic_year': '2025-2026',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Grade.objects.count(), 1)

    def test_teacher_can_create_grade_for_own_subject(self):
        self.client.force_authenticate(user=self.teacher)
        response = self.client.post('/api/v1/grades/', {
            'student': self.student.id,
            'subject': self.subject.id,
            'classroom': self.classroom.id,
            'grade_type': 'performance_task',
            'quarter': 1,
            'raw_score': 90,
            'total_score': 100,
            'academic_year': '2025-2026',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_student_cannot_create_grade(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post('/api/v1/grades/', {
            'student': self.student.id,
            'subject': self.subject.id,
            'classroom': self.classroom.id,
            'grade_type': 'written_work',
            'quarter': 1,
            'raw_score': 85,
            'total_score': 100,
            'academic_year': '2025-2026',
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_upsert_updates_existing_grade(self):
        self.client.force_authenticate(user=self.admin)
        Grade.objects.create(
            student=self.student, subject=self.subject, classroom=self.classroom,
            teacher=self.admin, grade_type='written_work', quarter=1,
            raw_score=Decimal('80'), total_score=Decimal('100'),
            academic_year='2025-2026',
        )
        response = self.client.post('/api/v1/grades/', {
            'student': self.student.id,
            'subject': self.subject.id,
            'classroom': self.classroom.id,
            'grade_type': 'written_work',
            'quarter': 1,
            'raw_score': 95,
            'total_score': 100,
            'academic_year': '2025-2026',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        grade = Grade.objects.get(
            student=self.student, subject=self.subject,
            grade_type='written_work', quarter=1, academic_year='2025-2026',
        )
        self.assertEqual(grade.raw_score, Decimal('95'))

    def test_student_can_read_own_grades(self):
        Grade.objects.create(
            student=self.student, subject=self.subject, classroom=self.classroom,
            teacher=self.admin, grade_type='written_work', quarter=1,
            raw_score=Decimal('85'), total_score=Decimal('100'),
            academic_year='2025-2026',
        )
        self.client.force_authenticate(user=self.student)
        response = self.client.get('/api/v1/grades/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_admin_can_list_all_grades(self):
        Grade.objects.create(
            student=self.student, subject=self.subject, classroom=self.classroom,
            teacher=self.admin, grade_type='written_work', quarter=1,
            raw_score=Decimal('85'), total_score=Decimal('100'),
            academic_year='2025-2026',
        )
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/v1/grades/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_filter_by_quarter(self):
        Grade.objects.create(
            student=self.student, subject=self.subject, classroom=self.classroom,
            teacher=self.admin, grade_type='written_work', quarter=1,
            raw_score=Decimal('85'), total_score=Decimal('100'),
            academic_year='2025-2026',
        )
        Grade.objects.create(
            student=self.student, subject=self.subject, classroom=self.classroom,
            teacher=self.admin, grade_type='written_work', quarter=2,
            raw_score=Decimal('90'), total_score=Decimal('100'),
            academic_year='2025-2026',
        )
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/v1/grades/?quarter=1')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_delete_grade(self):
        self.client.force_authenticate(user=self.admin)
        grade = Grade.objects.create(
            student=self.student, subject=self.subject, classroom=self.classroom,
            teacher=self.admin, grade_type='written_work', quarter=1,
            raw_score=Decimal('85'), total_score=Decimal('100'),
            academic_year='2025-2026',
        )
        response = self.client.delete(f'/api/v1/grades/{grade.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Grade.objects.filter(id=grade.id).exists())

    def test_teacher_cannot_delete_other_teacher_grade(self):
        grade = Grade.objects.create(
            student=self.student, subject=self.subject, classroom=self.classroom,
            teacher=self.admin, grade_type='written_work', quarter=1,
            raw_score=Decimal('85'), total_score=Decimal('100'),
            academic_year='2025-2026',
        )
        self.client.force_authenticate(user=self.other_teacher)
        response = self.client.delete(f'/api/v1/grades/{grade.id}/')
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])
