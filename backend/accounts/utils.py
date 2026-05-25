from mailjet_rest import Client
import random
import string
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.hashers import make_password, check_password
from .models import OTP
import logging
import os
import secrets

logger = logging.getLogger(__name__)

def upload_to_supabase(file, folder="profiles"):
    """
    Uploads a file to Supabase Storage and returns the public URL.
    Returns (url, error_message)
    """
    # Sanitize and validate settings
    url = (settings.SUPABASE_URL or "").strip().strip("'").strip('"')
    key = (settings.SUPABASE_KEY or "").strip().strip("'").strip('"')
    bucket = (settings.SUPABASE_BUCKET or "profile-pictures").strip().strip("'").strip('"')

    if not url or not key:
        missing = []
        if not url: missing.append("SUPABASE_URL")
        if not key: missing.append("SUPABASE_KEY (or SUPABASE_SERVICE_ROLE_KEY)")
        return None, f"Supabase configuration missing: {', '.join(missing)}"

    if not url.startswith(('http://', 'https://')):
        return None, f"Storage Error: Invalid URL format. SUPABASE_URL must start with https://. Current: {url[:10]}..."

    try:
        from supabase import create_client, Client as SupabaseClient
        supabase: SupabaseClient = create_client(url, key)
        
        # Generate unique filename
        ext = os.path.splitext(file.name)[1].lower()
        if not ext:
            ext = '.jpg'
        filename = f"{folder}/{secrets.token_hex(8)}{ext}"
        
        # Read file content
        file.seek(0)
        content = file.read()
        
        # Check file size (e.g., 5MB limit)
        if len(content) > 5 * 1024 * 1024:
            return None, "File too large (max 5MB)"
            
        # Upload
        try:
            res = supabase.storage.from_(bucket).upload(
                path=filename,
                file=content,
                file_options={"content-type": file.content_type or "image/jpeg"}
            )
            
            # For some versions of the library, we need to check the response
            if hasattr(res, 'error') and res.error:
                return None, f"Supabase Error: {res.error.get('message', 'Unknown error')}"
                
        except Exception as upload_err:
            # If upload fails, it might be because the bucket doesn't exist
            err_msg = str(upload_err)
            if "bucket" in err_msg.lower() or "not found" in err_msg.lower():
                return None, f"Storage bucket '{bucket}' not found. Please create it in Supabase and set it to Public."
            raise upload_err

        # Construct public URL manually for maximum compatibility
        # Format: [SUPABASE_URL]/storage/v1/object/public/[BUCKET]/[FILENAME]
        base_url = url.rstrip('/')
        public_url = f"{base_url}/storage/v1/object/public/{bucket}/{filename}"
        
        logger.info(f"Successfully uploaded profile picture: {public_url}")
        return public_url, None
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Supabase upload error: {error_msg}")
        import traceback
        logger.error(traceback.format_exc())
        return None, f"Storage Error: {error_msg}"

# Configure Mailjet
def get_mailjet_client():
    api_key = settings.MAILJET_API_KEY
    secret_key = settings.MAILJET_SECRET_KEY
    sender_email = settings.MAILJET_SENDER_EMAIL
    
    if not api_key or not secret_key:
        logger.error("CRITICAL: Mailjet API keys are missing in settings!")
        return None
        
    # Log configuration for debugging (masked)
    masked_key = f"{api_key[:4]}...{api_key[-4:]}" if api_key and len(api_key) > 8 else "INVALID"
    logger.info(f"Mailjet attempting send from: {sender_email} using API Key: {masked_key}")
    
    return Client(auth=(api_key, secret_key), version='v3.1')

def generate_otp_code(length=6):
    """Generate a secure random OTP code."""
    return ''.join(random.choices(string.digits, k=length))

def create_otp(user, otp_type='signup', expiry_minutes=10):
    """Create a new OTP for a user and return the plain code."""
    # Deactivate any existing unused OTPs of the same type
    OTP.objects.filter(user=user, otp_type=otp_type, is_used=False).update(is_used=True)
    
    code = generate_otp_code()
    hashed_code = make_password(code)
    expires_at = timezone.now() + timedelta(minutes=expiry_minutes)
    
    OTP.objects.create(
        user=user,
        hashed_code=hashed_code,
        otp_type=otp_type,
        expires_at=expires_at
    )
    
    return code

def verify_otp_code(user, code, otp_type='signup'):
    """Verify an OTP code for a user. Returns (success: bool, message: str)."""
    otp = OTP.objects.filter(
        user=user,
        otp_type=otp_type,
        is_used=False,
        expires_at__gt=timezone.now()
    ).last()

    if not otp:
        # Check if there is an expired OTP to give a better message
        expired = OTP.objects.filter(user=user, otp_type=otp_type, is_used=False).last()
        if expired:
            return False, "Verification code has expired. Please request a new one."
        return False, "No active verification code found. Please request a new one."

    if check_password(code, otp.hashed_code):
        otp.is_used = True
        otp.save()
        return True, "Verification successful."
    return False, "Invalid verification code. Please try again."

