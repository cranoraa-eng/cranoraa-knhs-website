"""
Switch student/teacher CASCADE to SET_NULL to preserve data when accounts are deleted.
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0109_switch_to_3_term_grading'),
    ]

    operations = [
        # academic.py
        migrations.AlterField(
            model_name='classroomsubject',
            name='teacher',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=models.SET_NULL,
                related_name='assigned_classroom_subjects',
                to='accounts.user',
                limit_choices_to={'role': 'staff'},
            ),
        ),
        migrations.AlterField(
            model_name='studentclassenrollment',
            name='student',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=models.SET_NULL,
                related_name='enrollments',
                to='accounts.user',
            ),
        ),

        # announcements.py
        migrations.AlterField(
            model_name='announcement',
            name='author',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=models.SET_NULL,
                related_name='account_announcements',
                to='accounts.user',
            ),
        ),
        migrations.AlterField(
            model_name='announcementcomment',
            name='author',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=models.SET_NULL,
                related_name='announcement_comments',
                to='accounts.user',
            ),
        ),

        # assignments.py
        migrations.AlterField(
            model_name='assignment',
            name='teacher',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=models.SET_NULL,
                related_name='created_assignments',
                to='accounts.user',
            ),
        ),
        migrations.AlterField(
            model_name='submission',
            name='student',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=models.SET_NULL,
                related_name='submissions',
                to='accounts.user',
            ),
        ),
        migrations.AlterField(
            model_name='grade',
            name='student',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=models.SET_NULL,
                related_name='subject_grades',
                to='accounts.user',
            ),
        ),
        migrations.AlterField(
            model_name='grade',
            name='teacher',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=models.SET_NULL,
                related_name='assigned_subject_grades',
                to='accounts.user',
            ),
        ),

        # attendance.py
        migrations.AlterField(
            model_name='attendance',
            name='student',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=models.SET_NULL,
                related_name='attendances',
                to='accounts.user',
            ),
        ),
        migrations.AlterField(
            model_name='attendance',
            name='marked_by',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=models.SET_NULL,
                related_name='marked_attendances',
                to='accounts.user',
            ),
        ),
        migrations.AlterField(
            model_name='absenceexcuse',
            name='student',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=models.SET_NULL,
                related_name='absence_excuses',
                to='accounts.user',
            ),
        ),

        # chat.py
        migrations.AlterField(
            model_name='chatmessage',
            name='sender',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=models.SET_NULL,
                related_name='sent_messages',
                to='accounts.user',
            ),
        ),
        migrations.AlterField(
            model_name='messagereaction',
            name='user',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=models.SET_NULL,
                related_name='message_reactions',
                to='accounts.user',
            ),
        ),
        migrations.AlterField(
            model_name='reportedmessage',
            name='reported_user',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=models.SET_NULL,
                related_name='received_reports',
                to='accounts.user',
            ),
        ),
        migrations.AlterField(
            model_name='reportedmessage',
            name='reporter',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=models.SET_NULL,
                related_name='filed_reports',
                to='accounts.user',
            ),
        ),
        migrations.AlterField(
            model_name='userblock',
            name='blocker',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=models.SET_NULL,
                related_name='blocking',
                to='accounts.user',
            ),
        ),
        migrations.AlterField(
            model_name='userblock',
            name='blocked',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=models.SET_NULL,
                related_name='blocked_by',
                to='accounts.user',
            ),
        ),

        # communication.py
        migrations.AlterField(
            model_name='parentteachermeeting',
            name='teacher',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=models.SET_NULL,
                related_name='ptm_as_teacher',
                to='accounts.user',
            ),
        ),
        migrations.AlterField(
            model_name='parentteachermeeting',
            name='parent',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=models.SET_NULL,
                related_name='ptm_as_parent',
                to='accounts.user',
            ),
        ),
        migrations.AlterField(
            model_name='parentteachermeeting',
            name='student',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=models.SET_NULL,
                related_name='ptm_meetings',
                to='accounts.user',
            ),
        ),
        migrations.AlterField(
            model_name='behavioralrecord',
            name='student',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=models.SET_NULL,
                related_name='behavioral_records',
                to='accounts.user',
            ),
        ),
        migrations.AlterField(
            model_name='behavioralrecord',
            name='recorded_by',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=models.SET_NULL,
                related_name='behavioral_records_created',
                to='accounts.user',
            ),
        ),

        # departments.py
        migrations.AlterField(
            model_name='staffperformance',
            name='staff',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=models.SET_NULL,
                related_name='performance_records',
                to='accounts.user',
            ),
        ),

        # enrollment.py
        migrations.AlterField(
            model_name='enrollmentwaitlist',
            name='student',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=models.SET_NULL,
                related_name='enrollment_waitlists',
                to='accounts.user',
            ),
        ),
        migrations.AlterField(
            model_name='parentlink',
            name='parent',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=models.SET_NULL,
                related_name='parent_links',
                to='accounts.user',
            ),
        ),
        migrations.AlterField(
            model_name='parentlink',
            name='student',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=models.SET_NULL,
                related_name='student_parent_links',
                to='accounts.user',
            ),
        ),

        # finance.py
        migrations.AlterField(
            model_name='scratchcard',
            name='student',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=models.SET_NULL,
                related_name='scratch_cards',
                to='accounts.user',
            ),
        ),
        migrations.AlterField(
            model_name='fee',
            name='student',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=models.SET_NULL,
                related_name='fees',
                to='accounts.user',
            ),
        ),

        # grades.py
        migrations.AlterField(
            model_name='gradereport',
            name='student',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=models.SET_NULL,
                related_name='student_grade_reports',
                to='accounts.user',
            ),
        ),

        # learning.py
        migrations.AlterField(
            model_name='learningmaterial',
            name='uploaded_by',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=models.SET_NULL,
                related_name='uploaded_materials',
                to='accounts.user',
            ),
        ),

        # notifications.py
        migrations.AlterField(
            model_name='notification',
            name='recipient',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=models.SET_NULL,
                related_name='notifications',
                to='accounts.user',
            ),
        ),

        # records.py
        migrations.AlterField(
            model_name='transcript',
            name='student',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=models.SET_NULL,
                related_name='transcripts',
                to='accounts.user',
            ),
        ),
        migrations.AlterField(
            model_name='transfercertificate',
            name='student',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=models.SET_NULL,
                related_name='transfer_certificates',
                to='accounts.user',
            ),
        ),
        migrations.AlterField(
            model_name='charactercertificate',
            name='student',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=models.SET_NULL,
                related_name='character_certificates',
                to='accounts.user',
            ),
        ),
        migrations.AlterField(
            model_name='achievementrecord',
            name='student',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=models.SET_NULL,
                related_name='achievement_records',
                to='accounts.user',
            ),
        ),
        migrations.AlterField(
            model_name='recordrequest',
            name='requestor',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=models.SET_NULL,
                related_name='record_requests',
                to='accounts.user',
            ),
        ),
        migrations.AlterField(
            model_name='recordrequest',
            name='student',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=models.SET_NULL,
                related_name='requests_for_student',
                to='accounts.user',
            ),
        ),

        # schedule.py
        migrations.AlterField(
            model_name='schedule',
            name='teacher',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=models.SET_NULL,
                related_name='teaching_schedules',
                to='accounts.user',
                limit_choices_to={'role': 'staff'},
            ),
        ),

        # tickets.py
        migrations.AlterField(
            model_name='ticket',
            name='created_by',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=models.SET_NULL,
                related_name='tickets_created',
                to='accounts.user',
            ),
        ),
        migrations.AlterField(
            model_name='ticketparticipant',
            name='user',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=models.SET_NULL,
                related_name='ticket_participations',
                to='accounts.user',
            ),
        ),
        migrations.AlterField(
            model_name='ticketmessage',
            name='sender',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=models.SET_NULL,
                related_name='ticket_messages',
                to='accounts.user',
            ),
        ),
        migrations.AlterField(
            model_name='ticketattachment',
            name='uploaded_by',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=models.SET_NULL,
                to='accounts.user',
            ),
        ),
    ]
