from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AnnouncementViewSet,
    SchoolClassViewSet, DepartmentViewSet, AcademicYearViewSet,
    AuditLogViewSet, DatabaseBackupViewSet,
    admin_stats, pending_fees, teacher_progress
)

router = DefaultRouter()
router.register(r'announcements', AnnouncementViewSet, basename='announcement')
router.register(r'admin/classes', SchoolClassViewSet, basename='schoolclass')
router.register(r'admin/departments', DepartmentViewSet, basename='department')
router.register(r'admin/academic-years', AcademicYearViewSet, basename='academicyear')
router.register(r'admin/audit-logs', AuditLogViewSet, basename='auditlog')
router.register(r'admin/backups', DatabaseBackupViewSet, basename='databasebackup')

urlpatterns = [
    path('', include(router.urls)),
    path('admin/stats/', admin_stats, name='admin-stats'),
    path('admin/pending-fees/', pending_fees, name='pending-fees'),
    path('admin/teacher-progress/', teacher_progress, name='teacher-progress'),
]