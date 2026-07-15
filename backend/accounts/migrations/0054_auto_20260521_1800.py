from django.db import migrations

def convert_empty_emails_to_null(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    User.objects.filter(email='').update(email=None)

class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0053_profile_profile_picture_user_account_status_and_more'),
    ]

    operations = [
        migrations.RunPython(convert_empty_emails_to_null),
    ]
