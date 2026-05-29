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
    Uploads a file to Supabase Storage and returns the public URL.
    Returns (url, error_message).
    """
    url = (settings.SUPABASE_URL or "").strip().strip("'").strip('"')
    key = (settings.SUPABASE_KEY or "").strip().strip("'").strip('"')
    bucket = (settings.SUPABASE_BUCKET or "profile-pictures").strip().strip("'").strip('"')

    if not url or not key:
        missing = []
        if not url:
            missing.append("SUPABASE_URL")
        if not key:
            missing.append("SUPABASE_KEY (or SUPABASE_SERVICE_ROLE_KEY)")
        return None, f"Supabase configuration missing: {', '.join(missing)}"

    if not url.startswith(('http://', 'https://')):
        return None, f"Storage Error: Invalid URL format. SUPABASE_URL must start with https://."

    try:
        from supabase import create_client, Client as SupabaseClient

        supabase: SupabaseClient = create_client(url, key)

        ext = os.path.splitext(file.name)[1].lower() or '.jpg'
        filename = f"{folder}/{secrets.token_hex(8)}{ext}"

        file.seek(0)
        content = file.read()

        if len(content) > 5 * 1024 * 1024:
            return None, "File too large (max 5MB)"

        try:
            storage_client = supabase.storage.from_(bucket)
            res = storage_client.upload(
                path=filename,
                file=content,
                file_options={"content-type": file.content_type or "image/jpeg"}
            )

            if isinstance(res, dict) and 'error' in res:
                return None, f"Supabase Error: {res.get('message', res.get('error'))}"

            if hasattr(res, 'error') and res.error:
                err_msg = res.error.get('message', str(res.error)) if isinstance(res.error, dict) else str(res.error)
                return None, f"Supabase Error: {err_msg}"

        except Exception as upload_err:
            err_msg = str(upload_err)
            if "'dict' object has no attribute 'text'" in err_msg:
                return None, "Storage Error: Supabase client internal error — check SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and that the bucket is set to Public."
            if "bucket" in err_msg.lower() or "not found" in err_msg.lower():
                return None, f"Storage bucket '{bucket}' not found. Create it in Supabase and set it to Public."
            return None, f"Upload Failed: {err_msg}"

        public_url = f"{url.rstrip('/')}/storage/v1/object/public/{bucket}/{filename}"
        logger.info(f"Successfully uploaded file: {public_url}")
        return public_url, None

    except Exception as e:
        logger.error(f"Supabase upload error: {str(e)}", exc_info=True)
        return None, "File upload failed. Please try again."


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
