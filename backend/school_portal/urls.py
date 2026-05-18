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
    db_engine = "Unknown"
    try:
        db_engine = connection.settings_dict.get('ENGINE', 'Unknown')
        connection.ensure_connection()
        db_status = "Connected"
    except Exception as e:
        db_status = f"Error: {str(e)}"
    
    return JsonResponse({
        "status": "backend is running",
        "database": {
            "status": db_status,
            "engine": db_engine
        },
        "environment": "production" if not settings.DEBUG else "development"
    })

urlpatterns = [
    path('', home),
    path('admin/', admin.site.urls),
    path('api/', include('accounts.urls')),
    path('api/', include('portal.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)