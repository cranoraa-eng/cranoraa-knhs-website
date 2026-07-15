# Generated migration for Schedule / Timetable system

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0061_reportedmessage_message_content_snapshot_and_more'),
        ('portal', '0006_academicyear_is_archived_alter_auditlog_action_type_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='Room',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(help_text='e.g. Room 204, Science Lab, Gym', max_length=100)),
                ('building', models.CharField(blank=True, max_length=100, null=True)),
                ('capacity', models.IntegerField(default=40)),
                ('room_type', models.CharField(
                    choices=[
                        ('classroom', 'Classroom'),
                        ('laboratory', 'Laboratory'),
                        ('gym', 'Gymnasium'),
                        ('library', 'Library'),
                        ('other', 'Other'),
                    ],
                    default='classroom',
                    max_length=30,
                )),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={'ordering': ['name']},
        ),
        migrations.CreateModel(
            name='TimeSlot',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('day', models.CharField(
                    choices=[
                        ('monday', 'Monday'),
                        ('tuesday', 'Tuesday'),
                        ('wednesday', 'Wednesday'),
                        ('thursday', 'Thursday'),
                        ('friday', 'Friday'),
                        ('saturday', 'Saturday'),
                    ],
                    max_length=10,
                )),
                ('start_time', models.TimeField()),
                ('end_time', models.TimeField()),
                ('label', models.CharField(blank=True, help_text="Optional label, e.g. '1st Period'", max_length=50, null=True)),
            ],
            options={'ordering': ['day', 'start_time']},
        ),
        migrations.AlterUniqueTogether(
            name='timeslot',
            unique_together={('day', 'start_time', 'end_time')},
        ),
        migrations.CreateModel(
            name='Schedule',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('is_active', models.BooleanField(default=True)),
                ('notes', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('academic_year', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='schedules',
                    to='portal.academicyear',
                )),
                ('classroom', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='schedules',
                    to='accounts.classroom',
                )),
                ('room', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='schedules',
                    to='accounts.room',
                )),
                ('semester', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='schedules',
                    to='portal.semester',
                )),
                ('subject', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='schedules',
                    to='accounts.subject',
                )),
                ('teacher', models.ForeignKey(
                    limit_choices_to={'role': 'teacher'},
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='teaching_schedules',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('time_slot', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='schedules',
                    to='accounts.timeslot',
                )),
            ],
            options={'ordering': ['time_slot__day', 'time_slot__start_time']},
        ),
        migrations.AddConstraint(
            model_name='schedule',
            constraint=models.UniqueConstraint(
                fields=['teacher', 'time_slot', 'academic_year'],
                name='unique_teacher_timeslot_year',
            ),
        ),
        migrations.AddConstraint(
            model_name='schedule',
            constraint=models.UniqueConstraint(
                condition=models.Q(room__isnull=False),
                fields=['room', 'time_slot', 'academic_year'],
                name='unique_room_timeslot_year',
            ),
        ),
        migrations.AddConstraint(
            model_name='schedule',
            constraint=models.UniqueConstraint(
                fields=['classroom', 'time_slot', 'academic_year'],
                name='unique_classroom_timeslot_year',
            ),
        ),
    ]
