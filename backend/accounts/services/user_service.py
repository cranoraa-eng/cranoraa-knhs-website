"""
Service layer for user-related business logic.
Centralizes user creation, password management, and account approval.
"""
import secrets
from django.db import transaction

from ..roles import Role


def create_student_user(username, first_name, last_name, password=None, email=None,
                        lrn=None, grade_level=None, sex=None, advisory_classroom=None):
    """
    Create a student user with profile and link enrollment applications.
    
    Returns (user, temp_password).
    """
    from ..models import User, Profile, EnrollmentApplication, StudentClassEnrollment

    if not password:
        password = secrets.token_urlsafe(12)

    with transaction.atomic():
        user = User(
            username=username,
            email=email or None,
            first_name=first_name,
            last_name=last_name,
            role=Role.STUDENT,
            is_verified=bool(email),
            is_approved=True,
            must_change_password=True,
            account_status='active',
        )
        user.set_password(password)
        user.save()

        profile_defaults = {}
        if lrn:
            profile_defaults['lrn'] = lrn
        if grade_level:
            profile_defaults['grade_level'] = grade_level
        if sex:
            profile_defaults['sex'] = sex
        if profile_defaults:
            Profile.objects.update_or_create(user=user, defaults=profile_defaults)

        EnrollmentApplication.objects.filter(
            lrn=username,
            status__in=['pending', 'under_review', 'approved']
        ).update(
            enrolled_student=user,
            status='enrolled',
            temp_password_display=password,
        )

        if advisory_classroom:
            StudentClassEnrollment.objects.get_or_create(
                student=user, classroom=advisory_classroom
            )

    return user, password


def create_staff_user(email, first_name, last_name, password=None, title=None, sex=None):
    """
    Create a staff/teacher user with profile.
    
    Returns (user, temp_password).
    """
    from ..models import User, Profile

    if not password:
        password = secrets.token_urlsafe(12)

    with transaction.atomic():
        user = User(
            username=email,
            email=email,
            first_name=first_name,
            last_name=last_name,
            role=Role.STAFF,
            staff_title='teacher',
            is_approved=True,
            is_verified=False,
            must_change_password=True,
            account_status='active',
        )
        user.set_password(password)
        user.save()

        profile_defaults = {}
        if title:
            profile_defaults['title'] = title
        if sex:
            profile_defaults['sex'] = sex
        if profile_defaults:
            Profile.objects.update_or_create(user=user, defaults=profile_defaults)

    return user, password


def reset_user_password(user, new_password=None):
    """
    Reset a user's password and update enrollment application.
    
    Returns the new password.
    """
    from ..models import EnrollmentApplication

    if not new_password:
        new_password = secrets.token_urlsafe(12)

    user.set_password(new_password)
    user.must_change_password = True
    user.save()

    EnrollmentApplication.objects.filter(
        enrolled_student=user,
        status='enrolled'
    ).update(temp_password_display=new_password)

    return new_password


def approve_user_account(user, approved_by=None):
    """
    Approve a user account and log the action.
    
    Returns (success, message).
    """
    from ..utils import log_audit_action

    if user.is_approved:
        return False, f'{user.email} is already approved.'

    user.is_approved = True
    user.save()

    if approved_by:
        log_audit_action(
            user=approved_by,
            action='approve',
            model_name='User',
            object_id=user.id,
            object_repr=str(user),
            description=f'Admin approved account for {user.email}',
        )

    return True, f'Account for {user.email} has been approved successfully.'
