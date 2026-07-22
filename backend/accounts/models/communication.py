from django.db import models

from .user import User
from .academic import Classroom


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

    teacher = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='ptm_as_teacher')
    parent = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='ptm_as_parent')
    student = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='ptm_meetings')
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

    student = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='behavioral_records')
    classroom = models.ForeignKey('Classroom', on_delete=models.SET_NULL, null=True, blank=True, related_name='behavioral_records')
    recorded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='behavioral_records_created')

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
