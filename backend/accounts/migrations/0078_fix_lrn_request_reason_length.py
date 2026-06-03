from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0077_enrollment_temp_password'),
    ]

    operations = [
        migrations.AlterField(
            model_name='enrollmentapplication',
            name='lrn_request_reason',
            field=models.CharField(
                blank=True,
                max_length=200,
                null=True,
                help_text='Reason for not having LRN',
            ),
        ),
    ]
