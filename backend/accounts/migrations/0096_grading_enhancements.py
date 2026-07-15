# Generated manually for Phase 5: Grading Enhancements
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0095_attendance_enhancements'),
    ]

    operations = [
        migrations.AddField(
            model_name='gradereport',
            name='gpa',
            field=models.DecimalField(blank=True, decimal_places=2, help_text='DepEd GPA: 1.0=98-100 ... 5.0=Below 75', max_digits=3, null=True),
        ),
        migrations.AddField(
            model_name='gradereport',
            name='status',
            field=models.CharField(choices=[('draft', 'Draft'), ('submitted', 'Submitted for Review'), ('approved', 'Approved')], default='draft', max_length=20),
        ),
        migrations.AddField(
            model_name='gradereport',
            name='approved_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='approved_grade_reports', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='gradereport',
            name='approved_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
