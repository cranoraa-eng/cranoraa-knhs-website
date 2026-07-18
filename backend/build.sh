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

# Only seed if WebsiteContent table is empty (idempotent)
if python manage.py shell -c "from accounts.models import WebsiteContent; exit(0 if WebsiteContent.objects.exists() else 1)" 2>/dev/null; then
    echo "WebsiteContent already seeded, skipping."
else
    echo "Seeding website content..."
    python manage.py seed_website_content
fi

# Seed faculty staff accounts (idempotent — skips existing usernames)
echo "Seeding faculty accounts..."
python manage.py seed_faculty_accounts

# Update existing accounts to correct DepEd rank titles
echo "Updating staff titles to DepEd ranks..."
python manage.py update_staff_titles

# Seed JHS subjects (Grade 7-10) based on SF10-JHS form (idempotent — skips existing)
echo "Seeding JHS subjects (Grade 7-10)..."
python manage.py seed_jhs_subjects
