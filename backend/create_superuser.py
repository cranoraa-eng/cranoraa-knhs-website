import os
import django
import sys

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_portal.settings')
try:
    django.setup()
except Exception as e:
    print(f"Error setting up Django: {e}")
    sys.exit(1)

from accounts.models import User
from django.db.utils import IntegrityError

def create_superuser():
    email = os.environ.get('DJANGO_SUPERUSER_EMAIL')
    username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
    password = os.environ.get('DJANGO_SUPERUSER_PASSWORD')
    role = 'admin' 

    if not email or not password:
        print("Skipping superuser creation: DJANGO_SUPERUSER_EMAIL or DJANGO_SUPERUSER_PASSWORD not set.")
        return

    try:
        if not User.objects.filter(email=email).exists():
            print(f"Creating superuser for {email}...")
            User.objects.create_superuser(
                email=email,
                username=username,
                password=password,
                role=role
            )
            print("Superuser created successfully.")
        else:
            print(f"Superuser with email {email} already exists.")
    except Exception as e:
        print(f"Could not create superuser: {e}")

if __name__ == "__main__":
    create_superuser()
