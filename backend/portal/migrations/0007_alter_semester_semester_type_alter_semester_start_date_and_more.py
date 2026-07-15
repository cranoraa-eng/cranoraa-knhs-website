# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('portal', '0006_academicyear_is_archived_alter_auditlog_action_type_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='semester',
            name='semester_type',
            field=models.CharField(choices=[
                ('1st', 'First Semester'),
                ('2nd', 'Second Semester'),
                ('summer', 'Summer'),
                ('1st Quarter', 'First Quarter'),
                ('2nd Quarter', 'Second Quarter'),
                ('3rd Quarter', 'Third Quarter'),
                ('4th Quarter', 'Fourth Quarter'),
                ('1st Term', 'First Term'),
                ('2nd Term', 'Second Term'),
                ('3rd Term', 'Third Term'),
            ], max_length=20),
        ),
        migrations.AlterField(
            model_name='semester',
            name='start_date',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='semester',
            name='end_date',
            field=models.DateField(blank=True, null=True),
        ),
    ]
