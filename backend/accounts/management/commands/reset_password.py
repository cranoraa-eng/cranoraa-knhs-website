from django.core.management.base import BaseCommand
from accounts.models import User


class Command(BaseCommand):
    help = 'Reset a user password by email or username, and clear any Axes lockouts'

    def add_arguments(self, parser):
        parser.add_argument('identifier', help='Email or username')
        parser.add_argument('password', help='New password')

    def handle(self, *args, **options):
        identifier = options['identifier']
        password = options['password']

        try:
            user = User.objects.get(email=identifier)
        except User.DoesNotExist:
            try:
                user = User.objects.get(username=identifier)
            except User.DoesNotExist:
                self.stderr.write(self.style.ERROR(f'User not found: {identifier}'))
                return

        user.set_password(password)
        user.account_status = 'active'
        user.is_active = True
        user.is_approved = True
        user.must_change_password = False
        user.save()

        try:
            from axes.models import AccessAttempt
            deleted, _ = AccessAttempt.objects.filter(
                username__iexact=user.username
            ).delete()
            self.stdout.write(f'Cleared {deleted} Axes lockout record(s)')
        except Exception:
            self.stdout.write('Axes not installed or no lockouts to clear')

        try:
            from axes.models import AccessLog
            AccessLog.objects.filter(username__iexact=user.username).delete()
        except Exception:
            pass

        self.stdout.write(self.style.SUCCESS(f'Password reset for {user.email} (role={user.role})'))
