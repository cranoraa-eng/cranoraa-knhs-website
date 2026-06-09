from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import (Profile, Classroom, StudentClassEnrollment, Announcement,
    AnnouncementAttachment, AnnouncementComment, Attendance, LearningMaterial,
    Subject, ClassroomSubject, ScratchCard, Fee,
    Notification, EnrollmentApplication, EnrollmentDocument, EnrollmentStatusHistory,
    WebsiteContent, Grade, GradeReport,
    ChatRoom, ChatMessage, MessageReaction, Friendship, SystemSetting,
    Assignment, Submission, ReportedMessage,
    Room, TimeSlot, Schedule, OnboardingState)

User = get_user_model()


def full_name(user):
    """Return 'Title First Last' if available, otherwise 'First Last' or username."""
    if not user:
        return ''
    
    title = ""
    try:
        if hasattr(user, 'profile') and user.profile.title:
            title = user.profile.title + " "
    except:
        pass

    if user.first_name and user.last_name:
        return f"{title}{user.first_name} {user.last_name}".strip()
    if user.first_name:
        return f"{title}{user.first_name}".strip()
    return user.username


class ProfileSerializer(serializers.ModelSerializer):
    classroom_name = serializers.SerializerMethodField()
    is_muted = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = ['id', 'title', 'grade_level', 'classroom_name', 'employee_id', 'phone_number', 'address',
                  'date_of_birth', 'registration_number', 'sex', 'state',
                  'nationality', 'middle_name', 'father_name', 'mother_name', 'contact_information', 
                  'linked_students', 'profile_picture', 'mute_until', 'is_muted', 'is_suspended']

    def get_is_muted(self, obj):
        return obj.mute_until is not None and obj.mute_until > timezone.now()

    def get_classroom_name(self, obj):
        try:
            enrollment = StudentClassEnrollment.objects.filter(student=obj.user).select_related('classroom').first()
            if enrollment and enrollment.classroom:
                return enrollment.classroom.name
        except:
            pass
        return None


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(required=False)
    full_name = serializers.SerializerMethodField()
    is_online = serializers.BooleanField(read_only=True)
    is_adviser = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'full_name',
                  'role', 'is_verified', 'is_approved', 'is_online', 'profile',
                  'must_change_password', 'account_status',
                  'is_adviser']

    def get_full_name(self, obj):
        return full_name(obj)

    def get_is_adviser(self, obj):
        if obj.role != 'teacher':
            return False
        return Classroom.objects.filter(teacher=obj).exists()

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', None)
        
        # Update user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update profile fields
        if profile_data:
            profile, created = Profile.objects.get_or_create(user=instance)
            # Handle M2M linked_students separately
            linked_students = profile_data.pop('linked_students', None)
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()
            if linked_students is not None:
                profile.linked_students.set(linked_students)

        return instance


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class OnboardingStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = OnboardingState
        fields = [
            'has_seen_welcome',
            'completed_tutorials',
            'skipped_tutorials',
            'dismissed_tips',
            'checklist_progress',
            'last_tutorial',
            'last_step_id',
            'metadata',
            'role',
            'updated_at',
        ]
        read_only_fields = ['role', 'updated_at']

    def validate_completed_tutorials(self, value):
        return self._validate_string_list(value, 'completed_tutorials')

    def validate_skipped_tutorials(self, value):
        return self._validate_string_list(value, 'skipped_tutorials')

    def validate_dismissed_tips(self, value):
        return self._validate_string_list(value, 'dismissed_tips')

    def validate_checklist_progress(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError('Expected an object.')
        return value

    def validate_metadata(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError('Expected an object.')
        return value

    def _validate_string_list(self, value, field_name):
        if not isinstance(value, list):
            raise serializers.ValidationError(f'{field_name} must be a list.')
        if not all(isinstance(item, str) for item in value):
            raise serializers.ValidationError(f'{field_name} may only contain strings.')
        return value


class ClassroomSerializer(serializers.ModelSerializer):
    teacher_name = serializers.SerializerMethodField()
    student_count = serializers.SerializerMethodField()
    average_gpa = serializers.SerializerMethodField()
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    subject_name = serializers.SerializerMethodField()
    subject_code = serializers.SerializerMethodField()

    class Meta:
        model = Classroom
        fields = ['id', 'name', 'grade_level', 'capacity', 'teacher', 'teacher_name', 'student_count',
                  'average_gpa', 'academic_year', 'academic_year_name', 'subject_name', 'subject_code',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'teacher': {'required': False, 'allow_null': True},
            'academic_year': {'required': False, 'allow_null': True},
        }

    def get_teacher_name(self, obj): return full_name(obj.teacher) if obj.teacher else 'No Adviser'
    def get_student_count(self, obj): return obj.enrollments.count()
    def get_average_gpa(self, obj): return obj.get_average_gpa()

    def get_subject_name(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user.role == 'teacher':
            assignment = obj.classroom_subjects.filter(teacher=request.user).select_related('subject').first()
            if assignment:
                return assignment.subject.name
        return None

    def get_subject_code(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user.role == 'teacher':
            assignment = obj.classroom_subjects.filter(teacher=request.user).select_related('subject').first()
            if assignment:
                return assignment.subject.code
        return None

    def validate_teacher(self, value):
        if value:
            existing = Classroom.objects.filter(teacher=value)
            if self.instance:
                existing = existing.exclude(id=self.instance.id)
            if existing.exists():
                other_class = existing.first()
                raise serializers.ValidationError(
                    f"This teacher is already the adviser for {other_class.name}."
                )
        return value


class StudentClassEnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    student_email = serializers.CharField(source='student.email', read_only=True)
    student_lrn = serializers.SerializerMethodField()
    student_sex = serializers.CharField(source='student.profile.sex', read_only=True)
    classroom_name = serializers.CharField(source='classroom.name', read_only=True)
    classroom_advisor = serializers.SerializerMethodField()
    general_average = serializers.SerializerMethodField()
    transmuted_average = serializers.SerializerMethodField()
    descriptive_equivalent = serializers.SerializerMethodField()
    transmuted_quarters = serializers.SerializerMethodField()

    class Meta:
        model = StudentClassEnrollment
        fields = ['id', 'student', 'student_name', 'student_email', 'student_lrn', 'student_sex', 'classroom',
                  'classroom_name', 'classroom_advisor', 'q1', 'q2', 'q3', 'q4', 'gpa',
                  'general_average', 'transmuted_average', 'transmuted_quarters',
                  'descriptive_equivalent', 'enrolled_at', 'updated_at']
        read_only_fields = ['student', 'classroom', 'classroom_name', 'classroom_advisor',
                            'general_average', 'transmuted_average',
                            'transmuted_quarters', 'descriptive_equivalent']

    def get_student_name(self, obj): return full_name(obj.student)
    def get_student_lrn(self, obj):
        profile = getattr(obj.student, 'profile', None)
        return profile.lrn if profile else None
    def get_classroom_advisor(self, obj): return full_name(obj.classroom.teacher) if obj.classroom.teacher else 'No Advisor'
    def get_general_average(self, obj): return obj.calculate_general_average()
    def get_transmuted_average(self, obj): return obj.calculate_transmuted_average()
    def get_transmuted_quarters(self, obj): return obj.get_transmuted_quarters()
    def get_descriptive_equivalent(self, obj): return obj.get_descriptive_equivalent()

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        request = self.context.get('request')
        
        # If the request is from a student and they are looking at someone else's enrollment
        if request and request.user.role == 'student' and instance.student != request.user:
            # Hide sensitive academic data
            grade_fields = ['q1', 'q2', 'q3', 'q4', 'gpa', 'general_average', 
                           'transmuted_average', 'transmuted_quarters', 'descriptive_equivalent']
            for field in grade_fields:
                if field in representation:
                    representation[field] = None
        
        return representation


class AnnouncementAttachmentSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()
    is_image = serializers.SerializerMethodField()

    class Meta:
        model = AnnouncementAttachment
        fields = ['id', 'filename', 'url', 'is_image', 'file_size_bytes', 'content_type', 'uploaded_at']

    def get_url(self, obj):
        # file is now a URLField — return it directly
        return obj.file or None

    def get_is_image(self, obj):
        return obj.is_image


class AnnouncementCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    author_role = serializers.CharField(source='author.role', read_only=True)

    class Meta:
        model = AnnouncementComment
        fields = ['id', 'announcement', 'author', 'author_name', 'author_role', 'content', 'created_at', 'updated_at']
        read_only_fields = ['id', 'announcement', 'author', 'author_name', 'author_role', 'created_at', 'updated_at']

    def get_author_name(self, obj):
        return full_name(obj.author)


class AnnouncementSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    author_email = serializers.CharField(source='author.email', read_only=True)
    attachment_url = serializers.SerializerMethodField()
    read_count = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    is_read = serializers.SerializerMethodField()
    is_expired = serializers.BooleanField(read_only=True)
    attachments = AnnouncementAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = Announcement
        fields = [
            'id', 'title', 'content', 'category', 'priority', 'status',
            'target_audience', 'target_classrooms', 'author', 'author_name', 'author_email',
            'is_pinned', 'is_public', 'event_date', 'end_date', 'attachment',
            'attachment_url', 'attachments', 'read_by', 'read_count', 'comment_count',
            'is_read', 'is_expired', 'created_at', 'updated_at'
        ]
        read_only_fields = ['author', 'read_count', 'comment_count', 'is_read', 'is_expired', 'attachments']

    def get_author_name(self, obj): return full_name(obj.author)
    def get_attachment_url(self, obj):
        # attachment is now a URLField — return it directly
        return obj.attachment or None
    def get_read_count(self, obj): return obj.read_by.count()
    def get_comment_count(self, obj):
        if hasattr(obj, 'comment_count_annotated'):
            return obj.comment_count_annotated
        return obj.comments.count()
    def get_is_read(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        if hasattr(obj, '_prefetched_objects_cache') and 'read_by' in obj._prefetched_objects_cache:
            return any(u.id == request.user.id for u in obj.read_by.all())
        return obj.read_by.filter(id=request.user.id).exists()


class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    student_email = serializers.CharField(source='student.email', read_only=True)
    classroom_name = serializers.CharField(source='classroom.name', read_only=True)
    marked_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Attendance
        fields = ['id', 'student', 'student_name', 'student_email', 'classroom',
                  'classroom_name', 'date', 'status', 'remarks', 'marked_by',
                  'marked_by_name', 'created_at', 'updated_at']
        read_only_fields = ['marked_by']

    def get_student_name(self, obj): return full_name(obj.student)
    def get_marked_by_name(self, obj): return full_name(obj.marked_by) if obj.marked_by else ''


class LearningMaterialSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.SerializerMethodField()
    classroom_name = serializers.CharField(source='classroom.name', read_only=True)

    class Meta:
        model = LearningMaterial
        fields = ['id', 'title', 'description', 'material_type', 'classroom',
                  'classroom_name', 'uploaded_by', 'uploaded_by_name', 'file',
                  'original_filename', 'file_size_bytes',
                  'quarter', 'week', 'created_at', 'updated_at']
        read_only_fields = ['uploaded_by', 'file', 'original_filename', 'file_size_bytes']

    def get_uploaded_by_name(self, obj): return full_name(obj.uploaded_by)


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['id', 'name', 'code', 'description', 'grade_level',
                  'created_at', 'updated_at']


class SimplifiedStudentSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    student_sex = serializers.CharField(source='profile.sex', read_only=True)
    grade_level = serializers.CharField(source='profile.grade_level', read_only=True)
    registration_number = serializers.CharField(source='profile.registration_number', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'full_name', 'email', 'role', 
                  'student_sex', 'grade_level', 'registration_number']
    def get_full_name(self, obj): return full_name(obj)

class ClassroomSubjectSerializer(serializers.ModelSerializer):
    classroom_name = serializers.CharField(source='classroom.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    teacher_name = serializers.SerializerMethodField()
    teacher_email = serializers.CharField(source='teacher.email', read_only=True)
    students = serializers.SerializerMethodField()

    class Meta:
        model = ClassroomSubject
        fields = ['id', 'classroom', 'classroom_name', 'subject', 'subject_name',
                  'subject_code', 'teacher', 'teacher_name', 'teacher_email',
                  'ww_weight', 'pt_weight', 'qa_weight', 'assigned_at', 'students']
        read_only_fields = ['assigned_at']

    def get_teacher_name(self, obj): return full_name(obj.teacher)

    def get_students(self, obj):
        enrollments = obj.classroom.enrollments.all().select_related('student')
        students = [e.student for e in enrollments]
        return SimplifiedStudentSerializer(students, many=True).data

    def validate(self, data):
        ww = data.get('ww_weight', self.instance.ww_weight if self.instance else 30)
        pt = data.get('pt_weight', self.instance.pt_weight if self.instance else 50)
        qa = data.get('qa_weight', self.instance.qa_weight if self.instance else 20)
        total = float(ww) + float(pt) + float(qa)
        if abs(total - 100) > 0.01:
            raise serializers.ValidationError(
                f"Weights must sum to 100. Current total: {total}")
        return data


class ScratchCardSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    student_email = serializers.CharField(source='student.email', read_only=True)

    class Meta:
        model = ScratchCard
        fields = ['id', 'serial_number', 'student', 'student_name',
                  'student_email', 'is_used', 'used_at', 'created_at']

    def get_student_name(self, obj): return full_name(obj.student)


class FeeSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    student_email = serializers.CharField(source='student.email', read_only=True)
    balance = serializers.ReadOnlyField()

    class Meta:
        model = Fee
        fields = ['id', 'student', 'student_name', 'student_email', 'fee_type',
                  'amount', 'amount_paid', 'status', 'balance', 'due_date',
                  'paid_date', 'description', 'created_at', 'updated_at']

    def get_student_name(self, obj): return full_name(obj.student)


class NotificationSerializer(serializers.ModelSerializer):
    recipient_name = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ['id', 'recipient', 'recipient_name', 'notification_type',
                  'title', 'message', 'is_read', 'link', 'created_at']
        read_only_fields = ['recipient', 'created_at']

    def get_recipient_name(self, obj): return full_name(obj.recipient)


class EnrollmentDocumentSerializer(serializers.ModelSerializer):
    document_type_display = serializers.CharField(source='get_document_type_display', read_only=True)
    verification_status_display = serializers.CharField(source='get_verification_status_display', read_only=True)
    
    class Meta:
        model = EnrollmentDocument
        fields = [
            'id', 'application', 'document_type', 'document_type_display',
            'file_url', 'file_name', 'verification_status', 'verification_status_display',
            'admin_notes', 'uploaded_at', 'updated_at',
        ]
        read_only_fields = ['application', 'uploaded_at', 'updated_at']


class EnrollmentStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.SerializerMethodField()
    from_status_display = serializers.SerializerMethodField()
    to_status_display = serializers.SerializerMethodField()
    
    class Meta:
        model = EnrollmentStatusHistory
        fields = [
            'id', 'application', 'from_status', 'from_status_display',
            'to_status', 'to_status_display', 'changed_by', 'changed_by_name',
            'notes', 'created_at',
        ]
        read_only_fields = ['application', 'changed_by', 'created_at']
    
    def get_changed_by_name(self, obj):
        if not obj.changed_by:
            return None
        return obj.changed_by.get_full_name() or obj.changed_by.username
    
    def get_from_status_display(self, obj):
        return obj.get_from_status_display() if obj.from_status else None
    
    def get_to_status_display(self, obj):
        return obj.get_to_status_display()


class EnrollmentApplicationSerializer(serializers.ModelSerializer):
    documents = EnrollmentDocumentSerializer(many=True, read_only=True)
    status_history = EnrollmentStatusHistorySerializer(many=True, read_only=True)
    full_name = serializers.SerializerMethodField()
    age = serializers.SerializerMethodField()
    assigned_classroom_name = serializers.CharField(source='assigned_classroom.name', read_only=True)
    reviewed_by_name = serializers.SerializerMethodField()
    linked_parent_email = serializers.SerializerMethodField()
    
    class Meta:
        model = EnrollmentApplication
        fields = [
            'id', 'enrollment_number', 'enrollment_type', 'school_year',
            'first_name', 'last_name', 'middle_name', 'full_name', 'sex', 'date_of_birth', 'age',
            'place_of_birth', 'nationality', 'religion', 'street_address', 'barangay',
            'city_municipality', 'province', 'zip_code',
            'father_name', 'father_occupation', 'father_contact', 'father_email',
            'mother_name', 'mother_occupation', 'mother_contact', 'mother_email',
            'guardian_name', 'guardian_relationship', 'guardian_contact', 'guardian_email',
            'grade_level', 'strand', 'previous_school', 'previous_school_address',
            'lrn', 'lrn_request_reason', 'is_als',
            'birth_certificate', 'report_card', 'form_138', 'certificate_of_completion',
            'good_moral_certificate', 'id_picture', 'last_school_attended_cert',
            'email', 'phone_number', 'emergency_contact_name',
            'emergency_contact_relationship', 'emergency_contact_phone',
            'enrolled_student', 'assigned_classroom', 'assigned_classroom_name',
            'linked_parent', 'linked_parent_email',
            'status', 'remarks', 'reviewed_by', 'reviewed_by_name', 'reviewed_at',
            'temp_password_display',
            'submitted_at', 'updated_at', 'documents', 'status_history',
        ]
        read_only_fields = [
            'enrollment_number', 'status', 'submitted_at', 'updated_at',
            'enrolled_student', 'assigned_classroom', 'linked_parent',
            'reviewed_by', 'reviewed_at', 'documents', 'status_history',
        ]
    
    def get_full_name(self, obj):
        return obj.full_name
    
    def get_age(self, obj):
        return obj.age
    
    def get_reviewed_by_name(self, obj):
        if obj.reviewed_by:
            return obj.reviewed_by.get_full_name() or obj.reviewed_by.username
        return None
    
    def get_linked_parent_email(self, obj):
        if obj.linked_parent:
            return obj.linked_parent.email
        return None


class WebsiteContentSerializer(serializers.ModelSerializer):
    section_display = serializers.CharField(source='get_section_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    updated_by_name = serializers.SerializerMethodField()
    # image is now a URLField — the view handles the upload and passes the URL
    image = serializers.URLField(required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = WebsiteContent
        fields = ['id', 'section', 'section_display', 'category', 'category_display',
                  'content', 'image', 'updated_at', 'updated_by', 'updated_by_name']
        read_only_fields = ['section', 'category', 'updated_at', 'updated_by']

    def get_updated_by_name(self, obj):
        return full_name(obj.updated_by) if obj.updated_by else ''


class AssignmentSerializer(serializers.ModelSerializer):
    teacher_name = serializers.ReadOnlyField(source='teacher.get_full_name')
    subject_name = serializers.ReadOnlyField(source='subject.name')
    classroom_name = serializers.ReadOnlyField(source='classroom.name')
    submission_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Assignment
        fields = ['id', 'title', 'description', 'classroom', 'classroom_name', 'subject', 'subject_name',
                  'teacher', 'teacher_name', 'file', 'original_filename', 'file_size_bytes',
                  'due_date', 'points', 'submission_count', 'created_at']
        read_only_fields = ['file', 'original_filename', 'file_size_bytes']


class SubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='student.get_full_name')
    assignment_title = serializers.ReadOnlyField(source='assignment.title')

    class Meta:
        model = Submission
        fields = ['id', 'assignment', 'assignment_title', 'student', 'student_name',
                  'file', 'original_filename', 'file_size_bytes',
                  'submitted_at', 'grade', 'feedback', 'is_late']
        read_only_fields = ['file', 'original_filename', 'file_size_bytes']


class ReportedMessageSerializer(serializers.ModelSerializer):
    reporter_name = serializers.ReadOnlyField(source='reporter.get_full_name')
    message_content = serializers.ReadOnlyField(source='message.content')
    message_sender = serializers.ReadOnlyField(source='message.sender.username')
    resolved_by_name = serializers.ReadOnlyField(source='resolved_by.get_full_name')
    sender_is_muted = serializers.SerializerMethodField()
    sender_is_suspended = serializers.SerializerMethodField()

    class Meta:
        model = ReportedMessage
        fields = ['id', 'message', 'message_content', 'message_sender', 'reporter', 'reporter_name', 
                  'reason', 'status', 'moderator_note', 'resolved_by', 'resolved_by_name', 'created_at', 'resolved_at', 
                  'sender_is_muted', 'sender_is_suspended']
        read_only_fields = ['reporter', 'status', 'resolved_at', 'resolved_by']

    def get_sender_is_muted(self, obj):
        user = obj.reported_user or (obj.message.sender if obj.message else None)
        if user and hasattr(user, 'profile'):
            mute_until = user.profile.mute_until
            return mute_until is not None and mute_until > timezone.now()
        return False

    def get_sender_is_suspended(self, obj):
        user = obj.reported_user or (obj.message.sender if obj.message else None)
        if user:
            return user.account_status == 'suspended' or not user.is_active
        return False


class GradeSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    student_email = serializers.CharField(source='student.email', read_only=True)
    student_sex = serializers.CharField(source='student.profile.sex', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    classroom_name = serializers.CharField(source='classroom.name', read_only=True)
    teacher_name = serializers.SerializerMethodField()
    grade_type_display = serializers.CharField(source='get_grade_type_display', read_only=True)
    quarter_display = serializers.CharField(source='get_quarter_display', read_only=True)
    percentage = serializers.SerializerMethodField()

    class Meta:
        model = Grade
        fields = [
            'id', 'student', 'student_name', 'student_email', 'student_sex', 'subject',
            'subject_name', 'subject_code', 'classroom', 'classroom_name',
            'teacher', 'teacher_name', 'grade_type', 'grade_type_display',
            'quarter', 'quarter_display', 'academic_year', 'raw_score', 'total_score',
            'transmuted_score', 'final_grade', 'remarks', 'computed_remarks',
            'percentage', 'submitted_at', 'updated_at', 'is_locked'
        ]
        read_only_fields = ['transmuted_score', 'computed_remarks', 'teacher']

    def get_student_name(self, obj): return full_name(obj.student)
    def get_teacher_name(self, obj): return full_name(obj.teacher)
    def get_percentage(self, obj): return obj.get_percentage()


class GradeReportSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    student_email = serializers.CharField(source='student.email', read_only=True)
    classroom_name = serializers.CharField(source='classroom.name', read_only=True)
    quarter_display = serializers.CharField(source='get_quarter_display', read_only=True)
    generated_by_name = serializers.SerializerMethodField()

    class Meta:
        model = GradeReport
        fields = [
            'id', 'student', 'student_name', 'student_email', 'classroom',
            'classroom_name', 'quarter', 'quarter_display', 'school_year',
            'general_average', 'total_subjects', 'passed_subjects',
            'failed_subjects', 'overall_remarks', 'class_rank', 'generated_at',
            'generated_by', 'generated_by_name', 'is_final'
        ]
        read_only_fields = ['general_average', 'total_subjects',
                            'passed_subjects', 'failed_subjects']

    def get_student_name(self, obj): return full_name(obj.student)
    def get_generated_by_name(self, obj):
        return full_name(obj.generated_by) if obj.generated_by else ''


class MessageReactionSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = MessageReaction
        fields = ['id', 'user', 'user_name', 'emoji', 'created_at']

    def get_user_name(self, obj):
        return full_name(obj.user)


class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    sender_profile_picture = serializers.SerializerMethodField()
    reactions = serializers.SerializerMethodField()
    parent_message_details = serializers.SerializerMethodField()
    attachment_is_image = serializers.SerializerMethodField()

    class Meta:
        model = ChatMessage
        fields = [
            'id', 'room', 'sender', 'sender_name', 'sender_profile_picture', 'content', 'timestamp',
            'is_read', 'is_delivered', 'is_pinned', 'is_edited',
            'parent_message', 'parent_message_details', 'reactions',
            'message_type', 'attachment_url', 'attachment_filename',
            'attachment_content_type', 'file_size_bytes', 'attachment_is_image',
        ]

    def get_attachment_is_image(self, obj):
        if obj.message_type == 'image':
            return True
        ct = obj.attachment_content_type or ''
        return ct.startswith('image/')

    def get_sender_name(self, obj):
        return full_name(obj.sender)

    def get_sender_profile_picture(self, obj):
        try:
            return obj.sender.profile.profile_picture or None
        except Exception:
            return None

    def get_reactions(self, obj):
        # Group reactions by emoji
        reactions = obj.reactions.all()
        result = {}
        for r in reactions:
            if r.emoji not in result:
                result[r.emoji] = []
            result[r.emoji].append({
                'id': r.id,
                'user_id': r.user.id,
                'user_name': full_name(r.user)
            })
        return result

    def get_parent_message_details(self, obj):
        if obj.parent_message:
            parent = obj.parent_message
            preview = (parent.content or '').strip()
            if not preview:
                if parent.message_type == 'image':
                    preview = '📷 Photo'
                elif parent.message_type == 'file':
                    preview = f'📎 {parent.attachment_filename or "File"}'
            return {
                'id': parent.id,
                'content': preview,
                'sender_name': full_name(parent.sender),
                'sender_id': parent.sender.id,
                'message_type': parent.message_type,
            }
        return None


class ChatRoomSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    participants_details = UserSerializer(source='participants', many=True, read_only=True)
    is_pinned = serializers.SerializerMethodField()
    last_action_sender_name = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = ['id', 'name', 'is_group', 'participants', 'participants_details', 
                 'created_by', 'created_at', 'updated_at', 'last_message', 'unread_count', 'is_pinned',
                 'last_action_type', 'last_action_sender', 'last_action_sender_name', 'last_action_content']

    def get_last_action_sender_name(self, obj):
        if obj.last_action_sender:
            return full_name(obj.last_action_sender)
        return ''

    def get_last_message(self, obj):
        msg = obj.messages.last()
        if msg:
            return ChatMessageSerializer(msg).data
        return None

    def get_participants_details(self, obj):
        return UserSerializer(obj.participants.all(), many=True).data

    def get_is_pinned(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.pinned_by.filter(id=request.user.id).exists()
        return False

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.messages.filter(
                is_read=False
            ).exclude(sender=request.user).count()
        return 0


class SystemSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSetting
        fields = ['site_name', 'school_address', 'school_phone', 'school_email', 'school_logo', 
                  'primary_color', 'secondary_color', 'maintenance_mode', 'maintenance_message', 
                  'enrollment_open', 'current_quarter', 'academic_year', 'allow_student_chat', 'allow_teacher_chat', 'updated_at']


class FriendshipSerializer(serializers.ModelSerializer):
    from_user_details = UserSerializer(source='from_user', read_only=True)
    to_user_details = UserSerializer(source='to_user', read_only=True)
    is_pinned = serializers.SerializerMethodField()

    class Meta:
        model = Friendship
        fields = ['id', 'from_user', 'to_user', 'from_user_details', 'to_user_details', 'status', 'is_pinned', 'created_at']
        read_only_fields = ['from_user', 'status']

    def get_is_pinned(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if obj.from_user == request.user:
                return obj.is_pinned_by_from
            if obj.to_user == request.user:
                return obj.is_pinned_by_to
        return False


# ─── Schedule / Timetable Serializers ────────────────────────────────────────

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ['id', 'name', 'building', 'capacity', 'room_type', 'is_active', 'created_at']


class TimeSlotSerializer(serializers.ModelSerializer):
    day_display = serializers.CharField(source='get_day_display', read_only=True)
    start_time_display = serializers.SerializerMethodField()
    end_time_display = serializers.SerializerMethodField()
    classroom_name = serializers.CharField(source='classroom.name', read_only=True)

    class Meta:
        model = TimeSlot
        fields = ['id', 'classroom', 'classroom_name', 'day', 'day_display', 'start_time', 'end_time',
                  'start_time_display', 'end_time_display', 'label']

    def get_start_time_display(self, obj):
        return obj.start_time.strftime('%I:%M %p')

    def get_end_time_display(self, obj):
        return obj.end_time.strftime('%I:%M %p')


class ScheduleSerializer(serializers.ModelSerializer):
    classroom_name = serializers.CharField(source='classroom.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    teacher_name = serializers.SerializerMethodField()
    teacher_email = serializers.CharField(source='teacher.email', read_only=True)
    room_name = serializers.CharField(source='room.name', read_only=True)
    room_building = serializers.CharField(source='room.building', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    semester_display = serializers.CharField(source='semester.get_semester_type_display', read_only=True)
    time_slot_detail = TimeSlotSerializer(source='time_slot', read_only=True)

    class Meta:
        model = Schedule
        fields = [
            'id', 'classroom', 'classroom_name', 'subject', 'subject_name', 'subject_code',
            'teacher', 'teacher_name', 'teacher_email', 'room', 'room_name', 'room_building',
            'time_slot', 'time_slot_detail', 'academic_year', 'academic_year_name',
            'semester', 'semester_display', 'is_active', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_teacher_name(self, obj):
        return full_name(obj.teacher)

    def validate(self, data):
        """Check for scheduling conflicts."""
        time_slot = data.get('time_slot', getattr(self.instance, 'time_slot', None))
        academic_year = data.get('academic_year', getattr(self.instance, 'academic_year', None))
        teacher = data.get('teacher', getattr(self.instance, 'teacher', None))
        classroom = data.get('classroom', getattr(self.instance, 'classroom', None))
        room = data.get('room', getattr(self.instance, 'room', None))

        if not all([time_slot, academic_year, teacher, classroom]):
            return data

        exclude_id = self.instance.id if self.instance else None
        qs = Schedule.objects.filter(time_slot=time_slot, academic_year=academic_year)
        if exclude_id:
            qs = qs.exclude(id=exclude_id)

        # Teacher conflict
        if qs.filter(teacher=teacher).exists():
            raise serializers.ValidationError(
                f"Teacher already has a class scheduled at this time slot."
            )
        # Classroom conflict
        if qs.filter(classroom=classroom).exists():
            raise serializers.ValidationError(
                f"This classroom section already has a subject scheduled at this time slot."
            )
        # Room conflict
        if room and qs.filter(room=room).exists():
            raise serializers.ValidationError(
                f"Room '{room.name}' is already booked at this time slot."
            )
        return data


# ─── Parent Dashboard Serializers ────────────────────────────────────────────

class ParentChildSummarySerializer(serializers.ModelSerializer):
    """Lightweight summary of a linked student for the parent dashboard."""
    full_name = serializers.SerializerMethodField()
    profile_picture = serializers.CharField(source='profile.profile_picture', read_only=True)
    grade_level = serializers.CharField(source='profile.grade_level', read_only=True)
    classroom_name = serializers.SerializerMethodField()
    adviser_name = serializers.SerializerMethodField()
    attendance_rate = serializers.SerializerMethodField()
    general_average = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'full_name',
            'profile_picture', 'grade_level', 'classroom_name',
            'adviser_name', 'attendance_rate', 'general_average',
        ]

    def get_full_name(self, obj):
        return full_name(obj)

    def get_classroom_name(self, obj):
        enrollment = StudentClassEnrollment.objects.filter(student=obj).select_related('classroom').first()
        return enrollment.classroom.name if enrollment else None

    def get_adviser_name(self, obj):
        enrollment = StudentClassEnrollment.objects.filter(student=obj).select_related('classroom__teacher').first()
        if enrollment and enrollment.classroom.teacher:
            return full_name(enrollment.classroom.teacher)
        return None

    def get_attendance_rate(self, obj):
        from django.utils import timezone
        import datetime
        today = timezone.now().date()
        month_start = today.replace(day=1)
        records = Attendance.objects.filter(student=obj, date__gte=month_start, date__lte=today)
        # Exclude weekends
        records = [r for r in records if r.date.weekday() < 5]
        if not records:
            return None
        present = sum(1 for r in records if r.status in ['present', 'late'])
        return round(present / len(records) * 100, 1)

    def get_general_average(self, obj):
        grades = Grade.objects.filter(
            student=obj, grade_type='final_grade', transmuted_score__isnull=False
        )
        if not grades.exists():
            return None
        total = sum(float(g.transmuted_score) for g in grades)
        return round(total / grades.count(), 2)
