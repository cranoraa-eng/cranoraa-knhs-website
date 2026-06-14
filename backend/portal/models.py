from django.db import models, transaction
from accounts.models import User


class Announcement(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='announcements', null=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title


class SchoolClass(models.Model):
    name = models.CharField(max_length=200)
    grade_level = models.CharField(max_length=50)
    section = models.CharField(max_length=50)
    adviser = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='advised_classes')
    capacity = models.IntegerField(default=40)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['grade_level', 'section']
        verbose_name = 'Class'
        verbose_name_plural = 'Classes'
    
    def __str__(self):
        return f"{self.grade_level} - {self.section}"
    
    @property
    def student_count(self):
        return self.students.count()


class Department(models.Model):
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, unique=True)
    head = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='headed_departments')
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return f"{self.code} - {self.name}"


class AcademicYear(models.Model):
    name = models.CharField(max_length=50)  # e.g., "2025-2026"
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-start_date']
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if self.is_active:
            with transaction.atomic():
                AcademicYear.objects.filter(is_active=True).update(is_active=False)
                super().save(*args, **kwargs)
        else:
            super().save(*args, **kwargs)

class Semester(models.Model):
    SEMESTER_CHOICES = [
        ('1st', 'First Semester'),
        ('2nd', 'Second Semester'),
        ('summer', 'Summer'),
    ]
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='semesters')
    semester_type = models.CharField(max_length=10, choices=SEMESTER_CHOICES)
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['academic_year', 'semester_type']
        ordering = ['-academic_year__start_date', 'semester_type']
    
    def __str__(self):
        return f"{self.academic_year.name} - {self.get_semester_type_display()}"
    
    def save(self, *args, **kwargs):
        if self.is_active:
            with transaction.atomic():
                Semester.objects.filter(is_active=True).update(is_active=False)
                super().save(*args, **kwargs)
        else:
            super().save(*args, **kwargs)


class AuditLog(models.Model):
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
    
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='audit_logs')
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
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['action', 'timestamp']),
            models.Index(fields=['model_name', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.user} - {self.action} at {self.timestamp}"


class DatabaseBackup(models.Model):
    filename = models.CharField(max_length=255)
    size = models.CharField(max_length=50)  # e.g., "2.5 MB"
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_backups')
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.filename


class APIRequestLog(models.Model):
    """Track API requests for analytics"""
    endpoint = models.CharField(max_length=255)
    method = models.CharField(max_length=10)  # GET, POST, etc.
    status_code = models.IntegerField()
    response_time_ms = models.FloatField(help_text="Response time in milliseconds")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='api_requests')
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['timestamp']),
            models.Index(fields=['endpoint', 'timestamp']),
            models.Index(fields=['user', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.method} {self.endpoint} - {self.status_code}"