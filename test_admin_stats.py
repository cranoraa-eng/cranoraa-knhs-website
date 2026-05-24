import os
import sys
import django
import datetime
from django.utils import timezone
from django.test import RequestFactory
from rest_framework.response import Response

# Setup Django
sys.path.append('backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_portal.settings')
django.setup()

from accounts.models import User, Attendance, Classroom, Subject, Grade, Announcement, EnrollmentApplication, SystemSetting
from accounts.views import admin_dashboard_stats

def test_stats():
    try:
        factory = RequestFactory()
        request = factory.get('/admin/stats/')
        
        # Get or create admin
        admin = User.objects.filter(role='admin').first()
        if not admin:
            admin = User.objects.create_superuser('admin_test', 'admin_test@example.com', 'password123')
        
        request.user = admin
        print(f"Testing stats for user: {request.user.username} ({request.user.role})")
        
        response = admin_dashboard_stats(request)
        print(f"Response status: {response.status_code}")
        if response.status_code != 200:
            print(f"Error response: {response.data}")
        else:
            print("Stats loaded successfully!")
            # print(response.data)
            
    except Exception as e:
        print(f"FAILED with exception: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_stats()
