"""
Tests for models added in Phases 1-8:
Phase 1: NotificationPreference
Phase 3: Transcript, TranscriptLineItem, TransferCertificate, CharacterCertificate,
         AchievementRecord, RecordRequest
Phase 4: AbsenceExcuse, EnrollmentWaitlist
Phase 5: GradeReport enhancements (gpa, status, class_rank)
Phase 6: ParentTeacherMeeting, BehavioralRecord, SchoolEvent
Phase 7: UserBlock, EmergencyMessage
Phase 8: Department, StaffPerformance
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date, time, timedelta
from decimal import Decimal

from accounts.models import (
    Classroom, Subject, Grade, Notification, NotificationPreference,
    Transcript, TranscriptLineItem, TransferCertificate, CharacterCertificate,
    AchievementRecord, RecordRequest, AbsenceExcuse, EnrollmentWaitlist,
    ParentTeacherMeeting, BehavioralRecord, SchoolEvent,
    UserBlock, EmergencyMessage, Department, StaffPerformance,
    Attendance, GradeReport, StudentClassEnrollment,
)

User = get_user_model()


class NotificationPreferenceTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='student1', password='pass', role='student', is_approved=True)

    def test_auto_created_on_first_access(self):
        pref, created = NotificationPreference.objects.get_or_create(user=self.user)
        self.assertTrue(created)
        self.assertTrue(pref.grade_notifications)
        self.assertTrue(pref.attendance_notifications)

    def test_get_or_create_is_idempotent(self):
        NotificationPreference.objects.create(user=self.user)
        pref, created = NotificationPreference.objects.get_or_create(user=self.user)
        self.assertFalse(created)


class TranscriptTest(TestCase):
    def setUp(self):
        self.student = User.objects.create_user(username='s1', password='pass', role='student', is_approved=True)
        self.classroom = Classroom.objects.create(name='7-A', school_year='2025-2026')
        self.subject = Subject.objects.create(name='Math', code='MATH7', grade_level='7')

    def test_create_transcript(self):
        t = Transcript.objects.create(
            student=self.student, classroom=self.classroom,
            school_year='2025-2026', academic_year='2025-2026',
        )
        self.assertEqual(str(t), f"Transcript for {self.student.username} (2025-2026)")

    def test_transcript_unique_constraint(self):
        Transcript.objects.create(
            student=self.student, classroom=self.classroom,
            school_year='2025-2026', academic_year='2025-2026',
        )
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            Transcript.objects.create(
                student=self.student, classroom=self.classroom,
                school_year='2025-2026', academic_year='2025-2026',
            )

    def test_line_item_compute_final(self):
        t = Transcript.objects.create(
            student=self.student, classroom=self.classroom,
            school_year='2025-2026', academic_year='2025-2026',
        )
        li = TranscriptLineItem.objects.create(
            transcript=t, subject=self.subject,
            q1=Decimal('90.00'), q2=Decimal('85.00'),
            q3=Decimal('88.00'), q4=Decimal('92.00'),
        )
        self.assertEqual(float(li.final_average), 88.75)
        self.assertIn('Satisfactory', li.remarks)


class TransferCertificateTest(TestCase):
    def setUp(self):
        self.student = User.objects.create_user(username='s2', password='pass', role='student', is_approved=True)
        self.admin = User.objects.create_user(username='admin1', password='pass', role='admin', is_staff=True, is_approved=True)

    def test_reference_number_auto_generated(self):
        tc = TransferCertificate.objects.create(
            student=self.student, issued_by=self.admin,
            date_of_birth=date(2010, 5, 15),
            date_of_confinement=date(2024, 6, 15),
            date_of_discharge=date(2025, 3, 15),
            last_grade_completed='Grade 6',
            last_school_attended='Sample Elementary',
        )
        self.assertTrue(tc.reference_number.startswith('TC-'))

    def test_unique_reference_number(self):
        tc1 = TransferCertificate.objects.create(
            student=self.student, issued_by=self.admin,
            reference_number='TC-UNIQUE-001',
            date_of_birth=date(2010, 5, 15),
            date_of_confinement=date(2024, 6, 15),
            date_of_discharge=date(2025, 3, 15),
        )
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            TransferCertificate.objects.create(
                student=self.student, issued_by=self.admin,
                reference_number='TC-UNIQUE-001',
                date_of_birth=date(2010, 5, 15),
                date_of_confinement=date(2024, 6, 15),
                date_of_discharge=date(2025, 3, 15),
            )


class CharacterCertificateTest(TestCase):
    def setUp(self):
        self.student = User.objects.create_user(username='s3', password='pass', role='student', is_approved=True)
        self.admin = User.objects.create_user(username='admin2', password='pass', role='admin', is_staff=True, is_approved=True)

    def test_reference_number_auto_generated(self):
        cc = CharacterCertificate.objects.create(
            student=self.student, issued_by=self.admin,
            character_rating='excellent',
        )
        self.assertTrue(cc.reference_number.startswith('CC-'))


class AchievementRecordTest(TestCase):
    def setUp(self):
        self.student = User.objects.create_user(username='s4', password='pass', role='student', is_approved=True)
        self.teacher = User.objects.create_user(username='t1', password='pass', role='staff', staff_title='teacher', is_approved=True)

    def test_create_achievement(self):
        a = AchievementRecord.objects.create(
            student=self.student, recorded_by=self.teacher,
            achievement_type='academic',
            title='Honor Roll',
            description='First Honors',
            date_achieved=date(2025, 3, 15),
        )
        self.assertFalse(a.is_verified)

    def test_verify_achievement(self):
        a = AchievementRecord.objects.create(
            student=self.student, recorded_by=self.teacher,
            achievement_type='sports',
            title='Basketball Champion',
            date_achieved=date(2025, 3, 15),
        )
        a.is_verified = True
        a.verified_by = self.teacher
        a.verified_at = timezone.now()
        a.save()
        a.refresh_from_db()
        self.assertTrue(a.is_verified)


class RecordRequestTest(TestCase):
    def setUp(self):
        self.student = User.objects.create_user(username='s5', password='pass', role='student', is_approved=True)

    def test_create_request(self):
        rr = RecordRequest.objects.create(
            student=self.student, record_type='transcript',
        )
        self.assertEqual(rr.status, 'pending')

    def test_status_choices(self):
        rr = RecordRequest.objects.create(
            student=self.student, record_type='transfer_certificate',
        )
        rr.status = 'processing'
        rr.save()
        rr.refresh_from_db()
        self.assertEqual(rr.status, 'processing')


class AbsenceExcuseTest(TestCase):
    def setUp(self):
        self.student = User.objects.create_user(username='s6', password='pass', role='student', is_approved=True)
        self.teacher = User.objects.create_user(username='t2', password='pass', role='staff', staff_title='teacher', is_approved=True)
        self.classroom = Classroom.objects.create(name='8-A', school_year='2025-2026')
        self.attendance = Attendance.objects.create(
            student=self.student, classroom=self.classroom,
            date=date.today(), status='absent', marked_by=self.teacher,
        )

    def test_create_excuse(self):
        exc = AbsenceExcuse.objects.create(
            student=self.student, attendance=self.attendance,
            reason='Sick with flu',
        )
        self.assertEqual(exc.status, 'pending')

    def test_approve_excuse(self):
        exc = AbsenceExcuse.objects.create(
            student=self.student, attendance=self.attendance,
            reason='Family emergency',
        )
        exc.status = 'approved'
        exc.reviewed_by = self.teacher
        exc.reviewed_at = timezone.now()
        exc.save()
        self.attendance.status = 'excused'
        self.attendance.has_excuse = True
        self.attendance.save()
        self.attendance.refresh_from_db()
        self.assertEqual(self.attendance.status, 'excused')
        self.assertTrue(self.attendance.has_excuse)


class EnrollmentWaitlistTest(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(username='admin3', password='pass', role='admin', is_staff=True, is_approved=True)
        self.student = User.objects.create_user(username='s7', password='pass', role='student', is_approved=True)
        self.classroom = Classroom.objects.create(name='7-B', school_year='2025-2026')

    def test_create_waitlist_entry(self):
        entry = EnrollmentWaitlist.objects.create(
            classroom=self.classroom, student=self.student, position=1,
        )
        self.assertEqual(entry.status, 'waiting')

    def test_unique_constraint(self):
        EnrollmentWaitlist.objects.create(
            classroom=self.classroom, student=self.student, position=1,
        )
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            EnrollmentWaitlist.objects.create(
                classroom=self.classroom, student=self.student, position=2,
            )


class GradeReportEnhancementsTest(TestCase):
    def setUp(self):
        self.student = User.objects.create_user(username='s8', password='pass', role='student', is_approved=True)
        self.teacher = User.objects.create_user(username='t3', password='pass', role='staff', staff_title='teacher', is_approved=True)
        self.classroom = Classroom.objects.create(name='9-A', school_year='2025-2026')
        self.subject = Subject.objects.create(name='English', code='ENG9', grade_level='9')

    def test_compute_gpa(self):
        from accounts.models import GradeReport
        gpa = GradeReport._compute_gpa(Decimal('92.00'))
        self.assertEqual(gpa, Decimal('1.50'))

        gpa2 = GradeReport._compute_gpa(Decimal('75.00'))
        self.assertEqual(gpa2, Decimal('3.00'))

        gpa3 = GradeReport._compute_gpa(Decimal('70.00'))
        self.assertEqual(gpa3, Decimal('5.00'))

    def test_class_rank(self):
        s1 = User.objects.create_user(username='s9', password='pass', role='student', is_approved=True)
        s2 = User.objects.create_user(username='s10', password='pass', role='student', is_approved=True)
        r1 = GradeReport.objects.create(
            student=self.student, classroom=self.classroom,
            quarter=1, school_year='2025-2026', general_average=Decimal('95.00'),
        )
        r2 = GradeReport.objects.create(
            student=s1, classroom=self.classroom,
            quarter=1, school_year='2025-2026', general_average=Decimal('88.00'),
        )
        r1.compute_class_rank()
        r2.compute_class_rank()
        r1.refresh_from_db()
        r2.refresh_from_db()
        self.assertEqual(r1.class_rank, 1)
        self.assertEqual(r2.class_rank, 2)

    def test_approval_workflow(self):
        r = GradeReport.objects.create(
            student=self.student, classroom=self.classroom,
            quarter=1, school_year='2025-2026', general_average=Decimal('90.00'),
        )
        self.assertEqual(r.status, 'draft')
        r.status = 'submitted'
        r.save()
        self.assertEqual(r.status, 'submitted')
        r.status = 'approved'
        r.approved_by = self.teacher
        r.approved_at = timezone.now()
        r.is_final = True
        r.save()
        self.assertEqual(r.status, 'approved')
        self.assertTrue(r.is_final)


class ParentTeacherMeetingTest(TestCase):
    def setUp(self):
        self.teacher = User.objects.create_user(username='t4', password='pass', role='staff', staff_title='teacher', is_approved=True)
        self.parent = User.objects.create_user(username='p1', password='pass', role='parent', is_approved=True)
        self.student = User.objects.create_user(username='s11', password='pass', role='student', is_approved=True)
        self.classroom = Classroom.objects.create(name='7-C', school_year='2025-2026')

    def test_create_meeting(self):
        m = ParentTeacherMeeting.objects.create(
            teacher=self.teacher, parent=self.parent,
            student=self.student, classroom=self.classroom,
            scheduled_date=date.today() + timedelta(days=7),
            scheduled_time=time(14, 0),
            purpose='academic',
        )
        self.assertEqual(m.status, 'scheduled')

    def test_complete_meeting(self):
        m = ParentTeacherMeeting.objects.create(
            teacher=self.teacher, parent=self.parent,
            student=self.student, classroom=self.classroom,
            scheduled_date=date.today() + timedelta(days=7),
            scheduled_time=time(14, 0),
        )
        m.status = 'completed'
        m.notes = 'Discussed academic performance'
        m.save()
        self.assertEqual(m.status, 'completed')


class BehavioralRecordTest(TestCase):
    def setUp(self):
        self.teacher = User.objects.create_user(username='t5', password='pass', role='staff', staff_title='teacher', is_approved=True)
        self.student = User.objects.create_user(username='s12', password='pass', role='student', is_approved=True)
        self.parent = User.objects.create_user(username='p2', password='pass', role='parent', is_approved=True)
        self.classroom = Classroom.objects.create(name='8-B', school_year='2025-2026')

    def test_create_record(self):
        br = BehavioralRecord.objects.create(
            student=self.student, classroom=self.classroom,
            recorded_by=self.teacher,
            incident_type='tardiness',
            severity='minor',
            action_taken='verbal_warning',
            description='Late to class by 10 minutes',
            incident_date=date.today(),
        )
        self.assertFalse(br.parent_notified)

    def test_major_severity_notification(self):
        br = BehavioralRecord.objects.create(
            student=self.student, classroom=self.classroom,
            recorded_by=self.teacher,
            incident_type='fighting',
            severity='major',
            description='Physical altercation',
            incident_date=date.today(),
        )
        br.parent_notified = True
        br.parent_notified_at = timezone.now()
        br.save()
        self.assertTrue(br.parent_notified)


class SchoolEventTest(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(username='admin4', password='pass', role='admin', is_staff=True, is_approved=True)

    def test_create_event(self):
        e = SchoolEvent.objects.create(
            title='Science Fair',
            description='Annual science fair',
            category='academic',
            target_audience='all',
            start_date=date.today() + timedelta(days=14),
            created_by=self.admin,
        )
        self.assertTrue(e.is_all_day is False)

    def test_all_day_event(self):
        e = SchoolEvent.objects.create(
            title='Foundation Day',
            description='School anniversary',
            category='cultural',
            target_audience='all',
            start_date=date.today() + timedelta(days=30),
            is_all_day=True,
        )
        self.assertTrue(e.is_all_day)


class UserBlockTest(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(username='u1', password='pass', role='student', is_approved=True)
        self.user2 = User.objects.create_user(username='u2', password='pass', role='student', is_approved=True)

    def test_block_user(self):
        block = UserBlock.objects.create(blocker=self.user1, blocked=self.user2)
        self.assertIsNotNone(block.created_at)

    def test_unique_constraint(self):
        UserBlock.objects.create(blocker=self.user1, blocked=self.user2)
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            UserBlock.objects.create(blocker=self.user1, blocked=self.user2)


class EmergencyMessageTest(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(username='admin5', password='pass', role='admin', is_staff=True, is_approved=True)

    def test_create_emergency(self):
        em = EmergencyMessage.objects.create(
            title='Typhoon Warning',
            message='Classes suspended tomorrow',
            priority='critical',
            target_audience='all',
            sent_by=self.admin,
        )
        self.assertTrue(em.is_active)

    def test_expired_emergency(self):
        em = EmergencyMessage.objects.create(
            title='Test Alert',
            message='Testing',
            priority='info',
            target_audience='students',
            sent_by=self.admin,
            expires_at=timezone.now() - timedelta(hours=1),
        )
        self.assertFalse(em.expires_at > timezone.now())


class DepartmentTest(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(username='admin6', password='pass', role='admin', is_staff=True, is_approved=True)

    def test_create_department(self):
        d = Department.objects.create(
            name='Mathematics', code='MATH',
            description='Math department', head=self.admin,
        )
        self.assertEqual(str(d), 'Mathematics (MATH)')

    def test_unique_code(self):
        Department.objects.create(name='Science', code='SCI')
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            Department.objects.create(name='Science 2', code='SCI')


class StaffPerformanceTest(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(username='admin7', password='pass', role='admin', is_staff=True, is_approved=True)
        self.teacher = User.objects.create_user(username='t6', password='pass', role='staff', staff_title='teacher', is_approved=True)

    def test_create_performance(self):
        sp = StaffPerformance.objects.create(
            staff=self.teacher, evaluated_by=self.admin,
            academic_year='2025-2026',
            teaching_quality=5,
            student_engagement=4,
            classroom_management=4,
            lesson_planning=5,
            professional_development=3,
        )
        sp.compute_overall_rating()
        sp.refresh_from_db()
        self.assertEqual(float(sp.overall_rating), 4.20)

    def test_unique_constraint(self):
        StaffPerformance.objects.create(
            staff=self.teacher, academic_year='2025-2026',
            teaching_quality=3, student_engagement=3,
            classroom_management=3, lesson_planning=3,
            professional_development=3,
        )
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            StaffPerformance.objects.create(
                staff=self.teacher, academic_year='2025-2026',
                teaching_quality=4, student_engagement=4,
                classroom_management=4, lesson_planning=4,
                professional_development=4,
            )
