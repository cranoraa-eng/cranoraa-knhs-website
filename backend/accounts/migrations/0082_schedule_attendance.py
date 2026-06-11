# Generated manually

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0081_add_performance_indexes'),
    ]

    operations = [
        migrations.AddField(
            model_name='attendance',
            name='schedule',
            field=models.ForeignKey(
                blank=True,
                help_text='Links attendance to a specific schedule period. Null = class-level (adviser) attendance.',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='attendances',
                to='accounts.schedule',
            ),
        ),
        migrations.AddField(
            model_name='attendance',
            name='subject',
            field=models.ForeignKey(
                blank=True,
                help_text='Denormalized from schedule for quick queries.',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='attendances',
                to='accounts.subject',
            ),
        ),
        migrations.AddField(
            model_name='attendance',
            name='time_slot',
            field=models.ForeignKey(
                blank=True,
                help_text='Denormalized from schedule for quick queries.',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='attendances',
                to='accounts.timeslot',
            ),
        ),
        migrations.AlterUniqueTogether(
            name='attendance',
            unique_together=set(),
        ),
        migrations.AddConstraint(
            model_name='attendance',
            constraint=models.UniqueConstraint(
                condition=models.Q(schedule__isnull=True),
                fields=['student', 'classroom', 'date'],
                name='unique_class_level_attendance',
            ),
        ),
        migrations.AddConstraint(
            model_name='attendance',
            constraint=models.UniqueConstraint(
                condition=models.Q(schedule__isnull=False),
                fields=['student', 'schedule', 'date'],
                name='unique_schedule_attendance',
            ),
        ),
    ]
