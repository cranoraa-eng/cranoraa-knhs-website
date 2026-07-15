"""
Migration 0068: Convert all FileField/ImageField columns to URLField.

All file storage is now handled by Supabase Storage.
Files are uploaded server-side and only the public URL is stored in the DB.

Fields changed:
  Announcement.attachment          FileField  → URLField
  AnnouncementAttachment.file      FileField  → URLField
  AnnouncementAttachment           + file_size_bytes, content_type fields
  LearningMaterial.file            FileField  → URLField
  LearningMaterial                 + file_size_bytes, original_filename
  Assignment.file                  FileField  → URLField
  Assignment                       + original_filename, file_size_bytes
  Submission.file                  FileField  → URLField
  Submission                       + original_filename, file_size_bytes
  EnrollmentApplication.*          6× FileField → URLField
  SystemSetting.school_logo        ImageField → URLField
  WebsiteContent.image             ImageField → URLField
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0067_remove_user_temp_password_storage'),
    ]

    operations = [
        # ── Announcement.attachment ───────────────────────────────────────────
        migrations.AlterField(
            model_name='announcement',
            name='attachment',
            field=models.URLField(blank=True, max_length=1000, null=True,
                                  help_text='Supabase Storage URL'),
        ),

        # ── AnnouncementAttachment.file ───────────────────────────────────────
        migrations.AlterField(
            model_name='announcementattachment',
            name='file',
            field=models.URLField(max_length=1000,
                                  help_text='Supabase Storage URL'),
        ),
        migrations.AddField(
            model_name='announcementattachment',
            name='file_size_bytes',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='announcementattachment',
            name='content_type',
            field=models.CharField(blank=True, max_length=100),
        ),

        # ── LearningMaterial.file ─────────────────────────────────────────────
        migrations.AlterField(
            model_name='learningmaterial',
            name='file',
            field=models.URLField(blank=True, max_length=1000, null=True,
                                  help_text='Supabase Storage URL'),
        ),
        migrations.AddField(
            model_name='learningmaterial',
            name='file_size_bytes',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='learningmaterial',
            name='original_filename',
            field=models.CharField(blank=True, max_length=255),
        ),

        # ── Assignment.file ───────────────────────────────────────────────────
        migrations.AlterField(
            model_name='assignment',
            name='file',
            field=models.URLField(blank=True, max_length=1000, null=True,
                                  help_text='Supabase Storage URL'),
        ),
        migrations.AddField(
            model_name='assignment',
            name='original_filename',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='assignment',
            name='file_size_bytes',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),

        # ── Submission.file ───────────────────────────────────────────────────
        migrations.AlterField(
            model_name='submission',
            name='file',
            field=models.URLField(max_length=1000,
                                  help_text='Supabase Storage URL'),
        ),
        migrations.AddField(
            model_name='submission',
            name='original_filename',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='submission',
            name='file_size_bytes',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),

        # ── EnrollmentApplication documents ──────────────────────────────────
        migrations.AlterField(
            model_name='enrollmentapplication',
            name='birth_certificate',
            field=models.URLField(blank=True, max_length=1000, null=True),
        ),
        migrations.AlterField(
            model_name='enrollmentapplication',
            name='report_card',
            field=models.URLField(blank=True, max_length=1000, null=True),
        ),
        migrations.AlterField(
            model_name='enrollmentapplication',
            name='form_138',
            field=models.URLField(blank=True, max_length=1000, null=True,
                                  help_text='Grade 6 Candidate for Graduation Certificate'),
        ),
        migrations.AlterField(
            model_name='enrollmentapplication',
            name='certificate_of_completion',
            field=models.URLField(blank=True, max_length=1000, null=True,
                                  help_text='Grade 10 Candidate for Completion Certificate'),
        ),
        migrations.AlterField(
            model_name='enrollmentapplication',
            name='good_moral_certificate',
            field=models.URLField(blank=True, max_length=1000, null=True),
        ),
        migrations.AlterField(
            model_name='enrollmentapplication',
            name='last_school_attended_cert',
            field=models.URLField(blank=True, max_length=1000, null=True,
                                  help_text='For ALS applicants'),
        ),

        # ── SystemSetting.school_logo ─────────────────────────────────────────
        migrations.AlterField(
            model_name='systemsetting',
            name='school_logo',
            field=models.URLField(blank=True, max_length=1000, null=True,
                                  help_text='Supabase Storage URL'),
        ),

        # ── WebsiteContent.image ──────────────────────────────────────────────
        migrations.AlterField(
            model_name='websitecontent',
            name='image',
            field=models.URLField(blank=True, max_length=1000, null=True,
                                  help_text='Supabase Storage URL'),
        ),
    ]
