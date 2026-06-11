from django.db import migrations

def populate_classroom_grade_levels(apps, schema_editor):
    Classroom = apps.get_model('accounts', 'Classroom')
    StudentClassEnrollment = apps.get_model('accounts', 'StudentClassEnrollment')
    
    for classroom in Classroom.objects.all():
        # Try to get grade level from first enrolled student
        first_enrollment = StudentClassEnrollment.objects.filter(classroom=classroom).first()
        if first_enrollment and hasattr(first_enrollment.student, 'profile') and first_enrollment.student.profile.grade_level:
            classroom.grade_level = first_enrollment.student.profile.grade_level
            classroom.save()
        else:
            # Fallback: try to infer from classroom name (e.g. "Grade 7 - Diamond")
            import re
            match = re.search(r'Grade\s+(\d+)', classroom.name, re.IGNORECASE)
            if match:
                classroom.grade_level = f"Grade {match.group(1)}"
                classroom.save()

class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0058_classroom_grade_level'),
    ]

    operations = [
        migrations.RunPython(populate_classroom_grade_levels, reverse_code=migrations.RunPython.noop),
    ]
