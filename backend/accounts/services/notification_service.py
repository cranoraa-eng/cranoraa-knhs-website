"""
Service layer for notification-related business logic.
Centralizes notification creation with type-based helper functions.
"""
from ..models import Notification


def notify(recipient, notification_type, title, message, link=None):
    """
    Create a notification. This is the primary entry point for all notifications.
    
    Returns the created Notification instance.
    """
    return Notification.objects.create(
        recipient=recipient,
        notification_type=notification_type,
        title=title,
        message=message,
        link=link,
    )


def notify_grade_posted(student, teacher_name, subject_name, quarter, score, link='/grades'):
    """Notify student that a grade was posted."""
    return notify(
        recipient=student,
        notification_type='grade',
        title='Grade Posted',
        message=f'{teacher_name} posted your {subject_name} grade for Q{quarter}: {score}.',
        link=link,
    )


def notify_enrollment_submitted(admin_users, application):
    """Notify admins of a new enrollment application."""
    for admin in admin_users:
        notify(
            recipient=admin,
            notification_type='system',
            title='New Enrollment Application',
            message=f'{application.full_name} submitted a Grade {application.grade_level} application ({application.enrollment_number}).',
            link='/enrollment-management',
        )


def notify_enrollment_approved(student, classroom_name):
    """Notify student that their enrollment was approved."""
    return notify(
        recipient=student,
        notification_type='system',
        title='Enrollment Approved',
        message=f'Your enrollment has been approved! You have been assigned to {classroom_name}.',
        link='/dashboard',
    )


def notify_new_message(recipient, sender_name, room_label, preview_text, link='/messages'):
    """Notify user of a new chat message."""
    return notify(
        recipient=recipient,
        notification_type='message',
        title=f'New message from {sender_name}',
        message=f'{room_label}: {preview_text}',
        link=link,
    )


def notify_ticket_assigned(user, ticket_id, assigner_name, subject, link='/communication-center'):
    """Notify user they were assigned a ticket."""
    return notify(
        recipient=user,
        notification_type='message',
        title=f'New ticket: {ticket_id}',
        message=f'{assigner_name}: {subject}',
        link=link,
    )


def notify_ticket_replied(user, ticket_id, sender_name, link='/communication-center'):
    """Notify user of a ticket reply."""
    return notify(
        recipient=user,
        notification_type='message',
        title=f'Reply on ticket {ticket_id}',
        message=f'{sender_name} replied to your ticket.',
        link=link,
    )


def notify_assignment_posted(students, assignment, teacher_name, link='/materials'):
    """Notify students of a new assignment."""
    for student in students:
        notify(
            recipient=student,
            notification_type='announcement',
            title='New Assignment',
            message=f'{teacher_name} posted a new {assignment.get_assignment_type_display()}: {assignment.title}',
            link=link,
        )


def notify_attendance_marked(student, status, date, subject_name=None, link='/attendance'):
    """Notify student of attendance marking."""
    scope = f" ({subject_name})" if subject_name else ""
    return notify(
        recipient=student,
        notification_type='attendance',
        title=f'Attendance{scope}',
        message=f'Your attendance for {date} has been marked as {status}.',
        link=link,
    )
