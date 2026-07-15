import os
from django.core.management import call_command
import django

# Set dummy env var
os.environ['DJANGO_SECRET_KEY'] = 'test-secret-key-for-squashing'
os.environ['DJANGO_SETTINGS_MODULE'] = 'school_portal.settings'

django.setup()

# Squash migrations
call_command('squashmigrations', 'accounts', '0001', '0091', '--noinput')
