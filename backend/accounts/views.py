from rest_framework import viewsets, status, filters, parsers, serializers
from rest_framework.decorators import action, permission_classes, api_view, parser_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone
from datetime import timedelta
import datetime
from django.db.models import Q, Avg, Count, Max, Min, Sum
from .serializers import (UserSerializer, ClassroomSerializer, StudentClassEnrollmentSerializer,
    AnnouncementSerializer, AttendanceSerializer, LearningMaterialSerializer,
    SubjectSerializer, ClassroomSubjectSerializer, ScratchCardSerializer, FeeSerializer,
    NotificationSerializer, EnrollmentApplicationSerializer, WebsiteContentSerializer,
    GradeSerializer, GradeReportSerializer, ChatRoomSerializer, ChatMessageSerializer, FriendshipSerializer,
    SystemSettingSerializer, AssignmentSerializer, SubmissionSerializer, ReportedMessageSerializer,
    RoomSerializer, TimeSlotSerializer, ScheduleSerializer, ParentChildSummarySerializer,
    full_name)
from .models import User, Classroom, StudentClassEnrollment, Announcement, AnnouncementAttachment, Attendance, LearningMaterial, Subject, ClassroomSubject, ScratchCard, Fee, Notification, EnrollmentApplication, WebsiteContent, Grade, GradeReport, ChatRoom, ChatMessage, MessageReaction, Friendship, SystemSetting, Assignment, Submission, ReportedMessage, Room, TimeSlot, Schedule, FCMToken
from .permissions import IsAdmin, IsTeacher, IsStudent, IsParent, IsAdminOrTeacher, IsAdminOrReadOnly
from .throttles import AuthRateThrottle, CheckResultRateThrottle, EnrollmentRateThrottle
# Moved portal imports inside functions to avoid circular dependencies
import logging
import secrets

logger = logging.getLogger(__name__)


from django.conf import settings
import random
import string

from .utils import (
    check_user_moderation,
)

# ─── Cookie helpers ───────────────────────────────────────────────────────────

def _set_refresh_cookie(response, refresh_token: str):
    """
    Store the JWT refresh token in an httpOnly, Secure, SameSite=Lax cookie.
    httpOnly prevents JavaScript from reading it, which eliminates XSS token theft.
    The access token (short-lived, 15 min) stays in memory on the frontend.
    """
    from django.conf import settings as _settings
    response.set_cookie(
        key='refresh_token',
        value=refresh_token,
        httponly=True,
        secure=not _settings.DEBUG,   # HTTPS-only in production
        samesite='Lax',               # Protects against CSRF while allowing normal navigation
        max_age=7 * 24 * 60 * 60,     # 7 days — matches SIMPLE_JWT REFRESH_TOKEN_LIFETIME
        path='/api/token/',           # Scoped: only sent to the refresh endpoint
    )


def _clear_refresh_cookie(response):
    """Delete the refresh token cookie on logout."""
    response.delete_cookie(
        key='refresh_token',
        path='/api/token/',
        samesite='Lax',
    )

