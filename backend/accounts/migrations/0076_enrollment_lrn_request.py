from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0075_enrollment_enhancements'),
    ]

    operations = [
        migrations.AddField(
            model_name='enrollmentapplication',
            name='lrn_request_reason',
            field=models.CharField(blank=True, help_text='Reason for not having LRN', max_length=50, null=True),
        ),
    ]
