from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from decimal import Decimal


class User(AbstractUser):
    """
    Custom user model that extends Django's AbstractUser

    Uses a custom user model instead of the default auth.User model
    to better support the multi-role system required by the school portal

    Features:
    - Multiple roles: admin, staff, student, parent
    - Role-specific permissions and access controls
    - Extended profile information for students, teachers, and parents
    - School-specific enrollment and classroom management

    Note: This model inherits from AbstractUser and explicitly sets related_name
    to avoid conflicts with Django's built-in User model when multiple apps
    define custom user models that inherit from AbstractUser.
    """
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('staff', 'Staff'),
        ('student', 'Student'),
        ('parent', 'Parent'),
    ]

    STAFF_TITLE_CHOICES = [
        ('teacher', 'Teacher'),
        ('registrar', 'Registrar'),
        ('advisory', 'Advisory'),
        ('principal', 'Principal'),
        ('guidance_counselor', 'Guidance Counselor'),
        ('it_staff', 'IT Staff'),
        ('librarian', 'Librarian'),
        ('cashier', 'Cashier'),
        ('other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('suspended', 'Suspended'),
        ('pending_reset', 'Pending Password Reset'),
    ]

    email = models.EmailField(unique=True, null=True, blank=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student', db_index=True)
    staff_title = models.CharField(max_length=20, choices=STAFF_TITLE_CHOICES, null=True, blank=True, db_index=True)
    additional_roles = models.TextField(blank=True, default='', help_text="Comma-separated additional staff titles e.g. teacher,guidance_counselor")
    is_verified = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=False)
    last_activity = models.DateTimeField(null=True, blank=True)

    must_change_password = models.BooleanField(default=False)
    account_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', db_index=True)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['role']

    # Explicitly set related_name to avoid clashes with auth.User
    # This is necessary when inheriting from AbstractUser in custom user models
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='accounts_user_groups',
        blank=True,
        help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.',
        verbose_name='groups',
    )

    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='accounts_user_permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions',
    )

    def __str__(self):
        return f"{self.username} ({self.role})"

    @property
    def is_online(self):
        if not self.last_activity:
            return False
        from django.utils import timezone
        import datetime
        now = timezone.now()
        return self.last_activity > now - datetime.timedelta(minutes=5)


class OnboardingState(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='onboarding_state')
    role = models.CharField(max_length=10, choices=User.ROLE_CHOICES)
    has_seen_welcome = models.BooleanField(default=False)
    completed_tutorials = models.JSONField(default=list, blank=True)
    skipped_tutorials = models.JSONField(default=list, blank=True)
    dismissed_tips = models.JSONField(default=list, blank=True)
    checklist_progress = models.JSONField(default=dict, blank=True)
    last_tutorial = models.CharField(max_length=100, blank=True, default='')
    last_step_id = models.CharField(max_length=100, blank=True, default='')
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"Onboarding state for {self.user.username}"


class OTP(models.Model):
    OTP_TYPES = [
        ('signup', 'Signup'),
        ('password_reset', 'Password Reset'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='otps')
    hashed_code = models.CharField(max_length=128, default='')
    otp_type = models.CharField(max_length=20, choices=OTP_TYPES, default='signup')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True)
    is_used = models.BooleanField(default=False)
    
    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.expires_at
    
    def __str__(self):
        return f"{self.otp_type} OTP for {self.user.email or self.user.username}"




class Profile(models.Model):
    TITLE_CHOICES = [
        ('Mr.', 'Mr.'),
        ('Ms.', 'Ms.'),
        ('Mrs.', 'Mrs.'),
        ('Dr.', 'Dr.'),
        ('Prof.', 'Prof.'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    lrn = models.CharField(max_length=12, blank=True, null=True, db_index=True, help_text="Learner Reference Number (12 digits)")
    title = models.CharField(max_length=10, choices=TITLE_CHOICES, blank=True, null=True, help_text="Honorific title for teachers")
    grade_level = models.CharField(max_length=20, blank=True, null=True, help_text="For students")
    employee_id = models.CharField(max_length=20, blank=True, null=True, help_text="For teachers")
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    registration_number = models.CharField(max_length=20, blank=True, null=True, unique=True, help_text="Auto-generated unique registration number for students")
    profile_picture = models.URLField(max_length=500, blank=True, null=True, help_text="Supabase Storage URL for profile picture")
    
    # Additional student information
    sex = models.CharField(max_length=10, choices=[('male', 'Male'), ('female', 'Female'), ('other', 'Other')], blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    nationality = models.CharField(max_length=100, blank=True, null=True)
    middle_name = models.CharField(max_length=100, blank=True, null=True)
    father_name = models.CharField(max_length=100, blank=True, null=True)
    mother_name = models.CharField(max_length=100, blank=True, null=True)
    contact_information = models.TextField(blank=True, null=True, help_text="Additional contact details")
    
    # Moderation
    mute_until = models.DateTimeField(null=True, blank=True)
    is_suspended = models.BooleanField(default=False)
    
    # Parent-Student relationship
    linked_students = models.ManyToManyField(User, blank=True, related_name='parent_profiles', limit_choices_to={'role': 'student'})
    
    def __str__(self):
        return f"{self.user.username}'s Profile"
    
    def save(self, *args, **kwargs):
        if self.user.role == 'student':
            # Use LRN as registration number if provided
            if self.lrn:
                self.registration_number = self.lrn
            # Fallback to auto-generation if both are missing
            elif not self.registration_number:
                self.registration_number = self.generate_registration_number()
        super().save(*args, **kwargs)
    
    def generate_registration_number(self):
        import random
        year = str(self.user.date_joined.year if self.user.date_joined else 2026)
        random_num = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        return f"KNHS{year}{random_num}"


class Classroom(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    grade_level = models.CharField(max_length=20, blank=True, null=True, help_text="Academic grade level for this classroom (e.g., Grade 7)")
    capacity = models.PositiveIntegerField(default=40, help_text="Maximum number of students allowed in this classroom")
    teacher = models.OneToOneField(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='teaching_classroom',
        limit_choices_to={'role': 'teacher'},
        help_text="The advisory teacher for this classroom. Each teacher can only have one advisory classroom."
    )
    
    # Academic Context
    academic_year = models.ForeignKey('portal.AcademicYear', on_delete=models.SET_NULL, null=True, blank=True, related_name='classrooms')
    semester = models.ForeignKey('portal.Semester', on_delete=models.SET_NULL, null=True, blank=True, related_name='classrooms')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        teacher_name = self.teacher.username if self.teacher else "No Teacher"
        return f"{self.name} - {teacher_name}"
    
    def get_average_gpa(self):
        enrollments = self.enrollments.all()
        if enrollments:
            total_gpa = sum(e.gpa for e in enrollments if e.gpa is not None)
            count = sum(1 for e in enrollments if e.gpa is not None)
            return total_gpa / count if count > 0 else None
        return None


class ChatRoom(models.Model):
    name = models.CharField(max_length=255, blank=True, null=True)
    is_group = models.BooleanField(default=False)
    participants = models.ManyToManyField(User, related_name='chat_rooms')
    pinned_by = models.ManyToManyField(User, related_name='pinned_rooms', blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_rooms')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Last action tracking
    last_action_type = models.CharField(max_length=20, default='message') # 'message', 'reaction', 'unsend', 'edit'
    last_action_sender = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='last_actions')
    last_action_content = models.TextField(blank=True, null=True) # emoji for reaction, content for message/edit

    def __str__(self):
        if self.is_group:
            return self.name or f"Group {self.id}"
        return f"Private Chat {self.id}"


class ChatMessage(models.Model):
    MESSAGE_TYPES = [
        ('text', 'Text'),
        ('image', 'Image'),
        ('file', 'File'),
    ]

    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField(blank=True)
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPES, default='text')
    attachment_url = models.URLField(max_length=1000, null=True, blank=True, help_text='Supabase Storage URL')
    attachment_filename = models.CharField(max_length=255, blank=True)
    attachment_content_type = models.CharField(max_length=120, blank=True)
    file_size_bytes = models.PositiveIntegerField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    is_delivered = models.BooleanField(default=False)
    is_read = models.BooleanField(default=False)
    is_pinned = models.BooleanField(default=False)
    is_edited = models.BooleanField(default=False)
    
    # Messenger-like features: Replies
    parent_message = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='replies')

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.sender.username}: {self.content[:20]}..."


class MessageReaction(models.Model):
    message = models.ForeignKey(ChatMessage, on_delete=models.CASCADE, related_name='reactions')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='message_reactions')
    emoji = models.CharField(max_length=20)  # The emoji string (e.g., "👍", "❤️")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('message', 'user', 'emoji')

    def __str__(self):
        return f"{self.user.username} reacted {self.emoji} to message {self.message.id}"


