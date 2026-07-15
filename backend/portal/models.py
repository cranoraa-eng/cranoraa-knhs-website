from django.db import models
from django.utils.deprecation import RemovedInDjango60Warning
from accounts.models import User


class Announcement(models.Model):
    """
    DEPRECATED: This model is deprecated. Use accounts.models.Announcement instead.

    The accounts.models.Announcement model provides enhanced features including:
    - Categories, priorities, and statuses
    - Target audience targeting (all, students, teachers, etc.)
    - Pinning and expiration dates
    - Attachments and comments
    - Read receipts

    Migrate existing data from portal.Announcement to accounts.Announcement.

    @deprecated Use accounts.models.Announcement instead
    """
    title = models.CharField(max_length=200)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='announcements', null=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Announcement (Deprecated)'
        verbose_name_plural = 'Announcements (Deprecated)'

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        import warnings
        warnings.warn(
            'portal.Announcement is deprecated. Use accounts.models.Announcement instead.',
            RemovedInDjango60Warning,
            stacklevel=2
        )
        super().save(*args, **kwargs)


class SchoolClass(models.Model):
    """
    DEPRECATED: This model is deprecated. Use accounts.models.Classroom instead.

    The accounts.models.Classroom model provides enhanced features including:
    - More detailed classroom information
    - Link to ClassroomSubject junction table
    - Grade level and section management
    - Capacity tracking

    Migrate existing data from portal.SchoolClass to accounts.Classroom.

    @deprecated Use accounts.models.Classroom instead
    """
    name = models.CharField(max_length=200)
    grade_level = models.CharField(max_length=50)
    section = models.CharField(max_length=50)
    adviser = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='advised_classes')
    capacity = models.IntegerField(default=40)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['grade_level', 'section']
        verbose_name = 'Class (Deprecated)'
        verbose_name_plural = 'Classes (Deprecated)'

    def __str__(self):
        return f"{self.grade_level} - {self.section}"

    def save(self, *args, **kwargs):
        import warnings
        warnings.warn(
            'portal.SchoolClass is deprecated. Use accounts.models.Classroom instead.',
            RemovedInDjango60Warning,
            stacklevel=2
        )
        super().save(*args, **kwargs)

    @property
    def student_count(self):
        import warnings
        warnings.warn(
            'portal.SchoolClass.student_count is deprecated. Use accounts.models.Classroom.enrollments.count() instead.',
            RemovedInDjango60Warning,
            stacklevel=2
        )
        return self.students.count()


class Department(models.Model):
    """
    DEPRECATED: This model is deprecated. Use accounts.models.Department instead.

    The accounts.models.Department model provides enhanced features including:
    - Same functionality but in accounts namespace for consistency
    - Better integration with user management

    Migrate existing data from portal.Department to accounts.Department.

    @deprecated Use accounts.models.Department instead
    """
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, unique=True)
    head = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='headed_departments')
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Department (Deprecated)'
        verbose_name_plural = 'Departments (Deprecated)'

    def __str__(self):
        return f"{self.code} - {self.name}"

    def save(self, *args, **kwargs):
        import warnings
        warnings.warn(
            'portal.Department is deprecated. Use accounts.models.Department instead.',
            RemovedInDjango60Warning,
            stacklevel=2
        )
        super().save(*args, **kwargs)


class AcademicYear(models.Model):
    """
    DEPRECATED: This model is deprecated. Use accounts.models.AcademicYear instead.

    The accounts.models.AcademicYear model provides enhanced features including:
    - Same functionality but in accounts namespace for consistency
    - Better integration with academic calendar management

    Migrate existing data from portal.AcademicYear to accounts.AcademicYear.

    @deprecated Use accounts.models.AcademicYear instead
    """
    name = models.CharField(max_length=50)  # e.g., "2025-2026"
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_date']
        verbose_name = 'Academic Year (Deprecated)'
        verbose_name_plural = 'Academic Years (Deprecated)'

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        import warnings
        warnings.warn(
            'portal.AcademicYear is deprecated. Use accounts.models.AcademicYear instead.',
            RemovedInDjango60Warning,
            stacklevel=2
        )
        if self.is_active:
            AcademicYear.objects.filter(is_active=True).update(is_active=False)
        super().save(*args, **kwargs)

class Semester(models.Model):
    """
    DEPRECATED: This model is deprecated. Use accounts.models.Semester instead.

    The accounts.models.Semester model provides enhanced features including:
    - Same functionality but in accounts namespace for consistency
    - Better integration with academic calendar management

    Migrate existing data from portal.Semester to accounts.Semester.

    @deprecated Use accounts.models.Semester instead
    """
    SEMESTER_CHOICES = [
        ('1st', 'First Semester'),
        ('2nd', 'Second Semester'),
        ('summer', 'Summer'),
        ('1st Quarter', 'First Quarter'),
        ('2nd Quarter', 'Second Quarter'),
        ('3rd Quarter', 'Third Quarter'),
        ('4th Quarter', 'Fourth Quarter'),
        ('1st Term', 'First Term'),
        ('2nd Term', 'Second Term'),
        ('3rd Term', 'Third Term'),
    ]
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='semesters')
    name = models.CharField(max_length=100, blank=True, help_text="Display name (e.g. '1st Quarter')")
    semester_type = models.CharField(max_length=20, choices=SEMESTER_CHOICES)
    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['academic_year', 'semester_type']
        ordering = ['-academic_year__start_date', 'semester_type']
        verbose_name = 'Semester (Deprecated)'
        verbose_name_plural = 'Semesters (Deprecated)'

    def __str__(self):
        return f"{self.academic_year.name} - {self.get_semester_type_display()}"

    def save(self, *args, **kwargs):
        import warnings
        warnings.warn(
            'portal.Semester is deprecated. Use accounts.models.Semester instead.',
            RemovedInDjango60Warning,
            stacklevel=2
        )
        if self.is_active:
            Semester.objects.filter(is_active=True).update(is_active=False)
        super().save(*args, **kwargs)


