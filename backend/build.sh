#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Checking installed packages..."
pip list | grep supabase || echo "Warning: supabase not found in pip list"

# Create media directory if it doesn't exist
mkdir -p media
mkdir -p staticfiles

python manage.py collectstatic --no-input
python manage.py migrate
python manage.py seed_website_content
