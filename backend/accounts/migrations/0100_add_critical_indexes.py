from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0099_admin_enhancements'),
    ]

    operations = [
        # ── Attendance hot-path indexes ──────────────────────────────────────
        migrations.AddIndex(
            model_name='attendance',
            index=models.Index(
                fields=['student', 'date'],
                name='idx_attend_student_date',
            ),
        ),
        migrations.AddIndex(
            model_name='attendance',
            index=models.Index(
                fields=['classroom', 'date'],
                name='idx_attend_class_date',
            ),
        ),
        migrations.AddIndex(
            model_name='attendance',
            index=models.Index(
                fields=['schedule', 'date'],
                name='idx_attend_schedule_date',
            ),
        ),
        # ── Grade reporting indexes ─────────────────────────────────────────
        migrations.AddIndex(
            model_name='grade',
            index=models.Index(
                fields=['classroom', 'quarter', 'academic_year'],
                name='idx_grade_class_qtr_year',
            ),
        ),
        migrations.AddIndex(
            model_name='grade',
            index=models.Index(
                fields=['student', 'quarter', 'academic_year'],
                name='idx_grade_student_qtr_year',
            ),
        ),
        migrations.AddIndex(
            model_name='grade',
            index=models.Index(
                fields=['subject', 'quarter', 'classroom'],
                name='idx_grade_subj_qtr_class',
            ),
        ),
        # ── Assignment list index ────────────────────────────────────────────
        migrations.AddIndex(
            model_name='assignment',
            index=models.Index(
                fields=['classroom', 'due_date'],
                name='idx_assign_class_due',
            ),
        ),
        # ── Announcement audience filter ────────────────────────────────────
        migrations.AddIndex(
            model_name='announcement',
            index=models.Index(
                fields=['status', 'target_audience', 'created_at'],
                name='idx_announce_status_audience_time',
            ),
        ),
        # ── Notification per-user feed ───────────────────────────────────────
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(
                fields=['recipient', 'created_at'],
                name='idx_notif_recipient_time',
            ),
        ),
        # ── Chat message covering index ──────────────────────────────────────
        migrations.AddIndex(
            model_name='chatmessage',
            index=models.Index(
                fields=['room', 'timestamp', 'sender'],
                name='idx_chatmsg_room_time_sender',
            ),
        ),
        # ── StudentClassEnrollment lookup indexes ────────────────────────────
        migrations.AddIndex(
            model_name='studentclassenrollment',
            index=models.Index(
                fields=['student'],
                name='idx_enrollment_student',
            ),
        ),
        migrations.AddIndex(
            model_name='studentclassenrollment',
            index=models.Index(
                fields=['classroom'],
                name='idx_enrollment_classroom',
            ),
        ),
        # ── BehavioralRecord student lookup ──────────────────────────────────
        migrations.AddIndex(
            model_name='behavioralrecord',
            index=models.Index(
                fields=['student', 'incident_date'],
                name='idx_behavior_student_date',
            ),
        ),
        # ── AnnouncementComment thread display ───────────────────────────────
        migrations.AddIndex(
            model_name='announcementcomment',
            index=models.Index(
                fields=['announcement', 'created_at'],
                name='idx_announce_comment_time',
            ),
        ),
        # ── OTP lookup by user ───────────────────────────────────────────────
        migrations.AddIndex(
            model_name='otp',
            index=models.Index(
                fields=['user', 'created_at'],
                name='idx_otp_user_time',
            ),
        ),
    ]