class AuditLog(models.Model):
    """
    DEPRECATED: This model is deprecated. Use accounts.models.AuditLog instead.

    The accounts.models.AuditLog model provides enhanced features including:
    - Same functionality but in accounts namespace for consistency
    - Better integration with user management

    Migrate existing data from portal.AuditLog to accounts.AuditLog.

    @deprecated Use accounts.models.AuditLog instead
    """
    ACTION_TYPES = [
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('approve', 'Approve'),
        ('reject', 'Reject'),
        ('view', 'View'),
        ('export', 'Export'),
        ('import', 'Import'),
        ('grade_create', 'Grade Create'),
        ('grade_update', 'Grade Update'),
        ('grade_delete', 'Grade Delete'),
        ('attendance_mark', 'Attendance Mark'),
        ('attendance_delete', 'Attendance Delete'),
        ('mute', 'User Mute'),
        ('suspend', 'User Suspend'),
    ]

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='portal_audit_logs')
    action = models.CharField(max_length=50)
    action_type = models.CharField(max_length=20, choices=ACTION_TYPES, blank=True, null=True)
    model_name = models.CharField(max_length=100, blank=True, null=True, help_text="Name of the model affected")
    object_id = models.PositiveIntegerField(null=True, blank=True, help_text="ID of the object affected")
    object_repr = models.CharField(max_length=255, blank=True, help_text="String representation of the object")
    description = models.TextField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Audit Log (Deprecated)'
        verbose_name_plural = 'Audit Logs (Deprecated)'
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['action', 'timestamp']),
            models.Index(fields=['model_name', 'timestamp']),
        ]

    def __str__(self):
        return f"{self.user} - {self.action} at {self.timestamp}"

    def save(self, *args, **kwargs):
        import warnings
        warnings.warn(
            'portal.AuditLog is deprecated. Use accounts.models.AuditLog instead.',
            RemovedInDjango60Warning,
            stacklevel=2
        )
        super().save(*args, **kwargs)


class DatabaseBackup(models.Model):
    """
    DEPRECATED: This model is deprecated. Use accounts.models.DatabaseBackup instead.

    The accounts.models.DatabaseBackup model provides enhanced features including:
    - Same functionality but in accounts namespace for consistency
    - Better integration with user management

    Migrate existing data from portal.DatabaseBackup to accounts.DatabaseBackup.

    @deprecated Use accounts.models.DatabaseBackup instead
    """
    filename = models.CharField(max_length=255)
    size = models.CharField(max_length=50)  # e.g., "2.5 MB"
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='portal_created_backups')

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Database Backup (Deprecated)'
        verbose_name_plural = 'Database Backups (Deprecated)'

    def __str__(self):
        return self.filename

    def save(self, *args, **kwargs):
        import warnings
        warnings.warn(
            'portal.DatabaseBackup is deprecated. Use accounts.models.DatabaseBackup instead.',
            RemovedInDjango60Warning,
            stacklevel=2
        )
        super().save(*args, **kwargs)


class APIRequestLog(models.Model):
    """
    DEPRECATED: This model is deprecated. Use accounts.models.APIRequestLog instead.

    The accounts.models.APIRequestLog model provides enhanced features including:
    - Same functionality but in accounts namespace for consistency
    - Better integration with user management and analytics

    Migrate existing data from portal.APIRequestLog to accounts.APIRequestLog.

    @deprecated Use accounts.models.APIRequestLog instead
    """
    """Track API requests for analytics"""
    endpoint = models.CharField(max_length=255)
    method = models.CharField(max_length=10)  # GET, POST, etc.
    status_code = models.IntegerField()
    response_time_ms = models.FloatField(help_text="Response time in milliseconds")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='portal_api_requests')
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'API Request Log (Deprecated)'
        verbose_name_plural = 'API Request Logs (Deprecated)'
        indexes = [
            models.Index(fields=['timestamp']),
            models.Index(fields=['endpoint', 'timestamp']),
            models.Index(fields=['user', 'timestamp']),
        ]

    def __str__(self):
        return f"{self.method} {self.endpoint} [{self.status_code}]"

    def save(self, *args, **kwargs):
        import warnings
        warnings.warn(
            'portal.APIRequestLog is deprecated. Use accounts.models.APIRequestLog instead.',
            RemovedInDjango60Warning,
            stacklevel=2
        )
        super().save(*args, **kwargs)
        return f"{self.method} {self.endpoint} - {self.status_code}"