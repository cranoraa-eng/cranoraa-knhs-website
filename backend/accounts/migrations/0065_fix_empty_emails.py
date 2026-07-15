"""
Migration 0065: fix_empty_emails

Converts any existing User rows where email='' (empty string) to NULL.
Empty strings collide on the unique constraint when multiple users have no email.
This runs automatically on deploy via `python manage.py migrate`.
"""
from django.db import migrations


def fix_empty_emails(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    User.objects.filter(email='').update(email=None)


def reverse_fix(apps, schema_editor):
    # Reversing is a no-op — we cannot know which NULLs were originally ''
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0064_notification_improvements'),
    ]

    operations = [
        migrations.RunPython(fix_empty_emails, reverse_code=reverse_fix),
    ]
