"""
Tests for user management: creation, permissions, role-based access.
"""
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from accounts.models import Profile

User = get_user_model()


class UserCreationTestCase(TestCase):
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

    def test_admin_can_create_user(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post('/api/admin/create-user/', {
            'username': '202500000001',
            'password': 'StudentPass123!',
            'role': 'student',
            'first_name': 'John',
            'last_name': 'Doe',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotIn('temporary_password', response.data)

    def test_password_not_in_response(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post('/api/admin/create-user/', {
            'username': '202500000002',
            'password': 'StudentPass123!',
            'role': 'student',
            'first_name': 'Jane',
            'last_name': 'Doe',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotIn('temporary_password', response.data)
        self.assertNotIn('password', response.data)

    def test_student_lrn_must_be_12_digits(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post('/api/admin/create-user/', {
            'username': '123',
            'password': 'StudentPass123!',
            'role': 'student',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_duplicate_username_rejected(self):
        self.client.force_authenticate(user=self.admin)
        self.client.post('/api/admin/create-user/', {
            'username': '202500000003',
            'password': 'StudentPass123!',
            'role': 'student',
        })
        response = self.client.post('/api/admin/create-user/', {
            'username': '202500000003',
            'password': 'StudentPass123!',
            'role': 'student',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_teacher_cannot_create_admin(self):
        self.client.force_authenticate(user=self.teacher)
        response = self.client.post('/api/admin/create-user/', {
            'username': 'admin2',
            'password': 'AdminPass123!',
            'role': 'admin',
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class UserProfileTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser', password='TestPass123!', role='student',
            is_approved=True,
        )
        self.client.force_authenticate(user=self.user)

    def test_profile_requires_auth(self):
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/profile/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_returns_user_data(self):
        response = self.client.get('/api/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')
