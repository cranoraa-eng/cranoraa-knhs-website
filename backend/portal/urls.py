from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AnnouncementViewSet,
    SchoolClassViewSet, DepartmentViewSet, AcademicYearViewSet,
    SemesterViewSet,
    AuditLogViewSet, DatabaseBackupViewSet,
    admin_stats, pending_fees, teacher_progress
)

router = DefaultRouter()
router.register(r'announcements', AnnouncementViewSet, basename='announcement')
router.register(r'admin/classes', SchoolClassViewSet, basename='class')
router.register(r'admin/departments', DepartmentViewSet, basename='department')
router.register(r'admin/academic-years', AcademicYearViewSet, basename='academic-year')
router.register(r'admin/semesters', SemesterViewSet, basename='semester')
router.register(r'admin/audit-logs', AuditLogViewSet, basename='audit-log')
router.register(r'admin/storage', StorageViewSet, basename='storage')
router.register(r'admin/backups', DatabaseBackupViewSet, basename='backup')

urlpatterns = [
    path('', include(router.urls)),
    path('admin/stats/', admin_stats, name='admin-stats'),
    path('admin/pending-fees/', pending_fees, name='pending-fees'),
    path('admin/teacher-progress/', teacher_progress, name='teacher-progress'),
]