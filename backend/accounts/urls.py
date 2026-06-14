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
    health_check,
    RoomViewSet, TimeSlotViewSet, ScheduleViewSet,
    parent_dashboard_view, parent_child_detail_view,
    fcm_token_register, fcm_token_delete, test_push_notification,
    storage_analytics_view,
    onboarding_state_view,
    TicketViewSet, DepartmentContactViewSet,
)

app_name = 'accounts'

router = DefaultRouter()
router.register(r'classrooms', ClassroomViewSet, basename='classroom')
router.register(r'enrollments', StudentClassEnrollmentViewSet, basename='enrollment')
router.register(r'users', UserViewSet, basename='user')
router.register(r'announcements', AnnouncementViewSet, basename='announcement')
router.register(r'attendance', AttendanceViewSet, basename='attendance')
router.register(r'materials', LearningMaterialViewSet, basename='material')
router.register(r'subjects', SubjectViewSet, basename='subject')
router.register(r'classroom-subjects', ClassroomSubjectViewSet, basename='classroom-subject')
router.register(r'scratch-cards', ScratchCardViewSet, basename='scratch-card')
router.register(r'fees', FeeViewSet, basename='fee')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'enrollment-applications', EnrollmentApplicationViewSet, basename='enrollment-application')
router.register(r'assignments', AssignmentViewSet, basename='assignment')
router.register(r'submissions', SubmissionViewSet, basename='submission')
router.register(r'website-content', WebsiteContentViewSet, basename='website-content')
router.register(r'grades', GradeViewSet, basename='grade')
router.register(r'grade-reports', GradeReportViewSet, basename='grade-report')
router.register(r'chat/rooms', ChatRoomViewSet, basename='chat-room')
router.register(r'chat/messages', ChatMessageViewSet, basename='chat-message')
router.register(r'chat/reports', ReportedMessageViewSet, basename='chat-report')
router.register(r'friendships', FriendshipViewSet, basename='friendship')
router.register(r'rooms', RoomViewSet, basename='room')
router.register(r'time-slots', TimeSlotViewSet, basename='time-slot')
router.register(r'schedules', ScheduleViewSet, basename='schedule')
router.register(r'tickets', TicketViewSet, basename='ticket')
router.register(r'department-contacts', DepartmentContactViewSet, basename='department-contact')

urlpatterns = [
    path('health/', health_check, name='health_check'),
    path('login/', login_view, name='login'),
    path('logout/', logout_view, name='logout'),
    path('admin/create-user/', admin_create_user_view, name='admin_create_user'),
    path('force-password-change/', force_password_change_view, name='force_password_change'),
    path('auth/change-password/', change_password_view, name='change_password'),
    path('profile/', user_profile, name='profile'),
    path('student/profile/', student_profile, name='student_profile'),
    path('onboarding/state/', onboarding_state_view, name='onboarding_state'),
    path('student/calendar/', student_calendar_view, name='student_calendar'),
    path('notifications/polling/', notifications_polling_view, name='notifications_polling'),
    path('teacher/stats/', teacher_dashboard_stats, name='teacher_stats'),
    path('student/dashboard/stats/', student_dashboard_stats, name='student_dashboard_stats'),
    path('admin/stats/', admin_dashboard_stats, name='admin_stats'),
    path('attendance/summary/', AttendanceViewSet.as_view({'get': 'summary'}), name='attendance_summary'),
    path('grades/summary/', GradeViewSet.as_view({'get': 'summary'}), name='grade_summary'),
    path('admin/grade-distribution/', grade_distribution_stats, name='grade_distribution_stats'),
    path('admin/storage-analytics/', storage_analytics_view, name='storage_analytics'),
    path('check-result/', check_result, name='check_result'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', cookie_token_refresh_view, name='token_refresh'),  # httpOnly cookie-based refresh
    path('announcements/public/', public_announcements_view, name='public_announcements'),
    path('admin/system-metrics/', system_metrics_view, name='system_metrics'),
    path('admin/maintenance-feed/', maintenance_feed_view, name='maintenance_feed'),
    path('admin/maintenance-mode/', maintenance_mode_view, name='maintenance_mode'),
    path('admin/force-sync/', force_sync_view, name='force_sync'),
    path('admin/run-backup/', run_backup_view, name='run_backup'),
    path('admin/clear-cache/', clear_cache_view, name='clear_cache'),
    path('system/settings/', system_settings_view, name='system_settings'),
    path('system/maintenance-status/', maintenance_status_view, name='maintenance_status'),
    path('parent/dashboard/', parent_dashboard_view, name='parent_dashboard'),
    path('parent/child/<int:student_id>/', parent_child_detail_view, name='parent_child_detail'),
    path('fcm-tokens/', fcm_token_register, name='fcm_token_register'),
    path('fcm-tokens/delete/', fcm_token_delete, name='fcm_token_delete'),
    path('test-push/', test_push_notification, name='test_push_notification'),
    path('', include(router.urls)),
]
