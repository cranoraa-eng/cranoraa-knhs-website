from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0043_websitecontent_image_alter_websitecontent_content'),
    ]

    operations = [
        migrations.CreateModel(
            name='SystemSetting',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('site_name', models.CharField(default='School Portal', max_length=255)),
                ('maintenance_mode', models.BooleanField(default=False)),
                ('maintenance_message', models.TextField(default='The portal is currently undergoing maintenance. Please check back later.')),
                ('current_quarter', models.CharField(choices=[('1', '1st'), ('2', '2nd'), ('3', '3rd'), ('4', '4th')], default='1', max_length=1)),
                ('academic_year', models.CharField(default='2025-2026', max_length=9)),
                ('enrollment_open', models.BooleanField(default=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
        ),
    ]
