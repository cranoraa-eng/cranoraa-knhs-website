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
    return JsonResponse({"status": "backend is running"})

urlpatterns = [
    path('', home),
    path('admin/', admin.site.urls),
    path('api/', include('accounts.urls')),
    path('api/', include('portal.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)