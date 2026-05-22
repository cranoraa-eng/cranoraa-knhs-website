from django.db import migrations

def set_cascade_on_postgres(apps, schema_editor):
    if schema_editor.connection.vendor == 'postgresql':
        # Drop the existing constraint and add it back with ON DELETE CASCADE
        schema_editor.execute('''
            ALTER TABLE accounts_profile 
            DROP CONSTRAINT IF EXISTS accounts_profile_user_id_49a85d32_fk_accounts_user_id;
        ''')
        schema_editor.execute('''
            ALTER TABLE accounts_profile 
            ADD CONSTRAINT accounts_profile_user_id_49a85d32_fk_accounts_user_id 
            FOREIGN KEY (user_id) REFERENCES accounts_user(id) ON DELETE CASCADE;
        ''')

def reverse_cascade_on_postgres(apps, schema_editor):
    if schema_editor.connection.vendor == 'postgresql':
        schema_editor.execute('''
            ALTER TABLE accounts_profile 
            DROP CONSTRAINT IF EXISTS accounts_profile_user_id_49a85d32_fk_accounts_user_id;
        ''')
        schema_editor.execute('''
            ALTER TABLE accounts_profile 
            ADD CONSTRAINT accounts_profile_user_id_49a85d32_fk_accounts_user_id 
            FOREIGN KEY (user_id) REFERENCES accounts_user(id) ON DELETE NO ACTION;
        ''')

class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0055_user_temp_password_storage'),
    ]

    operations = [
        migrations.RunPython(set_cascade_on_postgres, reverse_cascade_on_postgres),
    ]
