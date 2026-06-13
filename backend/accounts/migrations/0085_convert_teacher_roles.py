from django.db import migrations


def convert_teacher_roles(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    # Convert all users with role='teacher' to role='staff' + staff_title='teacher'
    User.objects.filter(role='teacher').update(role='staff', staff_title='teacher')


def reverse_convert(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    User.objects.filter(role='staff', staff_title='teacher').update(role='teacher', staff_title=None)


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0084_user_staff_title_alter_onboardingstate_role_and_more'),
    ]

    operations = [
        migrations.RunPython(convert_teacher_roles, reverse_convert),
    ]
