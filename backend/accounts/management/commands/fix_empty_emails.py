"""
Management command: fix_empty_emails

Converts any existing User rows where email='' (empty string) to NULL.
Empty strings violate the unique constraint when more than one user has no email.
Run once after deploying this fix:

    python manage.py fix_empty_emails
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = "Convert empty-string emails to NULL to fix unique constraint violations"

    def handle(self, *args, **options):
        qs = User.objects.filter(email='')
        count = qs.count()
        if count == 0:
            self.stdout.write(self.style.SUCCESS("No empty-string emails found. Nothing to do."))
            return

        # Use update() to bypass any signal/save overhead
        updated = qs.update(email=None)
        self.stdout.write(
            self.style.SUCCESS(
                f"Fixed {updated} user(s): converted email='' to NULL."
            )
        )
