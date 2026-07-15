"""
Tests for authentication flows: login, logout, token refresh, password change.
"""
from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model

User = get_user_model()


class LoginTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='teststudent',
            password='TestPass123!',
            role='student',
            is_approved=True,
            is_verified=True,
        )

    def test_login_success(self):
        response = self.client.post('/api/login/', {
            'email': 'teststudent',
            'password': 'TestPass123!',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('user', response.data)

    def test_login_wrong_password(self):
        response = self.client.post('/api/login/', {
            'email': 'teststudent',
            'password': 'wrongpassword',
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('error', response.data)

    def test_login_missing_fields(self):
        response = self.client.post('/api/login/', {
            'email': 'teststudent',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_inactive_account(self):
        self.user.account_status = 'inactive'
        self.user.save()
        response = self.client.post('/api/login/', {
            'email': 'teststudent',
            'password': 'TestPass123!',
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_unapproved_account(self):
        self.user.is_approved = False
        self.user.save()
        response = self.client.post('/api/login/', {
            'email': 'teststudent',
            'password': 'TestPass123!',
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_role_mismatch(self):
        response = self.client.post('/api/login/', {
            'email': 'teststudent',
            'password': 'TestPass123!',
            'role': 'admin',
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class LogoutTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='teststudent',
            password='TestPass123!',
            role='student',
            is_approved=True,
        )

    def test_logout_success(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/logout/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class HealthCheckTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_health_check(self):
        response = self.client.get('/api/health/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'healthy')
        self.assertEqual(response.data['database'], 'ok')


class PasswordChangeTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='teststudent',
            password='TestPass123!',
            role='student',
            is_approved=True,
        )
        self.client.force_authenticate(user=self.user)

    def test_change_password_success(self):
        response = self.client.post('/api/auth/change-password/', {
            'current_password': 'TestPass123!',
            'new_password': 'NewTestPass456!',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_change_password_wrong_current(self):
        response = self.client.post('/api/auth/change-password/', {
            'current_password': 'wrongpassword',
            'new_password': 'NewTestPass456!',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_change_password_missing_fields(self):
        response = self.client.post('/api/auth/change-password/', {
            'current_password': 'TestPass123!',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
