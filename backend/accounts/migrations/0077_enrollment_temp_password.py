from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0076_enrollment_lrn_request'),
    ]

    operations = [
        migrations.AddField(
            model_name='enrollmentapplication',
            name='temp_password_display',
            field=models.CharField(blank=True, help_text='Temporary password shown to applicant after enrollment', max_length=100, null=True),
        ),
    ]
