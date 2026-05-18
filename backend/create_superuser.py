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
    # Existing superuser logic
    email = os.environ.get('DJANGO_SUPERUSER_EMAIL')
    username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
    password = os.environ.get('DJANGO_SUPERUSER_PASSWORD')
    role = 'admin' 

    if email and password:
        try:
            user = User.objects.filter(email=email).first()
            if not user:
                print(f"Creating superuser for {email}...")
                User.objects.create_superuser(
                    email=email,
                    username=username,
                    password=password,
                    role=role,
                    is_verified=True,
                    is_approved=True
                )
                print("Superuser created successfully.")
            else:
                print(f"Superuser with email {email} already exists. Ensuring it is verified and approved...")
                user.is_verified = True
                user.is_approved = True
                user.is_staff = True
                user.is_superuser = True
                user.save()
                print("Superuser status updated.")
        except Exception as e:
            print(f"Could not create superuser: {e}")
    else:
        print("Skipping superuser creation: DJANGO_SUPERUSER_EMAIL or DJANGO_SUPERUSER_PASSWORD not set.")

    # New logic: Verify specific user for testing/emergencies
    verify_email = os.environ.get('VERIFY_USER_EMAIL')
    if verify_email:
        try:
            user = User.objects.filter(email=verify_email).first()
            if user:
                print(f"Manually verifying user: {verify_email}")
                user.is_verified = True
                user.is_approved = True
                user.save()
                print(f"User {verify_email} is now verified and approved.")
            else:
                print(f"User {verify_email} not found for manual verification.")
        except Exception as e:
            print(f"Error during manual verification: {e}")

if __name__ == "__main__":
    create_superuser()
