"""
accounts/utils.py

Email sending has been removed — the portal no longer uses Mailjet or OTP
verification. All email helper functions are kept as no-op stubs so that
any remaining call sites fail gracefully rather than crashing at import time.

Active utilities:
  - upload_to_supabase   — profile picture uploads
  - check_user_moderation — mute/suspend checks for chat
  - log_audit_action      — audit trail logging (moved from portal.views)
  - generate_temp_password — secure random password with validation
"""
import os
import secrets
import string
import logging

from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


# ─── Audit logging ────────────────────────────────────────────────────────────

def log_audit_action(user, action, model_name='', object_id=None, object_repr='',
                     description='', request=None, action_type=None):
    """
    Log an audit action. Moved here from portal.views to avoid circular imports.
    Import this from accounts.utils instead of portal.views.
    """
    from .models import AuditLog

    ip_address = None
    user_agent = ''
    if request:
        ip_address = request.META.get('REMOTE_ADDR') or request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0].strip() or None
        user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]

    AuditLog.objects.create(
        user=user,
        action=action,
        action_type=action_type,
        model_name=model_name,
        object_id=object_id,
        object_repr=str(object_repr)[:255],
        description=description,
        ip_address=ip_address,
        user_agent=user_agent,
    )


# ─── Password generation ─────────────────────────────────────────────────────

def generate_temp_password(length=12, max_attempts=50):
    """
    Generate a random temporary password that meets Django's password validators.
    Raises RuntimeError if a valid password cannot be generated within max_attempts.
    """
    from django.contrib.auth.password_validation import validate_password
    from django.core.exceptions import ValidationError as DjangoValidationError

    chars = string.ascii_letters + string.digits + '!@#$%^&*'
    for _ in range(max_attempts):
        password = ''.join(secrets.choice(chars) for _ in range(length))
        try:
            validate_password(password)
            return password
        except DjangoValidationError:
            continue
    raise RuntimeError(f"Could not generate a valid password after {max_attempts} attempts")


# ─── Email stubs (email sending removed) ─────────────────────────────────────

def send_mailjet_email(email, subject, message_html, message_text=None, user_name="User"):
    """No-op stub — email sending has been removed from this portal."""
    logger.debug(f"send_mailjet_email called but email is disabled (to={email}, subject={subject})")
    return False, "Email sending is disabled."


def broadcast_mailjet_email(emails, subject, message_html, message_text=None):
    """No-op stub — email sending has been removed from this portal."""
    logger.debug(f"broadcast_mailjet_email called but email is disabled (subject={subject})")
    return False, "Email sending is disabled."


def get_mailjet_health_status():
    """Returns a static 'disabled' status since email has been removed."""
    return {
        "configured": False,
        "status": "disabled",
        "summary": "Email sending has been removed from this portal.",
        "sender_email": "",
        "checks": {
            "api_credentials": False,
            "sender_email": False,
        },
        "issues": ["Email sending is disabled."],
    }


# ─── Supabase file upload ─────────────────────────────────────────────────────

def upload_to_supabase(file, folder="profiles"):
    """
    Backward-compatible wrapper — uploads to the 'profile-pictures' bucket.
    New code should call accounts.storage.upload_file() directly.
    """
    from .storage import upload_file
    return upload_file(file, bucket_key='profile-pictures', folder=folder)


# ─── Moderation check ─────────────────────────────────────────────────────────

def check_user_moderation(user):
    """
    Checks if a user is muted or suspended.
    Returns (is_allowed: bool, reason: str).
    """
    try:
        user.refresh_from_db()

        if user.account_status == 'suspended':
            return False, "Your account has been suspended."

        if hasattr(user, 'profile'):
            if user.profile.is_suspended:
                return False, "Your account has been suspended."
            if user.profile.mute_until and user.profile.mute_until > timezone.now():
                remaining = user.profile.mute_until - timezone.now()
                hours = int(remaining.total_seconds() // 3600)
                minutes = int((remaining.total_seconds() % 3600) // 60)
                time_str = f"{hours}h {minutes}m" if hours > 0 else f"{minutes}m"
                return False, f"You are muted for another {time_str}."

        return True, ""
    except Exception as e:
        logger.error(f"Error checking moderation for user {user.username}: {str(e)}")
        return True, ""  # Default to allowed if check fails
