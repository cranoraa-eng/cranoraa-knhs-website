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

import socket
from django.core.mail import get_connection

def test_email_connection(request):
    results = {}
    hosts = ['smtp.gmail.com', 'smtp.googlemail.com']
    ports = [465, 587]
    
    for host in hosts:
        for port in ports:
            try:
                s = socket.create_connection((host, port), timeout=5)
                results[f"{host}:{port}"] = "Reachable"
                s.close()
            except Exception as e:
                results[f"{host}:{port}"] = f"Unreachable: {str(e)}"
    
    # Also test actual Django email connection
    try:
        connection = get_connection()
        connection.open()
        results["django_connection"] = "Success"
        connection.close()
    except Exception as e:
        results["django_connection"] = f"Failed: {str(e)}"

    return JsonResponse(results)

urlpatterns = [
    path('', home, name='home'),
    path('test-email/', test_email_connection, name='test_email'),
    path('admin/', admin.site.urls),
    path('api/', include('accounts.urls')),
    path('api/', include('portal.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)