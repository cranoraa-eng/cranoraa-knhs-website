from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0073_nullable_parent_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='classroom',
            name='capacity',
            field=models.PositiveIntegerField(default=40, help_text='Maximum number of students allowed in this classroom'),
        ),
    ]
