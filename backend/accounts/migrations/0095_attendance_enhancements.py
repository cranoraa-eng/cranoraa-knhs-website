# Generated manually for Phase 4: Attendance Enhancements
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0094_academic_records'),
    ]

    operations = [
        # Attendance model enhancements
        migrations.AddField(
            model_name='attendance',
            name='arrival_time',
            field=models.TimeField(blank=True, help_text='Actual arrival time (for late tracking)', null=True),
        ),
        migrations.AddField(
            model_name='attendance',
            name='departure_time',
            field=models.TimeField(blank=True, help_text='Actual departure time (for early departure)', null=True),
        ),
        migrations.AddField(
            model_name='attendance',
            name='minutes_late',
            field=models.PositiveIntegerField(default=0, help_text='Minutes late (auto-calculated if arrival_time set)'),
        ),
        migrations.AddField(
            model_name='attendance',
            name='has_excuse',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='attendance',
            name='excuse_verified',
            field=models.BooleanField(default=False, help_text='Set to True once admin/teacher verifies the excuse'),
        ),
        # AbsenceExcuse model
        migrations.CreateModel(
            name='AbsenceExcuse',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('reason', models.TextField()),
                ('document_url', models.URLField(blank=True, help_text='Supabase Storage URL for supporting document', max_length=1000, null=True)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')], default='pending', max_length=20)),
                ('reviewed_at', models.DateTimeField(blank=True, null=True)),
                ('reviewer_notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='absence_excuses', to=settings.AUTH_USER_MODEL)),
                ('attendance', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='excuses', to='accounts.attendance')),
                ('reviewed_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reviewed_excuses', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        # EnrollmentWaitlist model
        migrations.CreateModel(
            name='EnrollmentWaitlist',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('position', models.PositiveIntegerField(default=0)),
                ('status', models.CharField(choices=[('waiting', 'Waiting'), ('offered', 'Offered'), ('accepted', 'Accepted'), ('declined', 'Declined'), ('expired', 'Expired')], default='waiting', max_length=20)),
                ('offered_at', models.DateTimeField(blank=True, null=True)),
                ('response_deadline', models.DateTimeField(blank=True, null=True)),
                ('notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('classroom', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='waitlist', to='accounts.classroom')),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='enrollment_waitlists', to=settings.AUTH_USER_MODEL)),
                ('application', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='waitlist_entries', to='accounts.enrollmentapplication')),
            ],
            options={
                'ordering': ['position'],
                'unique_together': {('classroom', 'student')},
            },
        ),
    ]