class ReportedMessage(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('resolved', 'Resolved'),
        ('dismissed', 'Dismissed'),
    ]
    message = models.ForeignKey(ChatMessage, on_delete=models.SET_NULL, null=True, related_name='reports')
    # Preserve data even if message is deleted
    reported_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_reports', null=True)
    message_content_snapshot = models.TextField(blank=True, null=True)
    
    reporter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='filed_reports')
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    moderator_note = models.TextField(blank=True, null=True)
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_reports')
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.reported_user and self.message:
            self.reported_user = self.message.sender
        if not self.message_content_snapshot and self.message:
            self.message_content_snapshot = self.message.content
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Report by {self.reporter.username} on {self.reported_user.username if self.reported_user else 'deleted message'}"


class Friendship(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]
    
    from_user = models.ForeignKey(User, related_name='friendship_requests_sent', on_delete=models.CASCADE)
    to_user = models.ForeignKey(User, related_name='friendship_requests_received', on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    is_pinned_by_from = models.BooleanField(default=False)
    is_pinned_by_to = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('from_user', 'to_user')

    def __str__(self):
        return f"{self.from_user.username} -> {self.to_user.username} ({self.status})"


class UserBlock(models.Model):
    """Block a user — prevents them from messaging or seeing each other's chat status."""
    blocker = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blocking')
    blocked = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blocked_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('blocker', 'blocked')

    def __str__(self):
        return f"{self.blocker.username} blocked {self.blocked.username}"


class EmergencyMessage(models.Model):
    """School-wide or targeted emergency broadcast."""
    PRIORITY_CHOICES = [
        ('info', 'Informational'),
        ('warning', 'Warning'),
        ('critical', 'Critical'),
    ]
    AUDIENCE_CHOICES = [
        ('all', 'All'),
        ('students', 'Students'),
        ('parents', 'Parents'),
        ('teachers', 'Teachers'),
        ('staff', 'Staff'),
    ]

    title = models.CharField(max_length=200)
    message = models.TextField()
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='warning')
    target_audience = models.CharField(max_length=20, choices=AUDIENCE_CHOICES, default='all')
    sent_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='emergency_messages_sent')
    is_active = models.BooleanField(default=True)
    sent_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-sent_at']

    def __str__(self):
        return f"[{self.priority.upper()}] {self.title}"


class Subject(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True, null=True)
    grade_level = models.CharField(max_length=20, help_text="Grade level this subject is for")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['grade_level', 'name']
    
    def __str__(self):
        return f"{self.code} - {self.name}"


class ClassroomSubject(models.Model):
    """
    Junction table to connect Subjects to Classrooms
    This implements the ERD relationship: Classroom contains Subject
    """
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name='classroom_subjects')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='classroom_subjects')
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assigned_classroom_subjects', limit_choices_to={'role': 'teacher'})
    assigned_at = models.DateTimeField(auto_now_add=True)

    # Grade component weights (must sum to 100)
    ww_weight = models.DecimalField(max_digits=5, decimal_places=2, default=30.00,
        help_text="Written Work weight (%)")
    pt_weight = models.DecimalField(max_digits=5, decimal_places=2, default=50.00,
        help_text="Performance Task weight (%)")
    qa_weight = models.DecimalField(max_digits=5, decimal_places=2, default=20.00,
        help_text="Quarterly Assessment weight (%)")

    class Meta:
        unique_together = ['classroom', 'subject']
        ordering = ['classroom__name', 'subject__name']


class SystemSetting(models.Model):
    """
    Global configuration settings for the portal.
    Only one instance should exist.
    """
    site_name = models.CharField(max_length=255, default='School Portal')
    school_address = models.TextField(blank=True, null=True)
    school_phone = models.CharField(max_length=20, blank=True, null=True)
    school_email = models.EmailField(blank=True, null=True)
    school_logo = models.URLField(max_length=1000, null=True, blank=True, help_text="Supabase Storage URL")
    
    # Branding
    primary_color = models.CharField(max_length=7, default='#2D1B4D')
    secondary_color = models.CharField(max_length=7, default='#9F7AEA')
    
    # Modes
    maintenance_mode = models.BooleanField(default=False)
    maintenance_message = models.TextField(default='The portal is currently undergoing maintenance. Please check back later.')
    enrollment_open = models.BooleanField(default=True)
    
    # Academic Context
    ACADEMIC_LEVEL_CHOICES = [
        ('jhs', 'Junior High School (Grades 7-10)'),
        ('shs', 'Senior High School (Grades 11-12)'),
    ]
    academic_level = models.CharField(max_length=3, choices=ACADEMIC_LEVEL_CHOICES, default='jhs')
    current_quarter = models.CharField(max_length=1, default='1', choices=[('1', '1st'), ('2', '2nd'), ('3', '3rd'), ('4', '4th')])
    academic_year = models.CharField(max_length=9, default='2025-2026')
    
    # Default Grading Weights (applied to new classroom-subjects)
    default_ww_weight = models.DecimalField(max_digits=5, decimal_places=2, default=30.00, help_text="Default Written Work weight (%)")
    default_pt_weight = models.DecimalField(max_digits=5, decimal_places=2, default=50.00, help_text="Default Performance Task weight (%)")
    default_qa_weight = models.DecimalField(max_digits=5, decimal_places=2, default=20.00, help_text="Default Quarterly Assessment weight (%)")
    passing_grade = models.DecimalField(max_digits=5, decimal_places=2, default=75.00, help_text="Minimum passing grade (%)")
    
    # Realtime & Communication
    allow_student_chat = models.BooleanField(default=True)
    allow_teacher_chat = models.BooleanField(default=True)
    
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "Global System Settings"

    @classmethod
    def get_settings(cls):
        settings, created = cls.objects.get_or_create(id=1)
        return settings


class StudentClassEnrollment(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enrollments')
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name='enrollments')
    q1 = models.IntegerField(null=True, blank=True)
    q2 = models.IntegerField(null=True, blank=True)
    q3 = models.IntegerField(null=True, blank=True)
    q4 = models.IntegerField(null=True, blank=True)
    gpa = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    enrolled_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['student', 'classroom']
        ordering = ['student__username']
    
    def __str__(self):
        return f"{self.student.username} in {self.classroom.name}"
    
    def calculate_general_average(self):
        quarters = [self.q1, self.q2, self.q3, self.q4]
        valid_quarters = [q for q in quarters if q is not None]
        if valid_quarters:
            return round(sum(valid_quarters) / len(valid_quarters))
        return None
    
    def get_descriptive_equivalent(self):
        avg = self.calculate_general_average()
        passing = float(SystemSetting.get_settings().passing_grade)
        if avg is None:
            return "No Grades"
        if avg >= 90:
            return "Outstanding"
        if avg >= 85:
            return "Very Satisfactory"
        if avg >= 80:
            return "Satisfactory"
        if avg >= passing:
            return "Fairly Satisfactory"
        return "Did Not Meet Expectations"


class Announcement(models.Model):
    CATEGORY_CHOICES = [
        ('general', 'General'),
        ('system_update', 'System Update'),
        ('emergency', 'Emergency'),
        ('academic', 'Academic'),
        ('events', 'Events'),
        ('holiday', 'Holiday'),
    ]
    
    PRIORITY_CHOICES = [
        ('info', 'Info'),
        ('critical', 'Critical'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('live', 'Live'),
        ('expired', 'Expired'),
    ]
    
    TARGET_AUDIENCE_CHOICES = [
        ('all', 'All Users'),
        ('admins', 'Admins'),
        ('students', 'Students'),
        ('teachers', 'Teachers'),
        ('parents', 'Parents'),
    ]
    
    title = models.CharField(max_length=200)
    content = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='general')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='info')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft')
    target_audience = models.CharField(max_length=20, choices=TARGET_AUDIENCE_CHOICES, default='all')
    target_classrooms = models.ManyToManyField(Classroom, blank=True, related_name='announcements')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='account_announcements')
    is_pinned = models.BooleanField(default=False)
    is_public = models.BooleanField(default=False)
    event_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    attachment = models.URLField(max_length=1000, null=True, blank=True, help_text="Supabase Storage URL")
    read_by = models.ManyToManyField(User, related_name='read_announcements', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-is_pinned', '-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.author.username}"
    
    @property
    def is_expired(self):
        from django.utils import timezone
        compare_date = self.end_date if self.end_date else self.event_date
        if compare_date:
            return timezone.now() > compare_date
        return False


class AnnouncementAttachment(models.Model):
    announcement = models.ForeignKey(
        Announcement, on_delete=models.CASCADE, related_name='attachments'
    )
    file = models.URLField(max_length=1000, blank=False, help_text="Supabase Storage URL")
    filename = models.CharField(max_length=255, blank=True)
    file_size_bytes = models.PositiveIntegerField(null=True, blank=True)
    content_type = models.CharField(max_length=100, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # filename is set by the view before saving
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.announcement.title} - {self.filename}"

    @property
    def is_image(self):
        return self.filename.lower().split('.')[-1] in ['jpg', 'jpeg', 'png', 'gif', 'webp']

    @property
    def url(self):
        return self.file or ''


