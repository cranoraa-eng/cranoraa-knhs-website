"""
Migration: expand staff_title field to include DepEd teaching ranks.

Changes:
- max_length: 20 → 30 (to fit 'special_science_teacher_i')
- choices: updated to include Teacher I–VI, Master Teacher I–II,
  Special Science Teacher I, ALS Teacher, Administrative Officer I, etc.
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0107_drop_orphaned_friendship_table'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='staff_title',
            field=models.CharField(
                blank=True,
                choices=[
                    ('teacher_i',                 'Teacher I'),
                    ('teacher_ii',                'Teacher II'),
                    ('teacher_iii',               'Teacher III'),
                    ('teacher_iv',                'Teacher IV'),
                    ('teacher_v',                 'Teacher V'),
                    ('teacher_vi',                'Teacher VI'),
                    ('master_teacher_i',          'Master Teacher I'),
                    ('master_teacher_ii',         'Master Teacher II'),
                    ('special_science_teacher_i', 'Special Science Teacher I'),
                    ('als_teacher',               'ALS Teacher'),
                    ('principal',                 'School Principal I'),
                    ('guidance_counselor',        'Guidance Counselor'),
                    ('administrative_officer',    'Administrative Officer I'),
                    ('admin_assistant',           'Administrative Assistant'),
                    ('registrar',                 'Registrar'),
                    ('librarian',                 'Librarian'),
                    ('it_staff',                  'IT Staff'),
                    ('cashier',                   'Cashier'),
                    ('teacher',                   'Teacher'),
                    ('advisory',                  'Advisory'),
                    ('other',                     'Other'),
                ],
                db_index=True,
                max_length=30,
                null=True,
            ),
        ),
    ]
