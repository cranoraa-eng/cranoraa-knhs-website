from django.db import models

from .user import User
from .academic import Classroom


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
