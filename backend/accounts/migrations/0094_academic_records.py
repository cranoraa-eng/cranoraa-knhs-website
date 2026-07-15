# Generated manually

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0093_enhance_assignment_submission'),
    ]

    operations = [
        # Transcript
        migrations.CreateModel(
            name='Transcript',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('school_year', models.CharField(max_length=20)),
                ('general_average', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('total_subjects', models.IntegerField(default=0)),
                ('passed_subjects', models.IntegerField(default=0)),
                ('failed_subjects', models.IntegerField(default=0)),
                ('status', models.CharField(choices=[('draft', 'Draft'), ('final', 'Final'), ('archived', 'Archived')], default='draft', max_length=10)),
                ('remarks', models.TextField(blank=True, null=True)),
                ('pdf_url', models.URLField(blank=True, max_length=1000, null=True)),
                ('generated_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('generated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='generated_transcripts', to=settings.AUTH_USER_MODEL)),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='transcripts', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-school_year', 'student__username'],
                'unique_together': {('student', 'school_year')},
            },
        ),
        # TranscriptLineItem
        migrations.CreateModel(
            name='TranscriptLineItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('q1', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('q2', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('q3', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('q4', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('final_average', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('remarks', models.CharField(blank=True, max_length=50)),
                ('subject', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='accounts.subject')),
                ('transcript', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='accounts.transcript')),
            ],
            options={
                'ordering': ['subject__name'],
                'unique_together': {('transcript', 'subject')},
            },
        ),
        # TransferCertificate
        migrations.CreateModel(
            name='TransferCertificate',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('reference_number', models.CharField(max_length=30, unique=True)),
                ('school_year_from', models.CharField(help_text='School year student is transferring from', max_length=20)),
                ('school_year_to', models.CharField(blank=True, help_text='School year student is transferring to', max_length=20)),
                ('destination_school', models.CharField(blank=True, help_text='School the student is transferring to', max_length=200)),
                ('last_grade_completed', models.CharField(blank=True, max_length=20)),
                ('last_school_attended', models.CharField(blank=True, default='Kiwalan National High School', max_length=200)),
                ('general_average', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('date_of_birth', models.DateField(blank=True, null=True)),
                ('place_of_birth', models.CharField(blank=True, max_length=200)),
                ('nationality', models.CharField(blank=True, default='Filipino', max_length=100)),
                ('status', models.CharField(choices=[('requested', 'Requested'), ('processing', 'Processing'), ('ready', 'Ready for Pickup'), ('released', 'Released'), ('cancelled', 'Cancelled')], default='requested', max_length=15)),
                ('reason', models.TextField(blank=True, help_text='Reason for transfer')),
                ('remarks', models.TextField(blank=True)),
                ('issued_at', models.DateTimeField(blank=True, null=True)),
                ('pdf_url', models.URLField(blank=True, max_length=1000, null=True)),
                ('requested_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('issued_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='issued_tcs', to=settings.AUTH_USER_MODEL)),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='transfer_certificates', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-requested_at'],
            },
        ),
        # CharacterCertificate
        migrations.CreateModel(
            name='CharacterCertificate',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('reference_number', models.CharField(max_length=30, unique=True)),
                ('purpose', models.CharField(blank=True, help_text='Purpose of the certificate', max_length=200)),
                ('school_year', models.CharField(blank=True, max_length=20)),
                ('status', models.CharField(choices=[('requested', 'Requested'), ('approved', 'Approved'), ('ready', 'Ready for Pickup'), ('released', 'Released'), ('cancelled', 'Cancelled')], default='requested', max_length=15)),
                ('character_rating', models.CharField(choices=[('Excellent', 'Excellent'), ('Very Good', 'Very Good'), ('Good', 'Good'), ('Fair', 'Fair'), ('Poor', 'Poor')], default='Excellent', max_length=50)),
                ('remarks', models.TextField(blank=True)),
                ('issued_at', models.DateTimeField(blank=True, null=True)),
                ('pdf_url', models.URLField(blank=True, max_length=1000, null=True)),
                ('requested_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('issued_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='issued_ccs', to=settings.AUTH_USER_MODEL)),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='character_certificates', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-requested_at'],
            },
        ),
        # AchievementRecord
        migrations.CreateModel(
            name='AchievementRecord',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True)),
                ('category', models.CharField(choices=[('academic', 'Academic'), ('sports', 'Sports'), ('arts', 'Arts & Culture'), ('leadership', 'Leadership'), ('community', 'Community Service'), ('competition', 'Competition'), ('other', 'Other')], default='academic', max_length=20)),
                ('date_achieved', models.DateField()),
                ('awarded_by', models.CharField(blank=True, help_text='Organization or person who gave the award', max_length=200)),
                ('school_year', models.CharField(blank=True, max_length=20)),
                ('grade_level', models.CharField(blank=True, max_length=20)),
                ('evidence_url', models.URLField(blank=True, help_text='URL to supporting document', max_length=1000, null=True)),
                ('is_verified', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='achievement_records', to=settings.AUTH_USER_MODEL)),
                ('verified_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='verified_achievements', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-date_achieved'],
            },
        ),
        # RecordRequest
        migrations.CreateModel(
            name='RecordRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('record_type', models.CharField(choices=[('transcript', 'Official Transcript'), ('transfer_certificate', 'Transfer Certificate'), ('character_certificate', 'Character Certificate'), ('enrollment_verification', 'Enrollment Verification'), ('other', 'Other')], max_length=30)),
                ('purpose', models.CharField(blank=True, max_length=300)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('processing', 'Processing'), ('ready', 'Ready for Pickup'), ('released', 'Released'), ('rejected', 'Rejected'), ('cancelled', 'Cancelled')], default='pending', max_length=15)),
                ('notes', models.TextField(blank=True, help_text='Requestor notes')),
                ('admin_notes', models.TextField(blank=True, help_text='Staff/admin internal notes')),
                ('copies', models.PositiveIntegerField(default=1)),
                ('reference_record_id', models.IntegerField(blank=True, help_text='ID of the generated record (Transcript, TC, CC)', null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('handled_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='handled_requests', to=settings.AUTH_USER_MODEL)),
                ('requestor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='record_requests', to=settings.AUTH_USER_MODEL)),
                ('student', models.ForeignKey(blank=True, help_text='Student the record is for (if requestor is parent)', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='requests_for_student', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
