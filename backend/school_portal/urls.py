"""
URL configuration for school_portal project.
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.conf import settings
from django.conf.urls.static import static

from django.db import connection
from django.db.utils import OperationalError

def home(request):
    db_status = "Not checked"
    db_error = None
    try:
        from django.db import connection
        connection.ensure_connection()
        db_status = "Connected"
    except Exception as e:
        db_status = "Error"
        db_error = str(e)
    
    return JsonResponse({
        "status": "backend is running",
        "database": {
            "status": db_status,
            "error": db_error
        },
        "environment": "production" if not settings.DEBUG else "development",
        "debug_mode": settings.DEBUG,
        "allowed_hosts": settings.ALLOWED_HOSTS
    })

urlpatterns = [
    path('', home),
    path('admin/', admin.site.urls),
    path('api/', include('accounts.urls')),
    path('api/', include('portal.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)