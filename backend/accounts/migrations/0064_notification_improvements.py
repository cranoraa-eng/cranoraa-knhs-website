from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0063_fcmtoken'),
    ]

    operations = [
        # Add 'message' to notification_type choices
        migrations.AlterField(
            model_name='notification',
            name='notification_type',
            field=models.CharField(
                choices=[
                    ('announcement', 'Announcement'),
                    ('grade', 'Grade Update'),
                    ('attendance', 'Attendance'),
                    ('fee', 'Fee Reminder'),
                    ('message', 'Message'),
                    ('system', 'System'),
                ],
                default='system',
                max_length=20,
            ),
        ),
        # Change link from URLField to CharField to support relative paths
        migrations.AlterField(
            model_name='notification',
            name='link',
            field=models.CharField(
                blank=True,
                help_text='Relative or absolute URL to redirect user when clicked',
                max_length=500,
                null=True,
            ),
        ),
    ]
