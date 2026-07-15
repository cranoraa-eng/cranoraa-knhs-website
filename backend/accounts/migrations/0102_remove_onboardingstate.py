from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0101_add_check_constraints'),
    ]

    operations = [
        migrations.DeleteModel(
            name='OnboardingState',
        ),
    ]
