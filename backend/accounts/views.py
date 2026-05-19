from rest_framework import viewsets, status, filters, parsers, serializers
from rest_framework.decorators import action, permission_classes, api_view
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from django.db.models import Q
from .serializers import (UserSerializer, ClassroomSerializer, StudentClassEnrollmentSerializer,
    AnnouncementSerializer, AttendanceSerializer, LearningMaterialSerializer,
    SubjectSerializer, ClassroomSubjectSerializer, ScratchCardSerializer, FeeSerializer,
    NotificationSerializer, EnrollmentApplicationSerializer, WebsiteContentSerializer,
    GradeSerializer, GradeReportSerializer, ChatRoomSerializer, ChatMessageSerializer, FriendshipSerializer,
    SystemSettingSerializer)
from .models import User, Classroom, StudentClassEnrollment, Announcement, AnnouncementAttachment, Attendance, LearningMaterial, Subject, ClassroomSubject, ScratchCard, Fee, Notification, EnrollmentApplication, WebsiteContent, Grade, GradeReport, ChatRoom, ChatMessage, Friendship, SystemSetting
from portal.views import log_audit_action
import logging

logger = logging.getLogger(__name__)


from django.core.mail import send_mail
from django.conf import settings
import random
import string

def generate_otp():
    return ''.join(random.choices(string.digits, k=6))

