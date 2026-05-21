from mailjet_rest import Client
import random
import string
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.hashers import make_password, check_password
from .models import OTP
import logging

logger = logging.getLogger(__name__)

# Configure Mailjet
def get_mailjet_client():
    if not settings.MAILJET_API_KEY or not settings.MAILJET_SECRET_KEY:
        logger.error("Mailjet API keys are missing in settings!")
        return None
    return Client(auth=(settings.MAILJET_API_KEY, settings.MAILJET_SECRET_KEY), version='v3.1')

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
    """Verify an OTP code for a user."""
    otp = OTP.objects.filter(
        user=user, 
        otp_type=otp_type, 
        is_used=False
    ).order_by('-created_at').first()
    
    if not otp:
        return False, "No active verification code found."
    
    if otp.is_expired():
        return False, "Verification code has expired."
    
    if check_password(code, otp.hashed_code):
        otp.is_used = True
        otp.save()
        return True, "Verification successful."
    
    return False, "Invalid verification code."

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
