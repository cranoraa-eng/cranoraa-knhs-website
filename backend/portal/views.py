from rest_framework import viewsets, status, filters
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from accounts.models import User, Attendance, ChatMessage, Grade, StudentClassEnrollment, Classroom, Subject, Announcement as AccountAnnouncement
from .models import Announcement, SchoolClass, Department, AcademicYear, AuditLog, DatabaseBackup
from .serializers import (
    AnnouncementSerializer,
    SchoolClassSerializer, DepartmentSerializer, AcademicYearSerializer,
    AuditLogSerializer, DatabaseBackupSerializer
)
from django.db.models import Count, Avg, Q
from django.utils import timezone
import datetime
import logging

logger = logging.getLogger(__name__)

def log_audit_action(user, action, model_name, object_id=None, object_repr='', description='', request=None):
    """Helper function to log audit actions"""
    ip_address = None
    user_agent = ''
    
    if request:
        ip_address = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]  # Limit to 500 chars
    
    AuditLog.objects.create(
        user=user,
        action=action,
        model_name=model_name,
        object_id=object_id,
        object_repr=object_repr[:255],  # Limit to 255 chars
        description=description[:1000],  # Limit to 1000 chars
        ip_address=ip_address,
        user_agent=user_agent
    )

def get_client_ip(request):
    """Helper function to get client IP address"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.filter(is_active=True)
    serializer_class = AnnouncementSerializer
    permission_classes = [AllowAny]  # Public access for announcements
    
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


# Admin Management ViewSets
class SchoolClassViewSet(viewsets.ModelViewSet):
    queryset = SchoolClass.objects.all()
    serializer_class = SchoolClassSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role != 'admin':
            return SchoolClass.objects.none()
        return super().get_queryset()


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role != 'admin':
            return Department.objects.none()
        return super().get_queryset()


class StorageViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def stats(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=403)
            
        from django.conf import settings
        import os
        
        media_root = settings.MEDIA_ROOT
        total_size = 0
        file_counts = {}
        
        if os.path.exists(media_root):
            for root, dirs, files in os.walk(media_root):
                folder_name = os.path.relpath(root, media_root)
                if folder_name == '.': folder_name = 'root'
                
                count = len(files)
                size = sum(os.path.getsize(os.path.join(root, f)) for f in files)
                
                total_size += size
                file_counts[folder_name] = {
                    'count': count,
                    'size_mb': round(size / (1024 * 1024), 2)
                }
                
        return Response({
            'total_size_mb': round(total_size / (1024 * 1024), 2),
            'breakdown': file_counts
        })

    @action(detail=False, methods=['post'])
    def cleanup(self, request):
        """Remove unreferenced files from storage (Admin only)"""
        if request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=403)
            
        # Logic to find unreferenced files would go here.
        # For safety, we'll just return a success message for now.
        return Response({'status': 'Cleanup simulation successful. No files removed for safety.'})


class AcademicYearViewSet(viewsets.ModelViewSet):
    queryset = AcademicYear.objects.all()
    serializer_class = AcademicYearSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role != 'admin':
            return AcademicYear.objects.none()
        return super().get_queryset()
    
    @action(detail=True, methods=['post'])
    def set_active(self, request, pk=None):
        year = self.get_object()
        year.is_active = True
        year.save()
        return Response({'status': 'Academic year set as active'})


from rest_framework.pagination import PageNumberPagination

class AcademicYearViewSet(viewsets.ModelViewSet):
    queryset = AcademicYear.objects.all()
    serializer_class = AcademicYearSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == 'admin':
            return AcademicYear.objects.all()
        return AcademicYear.objects.filter(is_active=True)

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        if request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=403)
        year = self.get_object()
        year.is_active = True
        year.save()
        return Response({'status': f'Academic Year {year.name} activated'})

class SemesterViewSet(viewsets.ModelViewSet):
    queryset = Semester.objects.all()
    serializer_class = SemesterSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        year_id = self.request.query_params.get('academic_year')
        queryset = Semester.objects.all()
        if year_id:
            queryset = queryset.filter(academic_year_id=year_id)
        if self.request.user.role != 'admin':
            queryset = queryset.filter(is_active=True)
        return queryset

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        if request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=403)
        semester = self.get_object()
        semester.is_active = True
        semester.save()
        return Response({'status': f'Semester {semester.semester_type} activated'})


class AuditLogPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 1000

class AuditLogViewSet(viewsets.ModelViewSet):
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = AuditLogPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__username', 'action', 'model_name', 'description']
    ordering_fields = ['timestamp', 'action', 'user']
    ordering = ['-timestamp']
    
    def get_queryset(self):
        if self.request.user.role != 'admin':
            return AuditLog.objects.none()
        
        queryset = AuditLog.objects.all()
        user_id = self.request.query_params.get('user')
        action = self.request.query_params.get('action')
        model_name = self.request.query_params.get('model_name')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        if action:
            queryset = queryset.filter(action=action)
        if model_name:
            queryset = queryset.filter(model_name=model_name)
        if date_from:
            queryset = queryset.filter(timestamp__gte=date_from)
        if date_to:
            queryset = queryset.filter(timestamp__lte=date_to)
        
        return queryset

    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        if self.request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=403)
        
        ids = request.data.get('ids', [])
        if not ids:
            return Response({'error': 'No IDs provided'}, status=400)
            
        AuditLog.objects.filter(id__in=ids).delete()
        return Response({'status': f'Deleted {len(ids)} logs'})

    @action(detail=False, methods=['post'])
    def clear_all(self, request):
        if self.request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=403)
            
        AuditLog.objects.all().delete()
        return Response({'status': 'All logs cleared'})

    @action(detail=False, methods=['get'])
    def stats(self, request):
        if self.request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=403)
        
        count = AuditLog.objects.count()
        # Estimate size: ~1KB per log entry on average
        size_bytes = count * 1024 
        size_mb = round(size_bytes / (1024 * 1024), 2)
        
        return Response({
            'count': count,
            'size_mb': size_mb,
            'max_mb': 50.0  # Recommended max size before cleanup
        })


class DatabaseBackupViewSet(viewsets.ModelViewSet):
    queryset = DatabaseBackup.objects.all()
    serializer_class = DatabaseBackupSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role != 'admin':
            return DatabaseBackup.objects.none()
        return super().get_queryset()
    
    def create(self, request):
        """Create a new database backup"""
        try:
            from django.conf import settings
            import os
            from datetime import datetime
            import subprocess
            
            # Generate filename
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'backup_{timestamp}.sql'
            
            # Get database settings
            db_settings = settings.DATABASES['default']
            db_name = db_settings['NAME']
            
            # Create backup directory if it doesn't exist
            backup_dir = os.path.join(settings.BASE_DIR, 'backups')
            os.makedirs(backup_dir, exist_ok=True)
            backup_path = os.path.join(backup_dir, filename)
            
            # Create SQL dump based on database type
            if db_settings['ENGINE'] == 'django.db.backends.sqlite3':
                # SQLite backup
                import shutil
                shutil.copy2(db_name, backup_path)
            elif db_settings['ENGINE'] == 'django.db.backends.postgresql':
                # PostgreSQL backup using pg_dump
                user = db_settings['USER']
                password = db_settings['PASSWORD']
                host = db_settings['HOST']
                port = db_settings['PORT']
                
                env = os.environ.copy()
                env['PGPASSWORD'] = password
                
                cmd = [
                    'pg_dump',
                    '-h', host,
                    '-p', str(port),
                    '-U', user,
                    '-f', backup_path,
                    db_name
                ]
                subprocess.run(cmd, env=env, check=True)
            else:
                return Response(
                    {'error': 'Unsupported database engine'}, 
                    status=400
                )
            
            # Get file size
            size_bytes = os.path.getsize(backup_path)
            size_mb = size_bytes / (1024 * 1024)
            size_str = f'{size_mb:.2f} MB'
            
            # Create database record
            backup = DatabaseBackup.objects.create(
                filename=filename,
                size=size_str,
                created_by=request.user
            )
            
            serializer = self.get_serializer(backup)
            return Response(serializer.data, status=201)
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=500
            )
    
    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """Restore from a backup"""
        try:
            from django.conf import settings
            import os
            import subprocess
            
            backup = self.get_object()
            backup_dir = os.path.join(settings.BASE_DIR, 'backups')
            backup_path = os.path.join(backup_dir, backup.filename)
            
            if not os.path.exists(backup_path):
                return Response(
                    {'error': 'Backup file not found'}, 
                    status=404
                )
            
            db_settings = settings.DATABASES['default']
            db_name = db_settings['NAME']
            
            # Restore based on database type
            if db_settings['ENGINE'] == 'django.db.backends.sqlite3':
                # SQLite restore
                import shutil
                shutil.copy2(backup_path, db_name)
            elif db_settings['ENGINE'] == 'django.db.backends.postgresql':
                # PostgreSQL restore using psql
                user = db_settings['USER']
                password = db_settings['PASSWORD']
                host = db_settings['HOST']
                port = db_settings['PORT']
                
                env = os.environ.copy()
                env['PGPASSWORD'] = password
                
                cmd = [
                    'psql',
                    '-h', host,
                    '-p', str(port),
                    '-U', user,
                    '-d', db_name,
                    '-f', backup_path
                ]
                subprocess.run(cmd, env=env, check=True)
            else:
                return Response(
                    {'error': 'Unsupported database engine'}, 
                    status=400
                )
            
            return Response({'status': 'Backup restored successfully'})
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=500
            )
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download a backup file"""
        try:
            from django.conf import settings
            import os
            from django.http import FileResponse
            
            backup = self.get_object()
            backup_dir = os.path.join(settings.BASE_DIR, 'backups')
            backup_path = os.path.join(backup_dir, backup.filename)
            
            if not os.path.exists(backup_path):
                return Response(
                    {'error': 'Backup file not found'}, 
                    status=404
                )
            
            return FileResponse(
                open(backup_path, 'rb'),
                as_attachment=True,
                filename=backup.filename
            )
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=500
            )


