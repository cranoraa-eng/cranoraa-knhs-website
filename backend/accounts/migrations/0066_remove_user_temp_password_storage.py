"""
Migration: remove temp_password_storage from User model.

The field stored temporary passwords in plaintext — a security risk.
Temporary passwords are now shown to the admin once at creation time
and never persisted to the database.
"""
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0065_fix_empty_emails'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='user',
            name='temp_password_storage',
        ),
    ]
