import hashlib
import base64
import os
import secrets

# Django PBKDF2 parameters
algorithm = 'pbkdf2_sha256'
iterations = 150000
password = 'admin123'
salt = base64.b64encode(os.urandom(16)).decode('ascii')

# Generate hash
dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('ascii'), iterations)
hash_b64 = base64.b64encode(dk).decode('ascii')

# Django format
django_hash = f"pbkdf2_sha256${iterations}${salt}${hash_b64}"

print("Copy this SQL into Supabase SQL Editor:")
print("=" * 60)
print(f"""
INSERT INTO accounts_user (email, username, password, role, is_staff, is_superuser, is_active, first_name, last_name, date_joined)
VALUES (
    'admin@school.com',
    'admin',
    '{django_hash}',
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
