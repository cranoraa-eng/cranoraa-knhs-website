import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0074_classroom_capacity'),
    ]

    operations = [
        migrations.AddField(
            model_name='enrollmentapplication',
            name='school_year',
            field=models.CharField(blank=True, help_text='School year applying for (e.g., 2026-2027)', max_length=20, null=True),
        ),
        migrations.AddField(
            model_name='enrollmentapplication',
            name='father_email',
            field=models.EmailField(blank=True, max_length=254, null=True),
        ),
        migrations.AddField(
            model_name='enrollmentapplication',
            name='mother_email',
            field=models.EmailField(blank=True, max_length=254, null=True),
        ),
        migrations.AddField(
            model_name='enrollmentapplication',
            name='guardian_email',
            field=models.EmailField(blank=True, max_length=254, null=True),
        ),
        migrations.AddField(
            model_name='enrollmentapplication',
            name='id_picture',
            field=models.URLField(blank=True, help_text='Student ID Picture', max_length=1000, null=True),
        ),
        migrations.AddField(
            model_name='enrollmentapplication',
            name='linked_parent',
            field=models.ForeignKey(blank=True, help_text='Parent account linked during enrollment', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='child_enrollment_applications', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='enrollmentapplication',
            name='reviewed_by',
            field=models.ForeignKey(blank=True, help_text='Admin who last reviewed this application', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reviewed_applications', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='enrollmentapplication',
            name='reviewed_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddIndex(
            model_name='enrollmentapplication',
            index=models.Index(fields=['school_year'], name='accounts_enr_school__idx'),
        ),
        migrations.CreateModel(
            name='ParentLink',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('relationship', models.CharField(default='parent', help_text='Relationship to student (parent, guardian, etc.)', max_length=50)),
                ('is_primary', models.BooleanField(default=False, help_text='Primary contact parent')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('application', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='parent_links', to='accounts.enrollmentapplication')),
                ('parent', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='parent_links', to=settings.AUTH_USER_MODEL)),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='student_parent_links', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
                'unique_together': {('parent', 'student')},
            },
        ),
    ]
