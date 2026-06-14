# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0090_remove_transmuted_score'),
    ]

    operations = [
        migrations.AddField(
            model_name='systemsetting',
            name='default_ww_weight',
            field=models.DecimalField(decimal_places=2, default=30.0, help_text='Default Written Work weight (%)', max_digits=5),
        ),
        migrations.AddField(
            model_name='systemsetting',
            name='default_pt_weight',
            field=models.DecimalField(decimal_places=2, default=50.0, help_text='Default Performance Task weight (%)', max_digits=5),
        ),
        migrations.AddField(
            model_name='systemsetting',
            name='default_qa_weight',
            field=models.DecimalField(decimal_places=2, default=20.0, help_text='Default Quarterly Assessment weight (%)', max_digits=5),
        ),
        migrations.AddField(
            model_name='systemsetting',
            name='passing_grade',
            field=models.DecimalField(decimal_places=2, default=75.0, help_text='Minimum passing grade (%)', max_digits=5),
        ),
    ]