class AnnouncementComment(models.Model):
    announcement = models.ForeignKey(
        Announcement, on_delete=models.CASCADE, related_name='comments'
    )
    author = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='announcement_comments'
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.author_id} on announcement {self.announcement_id}"


class Attendance(models.Model):
    STATUS_CHOICES = [
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('late', 'Late'),
        ('excused', 'Excused'),
    ]
    
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attendances')
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name='attendances')
    date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='present')
    remarks = models.TextField(blank=True, null=True)
    marked_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='marked_attendances')
    schedule = models.ForeignKey('Schedule', on_delete=models.SET_NULL, null=True, blank=True, related_name='attendances',
        help_text="Links attendance to a specific schedule period. Null = class-level (adviser) attendance.")
    subject = models.ForeignKey(Subject, on_delete=models.SET_NULL, null=True, blank=True, related_name='attendances',
        help_text="Denormalized from schedule for quick queries.")
    time_slot = models.ForeignKey('TimeSlot', on_delete=models.SET_NULL, null=True, blank=True, related_name='attendances',
        help_text="Denormalized from schedule for quick queries.")

    # Late arrival / early departure tracking
    arrival_time = models.TimeField(null=True, blank=True, help_text="Actual arrival time (for late tracking)")
    departure_time = models.TimeField(null=True, blank=True, help_text="Actual departure time (for early departure)")
    minutes_late = models.PositiveIntegerField(default=0, help_text="Minutes late (auto-calculated if arrival_time set)")

    # Absence excuse tracking
    has_excuse = models.BooleanField(default=False)
    excuse_verified = models.BooleanField(default=False, help_text="Set to True once admin/teacher verifies the excuse")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['student', 'classroom', 'date'],
                condition=models.Q(schedule__isnull=True),
                name='unique_class_level_attendance'
            ),
            models.UniqueConstraint(
                fields=['student', 'schedule', 'date'],
                condition=models.Q(schedule__isnull=False),
                name='unique_schedule_attendance'
            ),
        ]
        ordering = ['-date', 'student__username']
    
    def __str__(self):
        scope = f" [{self.subject.code}]" if self.subject else ""
        return f"{self.student.username} - {self.date} - {self.status}{scope}"

    def save(self, *args, **kwargs):
        # Auto-calculate minutes_late if arrival_time and time_slot are set
        if self.arrival_time and self.time_slot and self.status == 'late':
            slot_start = self.time_slot.start_time
            delta_minutes = (self.arrival_time.hour * 60 + self.arrival_time.minute) - (slot_start.hour * 60 + slot_start.minute)
            self.minutes_late = max(0, delta_minutes)
        # Set has_excuse if status is excused
        if self.status == 'excused':
            self.has_excuse = True
        super().save(*args, **kwargs)


class AbsenceExcuse(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='absence_excuses')
    attendance = models.ForeignKey(Attendance, on_delete=models.CASCADE, related_name='excuses')
    reason = models.TextField()
    document_url = models.URLField(max_length=1000, null=True, blank=True, help_text="Supabase Storage URL for supporting document")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_excuses')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewer_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Excuse for {self.student.username} on {self.attendance.date} - {self.status}"


class LearningMaterial(models.Model):
    MATERIAL_TYPE_CHOICES = [
        ('dlp', 'Daily Lesson Plan (DLP)'),
        ('dll', 'Daily Lesson Log (DLL)'),
        ('module', 'Learning Module'),
        ('activity', 'Learning Activity Sheet'),
        ('assessment', 'Assessment Material'),
        ('other', 'Other'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    material_type = models.CharField(max_length=20, choices=MATERIAL_TYPE_CHOICES, default='dlp')
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name='materials', null=True, blank=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='uploaded_materials')
    file = models.URLField(max_length=1000, null=True, blank=True, help_text="Supabase Storage URL")
    file_size_bytes = models.PositiveIntegerField(null=True, blank=True)
    original_filename = models.CharField(max_length=255, blank=True)
    quarter = models.IntegerField(null=True, blank=True, help_text="Quarter (1-4)")
    week = models.IntegerField(null=True, blank=True, help_text="Week number")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.get_material_type_display()}"


class ScratchCard(models.Model):
    serial_number = models.CharField(max_length=12, unique=True)
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='scratch_cards')
    is_used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.serial_number} - {self.student.username}"
    
    def save(self, *args, **kwargs):
        if not self.serial_number:
            self.serial_number = self.generate_serial()
        super().save(*args, **kwargs)
    
    def generate_serial(self):
        import random
        import string
        return ''.join(random.choices(string.digits, k=12))


class Fee(models.Model):
    FEE_TYPE_CHOICES = [
        ('tuition', 'Tuition Fee'),
        ('miscellaneous', 'Miscellaneous Fee'),
        ('books', 'Books/Materials'),
        ('uniform', 'Uniform'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('unpaid', 'Unpaid'),
        ('partial', 'Partially Paid'),
        ('paid', 'Paid'),
    ]
    
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='fees')
    fee_type = models.CharField(max_length=20, choices=FEE_TYPE_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='unpaid')
    due_date = models.DateField()
    paid_date = models.DateField(null=True, blank=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-due_date', '-created_at']
    
    def __str__(self):
        return f"{self.student.username} - {self.get_fee_type_display()} - {self.amount}"
    
    def balance(self):
        return self.amount - self.amount_paid
    
    def save(self, *args, **kwargs):
        if self.amount_paid >= self.amount:
            self.status = 'paid'
        elif self.amount_paid > 0:
            self.status = 'partial'
        else:
            self.status = 'unpaid'
        super().save(*args, **kwargs)


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('announcement', 'Announcement'),
        ('grade', 'Grade Update'),
        ('attendance', 'Attendance'),
        ('fee', 'Fee Reminder'),
        ('message', 'Message'),
        ('friend_request', 'Friend Request'),
        ('system', 'System'),
    ]
    
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, default='system')
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False, db_index=True)
    link = models.CharField(max_length=500, blank=True, null=True, help_text="Relative or absolute URL to redirect user when clicked")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read'], name='notif_recipient_read_idx'),
        ]
    
    def __str__(self):
        return f"{self.recipient.username} - {self.title}"

# Signals for real-time notifications
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import logging

_models_logger = logging.getLogger(__name__)

@receiver(post_save, sender=Announcement)
def send_announcement_email(sender, instance, created, **kwargs):
    """Email sending has been removed — this signal is now a no-op."""
    pass


@receiver(post_save, sender=Notification)
def broadcast_notification(sender, instance, created, **kwargs):
    if not created:
        return

    # Check user notification preferences
    prefs = getattr(instance.recipient, 'notification_preferences', None)
    notif_type = instance.notification_type
    if prefs and not prefs.is_type_enabled(notif_type):
        return  # User has disabled this notification type

    # In-app WebSocket broadcast
    if not prefs or prefs.in_app_enabled:
        try:
            channel_layer = get_channel_layer()
            if channel_layer is None:
                return

            group_name = f'notifications_{instance.recipient.id}'

            # Get unread count
            unread_count = Notification.objects.filter(recipient=instance.recipient, is_read=False).count()

            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    'type': 'notification_message',
                    'data': {
                        'type': 'notification',
                        'id': instance.id,
                        'title': instance.title,
                        'message': instance.message,
                        'notification_type': instance.notification_type,
                        'link': instance.link,
                        'created_at': instance.created_at.isoformat(),
                        'unread_count': unread_count
                    }
                }
            )
        except Exception as e:
            logging.getLogger(__name__).error(f"Failed to broadcast notification {instance.id}: {e}")

    # FCM Web Push — fire and forget, never block the signal
    if not prefs or prefs.push_enabled:
        try:
            from .fcm import send_push_notification
            send_push_notification(
                user=instance.recipient,
                title=instance.title,
                body=instance.message,
                data={
                    'notification_type': instance.notification_type,
                    'link': instance.link or '',
                    'notification_id': str(instance.id),
                }
            )
        except Exception as e:
            logging.getLogger(__name__).warning(f"FCM push failed for notification {instance.id}: {e}")


