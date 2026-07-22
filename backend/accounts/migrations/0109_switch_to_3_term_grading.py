"""
Migration: Switch from 4-quarter to 3-term grading system.

Updates display choices only — no data migration needed since the
quarter IntegerField stores raw integers (1, 2, 3, 4) and legacy
quarter=4 data is preserved as 'Term 4 (Legacy)'.
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0108_expand_staff_title_choices'),
    ]

    operations = [
        migrations.AlterField(
            model_name='grade',
            name='quarter',
            field=models.IntegerField(
                choices=[
                    (1, 'Term 1'),
                    (2, 'Term 2'),
                    (3, 'Term 3'),
                    (4, 'Term 4 (Legacy)'),
                ],
            ),
        ),
        migrations.AlterField(
            model_name='gradereport',
            name='quarter',
            field=models.IntegerField(
                choices=[
                    (1, 'Term 1'),
                    (2, 'Term 2'),
                    (3, 'Term 3'),
                    (4, 'Term 4 (Legacy)'),
                ],
            ),
        ),
        migrations.AlterField(
            model_name='systemsetting',
            name='current_quarter',
            field=models.CharField(
                choices=[
                    ('1', 'Term 1'),
                    ('2', 'Term 2'),
                    ('3', 'Term 3'),
                    ('4', 'Term 4 (Legacy)'),
                ],
                default='1',
                max_length=1,
            ),
        ),
        migrations.AlterField(
            model_name='learningmaterial',
            name='quarter',
            field=models.IntegerField(
                blank=True,
                help_text='Term (1-3)',
                null=True,
            ),
        ),
    ]
