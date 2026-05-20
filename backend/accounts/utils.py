import resend
import random
import string
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.hashers import make_password, check_password
from .models import OTP
import logging

logger = logging.getLogger(__name__)

# Configure Resend
resend.api_key = settings.RESEND_API_KEY

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

def send_resend_otp_email(email, code, user_name, otp_type='signup'):
    """Send an OTP email using Resend API."""
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

    # Resend forbids sending FROM generic providers like gmail.com
    from_email = settings.DEFAULT_FROM_EMAIL
    if "@gmail.com" in from_email.lower():
        from_email = "onboarding@resend.dev"
        logger.warning(f"Detected Gmail in DEFAULT_FROM_EMAIL. Falling back to onboarding@resend.dev for Resend compatibility.")

    try:
        params = {
            "from": from_email,
            "to": [email],
            "subject": f"KNHS Portal - {subject_text}",
            "html": html_content,
        }
        
        response = resend.Emails.send(params)
        logger.info(f"Resend API Response: {response}")
        
        # Check for error in response dictionary (common in Resend's Python SDK)
        if isinstance(response, dict) and response.get('error'):
            logger.error(f"Resend API Error: {response.get('error')}")
            return False
            
        return True
    except Exception as e:
        logger.error(f"CRITICAL: Failed to send email via Resend to {email}. Error: {str(e)}")
        return False