# Admin Dashboard API Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_stats(request):
    if request.user.role != 'admin':
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    now = timezone.now()
    today = now.date()
    five_mins_ago = now - datetime.timedelta(minutes=5)
    last_7_days = [today - datetime.timedelta(days=i) for i in range(6, -1, -1)]
    
    # Core Stats
    total_students = User.objects.filter(role='student').count()
    total_teachers = User.objects.filter(role='teacher').count()
    total_classes = SchoolClass.objects.count()
    total_announcements = Announcement.objects.count()
    active_users = User.objects.filter(last_activity__gte=five_mins_ago).count()
    
    # Attendance Stats
    attendance_records = Attendance.objects.filter(date=today)
    total_attendance = attendance_records.count()
    present_count = attendance_records.filter(status__in=['present', 'late']).count()
    attendance_rate = round((present_count / total_attendance * 100), 1) if total_attendance > 0 else 0
    
    # Attendance Trends (Last 7 Days)
    attendance_trends = []
    for day in last_7_days:
        day_records = Attendance.objects.filter(date=day)
        day_total = day_records.count()
        day_present = day_records.filter(status__in=['present', 'late']).count()
        attendance_trends.append({
            'date': day.strftime('%Y-%m-%d'),
            'rate': round((day_present / day_total * 100), 1) if day_total > 0 else 0
        })
        
    # Grade Summaries
    grades = Grade.objects.filter(grade_type='final_grade', transmuted_score__isnull=False)
    grade_distribution = {
        'Outstanding': grades.filter(transmuted_score__gte=90).count(),
        'Very Satisfactory': grades.filter(transmuted_score__gte=85, transmuted_score__lt=90).count(),
        'Satisfactory': grades.filter(transmuted_score__gte=80, transmuted_score__lt=85).count(),
        'Fairly Satisfactory': grades.filter(transmuted_score__gte=75, transmuted_score__lt=80).count(),
        'Did Not Meet Expectations': grades.filter(transmuted_score__lt=75).count(),
    }
    
    # Recent Activity
    recent_announcements = Announcement.objects.filter(is_active=True).order_by('-created_at')[:5]
    recent_logins = AuditLog.objects.filter(action_type='login').order_by('-timestamp')[:5]
    latest_messages = ChatMessage.objects.order_by('-timestamp')[:5]
    
    # Active Users Over Time (Last 24 Hours)
    active_users_trends = []
    for i in range(23, -1, -1):
        hour_start = now - datetime.timedelta(hours=i+1)
        hour_end = now - datetime.timedelta(hours=i)
        count = AuditLog.objects.filter(
            action_type='login',
            timestamp__gte=hour_start,
            timestamp__lte=hour_end
        ).values('user').distinct().count()
        active_users_trends.append({
            'time': hour_end.strftime('%H:00'),
            'users': count
        })

    stats = {
        'cards': {
            'total_students': total_students,
            'total_teachers': total_teachers,
            'total_classes': total_classes,
            'total_announcements': total_announcements,
            'active_users': active_users,
            'attendance_rate': attendance_rate,
        },
        'charts': {
            'attendance_trends': attendance_trends,
            'grade_distribution': [
                {'name': k, 'value': v} for k, v in grade_distribution.items()
            ],
            'active_users_trends': active_users_trends,
        },
        'widgets': {
            'recent_announcements': AnnouncementSerializer(recent_announcements, many=True).data,
            'recent_logins': AuditLogSerializer(recent_logins, many=True).data,
            'latest_messages': [
                {
                    'id': m.id,
                    'sender': m.sender.username,
                    'content': m.content[:50],
                    'timestamp': m.timestamp,
                    'room_id': m.room_id
                } for m in latest_messages
            ],
        },
        'pending_approvals': User.objects.filter(is_approved=False, is_verified=True).count(),
    }
    return Response(stats)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pending_fees(request):
    if request.user.role != 'admin':
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Placeholder data - replace with actual fee model
    fees = [
        {
            'id': 1,
            'student_name': 'John Doe',
            'grade_section': 'Grade 7 - Diamond',
            'balance': 15000,
        },
        {
            'id': 2,
            'student_name': 'Jane Smith',
            'grade_section': 'Grade 8 - Ruby',
            'balance': 8500,
        },
    ]
    return Response(fees)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def teacher_progress(request):
    if request.user.role != 'admin':
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Placeholder data - replace with actual progress tracking
    progress = [
        {
            'id': 1,
            'subject': 'Mathematics',
            'progress': 75,
            'teacher_name': 'Mr. Johnson',
            'subjects_count': 5,
            'submission_status': 'partial',
        },
        {
            'id': 2,
            'subject': 'Science',
            'progress': 90,
            'teacher_name': 'Ms. Williams',
            'subjects_count': 4,
            'submission_status': 'complete',
        },
    ]
    return Response(progress)