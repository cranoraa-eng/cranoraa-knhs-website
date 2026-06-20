#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Installing Redis..."
apt-get update -qq && apt-get install -y -qq redis-server >/dev/null 2>&1 || echo "Redis install skipped (not Debian/Ubuntu)"
redis-server --daemonize yes --maxmemory 64mb --maxmemory-policy allkeys-lru --loglevel warning || echo "Redis start skipped"

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
