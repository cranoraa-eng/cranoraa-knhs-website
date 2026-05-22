from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings
from django.db.models import Count

def fix_duplicate_teachers(apps, schema_editor):
    Classroom = apps.get_model('accounts', 'Classroom')
    
    # Find teachers who are assigned to multiple classrooms
    duplicates = (
        Classroom.objects.values('teacher')
        .annotate(teacher_count=Count('teacher'))
        .filter(teacher_count__gt=1)
    )
    
    for entry in duplicates:
        teacher_id = entry['teacher']
        if teacher_id is None:
            continue
            
        # Get all classrooms for this teacher, ordered by ID
        classrooms = Classroom.objects.filter(teacher_id=teacher_id).order_by('id')
        
        # Keep the first one, clear the rest
        for classroom in classrooms[1:]:
            classroom.teacher = None
            classroom.save()

class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0056_set_db_cascade_on_user_relations'),
    ]

    operations = [
        migrations.RunPython(fix_duplicate_teachers, reverse_code=migrations.RunPython.noop),
        migrations.AlterField(
            model_name='classroom',
            name='teacher',
            field=models.OneToOneField(
                blank=True, 
                help_text='The advisory teacher for this classroom. Each teacher can only have one advisory classroom.', 
                limit_choices_to={'role': 'teacher'}, 
                null=True, 
                on_delete=django.db.models.deletion.SET_NULL, 
                related_name='teaching_classroom', 
                to=settings.AUTH_USER_MODEL
            ),
        ),
    ]
