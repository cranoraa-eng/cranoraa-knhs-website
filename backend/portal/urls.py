from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AnnouncementViewSet,
    SchoolClassViewSet, DepartmentViewSet, AcademicYearViewSet,
    SemesterViewSet,
    AuditLogViewSet, DatabaseBackupViewSet, StorageViewSet,
    pending_fees, teacher_progress
)

app_name = 'portal'

router = DefaultRouter()
router.register(r'v1/public-announcements', AnnouncementViewSet, basename='public-announcement')
router.register(r'v1/admin/classes', SchoolClassViewSet, basename='class')
router.register(r'v1/admin/departments', DepartmentViewSet, basename='department')
router.register(r'v1/admin/academic-years', AcademicYearViewSet, basename='academic-year')
router.register(r'v1/admin/semesters', SemesterViewSet, basename='semester')
router.register(r'v1/admin/audit-logs', AuditLogViewSet, basename='audit-log')
router.register(r'v1/admin/storage', StorageViewSet, basename='storage')
router.register(r'v1/admin/backups', DatabaseBackupViewSet, basename='backup')

urlpatterns = [
    path('', include(router.urls)),
    path('v1/admin/pending-fees/', pending_fees, name='pending-fees'),
    path('v1/admin/teacher-progress/', teacher_progress, name='teacher-progress'),
]
