"""
Service layer for dashboard statistics.
Centralizes attendance trends, grade distribution, and analytics computations.
"""
import datetime
import logging

from django.db.models import Q, Avg, Count
from django.db.models.functions import TruncDate
from django.utils import timezone

logger = logging.getLogger(__name__)


def compute_attendance_trends(att_qs, today, days=30):
    """
    Compute daily attendance trends for the last N days.
    Returns list of {date, present, late, rate} dicts.
    """
    last_n_days = today - datetime.timedelta(days=days)

    daily_trends = (
        att_qs
        .filter(date__gte=last_n_days, date__lte=today)
        .exclude(date__week_day__in=[1, 7])
        .annotate(day=TruncDate('date'))
        .values('day')
        .annotate(
            total=Count('id'),
            present=Count('id', filter=Q(status='present')),
            late=Count('id', filter=Q(status='late')),
        )
        .order_by('day')
    )

    trend_map = {}
    for row in daily_trends:
        total = row['total']
        present_late = row['present'] + row['late']
        trend_map[row['day'].strftime('%Y-%m-%d')] = {
            'present': row['present'],
            'late': row['late'],
            'rate': round((present_late / total * 100), 1) if total > 0 else 0
        }

    attendance_trends = []
    for i in range(days, -1, -1):
        day = today - datetime.timedelta(days=i)
        if day.weekday() in [5, 6]:
            continue
        day_str = day.strftime('%Y-%m-%d')
        if day_str in trend_map:
            trend_map[day_str]['date'] = day_str
            attendance_trends.append(trend_map[day_str])
        else:
            attendance_trends.append({'date': day_str, 'present': 0, 'late': 0, 'rate': 0})

    return attendance_trends


def compute_grade_distribution(grades):
    """
    Compute grade distribution from a queryset of Grade objects.
    Returns dict with counts per grade band.
    """
    return {
        'outstanding': grades.filter(raw_score__gte=90).count(),
        'very_satisfactory': grades.filter(raw_score__gte=85, raw_score__lt=90).count(),
        'satisfactory': grades.filter(raw_score__gte=80, raw_score__lt=85).count(),
        'fairly_satisfactory': grades.filter(raw_score__gte=75, raw_score__lt=80).count(),
        'below_75': grades.filter(raw_score__lt=75).count(),
    }


def compute_general_average_buckets(grades):
    """
    Compute general average distribution from a grades queryset.
    Returns dict with per-student average buckets.
    """
    student_averages = grades.values('student').annotate(avg=Avg('raw_score'))
    total_students_graded = student_averages.count()

    buckets = student_averages.aggregate(
        outstanding=Count('student', filter=Q(avg__gte=90)),
        very_satisfactory=Count('student', filter=Q(avg__gte=85, avg__lt=90)),
        satisfactory=Count('student', filter=Q(avg__gte=80, avg__lt=85)),
        fairly_satisfactory=Count('student', filter=Q(avg__gte=75, avg__lt=80)),
        below_75=Count('student', filter=Q(avg__lt=75)),
    )

    return {
        'buckets': buckets,
        'total_students_graded': total_students_graded,
    }


def compute_active_users_trends(AuditLog, now, hours=24):
    """
    Compute active user trends from audit log login events.
    Returns list of {time, users} dicts.
    """
    active_users_trends = []
    try:
        last_start = now - datetime.timedelta(hours=hours)
        recent_login_logs = list(AuditLog.objects.filter(
            action='login',
            timestamp__gte=last_start
        ).values('user', 'timestamp'))

        for i in range(hours - 1, -1, -1):
            hour_start = now - datetime.timedelta(hours=i + 1)
            hour_end = now - datetime.timedelta(hours=i)
            users_in_hour = {
                log['user'] for log in recent_login_logs
                if log['timestamp'] and hour_start <= log['timestamp'] <= hour_end
            }
            active_users_trends.append({
                'time': hour_end.strftime('%H:00'),
                'users': len(users_in_hour)
            })
    except Exception as e:
        logger.error(f"Error calculating active users trends: {str(e)}")

    return active_users_trends


def compute_subject_performance(grades, limit=10):
    """
    Compute top subject performance from a grades queryset.
    Returns list of {name, avg_grade} dicts.
    """
    subject_perf = []
    try:
        subject_stats = grades.values('subject__name').annotate(
            avg_grade=Avg('raw_score')
        ).order_by('-avg_grade')[:limit]

        for s in subject_stats:
            subject_perf.append({
                'name': s['subject__name'],
                'avg_grade': round(float(s['avg_grade']), 1) if s['avg_grade'] else 0
            })
    except Exception as e:
        logger.error(f"Error fetching subject stats: {str(e)}")

    return subject_perf


def build_grade_distribution_response(distribution, total_grades):
    """
    Build the all_subjects response dict from a grade distribution.
    """
    labels = [
        ('outstanding', 'Outstanding'),
        ('very_satisfactory', 'Very Satisfactory'),
        ('satisfactory', 'Satisfactory'),
        ('fairly_satisfactory', 'Fairly Satisfactory'),
        ('below_75', 'Did Not Meet'),
    ]
    return {
        'counts': [{'name': label, 'value': distribution[key]} for key, label in labels],
        **{f'{key}_pct': round(distribution[key] / total_grades * 100) if total_grades else 0 for key, _ in labels},
        'total_count': total_grades,
    }


def build_general_average_response(buckets, total_students_graded):
    """
    Build the general_average response dict from GA buckets.
    """
    labels = [
        ('outstanding', 'Outstanding'),
        ('very_satisfactory', 'Very Satisfactory'),
        ('satisfactory', 'Satisfactory'),
        ('fairly_satisfactory', 'Fairly Satisfactory'),
        ('below_75', 'Did Not Meet'),
    ]
    return {
        'counts': [{'name': label, 'value': buckets[key]} for key, label in labels],
        **{f'{key}_pct': round(buckets[key] / total_students_graded * 100) if total_students_graded else 0 for key, _ in labels},
        'total_count': total_students_graded,
    }
