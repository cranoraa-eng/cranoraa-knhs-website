# Generated manually for Phase 6: Parent Enhancements
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0096_grading_enhancements'),
    ]

    operations = [
        # ParentTeacherMeeting
        migrations.CreateModel(
            name='ParentTeacherMeeting',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('scheduled_date', models.DateField()),
                ('scheduled_time', models.TimeField()),
                ('duration_minutes', models.PositiveIntegerField(default=30)),
                ('purpose', models.CharField(choices=[('academic', 'Academic Performance'), ('behavioral', 'Behavioral Concern'), ('general', 'General Conference'), ('progress', 'Progress Review')], default='general', max_length=20)),
                ('status', models.CharField(choices=[('scheduled', 'Scheduled'), ('completed', 'Completed'), ('cancelled', 'Cancelled'), ('rescheduled', 'Rescheduled')], default='scheduled', max_length=20)),
                ('notes', models.TextField(blank=True, help_text='Meeting notes / minutes')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('teacher', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='ptm_as_teacher', to=settings.AUTH_USER_MODEL)),
                ('parent', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='ptm_as_parent', to=settings.AUTH_USER_MODEL)),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='ptm_meetings', to=settings.AUTH_USER_MODEL)),
                ('classroom', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='ptm_meetings', to='accounts.classroom')),
            ],
            options={
                'ordering': ['-scheduled_date', '-scheduled_time'],
            },
        ),
        # BehavioralRecord
        migrations.CreateModel(
            name='BehavioralRecord',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('incident_type', models.CharField(choices=[('tardiness', 'Tardiness'), ('absence', 'Unexcused Absence'), ('uniform', 'Uniform Violation'), ('disrespect', 'Disrespect'), ('fighting', 'Fighting'), ('cheating', 'Academic Dishonesty'), ('bullying', 'Bullying'), ('vandalism', 'Vandalism'), ('disruption', 'Class Disruption'), ('other', 'Other')], max_length=20)),
                ('severity', models.CharField(choices=[('minor', 'Minor'), ('moderate', 'Moderate'), ('major', 'Major'), ('critical', 'Critical')], default='minor', max_length=20)),
                ('action_taken', models.CharField(choices=[('verbal_warning', 'Verbal Warning'), ('written_warning', 'Written Warning'), ('counseling', 'Counseling Session'), ('detention', 'Detention'), ('suspension', 'Suspension'), ('parent_meeting', 'Parent Conference'), ('other', 'Other')], default='verbal_warning', max_length=20)),
                ('description', models.TextField(help_text='Detailed description of the incident')),
                ('incident_date', models.DateField()),
                ('parent_notified', models.BooleanField(default=False)),
                ('parent_notified_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='behavioral_records', to=settings.AUTH_USER_MODEL)),
                ('classroom', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='behavioral_records', to='accounts.classroom')),
                ('recorded_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='behavioral_records_created', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-incident_date'],
            },
        ),
        # SchoolEvent
        migrations.CreateModel(
            name='SchoolEvent',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True)),
                ('category', models.CharField(choices=[('academic', 'Academic'), ('sports', 'Sports'), ('cultural', 'Cultural'), ('holiday', 'Holiday'), ('meeting', 'Meeting'), ('exam', 'Examination'), ('enrollment', 'Enrollment'), ('other', 'Other')], default='academic', max_length=20)),
                ('target_audience', models.CharField(choices=[('all', 'All'), ('students', 'Students'), ('parents', 'Parents'), ('teachers', 'Teachers'), ('staff', 'Staff')], default='all', max_length=20)),
                ('start_date', models.DateField()),
                ('start_time', models.TimeField(blank=True, null=True)),
                ('end_date', models.DateField(blank=True, null=True)),
                ('end_time', models.TimeField(blank=True, null=True)),
                ('is_all_day', models.BooleanField(default=False)),
                ('location', models.CharField(blank=True, max_length=200)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_events', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['start_date', 'start_time'],
            },
        ),
    ]
