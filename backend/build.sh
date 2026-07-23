#!/usr/bin/env bash

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Checking installed packages..."
pip list | grep supabase || echo "Warning: supabase not found in pip list"

# Create media directory if it doesn't exist
mkdir -p media
mkdir -p staticfiles

python manage.py collectstatic --no-input

echo "Running migrations..."
python manage.py migrate --no-input 2>&1
MIGRATE_EXIT=$?
if [ $MIGRATE_EXIT -ne 0 ]; then
    echo "WARNING: migrate failed with exit code $MIGRATE_EXIT"
else
    echo "Migrations applied successfully"
fi

# Only seed if accounts_user table exists
if python manage.py shell -c "from django.db import connection; cursor = connection.cursor(); cursor.execute(\"SELECT 1 FROM accounts_user LIMIT 1\"); print('ok')" 2>/dev/null; then
    echo "Database tables exist, running seeds..."

    if python manage.py shell -c "from accounts.models import WebsiteContent; exit(0 if WebsiteContent.objects.exists() else 1)" 2>/dev/null; then
        echo "WebsiteContent already seeded, skipping."
    else
        echo "Seeding website content..."
        python manage.py seed_website_content
    fi

    echo "Seeding faculty accounts..."
    python manage.py seed_faculty_accounts

    echo "Updating staff titles to DepEd ranks..."
    python manage.py update_staff_titles

    echo "Seeding JHS subjects (Grade 7-10)..."
    python manage.py seed_jhs_subjects
else
    echo "Tables not yet created — skipping seeds"
fi
