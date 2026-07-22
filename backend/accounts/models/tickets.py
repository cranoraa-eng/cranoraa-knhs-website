from django.db import models

from .user import User


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
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='tickets_created')
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
            from django.db import transaction, connection
            with transaction.atomic():
                cursor = connection.cursor()
                cursor.execute(
                    "SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_id FROM 5) AS INTEGER)), 0) + 1 "
                    "FROM accounts_ticket"
                )
                next_num = cursor.fetchone()[0]
                self.ticket_id = f"TKT-{str(next_num).zfill(4)}"
        super().save(*args, **kwargs)


class TicketParticipant(models.Model):
    ROLE_CHOICES = [
        ('viewer', 'Viewer'),
        ('collaborator', 'Collaborator'),
    ]
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='ticket_participations')
    role = models.CharField(max_length=15, choices=ROLE_CHOICES, default='viewer')
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['ticket', 'user']

    def __str__(self):
        return f"{self.user.username} on {self.ticket.ticket_id}"


class TicketMessage(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='ticket_messages')
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
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
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
