import time
from django.utils.deprecation import MiddlewareMixin
from portal.models import APIRequestLog


class APIRequestLoggingMiddleware(MiddlewareMixin):
    """Middleware to log API requests for analytics"""
    
    def process_request(self, request):
        request.start_time = time.time()
        return None
    
    def process_response(self, request, response):
        # Only log API requests (not static files, admin, etc.)
        if not request.path.startswith('/api/'):
            return response

    # Skip high-frequency or sensitive endpoints to prevent table bloat
    skip_paths = (
        '/api/token/',
        '/api/token/refresh/',
        '/api/system/maintenance-status/',
        '/api/notifications/polling/',   # polling fallback — very frequent
        '/api/chat/messages/',           # chat message fetches — very frequent
    )
    if request.path.startswith(skip_paths):
        return response

        # Calculate response time
        if hasattr(request, 'start_time'):
            response_time = (time.time() - request.start_time) * 1000
        else:
            response_time = 0

        ip_address = self.get_client_ip(request)
        user = request.user if request.user.is_authenticated else None

        # Update last activity for authenticated users
        if user:
            from django.utils import timezone
            try:
                from accounts.models import User as UserModel
                UserModel.objects.filter(id=user.id).update(last_activity=timezone.now())
            except Exception:
                pass

        # Log the request — skip 2xx GET requests to reduce noise
        if not (request.method == 'GET' and 200 <= response.status_code < 300):
            try:
                APIRequestLog.objects.create(
                    endpoint=request.path[:255],
                    method=request.method,
                    status_code=response.status_code,
                    response_time_ms=round(response_time, 2),
                    ip_address=ip_address,
                    user=user
                )
            except Exception:
                pass

        return response
    
    def get_client_ip(self, request):
        """Get the client's IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
