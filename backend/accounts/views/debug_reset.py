"""Temporary debug endpoint to reset admin password and clear Axes lockouts.

SECURITY: Protected by ADMIN_RESET_KEY env var. Remove this file and the
env var after use.
"""
import os
import logging
from django.http import JsonResponse
from django.views.decorators.http import require_GET

logger = logging.getLogger(__name__)


@require_GET
def reset_admin_view(request):
    key = request.GET.get('key', '')
    expected = os.environ.get('ADMIN_RESET_KEY', '')

    if not expected or key != expected:
        return JsonResponse({'error': 'Invalid or missing key'}, status=403)

    from accounts.models import User

    try:
        user = User.objects.get(email='admin@school.com')
    except User.DoesNotExist:
        return JsonResponse({'error': 'admin@school.com not found'}, status=404)

    new_password = 'admin@school2024'
    user.set_password(new_password)
    user.account_status = 'active'
    user.is_active = True
    user.is_approved = True
    user.must_change_password = False
    user.save()

    cleared = 0
    try:
        from axes.models import AccessAttempt
        deleted, _ = AccessAttempt.objects.filter(
            username__iexact=user.username
        ).delete()
        cleared += deleted
        deleted2, _ = AccessAttempt.objects.filter(
            username__iexact=user.email
        ).delete()
        cleared += deleted2
    except Exception:
        pass

    try:
        from axes.models import AccessLog
        AccessLog.objects.filter(username__iexact=user.username).delete()
    except Exception:
        pass

    logger.warning(f"ADMIN RESET: password changed for {user.email}, {cleared} Axes records cleared")

    return JsonResponse({
        'message': f'Admin password reset to: {new_password}',
        'email': user.email,
        'axes_cleared': cleared,
    })
