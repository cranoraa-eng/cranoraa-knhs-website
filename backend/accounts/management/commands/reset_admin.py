from django.core.management.base import BaseCommand
from accounts.models import User
import os

class Command(BaseCommand):
    help = 'Resets the admin password or creates a new admin if none exists'

    def add_arguments(self, parser):
        parser.add_argument('--username', type=str, default='admin', help='Admin username')
        parser.add_argument('--password', type=str, help='New password for the admin')
        parser.add_argument('--email', type=str, default='admin@kiwalan-nhs.edu.ph', help='Admin email')

    def handle(self, *args, **options):
        username = options['username']
        password = options['password'] or os.environ.get('DJANGO_SUPERUSER_PASSWORD')
        email = options['email'] or os.environ.get('DJANGO_SUPERUSER_EMAIL') or 'admin@kiwalan-nhs.edu.ph'

        if not password:
            self.stdout.write(self.style.ERROR('Error: You must provide a password via --password or set DJANGO_SUPERUSER_PASSWORD env var.'))
            return

        user = User.objects.filter(username=username).first()
        if user:
            user.set_password(password)
            user.role = 'admin'
            user.is_staff = True
            user.is_superuser = True
            user.is_approved = True
            user.is_verified = True
            user.account_status = 'active'
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Successfully updated password for user "{username}".'))
        else:
            User.objects.create_superuser(
                username=username,
                email=email,
                password=password,
                role='admin',
                is_approved=True,
                is_verified=True,
                account_status='active'
            )
            self.stdout.write(self.style.SUCCESS(f'Successfully created new superuser "{username}".'))
