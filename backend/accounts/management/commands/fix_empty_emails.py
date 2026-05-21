from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Converts empty string emails to NULL to avoid unique constraint violations'

    def handle(self, *args, **options):
        empty_emails = User.objects.filter(email='')
        count = empty_emails.count()
        if count > 0:
            self.stdout.write(self.style.SUCCESS(f'Found {count} users with empty string emails. Converting to NULL...'))
            empty_emails.update(email=None)
            self.stdout.write(self.style.SUCCESS('Successfully converted empty emails to NULL.'))
        else:
            self.stdout.write(self.style.SUCCESS('No users with empty string emails found.'))