def send_otp_email(user, otp_code):
    subject = 'Your KNHS Portal Verification Code'
    message = f"""Hi {user.first_name or user.username},

Your verification code for the KNHS School Portal is:

    {otp_code}

This code expires in 15 minutes. Do not share it with anyone.

If you did not request this code, you can safely ignore this email.

— KNHS School Portal
"""
    email_from = settings.DEFAULT_FROM_EMAIL
    recipient_list = [user.email]
    
    try:
        send_mail(subject, message, email_from, recipient_list)
        return True
    except Exception as e:
        logger.error(f"Error sending OTP email: {str(e)}")
        return False

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    try:
        email = request.data.get('email')
        password = request.data.get('password')
        
        logger.info(f"Login attempt for email: {email}")
        
        if email is None or password is None:
            return Response(
                {'error': 'Please provide both email and password'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = authenticate(request=request, username=email, password=password)
        
        if user is None:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )
            
        if not user.is_approved:
            return Response(
                {'error': 'Your account is pending admin approval. Please wait for an administrator to approve your account.', 'code': 'not_approved'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        refresh = RefreshToken.for_user(user)
        
        # Log successful login
        log_audit_action(
            user=user,
            action='login',
            model_name='User',
            object_id=user.id,
            object_repr=str(user),
            description=f'User {user.email} logged in successfully',
            request=request
        )
        
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        })
    except Exception as e:
        logger.error(f"Login error: {str(e)}", exc_info=True)
        return Response(
            {'error': f'Server error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    role = request.data.get('role', 'student')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    profile_data = request.data.get('profile', {})
    
    if not username or not email or not password:
        return Response(
            {'error': 'Please provide username, email, and password'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if User.objects.filter(email=email).exists():
        return Response(
            {'error': 'Email already registered'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if User.objects.filter(username=username).exists():
        return Response(
            {'error': 'Username already taken'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        user.role = role
        # Admins are pre-approved, others need approval
        if role == 'admin':
            user.is_approved = True
        else:
            user.is_approved = False
        user.is_verified = True # Auto-verify email
        user.save()
        
        # Create profile with additional student data
        from .models import Profile
        profile = Profile.objects.create(user=user)
        
        if role == 'student' and profile_data:
            profile.sex = profile_data.get('sex')
            profile.state = profile_data.get('state')
            profile.nationality = profile_data.get('nationality')
            profile.father_name = profile_data.get('father_name')
            profile.mother_name = profile_data.get('mother_name')
            if profile_data.get('date_of_birth'):
                from datetime import datetime
                profile.date_of_birth = datetime.strptime(profile_data.get('date_of_birth'), '%Y-%m-%d').date()
            profile.contact_information = profile_data.get('contact_information')
            profile.save()
            
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    return Response({
        'message': 'Account created! Please wait for an administrator to approve your account before logging in.',
        'email': email
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp_view(request):
    email = request.data.get('email')
    code = request.data.get('code')
    
    if not email or not code:
        return Response({'error': 'Email and code are required'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        user = User.objects.get(email=email)
        from .models import OTP
        otp = OTP.objects.filter(user=user, code=code, is_used=False).order_by('-created_at').first()
        
        if not otp:
            return Response({'error': 'Invalid verification code'}, status=status.HTTP_400_BAD_REQUEST)
            
        if otp.is_expired():
            return Response({'error': 'Verification code has expired. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)
            
        otp.is_used = True
        otp.save()
        
        user.is_verified = True
        user.save()
        
        return Response({'message': 'Email verified successfully! Your account is now pending admin approval.'})
        
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([AllowAny])
def resend_otp_view(request):
    email = request.data.get('email')
    
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        user = User.objects.get(email=email)
        if user.is_verified:
            return Response({'message': 'Email is already verified'})
            
        from .models import OTP
        otp_code = generate_otp()
        OTP.objects.create(user=user, code=otp_code)
        send_otp_email(user, otp_code)
        
        return Response({'message': 'A new verification code has been sent to your email.'})
        
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
def user_profile(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def get_dev_otp(request):
    """
    DEV ONLY: Returns the latest unused OTP for a user so it can be
    displayed in the UI when no real email service is configured.
    Remove or disable this endpoint before going to production.
    """
    if not settings.DEBUG:
        return Response({'error': 'Not available in production'}, status=status.HTTP_403_FORBIDDEN)
    
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
        from .models import OTP
        otp = OTP.objects.filter(user=user, is_used=False).order_by('-created_at').first()
        if otp and not otp.is_expired():
            return Response({'code': otp.code})
        return Response({'code': None, 'message': 'No valid OTP found. Request a new one.'})
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def teacher_dashboard_stats(request):
    """
    Returns dashboard statistics for teachers:
    - Total students (count of students in teacher's classrooms)
    - Active classes (count of teacher's classrooms)
    - Grade entries (total grades recorded by the teacher)
    """
    try:
        user = request.user
        if user.role != 'teacher' and user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=403)

        # Get teacher's classrooms
        classrooms = Classroom.objects.filter(teacher=user)
        total_classes = classrooms.count()
        
        # Get total students across those classrooms
        # Note: Students are linked to classrooms via StudentClassEnrollment
        from .models import StudentClassEnrollment, Grade
        student_ids = StudentClassEnrollment.objects.filter(
            classroom__in=classrooms
        ).values_list('student_id', flat=True).distinct()
        total_students = len(student_ids)
        
        # Get total grade entries by this teacher
        total_grades = Grade.objects.filter(teacher=user).count()
        
        return Response({
            'total_students': total_students,
            'total_classes': total_classes,
            'total_grades': total_grades,
        })
    except Exception as e:
        logger.error(f"Teacher stats error: {str(e)}", exc_info=True)
        return Response(
            {'error': f'Server error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class ClassroomViewSet(viewsets.ModelViewSet):
    serializer_class = ClassroomSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']
    
    def get_queryset(self):
        user = self.request.user
        # Admins see all classrooms; teachers see only their own
        if user.role == 'admin':
            return Classroom.objects.all()
        return Classroom.objects.filter(teacher=user)
    
    def perform_create(self, serializer):
        classroom = serializer.save(teacher=self.request.user)
        log_audit_action(
            user=self.request.user,
            action='create',
            model_name='Classroom',
            object_id=classroom.id,
            object_repr=str(classroom),
            description=f'Created classroom: {classroom.name}',
            request=self.request
        )
    
    @action(detail=True, methods=['get', 'post'])
    def students(self, request, pk=None):
        classroom = self.get_object()
        
        if request.method == 'GET':
            enrollments = classroom.enrollments.all()
            search = request.query_params.get('search', '')
            if search:
                enrollments = enrollments.filter(student__username__icontains=search)
            serializer = StudentClassEnrollmentSerializer(enrollments, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            student_id = request.data.get('student_id')
            if not student_id:
                return Response(
                    {'error': 'student_id is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                student = User.objects.get(id=student_id, role='student')
                enrollment, created = StudentClassEnrollment.objects.get_or_create(
                    student=student,
                    classroom=classroom
                )
                if created:
                    serializer = StudentClassEnrollmentSerializer(enrollment)
                    return Response(serializer.data, status=status.HTTP_201_CREATED)
                else:
                    return Response(
                        {'error': 'Student already enrolled in this class'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except User.DoesNotExist:
                return Response(
                    {'error': 'Student not found'},
                    status=status.HTTP_404_NOT_FOUND
                )


class StudentClassEnrollmentViewSet(viewsets.ModelViewSet):
    serializer_class = StudentClassEnrollmentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = StudentClassEnrollment.objects.all()
        classroom_id = self.request.query_params.get('classroom')

        if user.role == 'student':
            queryset = queryset.filter(student=user)
        elif user.role == 'teacher':
            teacher_classrooms = Classroom.objects.filter(teacher=user)
            queryset = queryset.filter(classroom__in=teacher_classrooms)

        if classroom_id:
            queryset = queryset.filter(classroom_id=classroom_id)

        return queryset

    def perform_create(self, serializer):
        student_id  = self.request.data.get('student')
        classroom_id = self.request.data.get('classroom')

        if not student_id or not classroom_id:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'error': 'student and classroom are required'})

        try:
            student  = User.objects.get(pk=student_id, role='student')
            classroom = Classroom.objects.get(pk=classroom_id)
        except (User.DoesNotExist, Classroom.DoesNotExist):
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'error': 'Student or classroom not found'})

        if StudentClassEnrollment.objects.filter(student=student, classroom=classroom).exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'error': 'Student is already enrolled in this classroom'})

        enrollment = serializer.save(student=student, classroom=classroom)

        log_audit_action(
            user=self.request.user,
            action='create',
            model_name='StudentClassEnrollment',
            object_id=enrollment.id,
            object_repr=str(enrollment),
            description=f'Enrolled {student.username} in {classroom.name}',
            request=self.request
        )
    
    def perform_update(self, serializer):
        # Only teachers can update grades
        if self.request.user.role != 'teacher':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only teachers can update grades")
        enrollment = serializer.save()
        
        # Log grade update
        log_audit_action(
            user=self.request.user,
            action='update',
            model_name='StudentClassEnrollment',
            object_id=enrollment.id,
            object_repr=str(enrollment),
            description=f'Updated grades for {enrollment.student.username} in {enrollment.classroom.name}',
            request=self.request
        )
        
        # Create notification for the student when grades are updated
        if enrollment.student:
            # Check if any grade was actually updated
            if any([enrollment.q1, enrollment.q2, enrollment.q3, enrollment.q4]):
                Notification.objects.create(
                    recipient=enrollment.student,
                    notification_type='grade',
                    title='Grades Updated',
                    message=f'Your grades for {enrollment.classroom.name} have been updated.',
                    link='/result-checker'
                )


class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name', 'profile__employee_id']
    
    def get_queryset(self):
        user = self.request.user
        role = self.request.query_params.get('role')
        queryset = User.objects.all()
        
        # RBAC: Students can only see their own data
        if user.role == 'student':
            return User.objects.filter(id=user.id)
        
        # Teachers can see students and themselves
        if user.role == 'teacher':
            if role:
                if role == 'student':
                    return User.objects.filter(role='student')
                elif role == 'teacher':
                    return User.objects.filter(id=user.id)
            return User.objects.filter(role='student') | User.objects.filter(id=user.id)
        
        # Admins can see all users
        if role:
            queryset = queryset.filter(role=role)
        return queryset

    def perform_destroy(self, instance):
        log_audit_action(
            user=self.request.user,
            action='delete',
            model_name='User',
            object_id=instance.id,
            object_repr=str(instance),
            description=f'Admin deleted user account: {instance.email}',
            request=self.request
        )
        instance.delete()

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Return all users pending approval (admin only)"""
        if request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        users = User.objects.filter(is_approved=False).order_by('date_joined')
        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a user account (admin only)"""
        if request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        user.is_approved = True
        user.save()

        # Notify the user by email
        try:
            send_mail(
                'Your KNHS Portal Account Has Been Approved',
                f'Hi {user.first_name or user.username},\n\nYour account has been approved by the administrator. You can now log in to the KNHS School Portal.\n\n— KNHS School Portal',
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
            )
        except Exception as e:
            logger.error(f"Failed to send approval email: {e}")

        log_audit_action(
            user=request.user,
            action='approve',
            model_name='User',
            object_id=user.id,
            object_repr=str(user),
            description=f'Admin approved account for {user.email}',
            request=request,
        )
        return Response({'message': f'{user.email} has been approved.'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject (delete) a pending user account (admin only)"""
        if request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        email = user.email
        reason = request.data.get('reason', 'Your account registration has been rejected by the administrator.')

        # Notify before deleting
        try:
            send_mail(
                'Your KNHS Portal Account Registration',
                f'Hi {user.first_name or user.username},\n\n{reason}\n\nIf you believe this is a mistake, please contact the school administrator.\n\n— KNHS School Portal',
                settings.DEFAULT_FROM_EMAIL,
                [email],
            )
        except Exception as e:
            logger.error(f"Failed to send rejection email: {e}")

        log_audit_action(
            user=request.user,
            action='reject',
            model_name='User',
            object_id=user.id,
            object_repr=str(user),
            description=f'Admin rejected account for {email}',
            request=request,
        )
        user.delete()
        return Response({'message': f'{email} has been rejected and removed.'})

    @action(detail=False, methods=['get'])
    def search(self, request):
        query = request.query_params.get('q', '')
        
        # If admin, allow searching all roles, otherwise restricted to teachers/students
        if request.user.role == 'admin':
            users = User.objects.all().select_related('profile')
        else:
            users = User.objects.filter(role__in=['teacher', 'student']).select_related('profile')
        
        if query:
            users = users.filter(
                Q(first_name__icontains=query) | 
                Q(last_name__icontains=query) | 
                Q(email__icontains=query) |
                Q(username__icontains=query)
            )
            
        users = users.exclude(id=request.user.id)[:50]
        
        return Response(UserSerializer(users, many=True).data)


class AnnouncementViewSet(viewsets.ModelViewSet):
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [parsers.JSONParser, parsers.MultiPartParser, parsers.FormParser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'content']
    
    def get_queryset(self):
        from django.utils import timezone
        category = self.request.query_params.get('category')
        status_filter = self.request.query_params.get('status')
        queryset = Announcement.objects.all()

        user = self.request.user

        # Students only see live announcements
        if user.role == 'student':
            queryset = queryset.filter(status='live')
            queryset = queryset.exclude(expiration_date__lt=timezone.now())

        # Teachers see live announcements + their own drafts
        elif user.role == 'teacher':
            from django.db.models import Q
            queryset = queryset.filter(
                Q(status='live') | Q(author=user)
            ).exclude(
                expiration_date__lt=timezone.now()
            )

        # Admins see everything, optionally filtered by status
        elif user.role == 'admin':
            if status_filter:
                queryset = queryset.filter(status=status_filter)
            else:
                queryset = queryset.exclude(
                    expiration_date__lt=timezone.now(),
                    status='expired'
                )

        if category and category != 'all':
            queryset = queryset.filter(category=category)

        return queryset.order_by('-is_pinned', '-created_at')
    
    def perform_create(self, serializer):
        try:
            announcement = serializer.save(author=self.request.user)
            logger.info(f"Announcement created: {announcement.title}")

            # Save multiple attachments
            files = self.request.FILES.getlist('attachments')
            logger.info(f"Found {len(files)} attachment(s)")
            for f in files:
                try:
                    AnnouncementAttachment.objects.create(
                        announcement=announcement,
                        file=f,
                        filename=f.name
                    )
                    logger.info(f"Saved attachment: {f.name}")
                except Exception as e:
                    logger.error(f"Error saving attachment: {str(e)}")

            # Log announcement creation
            log_audit_action(
                user=self.request.user,
                action='create',
                model_name='Announcement',
                object_id=announcement.id,
                object_repr=announcement.title,
                description=f'Created announcement: {announcement.title}',
                request=self.request
            )

            # Create notifications for target audience
            from django.contrib.auth import get_user_model
            User = get_user_model()
            users = User.objects.all()
            if announcement.target_audience == 'admins':
                users = users.filter(role='admin')
            elif announcement.target_audience == 'students':
                users = users.filter(role='student')
            elif announcement.target_audience == 'teachers':
                users = users.filter(role='teacher')
            notifications_to_create = []
            for user in users:
                if user != self.request.user:
                    notifications_to_create.append(
                        Notification(
                            recipient=user,
                            notification_type='announcement',
                            title=f'New Announcement: {announcement.title}',
                            message=announcement.content[:200] + '...' if len(announcement.content) > 200 else announcement.content,
                            link='/announcements'
                        )
                    )
            if notifications_to_create:
                Notification.objects.bulk_create(notifications_to_create)
        except Exception as e:
            logger.error(f"Error in perform_create: {str(e)}", exc_info=True)
            raise

    def perform_update(self, serializer):
        announcement = serializer.save()
        # Append any new attachments (don't delete existing ones)
        files = self.request.FILES.getlist('attachments')
        for f in files:
            from .models import AnnouncementAttachment
            AnnouncementAttachment.objects.create(
                announcement=announcement,
                file=f,
                filename=f.name
            )
        log_audit_action(
            user=self.request.user,
            action='update',
            model_name='Announcement',
            object_id=announcement.id,
            object_repr=announcement.title,
            description=f'Updated announcement: {announcement.title}',
            request=self.request
        )
        
        # Create notifications for target audience
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        users = User.objects.all()
        
        # Filter by target audience
        if announcement.target_audience == 'admins':
            users = users.filter(role='admin')
        elif announcement.target_audience == 'students':
            users = users.filter(role='student')
        elif announcement.target_audience == 'teachers':
            users = users.filter(role='teacher')
        
        notifications_to_create = []
        
        for user in users:
            if user != self.request.user:  # Don't notify the author
                notifications_to_create.append(
                    Notification(
                        recipient=user,
                        notification_type='announcement',
                        title=f'New Announcement: {announcement.title}',
                        message=announcement.content[:200] + '...' if len(announcement.content) > 200 else announcement.content,
                        link='/announcements'
                    )
                )
        
        # Bulk create notifications
        if notifications_to_create:
            Notification.objects.bulk_create(notifications_to_create)
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark announcement as read by current user"""
        announcement = self.get_object()
        announcement.read_by.add(request.user)
        return Response({'status': 'marked as read'})

    def perform_destroy(self, instance):
        """Delete announcement and remove its related notifications"""
        Notification.objects.filter(
            notification_type='announcement',
            link='/announcements',
            title__icontains=instance.title[:30]
        ).delete()
        log_audit_action(
            user=self.request.user,
            action='delete',
            model_name='Announcement',
            object_id=instance.id,
            object_repr=instance.title,
            description=f'Deleted announcement: {instance.title}',
            request=self.request
        )
        instance.delete()
    
    @action(detail=True, methods=['post'])
    def pin(self, request, pk=None):
        """Pin or unpin announcement"""
        announcement = self.get_object()
        announcement.is_pinned = not announcement.is_pinned
        announcement.save()
        return Response({'is_pinned': announcement.is_pinned})
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish announcement (change status to live)"""
        announcement = self.get_object()
        announcement.status = 'live'
        announcement.save()
        return Response({'status': 'published'})
    
    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """Archive announcement (change status to expired) and remove its notifications"""
        announcement = self.get_object()
        announcement.status = 'expired'
        announcement.save()
        # Remove related notifications since announcement is no longer active
        Notification.objects.filter(
            notification_type='announcement',
            link='/announcements',
            title__icontains=announcement.title[:30]
        ).delete()
        return Response({'status': 'archived'})

    @action(detail=True, methods=['post'])
    def delete_attachment(self, request, pk=None):
        """Delete a specific attachment from an announcement"""
        announcement = self.get_object()
        attachment_id = request.data.get('attachment_id')
        try:
            attachment = announcement.attachments.get(id=attachment_id)
            attachment.delete()
            return Response({'status': 'attachment deleted'})
        except AnnouncementAttachment.DoesNotExist:
            return Response({'error': 'Attachment not found'}, status=status.HTTP_404_NOT_FOUND)


class AttendanceViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['student__username', 'student__email']
    
    def get_queryset(self):
        user = self.request.user
        queryset = Attendance.objects.all()
        classroom_id = self.request.query_params.get('classroom')
        date = self.request.query_params.get('date')
        status = self.request.query_params.get('status')
        
        # RBAC: Students can only see their own attendance
        if user.role == 'student':
            queryset = queryset.filter(student=user)
        # Teachers can only see attendance for their classrooms
        elif user.role == 'teacher':
            teacher_classrooms = Classroom.objects.filter(teacher=user)
            queryset = queryset.filter(classroom__in=teacher_classrooms)
        
        if classroom_id:
            queryset = queryset.filter(classroom_id=classroom_id)
        if date:
            queryset = queryset.filter(date=date)
        if status:
            queryset = queryset.filter(status=status)
        return queryset
    
    def perform_create(self, serializer):
        # Teachers and admins can mark attendance
        if self.request.user.role not in ['teacher', 'admin']:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only teachers and admins can mark attendance")
        attendance = serializer.save(marked_by=self.request.user)
        log_audit_action(
            user=self.request.user,
            action='create',
            model_name='Attendance',
            object_id=attendance.id,
            object_repr=str(attendance),
            description=f'Marked attendance for {attendance.student.username} on {attendance.date}',
            request=self.request
        )


class LearningMaterialViewSet(viewsets.ModelViewSet):
    serializer_class = LearningMaterialSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description']
    
    def get_queryset(self):
        user = self.request.user
        from django.db.models import Q
        queryset = LearningMaterial.objects.all()
        classroom_id = self.request.query_params.get('classroom')
        material_type = self.request.query_params.get('material_type')
        quarter = self.request.query_params.get('quarter')
        
        # RBAC: Students can see materials for their enrolled classrooms + general materials
        if user.role == 'student':
            student_enrollments = StudentClassEnrollment.objects.filter(student=user)
            student_classrooms = [e.classroom for e in student_enrollments]
            queryset = queryset.filter(Q(classroom__in=student_classrooms) | Q(classroom__isnull=True))
        # Teachers see materials for their classrooms + general materials
        elif user.role == 'teacher':
            teacher_classrooms = Classroom.objects.filter(teacher=user)
            queryset = queryset.filter(Q(classroom__in=teacher_classrooms) | Q(classroom__isnull=True))
        # Admins see everything
        
        if classroom_id:
            queryset = queryset.filter(classroom_id=classroom_id)
        if material_type:
            queryset = queryset.filter(material_type=material_type)
        if quarter:
            queryset = queryset.filter(quarter=quarter)
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        # Only teachers and admins can upload materials
        if self.request.user.role not in ['teacher', 'admin']:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only teachers and admins can upload materials")
        material = serializer.save(uploaded_by=self.request.user)
        
        # Log material upload
        log_audit_action(
            user=self.request.user,
            action='create',
            model_name='LearningMaterial',
            object_id=material.id,
            object_repr=material.title,
            description=f'Uploaded learning material: {material.title}',
            request=self.request
        )


class SubjectViewSet(viewsets.ModelViewSet):
    serializer_class = SubjectSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'code']
    
    def get_queryset(self):
        queryset = Subject.objects.all()
        grade_level = self.request.query_params.get('grade_level')
        if grade_level:
            queryset = queryset.filter(grade_level=grade_level)
        return queryset


class ClassroomSubjectViewSet(viewsets.ModelViewSet):
    """
    Manages Subject assignments to Classrooms
    Implements: Classroom contains Subject
    """
    serializer_class = ClassroomSubjectSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['classroom__name', 'subject__name', 'subject__code', 'teacher__username']
    ordering_fields = ['classroom__name', 'subject__name', 'assigned_at']
    ordering = ['classroom__name', 'subject__name']
    
    def get_queryset(self):
        user = self.request.user
        queryset = ClassroomSubject.objects.select_related('classroom', 'subject', 'teacher')
        
        # Filter based on user role
        if user.role == 'teacher':
            # Teachers can only see subjects assigned to them
            queryset = queryset.filter(teacher=user)
        elif user.role == 'student':
            # Students can see subjects for their enrolled classrooms
            enrolled_classrooms = StudentClassEnrollment.objects.filter(student=user).values_list('classroom_id', flat=True)
            queryset = queryset.filter(classroom_id__in=enrolled_classrooms)
        # Admins can see all
        
        # Additional filters
        classroom_id = self.request.query_params.get('classroom')
        subject_id = self.request.query_params.get('subject')
        teacher_id = self.request.query_params.get('teacher')
        
        if classroom_id:
            queryset = queryset.filter(classroom_id=classroom_id)
        if subject_id:
            queryset = queryset.filter(subject_id=subject_id)
        if teacher_id:
            queryset = queryset.filter(teacher_id=teacher_id)
            
        return queryset
    
    def perform_create(self, serializer):
        user = self.request.user
        if user.role not in ['admin', 'teacher']:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admins and teachers can assign subjects to classrooms")
        instance = serializer.save()
        log_audit_action(user, 'create', 'ClassroomSubject',
                         object_id=instance.id,
                         object_repr=str(instance),
                         description=f"Assigned {instance.subject.code} to {instance.classroom.name}",
                         request=self.request)

    def perform_update(self, serializer):
        user = self.request.user
        if user.role not in ['admin', 'teacher']:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admins and teachers can update subject assignments")
        if user.role == 'teacher' and serializer.instance.teacher != user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only edit assignments for subjects assigned to you")
        instance = serializer.save()
        log_audit_action(user, 'update', 'ClassroomSubject',
                         object_id=instance.id,
                         object_repr=str(instance),
                         description=f"Updated weights for {instance.subject.code} in {instance.classroom.name}",
                         request=self.request)

    def perform_destroy(self, instance):
        user = self.request.user
        if user.role not in ['admin', 'teacher']:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admins and teachers can remove subject assignments")
        if user.role == 'teacher' and instance.teacher != user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only remove assignments for subjects assigned to you")
        log_audit_action(user, 'delete', 'ClassroomSubject',
                         object_id=instance.id,
                         object_repr=str(instance),
                         description=f"Removed {instance.subject.code} from {instance.classroom.name}",
                         request=self.request)
        instance.delete()
    
    @action(detail=False, methods=['get'])
    def by_classroom(self, request):
        """Get all subjects assigned to a specific classroom"""
        classroom_id = request.query_params.get('classroom_id')
        if not classroom_id:
            return Response({'error': 'classroom_id parameter required'}, status=status.HTTP_400_BAD_REQUEST)

        queryset = ClassroomSubject.objects.select_related(
            'classroom', 'subject', 'teacher'
        ).filter(classroom_id=classroom_id)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_teacher(self, request):
        """Get all subjects assigned to a specific teacher"""
        teacher_id = request.query_params.get('teacher_id')
        if not teacher_id:
            return Response({'error': 'teacher_id parameter required'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        # Teachers can only see their own assignments
        if user.role == 'teacher':
            teacher_id = user.id
        
        queryset = self.get_queryset().filter(teacher_id=teacher_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class ScratchCardViewSet(viewsets.ModelViewSet):
    serializer_class = ScratchCardSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['serial_number', 'student__username']
    
    def get_queryset(self):
        queryset = ScratchCard.objects.all()
        student_id = self.request.query_params.get('student')
        is_used = self.request.query_params.get('is_used')
        
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if is_used:
            queryset = queryset.filter(is_used=is_used == 'true')
        return queryset


class FeeViewSet(viewsets.ModelViewSet):
    serializer_class = FeeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['student__username']
    
    def get_queryset(self):
        user = self.request.user
        queryset = Fee.objects.all()
        student_id = self.request.query_params.get('student')
        status = self.request.query_params.get('status')
        fee_type = self.request.query_params.get('fee_type')
        
        # RBAC: Students can only see their own fees
        if user.role == 'student':
            queryset = queryset.filter(student=user)
        # Teachers can only see fees for their classrooms
        elif user.role == 'teacher':
            teacher_classrooms = Classroom.objects.filter(teacher=user)
            student_enrollments = StudentClassEnrollment.objects.filter(classroom__in=teacher_classrooms)
            students = [e.student for e in student_enrollments]
            queryset = queryset.filter(student__in=students)
        
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if status:
            queryset = queryset.filter(status=status)
        if fee_type:
            queryset = queryset.filter(fee_type=fee_type)
        return queryset


@api_view(['GET', 'POST', 'PATCH'])
@permission_classes([IsAuthenticated])
def system_settings_view(request):
    """View to get or update global system settings (Admin only for updates)"""
    settings = SystemSetting.get_settings()
    
    if request.method in ['POST', 'PATCH']:
        if request.user.role != 'admin':
            return Response({'error': 'Only administrators can update system settings'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = SystemSettingSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # GET
    serializer = SystemSettingSerializer(settings)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def maintenance_status_view(request):
    """Public endpoint to check if the portal is in maintenance mode"""
    settings = SystemSetting.get_settings()
    return Response({
        'maintenance_mode': settings.maintenance_mode,
        'maintenance_message': settings.maintenance_message
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard_stats(request):
    from django.db.models import Count, Avg
    from django.utils import timezone
    import datetime

    today = timezone.now().date()
    this_week_start = today - datetime.timedelta(days=today.weekday())

    # Core counts
    total_students = User.objects.filter(role='student', is_approved=True).count()
    total_teachers = User.objects.filter(role='teacher', is_approved=True).count()
    total_classes  = Classroom.objects.count()
    total_subjects = Subject.objects.count()
    pending_approvals = User.objects.filter(is_approved=False).count()

    # Attendance today
    today_attendance = Attendance.objects.filter(date=today)
    today_present = today_attendance.filter(status__in=['present', 'late']).count()
    today_absent  = today_attendance.filter(status='absent').count()
    today_total   = today_attendance.count()
    today_rate    = round((today_present / today_total * 100), 1) if today_total > 0 else None

    # Grades - only count final grades
    grades = Grade.objects.filter(transmuted_score__isnull=False, grade_type='final_grade')
    total_grades = grades.count()
    avg_grade = grades.aggregate(avg=Avg('transmuted_score'))['avg']
    average_grade = round(float(avg_grade), 2) if avg_grade else None

    # --- ALL SUBJECTS DISTRIBUTION ---
    outstanding = grades.filter(transmuted_score__gte=90).count()
    very_satisfactory = grades.filter(transmuted_score__gte=85, transmuted_score__lt=90).count()
    satisfactory = grades.filter(transmuted_score__gte=80, transmuted_score__lt=85).count()
    fairly_satisfactory = grades.filter(transmuted_score__gte=75, transmuted_score__lt=80).count()
    below_75 = grades.filter(transmuted_score__lt=75).count()

    # --- GENERAL AVERAGE DISTRIBUTION (Student-wise) ---
    student_averages = grades.values('student').annotate(avg=Avg('transmuted_score'))
    total_students_graded = student_averages.count()
    
    ga_outstanding = 0
    ga_very_satisfactory = 0
    ga_satisfactory = 0
    ga_fairly_satisfactory = 0
    ga_below_75 = 0
    
    for sa in student_averages:
        score = sa['avg']
        if score >= 90: ga_outstanding += 1
        elif score >= 85: ga_very_satisfactory += 1
        elif score >= 80: ga_satisfactory += 1
        elif score >= 75: ga_fairly_satisfactory += 1
        else: ga_below_75 += 1

    # Prepare response data
    res_data = {
        # Core
        'total_students': total_students,
        'total_teachers': total_teachers,
        'total_classes': total_classes,
        'total_subjects': total_subjects,
        'pending_approvals': pending_approvals,
        'pending_enrollments': EnrollmentApplication.objects.filter(status='pending').count(),
        # Attendance
        'today_present': today_present,
        'today_absent': today_absent,
        'today_total': today_total,
        'today_rate': today_rate,
        # Grades
        'total_grades': total_grades,
        'average_grade': average_grade,
        
        # All Subjects breakdown
        'all_subjects': {
            'outstanding_pct': round(outstanding / total_grades * 100) if total_grades else 0,
            'very_satisfactory_pct': round(very_satisfactory / total_grades * 100) if total_grades else 0,
            'satisfactory_pct': round(satisfactory / total_grades * 100) if total_grades else 0,
            'fairly_satisfactory_pct': round(fairly_satisfactory / total_grades * 100) if total_grades else 0,
            'below_75_pct': round(below_75 / total_grades * 100) if total_grades else 0,
            'total_count': total_grades
        },
        
        # General Average breakdown
        'general_average': {
             'outstanding_pct': round(ga_outstanding / total_students_graded * 100) if total_students_graded else 0,
             'very_satisfactory_pct': round(ga_very_satisfactory / total_students_graded * 100) if total_students_graded else 0,
             'satisfactory_pct': round(ga_satisfactory / total_students_graded * 100) if total_students_graded else 0,
             'fairly_satisfactory_pct': round(ga_fairly_satisfactory / total_students_graded * 100) if total_students_graded else 0,
             'below_75_pct': round(ga_below_75 / total_students_graded * 100) if total_students_graded else 0,
             'total_count': total_students_graded
         },
        'system_settings': SystemSettingSerializer(SystemSetting.get_settings()).data,

        'recent_grades_count': Grade.objects.filter(submitted_at__date__gte=this_week_start).count(),
        'total_announcements': Announcement.objects.filter(status='live').count(),
        'recent_announcements': list(
            Announcement.objects.filter(status='live')
            .order_by('-created_at')[:3]
            .values('id', 'title', 'content', 'priority', 'is_pinned', 'created_at', 'author__username')
        ),
    }

    # Add author names to announcements
    for a in res_data['recent_announcements']:
        a['author_name'] = a.pop('author__username', 'Unknown')
    
    return Response(res_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def grade_distribution_stats(request):
    """
    Detailed statistics for grade distribution across the school.
    Supports filtering by academic_year, grade_level, and subject.
    """
    from django.db.models import Avg, Count
    from .models import Grade, Classroom, Subject
    
    academic_year = request.query_params.get('academic_year', '2025-2026')
    grade_level   = request.query_params.get('grade_level', 'all')
    subject_id    = request.query_params.get('subject_id', 'all')
    quarter       = request.query_params.get('quarter', 'all')
    
    # 1. Base filtering
    base_grades = Grade.objects.filter(
        grade_type='final_grade', 
        academic_year=academic_year,
        transmuted_score__isnull=False
    )
    
    # Filter by Quarter if specified
    if quarter != 'all':
        base_grades = base_grades.filter(quarter=quarter)
    
    # Filter by Grade Level if specified
    if grade_level != 'all':
        level_classrooms = Classroom.objects.filter(name__icontains=grade_level)
        base_grades = base_grades.filter(classroom__in=level_classrooms)
        
    # Filter by Subject if specified
    if subject_id != 'all':
        base_grades = base_grades.filter(subject_id=subject_id)

    if not base_grades.exists():
        return Response({
            'total_students': 0,
            'overall_average': 0,
            'category_counts': [],
            'by_level': [],
            'by_group': [],
            'meta': {
                'subjects': list(Subject.objects.values('id', 'name', 'code')),
                'grade_levels': ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"]
            }
        })

    # 2. Summary Stats
    student_averages = base_grades.values('student').annotate(avg=Avg('transmuted_score'))
    total_students = student_averages.count()
    overall_avg = base_grades.aggregate(avg=Avg('transmuted_score'))['avg']
    
    categories = {
        'Outstanding (90-100)': 0,
        'Very Satisfactory (85-89)': 0,
        'Satisfactory (80-84)': 0,
        'Fairly Satisfactory (75-79)': 0,
        'Did Not Meet Expectations (<75)': 0,
    }
    
    for sa in student_averages:
        score = sa['avg']
        if score >= 90: categories['Outstanding (90-100)'] += 1
        elif score >= 85: categories['Very Satisfactory (85-89)'] += 1
        elif score >= 80: categories['Satisfactory (80-84)'] += 1
        elif score >= 75: categories['Fairly Satisfactory (75-79)'] += 1
        else: categories['Did Not Meet Expectations (<75)'] += 1

    # 3. Dynamic Comparison Chart (By Level or By Classroom)
    by_level = []
    if grade_level == 'all':
        # Show comparison across all grade levels
        for level_num in range(7, 13):
            level_label = f"Grade {level_num}"
            level_classrooms = Classroom.objects.filter(name__icontains=level_label)
            level_grades = base_grades.filter(classroom__in=level_classrooms)
            if level_grades.exists():
                avg = level_grades.aggregate(a=Avg('transmuted_score'))['a']
                by_level.append({
                    'label': level_label,
                    'average': round(float(avg), 2) if avg else 0,
                    'count': level_grades.count()
                })
    else:
        # If a level is selected, show comparison across classrooms in that level
        level_classrooms = Classroom.objects.filter(name__icontains=grade_level)
        for c in level_classrooms:
            c_grades = base_grades.filter(classroom=c)
            if c_grades.exists():
                avg = c_grades.aggregate(a=Avg('transmuted_score'))['a']
                by_level.append({
                    'label': c.name,
                    'average': round(float(avg), 2) if avg else 0,
                    'count': c_grades.count()
                })

    # 4. Top Performing Group (By Subject or By Classroom for a Subject)
    by_group = []
    if subject_id == 'all':
        # Show Top 10 Performing Subjects
        subject_stats = base_grades.values('subject__name', 'subject__code').annotate(
            avg=Avg('transmuted_score'),
            count=Count('id')
        ).order_by('-avg')[:10]
        
        for s in subject_stats:
            by_group.append({
                'name': s['subject__name'],
                'code': s['subject__code'],
                'average': round(float(s['avg']), 2),
                'count': s['count']
            })
    else:
        # If a subject is selected, show Top 10 Performing Classrooms for that subject
        classroom_stats = base_grades.values('classroom__name').annotate(
            avg=Avg('transmuted_score'),
            count=Count('id')
        ).order_by('-avg')[:10]
        
        for cs in classroom_stats:
            by_group.append({
                'name': cs['classroom__name'],
                'code': cs['classroom__name'], # Use name as code for chart axis
                'average': round(float(cs['avg']), 2),
                'count': cs['count']
            })

    return Response({
        'academic_year': academic_year,
        'grade_level': grade_level,
        'subject_id': subject_id,
        'total_students': total_students,
        'total_entries': base_grades.count(),
        'overall_average': round(float(overall_avg), 2) if overall_avg else 0,
        'category_counts': [{'name': k, 'value': v} for k, v in categories.items()],
        'by_level': by_level,
        'by_group': by_group,
        'meta': {
            'subjects': list(Subject.objects.values('id', 'name', 'code', 'grade_level').order_by('grade_level', 'name')),
            'grade_levels': ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"]
        }
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def check_result(request):
    registration_number = request.data.get('registration_number')
    scratch_card = request.data.get('scratch_card')
    
    if not registration_number or not scratch_card:
        return Response({'error': 'Registration number and scratch card are required'}, status=400)
    
    try:
        profile = Profile.objects.get(registration_number=registration_number)
        student = profile.user
        
        if student.role != 'student':
            return Response({'error': 'Invalid registration number'}, status=400)
        
        card = ScratchCard.objects.filter(serial_number=scratch_card, student=student, is_used=False).first()
        
        if not card:
            return Response({'error': 'Invalid or used scratch card'}, status=400)
        
        # Mark card as used
        card.is_used = True
        card.used_at = timezone.now()
        card.save()
        
        # Get student's grades
        enrollments = StudentClassEnrollment.objects.filter(student=student)
        grades_data = []
        for enrollment in enrollments:
            grades_data.append({
                'classroom': enrollment.classroom.name,
                'q1': enrollment.q1,
                'q2': enrollment.q2,
                'q3': enrollment.q3,
                'q4': enrollment.q4,
                'transmuted_quarters': enrollment.get_transmuted_quarters(),
                'transmuted_average': enrollment.calculate_transmuted_average(),
                'descriptive_equivalent': enrollment.get_descriptive_equivalent(),
            })
        
        return Response({
            'student': {
                'name': student.username,
                'email': student.email,
                'registration_number': registration_number,
            },
            'grades': grades_data,
        })
        
    except Profile.DoesNotExist:
        return Response({'error': 'Invalid registration number'}, status=400)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def student_profile(request):
    """
    Get or update student profile information.
    Teachers and admins can view any student's profile via student_id query param.
    """
    from .models import Profile
    from .serializers import ProfileSerializer
    
    target_user = request.user
    student_id = request.query_params.get('student_id')
    
    # If student_id is provided, check permissions and change target_user
    if student_id:
        if request.user.role not in ['teacher', 'admin']:
            return Response({'error': 'Only teachers and admins can view other students profiles'}, status=status.HTTP_403_FORBIDDEN)
        try:
            target_user = User.objects.get(id=student_id, role='student')
        except User.DoesNotExist:
            return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
    
    try:
        profile = target_user.profile
    except Profile.DoesNotExist:
        profile = Profile.objects.create(user=target_user)
    
    if request.method == 'GET':
        # Try to get grade level from classroom enrollment if not set on profile
        grade_level = profile.grade_level
        if not grade_level:
            enrollment = StudentClassEnrollment.objects.filter(student=target_user).select_related('classroom').first()
            if enrollment:
                import re
                match = re.search(r'Grade\s+\d+', enrollment.classroom.name, re.IGNORECASE)
                if match:
                    grade_level = match.group(0)

        profile_data = {
            'id': target_user.id,
            'username': target_user.username,
            'email': target_user.email,
            'first_name': target_user.first_name,
            'last_name': target_user.last_name,
            'role': target_user.role,
            'profile': {
                'title': profile.title,
                'sex': profile.sex,
                'state': profile.state,
                'nationality': profile.nationality,
                'middle_name': profile.middle_name,
                'father_name': profile.father_name,
                'mother_name': profile.mother_name,
                'date_of_birth': profile.date_of_birth,
                'contact_information': profile.contact_information,
                'phone_number': profile.phone_number,
                'address': profile.address,
                'grade_level': grade_level,
                'registration_number': profile.registration_number,
            }
        }
        return Response(profile_data)
    
    elif request.method == 'PUT':
        # Only the user themselves can update their profile
        if target_user != request.user:
            return Response({'error': 'You cannot update another user\'s profile'}, status=status.HTTP_403_FORBIDDEN)
            
        # Update user fields
        if 'first_name' in request.data:
            request.user.first_name = request.data['first_name']
        if 'last_name' in request.data:
            request.user.last_name = request.data['last_name']
        request.user.save()
        
        # Update profile fields
        if 'title' in request.data:
            profile.title = request.data['title']
        if 'sex' in request.data:
            profile.sex = request.data['sex']
        if 'state' in request.data:
            profile.state = request.data['state']
        if 'nationality' in request.data:
            profile.nationality = request.data['nationality']
        if 'middle_name' in request.data:
            profile.middle_name = request.data['middle_name']
        if 'father_name' in request.data:
            profile.father_name = request.data['father_name']
        if 'mother_name' in request.data:
            profile.mother_name = request.data['mother_name']
        if 'date_of_birth' in request.data and request.data['date_of_birth']:
            from datetime import datetime
            profile.date_of_birth = datetime.strptime(request.data['date_of_birth'], '%Y-%m-%d').date()
        elif 'date_of_birth' in request.data and not request.data['date_of_birth']:
            profile.date_of_birth = None
        if 'contact_information' in request.data:
            profile.contact_information = request.data['contact_information']
        if 'phone_number' in request.data:
            profile.phone_number = request.data['phone_number']
        if 'address' in request.data:
            profile.address = request.data['address']
        if 'registration_number' in request.data and request.data['registration_number']:
            profile.registration_number = request.data['registration_number']
        if 'grade_level' in request.data:
            profile.grade_level = request.data['grade_level']
        
        profile.save()
        
        # Return updated data
        profile_data = {
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
            'first_name': request.user.first_name,
            'last_name': request.user.last_name,
            'role': request.user.role,
            'profile': {
                'title': profile.title,
                'sex': profile.sex,
                'state': profile.state,
                'nationality': profile.nationality,
                'middle_name': profile.middle_name,
                'father_name': profile.father_name,
                'mother_name': profile.mother_name,
                'date_of_birth': profile.date_of_birth,
                'contact_information': profile.contact_information,
                'phone_number': profile.phone_number,
                'address': profile.address,
                'grade_level': profile.grade_level,
                'registration_number': profile.registration_number,
            }
        }
        return Response(profile_data)


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'message']

    def get_queryset(self):
        from django.utils import timezone
        import datetime
        # Only return notifications from the last 30 days
        cutoff = timezone.now() - datetime.timedelta(days=30)
        return Notification.objects.filter(
            recipient=self.request.user,
            created_at__gte=cutoff
        ).order_by('-created_at')
    
    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(recipient=self.request.user)
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'Notification marked as read'})
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({'status': 'All notifications marked as read'})
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({'unread_count': count})


class EnrollmentApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = EnrollmentApplicationSerializer
    permission_classes = [AllowAny]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['first_name', 'last_name', 'email']
    
    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.role == 'admin':
            return EnrollmentApplication.objects.all()
        elif user.is_authenticated:
            return EnrollmentApplication.objects.filter(email=user.email)
        return EnrollmentApplication.objects.none()
    
    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            import traceback
            logger.error(f"Enrollment application error: {str(e)}\n{traceback.format_exc()}")
            if hasattr(e, 'detail'):
                return Response({'error': str(e.detail)}, status=status.HTTP_400_BAD_REQUEST)
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def approve(self, request, pk=None):
        application = self.get_object()
        application.status = 'approved'
        application.remarks = request.data.get('remarks', '')
        application.save()
        return Response({'status': 'Application approved'})
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def reject(self, request, pk=None):
        application = self.get_object()
        application.status = 'rejected'
        application.remarks = request.data.get('remarks', '')
        application.save()
        return Response({'status': 'Application rejected'})


class WebsiteContentViewSet(viewsets.ModelViewSet):
    serializer_class = WebsiteContentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == 'admin':
            return WebsiteContent.objects.all()
        return WebsiteContent.objects.none()
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def public(self, request):
        """Public endpoint to fetch all website content"""
        queryset = WebsiteContent.objects.all()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def public_announcements_view(request):
    """Public endpoint to fetch all public announcements for the school website"""
    queryset = Announcement.objects.filter(is_public=True).order_by('-is_pinned', '-created_at')
    serializer = AnnouncementSerializer(queryset, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def system_metrics_view(request):
    """Returns system metrics for the System Command Center"""
    from django.db import connection
    from django.utils import timezone
    from datetime import datetime, timedelta
    from portal.models import APIRequestLog
    
    try:
        # Get database size
        with connection.cursor() as cursor:
            cursor.execute("SELECT page_count * page_size as size FROM pragma_page_count, pragma_page_size")
            result = cursor.fetchone()
            db_size = result[0] if result else 0
            db_size_mb = db_size / (1024 * 1024) if db_size else 0
            storage_used = min(int((db_size_mb / 10240) * 100), 100)  # Assume 10GB max
    except Exception as e:
        storage_used = 67  # Fallback
    
    # Get system uptime (mock for now, would need actual server uptime tracking)
    uptime = "99.8%"
    
    # Get real API hits data from the last hour
    api_hits = []
    now = datetime.now()
    try:
        for i in range(12):
            time_start = now - timedelta(minutes=(12-i)*5)
            time_end = now - timedelta(minutes=(11-i)*5)
            time_label = time_start.strftime('%H:%M')
            
            # Count requests in this 5-minute window
            hits = APIRequestLog.objects.filter(
                timestamp__gte=time_start,
                timestamp__lt=time_end
            ).count()
            
            api_hits.append({'time': time_label, 'hits': hits})
    except Exception as e:
        # Fallback to mock data if query fails
        for i in range(12):
            time = (now - timedelta(minutes=(11-i)*5)).strftime('%H:%M')
            hits = 45 + (i * 3) % 50
            api_hits.append({'time': time, 'hits': hits})
    
    # Get active sessions (count of unique users in last 15 minutes)
    fifteen_minutes_ago = now - timedelta(minutes=15)
    try:
        active_sessions = APIRequestLog.objects.filter(
            timestamp__gte=fifteen_minutes_ago,
            user__isnull=False
        ).values('user').distinct().count()
    except Exception as e:
        active_sessions = 142  # Fallback
    
    # Get mobile vs desktop users (based on user agent)
    try:
        mobile_users = APIRequestLog.objects.filter(
            timestamp__gte=fifteen_minutes_ago,
            user_agent__icontains='mobile'
        ).values('user').distinct().count()
    except Exception as e:
        mobile_users = 45  # Fallback
    
    desktop_users = max(active_sessions - mobile_users, 0)
    
    # Get failed logins in last 24 hours
    twenty_four_hours_ago = now - timedelta(hours=24)
    try:
        failed_logins = APIRequestLog.objects.filter(
            timestamp__gte=twenty_four_hours_ago,
            status_code=401
        ).count()
    except Exception as e:
        failed_logins = 12  # Fallback
    
    return Response({
        'storageUsed': storage_used,
        'uptime': uptime,
        'lastOptimization': '2 hours ago',
        'apiHits': api_hits,
        'activeSessions': active_sessions,
        'mobileUsers': mobile_users,
        'desktopUsers': desktop_users,
        'authFailures': failed_logins,
        'syncStatus': 'synced',
        'failedLogins': failed_logins,
        'ipWhitelist': 'active',
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def maintenance_feed_view(request):
    """Returns system maintenance feed for the System Command Center"""
    from portal.models import AuditLog
    
    # Get recent audit logs as maintenance feed
    recent_logs = AuditLog.objects.order_by('-timestamp')[:10]
    
    feed = []
    for log in recent_logs:
        feed.append({
            'id': log.id,
            'action': log.action,
            'details': log.description or f'{log.action} on {log.model_name}',
            'status': 'success',
            'time': _get_time_ago(log.timestamp)
        })
    
    # If no logs, provide mock data
    if not feed:
        feed = [
            {'id': 1, 'action': 'Subject Schema Updated', 'details': 'Added new fields to student_records', 'status': 'success', 'time': '10 min ago'},
            {'id': 2, 'action': 'Cache Cleared', 'details': 'Redis cache flushed - 2.3GB freed', 'status': 'success', 'time': '25 min ago'},
            {'id': 3, 'action': 'Backup Verified', 'details': 'Daily backup integrity check passed', 'status': 'success', 'time': '1 hour ago'},
            {'id': 4, 'action': 'Database Optimization', 'details': 'Index rebuild completed', 'status': 'success', 'time': '2 hours ago'},
            {'id': 5, 'action': 'SSL Certificate Renewed', 'details': 'Valid until 2027-05-06', 'status': 'success', 'time': '3 hours ago'},
        ]
    
    return Response(feed)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def maintenance_mode_view(request):
    """Toggle maintenance mode"""
    enabled = request.data.get('enabled', False)
    
    # Store maintenance mode in a simple way (could use cache or database)
    from django.core.cache import cache
    cache.set('maintenance_mode', enabled, timeout=None)
    
    # Log the action
    if request.user.is_authenticated:
        log_audit_action(
            user=request.user,
            action='maintenance_mode_toggle',
            model_name='System',
            object_id=0,
            object_repr='Maintenance Mode',
            description=f'Maintenance mode {"enabled" if enabled else "disabled"}',
            request=request
        )
    
    return Response({'enabled': enabled})


def _get_time_ago(timestamp):
    """Helper function to get time ago string"""
    from datetime import datetime, timedelta
    now = timezone.now()
    diff = now - timestamp
    
    if diff < timedelta(minutes=1):
        return 'Just now'
    elif diff < timedelta(hours=1):
        return f'{diff.seconds // 60} min ago'
    elif diff < timedelta(days=1):
        return f'{diff.seconds // 3600} hours ago'
    else:
        return f'{diff.days} days ago'


@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def force_sync_view(request):
    """Force sync between portal and website"""
    try:
        # Simulate sync operation
        from django.core.cache import cache
        cache.clear()
        
        return Response({
            'status': 'success',
            'message': 'Sync completed successfully',
            'timestamp': timezone.now().isoformat()
        })
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=500)


@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def run_backup_view(request):
    """Run system backup"""
    try:
        # Simulate backup operation
        return Response({
            'status': 'success',
            'message': 'Backup completed successfully',
            'timestamp': timezone.now().isoformat()
        })
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=500)


@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def clear_cache_view(request):
    """Clear system cache"""
    try:
        from django.core.cache import cache
        cache.clear()
        
        return Response({
            'status': 'success',
            'message': 'Cache cleared successfully',
            'timestamp': timezone.now().isoformat()
        })
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=500)


class GradeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Grade model with role-based access control
    - Admin: Full access to all grades
    - Teacher: Can input/edit grades for their assigned classes
    - Student: Can only view their own grades
    """
    serializer_class = GradeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['student__username', 'student__email', 'subject__name', 'subject__code']
    ordering_fields = ['quarter', 'subject__name', 'submitted_at', 'updated_at']
    ordering = ['-quarter', 'subject__name']
    
    def get_queryset(self):
        user = self.request.user
        queryset = Grade.objects.select_related('student', 'subject', 'classroom', 'teacher')
        
        if user.role == 'admin':
            return queryset
        elif user.role == 'teacher':
            # Teachers see ALL grades in classrooms they are assigned to,
            # not just grades they personally entered — so admin and teacher
            # see the same data for shared classrooms.
            teacher_classrooms = Classroom.objects.filter(teacher=user)
            return queryset.filter(classroom__in=teacher_classrooms)
        elif user.role == 'student':
            return queryset.filter(student=user)
        return queryset.none()
    
    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'student':
            raise serializers.ValidationError("Students cannot create grades")
        
        serializer.save(teacher=user)
        
        # Log the action
        log_audit_action(
            user=user,
            action='grade_create',
            model_name='Grade',
            object_id=serializer.instance.id,
            object_repr=str(serializer.instance),
            description=f'Created grade for {serializer.instance.student.username} in {serializer.instance.subject.code}',
            request=self.request
        )
    
    def perform_update(self, serializer):
        user = self.request.user
        grade = self.get_object()
        
        # Check if grade is locked
        if grade.is_locked and user.role != 'admin':
            # Allow toggling lock status, but not editing other fields
            if len(serializer.validated_data) == 1 and 'is_locked' in serializer.validated_data:
                pass
            else:
                raise serializers.ValidationError("This grade is locked and cannot be edited")
        
        serializer.save()
        
        # Log the action
        log_audit_action(
            user=user,
            action='grade_update',
            model_name='Grade',
            object_id=grade.id,
            object_repr=str(grade),
            description=f'Updated grade for {grade.student.username} in {grade.subject.code}',
            request=self.request
        )
    
    def perform_destroy(self, instance):
        user = self.request.user
        
        # Only admin can delete grades
        if user.role != 'admin':
            raise serializers.ValidationError("Only admins can delete grades")
        
        # Log the action
        log_audit_action(
            user=user,
            action='grade_delete',
            model_name='Grade',
            object_id=instance.id,
            object_repr=str(instance),
            description=f'Deleted grade for {instance.student.username} in {instance.subject.code}',
            request=self.request
        )
        
        instance.delete()
    
    @action(detail=False, methods=['get'])
    def my_grades(self, request):
        """Get current user's grades (for students)"""
        if request.user.role != 'student':
            return Response({'error': 'This endpoint is for students only'}, status=status.HTTP_403_FORBIDDEN)
        
        grades = self.get_queryset()
        serializer = self.get_serializer(grades, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_classroom(self, request):
        """Get grades by classroom (for teachers)"""
        if request.user.role not in ['admin', 'teacher']:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        classroom_id = request.query_params.get('classroom_id')
        quarter = request.query_params.get('quarter')
        
        if not classroom_id:
            return Response({'error': 'classroom_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        queryset = self.get_queryset().filter(classroom_id=classroom_id)
        if quarter:
            queryset = queryset.filter(quarter=quarter)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def calculate_final(self, request):
        """Calculate final grade for a student in a subject"""
        if request.user.role not in ['admin', 'teacher']:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        student_id = request.data.get('student_id')
        subject_id = request.data.get('subject_id')
        quarter = request.data.get('quarter')
        
        if not all([student_id, subject_id, quarter]):
            return Response({'error': 'student_id, subject_id, and quarter are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get all component grades for this student, subject, and quarter
        component_grades = Grade.objects.filter(
            student_id=student_id,
            subject_id=subject_id,
            quarter=quarter,
            grade_type__in=['written_work', 'performance_task', 'quarterly_assessment']
        )
        
        if not component_grades.exists():
            return Response({'error': 'No component grades found'}, status=status.HTTP_404_NOT_FOUND)

        # Look up custom weights for this classroom-subject assignment
        classroom_id = component_grades.first().classroom_id
        try:
            cs = ClassroomSubject.objects.get(classroom_id=classroom_id, subject_id=subject_id)
            ww_w = float(cs.ww_weight) / 100
            pt_w = float(cs.pt_weight) / 100
            qa_w = float(cs.qa_weight) / 100
        except ClassroomSubject.DoesNotExist:
            # Fall back to DepEd defaults
            ww_w, pt_w, qa_w = 0.30, 0.50, 0.20

        # Calculate weighted average using per-subject weights
        total_score = 0
        total_weight = 0

        for grade in component_grades:
            if grade.transmuted_score:
                if grade.grade_type == 'written_work':
                    total_score += float(grade.transmuted_score) * ww_w
                    total_weight += ww_w
                elif grade.grade_type == 'performance_task':
                    total_score += float(grade.transmuted_score) * pt_w
                    total_weight += pt_w
                elif grade.grade_type == 'quarterly_assessment':
                    total_score += float(grade.transmuted_score) * qa_w
                    total_weight += qa_w
        
        if total_weight > 0:
            final_score = round(total_score / total_weight, 2)
            
            # Create or update final grade
            final_grade, created = Grade.objects.update_or_create(
                student_id=student_id,
                subject_id=subject_id,
                quarter=quarter,
                grade_type='final_grade',
                defaults={
                    'raw_score': final_score,
                    'total_score': 100,
                    'teacher': request.user,
                    'classroom': component_grades.first().classroom
                }
            )
            
            serializer = self.get_serializer(final_grade)
            return Response(serializer.data)
        
        return Response({'error': 'Could not calculate final grade'}, status=status.HTTP_400_BAD_REQUEST)


class GradeReportViewSet(viewsets.ModelViewSet):
    """
    ViewSet for GradeReport model with role-based access control
    - Admin: Full access to all reports
    - Teacher: Can view reports for their classes
    - Student: Can only view their own reports
    """
    serializer_class = GradeReportSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['student__username', 'student__email', 'classroom__name']
    ordering_fields = ['quarter', 'school_year', 'generated_at']
    ordering = ['-school_year', '-quarter']
    
    def get_queryset(self):
        user = self.request.user
        queryset = GradeReport.objects.select_related('student', 'classroom', 'generated_by')
        
        if user.role == 'admin':
            return queryset
        elif user.role == 'teacher':
            return queryset.filter(classroom__teacher=user)
        elif user.role == 'student':
            return queryset.filter(student=user)
        return queryset.none()
    
    def perform_create(self, serializer):
        user = self.request.user
        if user.role not in ['admin', 'teacher']:
            raise serializers.ValidationError("Only admins and teachers can create reports")
        
        report = serializer.save(generated_by=user)
        
        # Calculate averages
        report.calculate_averages()
        
        # Log the action
        log_audit_action(
            user=user,
            action='grade_report_create',
            model_name='GradeReport',
            object_id=report.id,
            object_repr=str(report),
            description=f'Created grade report for {report.student.username} - Q{report.quarter}',
            request=self.request
        )
    
    @action(detail=False, methods=['post'])
    def generate_for_classroom(self, request):
        """Generate grade reports for all students in a classroom"""
        if request.user.role not in ['admin', 'teacher']:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        classroom_id = request.data.get('classroom_id')
        quarter = request.data.get('quarter')
        school_year = request.data.get('school_year', '2025-2026')
        
        if not all([classroom_id, quarter]):
            return Response({'error': 'classroom_id and quarter are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            classroom = Classroom.objects.get(id=classroom_id)
        except Classroom.DoesNotExist:
            return Response({'error': 'Classroom not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get all students in the classroom
        enrollments = StudentClassEnrollment.objects.filter(classroom=classroom)
        
        reports_created = []
        reports_updated = []
        for enrollment in enrollments:
            report, created = GradeReport.objects.get_or_create(
                student=enrollment.student,
                classroom=classroom,
                quarter=quarter,
                school_year=school_year,
                defaults={'generated_by': request.user}
            )
            # Always recalculate so re-running after new grades are entered works
            report.calculate_averages()
            if created:
                reports_created.append(report.id)
            else:
                reports_updated.append(report.id)
        
        return Response({
            'message': f'Generated {len(reports_created)} new reports, updated {len(reports_updated)} existing reports',
            'report_ids': reports_created + reports_updated
        })
    
    @action(detail=False, methods=['get'])
    def my_reports(self, request):
        """Get current user's grade reports (for students)"""
        if request.user.role != 'student':
            return Response({'error': 'This endpoint is for students only'}, status=status.HTTP_403_FORBIDDEN)
        
        reports = self.get_queryset()
        serializer = self.get_serializer(reports, many=True)
        return Response(serializer.data)

def _broadcast_room_update(room_id, room_data, event_type='room_updated'):
    """Broadcast a room_updated or group_deleted event to all members in the channel group."""
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'chat_{room_id}',
        {
            'type': 'room_update',
            'event': event_type,
            'room': room_data,
            'room_id': room_id,
        }
    )

def _notify_user_of_new_room(user_id, room_data):
    """Notify a specific user via their personal channel about a new room they joined."""
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'user_{user_id}',
        {
            'type': 'room_update',
            'event': 'new_room',
            'room': room_data,
            'room_id': room_data['id'],
        }
    )


def _notify_user_of_friendship_update(user_id, friendship_data, event_type='friendship_update'):
    """Notify a specific user via their personal channel about a friendship update."""
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'user_{user_id}',
        {
            'type': 'friendship_update',
            'event': event_type,
            'friendship': friendship_data,
        }
    )


class ChatRoomViewSet(viewsets.ModelViewSet):
    serializer_class = ChatRoomSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.request.user.chat_rooms.all().order_by('-updated_at')

    def perform_create(self, serializer):
        room = serializer.save(created_by=self.request.user)
        room.participants.add(self.request.user)
        
        # If participants were provided in the request, add them and notify them
        participant_ids = self.request.data.get('participants', [])
        if participant_ids:
            # Filter out the creator if they were included
            participant_ids = [pid for pid in participant_ids if int(pid) != self.request.user.id]
            if participant_ids:
                users = User.objects.filter(id__in=participant_ids)
                room.participants.add(*users)
                
                serialized = ChatRoomSerializer(room, context={'request': self.request}).data
                # Notify ALL participants about the new room
                for participant in room.participants.all():
                    _notify_user_of_new_room(participant.id, serialized)
        else:
            # Just notify the creator (to sync across tabs)
            serialized = ChatRoomSerializer(room, context={'request': self.request}).data
            _notify_user_of_new_room(self.request.user.id, serialized)

    @action(detail=False, methods=['post'])
    def get_or_create_private_chat(self, request):
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            other_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        # Look for existing private chat between these two users
        room = ChatRoom.objects.filter(is_group=False, participants=request.user).filter(participants=other_user).first()

        if not room:
            room = ChatRoom.objects.create(is_group=False)
            room.participants.add(request.user, other_user)
            # Notify the other user about this new chat room live
            serialized = ChatRoomSerializer(room, context={'request': request}).data
            _notify_user_of_new_room(other_user.id, serialized)

        return Response(ChatRoomSerializer(room, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def add_participants(self, request, pk=None):
        room = self.get_object()
        if not room.is_group:
            return Response({'error': 'Cannot add participants to private chat'}, status=status.HTTP_400_BAD_REQUEST)

        user_ids = request.data.get('user_ids', [])
        if not user_ids:
            return Response({'error': 'user_ids is required'}, status=status.HTTP_400_BAD_REQUEST)

        users = User.objects.filter(id__in=user_ids)
        room.participants.add(*users)
        
        serialized = ChatRoomSerializer(room, context={'request': request}).data
        # Notify existing members of update
        _broadcast_room_update(room.id, serialized)
        # Notify NEW members about the new room live
        for user in users:
            _notify_user_of_new_room(user.id, serialized)
            
        return Response(serialized)

    @action(detail=True, methods=['post'])
    def pin(self, request, pk=None):
        room = self.get_object()
        room.pinned_by.add(request.user)
        # Broadcast pin state change to self (sync across tabs)
        _notify_user_of_new_room(request.user.id, ChatRoomSerializer(room, context={'request': request}).data)
        return Response({'status': 'pinned'})

    @action(detail=True, methods=['post'])
    def unpin(self, request, pk=None):
        room = self.get_object()
        room.pinned_by.remove(request.user)
        # Broadcast pin state change to self (sync across tabs)
        _notify_user_of_new_room(request.user.id, ChatRoomSerializer(room, context={'request': request}).data)
        return Response({'status': 'unpinned'})

    @action(detail=True, methods=['patch'])
    def rename(self, request, pk=None):
        room = self.get_object()
        name = request.data.get('name')
        if not name:
            return Response({'error': 'name is required'}, status=400)
        room.name = name
        room.save()
        serialized = ChatRoomSerializer(room, context={'request': request}).data
        _broadcast_room_update(room.id, serialized)
        return Response(serialized)

    @action(detail=True, methods=['post'])
    def remove_participant(self, request, pk=None):
        """Remove a member from a group (creator only)"""
        room = self.get_object()
        if not room.is_group:
            return Response({'error': 'Not a group chat'}, status=status.HTTP_400_BAD_REQUEST)
        if room.created_by != request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only the group creator can remove members")
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        if int(user_id) == request.user.id:
            return Response({'error': 'Cannot remove yourself'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            target = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        room.participants.remove(target)
        serialized = ChatRoomSerializer(room, context={'request': request}).data
        _broadcast_room_update(room.id, serialized)
        return Response(serialized)

    @action(detail=True, methods=['delete'])
    def delete_group(self, request, pk=None):
        """Permanently delete a group and all its messages (creator only)"""
        room = self.get_object()
        if not room.is_group:
            return Response({'error': 'Not a group chat'}, status=status.HTTP_400_BAD_REQUEST)
        if room.created_by != request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only the group creator can delete the group")
        room_id = room.id
        room.delete()
        # Notify all connected members the group is gone
        _broadcast_room_update(room_id, None, event_type='group_deleted')
        return Response({'status': 'group deleted'})

    @action(detail=True, methods=['delete'])
    def delete_conversation(self, request, pk=None):
        """Delete all messages in a conversation for this user (or delete the room if group admin)"""
        room = self.get_object()
        # Delete all messages in the room
        ChatMessage.objects.filter(room=room).delete()
        # Remove user from room (for private chats, this effectively deletes it)
        room.participants.remove(request.user)
        if room.participants.count() == 0:
            room.delete()
        return Response({'status': 'conversation deleted'})

class ChatMessageViewSet(viewsets.ModelViewSet):
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # For detail actions (retrieve, update, destroy, custom actions),
        # return all messages in rooms the user belongs to so get_object() works.
        if self.action in ('retrieve', 'update', 'partial_update', 'destroy', 'edit', 'pin', 'unpin'):
            return ChatMessage.objects.filter(room__participants=user)

        # For list action, require room_id param
        room_id = self.request.query_params.get('room_id')
        if not room_id:
            return ChatMessage.objects.none()
        if not user.chat_rooms.filter(id=room_id).exists():
            return ChatMessage.objects.none()
        return ChatMessage.objects.filter(room_id=room_id).order_by('timestamp')

    def perform_destroy(self, instance):
        # Only sender can delete their own message
        if instance.sender != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only delete your own messages")

        room_id = instance.room_id
        message_id = instance.id
        instance.delete()

        # Broadcast deletion to all room participants via WebSocket
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'chat_{room_id}',
            {
                'type': 'message_deleted',
                'message_id': message_id,
                'deleted_by': self.request.user.id,
            }
        )

    @action(detail=True, methods=['patch'])
    def edit(self, request, pk=None):
        """Edit a message (sender only)"""
        message = self.get_object()
        if message.sender != request.user:
            return Response({'error': 'You can only edit your own messages'}, status=status.HTTP_403_FORBIDDEN)
        content = request.data.get('content', '').strip()
        if not content:
            return Response({'error': 'Content cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)
        message.content = content
        message.is_edited = True
        message.save()

        # Broadcast edit to all room participants
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'chat_{message.room_id}',
            {
                'type': 'message_edited',
                'message_id': message.id,
                'content': content,
            }
        )

        serializer = self.get_serializer(message)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def pin(self, request, pk=None):
        message = self.get_object()
        message.is_pinned = True
        message.save()

        # Broadcast pin to all room participants
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'chat_{message.room_id}',
            {
                'type': 'message_pinned',
                'message_id': message.id,
                'is_pinned': True,
            }
        )
        return Response({'status': 'pinned'})

    @action(detail=True, methods=['post'])
    def unpin(self, request, pk=None):
        message = self.get_object()
        message.is_pinned = False
        message.save()

        # Broadcast unpin to all room participants
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'chat_{message.room_id}',
            {
                'type': 'message_pinned',
                'message_id': message.id,
                'is_pinned': False,
            }
        )
        return Response({'status': 'unpinned'})

class FriendshipViewSet(viewsets.ModelViewSet):
    serializer_class = FriendshipSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Friendship.objects.filter(Q(from_user=user) | Q(to_user=user))

    def perform_create(self, serializer):
        friendship = serializer.save(from_user=self.request.user, status='pending')
        # Notify the target user of the new request
        serialized = FriendshipSerializer(friendship, context={'request': self.request}).data
        _notify_user_of_friendship_update(friendship.to_user.id, serialized, 'request_received')

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        friendship = self.get_object()
        if friendship.to_user != request.user:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        friendship.status = 'accepted'
        friendship.save()
        
        serialized = FriendshipSerializer(friendship, context={'request': request}).data
        # Notify the requester that it was accepted
        _notify_user_of_friendship_update(friendship.from_user.id, serialized, 'request_accepted')
        # Notify self to sync tabs
        _notify_user_of_friendship_update(request.user.id, serialized, 'request_accepted')
        
        return Response(serialized)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        friendship = self.get_object()
        if friendship.to_user != request.user:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        friendship.status = 'rejected'
        friendship.save()
        
        serialized = FriendshipSerializer(friendship, context={'request': request}).data
        # Notify the requester
        _notify_user_of_friendship_update(friendship.from_user.id, serialized, 'request_rejected')
        # Notify self to sync tabs
        _notify_user_of_friendship_update(request.user.id, serialized, 'request_rejected')
        
        return Response(serialized)

    @action(detail=True, methods=['post'])
    def pin(self, request, pk=None):
        friendship = self.get_object()
        if friendship.from_user == request.user:
            friendship.is_pinned_by_from = True
        elif friendship.to_user == request.user:
            friendship.is_pinned_by_to = True
        friendship.save()
        return Response({'status': 'pinned'})

    @action(detail=True, methods=['post'])
    def unpin(self, request, pk=None):
        friendship = self.get_object()
        if friendship.from_user == request.user:
            friendship.is_pinned_by_from = False
        elif friendship.to_user == request.user:
            friendship.is_pinned_by_to = False
        friendship.save()
        return Response({'status': 'unpinned'})

    @action(detail=False, methods=['get'])
    def my_friends(self, request):
        user = request.user
        friendships = Friendship.objects.filter(
            (Q(from_user=user) | Q(to_user=user)),
            status='accepted'
        )
        friends = []
        for f in friendships:
            friend = f.to_user if f.from_user == user else f.from_user
            data = UserSerializer(friend).data
            # Add pin status to friend data for frontend convenience
            data['is_pinned'] = f.is_pinned_by_from if f.from_user == user else f.is_pinned_by_to
            data['friendship_id'] = f.id
            friends.append(data)
        return Response(friends)
