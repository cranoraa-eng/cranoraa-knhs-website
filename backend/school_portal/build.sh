#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r ../requirements.txt

python manage.py collectstatic --no-input

# Run migrations
# We use --noinput to avoid prompts during deployment
python manage.py migrate