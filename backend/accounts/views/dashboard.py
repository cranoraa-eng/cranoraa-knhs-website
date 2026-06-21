"""Dashboard statistics views for teachers, students, and admins."""
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q, Avg, Count
from django.utils import timezone
import datetime
import logging

from ..models import (
    User, Classroom, StudentClassEnrollment, Grade, Attendance,
    ClassroomSubject,
)
from ..throttles import DashboardRateThrottle
from ._helpers import get_latest_messages
from ..services.dashboard_service import build_admin_dashboard_stats

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def teacher_dashboard_stats(request):
    try:
        user = request.user
        if user.role != 'staff' and user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=403)

        from django.core.cache import cache
        cache_key = f'teacher_dashboard:v1:{user.id}'
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        assigned_classrooms_ids = ClassroomSubject.objects.filter(teacher=user).values_list('classroom_id', flat=True)
        classrooms = Classroom.objects.filter(Q(teacher=user) | Q(id__in=assigned_classrooms_ids)).distinct()
        total_classes = classrooms.count()

        student_ids = StudentClassEnrollment.objects.filter(
            classroom__in=classrooms
        ).values_list('student_id', flat=True).distinct()
        total_students = student_ids.count()

        total_grades = Grade.objects.filter(teacher=user).count()

        today = timezone.now().date()
        today_attendance = Attendance.objects.filter(
            classroom__in=classrooms,
            date=today
        )
        if today_attendance.exists():
            present_count = today_attendance.filter(status__in=['present', 'late']).count()
            attendance_rate = round((present_count / today_attendance.count()) * 100)
        else:
            attendance_rate = 0

        from django.db.models import Subquery, OuterRef, IntegerField
        from django.db.models.functions import Coalesce
        teacher_classroom_subjects = ClassroomSubject.objects.filter(teacher=user).select_related('classroom', 'subject')
        classroom_ids = list(teacher_classroom_subjects.values_list('classroom_id', flat=True).distinct())
        enrollment_counts = dict(
            StudentClassEnrollment.objects.filter(classroom_id__in=classroom_ids)
            .values('classroom_id')
            .annotate(cnt=Count('id'))
            .values_list('classroom_id', 'cnt')
        )
        grade_counts = dict(
            Grade.objects.filter(
                subject_id__in=teacher_classroom_subjects.values_list('subject_id', flat=True),
                classroom_id__in=classroom_ids,
            )
            .values('subject_id', 'classroom_id')
            .annotate(cnt=Count('student', distinct=True))
            .values_list('subject_id', 'classroom_id', 'cnt')
        )
        pending_grades = 0
        for cs in teacher_classroom_subjects:
            students_in_class = enrollment_counts.get(cs.classroom_id, 0)
            grades_in_subject = grade_counts.get((cs.subject_id, cs.classroom_id), 0)
            pending_grades += max(0, students_in_class - grades_in_subject)

        try:
            from ..models import AuditLog
        except ImportError:
            AuditLog = None

        recent_activities = []
        if AuditLog:
            logs = AuditLog.objects.filter(user=user).order_by('-timestamp')[:5]
            for log in logs:
                recent_activities.append({
                    'message': log.description,
                    'time': log.timestamp.strftime('%I:%M %p, %b %d'),
                    'type': 'grade' if log.description and 'grade' in log.description.lower() else 'attendance' if log.description and 'attendance' in log.description.lower() else 'system'
                })

        latest_messages = get_latest_messages(user)

        res_data = {
            'total_students': total_students,
            'total_classes': total_classes,
            'total_grades': total_grades,
            'attendance_rate': attendance_rate,
            'pending_grades': pending_grades,
            'recent_activities': recent_activities,
            'latest_messages': latest_messages
        }
        cache.set(cache_key, res_data, timeout=300)
        return Response(res_data)
    except Exception as e:
        logger.error(f"Teacher stats error: {str(e)}", exc_info=True)
        return Response(
            {'error': 'Failed to load dashboard statistics.'},
            status=500
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_dashboard_stats(request):
    try:
        user = request.user
        if user.role != 'student':
            return Response({'error': 'Unauthorized'}, status=403)

        from django.core.cache import cache
        cache_key = f'student_dashboard:v1:{user.id}'
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        from ..models import Notification

        unread_notifications = Notification.objects.filter(recipient=user, is_read=False).count()
        recent_notifications = Notification.objects.filter(recipient=user).order_by('-created_at')[:5]

        recent_notif_data = []
        for n in recent_notifications:
            recent_notif_data.append({
                'title': n.title,
                'time': n.created_at.strftime('%I:%M %p, %b %d'),
                'type': n.notification_type
            })

        latest_messages = get_latest_messages(user)

        res_data = {
            'unread_notifications': unread_notifications,
            'recent_notifications': recent_notif_data,
            'latest_messages': latest_messages
        }
        cache.set(cache_key, res_data, timeout=300)
        return Response(res_data)
    except Exception as e:
        logger.error(f"Student dashboard stats error: {str(e)}", exc_info=True)
        return Response({'error': 'Failed to load dashboard statistics.'}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@throttle_classes([DashboardRateThrottle])
def admin_dashboard_stats(request):
    try:
        if request.user.role not in ['admin', 'staff']:
            return Response({'error': 'Unauthorized access'}, status=403)

        from django.core.cache import cache

        academic_year_name = request.query_params.get('academic_year')
        cache_key = f'admin_dashboard:v3:{request.user.role}:{request.user.id}:{academic_year_name or "all"}'
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        res_data = build_admin_dashboard_stats(request.user, academic_year_name)

        cache.set(cache_key, res_data, timeout=300)

        return Response(res_data)
    except Exception as e:
        logger.error("Admin stats error: %s", str(e), exc_info=True)
        return Response({
            'error': 'Failed to load admin statistics.',
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def storage_analytics_view(request):
    if request.user.role != 'admin':
        return Response({'error': 'Admin access required.'}, status=403)
    from ..storage import get_storage_stats
    return Response(get_storage_stats())


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_attendance_analytics(request):
    if request.user.role not in ['admin', 'staff']:
        return Response({'error': 'Unauthorized'}, status=403)

    from django.core.cache import cache
    academic_year_name = request.query_params.get('academic_year')
    cache_key = f'attendance_analytics:v1:{request.user.id}:{academic_year_name or "all"}'
    cached = cache.get(cache_key)
    if cached:
        return Response(cached)

    from django.db.models.functions import TruncDate
    att_qs = Attendance.objects.all()
    if academic_year_name:
        att_qs = att_qs.filter(classroom__academic_year__name=academic_year_name)
    now = timezone.localtime(timezone.now())
    today = now.date()
    last_30_days = today - datetime.timedelta(days=30)
    today_attendance = att_qs.filter(date=today)
    today_present = today_attendance.filter(status__in=['present', 'late']).count()
    today_total = today_attendance.count()
    today_rate = round((today_present / today_total * 100), 1) if today_total > 0 else 0
    daily_trends = (
        att_qs.filter(date__gte=last_30_days, date__lte=today)
        .exclude(date__week_day__in=[1, 7])
        .annotate(day=TruncDate('date')).values('day')
        .annotate(total=Count('id'), present=Count('id', filter=Q(status='present')),
                  late=Count('id', filter=Q(status='late')))
        .order_by('day')
    )
    trends = []
    for row in daily_trends:
        total = row['total']
        present_late = row['present'] + row['late']
        trends.append({
            'date': row['day'].strftime('%Y-%m-%d'),
            'present': row['present'],
            'late': row['late'],
            'rate': round((present_late / total * 100), 1) if total > 0 else 0,
        })
    res_data = {'today_rate': today_rate, 'today_total': today_total, 'daily_trends': trends}
    cache.set(cache_key, res_data, timeout=120)
    return Response(res_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_grade_analytics(request):
    if request.user.role not in ['admin', 'staff']:
        return Response({'error': 'Unauthorized'}, status=403)

    from django.core.cache import cache
    academic_year_name = request.query_params.get('academic_year')
    cache_key = f'grade_analytics:v1:{request.user.id}:{academic_year_name or "all"}'
    cached = cache.get(cache_key)
    if cached:
        return Response(cached)

    grades = Grade.objects.filter(raw_score__isnull=False, grade_type='final_grade')
    if academic_year_name:
        grades = grades.filter(
            Q(academic_year=academic_year_name) |
            Q(classroom__academic_year__name=academic_year_name)
        )
    total = grades.count()
    avg = grades.aggregate(avg=Avg('raw_score'))['avg']
    average = round(float(avg), 2) if avg else None
    distribution = {
        'outstanding': grades.filter(raw_score__gte=90).count(),
        'very_satisfactory': grades.filter(raw_score__gte=85, raw_score__lt=90).count(),
        'satisfactory': grades.filter(raw_score__gte=80, raw_score__lt=85).count(),
        'fairly_satisfactory': grades.filter(raw_score__gte=75, raw_score__lt=80).count(),
        'below_75': grades.filter(raw_score__lt=75).count(),
    }
    subject_stats = grades.values('subject__name').annotate(
        avg_grade=Avg('raw_score')
    ).order_by('-avg_grade')[:10]
    res_data = {
        'average': average, 'total': total, 'distribution': distribution,
        'subject_stats': [{'name': s['subject__name'], 'avg_grade': round(float(s['avg_grade']), 1) if s['avg_grade'] else 0} for s in subject_stats],
    }
    cache.set(cache_key, res_data, timeout=120)
    return Response(res_data)
