import os
import django
import sys

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_portal.settings')
django.setup()

from accounts.models import User
from django.db.utils import IntegrityError

def create_superuser():
    email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@example.com')
    username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
    password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'adminpassword123')
    role = 'admin' # Default role for superuser in this project

    if not email or not password:
        print("Error: DJANGO_SUPERUSER_EMAIL and DJANGO_SUPERUSER_PASSWORD must be set.")
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
    except IntegrityError as e:
        print(f"Error creating superuser: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    create_superuser()
