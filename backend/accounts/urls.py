from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView
from .views import (
    login_view, logout_view, cookie_token_refresh_view,
    admin_create_user_view, force_password_change_view, change_password_view, user_profile, student_profile,
    teacher_dashboard_stats, student_dashboard_stats, ClassroomViewSet, StudentClassEnrollmentViewSet, UserViewSet,
    AnnouncementViewSet, AttendanceViewSet, LearningMaterialViewSet, SubjectViewSet,
    ClassroomSubjectViewSet, ScratchCardViewSet, FeeViewSet, NotificationViewSet,
    EnrollmentApplicationViewSet, AssignmentViewSet, SubmissionViewSet, WebsiteContentViewSet, GradeViewSet, GradeReportViewSet,
    ChatRoomViewSet, ChatMessageViewSet, ReportedMessageViewSet, FriendshipViewSet, admin_dashboard_stats, grade_distribution_stats, check_result, public_announcements_view,
    student_calendar_view, notifications_polling_view, system_metrics_view,
    maintenance_feed_view, maintenance_mode_view, force_sync_view, run_backup_view, clear_cache_view,
    system_settings_view, maintenance_status_view,
    RoomViewSet, TimeSlotViewSet, ScheduleViewSet,
    parent_dashboard_view, parent_child_detail_view,
    fcm_token_register, fcm_token_delete,
    storage_analytics_view,
    onboarding_state_view,
    TicketViewSet, DepartmentContactViewSet,
)

app_name = 'accounts'

router = DefaultRouter()
router.register(r'v1/classrooms', ClassroomViewSet, basename='classroom')
router.register(r'v1/enrollments', StudentClassEnrollmentViewSet, basename='enrollment')
router.register(r'v1/users', UserViewSet, basename='user')
router.register(r'v1/announcements', AnnouncementViewSet, basename='announcement')
router.register(r'v1/attendance', AttendanceViewSet, basename='attendance')
router.register(r'v1/materials', LearningMaterialViewSet, basename='material')
router.register(r'v1/subjects', SubjectViewSet, basename='subject')
router.register(r'v1/classroom-subjects', ClassroomSubjectViewSet, basename='classroom-subject')
router.register(r'v1/scratch-cards', ScratchCardViewSet, basename='scratch-card')
router.register(r'v1/fees', FeeViewSet, basename='fee')
router.register(r'v1/notifications', NotificationViewSet, basename='notification')
router.register(r'v1/enrollment-applications', EnrollmentApplicationViewSet, basename='enrollment-application')
router.register(r'v1/assignments', AssignmentViewSet, basename='assignment')
router.register(r'v1/submissions', SubmissionViewSet, basename='submission')
router.register(r'v1/website-content', WebsiteContentViewSet, basename='website-content')
router.register(r'v1/grades', GradeViewSet, basename='grade')
router.register(r'v1/grade-reports', GradeReportViewSet, basename='grade-report')
router.register(r'v1/chat/rooms', ChatRoomViewSet, basename='chat-room')
router.register(r'v1/chat/messages', ChatMessageViewSet, basename='chat-message')
router.register(r'v1/chat/reports', ReportedMessageViewSet, basename='chat-report')
router.register(r'v1/friendships', FriendshipViewSet, basename='friendship')
router.register(r'v1/rooms', RoomViewSet, basename='room')
router.register(r'v1/time-slots', TimeSlotViewSet, basename='time-slot')
router.register(r'v1/schedules', ScheduleViewSet, basename='schedule')
router.register(r'v1/tickets', TicketViewSet, basename='ticket')
router.register(r'v1/department-contacts', DepartmentContactViewSet, basename='department-contact')

# NOTE: school_portal/urls.py mounts these under 'api/', so paths here should NOT include 'api/'.
# Final URL = api/ + path below  e.g. api/v1/login/
urlpatterns = [
    path('v1/login/', login_view, name='login'),
    path('v1/logout/', logout_view, name='logout'),
    path('v1/admin/create-user/', admin_create_user_view, name='admin_create_user'),
    path('v1/force-password-change/', force_password_change_view, name='force_password_change'),
    path('v1/auth/change-password/', change_password_view, name='change_password'),
    path('v1/profile/', user_profile, name='profile'),
    path('v1/student/profile/', student_profile, name='student_profile'),
    path('v1/onboarding/state/', onboarding_state_view, name='onboarding_state'),
    path('v1/student/calendar/', student_calendar_view, name='student_calendar'),
    path('v1/notifications/polling/', notifications_polling_view, name='notifications_polling'),
    path('v1/teacher/stats/', teacher_dashboard_stats, name='teacher_stats'),
    path('v1/student/dashboard/stats/', student_dashboard_stats, name='student_dashboard_stats'),
    path('v1/admin/stats/', admin_dashboard_stats, name='admin_stats'),
    path('v1/attendance/summary/', AttendanceViewSet.as_view({'get': 'summary'}), name='attendance_summary'),
    path('v1/grades/summary/', GradeViewSet.as_view({'get': 'summary'}), name='grade_summary'),
    path('v1/admin/grade-distribution/', grade_distribution_stats, name='grade_distribution_stats'),
    path('v1/admin/storage-analytics/', storage_analytics_view, name='storage_analytics'),
    path('v1/check-result/', check_result, name='check_result'),
    path('v1/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('v1/token/refresh/', cookie_token_refresh_view, name='token_refresh'),
    path('v1/announcements/public/', public_announcements_view, name='public_announcements'),
    path('v1/admin/system-metrics/', system_metrics_view, name='system_metrics'),
    path('v1/admin/maintenance-feed/', maintenance_feed_view, name='maintenance_feed'),
    path('v1/admin/maintenance-mode/', maintenance_mode_view, name='maintenance_mode'),
    path('v1/admin/force-sync/', force_sync_view, name='force_sync'),
    path('v1/admin/run-backup/', run_backup_view, name='run_backup'),
    path('v1/admin/clear-cache/', clear_cache_view, name='clear_cache'),
    path('v1/system/settings/', system_settings_view, name='system_settings'),
    path('v1/system/maintenance-status/', maintenance_status_view, name='maintenance_status'),
    path('v1/parent/dashboard/', parent_dashboard_view, name='parent_dashboard'),
    path('v1/parent/child/<int:student_id>/', parent_child_detail_view, name='parent_child_detail'),
    path('v1/fcm-tokens/', fcm_token_register, name='fcm_token_register'),
    path('v1/fcm-tokens/delete/', fcm_token_delete, name='fcm_token_delete'),
    path('', include(router.urls)),
]
