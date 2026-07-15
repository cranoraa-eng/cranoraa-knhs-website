from collections import defaultdict
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import (
    User, StudentClassEnrollment, Attendance, Grade,
    Schedule, Notification, Announcement, Assignment, GradeReport, ParentLink,
)
from ..serializers import full_name
from ..pdf_export import generate_report_card_pdf


# ─── Parent Dashboard Views ───────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def parent_dashboard_view(request):
    """
    Returns a comprehensive dashboard summary for a parent user.
    Optimized to batch all queries — no N+1.
    """
    user = request.user
    if user.role != 'parent':
        return Response({'error': 'This endpoint is for parents only.'}, status=403)

    profile = getattr(user, 'profile', None)
    if not profile:
        return Response({'error': 'Parent profile not found.'}, status=404)

    linked_students = profile.linked_students.filter(role='student', is_approved=True)
    student_ids = list(linked_students.values_list('id', flat=True))
    students_map = {s.id: s for s in linked_students}

    if not student_ids:
        return Response({'children': [], 'total_children': 0, 'announcements': []})

    from django.utils import timezone as tz
    import datetime
    today = tz.now().date()
    month_start = today.replace(day=1)
    week_ago = today - datetime.timedelta(days=7)
    today_name = today.strftime('%A').lower()

    # Batch-fetch all attendance for these students (month + recent)
    all_att = Attendance.objects.filter(
        student_id__in=student_ids, date__gte=month_start, date__lte=today
    )
    recent_att = Attendance.objects.filter(
        student_id__in=student_ids, date__gte=week_ago
    ).order_by('-date')

    # Batch-fetch all final grades
    all_grades = Grade.objects.filter(
        student_id__in=student_ids, grade_type='final_grade', raw_score__isnull=False
    ).select_related('subject').order_by('-quarter', 'subject__name')

    # Batch-fetch all enrollments
    enrollments = StudentClassEnrollment.objects.filter(
        student_id__in=student_ids
    ).select_related('classroom', 'classroom__teacher')
    enrollment_map = {e.student_id: e for e in enrollments}

    # Batch-fetch all today's schedules for all classrooms
    classroom_ids = [e.classroom_id for e in enrollments if e.classroom_id]
    all_schedules = Schedule.objects.filter(
        classroom_id__in=classroom_ids, is_active=True, time_slot__day=today_name
    ).select_related('classroom', 'subject', 'teacher', 'room', 'time_slot').order_by('time_slot__start_time')
    from collections import defaultdict
    schedules_by_classroom = defaultdict(list)
    for s in all_schedules:
        schedules_by_classroom[s.classroom_id].append(s)

    # Batch-fetch all notifications
    all_notifs = Notification.objects.filter(
        recipient_id__in=student_ids,
        notification_type__in=['grade', 'attendance', 'announcement', 'system'],
        is_read=False
    ).order_by('-created_at')

    # Group data by student
    att_by_student = defaultdict(list)
    for r in all_att:
        att_by_student[r.student_id].append(r)

    recent_att_by_student = defaultdict(list)
    for r in recent_att:
        if len(recent_att_by_student[r.student_id]) < 7:
            recent_att_by_student[r.student_id].append(r)

    grades_by_student = defaultdict(list)
    for g in all_grades:
        grades_by_student[g.student_id].append(g)

    notifs_by_student = defaultdict(list)
    for n in all_notifs:
        if len(notifs_by_student[n.recipient_id]) < 5:
            notifs_by_student[n.recipient_id].append(n)

    # Build response
    children_data = []
    for sid in student_ids:
        student = students_map[sid]

        # Attendance
        att_records = att_by_student.get(sid, [])
        weekday_records = [r for r in att_records if r.date.weekday() < 5]
        present_count = sum(1 for r in weekday_records if r.status in ['present', 'late'])
        att_rate = round(present_count / len(weekday_records) * 100, 1) if weekday_records else None

        recent_att_data = [
            {'date': r.date.isoformat(), 'status': r.status}
            for r in recent_att_by_student.get(sid, [])
        ]

        # Grades
        grades = grades_by_student.get(sid, [])
        grades_data = [
            {
                'subject_name': g.subject.name,
                'subject_code': g.subject.code,
                'quarter': g.quarter,
                'score': float(g.raw_score),
                'remarks': g.computed_remarks,
            }
            for g in grades[:20]
        ]
        general_avg = None
        if grades:
            general_avg = round(sum(float(g.raw_score) for g in grades) / len(grades), 2)

        # Classroom
        enrollment = enrollment_map.get(sid)
        classroom_name = enrollment.classroom.name if enrollment else None
        adviser_name = full_name(enrollment.classroom.teacher) if enrollment and enrollment.classroom.teacher else None

        # Today's schedule
        schedule_data = []
        if enrollment and enrollment.classroom_id in schedules_by_classroom:
            schedule_data = [
                {
                    'subject': s.subject.name,
                    'teacher': full_name(s.teacher),
                    'room': s.room.name if s.room else None,
                    'start_time': s.time_slot.start_time.strftime('%I:%M %p'),
                    'end_time': s.time_slot.end_time.strftime('%I:%M %p'),
                }
                for s in schedules_by_classroom[enrollment.classroom_id]
            ]

        # Notifications
        notif_data = [
            {
                'title': n.title,
                'message': n.message,
                'type': n.notification_type,
                'created_at': n.created_at.isoformat(),
            }
            for n in notifs_by_student.get(sid, [])
        ]

        children_data.append({
            'id': student.id,
            'username': student.username,
            'first_name': student.first_name,
            'last_name': student.last_name,
            'full_name': full_name(student),
            'profile_picture': getattr(getattr(student, 'profile', None), 'profile_picture', None),
            'grade_level': getattr(getattr(student, 'profile', None), 'grade_level', None),
            'classroom_name': classroom_name,
            'adviser_name': adviser_name,
            'attendance_rate': att_rate,
            'attendance_present': present_count,
            'attendance_total': len(weekday_records),
            'recent_attendance': recent_att_data,
            'general_average': general_avg,
            'grades': grades_data,
            'today_schedule': schedule_data,
            'recent_notifications': notif_data,
        })

    # School-wide announcements for parents
    from django.db.models import Q as DQ
    announcements = Announcement.objects.filter(
        status='live'
    ).filter(
        DQ(target_audience__in=['all', 'parents'])
    ).order_by('-is_pinned', '-created_at')[:5]
    announcements_data = [
        {
            'id': a.id,
            'title': a.title,
            'content': a.content[:200],
            'category': a.category,
            'priority': a.priority,
            'created_at': a.created_at.isoformat(),
            'author_name': full_name(a.author),
        }
        for a in announcements
    ]

    return Response({
        'children': children_data,
        'total_children': len(children_data),
        'announcements': announcements_data,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def parent_child_detail_view(request, student_id):
    """
    Returns detailed data for a specific linked child.
    Parents can only access their own linked students.
    """
    user = request.user
    if user.role != 'parent':
        return Response({'error': 'This endpoint is for parents only.'}, status=403)

    profile = getattr(user, 'profile', None)
    if not profile:
        return Response({'error': 'Parent profile not found.'}, status=404)

    # Security: verify the student is actually linked to this parent
    linked_ids = list(profile.linked_students.values_list('id', flat=True))
    if int(student_id) not in linked_ids:
        return Response({'error': 'You do not have access to this student.'}, status=403)

    try:
        student = User.objects.get(id=student_id, role='student')
    except User.DoesNotExist:
        return Response({'error': 'Student not found.'}, status=404)

    # Full attendance history
    attendance = Attendance.objects.filter(student=student).order_by('-date')[:60]
    att_data = [
        {'date': r.date.isoformat(), 'status': r.status, 'remarks': r.remarks}
        for r in attendance
    ]

    # All grades
    grades = Grade.objects.filter(
        student=student, grade_type='final_grade', raw_score__isnull=False
    ).select_related('subject').order_by('-academic_year', '-quarter', 'subject__name')
    grades_data = [
        {
            'subject_name': g.subject.name,
            'subject_code': g.subject.code,
            'quarter': g.quarter,
            'academic_year': g.academic_year,
            'score': float(g.raw_score),
            'remarks': g.computed_remarks,
        }
        for g in grades
    ]

    # Full weekly schedule
    enrollment = StudentClassEnrollment.objects.filter(student=student).select_related(
        'classroom__teacher'
    ).first()
    weekly_schedule = []
    if enrollment:
        schedules = Schedule.objects.filter(
            classroom=enrollment.classroom, is_active=True
        ).select_related('subject', 'teacher', 'room', 'time_slot').order_by(
            'time_slot__day', 'time_slot__start_time'
        )
        weekly_schedule = [
            {
                'day': s.time_slot.day,
                'day_display': s.time_slot.get_day_display(),
                'subject': s.subject.name,
                'teacher': full_name(s.teacher),
                'room': s.room.name if s.room else None,
                'start_time': s.time_slot.start_time.strftime('%I:%M %p'),
                'end_time': s.time_slot.end_time.strftime('%I:%M %p'),
            }
            for s in schedules
        ]

    # Assignments
    if enrollment:
        assignments = Assignment.objects.filter(
            classroom=enrollment.classroom
        ).select_related('subject').order_by('-due_date')[:10]
        assignments_data = [
            {
                'id': a.id,
                'title': a.title,
                'subject': a.subject.name,
                'due_date': a.due_date.isoformat(),
                'points': a.points,
            }
            for a in assignments
        ]
    else:
        assignments_data = []

    return Response({
        'student': {
            'id': student.id,
            'full_name': full_name(student),
            'username': student.username,
            'profile_picture': getattr(getattr(student, 'profile', None), 'profile_picture', None),
            'grade_level': getattr(getattr(student, 'profile', None), 'grade_level', None),
            'classroom_name': enrollment.classroom.name if enrollment else None,
            'adviser_name': full_name(enrollment.classroom.teacher) if enrollment and enrollment.classroom.teacher else None,
        },
        'attendance': att_data,
        'grades': grades_data,
        'weekly_schedule': weekly_schedule,
        'assignments': assignments_data,
    })


# ─── Parent Enhancement Endpoints ────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def parent_report_card_pdf(request, student_id):
    """Generate report card PDF for a student — accessible by parent, student, admin, or staff."""
    user = request.user
    quarter = request.query_params.get('quarter')
    school_year = request.query_params.get('school_year')
    if not quarter:
        return Response({'error': 'quarter is required'}, status=400)
    quarter = int(quarter)
    
    # Verify access
    if user.role == 'parent':
        if not ParentLink.objects.filter(parent=user, student_id=student_id).exists():
            return Response({'error': 'Access denied'}, status=403)
    elif user.role == 'student' and user.id != student_id:
        return Response({'error': 'Access denied'}, status=403)
    
    try:
        student = User.objects.get(id=student_id, role='student')
    except User.DoesNotExist:
        return Response({'error': 'Student not found'}, status=404)
    
    # Get grade report
    filters = {'student': student, 'quarter': quarter}
    if school_year:
        filters['school_year'] = school_year
    report = GradeReport.objects.filter(**filters).first()
    if not report:
        return Response({'error': 'No grade report found'}, status=404)
    
    # Get grades
    grades = Grade.objects.filter(
        student=student, quarter=quarter, grade_type='final_grade',
        academic_year=report.school_year
    ).select_related('subject')
    
    return generate_report_card_pdf(student, report, grades)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def parent_year_over_year(request, student_id):
    """Return year-over-year grade comparison for a student."""
    user = request.user
    if user.role == 'parent':
        if not ParentLink.objects.filter(parent=user, student_id=student_id).exists():
            return Response({'error': 'Access denied'}, status=403)
    elif user.role == 'student' and user.id != student_id:
        return Response({'error': 'Access denied'}, status=403)
    
    try:
        student = User.objects.get(id=student_id, role='student')
    except User.DoesNotExist:
        return Response({'error': 'Student not found'}, status=404)
    
    # Group general averages by academic year
    reports = GradeReport.objects.filter(
        student=student, general_average__isnull=False
    ).order_by('school_year', 'quarter')
    
    years = {}
    for r in reports:
        yr = r.school_year
        if yr not in years:
            years[yr] = {'school_year': yr, 'quarters': []}
        years[yr]['quarters'].append({
            'quarter': r.quarter,
            'general_average': float(r.general_average),
            'gpa': str(r.gpa) if r.gpa else None,
            'class_rank': r.class_rank,
            'total_subjects': r.total_subjects,
        })
    
    # Compute yearly averages
    result = []
    for yr, data in years.items():
        avgs = [q['general_average'] for q in data['quarters']]
        yearly_avg = round(sum(avgs) / len(avgs), 2) if avgs else None
        data['yearly_average'] = yearly_avg
        result.append(data)
    
    return Response({'student_id': student_id, 'years': result})
