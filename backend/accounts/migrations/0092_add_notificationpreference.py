# Generated manually

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0091_add_default_grading_weights_to_systemsetting'),
    ]

    operations = [
        migrations.CreateModel(
            name='NotificationPreference',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('announcement', models.BooleanField(default=True)),
                ('grade', models.BooleanField(default=True)),
                ('attendance', models.BooleanField(default=True)),
                ('fee', models.BooleanField(default=True)),
                ('message', models.BooleanField(default=True)),
                ('friend_request', models.BooleanField(default=True)),
                ('system', models.BooleanField(default=True)),
                ('push_enabled', models.BooleanField(default=True, help_text='Enable browser push notifications (FCM)')),
                ('in_app_enabled', models.BooleanField(default=True, help_text='Show in-app notification bell')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='notification_preferences', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Notification Preference',
                'verbose_name_plural': 'Notification Preferences',
            },
        ),
    ]
