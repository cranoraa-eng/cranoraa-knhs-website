# Generated manually for Phase 8: Admin Enhancements
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0098_messaging_enhancements'),
    ]

    operations = [
        # Department
        migrations.CreateModel(
            name='Department',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
                ('code', models.CharField(max_length=20, unique=True)),
                ('description', models.TextField(blank=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('head', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='headed_departments', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['name'],
            },
        ),
        # StaffPerformance
        migrations.CreateModel(
            name='StaffPerformance',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('academic_year', models.CharField(max_length=20)),
                ('teaching_quality', models.PositiveSmallIntegerField(choices=[(1, 'Needs Improvement'), (2, 'Below Expectations'), (3, 'Meets Expectations'), (4, 'Exceeds Expectations'), (5, 'Outstanding')], default=3)),
                ('student_engagement', models.PositiveSmallIntegerField(choices=[(1, 'Needs Improvement'), (2, 'Below Expectations'), (3, 'Meets Expectations'), (4, 'Exceeds Expectations'), (5, 'Outstanding')], default=3)),
                ('classroom_management', models.PositiveSmallIntegerField(choices=[(1, 'Needs Improvement'), (2, 'Below Expectations'), (3, 'Meets Expectations'), (4, 'Exceeds Expectations'), (5, 'Outstanding')], default=3)),
                ('lesson_planning', models.PositiveSmallIntegerField(choices=[(1, 'Needs Improvement'), (2, 'Below Expectations'), (3, 'Meets Expectations'), (4, 'Exceeds Expectations'), (5, 'Outstanding')], default=3)),
                ('professional_development', models.PositiveSmallIntegerField(choices=[(1, 'Needs Improvement'), (2, 'Below Expectations'), (3, 'Meets Expectations'), (4, 'Exceeds Expectations'), (5, 'Outstanding')], default=3)),
                ('average_student_grade', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('attendance_rate', models.DecimalField(blank=True, decimal_places=2, help_text='Teacher attendance rate (%)', max_digits=5, null=True)),
                ('students_passed_pct', models.DecimalField(blank=True, decimal_places=2, help_text='% of students who passed', max_digits=5, null=True)),
                ('comments', models.TextField(blank=True)),
                ('overall_rating', models.DecimalField(blank=True, decimal_places=2, max_digits=3, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('staff', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='performance_records', to=settings.AUTH_USER_MODEL)),
                ('evaluated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='evaluations_given', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-academic_year'],
                'unique_together': {('staff', 'academic_year')},
            },
        ),
    ]
