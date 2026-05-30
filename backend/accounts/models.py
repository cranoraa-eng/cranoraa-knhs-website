from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('teacher', 'Teacher'),
        ('student', 'Student'),
        ('parent', 'Parent'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('suspended', 'Suspended'),
        ('pending_reset', 'Pending Password Reset'),
    ]
    
    email = models.EmailField(unique=True, null=True, blank=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
    is_verified = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=False)
    last_activity = models.DateTimeField(null=True, blank=True)
    
    # School System Fields
    must_change_password = models.BooleanField(default=False)
    account_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['role']
    
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
    lrn = models.CharField(max_length=12, blank=True, null=True, help_text="Learner Reference Number (12 digits)")
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
    timestamp = models.DateTimeField(auto_now_add=True)
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
    current_quarter = models.CharField(max_length=1, default='1', choices=[('1', '1st'), ('2', '2nd'), ('3', '3rd'), ('4', '4th')])
    academic_year = models.CharField(max_length=9, default='2025-2026')
    
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
    
    @staticmethod
    def transmute_score(raw_score):
        """
        DepEd Transmutation Table (K to 12)
        Converts raw scores to transmuted grades (60-100 scale)
        """
        if raw_score is None:
            return None
        
        # DepEd Transmutation Table
        transmutation_table = [
            (100, 100), (99, 99), (98, 98), (97, 97), (96, 96),
            (95, 95), (94, 95), (93, 94), (92, 94), (91, 93),
            (90, 93), (89, 92), (88, 92), (87, 91), (86, 91),
            (85, 90), (84, 90), (83, 89), (82, 89), (81, 88),
            (80, 88), (79, 87), (78, 87), (77, 86), (76, 86),
            (75, 85), (74, 85), (73, 84), (72, 84), (71, 83),
            (70, 83), (69, 82), (68, 82), (67, 81), (66, 81),
            (65, 80), (64, 80), (63, 79), (62, 79), (61, 78),
            (60, 78), (59, 77), (58, 77), (57, 76), (56, 76),
            (55, 75), (54, 75), (53, 74), (52, 74), (51, 73),
            (50, 73), (49, 72), (48, 72), (47, 71), (46, 71),
            (45, 70), (44, 70), (43, 69), (42, 69), (41, 68),
            (40, 68), (39, 67), (38, 67), (37, 66), (36, 66),
            (35, 65), (34, 65), (33, 64), (32, 64), (31, 63),
            (30, 63), (29, 62), (28, 62), (27, 61), (26, 61),
            (25, 60), (24, 60), (23, 60), (22, 60), (21, 60),
            (20, 60), (19, 60), (18, 60), (17, 60), (16, 60),
            (15, 60), (14, 60), (13, 60), (12, 60), (11, 60),
            (10, 60), (9, 60), (8, 60), (7, 60), (6, 60),
            (5, 60), (4, 60), (3, 60), (2, 60), (1, 60),
            (0, 60)
        ]
        
        raw_score = max(0, min(100, raw_score))
        for raw, transmuted in transmutation_table:
            if raw_score >= raw:
                return transmuted
        return 60
    
    def get_transmuted_quarters(self):
        """Return transmuted values for all quarters"""
        return {
            'q1': self.transmute_score(self.q1),
            'q2': self.transmute_score(self.q2),
            'q3': self.transmute_score(self.q3),
            'q4': self.transmute_score(self.q4),
        }
    
    def calculate_general_average(self):
        quarters = [self.q1, self.q2, self.q3, self.q4]
        valid_quarters = [q for q in quarters if q is not None]
        if valid_quarters:
            return round(sum(valid_quarters) / len(valid_quarters))
        return None
    
    def calculate_transmuted_average(self):
        """Calculate average of transmuted quarterly grades"""
        transmuted = self.get_transmuted_quarters()
        transmuted_values = [v for v in transmuted.values() if v is not None]
        if transmuted_values:
            return round(sum(transmuted_values) / len(transmuted_values))
        return None
    
    def get_descriptive_equivalent(self):
        avg = self.calculate_transmuted_average()
        if avg is None:
            return "No Grades"
        if avg >= 90:
            return "Outstanding"
        if avg >= 85:
            return "Very Satisfactory"
        if avg >= 80:
            return "Satisfactory"
        if avg >= 75:
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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['student', 'classroom', 'date']
        ordering = ['-date', 'student__username']
    
    def __str__(self):
        return f"{self.student.username} - {self.date} - {self.status}"


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
    is_read = models.BooleanField(default=False)
    link = models.CharField(max_length=500, blank=True, null=True, help_text="Relative or absolute URL to redirect user when clicked")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
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
    if created:
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
            import logging
            logging.getLogger(__name__).error(f"Failed to broadcast notification {instance.id}: {e}")

        # FCM Web Push — fire and forget, never block the signal
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
            import logging
            logging.getLogger(__name__).warning(f"FCM push failed for notification {instance.id}: {e}")


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
    
    SHS_STRAND_CHOICES = [
        ('STEM', 'STEM'),
        ('ABM', 'ABM'),
        ('HUMSS', 'HUMSS'),
        ('GAS', 'GAS'),
        ('TVL-ICT', 'TVL-ICT'),
        ('TVL-HE', 'TVL-HE'),
        ('TVL-IA', 'TVL-IA'),
        ('TVL-AFA', 'TVL-AFA'),
        ('Sports', 'Sports'),
        ('Arts & Design', 'Arts & Design'),
    ]
    
    enrollment_number = models.CharField(max_length=20, unique=True, blank=True, null=True, help_text="Auto-generated ENR-YYYY-XXXXXX")
    enrollment_type = models.CharField(max_length=20, choices=ENROLLMENT_TYPE_CHOICES, default='new')
    
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
    father_name = models.CharField(max_length=200)
    father_occupation = models.CharField(max_length=100, blank=True, null=True)
    father_contact = models.CharField(max_length=20, blank=True, null=True)
    mother_name = models.CharField(max_length=200)
    mother_occupation = models.CharField(max_length=100, blank=True, null=True)
    mother_contact = models.CharField(max_length=20, blank=True, null=True)
    guardian_name = models.CharField(max_length=200, blank=True, null=True)
    guardian_relationship = models.CharField(max_length=50, blank=True, null=True)
    guardian_contact = models.CharField(max_length=20, blank=True, null=True)
    
    # Academic Information
    grade_level = models.CharField(max_length=2, choices=GRADE_LEVEL_CHOICES)
    strand = models.CharField(max_length=20, choices=SHS_STRAND_CHOICES, blank=True, null=True, help_text="Required for Grades 11-12")
    previous_school = models.CharField(max_length=200, blank=True, null=True)
    previous_school_address = models.TextField(blank=True, null=True)
    lrn = models.CharField(max_length=12, blank=True, null=True, help_text="Learner Reference Number")
    is_als = models.BooleanField(default=False, help_text="Alternative Learning System applicant")
    
    # Document Uploads — stored in Supabase 'enrollment-docs' bucket
    birth_certificate = models.URLField(max_length=1000, blank=True, null=True)
    report_card = models.URLField(max_length=1000, blank=True, null=True)
    form_138 = models.URLField(max_length=1000, blank=True, null=True, help_text="Grade 6 Candidate for Graduation Certificate")
    certificate_of_completion = models.URLField(max_length=1000, blank=True, null=True, help_text="Grade 10 Candidate for Completion Certificate")
    good_moral_certificate = models.URLField(max_length=1000, blank=True, null=True)
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
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    remarks = models.TextField(blank=True, null=True)
    
    # Timestamps
    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-submitted_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['enrollment_number']),
            models.Index(fields=['grade_level']),
        ]
    
    def save(self, *args, **kwargs):
        if not self.enrollment_number:
            self.enrollment_number = self._generate_enrollment_number()
        super().save(*args, **kwargs)
    
    def _generate_enrollment_number(self):
        from django.utils import timezone
        year = timezone.now().year
        prefix = f"ENR-{year}-"
        last = EnrollmentApplication.objects.filter(enrollment_number__startswith=prefix).order_by('id').last()
        if last and last.enrollment_number:
            parts = last.enrollment_number.split('-')
            seq = int(parts[-1]) + 1
        else:
            seq = 1
        return f"{prefix}{seq:06d}"
    
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
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name='assignments')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='assignments')
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_assignments')
    file = models.URLField(max_length=1000, null=True, blank=True, help_text="Supabase Storage URL")
    original_filename = models.CharField(max_length=255, blank=True)
    file_size_bytes = models.PositiveIntegerField(null=True, blank=True)
    due_date = models.DateTimeField()
    points = models.IntegerField(default=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-due_date']
    
    def __str__(self):
        return f"{self.title} - {self.classroom.name}"

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
    transmuted_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
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
        # No transmutation — raw_score IS the final grade (0-100)
        if self.raw_score is not None:
            self.transmuted_score = self.raw_score
            self.compute_remarks()
        super().save(*args, **kwargs)
    
    @staticmethod
    def transmute_score(raw_score):
        """
        DepEd Transmutation Table (K to 12)
        Converts raw scores to transmuted grades (60-100 scale)
        """
        if raw_score is None:
            return None
        
        # DepEd Transmutation Table
        transmutation_table = [
            (100, 100), (99, 99), (98, 98), (97, 97), (96, 96),
            (95, 95), (94, 95), (93, 94), (92, 94), (91, 93),
            (90, 93), (89, 92), (88, 92), (87, 91), (86, 91),
            (85, 90), (84, 90), (83, 89), (82, 89), (81, 88),
            (80, 88), (79, 87), (78, 87), (77, 86), (76, 86),
            (75, 85), (74, 85), (73, 84), (72, 84), (71, 83),
            (70, 83), (69, 82), (68, 82), (67, 81), (66, 81),
            (65, 80), (64, 80), (63, 79), (62, 79), (61, 78),
            (60, 78), (59, 77), (58, 77), (57, 76), (56, 76),
            (55, 75), (54, 75), (53, 74), (52, 74), (51, 73),
            (50, 73), (49, 72), (48, 72), (47, 71), (46, 71),
            (45, 70), (44, 70), (43, 69), (42, 69), (41, 68),
            (40, 68), (39, 67), (38, 67), (37, 66), (36, 66),
            (35, 65), (34, 65), (33, 64), (32, 64), (31, 63),
            (30, 63), (29, 62), (28, 62), (27, 61), (26, 61),
            (25, 60), (24, 60), (23, 60), (22, 60), (21, 60),
            (20, 60), (19, 60), (18, 60), (17, 60), (16, 60),
            (15, 60), (14, 60), (13, 60), (12, 60), (11, 60),
            (10, 60), (9, 60), (8, 60), (7, 60), (6, 60),
            (5, 60), (4, 60), (3, 60), (2, 60), (1, 60),
            (0, 60)
        ]
        
        raw_score = max(0, min(100, float(raw_score)))
        for raw, transmuted in transmutation_table:
            if raw_score >= raw:
                return transmuted
        return 60
    
    def compute_remarks(self):
        """Compute automatic remarks based on transmuted score"""
        if self.transmuted_score is None:
            self.computed_remarks = "No Grade"
        elif self.transmuted_score >= 90:
            self.computed_remarks = "Outstanding"
        elif self.transmuted_score >= 85:
            self.computed_remarks = "Very Satisfactory"
        elif self.transmuted_score >= 80:
            self.computed_remarks = "Satisfactory"
        elif self.transmuted_score >= 75:
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
    """Reusable time slot definition (e.g. 7:00 AM – 8:00 AM)."""
    DAY_CHOICES = [
        ('monday', 'Monday'),
        ('tuesday', 'Tuesday'),
        ('wednesday', 'Wednesday'),
        ('thursday', 'Thursday'),
        ('friday', 'Friday'),
        ('saturday', 'Saturday'),
    ]

    day = models.CharField(max_length=10, choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    label = models.CharField(max_length=50, blank=True, null=True, help_text="Optional label, e.g. '1st Period'")

    class Meta:
        ordering = ['day', 'start_time']
        unique_together = ['day', 'start_time', 'end_time']

    def __str__(self):
        return f"{self.get_day_display()} {self.start_time.strftime('%I:%M %p')} – {self.end_time.strftime('%I:%M %p')}"


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
        """Calculate general average and statistics"""
        grades = Grade.objects.filter(
            student=self.student,
            classroom=self.classroom,
            quarter=self.quarter,
            grade_type='final_grade'
        )
        
        if grades.exists():
            total = sum(g.transmuted_score for g in grades if g.transmuted_score)
            count = grades.count()
            self.general_average = round(total / count, 2) if count > 0 else None
            self.total_subjects = count
            self.passed_subjects = sum(1 for g in grades if g.transmuted_score and g.transmuted_score >= 75)
            self.failed_subjects = count - self.passed_subjects
        else:
            self.general_average = None
            self.total_subjects = 0
            self.passed_subjects = 0
            self.failed_subjects = 0
        
        self.save()