def check_user_moderation(user):
    """
    Checks if a user is muted or suspended.
    Returns (is_allowed, reason)
    """
    try:
        # Refresh to get latest status
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
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error checking moderation for user {user.username}: {str(e)}")
        return True, "" # Default to allowed if check fails to prevent blocking everyone

def broadcast_mailjet_email(emails, subject, message_html, message_text=None):
    """Broadcast a single message to multiple recipients via Mailjet."""
    recipients = [{"Email": email} for email in emails]
    data = {
        'Messages': [
            {
                "From": {
                    "Email": settings.MAILJET_SENDER_EMAIL,
                    "Name": "KNHS School Portal"
                },
                "To": recipients,
                "Subject": subject,
                "HTMLPart": message_html,
                "TextPart": message_text or subject
            }
        ]
    }

    try:
        mailjet = get_mailjet_client()
        if not mailjet:
            return False, "API Keys missing"
        result = mailjet.send.create(data=data)
        return result.status_code == 200, f"Status: {result.status_code}"
    except Exception as e:
        logger.error(f"Failed to broadcast Mailjet email: {str(e)}")
        return False, str(e)

def send_mailjet_email(email, subject, message_html, message_text=None, user_name="User"):
    """Generic helper to send any email via Mailjet API."""
    data = {
        'Messages': [
            {
                "From": {
                    "Email": settings.MAILJET_SENDER_EMAIL,
                    "Name": "KNHS School Portal"
                },
                "To": [
                    {
                        "Email": email,
                        "Name": user_name
                    }
                ],
                "Subject": subject,
                "HTMLPart": message_html,
                "TextPart": message_text or subject
            }
        ]
    }

    try:
        mailjet = get_mailjet_client()
        if not mailjet:
            return False, "API Keys missing"
        result = mailjet.send.create(data=data)
        if result.status_code == 200:
            logger.info(f"Mailjet email sent successfully to {email}")
            return True, "Success"
        else:
            error_data = result.json()
            logger.error(f"Mailjet API Error: {result.status_code} - {error_data}")
            # If it's a 401, it's definitely credentials
            if result.status_code == 401:
                logger.error("AUTHENTICATION ERROR: Check your MAILJET_API_KEY and MAILJET_SECRET_KEY.")
            # If it's a 403, it's often the sender email not being verified
            elif result.status_code == 403:
                logger.error(f"PERMISSION ERROR: Ensure {settings.MAILJET_SENDER_EMAIL} is a verified sender in your Mailjet dashboard.")
            return False, f"Mailjet error {result.status_code}"
    except Exception as e:
        logger.error(f"CRITICAL: Failed to send email via Mailjet to {email}. Error: {str(e)}")
        return False, str(e)

def send_mailjet_otp_email(email, code, user_name, otp_type='signup'):
    """Send an OTP email using Mailjet API."""
    subject_text = "Verify your account" if otp_type == 'signup' else "Reset your password"
    title = "Account Verification" if otp_type == 'signup' else "Password Reset"
    body_text = f"Your verification code for the KNHS School Portal is: {code}" if otp_type == 'signup' else f"Your password reset code for the KNHS School Portal is: {code}"

    html_content = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #9333ea; text-align: center;">{title}</h2>
        <p>Hi {user_name},</p>
        <p>{body_text}</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1f2937;">{code}</span>
        </div>
        <p style="color: #6b7280; font-size: 14px;">This code will expire in 10 minutes. Do not share this code with anyone.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">&copy; 2026 KNHS School Portal. All rights reserved.</p>
    </div>
    """

    data = {
        'Messages': [
            {
                "From": {
                    "Email": settings.MAILJET_SENDER_EMAIL,
                    "Name": "KNHS School Portal"
                },
                "To": [
                    {
                        "Email": email,
                        "Name": user_name
                    }
                ],
                "Subject": f"KNHS Portal - {subject_text}",
                "HTMLPart": html_content,
                "TextPart": body_text
            }
        ]
    }

    try:
        mailjet = get_mailjet_client()
        if not mailjet:
            return False, "Mailjet API keys are missing. Please check server environment variables."
        
        result = mailjet.send.create(data=data)
        if result.status_code == 200:
            logger.info(f"Mailjet email sent successfully to {email}")
            return True, "Email sent successfully."
        else:
            error_info = result.json()
            logger.error(f"Mailjet API Error: {result.status_code} - {error_info}")
            
            error_msg = f"Mailjet Error {result.status_code}"
            if result.status_code == 401:
                error_msg = "Mailjet Authentication failed. Invalid API Key or Secret."
            elif result.status_code == 403:
                error_msg = f"Mailjet Permission denied. Ensure {settings.MAILJET_SENDER_EMAIL} is a verified sender."
            
            return False, error_msg
    except Exception as e:
        err_str = str(e)
        logger.error(f"CRITICAL: Failed to send email via Mailjet to {email}. Error: {err_str}")
        return False, f"Unexpected error: {err_str}"
