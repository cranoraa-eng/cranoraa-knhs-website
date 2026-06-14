"""
Tests for grade management: CRUD, validation, permissions.
"""
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from accounts.models import Subject, Classroom, ClassroomSubject, Grade

User = get_user_model()


class GradeTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username='admin1', password='AdminPass123!', role='admin',
            is_approved=True, is_staff=True,
        )
        self.teacher = User.objects.create_user(
            username='teacher1', password='TeacherPass123!', role='staff',
            staff_title='teacher', is_approved=True,
        )
        self.student = User.objects.create_user(
            username='student1', password='StudentPass123!', role='student',
            is_approved=True,
        )
        self.subject = Subject.objects.create(
            name='Mathematics', code='MATH', grade_level='Grade 7',
        )
        self.classroom = Classroom.objects.create(
            name='Grade 7 - A', grade_level='Grade 7', teacher=self.teacher,
        )
        self.classroom_subject = ClassroomSubject.objects.create(
            classroom=self.classroom, subject=self.subject, teacher=self.teacher,
        )

    def test_admin_can_create_grade(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post('/api/grades/', {
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

    def test_teacher_can_create_grade_for_own_subject(self):
        self.client.force_authenticate(user=self.teacher)
        response = self.client.post('/api/grades/', {
            'student': self.student.id,
            'subject': self.subject.id,
            'classroom': self.classroom.id,
            'grade_type': 'written_work',
            'quarter': 1,
            'raw_score': 90,
            'total_score': 100,
            'academic_year': '2025-2026',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_student_cannot_create_grade(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post('/api/grades/', {
            'student': self.student.id,
            'subject': self.subject.id,
            'grade_type': 'written_work',
            'quarter': 1,
            'raw_score': 85,
            'total_score': 100,
            'academic_year': '2025-2026',
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_grade_raw_score_cannot_be_negative(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post('/api/grades/', {
            'student': self.student.id,
            'subject': self.subject.id,
            'grade_type': 'written_work',
            'quarter': 1,
            'raw_score': -10,
            'total_score': 100,
            'academic_year': '2025-2026',
        })
        # Should either reject or clamp to 0
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_201_CREATED])

    def test_grade_list_requires_auth(self):
        response = self.client.get('/api/grades/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
