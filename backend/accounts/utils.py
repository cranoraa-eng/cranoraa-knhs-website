"""
accounts/utils.py

Email sending has been removed — the portal no longer uses Mailjet or OTP
verification. All email helper functions are kept as no-op stubs so that
any remaining call sites fail gracefully rather than crashing at import time.

Active utilities:
  - upload_to_supabase   — profile picture uploads
  - check_user_moderation — mute/suspend checks for chat
"""
import os
import secrets
import logging

from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


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
