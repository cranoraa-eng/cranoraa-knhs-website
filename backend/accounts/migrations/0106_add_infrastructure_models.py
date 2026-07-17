"""
Migration: create accounts_auditlog, accounts_apirequestlog, accounts_databasebackup tables.

These models in accounts/models/infrastructure.py had no migration, meaning
their tables did not exist in production. AuditLog uses SET_NULL on User so
it won't block deletion, but writing audit logs would silently fail or crash.
"""

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0105_add_onboardingstatus'),
    ]

    operations = [
        migrations.CreateModel(
            name='AuditLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('action', models.CharField(max_length=50)),
                ('action_type', models.CharField(
                    blank=True,
                    choices=[
                        ('create', 'Create'), ('update', 'Update'), ('delete', 'Delete'),
                        ('login', 'Login'), ('logout', 'Logout'), ('approve', 'Approve'),
                        ('reject', 'Reject'), ('view', 'View'), ('export', 'Export'),
                        ('import', 'Import'), ('grade_create', 'Grade Create'),
                        ('grade_update', 'Grade Update'), ('grade_delete', 'Grade Delete'),
                        ('attendance_mark', 'Attendance Mark'), ('attendance_delete', 'Attendance Delete'),
                        ('mute', 'User Mute'), ('suspend', 'User Suspend'),
                    ],
                    max_length=20,
                    null=True,
                )),
                ('model_name', models.CharField(blank=True, help_text='Name of the model affected', max_length=100, null=True)),
                ('object_id', models.PositiveIntegerField(blank=True, help_text='ID of the object affected', null=True)),
                ('object_repr', models.CharField(blank=True, help_text='String representation of the object', max_length=255)),
                ('description', models.TextField()),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('user_agent', models.TextField(blank=True)),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='audit_logs',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'ordering': ['-timestamp'],
            },
        ),
        migrations.AddIndex(
            model_name='auditlog',
            index=models.Index(fields=['user', 'timestamp'], name='accounts_au_user_id_timestamp_idx'),
        ),
        migrations.AddIndex(
            model_name='auditlog',
            index=models.Index(fields=['action', 'timestamp'], name='accounts_au_action_timestamp_idx'),
        ),
        migrations.AddIndex(
            model_name='auditlog',
            index=models.Index(fields=['model_name', 'timestamp'], name='accounts_au_model_timestamp_idx'),
        ),
        migrations.CreateModel(
            name='APIRequestLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('endpoint', models.CharField(max_length=255)),
                ('method', models.CharField(max_length=10)),
                ('status_code', models.IntegerField()),
                ('response_time_ms', models.FloatField(help_text='Response time in milliseconds')),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='api_requests',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'ordering': ['-timestamp'],
            },
        ),
        migrations.AddIndex(
            model_name='apirequestlog',
            index=models.Index(fields=['timestamp'], name='accounts_ap_timestamp_idx'),
        ),
        migrations.AddIndex(
            model_name='apirequestlog',
            index=models.Index(fields=['endpoint', 'timestamp'], name='accounts_ap_endpoint_timestamp_idx'),
        ),
        migrations.AddIndex(
            model_name='apirequestlog',
            index=models.Index(fields=['user', 'timestamp'], name='accounts_ap_user_timestamp_idx'),
        ),
        migrations.CreateModel(
            name='DatabaseBackup',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('filename', models.CharField(max_length=255)),
                ('size', models.CharField(max_length=50)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('created_by', models.ForeignKey(
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='created_backups',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
