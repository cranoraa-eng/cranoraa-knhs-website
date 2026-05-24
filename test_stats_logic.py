import os
import sys
import django
import datetime
from django.utils import timezone
from django.db.models import Count, Avg, Q

# Setup Django
sys.path.append('backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_portal.settings')
django.setup()

from accounts.models import User, Attendance, Classroom, Subject, Grade, Announcement, EnrollmentApplication, SystemSetting, ChatMessage
from accounts.serializers import SystemSettingSerializer

def test_stats_logic():
    try:
        # Simulate the logic in admin_dashboard_stats
        now = timezone.localtime(timezone.now())
        today = now.date()
        five_mins_ago = now - datetime.timedelta(minutes=5)
        this_week_start = today - datetime.timedelta(days=today.weekday())
        
        academic_year_name = None # Simulate default
        
        # Safe model imports
        try:
            from portal.models import AuditLog
        except ImportError:
            AuditLog = None

        # Base Attendance Filter
        att_qs = Attendance.objects.all()
        
        # Attendance today (Local Time)
        today_attendance = att_qs.filter(date=today)
        today_present = today_attendance.filter(status__in=['present', 'late']).count()
        today_total   = today_attendance.count()
        today_rate    = round((today_present / today_total * 100), 1) if today_total > 0 else 0

        # Core counts
        total_students = User.objects.filter(role='student', is_approved=True).count()
        total_teachers = User.objects.filter(role='teacher', is_approved=True).count()
        
        classes_qs = Classroom.objects.all()
        total_classes  = classes_qs.count()
        
        total_subjects = Subject.objects.count()
        # POTENTIAL ISSUE HERE: is_verified check
        pending_approvals = User.objects.filter(is_approved=False, is_verified=True).count()
        
        active_users = User.objects.filter(last_activity__gte=five_mins_ago).count()

        # Attendance Trends (Last 30 Days)
        last_30_days_list = [today - datetime.timedelta(days=i) for i in range(29, -1, -1)]
        attendance_trends = []
        for day in last_30_days_list:
            if day.weekday() in [5, 6]: continue
            day_records = att_qs.filter(date=day)
            day_total = day_records.count()
            day_present = day_records.filter(status='present').count()
            day_late    = day_records.filter(status='late').count()
            attendance_trends.append({
                'date': day.strftime('%Y-%m-%d'),
                'present': day_present,
                'late': day_late,
                'rate': round(((day_present + day_late) / day_total * 100), 1) if day_total > 0 else 0
            })

        # Grades
        grades = Grade.objects.filter(transmuted_score__isnull=False, grade_type='final_grade')
        total_grades = grades.count()
        avg_grade = grades.aggregate(avg=Avg('transmuted_score'))['avg']
        average_grade = round(float(avg_grade), 2) if avg_grade else None

        # Distribution
        outstanding = grades.filter(transmuted_score__gte=90).count()
        very_satisfactory = grades.filter(transmuted_score__gte=85, transmuted_score__lt=90).count()
        satisfactory = grades.filter(transmuted_score__gte=80, transmuted_score__lt=85).count()
        fairly_satisfactory = grades.filter(transmuted_score__gte=75, transmuted_score__lt=80).count()
        below_75 = grades.filter(transmuted_score__lt=75).count()

        # General Average
        student_averages = grades.values('student').annotate(avg=Avg('transmuted_score'))
        total_students_graded = student_averages.count()
        
        ga_outstanding = 0
        ga_very_satisfactory = 0
        ga_satisfactory = 0
        ga_fairly_satisfactory = 0
        ga_below_75 = 0
        
        for sa in student_averages:
            score = sa['avg']
            if score >= 90: ga_outstanding += 1
            elif score >= 85: ga_very_satisfactory += 1
            elif score >= 80: ga_satisfactory += 1
            elif score >= 75: ga_fairly_satisfactory += 1
            else: ga_below_75 += 1

        # Recent Activity
        recent_activity = []
        if AuditLog:
            recent_activity = AuditLog.objects.order_by('-timestamp')[:5]
        
        # Subject stats
        subject_stats = Grade.objects.filter(
            grade_type='final_grade', 
            transmuted_score__isnull=False
        ).values('subject__name').annotate(
            avg_grade=Avg('transmuted_score')
        ).order_by('-avg_grade')[:10]
        
        for s in subject_stats:
            s['avg_grade'] = round(float(s['avg_grade']), 1)

        # Announcements
        recent_announcements = list(
            Announcement.objects.filter(status='live')
            .order_by('-created_at')[:5]
            .values('id', 'title', 'content', 'priority', 'is_pinned', 'created_at', 'author__username')
        )
        for a in recent_announcements:
            a['author_name'] = a.pop('author__username', 'Unknown')

        # Messages (simulate for admin)
        admin = User.objects.filter(role='admin').first()
        latest_messages = []
        if admin:
            msg_objs = ChatMessage.objects.filter(
                room__participants=admin
            ).exclude(sender=admin).order_by('-timestamp')
            seen_senders = set()
            for m in msg_objs:
                if m.sender_id not in seen_senders:
                    latest_messages.append({
                        'id': m.id,
                        'content': m.content,
                        'timestamp': m.timestamp.isoformat(),
                        'sender': m.sender.get_full_name() or m.sender.username,
                        'is_read': m.is_read
                    })
                    seen_senders.add(m.sender_id)
                if len(latest_messages) >= 5:
                    break

        print("Logic executed successfully!")
        print(f"Total Students: {total_students}")
        print(f"Total Teachers: {total_teachers}")
        print(f"Total Classes: {total_classes}")
        print(f"Pending Approvals: {pending_approvals}")
        
    except Exception as e:
        print(f"FAILED with exception: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_stats_logic()
