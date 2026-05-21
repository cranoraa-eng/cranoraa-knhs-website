from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    login_view, admin_create_user_view, force_password_change_view, verify_otp_view, resend_otp_view, user_profile, student_profile, 
    teacher_dashboard_stats, ClassroomViewSet, StudentClassEnrollmentViewSet, UserViewSet, 
    AnnouncementViewSet, AttendanceViewSet, LearningMaterialViewSet, SubjectViewSet, 
    ClassroomSubjectViewSet, ScratchCardViewSet, FeeViewSet, NotificationViewSet, 
    EnrollmentApplicationViewSet, AssignmentViewSet, SubmissionViewSet, WebsiteContentViewSet, GradeViewSet, GradeReportViewSet, 
    ChatRoomViewSet, ChatMessageViewSet, ReportedMessageViewSet, FriendshipViewSet, admin_dashboard_stats, grade_distribution_stats, check_result, public_announcements_view, 
    student_calendar_view, notifications_polling_view, system_metrics_view, 
    maintenance_feed_view, maintenance_mode_view, force_sync_view, run_backup_view, clear_cache_view,
    system_settings_view, maintenance_status_view,
    password_reset_request_view, password_reset_confirm_view
)

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

urlpatterns = [
    path('login/', login_view, name='login'),
    path('admin/create-user/', admin_create_user_view, name='admin_create_user'),
    path('force-password-change/', force_password_change_view, name='force_password_change'),
    path('password-reset/', password_reset_request_view, name='password_reset_request'),
    path('password-reset-confirm/', password_reset_confirm_view, name='password_reset_confirm'),
    path('verify-otp/', verify_otp_view, name='verify_otp'),
    path('resend-otp/', resend_otp_view, name='resend_otp'),
    path('profile/', user_profile, name='profile'),
    path('student/profile/', student_profile, name='student_profile'),
    path('student/calendar/', student_calendar_view, name='student_calendar'),
    path('notifications/polling/', notifications_polling_view, name='notifications_polling'),
    path('teacher/stats/', teacher_dashboard_stats, name='teacher_stats'),
    path('admin/stats/', admin_dashboard_stats, name='admin_stats'),
    path('attendance/summary/', AttendanceViewSet.as_view({'get': 'summary'}), name='attendance_summary'),
    path('grades/summary/', GradeViewSet.as_view({'get': 'summary'}), name='grade_summary'),
    path('admin/grade-distribution/', grade_distribution_stats, name='grade_distribution_stats'),
    path('check-result/', check_result, name='check_result'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('announcements/public/', public_announcements_view, name='public_announcements'),
    path('admin/system-metrics/', system_metrics_view, name='system_metrics'),
    path('admin/maintenance-feed/', maintenance_feed_view, name='maintenance_feed'),
    path('admin/maintenance-mode/', maintenance_mode_view, name='maintenance_mode'),
    path('admin/force-sync/', force_sync_view, name='force_sync'),
    path('admin/run-backup/', run_backup_view, name='run_backup'),
    path('admin/clear-cache/', clear_cache_view, name='clear_cache'),
    path('system/settings/', system_settings_view, name='system_settings'),
    path('system/maintenance-status/', maintenance_status_view, name='maintenance_status'),
    path('', include(router.urls)),
]