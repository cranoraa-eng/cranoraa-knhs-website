"""
Custom DRF throttle classes for fine-grained rate limiting.

Rates are configured in settings.REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'].
"""
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class AuthRateThrottle(AnonRateThrottle):
    """
    5 attempts per 15 minutes for unauthenticated auth endpoints:
    login, OTP request, password reset request.
    Keyed by IP address (anonymous).
    """
    scope = 'auth'


class CheckResultRateThrottle(AnonRateThrottle):
    """
    10 scratch-card grade lookups per hour per IP.
    Prevents brute-forcing registration numbers + card serials.
    """
    scope = 'check_result'


class EnrollmentRateThrottle(AnonRateThrottle):
    """
    20 enrollment form submissions per hour per IP.
    Prevents spam submissions of the public enrollment form.
    """
    scope = 'enrollment'