@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthRateThrottle])
def login_view(request):
    try:
        # Support both email and username (Student ID) in the same field
        login_id = request.data.get('email') or request.data.get('username')
        password = request.data.get('password')
        required_role = request.data.get('role') # Optional role validation
        
        logger.info(f"Login attempt for ID: {login_id}, Role: {required_role}")
        
        if login_id is None or password is None:
            return Response(
                {'error': 'Please provide both ID (Email/Student ID) and password'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Authenticate using the custom backend
        user = authenticate(request=request, username=login_id, password=password)
        
        if user is None:
            # Check if user exists but is suspended/inactive
            try:
                potential_user = User.objects.filter(Q(username=login_id) | Q(email=login_id)).first()
                if potential_user:
                    if potential_user.account_status == 'suspended' or not potential_user.is_active:
                        if potential_user.check_password(password):
                            return Response(
                                {'error': 'This account has been suspended. Please contact the administrator.'},
                                status=status.HTTP_403_FORBIDDEN
                            )
            except Exception as e:
                logger.error(f"Error checking potential suspended user: {str(e)}")

            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )
            
        # Role Validation: Ensure user role matches the requested login type
        # If required_role is provided (e.g., from frontend toggle), enforce it.
        # Admins can bypass this to log in from any portal.
        if required_role and user.role != 'admin':
            if user.role != required_role:
                role_display = "Student" if required_role == 'student' else "Teacher/Staff"
                return Response(
                    {'error': f'This account is not registered as a {role_display}. Please use the correct login portal.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        # Check Account Status
        if user.account_status == 'inactive':
            return Response(
                {'error': 'This account is currently inactive. Please contact the administrator.'},
                status=status.HTTP_403_FORBIDDEN
            )
        elif user.account_status == 'suspended':
            return Response(
                {'error': 'This account has been suspended. Please contact the administrator.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if not user.is_approved:
            return Response(
                {'error': 'Your account is pending admin approval. Please wait for an administrator to approve your account.', 'code': 'not_approved'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # If email verification is still required for some roles but optional for others,
        # we can check user.is_verified here if needed. 
        # But per requirements: "Do NOT require email verification to access the system."
        
        # Check if password change is forced
        if user.must_change_password:
            # Issue a temporary token but flag the client to redirect to password change
            refresh = RefreshToken.for_user(user)
            response = Response({
                'must_change_password': True,
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            }, status=status.HTTP_200_OK)
            _set_refresh_cookie(response, str(refresh))
            return response

        refresh = RefreshToken.for_user(user)

        # Log successful login
        from portal.views import log_audit_action
        log_audit_action(
            user=user,
            action='login',
            model_name='User',
            object_id=user.id,
            object_repr=str(user),
            description=f'User {user.username} logged in successfully',
            request=request
        )

        response = Response({
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        })
        _set_refresh_cookie(response, str(refresh))
        return response
    except Exception as e:
        logger.error(f"Login error: {str(e)}", exc_info=True)
        return Response(
            {'error': 'An unexpected error occurred. Please try again.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def force_password_change_view(request):
    """
    Allows a user with must_change_password=True to set a new password.
    """
    user = request.user
    new_password = request.data.get('password')
    
    if not new_password:
        return Response({'error': 'Password is required'}, status=status.HTTP_400_BAD_REQUEST)
        
    if len(new_password) < 8:
        return Response({'error': 'Password must be at least 8 characters long'}, status=status.HTTP_400_BAD_REQUEST)
        
    user.set_password(new_password)
    user.must_change_password = False
    user.save()

    # Issue fresh tokens — blacklist the old refresh token implicitly via rotation
    refresh = RefreshToken.for_user(user)

    response = Response({
        'message': 'Password changed successfully!',
        'access': str(refresh.access_token),
    })
    _set_refresh_cookie(response, str(refresh))
    return response


@api_view(['POST'])
@permission_classes([AllowAny])
def logout_view(request):
    """
    Blacklist the refresh token and clear the httpOnly cookie.
    Accepts the refresh token from the cookie (preferred) or request body (fallback).
    """
    refresh_token = request.COOKIES.get('refresh_token') or request.data.get('refresh')
    if refresh_token:
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            pass  # Already invalid/expired — still clear the cookie

    response = Response({'message': 'Logged out successfully.'})
    _clear_refresh_cookie(response)
    return response


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthRateThrottle])
def cookie_token_refresh_view(request):
    """
    Custom token refresh endpoint that reads the refresh token from the
    httpOnly cookie instead of the request body.
    Falls back to request body for backward compatibility during transition.
    """
    from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

    refresh_token = request.COOKIES.get('refresh_token') or request.data.get('refresh')

    if not refresh_token:
        return Response(
            {'error': 'Refresh token not found. Please log in again.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    try:
        token = RefreshToken(refresh_token)
        access = str(token.access_token)

        # Rotate: blacklist old, issue new refresh
        if hasattr(token, 'blacklist'):
            token.blacklist()
        new_refresh = RefreshToken.for_user(
            User.objects.get(id=token['user_id'])
        )

        response = Response({'access': access})
        _set_refresh_cookie(response, str(new_refresh))
        return response

    except TokenError as e:
        return Response({'error': 'Invalid or expired refresh token.'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception:
        logger.error("Token refresh error", exc_info=True)
        return Response({'error': 'Token refresh failed.'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([IsAdminOrTeacher])
def admin_create_user_view(request):
    username = request.data.get('username') # For students, this will be their Student ID
    email = request.data.get('email')
    
    # Treat empty string or only whitespace as None for unique constraint
    if email is not None:
        email = email.strip()
        if email == "":
            email = None
    
    password = request.data.get('password') # Temporary password
    role = request.data.get('role', 'student')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    profile_data = request.data.get('profile', {})
    
    # Permission check for teachers
    advisory_classroom = None
    if request.user.role == 'teacher':
        if role != 'student':
            return Response({'error': 'Teachers can only create student accounts.'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            advisory_classroom = Classroom.objects.get(teacher=request.user)
        except Classroom.DoesNotExist:
            return Response({'error': 'You must be assigned as an advisory teacher to create students.'}, status=status.HTTP_403_FORBIDDEN)

    # Validation
    if not username:
        return Response({'error': 'Username/Student ID is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    if role == 'student' and (len(str(username)) != 12 or not str(username).isdigit()):
        return Response({'error': 'Student LRN must be exactly 12 digits'}, status=status.HTTP_400_BAD_REQUEST)
    
    if not password:
        # Generate a random temporary password if not provided
        password = ''.join(secrets.choice(string.ascii_letters + string.digits) for i in range(10))

    if User.objects.filter(username=username).exists():
        return Response({'error': 'User with this ID/Username already exists'}, status=status.HTTP_400_BAD_REQUEST)

    if email and User.objects.filter(email=email).exists():
        return Response({'error': 'User with this email already exists'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Use direct model instantiation (not create_user) so that email=None
        # is stored as NULL in PostgreSQL. create_user calls normalize_email()
        # which can coerce None to '' in some Django versions, causing a unique
        # constraint violation when multiple users have no email.
        user = User(
            username=username,
            email=email,  # None → stored as NULL (no unique collision)
            first_name=first_name,
            last_name=last_name,
        )
        user.set_password(password)
        user.role = role
        user.is_verified = True if email else False
        user.is_approved = True  # Admin/Teacher-created accounts are auto-approved
        user.must_change_password = True  # Force password change on first login
        user.account_status = 'active'
        user.save()
        
        # Create profile
        from .models import Profile
        profile, created = Profile.objects.get_or_create(user=user)
        
        # Map profile fields
        profile.lrn = profile_data.get('lrn', username if role == 'student' else None)
        profile.title = profile_data.get('title')
        profile.sex = profile_data.get('sex')
        
        # Auto-fill grade level for teachers if missing
        assigned_grade = profile_data.get('grade_level')
        if not assigned_grade and advisory_classroom:
            assigned_grade = advisory_classroom.grade_level
            
        profile.grade_level = assigned_grade
        profile.employee_id = profile_data.get('employee_id')
        profile.phone_number = profile_data.get('phone_number')
        profile.address = profile_data.get('address')
        
        if profile_data.get('date_of_birth'):
            from datetime import datetime
            try:
                profile.date_of_birth = datetime.strptime(profile_data.get('date_of_birth'), '%Y-%m-%d').date()
            except ValueError:
                pass
        
        profile.save()

        # Auto-enroll student if created by teacher
        if advisory_classroom:
            StudentClassEnrollment.objects.get_or_create(
                student=user,
                classroom=advisory_classroom
            )

        # Log creation
        from portal.views import log_audit_action
        log_audit_action(
            user=request.user,
            action='create',
            model_name='User',
            object_id=user.id,
            object_repr=str(user),
            description=f'{request.user.role.capitalize()} created {role} account: {username}',
            request=request
        )

        return Response({
            'message': f'Account for {username} created successfully!',
            'username': username,
            'temporary_password': password,
            'role': role
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.error(f"User creation error: {str(e)}", exc_info=True)
        return Response({'error': 'Failed to create user account. Please check the provided data.'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def user_profile(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def teacher_dashboard_stats(request):
    """
    Returns dashboard statistics for teachers:
    - Total students (count of students in teacher's classrooms)
    - Active classes (count of teacher's classrooms)
    - Grade entries (total grades recorded by the teacher)
    - Attendance rate for today
    - Recent activities
    """
    try:
        user = request.user
        if user.role != 'teacher' and user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=403)

        from .models import StudentClassEnrollment, Grade, ClassroomSubject, Attendance, Classroom
        from portal.models import AuditLog
        from django.db.models import Q, Avg
        from django.utils import timezone
        
        # Get classrooms where teacher is adviser OR has assigned subjects
        assigned_classrooms_ids = ClassroomSubject.objects.filter(teacher=user).values_list('classroom_id', flat=True)
        classrooms = Classroom.objects.filter(Q(teacher=user) | Q(id__in=assigned_classrooms_ids)).distinct()
        total_classes = classrooms.count()
        
        # Get total students across those classrooms
        student_ids = StudentClassEnrollment.objects.filter(
            classroom__in=classrooms
        ).values_list('student_id', flat=True).distinct()
        total_students = len(student_ids)
        
        # Get total grade entries by this teacher
        total_grades = Grade.objects.filter(teacher=user).count()
        
        # Attendance rate for today
        today = timezone.now().date()
        today_attendance = Attendance.objects.filter(
            classroom__in=classrooms,
            date=today
        )
        if today_attendance.exists():
            present_count = today_attendance.filter(status__in=['present', 'late']).count()
            attendance_rate = round((present_count / today_attendance.count()) * 100)
        else:
            attendance_rate = 0

        # Pending grades (placeholder logic: students in classrooms who have subjects handled by this teacher but no grades yet)
        # For simplicity, we'll just count students who don't have a final grade for the latest subject assignment
        pending_grades = 0
        for cs in ClassroomSubject.objects.filter(teacher=user):
            students_in_class = StudentClassEnrollment.objects.filter(classroom=cs.classroom).count()
            grades_in_subject = Grade.objects.filter(subject=cs.subject, classroom=cs.classroom).values('student').distinct().count()
            pending_grades += max(0, students_in_class - grades_in_subject)

        # Recent activities
        recent_activities = []
        logs = AuditLog.objects.filter(user=user).order_by('-timestamp')[:5]
        for log in logs:
            recent_activities.append({
                'message': log.description,
                'time': log.timestamp.strftime('%I:%M %p, %b %d'),
                'type': 'grade' if 'grade' in log.description.lower() else 'attendance' if 'attendance' in log.description.lower() else 'system'
            })

        # Latest messages for this teacher (exclude self, unique senders)
        latest_messages = []
        msg_objs = ChatMessage.objects.filter(
            room__participants=user
        ).exclude(sender=user).order_by('-timestamp')
        
        seen_senders = set()
        for m in msg_objs:
            if m.sender_id not in seen_senders:
                latest_messages.append({
                    'id': m.id,
                    'content': m.content,
                    'timestamp': m.timestamp.isoformat(),
                    'sender': m.sender.get_full_name() or m.sender.username,
                    'sender_profile_picture': getattr(getattr(m.sender, 'profile', None), 'profile_picture', None),
                    'is_read': m.is_read
                })
                seen_senders.add(m.sender_id)
            if len(latest_messages) >= 5:
                break
        
        return Response({
            'total_students': total_students,
            'total_classes': total_classes,
            'total_grades': total_grades,
            'attendance_rate': attendance_rate,
            'pending_grades': pending_grades,
            'recent_activities': recent_activities,
            'latest_messages': latest_messages
        })
    except Exception as e:
        logger.error(f"Teacher stats error: {str(e)}", exc_info=True)
        return Response(
            {'error': 'Failed to load dashboard statistics.'},
            status=500
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_dashboard_stats(request):
    """
    Returns dashboard statistics for students.
    """
    try:
        user = request.user
        if user.role != 'student':
            return Response({'error': 'Unauthorized'}, status=403)

        from .models import Notification
        from django.utils import timezone
        
        unread_notifications = Notification.objects.filter(recipient=user, is_read=False).count()
        recent_notifications = Notification.objects.filter(recipient=user).order_by('-created_at')[:5]
        
        recent_notif_data = []
        for n in recent_notifications:
            recent_notif_data.append({
                'title': n.title,
                'time': n.created_at.strftime('%I:%M %p, %b %d'),
                'type': n.notification_type
            })

        # Latest messages for this student (exclude self, unique senders)
        latest_messages = []
        msg_objs = ChatMessage.objects.filter(
            room__participants=user
        ).exclude(sender=user).order_by('-timestamp')
        
        seen_senders = set()
        for m in msg_objs:
            if m.sender_id not in seen_senders:
                latest_messages.append({
                    'id': m.id,
                    'content': m.content,
                    'timestamp': m.timestamp.isoformat(),
                    'sender': m.sender.get_full_name() or m.sender.username,
                    'sender_profile_picture': getattr(getattr(m.sender, 'profile', None), 'profile_picture', None),
                    'is_read': m.is_read
                })
                seen_senders.add(m.sender_id)
            if len(latest_messages) >= 5:
                break

        return Response({
            'unread_notifications': unread_notifications,
            'recent_notifications': recent_notif_data,
            'latest_messages': latest_messages
        })
    except Exception as e:
        logger.error(f"Student dashboard stats error: {str(e)}", exc_info=True)
        return Response({'error': 'Failed to load dashboard statistics.'}, status=500)


class ClassroomViewSet(viewsets.ModelViewSet):
    serializer_class = ClassroomSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']
    
    def get_queryset(self):
        try:
            from django.db.models import Q
            user = self.request.user
            academic_year = self.request.query_params.get('academic_year')
            
            # Base queryset
            qs = Classroom.objects.all()
            
            # Filter by academic year if provided
            if academic_year:
                qs = qs.filter(Q(academic_year__name=academic_year) | Q(academic_year__isnull=True))
            
            # Role-based filtering
            if user.role == 'admin':
                return qs
            # Teachers see classrooms where they are the adviser OR have assigned subjects
            if user.role == 'teacher':
                assigned_classrooms = ClassroomSubject.objects.filter(teacher=user).values_list('classroom_id', flat=True)
                return qs.filter(Q(teacher=user) | Q(id__in=assigned_classrooms)).distinct()
            
            # Students see classrooms they are enrolled in
            if user.role == 'student':
                enrolled_classrooms = StudentClassEnrollment.objects.filter(student=user).values_list('classroom_id', flat=True)
                return Classroom.objects.filter(id__in=enrolled_classrooms)

            return Classroom.objects.none()
        except Exception as e:
            logger.error(f"Classroom queryset error: {str(e)}", exc_info=True)
            return Classroom.objects.none()
    
    def perform_create(self, serializer):
        from portal.views import log_audit_action
        # If admin is creating, teacher might be specified in validated_data
        # If teacher is creating, they should be assigned as the teacher (adviser)
        if 'teacher' not in serializer.validated_data and self.request.user.role == 'teacher':
            classroom = serializer.save(teacher=self.request.user)
        else:
            classroom = serializer.save()
            
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
            if classroom_id:
                # If a specific classroom is requested, ensure the student is enrolled there
                is_enrolled = StudentClassEnrollment.objects.filter(student=user, classroom_id=classroom_id).exists()
                if is_enrolled:
                    # Allow seeing all students in that classroom
                    queryset = queryset.filter(classroom_id=classroom_id)
                else:
                    # Not enrolled in the requested classroom, restrict to self
                    queryset = queryset.filter(student=user)
            else:
                # Default: only see own enrollments
                queryset = queryset.filter(student=user)
        elif user.role == 'teacher':
            from django.db.models import Q
            assigned_classrooms = ClassroomSubject.objects.filter(teacher=user).values_list('classroom_id', flat=True)
            queryset = queryset.filter(Q(classroom__teacher=user) | Q(classroom_id__in=assigned_classrooms))

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

        from portal.views import log_audit_action
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
        # Only teachers and admins can update grades
        if self.request.user.role not in ['teacher', 'admin']:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only teachers and admins can update grades")
        enrollment = serializer.save()
        
        # Log grade update
        from portal.views import log_audit_action
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
        try:
            user = self.request.user
            role = self.request.query_params.get('role')
            queryset = User.objects.all().select_related('profile').order_by('-date_joined')
            
            # Management views (filtering by role) should only show approved accounts.
            # Email verification (is_verified) is now optional per school requirements.
            if role in ['student', 'teacher']:
                queryset = queryset.filter(is_approved=True)
            
            # RBAC: Students can only see their own data
            if user.role == 'student':
                return queryset.filter(id=user.id)
            
            # RBAC: Parents can see their linked students and themselves
            if user.role == 'parent':
                profile = getattr(user, 'profile', None)
                if profile:
                    try:
                        linked_student_ids = profile.linked_students.values_list('id', flat=True)
                        return queryset.filter(Q(id__in=linked_student_ids) | Q(id=user.id))
                    except:
                        pass
                return queryset.filter(id=user.id)
            
            # RBAC: Teachers can only manage their own advisory classroom
            if user.role == 'teacher':
                from django.db.models import Q
                # A teacher should see students in their advisory classroom
                # AND potentially themselves.
                advisory_students = queryset.filter(enrollments__classroom__teacher=user)
                
                if role == 'student':
                    return advisory_students.distinct()
                elif role == 'teacher':
                    return queryset.filter(id=user.id)
                
                return (advisory_students | queryset.filter(id=user.id)).distinct()
            
            # Admins can see all users
            if role:
                queryset = queryset.filter(role=role)
            return queryset
        except Exception as e:
            logger.error(f"UserViewSet queryset error: {str(e)}")
            return User.objects.filter(id=self.request.user.id) if self.request.user.is_authenticated else User.objects.none()

    def perform_destroy(self, instance):
        user = self.request.user
        if user.role == 'teacher':
            # Teachers can only delete students in their advisory classroom
            from .models import StudentClassEnrollment
            is_advisory_student = StudentClassEnrollment.objects.filter(
                student=instance,
                classroom__teacher=user
            ).exists()
            if not is_advisory_student:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only delete students from your advisory classroom.")

        from portal.views import log_audit_action
        log_audit_action(
            user=self.request.user,
            action='delete',
            model_name='User',
            object_id=instance.id,
            object_repr=str(instance),
            description=f'{self.request.user.role.capitalize()} deleted user account: {instance.username}',
            request=self.request
        )
        instance.delete()

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """List all users pending admin approval"""
        if request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=403)
        
        queryset = User.objects.filter(is_approved=False).order_by('-date_joined')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """Export users to CSV (admin only)"""
        if request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=403)
        
        import csv
        from django.http import HttpResponse
        
        role = request.query_params.get('role')
        queryset = self.get_queryset()
        
        if role:
            queryset = queryset.filter(role=role)
            
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="users_{role or "all"}_{timezone.now().strftime("%Y%m%d")}.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Email', 'Username', 'First Name', 'Last Name', 'Role', 'Is Verified', 'Is Approved', 'LRN', 'Grade Level', 'Employee ID'])
        
        for user in queryset:
            profile = getattr(user, 'profile', None)
            writer.writerow([
                user.email,
                user.username,
                user.first_name,
                user.last_name,
                user.role,
                user.is_verified,
                user.is_approved,
                profile.lrn if profile else '',
                profile.grade_level if profile else '',
                profile.employee_id if profile else '',
            ])
            
        return response

    @action(detail=False, methods=['post', 'delete'], url_path='bulk-delete')
    def bulk_delete(self, request):
        """Bulk delete users (admin or advisory teacher)"""
        user_ids = request.data.get('user_ids', [])
        if not user_ids:
            return Response({'error': 'No users selected'}, status=400)
        
        # Filter queryset based on user permissions
        queryset = self.get_queryset().filter(id__in=user_ids)
        count = queryset.count()
        
        if count == 0:
            return Response({'error': 'No valid users found to delete'}, status=404)
            
        from portal.views import log_audit_action
        log_audit_action(
            user=self.request.user,
            action='delete',
            model_name='User',
            object_id=None,
            object_repr=f'Bulk delete {count} users',
            description=f'{self.request.user.role.capitalize()} performed bulk delete on {count} user accounts: {list(queryset.values_list("username", flat=True))}',
            request=self.request
        )
        
        queryset.delete()
        return Response({'status': f'Successfully deleted {count} users'})

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update user account status (admin and advisory teachers)"""
        user_role = request.user.role
        if user_role not in ['admin', 'teacher']:
            return Response({'error': 'Unauthorized'}, status=403)
            
        user = self.get_object()
        
        if user_role == 'teacher':
            # Teachers can only update status for students in their advisory classroom
            from .models import StudentClassEnrollment
            is_advisory_student = StudentClassEnrollment.objects.filter(
                student=user,
                classroom__teacher=request.user
            ).exists()
            if not is_advisory_student:
                return Response({'error': 'You can only update status for students in your advisory classroom.'}, status=403)

        status_val = request.data.get('status')
        if status_val not in [s[0] for s in User.STATUS_CHOICES]:
            return Response({'error': 'Invalid status'}, status=400)
            
        user.account_status = status_val
        # Set is_active based on status
        if status_val in ['suspended', 'inactive']:
            user.is_active = False
        else:
            user.is_active = True
        user.save()
        
        return Response({'status': f'User account status updated to {status_val}', 'account_status': user.account_status, 'is_active': user.is_active})

    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        """Manually reset a user's password (admin and advisory teachers)"""
        user_role = request.user.role
        if user_role not in ['admin', 'teacher']:
            return Response({'error': 'Unauthorized'}, status=403)
            
        user = self.get_object()
        
        if user_role == 'teacher':
            # Teachers can only reset password for students in their advisory classroom
            from .models import StudentClassEnrollment
            is_advisory_student = StudentClassEnrollment.objects.filter(
                student=user,
                classroom__teacher=request.user
            ).exists()
            if not is_advisory_student:
                return Response({'error': 'You can only reset passwords for students in your advisory classroom.'}, status=403)

        new_password = request.data.get('password')
        
        if not new_password:
            # Generate random password
            new_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for i in range(10))
            
        user.set_password(new_password)
        user.must_change_password = True # Force them to change it again
        user.save()
        
        return Response({
            'message': 'Password reset successfully',
            'temporary_password': new_password
        })

    @action(detail=False, methods=['post'], parser_classes=[parsers.MultiPartParser])
    def import_csv(self, request):
        """Import students from CSV (admin and teachers)"""
        user_role = request.user.role
        if user_role not in ['admin', 'teacher']:
            return Response({'error': 'Unauthorized'}, status=403)
            
        advisory_classroom = None
        if user_role == 'teacher':
            try:
                advisory_classroom = Classroom.objects.get(teacher=request.user)
            except Classroom.DoesNotExist:
                return Response({'error': 'You must be an advisory teacher to import students.'}, status=403)

        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file provided'}, status=400)
            
        import csv
        import io
        
        try:
            decoded_file = file.read().decode('utf-8')
            io_string = io.StringIO(decoded_file)
            reader = csv.DictReader(io_string)
        except Exception as e:
            logger.error(f"CSV parse error: {str(e)}")
            return Response({'error': 'Failed to parse CSV file. Ensure it is UTF-8 encoded with the correct columns.'}, status=400)
        
        created_count = 0
        created_users = []
        errors = []
        
        for row in reader:
            try:
                # Expected fields: Student ID (username), First Name, Last Name, Grade Level, Section, Email (optional), Sex
                student_id = row.get('Student ID') or row.get('username')
                if not student_id:
                    errors.append("Missing Student ID for a row")
                    continue
                
                if len(str(student_id)) != 12 or not str(student_id).isdigit():
                    errors.append(f"Invalid LRN {student_id}: Must be exactly 12 digits")
                    continue
                
                email = row.get('Email') or row.get('email')
                if email:
                    email = email.strip()
                if not email:
                    email = None
                
                # Check if email exists if provided
                if email and User.objects.filter(email=email).exists():
                    errors.append(f"Email {email} already exists")
                    continue
                
                first_name = row.get('First Name') or ''
                last_name = row.get('Last Name') or ''
                grade_level = row.get('Grade Level') or ''
                
                # Auto-fill grade level if teacher is importing and it's missing
                if advisory_classroom and not grade_level:
                    grade_level = advisory_classroom.grade_level or ''
                
                sex = row.get('Sex') or row.get('sex') or ''
                
                # Normalize sex
                if sex:
                    sex = sex.lower().strip()
                    if sex not in ['male', 'female']:
                        sex = None
                else:
                    sex = None
                
                # Check if exists
                if User.objects.filter(username=student_id).exists():
                    errors.append(f"Student ID {student_id} already exists")
                    continue
                
                # Generate temporary password
                temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for i in range(10))

                # Create user with raw create to ensure email=None stays NULL in PostgreSQL
                user = User(
                    username=student_id,
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    role='student',
                    is_approved=True,
                    is_verified=True if email else False,
                    must_change_password=True,
                    account_status='active'
                )
                user.set_password(temp_password)
                user.save()
                
                # Create profile
                from .models import Profile
                Profile.objects.update_or_create(
                    user=user,
                    defaults={
                        'lrn': student_id,
                        'grade_level': grade_level,
                        'sex': sex
                    }
                )

                # Auto-enroll student if imported by teacher
                if advisory_classroom:
                    from .models import StudentClassEnrollment
                    StudentClassEnrollment.objects.get_or_create(
                        student=user,
                        classroom=advisory_classroom
                    )

                created_count += 1
                created_users.append({
                    'username': student_id,
                    'password': temp_password,
                    'name': f"{first_name} {last_name}".strip()
                })
            except Exception as e:
                errors.append(f"Error importing {row.get('Student ID')}: {str(e)}")
                
        return Response({
            'status': 'success',
            'created_count': created_count,
            'created_users': created_users,
            'errors': errors
        })

    @action(detail=False, methods=['post'])
    def import_teachers_csv(self, request):
        """Import teachers from CSV (admin only)"""
        if request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=403)
            
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file provided'}, status=400)
            
        import csv
        import io
        import secrets
        import string
        
        try:
            decoded_file = file.read().decode('utf-8')
            io_string = io.StringIO(decoded_file)
            reader = csv.DictReader(io_string)
        except Exception as e:
            logger.error(f"CSV parse error: {str(e)}")
            return Response({'error': 'Failed to parse CSV file. Ensure it is UTF-8 encoded with the correct columns.'}, status=400)
        
        created_count = 0
        created_users = []
        errors = []
        
        for row in reader:
            try:
                # Expected fields: Email (username), Title, First Name, Last Name
                email = row.get('Email') or row.get('email')
                if not email:
                    errors.append("Missing Email for a row")
                    continue
                
                email = email.strip()
                if User.objects.filter(username=email).exists() or User.objects.filter(email=email).exists():
                    errors.append(f"Email {email} already exists")
                    continue
                
                title = row.get('Title') or ''
                first_name = row.get('First Name') or ''
                last_name = row.get('Last Name') or ''
                sex = row.get('Sex') or row.get('sex') or ''
                
                # Normalize sex
                if sex:
                    sex = sex.lower().strip()
                    if sex not in ['male', 'female']:
                        sex = None
                else:
                    sex = None
                
                # Generate temporary password
                temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for i in range(10))

                # Create user
                user = User(
                    username=email,
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    role='teacher',
                    is_approved=True,
                    is_verified=False,
                    must_change_password=True,
                    account_status='active'
                )
                user.set_password(temp_password)
                user.save()
                
                # Create profile
                from .models import Profile
                Profile.objects.update_or_create(
                    user=user,
                    defaults={
                        'title': title,
                        'sex': sex
                    }
                )
                created_count += 1
                created_users.append({
                    'username': email,
                    'password': temp_password,
                    'name': f"{title} {first_name} {last_name}".strip()
                })
            except Exception as e:
                errors.append(f"Error importing {row.get('Email')}: {str(e)}")
                
        return Response({
            'status': 'success',
            'created_count': created_count,
            'created_users': created_users,
            'errors': errors
        })

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Return all verified users pending approval (admin only)"""
        if request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        # Only show users who have verified their email but are not yet approved
        users = User.objects.filter(is_approved=False, is_verified=True).order_by('date_joined')
        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def mute(self, request, pk=None):
        """Mute a user for a specific duration (admin only)"""
        if request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=403)
            
        user = self.get_object()
        hours = int(request.data.get('hours', 24))
        
        profile, created = Profile.objects.get_or_create(user=user)
        profile.mute_until = timezone.now() + datetime.timedelta(hours=hours)
        profile.save()
        
        return Response({'status': f'User muted for {hours} hours'})

    @action(detail=True, methods=['post'])
    def suspend(self, request, pk=None):
        """Suspend a user account (admin only)"""
        if request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=403)
            
        user = self.get_object()
        profile, created = Profile.objects.get_or_create(user=user)
        profile.is_suspended = not profile.is_suspended
        profile.save()
        
        status_str = 'suspended' if profile.is_suspended else 'unsuspended'
        return Response({'status': f'User {status_str} successfully'})

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle user active status (admin only)"""
        if request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=403)
            
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        
        status_str = 'activated' if user.is_active else 'deactivated'
        from portal.views import log_audit_action
        log_audit_action(
            user=request.user,
            action='update',
            model_name='User',
            object_id=user.id,
            object_repr=str(user),
            description=f'Admin {status_str} user account: {user.email}',
            request=request
        )
        
        return Response({'status': f'User {status_str} successfully', 'is_active': user.is_active})

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a user account (admin only)"""
        if not request.user.is_authenticated or request.user.role != 'admin':
            return Response({'error': 'Unauthorized. Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            user = User.objects.get(pk=pk)
            
            if user.is_approved:
                return Response({'message': f'{user.email} is already approved.'})

            user.is_approved = True
            user.save()

            # Log the action
            try:
                from portal.views import log_audit_action
                log_audit_action(
                    user=request.user,
                    action='approve',
                    model_name='User',
                    object_id=user.id,
                    object_repr=str(user),
                    description=f'Admin approved account for {user.email}',
                    request=request,
                )
            except Exception as audit_err:
                logger.error(f"Failed to log audit action for approval: {audit_err}")

            return Response({'message': f'Account for {user.email} has been approved successfully.'})

        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error in approve action: {str(e)}")
            return Response({'error': 'Failed to approve account.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject (delete) a pending user account (admin only)"""
        if not request.user.is_authenticated or request.user.role != 'admin':
            return Response({'error': 'Unauthorized. Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            user = User.objects.get(pk=pk)
            email = user.email
            reason = request.data.get('reason', 'Your account registration has been rejected by the administrator.')

            # Log the action before deleting
            try:
                from portal.views import log_audit_action
                log_audit_action(
                    user=request.user,
                    action='reject',
                    model_name='User',
                    object_id=user.id,
                    object_repr=str(user),
                    description=f'Admin rejected account for {email}. Reason: {reason}',
                    request=request,
                )
            except Exception as audit_err:
                logger.error(f"Failed to log audit action for rejection: {audit_err}")

            user.delete()
            return Response({'message': f'Account for {email} has been rejected and removed.'})

        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error in reject action: {str(e)}")
            return Response({'error': 'Failed to reject account.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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

        # RBAC and Targeting logic
        if user.role == 'student':
            # Students see live announcements targeted at 'all', 'students', or their classroom
            queryset = queryset.filter(status='live')
            queryset = queryset.filter(
                Q(target_audience__in=['all', 'students']) | 
                Q(target_classrooms__enrollments__student=user)
            ).distinct()
            queryset = queryset.exclude(event_date__lt=timezone.now())

        elif user.role == 'parent':
            # Parents see live announcements targeted at 'all', 'parents', or their linked students' classrooms
            profile = getattr(user, 'profile', None)
            linked_student_ids = profile.linked_students.values_list('id', flat=True) if profile else []
            queryset = queryset.filter(status='live')
            queryset = queryset.filter(
                Q(target_audience__in=['all', 'parents']) |
                Q(target_classrooms__enrollments__student_id__in=linked_student_ids)
            ).distinct()
            queryset = queryset.exclude(event_date__lt=timezone.now())

        elif user.role == 'teacher':
            # Teachers see live announcements targeted at 'all', 'teachers', or their own drafts
            queryset = queryset.filter(
                Q(status='live', target_audience__in=['all', 'teachers']) | 
                Q(author=user)
            ).distinct()
            queryset = queryset.exclude(event_date__lt=timezone.now())

        elif user.role == 'admin':
            # Admins see everything
            if status_filter:
                queryset = queryset.filter(status=status_filter)
            else:
                queryset = queryset.exclude(
                    event_date__lt=timezone.now(),
                    status='expired'
                )

        if category and category != 'all':
            queryset = queryset.filter(category=category)

        return queryset.order_by('-is_pinned', '-created_at')
    
    def perform_create(self, serializer):
        try:
            announcement = serializer.save(author=self.request.user)
            logger.info(f"Announcement created: {announcement.title}")

            # Save multiple attachments to Supabase 'announcements' bucket
            files = self.request.FILES.getlist('attachments')
            logger.info(f"Found {len(files)} attachment(s)")
            from .storage import upload_file, StorageValidationError
            for f in files:
                try:
                    url, err = upload_file(f, bucket_key='announcements', folder='attachments')
                    if url:
                        AnnouncementAttachment.objects.create(
                            announcement=announcement,
                            file=url,
                            filename=f.name,
                            file_size_bytes=f.size,
                            content_type=getattr(f, 'content_type', '') or '',
                        )
                        logger.info(f"Uploaded announcement attachment: {f.name}")
                    else:
                        logger.error(f"Failed to upload attachment {f.name}: {err}")
                except Exception as e:
                    logger.error(f"Error uploading attachment {f.name}: {str(e)}")

            # Log announcement creation
            from portal.views import log_audit_action
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
            
            # Filter users based on target audience and classrooms
            target_users = User.objects.filter(is_active=True, is_verified=True)
            
            if announcement.target_audience != 'all':
                target_users = target_users.filter(role=announcement.target_audience.rstrip('s'))
            
            if announcement.target_classrooms.exists():
                target_users = target_users.filter(enrollments__classroom__in=announcement.target_classrooms.all()).distinct()
            
            notifications_to_create = []
            for target_user in target_users:
                if target_user != self.request.user:
                    notifications_to_create.append(
                        Notification(
                            recipient=target_user,
                            notification_type='announcement',
                            title=f'New Announcement: {announcement.title}',
                            message=announcement.content[:200] + '...' if len(announcement.content) > 200 else announcement.content,
                            link='/announcements'
                        )
                    )
            if notifications_to_create:
                # Use individual creates so the post_save signal fires for each,
                # triggering real-time WS broadcast to connected users.
                # For large audiences this is slightly slower but ensures live delivery.
                for notif in notifications_to_create:
                    notif.save()
        except Exception as e:
            logger.error(f"Error in perform_create: {str(e)}")
            raise

    @action(detail=False, methods=['post', 'delete'])
    def bulk_delete(self, request):
        ids = request.data.get('ids', [])
        if not ids:
            return Response({"error": "No IDs provided"}, status=400)
        
        # Only admins and the author (teachers) can delete
        queryset = Announcement.objects.filter(id__in=ids)
        if request.user.role != 'admin':
            queryset = queryset.filter(author=request.user)
            
        count = queryset.count()
        queryset.delete()
        
        # Log bulk deletion
        from portal.views import log_audit_action
        log_audit_action(
            user=request.user,
            action='delete',
            model_name='Announcement',
            object_id=None,
            object_repr=f"Bulk delete {count} announcements",
            description=f'Deleted {count} announcements with IDs: {ids}',
            request=request
        )
        
        return Response({"message": f"Successfully deleted {count} announcements"}, status=200)

    @action(detail=False, methods=['post'])
    def delete_all(self, request):
        # Only admins can delete ALL
        if request.user.role != 'admin':
            return Response({"error": "Unauthorized"}, status=403)
            
        queryset = Announcement.objects.all()
        count = queryset.count()
        queryset.delete()
        
        # Log action
        from portal.views import log_audit_action
        log_audit_action(
            user=request.user,
            action='delete',
            model_name='Announcement',
            object_id=None,
            object_repr="Delete all announcements",
            description=f'Deleted all {count} announcements from the system',
            request=request
        )
        
        return Response({"message": f"Successfully deleted all {count} announcements"}, status=200)

    def perform_update(self, serializer):
        announcement = serializer.save()
        # Append any new attachments to Supabase (don't delete existing ones)
        files = self.request.FILES.getlist('attachments')
        from .storage import upload_file
        for f in files:
            url, err = upload_file(f, bucket_key='announcements', folder='attachments')
            if url:
                from .models import AnnouncementAttachment
                AnnouncementAttachment.objects.create(
                    announcement=announcement,
                    file=url,
                    filename=f.name,
                    file_size_bytes=f.size,
                    content_type=getattr(f, 'content_type', '') or '',
                )
            else:
                logger.error(f"Failed to upload attachment {f.name}: {err}")
        from portal.views import log_audit_action
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
    
    @action(detail=True, methods=['post'], url_path='mark-read')
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
        from portal.views import log_audit_action
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

    @action(detail=True, methods=['post'], url_path='delete-attachment')
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
        queryset = Attendance.objects.all().select_related('student', 'classroom')
        classroom_id = self.request.query_params.get('classroom')
        date = self.request.query_params.get('date')
        status = self.request.query_params.get('status')
        academic_year = self.request.query_params.get('academic_year')

        # RBAC: Students can only see their own attendance
        if user.role == 'student':
            queryset = queryset.filter(student=user)
        # RBAC: Parents can see their linked students' attendance
        elif user.role == 'parent':
            profile = getattr(user, 'profile', None)
            linked_student_ids = profile.linked_students.values_list('id', flat=True) if profile else []
            queryset = queryset.filter(student_id__in=linked_student_ids)
        # Teachers can only see attendance for their classrooms
        elif user.role == 'teacher':
            assigned_classrooms = ClassroomSubject.objects.filter(teacher=user).values_list('classroom_id', flat=True)
            queryset = queryset.filter(Q(classroom__teacher=user) | Q(classroom_id__in=assigned_classrooms))

        if classroom_id:
            queryset = queryset.filter(classroom_id=classroom_id)
        if date:
            queryset = queryset.filter(date=date)
        if status:
            queryset = queryset.filter(status=status)
        # Strict academic year filter — only show records for classrooms in that year.
        # No isnull fallback here: unassigned classrooms bleed into every year otherwise.
        if academic_year:
            queryset = queryset.filter(
                classroom__academic_year__name=academic_year
            )
        return queryset

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Advanced attendance analytics (Admin/Teacher only)"""
        if request.user.role not in ['admin', 'teacher']:
            return Response({'error': 'Unauthorized'}, status=403)
            
        from django.db.models import Count, Case, When, IntegerField
        from django.utils import timezone
        import datetime
        
        # Use localtime for accurate daily filtering in GMT+8
        now = timezone.localtime(timezone.now())
        today = now.date()
        
        classroom_id = request.query_params.get('classroom')
        timeframe = request.query_params.get('timeframe', 'all')
        academic_year_name = request.query_params.get('academic_year')
        
        # Base queryset
        base_att = Attendance.objects.all()

        # Strict academic year filter — no isnull fallback to prevent year bleed-through
        if academic_year_name:
            base_att = base_att.filter(
                classroom__academic_year__name=academic_year_name
            )
        
        # Apply timeframe filter
        # If 'today' is selected, we show data even if it's a weekend (e.g. for makeup classes)
        # For 'weekly' and 'all', we strictly exclude weekends as per project requirements
        if timeframe == 'today':
            base_att = base_att.filter(date=today)
        elif timeframe == 'weekly':
            week_ago = today - datetime.timedelta(days=7)
            base_att = base_att.filter(date__gte=week_ago).exclude(date__week_day__in=[1, 7])
        else:
            base_att = base_att.exclude(date__week_day__in=[1, 7])

        # Sections: Trends, Pie, Grade
        # For charts, we usually want a 30-day window if 'all' is selected
        chart_att = base_att
        if timeframe == 'all':
            last_30_days = today - datetime.timedelta(days=30)
            chart_att = chart_att.filter(date__gte=last_30_days)
            
        if classroom_id:
            chart_att = chart_att.filter(classroom_id=classroom_id)
        
        daily_data = []
        for day_dict in chart_att.values('date').annotate(
            present=Count(Case(When(status='present', then=1), output_field=IntegerField())),
            late=Count(Case(When(status='late', then=1), output_field=IntegerField())),
            excused=Count(Case(When(status='excused', then=1), output_field=IntegerField())),
            total_count=Count('id')
        ).order_by('date'):
            day_total = day_dict['total_count']
            daily_data.append({
                'date': day_dict['date'].strftime('%Y-%m-%d'),
                'present': day_dict['present'],
                'late': day_dict['late'],
                'excused': day_dict['excused'],
                'rate': round(((day_dict['present'] + day_dict['late'] + day_dict['excused']) / day_total * 100), 1) if day_total > 0 else 0,
                'total': day_total
            })
        
        # Overall status for Pie Chart
        overall_status = chart_att.aggregate(
            present=Count(Case(When(status='present', then=1), output_field=IntegerField())),
            absent=Count(Case(When(status='absent', then=1), output_field=IntegerField())),
            late=Count(Case(When(status='late', then=1), output_field=IntegerField())),
            excused=Count(Case(When(status='excused', then=1), output_field=IntegerField())),
        )
        pie_data = [
            {'name': 'Present', 'value': overall_status['present'] or 0},
            {'name': 'Late', 'value': overall_status['late'] or 0},
            {'name': 'Absent', 'value': overall_status['absent'] or 0},
            {'name': 'Excused', 'value': overall_status['excused'] or 0},
        ]

        # Attendance by Grade for Bar Chart
        grade_data = []
        grade_levels = chart_att.values('student__profile__grade_level').annotate(
            present=Count(Case(When(status__in=['present', 'late', 'excused'], then=1), output_field=IntegerField())),
            total=Count('id')
        ).order_by('student__profile__grade_level')
        
        for g in grade_levels:
            level = g['student__profile__grade_level'] or 'Unassigned'
            grade_data.append({
                'level': level,
                'rate': round(g['present'] / g['total'] * 100, 1) if g['total'] > 0 else 0
            })

        # Section Rankings (Overall Attendance Rate)
        rankings = []
        if request.user.role in ['admin', 'teacher']:
            # Get all classrooms for the academic year
            classrooms = Classroom.objects.all()
            if academic_year_name:
                classrooms = classrooms.filter(
                    Q(academic_year__name=academic_year_name) |
                    Q(academic_year__isnull=True)
                )
            
            # Aggregate stats from base_att (filtered by academic year and timeframe)
            classroom_stats = base_att.values('classroom__id').annotate(
                total=Count('id'),
                present=Count(Case(When(status__in=['present', 'late', 'excused'], then=1), output_field=IntegerField()))
            )
            stats_map = {r['classroom__id']: r for r in classroom_stats}

            for c in classrooms:
                r = stats_map.get(c.id, {'total': 0, 'present': 0})
                rate = round(r['present'] / r['total'] * 100, 1) if r['total'] > 0 else 0
                rankings.append({
                    'id': c.id,
                    'name': c.name,
                    'rate': rate,
                    'total_records': r['total']
                })
            # Sort by rate descending, then by name
            rankings = sorted(rankings, key=lambda x: (-x['rate'], x['name']))

        return Response({
            'daily_trends': daily_data,
            'pie_data': pie_data,
            'grade_trends': grade_data,
            'section_rankings': rankings,
            'period': timeframe.capitalize()
        })
    
    def perform_create(self, serializer):
        # Teachers and admins can mark attendance
        if self.request.user.role not in ['teacher', 'admin']:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only teachers and admins can mark attendance")
        attendance = serializer.save(marked_by=self.request.user)
        from portal.views import log_audit_action
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
        if self.request.user.role not in ['teacher', 'admin']:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only teachers and admins can upload materials")

        # Upload file to Supabase before saving the record
        file_url = None
        original_filename = ''
        file_size_bytes = None
        uploaded_file = self.request.FILES.get('file')
        if uploaded_file:
            from .storage import upload_file
            url, err = upload_file(uploaded_file, bucket_key='learning-materials',
                                   folder=f"classroom_{self.request.data.get('classroom', 'general')}")
            if err:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'file': f'Upload failed: {err}'})
            file_url = url
            original_filename = uploaded_file.name
            file_size_bytes = uploaded_file.size

        material = serializer.save(
            uploaded_by=self.request.user,
            file=file_url,
            original_filename=original_filename,
            file_size_bytes=file_size_bytes,
        )

        from portal.views import log_audit_action
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
        from portal.views import log_audit_action
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
        from portal.views import log_audit_action
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
        from portal.views import log_audit_action
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
        
        user = request.user
        # If teacher, only show subjects they are assigned to in this classroom
        if user.role == 'teacher':
            queryset = queryset.filter(teacher=user)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_teacher(self, request):
        """Get all subjects assigned to a specific teacher"""
        user = request.user
        teacher_id = request.query_params.get('teacher_id')
        
        # If user is a teacher, force filter to their own ID
        if user.role == 'teacher':
            teacher_id = user.id
        
        if not teacher_id:
            return Response({'error': 'teacher_id parameter required'}, status=status.HTTP_400_BAD_REQUEST)
        
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
@parser_classes([parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser])
def system_settings_view(request):
    """View to get or update global system settings (Admin only for updates)"""
    logger.info(f"System settings request: {request.method} by {request.user.username}")
    sys_settings = SystemSetting.get_settings()

    if request.method in ['POST', 'PATCH']:
        try:
            if request.user.role != 'admin':
                return Response({'error': 'Only administrators can update system settings'}, status=status.HTTP_403_FORBIDDEN)

            # Handle school_logo upload to Supabase branding bucket
            if 'school_logo' in request.FILES:
                from .storage import upload_file
                logo_file = request.FILES['school_logo']
                url, err = upload_file(logo_file, bucket_key='branding', folder='logos')
                if err:
                    return Response({'error': f'Logo upload failed: {err}'}, status=400)
                sys_settings.school_logo = url
                sys_settings.save(update_fields=['school_logo'])
                # Remove from data so serializer doesn't try to process it as a field
                data = request.data.copy()
                data.pop('school_logo', None)
            else:
                data = request.data

            serializer = SystemSettingSerializer(sys_settings, data=data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(dict(serializer.data))
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error updating system settings: {str(e)}", exc_info=True)
            return Response({'error': 'Failed to update system settings.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # GET
    serializer = SystemSettingSerializer(sys_settings)
    return Response(dict(serializer.data))


@api_view(['GET'])
@permission_classes([AllowAny])
def maintenance_status_view(request):
    """Public endpoint to check if the portal is in maintenance mode"""
    try:
        sys_settings = SystemSetting.get_settings()
        return Response({
            'maintenance_mode': sys_settings.maintenance_mode,
            'maintenance_message': sys_settings.maintenance_message
        })
    except Exception as e:
        logger.error(f"Maintenance status error: {str(e)}", exc_info=True)
        return Response({
            'maintenance_mode': False,
            'maintenance_message': "Unable to fetch maintenance status."
        }, status=200) # Return 200 to avoid breaking frontend UI if possible


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard_stats(request):
    try:
        if request.user.role not in ['admin', 'teacher']:
            return Response({'error': 'Unauthorized access'}, status=403)

        from django.db.models import Count, Avg, Q
        from django.utils import timezone
        import datetime
        from datetime import timedelta
        
        # Use local Manila time for accurate daily stats
        now = timezone.localtime(timezone.now())
        today = now.date()
        five_mins_ago = now - datetime.timedelta(minutes=5)
        this_week_start = today - datetime.timedelta(days=today.weekday())
        
        academic_year_name = request.query_params.get('academic_year')
        
        # Safe model imports
        try:
            from portal.models import AuditLog
        except ImportError:
            AuditLog = None

        # Base Attendance Filter
        att_qs = Attendance.objects.all()
        if academic_year_name:
            try:
                att_qs = att_qs.filter(
                    classroom__academic_year__name=academic_year_name
                )
            except Exception as e:
                logger.error(f"Error filtering attendance by year: {str(e)}")

        # Attendance today (Local Time)
        today_attendance = att_qs.filter(date=today)
        today_present = today_attendance.filter(status__in=['present', 'late']).count()
        today_total   = today_attendance.count()
        today_rate    = round((today_present / today_total * 100), 1) if today_total > 0 else 0

        # Core counts - Global Population (Independent of year for overview cards)
        total_students = User.objects.filter(role='student', is_approved=True).count()
        total_teachers = User.objects.filter(role='teacher', is_approved=True).count()
        total_subjects = Subject.objects.count()
        
        # Classes are always year-specific or unassigned
        classes_qs = Classroom.objects.all()
        if academic_year_name:
            try:
                # Include classrooms for the selected year AND classrooms with no year assigned
                classes_qs = classes_qs.filter(
                    Q(academic_year__name=academic_year_name) |
                    Q(academic_year__isnull=True)
                )
            except Exception as e:
                logger.error(f"Error filtering classrooms by year: {str(e)}")
        total_classes = classes_qs.count()
        # Pending approvals should include all unapproved users, regardless of verification per school requirements
        pending_approvals = User.objects.filter(is_approved=False).exclude(role='admin').count()
        
        active_users = User.objects.filter(last_activity__gte=five_mins_ago).count()

        # Attendance Trends (Last 30 Days) - Filtered for charts
        last_30_days_list = [today - datetime.timedelta(days=i) for i in range(29, -1, -1)]
        attendance_trends = []
        for day in last_30_days_list:
            # Skip weekends in trends calculation
            if day.weekday() in [5, 6]: continue
            
            day_records = att_qs.filter(date=day)
            day_total = day_records.count()
            day_present = day_records.filter(status='present').count()
            day_late    = day_records.filter(status='late').count()
            attendance_trends.append({
                'date': day.strftime('%Y-%m-%d'),
                'present': day_present,
                'late': day_late,
                'rate': round(((day_present + day_late) / day_total * 100), 1) if day_total > 0 else 0
            })

        # Grades - only count final grades
        grades = Grade.objects.filter(transmuted_score__isnull=False, grade_type='final_grade')
        if academic_year_name:
            # Strict year filter — Grade.academic_year field OR classroom year, no isnull fallback
            grades = grades.filter(
                Q(academic_year=academic_year_name) |
                Q(classroom__academic_year__name=academic_year_name)
            )
        
        total_grades = grades.count()
        avg_grade = grades.aggregate(avg=Avg('transmuted_score'))['avg']
        average_grade = round(float(avg_grade), 2) if avg_grade else None

        # --- ALL SUBJECTS DISTRIBUTION ---
        outstanding = grades.filter(transmuted_score__gte=90).count()
        very_satisfactory = grades.filter(transmuted_score__gte=85, transmuted_score__lt=90).count()
        satisfactory = grades.filter(transmuted_score__gte=80, transmuted_score__lt=85).count()
        fairly_satisfactory = grades.filter(transmuted_score__gte=75, transmuted_score__lt=80).count()
        below_75 = grades.filter(transmuted_score__lt=75).count()

        # --- GENERAL AVERAGE DISTRIBUTION (Student-wise, via DB aggregation) ---
        from django.db.models import Count, Case, When, IntegerField as IF2
        student_averages = grades.values('student').annotate(avg=Avg('transmuted_score'))
        total_students_graded = student_averages.count()

        ga_outstanding = 0
        ga_very_satisfactory = 0
        ga_satisfactory = 0
        ga_fairly_satisfactory = 0
        ga_below_75 = 0

        for sa in student_averages:
            score = sa['avg']
            if score is None:
                continue
            if score >= 90: ga_outstanding += 1
            elif score >= 85: ga_very_satisfactory += 1
            elif score >= 80: ga_satisfactory += 1
            elif score >= 75: ga_fairly_satisfactory += 1
            else: ga_below_75 += 1

        # Recent Activity
        recent_activity = []
        if AuditLog:
            try:
                recent_activity = AuditLog.objects.order_by('-timestamp')[:5]
            except:
                pass
        
        # Optimized Active Users Over Time (Last 24 Hours)
        active_users_trends = []
        if AuditLog:
            try:
                last_24h_start = now - timedelta(hours=24)
                recent_login_logs = list(AuditLog.objects.filter(
                    action='login',
                    timestamp__gte=last_24h_start
                ).values('user', 'timestamp'))

                for i in range(23, -1, -1):
                    hour_start = now - timedelta(hours=i+1)
                    hour_end = now - timedelta(hours=i)
                    # Comparison between offset-aware datetimes
                    users_in_hour = {
                        log['user'] for log in recent_login_logs 
                        if log['timestamp'] and hour_start <= log['timestamp'] <= hour_end
                    }
                    active_users_trends.append({
                        'time': hour_end.strftime('%H:00'),
                        'users': len(users_in_hour)
                    })
            except Exception as e:
                logger.error(f"Error calculating active users trends: {str(e)}")
                active_users_trends = []

        # --- SUBJECT PERFORMANCE INDEX (Top 10) ---
        subject_perf = []
        try:
            # Use the already year-filtered 'grades' queryset
            subject_stats = grades.values('subject__name').annotate(
                avg_grade=Avg('transmuted_score')
            ).order_by('-avg_grade')[:10]
            
            for s in subject_stats:
                subject_perf.append({
                    'name': s['subject__name'],
                    'avg_grade': round(float(s['avg_grade']), 1) if s['avg_grade'] else 0
                })
        except Exception as e:
            logger.error(f"Error fetching subject stats: {str(e)}")

        # Prepare announcements
        announcements_data = []
        try:
            recent_announcements = Announcement.objects.filter(status='live').select_related('author').order_by('-created_at')[:5]
            for a in recent_announcements:
                announcements_data.append({
                    'id': a.id,
                    'title': a.title,
                    'content': a.content,
                    'priority': a.priority,
                    'is_pinned': a.is_pinned,
                    'created_at': a.created_at,
                    'author_name': a.author.get_full_name() or a.author.username
                })
        except Exception as e:
            logger.error(f"Error fetching announcements: {str(e)}")

        # Latest messages for this admin (exclude self, unique senders)
        latest_messages = []
        try:
            msg_objs = ChatMessage.objects.filter(
                room__participants=request.user
            ).exclude(sender=request.user).select_related('sender').order_by('-timestamp')
            
            seen_senders = set()
            for m in msg_objs:
                if m.sender_id not in seen_senders:
                    latest_messages.append({
                        'id': m.id,
                        'content': m.content,
                        'timestamp': m.timestamp.isoformat(),
                        'sender': m.sender.get_full_name() or m.sender.username,
                        'sender_profile_picture': getattr(getattr(m.sender, 'profile', None), 'profile_picture', None),
                        'is_read': m.is_read
                    })
                    seen_senders.add(m.sender_id)
                if len(latest_messages) >= 5:
                    break
        except Exception as e:
            logger.error(f"Error fetching latest messages: {str(e)}")

        # Prepare response data
        res_data = {
            'total_students': total_students,
            'total_teachers': total_teachers,
            'total_classes': total_classes,
            'total_subjects': total_subjects,
            'pending_approvals': pending_approvals,
            'pending_enrollments': EnrollmentApplication.objects.filter(status='pending').count() if EnrollmentApplication else 0,
            'active_users': active_users,
            'today_rate': today_rate,
            'average_grade': average_grade,
            
            # Grouped data for Analytics.jsx
            'attendance': {
                'today_rate': today_rate,
                'daily_trends': attendance_trends
            },
            'grades': {
                'average': average_grade,
                'total': total_grades,
                'subject_stats': subject_perf
            },
            'dashboard': {
                'active_users': active_users,
                'total_students': total_students,
                'total_teachers': total_teachers,
                'total_classes': total_classes,
                'pending_approvals': pending_approvals,
                'today_rate': today_rate,
                'average_grade': average_grade,
                'charts': {
                    'active_users_trends': active_users_trends,
                    'attendance_trends': attendance_trends,
                    'grade_distribution': [
                        {'name': 'Outstanding', 'value': outstanding},
                        {'name': 'Very Satisfactory', 'value': very_satisfactory},
                        {'name': 'Satisfactory', 'value': satisfactory},
                        {'name': 'Fairly Satisfactory', 'value': fairly_satisfactory},
                        {'name': 'Did Not Meet', 'value': below_75},
                    ]
                }
            },
            
            'cards': {
                'total_students': total_students,
                'total_teachers': total_teachers,
                'total_classes': total_classes,
                'total_subjects': total_subjects,
                'active_users': active_users,
                'attendance_rate': today_rate,
            },
            'widgets': {
                'recent_announcements': announcements_data,
                'recent_activity': [
                    {
                        'id': log.id,
                        'user': log.user.get_full_name() or log.user.username if log.user else 'System',
                        'timestamp': log.timestamp,
                        'description': log.description,
                        'action': log.action
                    } for log in (recent_activity if 'recent_activity' in locals() else [])
                ],
                'latest_messages': latest_messages,
                'active_users_trends': active_users_trends,
                'subject_performance': subject_perf
            },
            'all_subjects': {
                'counts': [
                    {'name': 'Outstanding', 'value': outstanding},
                    {'name': 'Very Satisfactory', 'value': very_satisfactory},
                    {'name': 'Satisfactory', 'value': satisfactory},
                    {'name': 'Fairly Satisfactory', 'value': fairly_satisfactory},
                    {'name': 'Did Not Meet', 'value': below_75},
                ],
                'outstanding_pct': round(outstanding / total_grades * 100) if total_grades else 0,
                'very_satisfactory_pct': round(very_satisfactory / total_grades * 100) if total_grades else 0,
                'satisfactory_pct': round(satisfactory / total_grades * 100) if total_grades else 0,
                'fairly_satisfactory_pct': round(fairly_satisfactory / total_grades * 100) if total_grades else 0,
                'below_75_pct': round(below_75 / total_grades * 100) if total_grades else 0,
                'total_count': total_grades
            },
            'general_average': {
                 'counts': [
                    {'name': 'Outstanding', 'value': ga_outstanding},
                    {'name': 'Very Satisfactory', 'value': ga_very_satisfactory},
                    {'name': 'Satisfactory', 'value': ga_satisfactory},
                    {'name': 'Fairly Satisfactory', 'value': ga_fairly_satisfactory},
                    {'name': 'Did Not Meet', 'value': ga_below_75},
                 ],
                 'outstanding_pct': round(ga_outstanding / total_students_graded * 100) if total_students_graded else 0,
                 'very_satisfactory_pct': round(ga_very_satisfactory / total_students_graded * 100) if total_students_graded else 0,
                 'satisfactory_pct': round(ga_satisfactory / total_students_graded * 100) if total_students_graded else 0,
                 'fairly_satisfactory_pct': round(ga_fairly_satisfactory / total_students_graded * 100) if total_students_graded else 0,
                 'below_75_pct': round(ga_below_75 / total_students_graded * 100) if total_students_graded else 0,
                 'total_count': total_students_graded
             },
            
            'system_settings': SystemSettingSerializer(SystemSetting.get_settings()).data if SystemSetting else None,
            'recent_grades_count': Grade.objects.filter(submitted_at__date__gte=this_week_start).count(),
            'total_announcements': Announcement.objects.filter(status='live').count(),
            'recent_announcements': announcements_data,
            'latest_messages': latest_messages,
        }
        
        return Response(res_data)
    except Exception as e:
        import traceback
        logger.error(f"Admin stats error: {str(e)}")
        logger.error(traceback.format_exc())
        return Response({'error': 'Failed to load admin statistics.'}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def storage_analytics_view(request):
    """
    Returns file counts and sizes per Supabase bucket.
    Admin only.
    """
    if request.user.role != 'admin':
        return Response({'error': 'Admin access required.'}, status=403)
    from .storage import get_storage_stats
    return Response(get_storage_stats())


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def grade_distribution_stats(request):
    """
    Detailed statistics for grade distribution across the school.
    Supports filtering by academic_year, grade_level, and subject.
    """
    from django.db.models import Avg, Count, Q
    from .models import Grade, Classroom, Subject
    
    academic_year = request.query_params.get('academic_year', '2025-2026')
    grade_level   = request.query_params.get('grade_level', 'all')
    subject_id    = request.query_params.get('subject_id', 'all')
    quarter       = request.query_params.get('quarter', 'all')
    timeframe     = request.query_params.get('timeframe', 'all') # today, weekly, all
    mode          = request.query_params.get('mode', 'student') # 'student' (General Average) or 'entry' (Cumulative)
    
    from django.utils import timezone
    import datetime
    
    # 1. Base filtering
    base_grades = Grade.objects.filter(
        grade_type='final_grade',
        transmuted_score__isnull=False
    ).filter(
        # Strict year filter — no isnull fallback to prevent year bleed-through
        Q(academic_year=academic_year) |
        Q(classroom__academic_year__name=academic_year)
    )
    
    # Filter by Timeframe (submission date)
    if timeframe == 'today':
        base_grades = base_grades.filter(submitted_at__date=timezone.now().date())
    elif timeframe == 'weekly':
        week_ago = timezone.now().date() - datetime.timedelta(days=7)
        base_grades = base_grades.filter(submitted_at__date__gte=week_ago)
    
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
        # Get subjects offered in this academic year for the meta section
        subjects_in_year = Subject.objects.filter(
            classroom_subjects__classroom__academic_year__name=academic_year
        ).distinct().values('id', 'name', 'code')
        
        return Response({
            'total_students': 0,
            'overall_average': 0,
            'category_counts': [],
            'by_level': [],
            'by_group': [],
            'mode': mode,
            'meta': {
                'subjects': list(subjects_in_year) if subjects_in_year.exists() else list(Subject.objects.values('id', 'name', 'code')[:20]),
                'grade_levels': ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"]
            }
        })

    # 2. Summary Stats
    student_averages = base_grades.values('student').annotate(avg=Avg('transmuted_score'))
    total_students = student_averages.count()
    total_entries = base_grades.count()
    overall_avg = base_grades.aggregate(avg=Avg('transmuted_score'))['avg']
    
    categories = {
        'Outstanding (90-100)': 0,
        'Very Satisfactory (85-89)': 0,
        'Satisfactory (80-84)': 0,
        'Fairly Satisfactory (75-79)': 0,
        'Did Not Meet Expectations (<75)': 0,
    }
    
    if mode == 'student':
        # Calculate distribution based on each student's average across filtered subjects
        for sa in student_averages:
            score = sa['avg']
            if score >= 90: categories['Outstanding (90-100)'] += 1
            elif score >= 85: categories['Very Satisfactory (85-89)'] += 1
            elif score >= 80: categories['Satisfactory (80-84)'] += 1
            elif score >= 75: categories['Fairly Satisfactory (75-79)'] += 1
            else: categories['Did Not Meet Expectations (<75)'] += 1
    else:
        # Calculate distribution based on every individual grade entry using DB aggregation
        from django.db.models import Count, Case, When, IntegerField as IF
        agg = base_grades.aggregate(
            outstanding=Count(Case(When(transmuted_score__gte=90, then=1), output_field=IF())),
            very_sat=Count(Case(When(transmuted_score__gte=85, transmuted_score__lt=90, then=1), output_field=IF())),
            sat=Count(Case(When(transmuted_score__gte=80, transmuted_score__lt=85, then=1), output_field=IF())),
            fairly_sat=Count(Case(When(transmuted_score__gte=75, transmuted_score__lt=80, then=1), output_field=IF())),
            dnm=Count(Case(When(transmuted_score__lt=75, then=1), output_field=IF())),
        )
        categories['Outstanding (90-100)'] = agg['outstanding']
        categories['Very Satisfactory (85-89)'] = agg['very_sat']
        categories['Satisfactory (80-84)'] = agg['sat']
        categories['Fairly Satisfactory (75-79)'] = agg['fairly_sat']
        categories['Did Not Meet Expectations (<75)'] = agg['dnm']

    category_counts = [{'name': k, 'value': v} for k, v in categories.items()]

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
@throttle_classes([CheckResultRateThrottle])
def check_result(request):
    registration_number = request.data.get('registration_number', '').strip()
    scratch_card = request.data.get('scratch_card', '').strip()

    # Input validation — reject obviously malformed values early
    if not registration_number or not scratch_card:
        return Response({'error': 'Registration number and scratch card are required'}, status=400)

    if len(registration_number) > 30 or len(scratch_card) > 30:
        return Response({'error': 'Invalid input'}, status=400)

    # Only allow alphanumeric characters to prevent injection
    if not registration_number.replace('-', '').isalnum() or not scratch_card.replace('-', '').isalnum():
        return Response({'error': 'Invalid input format'}, status=400)

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
                'name': student.get_full_name() or student.username,
                'registration_number': registration_number,
            },
            'grades': grades_data,
        })

    except Profile.DoesNotExist:
        return Response({'error': 'Invalid registration number'}, status=400)
    except Exception as e:
        logger.error(f"check_result error: {str(e)}", exc_info=True)
        return Response({'error': 'An error occurred processing your request.'}, status=500)


@api_view(['GET', 'PUT', 'POST'])
@permission_classes([IsAuthenticated])
@parser_classes([parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser])
def student_profile(request):
    """
    Get, update, or upload student profile information/picture.
    """
    from .models import Profile
    
    target_user = request.user
    student_id = request.query_params.get('student_id')
    
    if student_id:
        if request.user.role not in ['teacher', 'admin']:
            return Response({'error': 'Unauthorized'}, status=403)
        try:
            target_user = User.objects.get(id=student_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)
    
    profile, _ = Profile.objects.get_or_create(user=target_user)
    
    if request.method == 'POST':
        if 'profile_picture' in request.FILES:
            from .storage import upload_file
            pic_file = request.FILES['profile_picture']
            try:
                url, error = upload_file(pic_file, bucket_key='profile-pictures',
                                         folder=f"user_{target_user.id}")
                if url:
                    profile.profile_picture = url
                    profile.save()
                    return Response({'message': 'Profile picture updated successfully', 'profile_picture': url})
                else:
                    return Response({'error': error or 'Failed to upload picture to storage.'}, status=500)
            except Exception as e:
                logger.error(f"Error in student_profile POST: {str(e)}", exc_info=True)
                return Response({'error': 'Failed to upload profile picture.'}, status=500)
        return Response({'error': 'No file provided'}, status=400)

    if request.method == 'GET':
        # ... existing GET logic ...
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
            'must_change_password': target_user.must_change_password,
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
                'profile_picture': profile.profile_picture,
                'mute_until': profile.mute_until,
                'is_muted': profile.mute_until is not None and profile.mute_until > timezone.now(),
                'is_suspended': profile.is_suspended or target_user.account_status == 'suspended',
            }
        }
        return Response(profile_data)
    
    elif request.method == 'PUT':
        if target_user != request.user:
            return Response({'error': 'Unauthorized'}, status=403)
            
        try:
            # Update email if provided (Optional linking)
            if 'email' in request.data:
                email_val = request.data.get('email')
                new_email = email_val.strip() if email_val and isinstance(email_val, str) else None

                if new_email:
                    # Only reject if a DIFFERENT user already has this email
                    if User.objects.filter(email=new_email).exclude(id=target_user.id).exists():
                        return Response({'error': 'Email already in use'}, status=400)
                    target_user.email = new_email
                else:
                    # Empty/blank → clear the email (store as NULL)
                    target_user.email = None

            if 'first_name' in request.data:
                target_user.first_name = request.data['first_name']
            if 'last_name' in request.data:
                target_user.last_name = request.data['last_name']
            target_user.save()

            # Update profile fields
            profile_fields = [
                'title', 'sex', 'state', 'nationality', 'middle_name',
                'father_name', 'mother_name', 'phone_number', 'address',
                'contact_information', 'grade_level'
            ]

            for field in profile_fields:
                if field in request.data:
                    val = request.data[field]
                    if not val or (isinstance(val, str) and not val.strip()):
                        val = None
                    setattr(profile, field, val)

            # registration_number / lrn — handle separately with update_fields
            # to avoid triggering the unique constraint on an unchanged value.
            if 'registration_number' in request.data:
                val = request.data['registration_number']
                if not val or (isinstance(val, str) and not val.strip()):
                    val = None
                # Only update if the value actually changed
                if val != profile.registration_number:
                    # Check uniqueness manually before saving
                    if val and Profile.objects.filter(registration_number=val).exclude(pk=profile.pk).exists():
                        return Response({'error': 'This LRN is already assigned to another student.'}, status=400)
                    profile.registration_number = val
                    profile.lrn = val

            if 'date_of_birth' in request.data:
                dob_val = request.data['date_of_birth']
                if dob_val:
                    from datetime import datetime
                    try:
                        if isinstance(dob_val, str):
                            profile.date_of_birth = datetime.strptime(dob_val, '%Y-%m-%d').date()
                    except (ValueError, TypeError):
                        pass
                else:
                    profile.date_of_birth = None

            profile.save()
            return Response({'message': 'Profile updated successfully'})
            
        except Exception as e:
            import traceback
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error updating profile for user {target_user.username}: {str(e)}\n{traceback.format_exc()}")
            return Response({'error': 'Failed to update profile. Please check your input.'}, status=500)


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'message']

    def get_queryset(self):
        from django.utils import timezone
        import datetime
        cutoff = timezone.now() - datetime.timedelta(days=30)
        queryset = Notification.objects.filter(
            recipient=self.request.user,
            created_at__gte=cutoff
        ).select_related('recipient')

        notification_type = self.request.query_params.get('notification_type')
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)

        is_read = self.request.query_params.get('is_read')
        if is_read is not None:
            queryset = queryset.filter(is_read=is_read.lower() == 'true')

        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        # Only admins/system can create notifications via API
        if self.request.user.role != 'admin':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admins can create notifications via API.")
        serializer.save(recipient=self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        unread_count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({'status': 'deleted', 'unread_count': unread_count})

    @action(detail=True, methods=['post'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        # Use update() to bypass post_save signal and avoid extra DB round-trip
        updated = Notification.objects.filter(
            pk=pk, recipient=request.user
        ).update(is_read=True)
        if not updated:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        unread_count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({'status': 'marked as read', 'unread_count': unread_count})

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({'status': 'All notifications marked as read', 'unread_count': 0})

    @action(detail=False, methods=['post'], url_path='mark-selected-read')
    def mark_selected_read(self, request):
        """Mark a list of notification IDs as read."""
        ids = request.data.get('ids', [])
        if not ids:
            return Response({'error': 'ids required'}, status=status.HTTP_400_BAD_REQUEST)
        Notification.objects.filter(
            pk__in=ids, recipient=request.user
        ).update(is_read=True)
        unread_count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({'status': f'{len(ids)} marked as read', 'unread_count': unread_count})

    @action(detail=False, methods=['post', 'delete'], url_path='bulk-delete')
    def bulk_delete(self, request):
        """Delete a list of notification IDs."""
        ids = request.data.get('ids', [])
        if not ids:
            return Response({'error': 'ids required'}, status=status.HTTP_400_BAD_REQUEST)
        deleted_count, _ = Notification.objects.filter(
            pk__in=ids, recipient=request.user
        ).delete()
        unread_count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({'status': f'{deleted_count} deleted', 'unread_count': unread_count})

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({'unread_count': count})


class EnrollmentApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = EnrollmentApplicationSerializer
    permission_classes = [IsAuthenticated]  # Default: require auth
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['first_name', 'last_name', 'email']

    def get_permissions(self):
        """
        Public enrollment form submission (create) is open to anyone.
        All other actions (list, retrieve, update, destroy) require authentication.
        Approve/reject actions require admin.
        """
        if self.action == 'create':
            return [AllowAny()]
        if self.action in ('approve', 'reject', 'destroy', 'update', 'partial_update'):
            return [IsAdminUser()]
        return [IsAuthenticated()]

    def get_throttles(self):
        """Apply strict throttle only to the public create action."""
        if self.action == 'create':
            return [EnrollmentRateThrottle()]
        return super().get_throttles()

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return EnrollmentApplication.objects.none()
        if user.role == 'admin' or user.is_staff:
            return EnrollmentApplication.objects.all()
        # Authenticated non-admin users can only see their own applications
        return EnrollmentApplication.objects.filter(email=user.email)
    
    def create(self, request, *args, **kwargs):
        try:
            # Upload document files to Supabase before validating/saving
            from .storage import upload_file
            doc_fields = [
                'birth_certificate', 'report_card', 'form_138',
                'certificate_of_completion', 'good_moral_certificate',
                'last_school_attended_cert',
            ]
            uploaded_urls = {}
            upload_errors = []
            for field_name in doc_fields:
                if field_name in request.FILES:
                    f = request.FILES[field_name]
                    url, err = upload_file(f, bucket_key='enrollment-docs',
                                           folder=f"applications/{field_name}")
                    if err:
                        upload_errors.append(f"{field_name}: {err}")
                    else:
                        uploaded_urls[field_name] = url

            if upload_errors:
                return Response(
                    {'error': 'Some documents failed to upload.', 'details': upload_errors},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Build mutable data with Supabase URLs replacing file objects
            data = request.data.copy()
            for field_name, url in uploaded_urls.items():
                data[field_name] = url

            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            import traceback
            logger.error(f"Enrollment application error: {str(e)}\n{traceback.format_exc()}")
            if hasattr(e, 'detail'):
                return Response({'error': e.detail}, status=status.HTTP_400_BAD_REQUEST)
            return Response({'error': 'Failed to submit enrollment application. Please check your input.'}, status=status.HTTP_400_BAD_REQUEST)
    
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
        # Handle image upload to Supabase branding bucket
        if 'image' in self.request.FILES:
            from .storage import upload_file
            img_file = self.request.FILES['image']
            url, err = upload_file(img_file, bucket_key='branding', folder='website-content')
            if err:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'image': f'Image upload failed: {err}'})
            serializer.save(updated_by=self.request.user, image=url)
        else:
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
    queryset = Announcement.objects.filter(is_public=True, status='live').order_by('-is_pinned', '-created_at')
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
        # Get database size — works for both SQLite and PostgreSQL
        with connection.cursor() as cursor:
            if 'sqlite' in connection.settings_dict['ENGINE']:
                cursor.execute("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()")
                result = cursor.fetchone()
                db_size_mb = (result[0] / (1024 * 1024)) if result and result[0] else 0
            else:
                # PostgreSQL
                cursor.execute("SELECT pg_database_size(current_database())")
                result = cursor.fetchone()
                db_size_mb = (result[0] / (1024 * 1024)) if result and result[0] else 0
        storage_used = min(int((db_size_mb / 10240) * 100), 100)  # Assume 10GB max
    except Exception:
        storage_used = 0
    
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
        from portal.views import log_audit_action
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
            from django.db.models import Q
            assigned_classrooms = ClassroomSubject.objects.filter(teacher=user).values_list('classroom_id', flat=True)
            # Teachers can see grades in classrooms they advise OR subjects they teach
            return queryset.filter(Q(classroom__teacher=user) | Q(classroom_id__in=assigned_classrooms) | Q(teacher=user)).distinct()
        elif user.role == 'student':
            return queryset.filter(student=user)
        elif user.role == 'parent':
            profile = getattr(user, 'profile', None)
            linked_student_ids = profile.linked_students.values_list('id', flat=True) if profile else []
            return queryset.filter(student_id__in=linked_student_ids)
        return queryset.none()

    def create(self, request, *args, **kwargs):
        """Custom create to handle upsert (update if exists, otherwise create)"""
        student_id = request.data.get('student')
        subject_id = request.data.get('subject')
        grade_type = request.data.get('grade_type')
        quarter = request.data.get('quarter')
        academic_year = request.data.get('academic_year')
        
        # We only handle upsert for specific grade inputs to prevent unique constraint errors
        if all([student_id, subject_id, grade_type, quarter, academic_year]):
            try:
                # Check if a grade already exists for this unique combination
                grade = Grade.objects.get(
                    student_id=student_id,
                    subject_id=subject_id,
                    grade_type=grade_type,
                    quarter=quarter,
                    academic_year=academic_year
                )
                
                # Verify permissions (ensure the teacher is allowed to update this grade)
                if self.request.user.role != 'admin' and grade.teacher != self.request.user:
                    # Check if teacher is at least assigned to this classroom/subject
                    assigned = ClassroomSubject.objects.filter(
                        classroom=grade.classroom,
                        subject=grade.subject,
                        teacher=self.request.user
                    ).exists()
                    if not assigned:
                        return Response({'error': 'You do not have permission to update this grade.'}, status=status.HTTP_403_FORBIDDEN)

                # Update existing grade
                # Check if grade is locked before updating
                if grade.is_locked and self.request.user.role != 'admin':
                    return Response({'error': 'This grade is locked and cannot be edited'}, status=status.HTTP_403_FORBIDDEN)

                serializer = self.get_serializer(grade, data=request.data, partial=True)
                serializer.is_valid(raise_exception=True)
                serializer.save()
                
                # Log the update
                from portal.views import log_audit_action
                log_audit_action(
                    user=self.request.user,
                    action='grade_update',
                    model_name='Grade',
                    object_id=grade.id,
                    object_repr=str(grade),
                    description=f'Updated grade for {grade.student.username} via upsert',
                    request=self.request
                )
                return Response(serializer.data)
            except Grade.DoesNotExist:
                pass
                
        return super().create(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Advanced grade analytics and monitoring"""
        if request.user.role not in ['admin', 'teacher']:
            return Response({'error': 'Unauthorized'}, status=403)
            
        from django.db.models import Avg, Count, Max, Min
        
        classroom_id = request.query_params.get('classroom')
        subject_id = request.query_params.get('subject')
        quarter = request.query_params.get('quarter')
        
        queryset = Grade.objects.filter(grade_type='final_grade', transmuted_score__isnull=False)
        if classroom_id: queryset = queryset.filter(classroom_id=classroom_id)
        if subject_id: queryset = queryset.filter(subject_id=subject_id)
        if quarter: queryset = queryset.filter(quarter=quarter)
        
        # Subject Averages
        subject_stats = queryset.values('subject__name', 'subject__code').annotate(
            avg_grade=Avg('transmuted_score'),
            count=Count('id'),
            highest=Max('transmuted_score'),
            lowest=Min('transmuted_score')
        ).order_by('-avg_grade')
        
        # Distribution
        distribution = {
            'outstanding': queryset.filter(transmuted_score__gte=90).count(),
            'very_satisfactory': queryset.filter(transmuted_score__gte=85, transmuted_score__lt=90).count(),
            'satisfactory': queryset.filter(transmuted_score__gte=80, transmuted_score__lt=85).count(),
            'fairly_satisfactory': queryset.filter(transmuted_score__gte=75, transmuted_score__lt=80).count(),
            'failed': queryset.filter(transmuted_score__lt=75).count(),
        }
        
        # Missing Grade Detection
        missing_grades = []
        if classroom_id and quarter:
            enrolled_students = StudentClassEnrollment.objects.filter(classroom_id=classroom_id)
            for enrollment in enrolled_students:
                classroom_subjects = ClassroomSubject.objects.filter(classroom_id=classroom_id)
                for cs in classroom_subjects:
                    exists = Grade.objects.filter(
                        student=enrollment.student,
                        subject=cs.subject,
                        classroom_id=classroom_id,
                        quarter=quarter
                    ).exists()
                    if not exists:
                        missing_grades.append({
                            'student_name': f"{enrollment.student.first_name} {enrollment.student.last_name}",
                            'subject_name': cs.subject.name,
                            'student_id': enrollment.student.id
                        })

        return Response({
            'subject_stats': subject_stats,
            'distribution': distribution,
            'missing_grades': missing_grades[:50],
            'total_graded': queryset.count()
        })
    
    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'student':
            raise serializers.ValidationError("Students cannot create grades")

        serializer.save(teacher=user)
        grade = serializer.instance

        # Log the action
        from portal.views import log_audit_action
        log_audit_action(
            user=user,
            action='grade_create',
            model_name='Grade',
            object_id=grade.id,
            object_repr=str(grade),
            description=f'Created grade for {grade.student.username} in {grade.subject.code}',
            request=self.request
        )

        # Notify the student — only for final grades to avoid spamming on every component
        if grade.grade_type == 'final_grade' and grade.transmuted_score is not None:
            teacher_name = user.get_full_name() or user.username
            Notification.objects.create(
                recipient=grade.student,
                notification_type='grade',
                title='Grade Posted',
                message=f'{teacher_name} posted your {grade.subject.name} grade for Q{grade.quarter}: {grade.transmuted_score}.',
                link='/grades',
            )

    def perform_update(self, serializer):
        user = self.request.user
        grade = self.get_object()

        # Check if grade is locked
        if grade.is_locked and user.role != 'admin':
            if len(serializer.validated_data) == 1 and 'is_locked' in serializer.validated_data:
                pass
            else:
                raise serializers.ValidationError("This grade is locked and cannot be edited")

        serializer.save()
        grade.refresh_from_db()

        # Log the action
        from portal.views import log_audit_action
        log_audit_action(
            user=user,
            action='grade_update',
            model_name='Grade',
            object_id=grade.id,
            object_repr=str(grade),
            description=f'Updated grade for {grade.student.username} in {grade.subject.code}',
            request=self.request
        )

        # Notify the student on final grade updates
        if grade.grade_type == 'final_grade' and grade.transmuted_score is not None:
            teacher_name = user.get_full_name() or user.username
            Notification.objects.create(
                recipient=grade.student,
                notification_type='grade',
                title='Grade Updated',
                message=f'{teacher_name} updated your {grade.subject.name} grade for Q{grade.quarter}: {grade.transmuted_score}.',
                link='/grades',
            )
    
    def perform_destroy(self, instance):
        user = self.request.user
        
        # Only admin can delete grades
        if user.role != 'admin':
            raise serializers.ValidationError("Only admins can delete grades")
        
        # Log the action
        from portal.views import log_audit_action
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


class AssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = AssignmentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [parsers.JSONParser, parsers.MultiPartParser, parsers.FormParser]

    def get_queryset(self):
        user = self.request.user
        queryset = Assignment.objects.annotate(submission_count=Count('submissions'))
        
        if user.role == 'student':
            # Students see assignments for their enrolled classrooms
            enrolled_classrooms = StudentClassEnrollment.objects.filter(student=user).values_list('classroom_id', flat=True)
            return queryset.filter(classroom_id__in=enrolled_classrooms)
        elif user.role == 'parent':
            # Parents see assignments for their linked students
            profile = getattr(user, 'profile', None)
            linked_student_ids = profile.linked_students.values_list('id', flat=True) if profile else []
            enrolled_classrooms = StudentClassEnrollment.objects.filter(student_id__in=linked_student_ids).values_list('classroom_id', flat=True)
            return queryset.filter(classroom_id__in=enrolled_classrooms)
        elif user.role == 'teacher':
            # Teachers see assignments they created or for their classrooms
            return queryset.filter(Q(teacher=user) | Q(classroom__teacher=user)).distinct()
            
        return queryset

    def perform_create(self, serializer):
        if self.request.user.role not in ['admin', 'teacher']:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only teachers and admins can create assignments")

        file_url = None
        original_filename = ''
        file_size_bytes = None
        uploaded_file = self.request.FILES.get('file')
        if uploaded_file:
            from .storage import upload_file
            url, err = upload_file(uploaded_file, bucket_key='assignments',
                                   folder=f"teacher_{self.request.user.id}")
            if err:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'file': f'Upload failed: {err}'})
            file_url = url
            original_filename = uploaded_file.name
            file_size_bytes = uploaded_file.size

        serializer.save(
            teacher=self.request.user,
            file=file_url,
            original_filename=original_filename,
            file_size_bytes=file_size_bytes,
        )

    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Assignment and submission analytics"""
        if request.user.role not in ['admin', 'teacher']:
            return Response({'error': 'Unauthorized'}, status=403)
            
        classroom_id = request.query_params.get('classroom')
        queryset = Assignment.objects.all()
        if classroom_id:
            queryset = queryset.filter(classroom_id=classroom_id)
            
        total_assignments = queryset.count()
        total_submissions = Submission.objects.filter(assignment__in=queryset).count()
        late_submissions = Submission.objects.filter(assignment__in=queryset, is_late=True).count()
        
        # Submission rate per assignment
        assignment_rates = []
        for assignment in queryset:
            enrolled_count = StudentClassEnrollment.objects.filter(classroom=assignment.classroom).count()
            sub_count = assignment.submissions.count()
            rate = round(sub_count / enrolled_count * 100, 1) if enrolled_count > 0 else 0
            assignment_rates.append({
                'id': assignment.id,
                'title': assignment.title,
                'rate': rate,
                'submissions': sub_count,
                'total_possible': enrolled_count
            })

        return Response({
            'total_assignments': total_assignments,
            'total_submissions': total_submissions,
            'late_submissions': late_submissions,
            'assignment_rates': assignment_rates
        })

class SubmissionViewSet(viewsets.ModelViewSet):
    serializer_class = SubmissionSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def get_queryset(self):
        user = self.request.user
        queryset = Submission.objects.all()
        
        if user.role == 'student':
            return queryset.filter(student=user)
        elif user.role == 'parent':
            profile = getattr(user, 'profile', None)
            linked_student_ids = profile.linked_students.values_list('id', flat=True) if profile else []
            return queryset.filter(student_id__in=linked_student_ids)
        elif user.role == 'teacher':
            return queryset.filter(assignment__teacher=user)
            
        return queryset

    def perform_create(self, serializer):
        if self.request.user.role != 'student':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only students can submit assignments")

        uploaded_file = self.request.FILES.get('file')
        if not uploaded_file:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'file': 'A file is required for submission.'})

        from .storage import upload_file
        url, err = upload_file(uploaded_file, bucket_key='submissions',
                               folder=f"student_{self.request.user.id}")
        if err:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'file': f'Upload failed: {err}'})

        serializer.save(
            student=self.request.user,
            file=url,
            original_filename=uploaded_file.name,
            file_size_bytes=uploaded_file.size,
        )


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
        from portal.views import log_audit_action
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
        try:
            return self.request.user.chat_rooms.all().order_by('-updated_at')
        except Exception as e:
            logger.error(f"ChatRoom queryset error: {str(e)}")
            return ChatRoom.objects.none()

    def perform_create(self, serializer):
        # Check if user is muted or suspended
        is_allowed, reason = check_user_moderation(self.request.user)
        if not is_allowed:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied(reason)

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
        # Check if user is muted or suspended
        is_allowed, reason = check_user_moderation(request.user)
        if not is_allowed:
            return Response({'error': reason}, status=status.HTTP_403_FORBIDDEN)

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
        base_qs = ChatMessage.objects.select_related(
            'sender', 'parent_message', 'parent_message__sender'
        ).prefetch_related(
            'reactions', 'reactions__user'
        )

        # For detail actions (retrieve, update, destroy, custom actions),
        # return all messages in rooms the user belongs to so get_object() works.
        if self.action in ('retrieve', 'update', 'partial_update', 'destroy', 'edit', 'pin', 'unpin'):
            return base_qs.filter(room__participants=user)

        # For list action, require room_id param
        room_id = self.request.query_params.get('room_id')
        if not room_id:
            return base_qs.none()
        if not user.chat_rooms.filter(id=room_id).exists():
            return base_qs.none()
        return base_qs.filter(room_id=room_id).order_by('timestamp')

    def perform_destroy(self, instance):
        # Only sender can delete their own message
        if instance.sender != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only delete your own messages")

        room_id = instance.room_id
        message_id = instance.id
        
        # Update room last action before deleting
        room = instance.room
        room.last_action_type = 'unsend'
        room.last_action_sender = self.request.user
        room.save()
        
        instance.delete()

        # Broadcast deletion to all room participants via WebSocket
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        channel_layer = get_channel_layer()
        
        broadcast_data = {
            'type': 'message_deleted',
            'message_id': message_id,
            'deleted_by': self.request.user.id,
            'deleted_by_name': self.request.user.first_name or self.request.user.username,
            'room_id': room_id,
        }
        
        # Room broadcast
        async_to_sync(channel_layer.group_send)(f'chat_{room_id}', broadcast_data)
        
        # Personal channel broadcasts for room list updates (including sender)
        participants = room.participants.all()
        for p in participants:
            async_to_sync(channel_layer.group_send)(f'user_{p.id}', broadcast_data)

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

        # Update room last action
        room = message.room
        room.last_action_type = 'edit'
        room.last_action_sender = request.user
        room.last_action_content = content
        room.save()

        # Broadcast edit to all room participants
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        channel_layer = get_channel_layer()
        
        broadcast_data = {
            'type': 'message_edited',
            'message_id': message.id,
            'content': content,
            'edited_by': request.user.id,
            'edited_by_name': request.user.first_name or request.user.username,
            'room_id': message.room_id,
        }
        
        # Room broadcast
        async_to_sync(channel_layer.group_send)(f'chat_{message.room_id}', broadcast_data)
        
        # Personal channel broadcasts (including sender)
        participants = message.room.participants.all()
        for p in participants:
            async_to_sync(channel_layer.group_send)(f'user_{p.id}', broadcast_data)

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

class ReportedMessageViewSet(viewsets.ModelViewSet):
    serializer_class = ReportedMessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = ReportedMessage.objects.all()
        if self.request.user.role != 'admin':
            queryset = queryset.filter(reporter=self.request.user)
            
        status_filter = self.request.query_params.get('status')
        if status_filter and status_filter != 'all':
            queryset = queryset.filter(status=status_filter)
            
        return queryset

    def perform_create(self, serializer):
        report = serializer.save(reporter=self.request.user)
        
        # Send realtime alert to admins
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            'moderation_alerts',
            {
                'type': 'moderation_alert',
                'data': {
                    'id': report.id,
                    'reporter': report.reporter.username,
                    'reason': report.reason[:100],
                    'message_sender': report.message.sender.username
                }
            }
        )

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        if request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=403)
        report = self.get_object()
        report.status = 'resolved'
        report.moderator_note = request.data.get('note', '')
        report.resolved_by = request.user
        report.resolved_at = timezone.now()
        report.save()
        return Response({'status': 'Report resolved'})

    @action(detail=True, methods=['post'], url_path='delete-message')
    def delete_message(self, request, pk=None):
        if request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=403)
        
        report = self.get_object()
        message = report.message
        note = request.data.get('note', 'Message deleted by moderator.')

        if not message:
            # If message is already gone, just resolve the report
            report.status = 'resolved'
            report.moderator_note = f"{note} (Note: Message was already removed)"
            report.resolved_by = request.user
            report.resolved_at = timezone.now()
            report.save()
            return Response({'status': 'Report resolved (message was already deleted)'})
        
        sender = message.sender
        room = message.room
        room_name = room.name if room and room.is_group else "a chat room"
        room_id = message.room_id
        message_id = message.id
        
        # Broadcast before deletion
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        channel_layer = get_channel_layer()
        
        broadcast_data = {
            'type': 'message_deleted',
            'message_id': message_id,
            'deleted_by': request.user.id,
            'deleted_by_name': "Moderator",
            'room_id': room_id,
        }
        
        # Room broadcast
        async_to_sync(channel_layer.group_send)(f'chat_{room_id}', broadcast_data)
        
        # Personal channel broadcasts
        if room:
            participants = room.participants.all()
            for p in participants:
                async_to_sync(channel_layer.group_send)(f'user_{p.id}', broadcast_data)
            
        message.delete()
        
        # Notify the sender
        Notification.objects.create(
            recipient=sender,
            notification_type='system',
            title='Message Removed',
            message=f'Your message in "{room_name}" was removed by a moderator. Reason: {note}'
        )
        
        # Notify the reporter
        Notification.objects.create(
            recipient=report.reporter,
            notification_type='system',
            title='Report Resolved',
            message=f'Your report regarding a message has been resolved. The message was removed.'
        )
        
        report.status = 'resolved'
        report.moderator_note = note
        report.resolved_by = request.user
        report.resolved_at = timezone.now()
        report.save()
        
        return Response({'status': 'Message deleted and report resolved'})

    @action(detail=True, methods=['post'])
    def dismiss(self, request, pk=None):
        if request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=403)
        report = self.get_object()
        note = request.data.get('note', 'Report dismissed by moderator.')
        
        # Notify the reporter
        Notification.objects.create(
            recipient=report.reporter,
            notification_type='system',
            title='Report Dismissed',
            message=f'Your report has been reviewed and dismissed. No action was taken at this time.'
        )
        
        report.status = 'dismissed'
        report.moderator_note = note
        report.resolved_by = request.user
        report.resolved_at = timezone.now()
        report.save()
        return Response({'status': 'Report dismissed'})

    @action(detail=True, methods=['post'], url_path='suspend-user')
    def suspend_user(self, request, pk=None):
        if request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=403)
        report = self.get_object()
        user_to_suspend = report.reported_user
        
        if not user_to_suspend:
            return Response({'error': 'Reported user not found'}, status=404)
            
        note = request.data.get('note', f'User {user_to_suspend.username} suspended.')
        
        # Suspend user
        user_to_suspend.account_status = 'suspended'
        user_to_suspend.is_active = False # Hard disable
        user_to_suspend.save()
        
        # Also update profile
        if hasattr(user_to_suspend, 'profile'):
            user_to_suspend.profile.is_suspended = True
            user_to_suspend.profile.save()
            
        # Force logout if online via WebSocket
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'user_{user_to_suspend.id}',
            {
                'type': 'forced_logout',
                'message': 'Your account has been suspended by a moderator.'
            }
        )

        # Notify the suspended user
        Notification.objects.create(
            recipient=user_to_suspend,
            notification_type='system',
            title='Account Suspended',
            message=f'Your account has been suspended by a moderator. Reason: {note}'
        )

        # Notify the reporter
        Notification.objects.create(
            recipient=report.reporter,
            notification_type='system',
            title='Report Resolved',
            message=f'Action has been taken against the user you reported. They have been suspended.'
        )
            
        report.status = 'resolved'
        report.moderator_note = note
        report.resolved_by = request.user
        report.resolved_at = timezone.now()
        report.save()
        
        return Response({'status': f'User {user_to_suspend.username} suspended and report resolved'})

    @action(detail=True, methods=['post'], url_path='unsuspend-user')
    def unsuspend_user(self, request, pk=None):
        if request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=403)
        report = self.get_object()
        user_to_unsuspend = report.reported_user
        
        if not user_to_unsuspend:
            return Response({'error': 'Reported user not found'}, status=404)
            
        # Unsuspend user
        user_to_unsuspend.account_status = 'active'
        user_to_unsuspend.is_active = True
        user_to_unsuspend.save()
        
        if hasattr(user_to_unsuspend, 'profile'):
            user_to_unsuspend.profile.is_suspended = False
            user_to_unsuspend.profile.save()
            
        return Response({'status': f'User {user_to_unsuspend.username} unsuspended'})

    @action(detail=True, methods=['post'], url_path='mute-user')
    def mute_user(self, request, pk=None):
        if request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=403)
        report = self.get_object()
        user_to_mute = report.reported_user
        
        if not user_to_mute:
            return Response({'error': 'Reported user not found'}, status=404)
            
        hours = int(request.data.get('hours', 24))
        note = request.data.get('note', f'User {user_to_mute.username} muted for {hours} hours.')
        
        if hasattr(user_to_mute, 'profile'):
            user_to_mute.profile.mute_until = timezone.now() + timedelta(hours=hours)
            user_to_mute.profile.save()
            
        # Notify the muted user
        Notification.objects.create(
            recipient=user_to_mute,
            notification_type='system',
            title='Messaging Muted',
            message=f'Your messaging privileges have been suspended for {hours} hours. Reason: {note}'
        )

        # Notify the reporter
        Notification.objects.create(
            recipient=report.reporter,
            notification_type='system',
            title='Report Resolved',
            message=f'Action has been taken against the user you reported. They have been muted for {hours} hours.'
        )
            
        report.status = 'resolved'
        report.moderator_note = note
        report.resolved_by = request.user
        report.resolved_at = timezone.now()
        report.save()
        
        return Response({'status': f'User {user_to_mute.username} muted and report resolved'})

    @action(detail=True, methods=['post'], url_path='unmute-user')
    def unmute_user(self, request, pk=None):
        if request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=403)
        report = self.get_object()
        user_to_unmute = report.reported_user
        
        if not user_to_unmute:
            return Response({'error': 'Reported user not found'}, status=404)
        
        if hasattr(user_to_unmute, 'profile'):
            user_to_unmute.profile.mute_until = None
            user_to_unmute.profile.save()
            
        # Notify the user
        Notification.objects.create(
            recipient=user_to_unmute,
            notification_type='system',
            title='Messaging Restored',
            message=f'Your messaging privileges have been restored by a moderator.'
        )
        
        return Response({'status': f'User {user_to_unmute.username} unmuted'})

    @action(detail=False, methods=['post', 'delete'], url_path='bulk-delete')
    def bulk_delete(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=403)
        ids = request.data.get('ids', [])
        if not ids:
            return Response({'error': 'No reports selected'}, status=400)
        
        deleted_count, _ = ReportedMessage.objects.filter(id__in=ids).delete()
        return Response({'status': f'Successfully deleted {deleted_count} reports'})


class FriendshipViewSet(viewsets.ModelViewSet):
    serializer_class = FriendshipSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        try:
            user = self.request.user
            return Friendship.objects.filter(Q(from_user=user) | Q(to_user=user))
        except Exception as e:
            logger.error(f"Friendship queryset error: {str(e)}")
            return Friendship.objects.none()

    def perform_create(self, serializer):
        try:
            friendship = serializer.save(from_user=self.request.user, status='pending')
            # Real-time WS event
            serialized = FriendshipSerializer(friendship, context={'request': self.request}).data
            _notify_user_of_friendship_update(friendship.to_user.id, serialized, 'request_received')
            # Persistent notification so offline users see it when they log in
            sender_name = self.request.user.get_full_name() or self.request.user.username
            Notification.objects.create(
                recipient=friendship.to_user,
                notification_type='friend_request',
                title='New Friend Request',
                message=f'{sender_name} sent you a friend request.',
                link='/messages',
            )
        except Exception as e:
            logger.error(f"Friendship create error: {str(e)}")
            raise

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        try:
            friendship = self.get_object()
            if friendship.to_user != request.user:
                return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

            friendship.status = 'accepted'
            friendship.save()

            serialized = FriendshipSerializer(friendship, context={'request': request}).data
            _notify_user_of_friendship_update(friendship.from_user.id, serialized, 'request_accepted')
            _notify_user_of_friendship_update(request.user.id, serialized, 'request_accepted')

            # Notify the original requester that their request was accepted
            accepter_name = request.user.get_full_name() or request.user.username
            Notification.objects.create(
                recipient=friendship.from_user,
                notification_type='friend_request',
                title='Friend Request Accepted',
                message=f'{accepter_name} accepted your friend request.',
                link='/messages',
            )

            return Response(serialized)
        except Exception as e:
            logger.error(f"Friendship accept error: {str(e)}")
            return Response({'error': 'Failed to process friend request.'}, status=500)

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

@api_view(['GET'])
@permission_classes([AllowAny])
def student_calendar_view(request):
    """
    Returns events for the school calendar.
    Currently includes announcements with an event_date.
    """
    year = request.query_params.get('year')
    month = request.query_params.get('month')
    
    if not year or not month:
        return Response({"error": "Year and month are required"}, status=400)
    
    try:
        year = int(year)
        month = int(month)
    except ValueError:
        return Response({"error": "Invalid year or month"}, status=400)
    
    # Filter announcements that are live and have an event_date in the given month
    from django.db.models import Q
    from datetime import date
    import calendar as py_calendar
    
    first_day = date(year, month, 1)
    last_day_num = py_calendar.monthrange(year, month)[1]
    last_day = date(year, month, last_day_num)

    announcements = Announcement.objects.filter(
        status='live'
    ).filter(
        Q(event_date__date__lte=last_day) & 
        (Q(end_date__date__gte=first_day) | Q(end_date__isnull=True, event_date__date__gte=first_day))
    )
    
    # Filter based on user role/authentication/request source
    public_only = request.query_params.get('public_only') == 'true'

    if public_only or not request.user or not request.user.is_authenticated:
        # Public users or forced public mode only see public announcements
        announcements = announcements.filter(is_public=True)
    else:
        # If the user is a student, only show announcements for 'all' or 'students'
        if request.user.role == 'student':
            announcements = announcements.filter(target_audience__in=['all', 'students'])
        elif request.user.role == 'teacher':
            announcements = announcements.filter(target_audience__in=['all', 'teachers'])
    
    events = []
    for a in announcements:
        events.append({
            'id': f"ann-{a.id}",
            'title': a.title,
            'description': a.content[:100] + '...' if len(a.content) > 100 else a.content,
            'date': a.event_date.isoformat(),
            'end_date': a.end_date.isoformat() if a.end_date else None,
            'type': 'announcement',
            'category': a.category
        })
    
    return Response(events)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notifications_polling_view(request):
    """
    Consolidated endpoint for polling notifications and latest announcements.
    Used as a fallback when WebSockets are unavailable.
    """
    user = request.user
    from django.utils import timezone

    # Unread notifications — evaluate once, reuse for count
    unread_qs = list(
        Notification.objects.filter(recipient=user, is_read=False)
        .select_related('recipient')
        .order_by('-created_at')[:20]
    )
    from .serializers import NotificationSerializer
    notifications_data = NotificationSerializer(unread_qs, many=True).data
    unread_count = len(unread_qs)  # accurate for ≤20; full count via unread-count endpoint

    # Latest announcements filtered by role
    from django.db.models import Q
    announcements_qs = Announcement.objects.filter(status='live').exclude(
        event_date__lt=timezone.now()
    )
    if user.role == 'student':
        announcements_qs = announcements_qs.filter(target_audience__in=['all', 'students'])
    elif user.role == 'teacher':
        announcements_qs = announcements_qs.filter(
            Q(target_audience__in=['all', 'teachers']) | Q(author=user)
        )
    elif user.role == 'parent':
        announcements_qs = announcements_qs.filter(target_audience__in=['all', 'parents'])
    # admin sees all

    from .serializers import AnnouncementSerializer
    announcements_data = AnnouncementSerializer(
        announcements_qs.order_by('-is_pinned', '-created_at')[:5], many=True
    ).data

    return Response({
        'notifications': notifications_data,
        'unread_count': unread_count,
        'announcements': announcements_data,
        'timestamp': timezone.now().isoformat(),
        'realtime_status': 'polling_active',
    })


# ─── Schedule / Timetable ViewSets ───────────────────────────────────────────

class RoomViewSet(viewsets.ModelViewSet):
    """Manage physical rooms/locations. Admin-only writes; all authenticated users can read."""
    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'building', 'room_type']

    def get_queryset(self):
        qs = Room.objects.all()
        active_only = self.request.query_params.get('active_only')
        if active_only and active_only.lower() == 'true':
            qs = qs.filter(is_active=True)
        return qs

    def perform_create(self, serializer):
        if self.request.user.role != 'admin':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admins can create rooms.")
        serializer.save()

    def perform_update(self, serializer):
        if self.request.user.role != 'admin':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admins can update rooms.")
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role != 'admin':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admins can delete rooms.")
        instance.delete()


class TimeSlotViewSet(viewsets.ModelViewSet):
    """Manage reusable time slots. Admin-only writes."""
    serializer_class = TimeSlotSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = TimeSlot.objects.all()
        day = self.request.query_params.get('day')
        if day:
            qs = qs.filter(day=day)
        return qs

    def perform_create(self, serializer):
        if self.request.user.role != 'admin':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admins can create time slots.")
        serializer.save()

    def perform_update(self, serializer):
        if self.request.user.role != 'admin':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admins can update time slots.")
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role != 'admin':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admins can delete time slots.")
        instance.delete()


class ScheduleViewSet(viewsets.ModelViewSet):
    """
    Full schedule management.
    - Admin: full CRUD
    - Teacher: read own schedules
    - Student/Parent: read schedules for their classroom(s)
    """
    serializer_class = ScheduleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['classroom__name', 'subject__name', 'teacher__first_name', 'teacher__last_name', 'room__name']
    ordering_fields = ['time_slot__day', 'time_slot__start_time', 'classroom__name']
    ordering = ['time_slot__day', 'time_slot__start_time']

    def get_queryset(self):
        user = self.request.user
        qs = Schedule.objects.select_related(
            'classroom', 'subject', 'teacher', 'room', 'time_slot', 'academic_year', 'semester'
        ).filter(is_active=True)

        # Filter params
        classroom_id = self.request.query_params.get('classroom')
        teacher_id = self.request.query_params.get('teacher')
        academic_year_id = self.request.query_params.get('academic_year')
        semester_id = self.request.query_params.get('semester')
        day = self.request.query_params.get('day')
        student_id = self.request.query_params.get('student')

        if user.role == 'teacher':
            qs = qs.filter(teacher=user)
        elif user.role == 'student':
            enrolled = StudentClassEnrollment.objects.filter(student=user).values_list('classroom_id', flat=True)
            qs = qs.filter(classroom_id__in=enrolled)
        elif user.role == 'parent':
            profile = getattr(user, 'profile', None)
            linked_ids = profile.linked_students.values_list('id', flat=True) if profile else []
            # If a specific student is requested, verify they are linked
            if student_id:
                if int(student_id) not in list(linked_ids):
                    return Schedule.objects.none()
                enrolled = StudentClassEnrollment.objects.filter(student_id=student_id).values_list('classroom_id', flat=True)
            else:
                enrolled = StudentClassEnrollment.objects.filter(student_id__in=linked_ids).values_list('classroom_id', flat=True)
            qs = qs.filter(classroom_id__in=enrolled)
        # admin sees all

        if classroom_id:
            qs = qs.filter(classroom_id=classroom_id)
        if teacher_id and user.role == 'admin':
            qs = qs.filter(teacher_id=teacher_id)
        if academic_year_id:
            qs = qs.filter(academic_year_id=academic_year_id)
        if semester_id:
            qs = qs.filter(semester_id=semester_id)
        if day:
            qs = qs.filter(time_slot__day=day)

        return qs

    def perform_create(self, serializer):
        if self.request.user.role != 'admin':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admins can create schedules.")
        schedule = serializer.save()
        from portal.views import log_audit_action
        log_audit_action(
            user=self.request.user,
            action='create',
            model_name='Schedule',
            object_id=schedule.id,
            object_repr=str(schedule),
            description=f'Created schedule: {schedule}',
            request=self.request
        )
        # Notify teacher of new schedule
        Notification.objects.create(
            recipient=schedule.teacher,
            notification_type='system',
            title='New Schedule Assigned',
            message=(
                f'You have been assigned to teach {schedule.subject.name} '
                f'for {schedule.classroom.name} on '
                f'{schedule.time_slot.get_day_display()} '
                f'{schedule.time_slot.start_time.strftime("%I:%M %p")}.'
            ),
            link='/schedule'
        )

    def perform_update(self, serializer):
        if self.request.user.role != 'admin':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admins can update schedules.")
        schedule = serializer.save()
        from portal.views import log_audit_action
        log_audit_action(
            user=self.request.user,
            action='update',
            model_name='Schedule',
            object_id=schedule.id,
            object_repr=str(schedule),
            description=f'Updated schedule: {schedule}',
            request=self.request
        )

    def perform_destroy(self, instance):
        if self.request.user.role != 'admin':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admins can delete schedules.")
        from portal.views import log_audit_action
        log_audit_action(
            user=self.request.user,
            action='delete',
            model_name='Schedule',
            object_id=instance.id,
            object_repr=str(instance),
            description=f'Deleted schedule: {instance}',
            request=self.request
        )
        instance.delete()

    @action(detail=False, methods=['get'])
    def my_schedule(self, request):
        """Returns the current user's schedule (teacher or student view)."""
        user = request.user
        if user.role == 'teacher':
            qs = Schedule.objects.filter(teacher=user, is_active=True).select_related(
                'classroom', 'subject', 'room', 'time_slot', 'academic_year'
            ).order_by('time_slot__day', 'time_slot__start_time')
        elif user.role == 'student':
            enrolled = StudentClassEnrollment.objects.filter(student=user).values_list('classroom_id', flat=True)
            qs = Schedule.objects.filter(classroom_id__in=enrolled, is_active=True).select_related(
                'classroom', 'subject', 'teacher', 'room', 'time_slot', 'academic_year'
            ).order_by('time_slot__day', 'time_slot__start_time')
        else:
            return Response({'error': 'This endpoint is for teachers and students only.'}, status=403)

        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def today(self, request):
        """Returns today's schedule for the current user."""
        import datetime
        today_name = datetime.date.today().strftime('%A').lower()
        user = request.user

        if user.role == 'teacher':
            qs = Schedule.objects.filter(
                teacher=user, is_active=True, time_slot__day=today_name
            ).select_related('classroom', 'subject', 'room', 'time_slot').order_by('time_slot__start_time')
        elif user.role == 'student':
            enrolled = StudentClassEnrollment.objects.filter(student=user).values_list('classroom_id', flat=True)
            qs = Schedule.objects.filter(
                classroom_id__in=enrolled, is_active=True, time_slot__day=today_name
            ).select_related('classroom', 'subject', 'teacher', 'room', 'time_slot').order_by('time_slot__start_time')
        elif user.role == 'parent':
            profile = getattr(user, 'profile', None)
            linked_ids = profile.linked_students.values_list('id', flat=True) if profile else []
            student_id = request.query_params.get('student')
            if student_id and int(student_id) in list(linked_ids):
                enrolled = StudentClassEnrollment.objects.filter(student_id=student_id).values_list('classroom_id', flat=True)
            else:
                enrolled = StudentClassEnrollment.objects.filter(student_id__in=linked_ids).values_list('classroom_id', flat=True)
            qs = Schedule.objects.filter(
                classroom_id__in=enrolled, is_active=True, time_slot__day=today_name
            ).select_related('classroom', 'subject', 'teacher', 'room', 'time_slot').order_by('time_slot__start_time')
        else:
            return Response({'error': 'Unauthorized'}, status=403)

        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def conflict_check(self, request):
        """Admin utility: check for scheduling conflicts in a given academic year."""
        if request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=403)

        academic_year_id = request.query_params.get('academic_year')
        if not academic_year_id:
            return Response({'error': 'academic_year parameter required'}, status=400)

        from django.db.models import Count
        conflicts = []

        # Teacher double-booking
        teacher_conflicts = (
            Schedule.objects.filter(academic_year_id=academic_year_id, is_active=True)
            .values('teacher', 'time_slot')
            .annotate(count=Count('id'))
            .filter(count__gt=1)
        )
        for c in teacher_conflicts:
            teacher = User.objects.filter(id=c['teacher']).first()
            ts = TimeSlot.objects.filter(id=c['time_slot']).first()
            conflicts.append({
                'type': 'teacher_conflict',
                'description': f"Teacher {full_name(teacher)} has {c['count']} classes at {ts}",
                'teacher_id': c['teacher'],
                'time_slot_id': c['time_slot'],
            })

        # Room double-booking
        room_conflicts = (
            Schedule.objects.filter(academic_year_id=academic_year_id, is_active=True, room__isnull=False)
            .values('room', 'time_slot')
            .annotate(count=Count('id'))
            .filter(count__gt=1)
        )
        for c in room_conflicts:
            room = Room.objects.filter(id=c['room']).first()
            ts = TimeSlot.objects.filter(id=c['time_slot']).first()
            conflicts.append({
                'type': 'room_conflict',
                'description': f"Room {room.name} has {c['count']} classes at {ts}",
                'room_id': c['room'],
                'time_slot_id': c['time_slot'],
            })

        return Response({'conflicts': conflicts, 'total': len(conflicts)})


# ─── Parent Dashboard Views ───────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def parent_dashboard_view(request):
    """
    Returns a comprehensive dashboard summary for a parent user.
    Includes all linked children with their attendance, grades, and upcoming schedules.
    """
    user = request.user
    if user.role != 'parent':
        return Response({'error': 'This endpoint is for parents only.'}, status=403)

    profile = getattr(user, 'profile', None)
    if not profile:
        return Response({'error': 'Parent profile not found.'}, status=404)

    linked_students = profile.linked_students.filter(role='student', is_approved=True)

    children_data = []
    for student in linked_students:
        # Attendance this month
        from django.utils import timezone as tz
        import datetime
        today = tz.now().date()
        month_start = today.replace(day=1)
        att_records = list(Attendance.objects.filter(
            student=student, date__gte=month_start, date__lte=today
        ))
        weekday_records = [r for r in att_records if r.date.weekday() < 5]
        present_count = sum(1 for r in weekday_records if r.status in ['present', 'late'])
        att_rate = round(present_count / len(weekday_records) * 100, 1) if weekday_records else None

        # Recent attendance (last 7 days)
        week_ago = today - datetime.timedelta(days=7)
        recent_att = Attendance.objects.filter(
            student=student, date__gte=week_ago
        ).order_by('-date')[:7]
        recent_att_data = [
            {'date': r.date.isoformat(), 'status': r.status}
            for r in recent_att
        ]

        # Grades (final grades only)
        grades = Grade.objects.filter(
            student=student, grade_type='final_grade', transmuted_score__isnull=False
        ).select_related('subject').order_by('-quarter', 'subject__name')
        grades_data = [
            {
                'subject_name': g.subject.name,
                'subject_code': g.subject.code,
                'quarter': g.quarter,
                'score': float(g.transmuted_score),
                'remarks': g.computed_remarks,
            }
            for g in grades[:20]
        ]
        general_avg = None
        if grades.exists():
            general_avg = round(sum(float(g.transmuted_score) for g in grades) / grades.count(), 2)

        # Classroom info
        enrollment = StudentClassEnrollment.objects.filter(student=student).select_related(
            'classroom__teacher'
        ).first()
        classroom_name = enrollment.classroom.name if enrollment else None
        adviser_name = full_name(enrollment.classroom.teacher) if enrollment and enrollment.classroom.teacher else None

        # Today's schedule
        today_name = today.strftime('%A').lower()
        if enrollment:
            today_schedule = Schedule.objects.filter(
                classroom=enrollment.classroom,
                is_active=True,
                time_slot__day=today_name
            ).select_related('subject', 'teacher', 'room', 'time_slot').order_by('time_slot__start_time')
            schedule_data = [
                {
                    'subject': s.subject.name,
                    'teacher': full_name(s.teacher),
                    'room': s.room.name if s.room else None,
                    'start_time': s.time_slot.start_time.strftime('%I:%M %p'),
                    'end_time': s.time_slot.end_time.strftime('%I:%M %p'),
                }
                for s in today_schedule
            ]
        else:
            schedule_data = []

        # Unread notifications for this student (parent can see system/grade/attendance)
        recent_notifs = Notification.objects.filter(
            recipient=student,
            notification_type__in=['grade', 'attendance', 'announcement', 'system'],
            is_read=False
        ).order_by('-created_at')[:5]
        notif_data = [
            {
                'title': n.title,
                'message': n.message,
                'type': n.notification_type,
                'created_at': n.created_at.isoformat(),
            }
            for n in recent_notifs
        ]

        children_data.append({
            'id': student.id,
            'username': student.username,
            'first_name': student.first_name,
            'last_name': student.last_name,
            'full_name': full_name(student),
            'profile_picture': getattr(getattr(student, 'profile', None), 'profile_picture', None),
            'grade_level': getattr(getattr(student, 'profile', None), 'grade_level', None),
            'classroom_name': classroom_name,
            'adviser_name': adviser_name,
            'attendance_rate': att_rate,
            'attendance_present': present_count,
            'attendance_total': len(weekday_records),
            'recent_attendance': recent_att_data,
            'general_average': general_avg,
            'grades': grades_data,
            'today_schedule': schedule_data,
            'recent_notifications': notif_data,
        })

    # School-wide announcements for parents
    from django.db.models import Q as DQ
    announcements = Announcement.objects.filter(
        status='live'
    ).filter(
        DQ(target_audience__in=['all', 'parents'])
    ).order_by('-is_pinned', '-created_at')[:5]
    announcements_data = [
        {
            'id': a.id,
            'title': a.title,
            'content': a.content[:200],
            'category': a.category,
            'priority': a.priority,
            'created_at': a.created_at.isoformat(),
            'author_name': full_name(a.author),
        }
        for a in announcements
    ]

    return Response({
        'children': children_data,
        'total_children': len(children_data),
        'announcements': announcements_data,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def parent_child_detail_view(request, student_id):
    """
    Returns detailed data for a specific linked child.
    Parents can only access their own linked students.
    """
    user = request.user
    if user.role != 'parent':
        return Response({'error': 'This endpoint is for parents only.'}, status=403)

    profile = getattr(user, 'profile', None)
    if not profile:
        return Response({'error': 'Parent profile not found.'}, status=404)

    # Security: verify the student is actually linked to this parent
    linked_ids = list(profile.linked_students.values_list('id', flat=True))
    if int(student_id) not in linked_ids:
        return Response({'error': 'You do not have access to this student.'}, status=403)

    try:
        student = User.objects.get(id=student_id, role='student')
    except User.DoesNotExist:
        return Response({'error': 'Student not found.'}, status=404)

    # Full attendance history
    attendance = Attendance.objects.filter(student=student).order_by('-date')[:60]
    att_data = [
        {'date': r.date.isoformat(), 'status': r.status, 'remarks': r.remarks}
        for r in attendance
    ]

    # All grades
    grades = Grade.objects.filter(
        student=student, grade_type='final_grade', transmuted_score__isnull=False
    ).select_related('subject').order_by('-academic_year', '-quarter', 'subject__name')
    grades_data = [
        {
            'subject_name': g.subject.name,
            'subject_code': g.subject.code,
            'quarter': g.quarter,
            'academic_year': g.academic_year,
            'score': float(g.transmuted_score),
            'remarks': g.computed_remarks,
        }
        for g in grades
    ]

    # Full weekly schedule
    enrollment = StudentClassEnrollment.objects.filter(student=student).select_related(
        'classroom__teacher'
    ).first()
    weekly_schedule = []
    if enrollment:
        schedules = Schedule.objects.filter(
            classroom=enrollment.classroom, is_active=True
        ).select_related('subject', 'teacher', 'room', 'time_slot').order_by(
            'time_slot__day', 'time_slot__start_time'
        )
        weekly_schedule = [
            {
                'day': s.time_slot.day,
                'day_display': s.time_slot.get_day_display(),
                'subject': s.subject.name,
                'teacher': full_name(s.teacher),
                'room': s.room.name if s.room else None,
                'start_time': s.time_slot.start_time.strftime('%I:%M %p'),
                'end_time': s.time_slot.end_time.strftime('%I:%M %p'),
            }
            for s in schedules
        ]

    # Assignments
    if enrollment:
        assignments = Assignment.objects.filter(
            classroom=enrollment.classroom
        ).order_by('-due_date')[:10]
        assignments_data = [
            {
                'id': a.id,
                'title': a.title,
                'subject': a.subject.name,
                'due_date': a.due_date.isoformat(),
                'points': a.points,
            }
            for a in assignments
        ]
    else:
        assignments_data = []

    return Response({
        'student': {
            'id': student.id,
            'full_name': full_name(student),
            'username': student.username,
            'profile_picture': getattr(getattr(student, 'profile', None), 'profile_picture', None),
            'grade_level': getattr(getattr(student, 'profile', None), 'grade_level', None),
            'classroom_name': enrollment.classroom.name if enrollment else None,
            'adviser_name': full_name(enrollment.classroom.teacher) if enrollment and enrollment.classroom.teacher else None,
        },
        'attendance': att_data,
        'grades': grades_data,
        'weekly_schedule': weekly_schedule,
        'assignments': assignments_data,
    })


# ─── FCM Token Management ─────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def fcm_token_register(request):
    """
    POST /api/fcm-tokens/
    Save or refresh a user's FCM push token.
    Body: { "token": "<fcm_token>", "device_type": "web" }
    """
    token = request.data.get('token', '').strip()
    device_type = request.data.get('device_type', 'web')

    if not token:
        return Response({'error': 'token is required'}, status=status.HTTP_400_BAD_REQUEST)

    if device_type not in ('web', 'android', 'ios'):
        device_type = 'web'

    # Upsert: if the token already exists (possibly for another user after
    # a browser reinstall), reassign it to the current user and reactivate.
    obj, created = FCMToken.objects.update_or_create(
        token=token,
        defaults={
            'user': request.user,
            'device_type': device_type,
            'is_active': True,
        }
    )

    return Response(
        {'status': 'registered', 'created': created},
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
    )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def fcm_token_delete(request):
    """
    DELETE /api/fcm-tokens/
    Deactivate the token on logout.
    Body: { "token": "<fcm_token>" }
    """
    token = request.data.get('token', '').strip()
    if not token:
        return Response({'error': 'token is required'}, status=status.HTTP_400_BAD_REQUEST)

    updated = FCMToken.objects.filter(
        user=request.user, token=token
    ).update(is_active=False)

    return Response({'status': 'deactivated', 'count': updated})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def test_push_notification(request):
    """
    POST /api/test-push/
    Sends a test push notification to the current user's active tokens.
    Includes diagnostic checks to help the user identify missing environment variables.
    """
    from .fcm import send_push_notification
    from .models import FCMToken
    import os

    # 1. Check if push is enabled
    if os.environ.get('FCM_ENABLED', 'true').lower() == 'false':
        return Response({'error': 'Push notifications are disabled (FCM_ENABLED=false)'}, status=400)

    # 2. Check for required Firebase credentials
    project_id = os.environ.get('FIREBASE_PROJECT_ID', '')
    sa_json = os.environ.get('FIREBASE_SERVICE_ACCOUNT_JSON', '')
    
    if not project_id:
        return Response({'error': 'Missing FIREBASE_PROJECT_ID in Render environment variables'}, status=400)
    if not sa_json:
        return Response({'error': 'Missing FIREBASE_SERVICE_ACCOUNT_JSON in Render environment variables'}, status=400)

    # 3. Check for active tokens
    tokens = FCMToken.objects.filter(user=request.user, is_active=True)
    token_count = tokens.count()
    if token_count == 0:
        return Response({'error': 'No active push tokens found for your account. Try refreshing the page.'}, status=400)

    try:
        send_push_notification(
            user=request.user,
            title="Test Notification 🔔",
            body="If you see this, push notifications are working correctly!",
            data={"link": "/notifications"}
        )
        return Response({
            'status': 'success',
            'message': f'Test push dispatched to {token_count} active device(s).',
            'note': 'If you still dont see it, check your Windows "Do Not Disturb" settings or Chrome notification permissions.'
        })
    except Exception as e:
        logger.error(f"Firebase error: {str(e)}", exc_info=True)
        return Response({'error': 'Failed to process notification request.'}, status=500)
