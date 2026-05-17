import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_portal.settings')
django.setup()

from accounts.models import User

# Create superuser
user = User.objects.create_superuser(
    email='admin@school.com',
    username='admin',
    password='admin123',
    role='admin'
)
print(f"Superuser created: {user.email} / admin / admin123")
