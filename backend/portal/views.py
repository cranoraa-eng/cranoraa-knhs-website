from rest_framework import viewsets, status, filters
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import Announcement, SchoolClass, Department, AcademicYear, AuditLog, DatabaseBackup
from .serializers import (
    AnnouncementSerializer,
    SchoolClassSerializer, DepartmentSerializer, AcademicYearSerializer,
    AuditLogSerializer, DatabaseBackupSerializer
)
from accounts.models import User
import logging

logger = logging.getLogger(__name__)

def log_audit_action(user, action, model_name, object_id=None, object_repr='', description='', request=None):
    """Helper function to log audit actions"""
    ip_address = None
    user_agent = ''
    
    if request:
        ip_address = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]  # Limit to 500 chars
    
    try:
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
    except Exception as e:
        # Don't crash the whole request if audit logging fails
        logger.error(f"Audit log failed: {str(e)}")

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


class AuditLogViewSet(viewsets.ModelViewSet):
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]
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
    
    stats = {
        'total_students': User.objects.filter(role='student').count(),
        'total_teachers': User.objects.filter(role='teacher').count(),
        'total_classes': SchoolClass.objects.count(),
        'total_announcements': Announcement.objects.count(),
        'total_attendance_records': 0,  # Placeholder
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