from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0086_user_additional_roles'),
    ]

    operations = [
        # Soft delete field
        migrations.AddField(
            model_name='ticket',
            name='deleted_at',
            field=models.DateTimeField(blank=True, db_index=True, null=True),
        ),
        # SLA fields
        migrations.AddField(
            model_name='ticket',
            name='first_response_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        # Performance indexes
        migrations.AddIndex(
            model_name='ticket',
            index=models.Index(
                fields=['status', 'category', 'assigned_to'],
                name='ticket_status_cat_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='ticket',
            index=models.Index(
                fields=['created_by', 'status'],
                name='ticket_creator_status_idx',
            ),
        ),
    ]
