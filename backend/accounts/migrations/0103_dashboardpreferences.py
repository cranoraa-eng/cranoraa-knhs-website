# Generated manually for task 18.3: Create DashboardPreferences Django model

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0102_remove_onboardingstate'),
    ]

    operations = [
        migrations.CreateModel(
            name='DashboardPreferences',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('layout', models.JSONField(blank=True, default=list, help_text='Widget positions and configuration')),
                ('theme', models.CharField(
                    choices=[('light', 'Light'), ('dark', 'Dark'), ('auto', 'Auto')],
                    default='light',
                    max_length=10
                )),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='dashboard_preferences',
                    to=settings.AUTH_USER_MODEL
                )),
            ],
            options={
                'verbose_name': 'Dashboard Preference',
                'verbose_name_plural': 'Dashboard Preferences',
                'ordering': ['-updated_at'],
            },
        ),
    ]
