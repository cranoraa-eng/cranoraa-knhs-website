from django.db import migrations, models
import django.contrib.auth.models
import django.contrib.auth.validators
import django.db.migrations.operations.special
import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
import re


def convert_empty_emails_to_null(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    User.objects.filter(email='').update(email=None)


def set_cascade_on_postgres(apps, schema_editor):
    if schema_editor.connection.vendor == 'postgresql':
        schema_editor.execute('''
            ALTER TABLE accounts_profile 
            DROP CONSTRAINT IF EXISTS accounts_profile_user_id_49a85d32_fk_accounts_user_id;
        ''')
        schema_editor.execute('''
            ALTER TABLE accounts_profile 
            ADD CONSTRAINT accounts_profile_user_id_49a85d32_fk_accounts_user_id 
            FOREIGN KEY (user_id) REFERENCES accounts_user(id) ON DELETE CASCADE;
        ''')


def reverse_cascade_on_postgres(apps, schema_editor):
    if schema_editor.connection.vendor == 'postgresql':
        schema_editor.execute('''
            ALTER TABLE accounts_profile 
            DROP CONSTRAINT IF EXISTS accounts_profile_user_id_49a85d32_fk_accounts_user_id;
        ''')
        schema_editor.execute('''
            ALTER TABLE accounts_profile 
            ADD CONSTRAINT accounts_profile_user_id_49a85d32_fk_accounts_user_id 
            FOREIGN KEY (user_id) REFERENCES accounts_user(id) ON DELETE NO ACTION;
        ''')


def fix_duplicate_teachers(apps, schema_editor):
    Classroom = apps.get_model('accounts', 'Classroom')
    
    duplicates = (
        Classroom.objects.values('teacher')
        .annotate(teacher_count=models.Count('teacher'))
        .filter(teacher_count__gt=1)
    )
    
    for entry in duplicates:
        teacher_id = entry['teacher']
        if teacher_id is None:
            continue
            
        classrooms = Classroom.objects.filter(teacher_id=teacher_id).order_by('id')
        
        for classroom in classrooms[1:]:
            classroom.teacher = None
            classroom.save()


def populate_classroom_grade_levels(apps, schema_editor):
    Classroom = apps.get_model('accounts', 'Classroom')
    StudentClassEnrollment = apps.get_model('accounts', 'StudentClassEnrollment')
    
    for classroom in Classroom.objects.all():
        first_enrollment = StudentClassEnrollment.objects.filter(classroom=classroom).first()
        if first_enrollment and hasattr(first_enrollment.student, 'profile') and first_enrollment.student.profile.grade_level:
            classroom.grade_level = first_enrollment.student.profile.grade_level
            classroom.save()
        else:
            match = re.search(r'Grade\s+(\d+)', classroom.name, re.IGNORECASE)
            if match:
                classroom.grade_level = f"Grade {match.group(1)}"
                classroom.save()


def fix_empty_emails(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    User.objects.filter(email='').update(email=None)


def reverse_fix(apps, schema_editor):
    pass


def convert_teacher_roles(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    User.objects.filter(role='teacher').update(role='staff', staff_title='teacher')


def reverse_convert(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    User.objects.filter(role='staff', staff_title='teacher').update(role='teacher', staff_title=None)


class Migration(migrations.Migration):

    replaces = [
        ('accounts', '0001_initial'),
        ('accounts', '0002_classroom_studentclassenrollment'),
        ('accounts', '0003_studentclassenrollment_q1_studentclassenrollment_q2_and_more'),
        ('accounts', '0004_alter_studentclassenrollment_q1_and_more'),
        ('accounts', '0005_announcement'),
        ('accounts', '0006_announcement_attachment'),
        ('accounts', '0007_attendance'),
        ('accounts', '0008_learningmaterial'),
        ('accounts', '0009_anecdotalrecord'),
        ('accounts', '0010_corevaluesgrade'),
        ('accounts', '0011_parentcommunication'),
        ('accounts', '0012_subject_profile_registration_number_scratchcard_fee'),
        ('accounts', '0013_profile_contact_information_profile_father_name_and_more'),
        ('accounts', '0014_notification'),
        ('accounts', '0015_enrollmentapplication'),
        ('accounts', '0016_websitecontent'),
        ('accounts', '0017_alter_websitecontent_section_key'),
        ('accounts', '0018_enrollmentapplication_birth_certificate_and_more'),
        ('accounts', '0019_alter_websitecontent_section_key'),
        ('accounts', '0020_alter_websitecontent_options_and_more'),
        ('accounts', '0021_announcement_is_public'),
        ('accounts', '0022_announcement_expiration_date_announcement_priority_and_more'),
        ('accounts', '0023_announcement_read_by_and_more'),
        ('accounts', '0024_user_is_approved_user_is_verified_otp'),
        ('accounts', '0025_gradereport_grade'),
        ('accounts', '0026_classroomsubject'),
        ('accounts', '0027_remove_subject_units'),
        ('accounts', '0028_add_grade_weights_to_classroomsubject'),
        ('accounts', '0029_add_middle_name_to_profile'),
        ('accounts', '0030_announcementattachment'),
        ('accounts', '0031_alter_grade_options_alter_grade_unique_together_and_more'),
        ('accounts', '0032_profile_title'),
        ('accounts', '0033_alter_corevaluesgrade_unique_together_and_more'),
        ('accounts', '0034_user_last_activity'),
        ('accounts', '0035_chatroom_chatmessage'),
        ('accounts', '0036_friendship'),
        ('accounts', '0037_chatmessage_is_pinned_chatroom_pinned_by_and_more'),
        ('accounts', '0038_add_is_delivered_to_chatmessage'),
        ('accounts', '0039_add_is_edit... (truncated)')
    ]

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
        ('portal', '0006_academicyear_is_archived_alter_auditlog_action_type_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='User',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('is_superuser', models.BooleanField(default=False, help_text='Designates that this user has all permissions without explicitly assigning them.', verbose_name='superuser status')),
                ('username', models.CharField(error_messages={'unique': 'A user with that username already exists.'}, help_text='Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.', max_length=150, unique=True, validators=[django.contrib.auth.validators.UnicodeUsernameValidator()], verbose_name='username')),
                ('first_name', models.CharField(blank=True, max_length=150, verbose_name='first name')),
                ('last_name', models.CharField(blank=True, max_length=150, verbose_name='last name')),
                ('is_staff', models.BooleanField(default=False, help_text='Designates whether the user can log into this admin site.', verbose_name='staff status')),
                ('is_active', models.BooleanField(default=True, help_text='Designates whether the user should be treated as active. Unselect this instead of deleting accounts.', verbose_name='active')),
                ('date_joined', models.DateTimeField(default=django.utils.timezone.now, verbose_name='date joined')),
                ('email', models.EmailField(blank=True, max_length=254, null=True, unique=True)),
                ('role', models.CharField(choices=[('admin', 'Admin'), ('teacher', 'Teacher'), ('student', 'Student'), ('parent', 'Parent')], default='student', max_length=10)),
                ('groups', models.ManyToManyField(blank=True, help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.', related_name='user_set', related_query_name='user', to='auth.group', verbose_name='groups')),
                ('user_permissions', models.ManyToManyField(blank=True, help_text='Specific permissions for this user.', related_name='user_set', related_query_name='user', to='auth.permission', verbose_name='user permissions')),
                ('is_approved', models.BooleanField(default=False)),
                ('is_verified', models.BooleanField(default=False)),
                ('last_activity', models.DateTimeField(blank=True, null=True)),
                ('account_status', models.CharField(choices=[('active', 'Active'), ('inactive', 'Inactive'), ('suspended', 'Suspended'), ('pending_reset', 'Pending Password Reset')], default='active', max_length=20)),
                ('must_change_password', models.BooleanField(default=False)),
            ],
            options={
                'verbose_name': 'user',
                'verbose_name_plural': 'users',
                'abstract': False,
            },
            managers=[
                ('objects', django.contrib.auth.models.UserManager()),
            ],
        ),
        migrations.RunPython(
            code=convert_empty_emails_to_null,
        ),
        migrations.CreateModel(
            name='Classroom',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('teacher', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='teaching_classrooms', to=settings.AUTH_USER_MODEL)),
                ('academic_year', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='classrooms', to='portal.academicyear')),
                ('description', models.TextField(blank=True, null=True)),
                ('semester', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='classrooms', to='portal.semester')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
