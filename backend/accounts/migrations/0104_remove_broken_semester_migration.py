# No-op: The accounts.Semester table was never created.
# The API uses portal.Semester (migrated via portal/0007).
# This migration is kept as a placeholder to avoid "migration file not found" errors
# if it was previously recorded in django_migrations.

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0103_dashboardpreferences'),
    ]

    operations = []
