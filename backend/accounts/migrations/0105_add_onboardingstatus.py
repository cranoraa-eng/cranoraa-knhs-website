"""
Migration: create accounts_onboardingstatus table.

The OnboardingStatus model was added to accounts/models/user.py but never
had a migration generated. The missing table caused a ProgrammingError when
Django tried to cascade-delete a User (500 on DELETE /api/v1/users/<id>/).
"""

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0104_remove_broken_semester_migration'),
    ]

    operations = [
        migrations.CreateModel(
            name='OnboardingStatus',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('completed_tours', models.JSONField(blank=True, default=list, help_text='List of completed tour IDs')),
                ('dismissed_tooltips', models.JSONField(blank=True, default=list, help_text='List of dismissed tooltip IDs')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='onboarding_status',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'verbose_name': 'Onboarding Status',
                'verbose_name_plural': 'Onboarding Statuses',
                'ordering': ['-updated_at'],
            },
        ),
    ]
