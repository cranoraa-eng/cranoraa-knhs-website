from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0085_convert_teacher_roles'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='additional_roles',
            field=models.TextField(blank=True, default='', help_text='Comma-separated additional staff titles e.g. teacher,guidance_counselor'),
        ),
    ]
