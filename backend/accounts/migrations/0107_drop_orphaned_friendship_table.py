"""
Migration: drop the orphaned accounts_friendship table.
"""
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0106_add_infrastructure_models'),
    ]

    operations = [
        migrations.RunSQL(
            sql="DROP TABLE IF EXISTS accounts_friendship;",
            reverse_sql="",
        ),
    ]