class NotificationPreference(models.Model):
    """Per-user notification preferences — controls which notification types are delivered."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_preferences')

    # Toggle per notification type
    announcement = models.BooleanField(default=True)
    grade = models.BooleanField(default=True)
    attendance = models.BooleanField(default=True)
    fee = models.BooleanField(default=True)
    message = models.BooleanField(default=True)
    friend_request = models.BooleanField(default=True)
    system = models.BooleanField(default=True)

    # Delivery channel toggles
    push_enabled = models.BooleanField(default=True, help_text="Enable browser push notifications (FCM)")
    in_app_enabled = models.BooleanField(default=True, help_text="Show in-app notification bell")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Notification Preference'
        verbose_name_plural = 'Notification Preferences'

    def __str__(self):
        return f"Notification prefs for {self.user.username}"

    def is_type_enabled(self, notification_type: str) -> bool:
        """Return True if the user has this notification type enabled."""
        return getattr(self, notification_type, True)


class FCMToken(models.Model):
    """Stores Firebase Cloud Messaging tokens for web push notifications."""
    DEVICE_CHOICES = [
        ('web', 'Web Browser'),
        ('android', 'Android'),
        ('ios', 'iOS'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='fcm_tokens')
    token = models.TextField(unique=True)
    device_type = models.CharField(max_length=10, choices=DEVICE_CHOICES, default='web')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.user.username} — {self.device_type} token"


class EnrollmentApplication(models.Model):
    GRADE_LEVEL_CHOICES = [
        ('7', 'Grade 7'),
        ('8', 'Grade 8'),
        ('9', 'Grade 9'),
        ('10', 'Grade 10'),
        ('11', 'Grade 11'),
        ('12', 'Grade 12'),
    ]
    
    ENROLLMENT_TYPE_CHOICES = [
        ('new', 'New Student'),
        ('returning', 'Returning Student'),
        ('transferee', 'Transferee'),
        ('sh_applicant', 'SHS Applicant'),
        ('parent_assisted', 'Parent-Assisted Enrollment'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('under_review', 'Under Review'),
        ('pending_requirements', 'Pending Requirements'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('enrolled', 'Enrolled'),
    ]
    
    SEX_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    ]
    
    SHS_TRACK_CHOICES = [
        ('Academic', 'Academic Track'),
        ('TechPro', 'Technical-Professional Track'),
    ]
    
    enrollment_number = models.CharField(max_length=20, unique=True, blank=True, null=True, help_text="Auto-generated ENR-YYYY-XXXXXX")
    enrollment_type = models.CharField(max_length=20, choices=ENROLLMENT_TYPE_CHOICES, default='new')
    school_year = models.CharField(max_length=20, blank=True, null=True, help_text="School year applying for (e.g., 2026-2027)")
    
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True, null=True)
    sex = models.CharField(max_length=10, choices=SEX_CHOICES)
    date_of_birth = models.DateField()
    place_of_birth = models.CharField(max_length=200, blank=True, null=True)
    nationality = models.CharField(max_length=50, default='Filipino')
    religion = models.CharField(max_length=50, blank=True, null=True)
    
    # Address Information
    street_address = models.CharField(max_length=200)
    barangay = models.CharField(max_length=100)
    city_municipality = models.CharField(max_length=100)
    province = models.CharField(max_length=100)
    zip_code = models.CharField(max_length=10, blank=True, null=True)
    
    # Parent/Guardian Information
    father_name = models.CharField(max_length=200, blank=True, null=True)
    father_occupation = models.CharField(max_length=100, blank=True, null=True)
    father_contact = models.CharField(max_length=20, blank=True, null=True)
    father_email = models.EmailField(blank=True, null=True)
    mother_name = models.CharField(max_length=200, blank=True, null=True)
    mother_occupation = models.CharField(max_length=100, blank=True, null=True)
    mother_contact = models.CharField(max_length=20, blank=True, null=True)
    mother_email = models.EmailField(blank=True, null=True)
    guardian_name = models.CharField(max_length=200, blank=True, null=True)
    guardian_relationship = models.CharField(max_length=50, blank=True, null=True)
    guardian_contact = models.CharField(max_length=20, blank=True, null=True)
    guardian_email = models.EmailField(blank=True, null=True)
    
    # Academic Information
    grade_level = models.CharField(max_length=2, choices=GRADE_LEVEL_CHOICES)
    strand = models.CharField(max_length=20, choices=SHS_TRACK_CHOICES, blank=True, null=True, help_text="Required for Grades 11-12")
    previous_school = models.CharField(max_length=200, blank=True, null=True)
    previous_school_address = models.TextField(blank=True, null=True)
    lrn = models.CharField(max_length=12, blank=True, null=True, help_text="Learner Reference Number")
    lrn_request_reason = models.CharField(max_length=200, blank=True, null=True, help_text="Reason for not having LRN")
    is_als = models.BooleanField(default=False, help_text="Alternative Learning System applicant")
    
    # Document Uploads — stored in Supabase 'enrollment-docs' bucket
    birth_certificate = models.URLField(max_length=1000, blank=True, null=True)
    report_card = models.URLField(max_length=1000, blank=True, null=True)
    form_138 = models.URLField(max_length=1000, blank=True, null=True, help_text="Grade 6 Candidate for Graduation Certificate")
    certificate_of_completion = models.URLField(max_length=1000, blank=True, null=True, help_text="Grade 10 Candidate for Completion Certificate")
    good_moral_certificate = models.URLField(max_length=1000, blank=True, null=True)
    id_picture = models.URLField(max_length=1000, blank=True, null=True, help_text="Student ID Picture")
    last_school_attended_cert = models.URLField(max_length=1000, blank=True, null=True, help_text="For ALS applicants")
    
    # Contact Information
    email = models.EmailField()
    phone_number = models.CharField(max_length=20)
    
    # Emergency Contact
    emergency_contact_name = models.CharField(max_length=200)
    emergency_contact_relationship = models.CharField(max_length=50)
    emergency_contact_phone = models.CharField(max_length=20)
    
    # Post-approval fields
    enrolled_student = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name='enrollment_applications')
    assigned_classroom = models.ForeignKey('Classroom', on_delete=models.SET_NULL, blank=True, null=True)
    temp_password_display = models.CharField(max_length=100, blank=True, null=True, help_text="Temporary password shown to applicant after enrollment")
    
    # Parent account linking
    linked_parent = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name='child_enrollment_applications', help_text="Parent account linked during enrollment")
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    remarks = models.TextField(blank=True, null=True)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name='reviewed_applications', help_text="Admin who last reviewed this application")
    
    # Timestamps
    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    reviewed_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        ordering = ['-submitted_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['enrollment_number']),
            models.Index(fields=['grade_level']),
            models.Index(fields=['school_year']),
        ]
    
    def save(self, *args, **kwargs):
        if not self.enrollment_number:
            self.enrollment_number = self._generate_enrollment_number()
        super().save(*args, **kwargs)
    
    def _generate_enrollment_number(self):
        from django.db import transaction
        year = timezone.now().year
        prefix = f"ENR-{year}-"
        with transaction.atomic():
            last = EnrollmentApplication.objects.select_for_update().filter(
                enrollment_number__startswith=prefix
            ).order_by('id').last()
            if last and last.enrollment_number:
                parts = last.enrollment_number.split('-')
                seq = int(parts[-1]) + 1
            else:
                seq = 1
            return f"{prefix}{seq:06d}"
    
    @property
    def age(self):
        from datetime import date
        if not self.date_of_birth:
            return None
        today = date.today()
        return today.year - self.date_of_birth.year - (
            (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )
    
    @property
    def full_name(self):
        parts = [self.first_name]
        if self.middle_name:
            parts.append(self.middle_name)
        parts.append(self.last_name)
        return ' '.join(parts)
    
    @property
    def is_duplicate(self):
        return EnrollmentApplication.objects.filter(
            first_name__iexact=self.first_name,
            last_name__iexact=self.last_name,
            date_of_birth=self.date_of_birth,
            status__in=['pending', 'under_review', 'pending_requirements', 'approved', 'enrolled']
        ).exclude(pk=self.pk).exists()
    
    def __str__(self):
        return f"{self.enrollment_number or 'N/A'} - {self.last_name}, {self.first_name}"


class EnrollmentDocument(models.Model):
    DOCUMENT_TYPES = [
        ('birth_certificate', 'PSA Birth Certificate'),
        ('report_card', 'Report Card'),
        ('form_138', 'Form 138 / Grade 6 Certificate'),
        ('certificate_of_completion', 'Certificate of Completion'),
        ('good_moral', 'Good Moral Certificate'),
        ('id_picture', 'ID Picture'),
        ('last_school_attended', 'Last School Attended Certificate'),
        ('other', 'Other Document'),
    ]
    
    VERIFICATION_STATUS = [
        ('submitted', 'Submitted'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
        ('missing', 'Missing'),
    ]
    
    application = models.ForeignKey(EnrollmentApplication, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=30, choices=DOCUMENT_TYPES)
    file_url = models.URLField(max_length=1000)
    file_name = models.CharField(max_length=255, blank=True, null=True)
    verification_status = models.CharField(max_length=20, choices=VERIFICATION_STATUS, default='submitted')
    admin_notes = models.TextField(blank=True, null=True, help_text="Admin notes about this document")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['document_type', 'uploaded_at']
    
    def __str__(self):
        return f"{self.get_document_type_display()} - {self.application.enrollment_number}"


class EnrollmentStatusHistory(models.Model):
    STATUS_CHOICES = EnrollmentApplication.STATUS_CHOICES
    
    application = models.ForeignKey(EnrollmentApplication, on_delete=models.CASCADE, related_name='status_history')
    from_status = models.CharField(max_length=20, choices=STATUS_CHOICES, blank=True, null=True)
    to_status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
        verbose_name_plural = 'Enrollment status histories'
    
    def __str__(self):
        return f"{self.application.enrollment_number}: {self.from_status or 'new'} → {self.to_status}"


class EnrollmentWaitlist(models.Model):
    """Waitlist for when a classroom is full."""
    classroom = models.ForeignKey('Classroom', on_delete=models.CASCADE, related_name='waitlist')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enrollment_waitlists')
    application = models.ForeignKey(EnrollmentApplication, on_delete=models.CASCADE, related_name='waitlist_entries', null=True, blank=True)
    position = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=[
        ('waiting', 'Waiting'),
        ('offered', 'Offered'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
        ('expired', 'Expired'),
    ], default='waiting')
    offered_at = models.DateTimeField(null=True, blank=True)
    response_deadline = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['position']
        unique_together = ['classroom', 'student']

    def __str__(self):
        return f"Waitlist #{self.position}: {self.student.username} → {self.classroom.name}"


class ParentLink(models.Model):
    """Links a parent account to a student through enrollment application."""
    parent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='parent_links')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='student_parent_links')
    application = models.ForeignKey(EnrollmentApplication, on_delete=models.CASCADE, related_name='parent_links')
    relationship = models.CharField(max_length=50, default='parent', help_text="Relationship to student (parent, guardian, etc.)")
    is_primary = models.BooleanField(default=False, help_text="Primary contact parent")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['parent', 'student']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.parent.username} → {self.student.username}"


class ParentTeacherMeeting(models.Model):
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('rescheduled', 'Rescheduled'),
    ]
    PURPOSE_CHOICES = [
        ('academic', 'Academic Performance'),
        ('behavioral', 'Behavioral Concern'),
        ('general', 'General Conference'),
        ('progress', 'Progress Review'),
    ]
    
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ptm_as_teacher')
    parent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ptm_as_parent')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ptm_meetings')
    classroom = models.ForeignKey('Classroom', on_delete=models.SET_NULL, null=True, blank=True, related_name='ptm_meetings')
    
    scheduled_date = models.DateField()
    scheduled_time = models.TimeField()
    duration_minutes = models.PositiveIntegerField(default=30)
    
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES, default='general')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    notes = models.TextField(blank=True, help_text="Meeting notes / minutes")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-scheduled_date', '-scheduled_time']

    def __str__(self):
        t = self.teacher.get_full_name() or self.teacher.username
        p = self.parent.get_full_name() or self.parent.username
        s = self.student.get_full_name() or self.student.username
        return f"PTM: {t} ↔ {p} for {s} on {self.scheduled_date}"


class BehavioralRecord(models.Model):
    INCIDENT_CHOICES = [
        ('tardiness', 'Tardiness'),
        ('absence', 'Unexcused Absence'),
        ('uniform', 'Uniform Violation'),
        ('disrespect', 'Disrespect'),
        ('fighting', 'Fighting'),
        ('cheating', 'Academic Dishonesty'),
        ('bullying', 'Bullying'),
        ('vandalism', 'Vandalism'),
        ('disruption', 'Class Disruption'),
        ('other', 'Other'),
    ]
    SEVERITY_CHOICES = [
        ('minor', 'Minor'),
        ('moderate', 'Moderate'),
        ('major', 'Major'),
        ('critical', 'Critical'),
    ]
    ACTION_CHOICES = [
        ('verbal_warning', 'Verbal Warning'),
        ('written_warning', 'Written Warning'),
        ('counseling', 'Counseling Session'),
        ('detention', 'Detention'),
        ('suspension', 'Suspension'),
        ('parent_meeting', 'Parent Conference'),
        ('other', 'Other'),
    ]
    
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='behavioral_records')
    classroom = models.ForeignKey('Classroom', on_delete=models.SET_NULL, null=True, blank=True, related_name='behavioral_records')
    recorded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='behavioral_records_created')
    
    incident_type = models.CharField(max_length=20, choices=INCIDENT_CHOICES)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='minor')
    action_taken = models.CharField(max_length=20, choices=ACTION_CHOICES, default='verbal_warning')
    
    description = models.TextField(help_text="Detailed description of the incident")
    incident_date = models.DateField()
    
    parent_notified = models.BooleanField(default=False)
    parent_notified_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-incident_date']

    def __str__(self):
        s = self.student.get_full_name() or self.student.username
        return f"{s} - {self.get_incident_type_display()} ({self.severity}) on {self.incident_date}"


class SchoolEvent(models.Model):
    CATEGORY_CHOICES = [
        ('academic', 'Academic'),
        ('sports', 'Sports'),
        ('cultural', 'Cultural'),
        ('holiday', 'Holiday'),
        ('meeting', 'Meeting'),
        ('exam', 'Examination'),
        ('enrollment', 'Enrollment'),
        ('other', 'Other'),
    ]
    AUDIENCE_CHOICES = [
        ('all', 'All'),
        ('students', 'Students'),
        ('parents', 'Parents'),
        ('teachers', 'Teachers'),
        ('staff', 'Staff'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='academic')
    target_audience = models.CharField(max_length=20, choices=AUDIENCE_CHOICES, default='all')
    
    start_date = models.DateField()
    start_time = models.TimeField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    is_all_day = models.BooleanField(default=False)
    
    location = models.CharField(max_length=200, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_events')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['start_date', 'start_time']

    def __str__(self):
        return f"{self.title} ({self.start_date})"


class WebsiteContent(models.Model):
    SECTION_CHOICES = [
        # Home Page
        ('home_hero_title', 'Home Hero Title'),
        ('home_hero_subtitle', 'Home Hero Subtitle'),
        ('home_feature_1_title', 'Home Feature 1 Title'),
        ('home_feature_1_content', 'Home Feature 1 Content'),
        ('home_feature_2_title', 'Home Feature 2 Title'),
        ('home_feature_2_content', 'Home Feature 2 Content'),
        ('home_feature_3_title', 'Home Feature 3 Title'),
        ('home_feature_3_content', 'Home Feature 3 Content'),
        
        # About Page
        ('about_title', 'About Title'),
        ('about_subtitle', 'About Subtitle'),
        ('about_mission_title', 'About Mission Title'),
        ('about_mission_content', 'About Mission Content'),
        ('about_vision_title', 'About Vision Title'),
        ('about_vision_content', 'About Vision Content'),
        ('about_history_title', 'About History Title'),
        ('about_history_content', 'About History Content'),
        
        # Contact Page
        ('contact_title', 'Contact Title'),
        ('contact_subtitle', 'Contact Subtitle'),
        ('contact_address', 'Contact Address'),
        ('contact_email', 'Contact Email'),
        ('contact_phone', 'Contact Phone'),
        ('contact_map_url', 'Contact Map URL'),
        
        # Programs Page
        ('programs_title', 'Programs Title'),
        ('programs_subtitle', 'Programs Subtitle'),
        ('programs_academic_title', 'Academic Programs Title'),
        ('programs_academic_content', 'Academic Programs Content'),
        ('programs_tech_title', 'Technical Programs Title'),
        ('programs_tech_content', 'Technical Programs Content'),
        ('programs_sports_title', 'Sports Programs Title'),
        ('programs_sports_content', 'Sports Programs Content'),
        ('programs_arts_title', 'Arts Programs Title'),
        ('programs_arts_content', 'Arts Programs Content'),
    ]

    CATEGORY_CHOICES = [
        ('home', 'Home Page'),
        ('about', 'About Page'),
        ('contact', 'Contact Page'),
        ('programs', 'Programs Page'),
        ('other', 'Other'),
    ]
    
    section = models.CharField(max_length=100, unique=True, null=True, blank=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='other')
    content = models.TextField(blank=True, null=True)
    image = models.URLField(max_length=1000, null=True, blank=True, help_text="Supabase Storage URL")
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        ordering = ['category', 'section']
        verbose_name = 'Website Content'
        verbose_name_plural = 'Website Contents'
    
    def __str__(self):
        return f"[{self.get_category_display()}] {self.get_section_display()}"


class Assignment(models.Model):
    ASSIGNMENT_TYPE_CHOICES = [
        ('homework', 'Homework'),
        ('quiz', 'Quiz'),
        ('exam', 'Exam'),
        ('project', 'Project'),
        ('performance_task', 'Performance Task'),
        ('laboratory', 'Laboratory'),
        ('activity', 'Activity'),
        ('other', 'Other'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name='assignments')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='assignments')
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_assignments')

    # Type and grading
    assignment_type = models.CharField(max_length=20, choices=ASSIGNMENT_TYPE_CHOICES, default='homework')
    points = models.IntegerField(default=100)
    percentage_weight = models.DecimalField(max_digits=5, decimal_places=2, default=0,
        help_text="Weight of this assignment in the grade component (0 = use all equally)")

    # File attachment
    file = models.URLField(max_length=1000, null=True, blank=True, help_text="Supabase Storage URL")
    original_filename = models.CharField(max_length=255, blank=True)
    file_size_bytes = models.PositiveIntegerField(null=True, blank=True)

    # Scheduling
    due_date = models.DateTimeField()
    is_published = models.BooleanField(default=True, help_text="Draft assignments are hidden from students")
    publish_at = models.DateTimeField(null=True, blank=True, help_text="Schedule future publication")

    # Late submission policy
    allow_late_submissions = models.BooleanField(default=True)
    max_late_submissions = models.IntegerField(default=0, help_text="0 = unlimited, N = max N late submissions allowed per student")

    # Grade component linkage — which Grade.grade_type this assignment contributes to
    grade_component = models.CharField(max_length=30, blank=True, default='',
        choices=[('', 'Not linked'), ('written_work', 'Written Work'), ('performance_task', 'Performance Task'), ('quarterly_assessment', 'Quarterly Assessment')],
        help_text="Link this assignment to a grade component for auto-grade propagation")

    # Template support
    is_template = models.BooleanField(default=False, help_text="Template assignments are reusable")
    template_name = models.CharField(max_length=200, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-due_date']

    def __str__(self):
        return f"{self.title} - {self.classroom.name}"

    @property
    def is_visible_to_students(self):
        """Check if this assignment should be visible to students."""
        from django.utils import timezone as tz
        if not self.is_published:
            return False
        if self.publish_at and self.publish_at > tz.now():
            return False
        return True

class Submission(models.Model):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='submissions')
    file = models.URLField(max_length=1000, help_text="Supabase Storage URL")
    original_filename = models.CharField(max_length=255, blank=True)
    file_size_bytes = models.PositiveIntegerField(null=True, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    grade = models.IntegerField(null=True, blank=True)
    feedback = models.TextField(blank=True, null=True)
    is_late = models.BooleanField(default=False)
    graded_at = models.DateTimeField(null=True, blank=True)
    graded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='graded_submissions')

    class Meta:
        unique_together = ['assignment', 'student']
        ordering = ['-submitted_at']

    def __str__(self):
        return f"{self.student.username} - {self.assignment.title}"

    def save(self, *args, **kwargs):
        if not self.pk:
            if timezone.now() > self.assignment.due_date:
                self.is_late = True
        super().save(*args, **kwargs)


class Grade(models.Model):
    """
    Comprehensive Grade Management System
    Stores individual subject grades for students with detailed tracking
    """
    GRADE_TYPE_CHOICES = [
        ('written_work', 'Written Work'),
        ('performance_task', 'Performance Task'),
        ('quarterly_assessment', 'Quarterly Assessment'),
        ('final_grade', 'Final Grade'),
    ]
    
    QUARTER_CHOICES = [
        (1, 'First Quarter'),
        (2, 'Second Quarter'),
        (3, 'Third Quarter'),
        (4, 'Fourth Quarter'),
    ]
    
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subject_grades')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='subject_grades')
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name='subject_grades', null=True, blank=True)
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assigned_subject_grades')
    
    # Grade components
    grade_type = models.CharField(max_length=30, choices=GRADE_TYPE_CHOICES, default='written_work')
    quarter = models.IntegerField(choices=QUARTER_CHOICES)
    
    # Score information
    raw_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    total_score = models.DecimalField(max_digits=5, decimal_places=2, default=100)
    
    # Final grade for the subject (calculated)
    final_grade = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    # Remarks and feedback
    remarks = models.TextField(blank=True, null=True)
    computed_remarks = models.CharField(max_length=50, blank=True, null=True)
    
    # Metadata
    academic_year = models.CharField(max_length=20, default='2025-2026')
    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_locked = models.BooleanField(default=False, help_text="Prevents further edits after submission")
    
    class Meta:
        unique_together = ['student', 'subject', 'grade_type', 'quarter', 'academic_year']
        ordering = ['-academic_year', '-quarter', 'subject__name', 'grade_type']
    
    def __str__(self):
        return f"{self.student.username} - {self.subject.code} - Q{self.quarter} ({self.academic_year})"
    
    def save(self, *args, **kwargs):
        if self.raw_score is not None:
            self.compute_remarks()
        super().save(*args, **kwargs)
    
    def compute_remarks(self):
        """Compute automatic remarks based on raw score"""
        passing = float(SystemSetting.get_settings().passing_grade)
        if self.raw_score is None:
            self.computed_remarks = "No Grade"
        elif self.raw_score >= 90:
            self.computed_remarks = "Outstanding"
        elif self.raw_score >= 85:
            self.computed_remarks = "Very Satisfactory"
        elif self.raw_score >= 80:
            self.computed_remarks = "Satisfactory"
        elif self.raw_score >= passing:
            self.computed_remarks = "Fairly Satisfactory"
        else:
            self.computed_remarks = "Did Not Meet Expectations"
        
        return self.computed_remarks
    
    def get_percentage(self):
        """Calculate percentage score"""
        if self.raw_score is not None and self.total_score > 0:
            return round((self.raw_score / self.total_score) * 100, 2)
        return None


# ─── Schedule / Timetable System ─────────────────────────────────────────────

class Room(models.Model):
    """Physical room or location for a class schedule."""
    name = models.CharField(max_length=100, help_text="e.g. Room 204, Science Lab, Gym")
    building = models.CharField(max_length=100, blank=True, null=True)
    capacity = models.IntegerField(default=40)
    room_type = models.CharField(
        max_length=30,
        choices=[
            ('classroom', 'Classroom'),
            ('laboratory', 'Laboratory'),
            ('gym', 'Gymnasium'),
            ('library', 'Library'),
            ('other', 'Other'),
        ],
        default='classroom'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class TimeSlot(models.Model):
    """Time slot definition scoped to a classroom section (e.g. 7:30 AM – 8:30 AM Period 1).
    
    Each section can have its own bell schedule. The classroom field is nullable
    for backward compatibility with universally-created slots.
    """
    DAY_CHOICES = [
        ('monday', 'Monday'),
        ('tuesday', 'Tuesday'),
        ('wednesday', 'Wednesday'),
        ('thursday', 'Thursday'),
        ('friday', 'Friday'),
        ('saturday', 'Saturday'),
    ]

    classroom = models.ForeignKey(
        Classroom, on_delete=models.CASCADE, related_name='time_slots',
        null=True, blank=True,
        help_text="Scope this time slot to a specific section. Null = universal."
    )
    day = models.CharField(max_length=10, choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    label = models.CharField(max_length=50, blank=True, null=True, help_text="Optional label, e.g. '1st Period'")

    class Meta:
        ordering = ['day', 'start_time']
        unique_together = ['classroom', 'day', 'start_time', 'end_time']

    def __str__(self):
        scope = f" [{self.classroom.name}]" if self.classroom else ""
        return f"{self.get_day_display()} {self.start_time.strftime('%I:%M %p')} – {self.end_time.strftime('%I:%M %p')}{scope}"


class Schedule(models.Model):
    """
    A single schedule entry: one subject, one teacher, one classroom section,
    one room, one time slot, for a given academic year / semester.
    """
    classroom = models.ForeignKey(
        Classroom, on_delete=models.CASCADE, related_name='schedules'
    )
    subject = models.ForeignKey(
        Subject, on_delete=models.CASCADE, related_name='schedules'
    )
    teacher = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='teaching_schedules',
        limit_choices_to={'role': 'teacher'}
    )
    room = models.ForeignKey(
        Room, on_delete=models.SET_NULL, null=True, blank=True, related_name='schedules'
    )
    time_slot = models.ForeignKey(
        TimeSlot, on_delete=models.CASCADE, related_name='schedules'
    )
    academic_year = models.ForeignKey(
        'portal.AcademicYear', on_delete=models.CASCADE, related_name='schedules'
    )
    semester = models.ForeignKey(
        'portal.Semester', on_delete=models.SET_NULL, null=True, blank=True, related_name='schedules'
    )
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['time_slot__day', 'time_slot__start_time']
        # Prevent double-booking: same teacher at same time
        constraints = [
            models.UniqueConstraint(
                fields=['teacher', 'time_slot', 'academic_year'],
                name='unique_teacher_timeslot_year'
            ),
            # Prevent same room being double-booked
            models.UniqueConstraint(
                fields=['room', 'time_slot', 'academic_year'],
                condition=models.Q(room__isnull=False),
                name='unique_room_timeslot_year'
            ),
            # Prevent same classroom section from having two subjects at the same time
            models.UniqueConstraint(
                fields=['classroom', 'time_slot', 'academic_year'],
                name='unique_classroom_timeslot_year'
            ),
        ]

    def __str__(self):
        return (
            f"{self.classroom.name} | {self.subject.code} | "
            f"{self.time_slot} | {self.teacher.get_full_name() or self.teacher.username}"
        )


class GradeReport(models.Model):
    """
    Generated grade reports for students
    Stores computed final grades and summaries
    """
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='student_grade_reports')
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name='classroom_grade_reports')
    quarter = models.IntegerField(choices=[(1, 'Q1'), (2, 'Q2'), (3, 'Q3'), (4, 'Q4')])
    school_year = models.CharField(max_length=20, default='2025-2026')
    
    # Computed averages
    general_average = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    total_subjects = models.IntegerField(default=0)
    passed_subjects = models.IntegerField(default=0)
    failed_subjects = models.IntegerField(default=0)
    
    # Overall remarks
    overall_remarks = models.TextField(blank=True, null=True)
    class_rank = models.IntegerField(null=True, blank=True)
    
    # GPA (General Point Average) — DepEd: 1.0 = 98-100, 5.0 = Below 75
    gpa = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    
    # Approval workflow
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted for Review'),
        ('approved', 'Approved'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_grade_reports')
    approved_at = models.DateTimeField(null=True, blank=True)
    
    # Report metadata
    generated_at = models.DateTimeField(auto_now_add=True)
    generated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='generated_reports')
    is_final = models.BooleanField(default=False, help_text="Final report for the school year")
    
    class Meta:
        unique_together = ['student', 'classroom', 'quarter', 'school_year']
        ordering = ['-school_year', '-quarter', 'student__username']
    
    def __str__(self):
        return f"{self.student.username} - Q{self.quarter} - {self.school_year}"
    
    def calculate_averages(self):
        """Calculate general average, class rank, GPA, and statistics"""
        grades = Grade.objects.filter(
            student=self.student,
            classroom=self.classroom,
            quarter=self.quarter,
            grade_type='final_grade'
        )
        
        if grades.exists():
            scores = [float(g.raw_score) for g in grades if g.raw_score is not None]
            self.total_subjects = grades.count()
            if scores:
                self.general_average = round(sum(scores) / len(scores), 2)
                self.passed_subjects = sum(1 for s in scores if s >= float(SystemSetting.get_settings().passing_grade))
                self.failed_subjects = len(scores) - self.passed_subjects
                self.gpa = self._compute_gpa(self.general_average)
            else:
                self.general_average = None
                self.gpa = None
        else:
            self.general_average = None
            self.total_subjects = 0
            self.passed_subjects = 0
            self.failed_subjects = 0
            self.gpa = None
        
        self.save()
    
    @staticmethod
    def _compute_gpa(average):
        """Compute GPA using DepEd standard: 1.0=98-100, 1.25=95-97, 1.5=92-94, 1.75=89-91, 2.0=86-88, 2.25=83-85, 2.5=80-82, 2.75=77-79, 3.0=75-76, 5.0=Below 75"""
        if average is None:
            return None
        avg = float(average)
        if avg >= 98: return Decimal('1.00')
        if avg >= 95: return Decimal('1.25')
        if avg >= 92: return Decimal('1.50')
        if avg >= 89: return Decimal('1.75')
        if avg >= 86: return Decimal('2.00')
        if avg >= 83: return Decimal('2.25')
        if avg >= 80: return Decimal('2.50')
        if avg >= 77: return Decimal('2.75')
        if avg >= 75: return Decimal('3.00')
        return Decimal('5.00')
    
    def compute_class_rank(self):
        """Compute class rank based on general_average among same classroom/quarter."""
        if self.general_average is None:
            self.class_rank = None
            self.save(update_fields=['class_rank'])
            return
        classmates = GradeReport.objects.filter(
            classroom=self.classroom,
            quarter=self.quarter,
            school_year=self.school_year,
            general_average__isnull=False,
        ).order_by('-general_average')
        rank = 1
        for i, report in enumerate(classmates):
            if report.id == self.id:
                self.class_rank = rank
                self.save(update_fields=['class_rank'])
                return
            rank += 1
        self.class_rank = rank
        self.save(update_fields=['class_rank'])


# ═══════════════════════════════════════════════════════════════════════════════
# COMMUNICATION CENTER — Ticket-Based System
# ═══════════════════════════════════════════════════════════════════════════════

class Ticket(models.Model):
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('pending', 'Pending'),
        ('replied', 'Replied'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]
    PRIORITY_CHOICES = [
        ('normal', 'Normal'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    CATEGORY_CHOICES = [
        ('enrollment', 'Enrollment'),
        ('attendance', 'Attendance'),
        ('academic', 'Academic'),
        ('collaboration', 'Collaboration'),
        ('facilities', 'Facilities'),
        ('it_support', 'IT Support'),
        ('finance', 'Finance'),
        ('guidance', 'Guidance'),
        ('other', 'Other'),
    ]

    ticket_id = models.CharField(max_length=20, unique=True, db_index=True)
    subject = models.CharField(max_length=255)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other', db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open', db_index=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='normal', db_index=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tickets_created')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='tickets_assigned')
    department = models.CharField(max_length=50, blank=True, default='')
    is_archived = models.BooleanField(default=False)
    first_response_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)

    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['status', 'category', 'assigned_to']),
            models.Index(fields=['created_by', 'status']),
        ]

    def __str__(self):
        return f"{self.ticket_id}: {self.subject}"

    def save(self, *args, **kwargs):
        if not self.ticket_id:
            last = Ticket.objects.order_by('-id').first()
            num = (last.id + 1) if last else 1
            self.ticket_id = f"TKT-{str(num).zfill(4)}"
        super().save(*args, **kwargs)


class TicketParticipant(models.Model):
    ROLE_CHOICES = [
        ('viewer', 'Viewer'),
        ('collaborator', 'Collaborator'),
    ]
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ticket_participations')
    role = models.CharField(max_length=15, choices=ROLE_CHOICES, default='viewer')
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['ticket', 'user']

    def __str__(self):
        return f"{self.user.username} on {self.ticket.ticket_id}"


class TicketMessage(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ticket_messages')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Message by {self.sender.username} on {self.ticket.ticket_id}"


class TicketAttachment(models.Model):
    MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB
    ALLOWED_CONTENT_TYPES = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain', 'text/csv',
        'application/zip',
    ]

    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='attachments')
    file_name = models.CharField(max_length=255)
    file_url = models.URLField(max_length=500)
    file_size_bytes = models.PositiveIntegerField(default=0)
    content_type = models.CharField(max_length=100, blank=True, default='')
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.file_name} on {self.ticket.ticket_id}"

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.file_size_bytes > self.MAX_FILE_SIZE_BYTES:
            max_mb = self.MAX_FILE_SIZE_BYTES // (1024 * 1024)
            raise ValidationError(f'File size exceeds maximum allowed size of {max_mb} MB.')
        if self.content_type and self.content_type not in self.ALLOWED_CONTENT_TYPES:
            raise ValidationError(f'File type "{self.content_type}" is not allowed.')


class DepartmentContact(models.Model):
    DEPARTMENT_CHOICES = [
        ('registrar', 'Registrar'),
        ('advisory', 'Advisory'),
        ('faculty', 'Faculty'),
        ('admin', "Principal's Office"),
        ('guidance', 'Guidance'),
        ('it', 'IT Support'),
        ('finance', 'Finance'),
        ('library', 'Library'),
    ]
    department = models.CharField(max_length=20, choices=DEPARTMENT_CHOICES, unique=True)
    contact_person = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='department_contacts')
    description = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Department contacts'

    def __str__(self):
        return f"Department: {self.get_department_display()}"


class Department(models.Model):
    """Full department model for managing academic/non-academic units."""
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)
    head = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='headed_departments')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"


class StaffPerformance(models.Model):
    """Track staff/teacher performance metrics per academic year."""
    RATING_CHOICES = [
        (1, 'Needs Improvement'),
        (2, 'Below Expectations'),
        (3, 'Meets Expectations'),
        (4, 'Exceeds Expectations'),
        (5, 'Outstanding'),
    ]

    staff = models.ForeignKey(User, on_delete=models.CASCADE, related_name='performance_records')
    academic_year = models.CharField(max_length=20)
    evaluated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='evaluations_given')

    # Metrics (1-5 scale)
    teaching_quality = models.PositiveSmallIntegerField(choices=RATING_CHOICES, default=3)
    student_engagement = models.PositiveSmallIntegerField(choices=RATING_CHOICES, default=3)
    classroom_management = models.PositiveSmallIntegerField(choices=RATING_CHOICES, default=3)
    lesson_planning = models.PositiveSmallIntegerField(choices=RATING_CHOICES, default=3)
    professional_development = models.PositiveSmallIntegerField(choices=RATING_CHOICES, default=3)

    # Quantitative metrics
    average_student_grade = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    attendance_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True,
        help_text="Teacher attendance rate (%)")
    students_passed_pct = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True,
        help_text="% of students who passed")

    comments = models.TextField(blank=True)
    overall_rating = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['staff', 'academic_year']
        ordering = ['-academic_year']

    def __str__(self):
        return f"Performance: {self.staff.username} ({self.academic_year})"

    def compute_overall_rating(self):
        scores = [
            self.teaching_quality, self.student_engagement,
            self.classroom_management, self.lesson_planning,
            self.professional_development,
        ]
        self.overall_rating = round(sum(scores) / len(scores), 2)
        self.save(update_fields=['overall_rating'])


# ═══════════════════════════════════════════════════════════════════════════════
# ACADEMIC RECORDS — Transcripts, Certificates, Achievements
# ═══════════════════════════════════════════════════════════════════════════════

class Transcript(models.Model):
    """
    Official academic transcript for a student.
    Aggregates grades across all quarters and subjects for a school year.
    """
    TRANSCRIPT_STATUS = [
        ('draft', 'Draft'),
        ('final', 'Final'),
        ('archived', 'Archived'),
    ]

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transcripts')
    school_year = models.CharField(max_length=20)
    general_average = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    total_subjects = models.IntegerField(default=0)
    passed_subjects = models.IntegerField(default=0)
    failed_subjects = models.IntegerField(default=0)
    status = models.CharField(max_length=10, choices=TRANSCRIPT_STATUS, default='draft')
    remarks = models.TextField(blank=True, null=True)
    generated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='generated_transcripts')
    pdf_url = models.URLField(max_length=1000, blank=True, null=True)
    generated_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['student', 'school_year']
        ordering = ['-school_year', 'student__username']

    def __str__(self):
        return f"Transcript: {self.student.username} - {self.school_year}"

    def generate_from_grades(self):
        """Pull all final grades for this student/school_year and compute summary."""
        grades = Grade.objects.filter(
            student=self.student,
            academic_year=self.school_year,
            grade_type='final_grade',
            raw_score__isnull=False,
        )
        if not grades.exists():
            return

        passing = float(SystemSetting.get_settings().passing_grade)
        scores = [float(g.raw_score) for g in grades]
        self.general_average = round(sum(scores) / len(scores), 2)
        self.total_subjects = len(scores)
        self.passed_subjects = sum(1 for s in scores if s >= passing)
        self.failed_subjects = self.total_subjects - self.passed_subjects

        if self.general_average >= 90:
            self.remarks = "With High Honors"
        elif self.general_average >= 85:
            self.remarks = "With Honors"
        elif self.general_average >= passing:
            self.remarks = "Promoted"
        else:
            self.remarks = "For Review"

        self.save()


class TranscriptLineItem(models.Model):
    """Individual subject line on a transcript."""
    transcript = models.ForeignKey(Transcript, on_delete=models.CASCADE, related_name='items')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    q1 = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    q2 = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    q3 = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    q4 = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    final_average = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    remarks = models.CharField(max_length=50, blank=True)

    class Meta:
        unique_together = ['transcript', 'subject']
        ordering = ['subject__name']

    def __str__(self):
        return f"{self.subject.code} - Avg: {self.final_average}"

    def compute_final(self):
        scores = [float(s) for s in [self.q1, self.q2, self.q3, self.q4] if s is not None]
        if scores:
            self.final_average = round(sum(scores) / len(scores), 2)
            passing = float(SystemSetting.get_settings().passing_grade)
            if self.final_average >= 90:
                self.remarks = "Outstanding"
            elif self.final_average >= 85:
                self.remarks = "Very Satisfactory"
            elif self.final_average >= 80:
                self.remarks = "Satisfactory"
            elif self.final_average >= passing:
                self.remarks = "Fairly Satisfactory"
            else:
                self.remarks = "Did Not Meet Expectations"
        else:
            self.final_average = None
            self.remarks = "No Grade"
        self.save()


class TransferCertificate(models.Model):
    """
    Official Transfer Certificate (Form 137-T).
    Generated when a student transfers to another school.
    """
    TC_STATUS = [
        ('requested', 'Requested'),
        ('processing', 'Processing'),
        ('ready', 'Ready for Pickup'),
        ('released', 'Released'),
        ('cancelled', 'Cancelled'),
    ]

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transfer_certificates')
    reference_number = models.CharField(max_length=30, unique=True)
    school_year_from = models.CharField(max_length=20, help_text="School year student is transferring from")
    school_year_to = models.CharField(max_length=20, blank=True, help_text="School year student is transferring to")
    destination_school = models.CharField(max_length=200, blank=True, help_text="School the student is transferring to")
    last_grade_completed = models.CharField(max_length=20, blank=True)
    last_school_attended = models.CharField(max_length=200, blank=True, default='Kiwalan National High School')
    general_average = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    place_of_birth = models.CharField(max_length=200, blank=True)
    nationality = models.CharField(max_length=100, blank=True, default='Filipino')
    status = models.CharField(max_length=15, choices=TC_STATUS, default='requested')
    reason = models.TextField(blank=True, help_text="Reason for transfer")
    remarks = models.TextField(blank=True)
    issued_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='issued_tcs')
    issued_at = models.DateTimeField(null=True, blank=True)
    pdf_url = models.URLField(max_length=1000, blank=True, null=True)
    requested_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-requested_at']

    def __str__(self):
        return f"TC {self.reference_number} - {self.student.username}"

    def save(self, *args, **kwargs):
        if not self.reference_number:
            import random, string
            year = timezone.now().year
            seq = ''.join(random.choices(string.digits, k=6))
            self.reference_number = f"TC-{year}-{seq}"
        if not self.last_grade_completed:
            enrollment = StudentClassEnrollment.objects.filter(
                student=self.student
            ).select_related('classroom').order_by('-enrolled_at').first()
            if enrollment:
                self.last_grade_completed = enrollment.classroom.grade_level or ''
        if not self.general_average:
            grades = Grade.objects.filter(
                student=self.student,
                grade_type='final_grade',
                raw_score__isnull=False,
            ).order_by('-academic_year')[:1]
            if grades:
                self.general_average = grades.first().raw_score
        super().save(*args, **kwargs)


class CharacterCertificate(models.Model):
    """
    Certificate of Good Moral Character.
    """
    CC_STATUS = [
        ('requested', 'Requested'),
        ('approved', 'Approved'),
        ('ready', 'Ready for Pickup'),
        ('released', 'Released'),
        ('cancelled', 'Cancelled'),
    ]

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='character_certificates')
    reference_number = models.CharField(max_length=30, unique=True)
    purpose = models.CharField(max_length=200, blank=True, help_text="Purpose of the certificate")
    school_year = models.CharField(max_length=20, blank=True)
    status = models.CharField(max_length=15, choices=CC_STATUS, default='requested')
    character_rating = models.CharField(max_length=50, default='Excellent',
        choices=[('Excellent', 'Excellent'), ('Very Good', 'Very Good'), ('Good', 'Good'), ('Fair', 'Fair'), ('Poor', 'Poor')])
    remarks = models.TextField(blank=True)
    issued_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='issued_ccs')
    issued_at = models.DateTimeField(null=True, blank=True)
    pdf_url = models.URLField(max_length=1000, blank=True, null=True)
    requested_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-requested_at']

    def __str__(self):
        return f"CC {self.reference_number} - {self.student.username}"

    def save(self, *args, **kwargs):
        if not self.reference_number:
            import random, string
            year = timezone.now().year
            seq = ''.join(random.choices(string.digits, k=6))
            self.reference_number = f"CC-{year}-{seq}"
        super().save(*args, **kwargs)


class AchievementRecord(models.Model):
    """
    Student achievement and recognition records.
    Tracks awards, honors, competitions, and extracurricular accomplishments.
    """
    CATEGORY_CHOICES = [
        ('academic', 'Academic'),
        ('sports', 'Sports'),
        ('arts', 'Arts & Culture'),
        ('leadership', 'Leadership'),
        ('community', 'Community Service'),
        ('competition', 'Competition'),
        ('other', 'Other'),
    ]

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='achievement_records')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='academic')
    date_achieved = models.DateField()
    awarded_by = models.CharField(max_length=200, blank=True, help_text="Organization or person who gave the award")
    school_year = models.CharField(max_length=20, blank=True)
    grade_level = models.CharField(max_length=20, blank=True)
    evidence_url = models.URLField(max_length=1000, blank=True, null=True, help_text="URL to supporting document")
    is_verified = models.BooleanField(default=False)
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_achievements')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date_achieved']

    def __str__(self):
        return f"{self.student.username} - {self.title} ({self.date_achieved})"


class RecordRequest(models.Model):
    """
    Unified record request workflow.
    Students/parents request records (transcripts, certificates, etc.)
    and staff/admins approve/reject/process them.
    """
    RECORD_TYPE_CHOICES = [
        ('transcript', 'Official Transcript'),
        ('transfer_certificate', 'Transfer Certificate'),
        ('character_certificate', 'Character Certificate'),
        ('enrollment_verification', 'Enrollment Verification'),
        ('other', 'Other'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('ready', 'Ready for Pickup'),
        ('released', 'Released'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    ]

    requestor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='record_requests')
    record_type = models.CharField(max_length=30, choices=RECORD_TYPE_CHOICES)
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='requests_for_student', null=True, blank=True, help_text="Student the record is for (if requestor is parent)")
    purpose = models.CharField(max_length=300, blank=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True, help_text="Requestor notes")
    admin_notes = models.TextField(blank=True, help_text="Staff/admin internal notes")
    handled_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='handled_requests')
    copies = models.PositiveIntegerField(default=1)
    reference_record_id = models.IntegerField(null=True, blank=True, help_text="ID of the generated record (Transcript, TC, CC)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Request #{self.id} - {self.get_record_type_display()} for {self.student or self.requestor}"
