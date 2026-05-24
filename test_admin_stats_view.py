import os
import sys
import django
from django.utils import timezone
from django.test import RequestFactory
from rest_framework.response import Response

# Setup Django
sys.path.append('backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_portal.settings')
django.setup()

from accounts.models import User
from accounts.views import admin_dashboard_stats

def test_admin_stats_view():
    try:
        factory = RequestFactory()
        # Simulate the request exactly as the frontend does
        request = factory.get('/admin/stats/?academic_year=2025-2026')
        
        # Get or create admin
        admin = User.objects.filter(role='admin').first()
        if not admin:
            admin = User.objects.create_superuser('admin_test', 'admin_test@example.com', 'password123')
        
        request.user = admin
        # Mock query_params
        request.query_params = {'academic_year': '2025-2026'}
        
        print(f"Calling admin_dashboard_stats for user: {request.user.username}")
        response = admin_dashboard_stats(request)
        
        print(f"Response status: {response.status_code}")
        if response.status_code != 200:
            print(f"Error data: {response.data}")
        else:
            print("Success! Data keys:", response.data.keys())
            print("Dashboard data:", response.data['dashboard'])
            
    except Exception as e:
        print(f"EXCEPTION: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_admin_stats_view()
