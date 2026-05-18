import os
import django
import sys

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_portal.settings')
django.setup()

from django.contrib.auth.hashers import make_password

# Generate hashed password for admin123
hashed_password = make_password('admin123')

print("Copy and paste this SQL into Supabase SQL Editor:")
print("=" * 60)
print(f"""
INSERT INTO accounts_user (email, username, password, role, is_staff, is_superuser, is_active, first_name, last_name, date_joined)
VALUES (
    'admin@school.com',
    'admin',
    '{hashed_password}',
    'admin',
    true,
    true,
    true,
    'Admin',
    'User',
    NOW()
);
""")
print("=" * 60)
