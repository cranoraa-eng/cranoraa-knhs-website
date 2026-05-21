import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_portal.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.db.models import Count

User = get_user_model()

duplicates = User.objects.values('email').annotate(email_count=Count('email')).filter(email_count__gt=1)
for dup in duplicates:
    email_val = dup['email']
    count = dup['email_count']
    users = User.objects.filter(email=email_val)
    print(f"Duplicate email: '{email_val}' (Found {count} users)")
    for u in users:
        print(f"  - User: {u.username}, ID: {u.id}")

empty_string_users = User.objects.filter(email='')
if empty_string_users.exists():
    print(f"Found {empty_string_users.count()} users with empty string email.")
    for u in empty_string_users:
        print(f"  - {u.username}")
else:
    print("No users with empty string email found.")
