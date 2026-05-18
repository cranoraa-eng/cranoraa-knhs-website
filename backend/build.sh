#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input

# Run migrations
python manage.py migrate

# Seed website content (optional, but good for first deploy)
python manage.py seed_website_content
