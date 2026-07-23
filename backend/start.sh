#!/usr/bin/env bash
set -o errexit

echo "Running migrations..."
python manage.py migrate --no-input 2>&1 || echo "WARNING: migrate failed"

echo "Starting server..."
exec daphne -b 0.0.0.0 -p $PORT school_portal.asgi:application
