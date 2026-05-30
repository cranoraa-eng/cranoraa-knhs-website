"""
Custom DRF throttle classes for fine-grained rate limiting.

Rates are configured in settings.REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'].
"""
from rest_framework.throttling import AnonRateThrottle


def _login_identifier(request):
    """Extract login id from POST body for per-account throttle keys."""
    try:
        data = request.data
        ident = data.get('email') or data.get('username') or ''
        return str(ident).lower().strip()[:128]
    except Exception:
        return ''


class AuthRateThrottle(AnonRateThrottle):
    """
    Login / password-reset throttle keyed by IP + username/email.

    Using IP alone blocks entire schools on a shared NAT after a few attempts.
    Per-identifier keys allow many users on one network while still limiting
    brute-force against a single account.
    """
    scope = 'auth'

    def get_cache_key(self, request, view):
        ident = _login_identifier(request)
        if ident:
            return self.cache_format % {
                'scope': self.scope,
                'ident': f'{self.get_ident(request)}:{ident}',
            }
        return self.cache_format % {
            'scope': self.scope,
            'ident': self.get_ident(request),
        }


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
