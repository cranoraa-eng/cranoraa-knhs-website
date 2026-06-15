# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0092_add_notificationpreference'),
    ]

    operations = [
        # Assignment new fields
        migrations.AddField(
            model_name='assignment',
            name='assignment_type',
            field=models.CharField(
                choices=[
                    ('homework', 'Homework'),
                    ('quiz', 'Quiz'),
                    ('exam', 'Exam'),
                    ('project', 'Project'),
                    ('performance_task', 'Performance Task'),
                    ('laboratory', 'Laboratory'),
                    ('activity', 'Activity'),
                    ('other', 'Other'),
                ],
                default='homework',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='assignment',
            name='percentage_weight',
            field=models.DecimalField(
                decimal_places=2,
                default=0,
                help_text='Weight of this assignment in the grade component (0 = use all equally)',
                max_digits=5,
            ),
        ),
        migrations.AddField(
            model_name='assignment',
            name='is_published',
            field=models.BooleanField(default=True, help_text='Draft assignments are hidden from students'),
        ),
        migrations.AddField(
            model_name='assignment',
            name='publish_at',
            field=models.DateTimeField(blank=True, help_text='Schedule future publication', null=True),
        ),
        migrations.AddField(
            model_name='assignment',
            name='allow_late_submissions',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='assignment',
            name='max_late_submissions',
            field=models.IntegerField(default=0, help_text='0 = unlimited, N = max N late submissions allowed per student'),
        ),
        migrations.AddField(
            model_name='assignment',
            name='grade_component',
            field=models.CharField(
                blank=True,
                choices=[
                    ('', 'Not linked'),
                    ('written_work', 'Written Work'),
                    ('performance_task', 'Performance Task'),
                    ('quarterly_assessment', 'Quarterly Assessment'),
                ],
                default='',
                help_text='Link this assignment to a grade component for auto-grade propagation',
                max_length=30,
            ),
        ),
        migrations.AddField(
            model_name='assignment',
            name='is_template',
            field=models.BooleanField(default=False, help_text='Template assignments are reusable'),
        ),
        migrations.AddField(
            model_name='assignment',
            name='template_name',
            field=models.CharField(blank=True, max_length=200),
        ),
        # Submission new fields
        migrations.AddField(
            model_name='submission',
            name='graded_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='submission',
            name='graded_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.SET_NULL,
                related_name='graded_submissions',
                to='accounts.user',
            ),
        ),
    ]
