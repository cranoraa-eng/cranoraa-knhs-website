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
        
        # Calculate response time
        if hasattr(request, 'start_time'):
            response_time = (time.time() - request.start_time) * 1000  # Convert to ms
        else:
            response_time = 0
        
        # Get IP address
        ip_address = self.get_client_ip(request)
        
        # Get user if authenticated
        user = request.user if request.user.is_authenticated else None
        
        # Update last activity for authenticated users
        if user and user.is_authenticated:
            from django.utils import timezone
            try:
                # Update without triggering signals to avoid recursion or overhead
                from accounts.models import User
                User.objects.filter(id=user.id).update(last_activity=timezone.now())
            except Exception:
                pass

        # Log the request
        try:
            APIRequestLog.objects.create(
                endpoint=request.path,
                method=request.method,
                status_code=response.status_code,
                response_time_ms=response_time,
                ip_address=ip_address,
                user=user
            )
        except Exception:
            # Don't break the request if logging fails
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
