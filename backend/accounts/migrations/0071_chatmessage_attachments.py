from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0070_announcementcomment'),
    ]

    operations = [
        migrations.AddField(
            model_name='chatmessage',
            name='attachment_url',
            field=models.URLField(blank=True, help_text='Supabase Storage URL', max_length=1000, null=True),
        ),
        migrations.AddField(
            model_name='chatmessage',
            name='attachment_filename',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='chatmessage',
            name='attachment_content_type',
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name='chatmessage',
            name='file_size_bytes',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='chatmessage',
            name='message_type',
            field=models.CharField(
                choices=[('text', 'Text'), ('image', 'Image'), ('file', 'File')],
                default='text',
                max_length=10,
            ),
        ),
        migrations.AlterField(
            model_name='chatmessage',
            name='content',
            field=models.TextField(blank=True),
        ),
    ]
