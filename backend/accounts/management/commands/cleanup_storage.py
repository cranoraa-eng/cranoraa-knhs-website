"""
Management command: cleanup_storage

Finds orphaned files in Supabase Storage — files that exist in a bucket
but have no corresponding database record pointing to them.

Usage:
    python manage.py cleanup_storage                  # dry run (safe, no deletes)
    python manage.py cleanup_storage --delete         # actually delete orphans
    python manage.py cleanup_storage --bucket announcements --delete

Run this periodically (e.g. weekly cron on Render) to reclaim storage space.
"""
import logging
from django.core.management.base import BaseCommand
from django.conf import settings

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Find and optionally delete orphaned files in Supabase Storage buckets.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--delete',
            action='store_true',
            default=False,
            help='Actually delete orphaned files (default is dry-run only).',
        )
        parser.add_argument(
            '--bucket',
            type=str,
            default=None,
            help='Only check a specific bucket key (e.g. announcements). Default: all buckets.',
        )

    def handle(self, *args, **options):
        dry_run = not options['delete']
        target_bucket = options.get('bucket')

        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN — no files will be deleted. Pass --delete to remove orphans.'))

        from accounts.storage import BUCKETS, _get_supabase_client, _get_bucket_name, delete_file

        try:
            client, _ = _get_supabase_client()
        except RuntimeError as e:
            self.stderr.write(self.style.ERROR(f'Supabase not configured: {e}'))
            return

        # Build a set of all URLs currently referenced in the database
        db_urls = self._collect_db_urls()
        self.stdout.write(f'Found {len(db_urls)} file URLs referenced in the database.')

        total_orphans = 0
        total_deleted = 0

        bucket_keys = [target_bucket] if target_bucket else list(BUCKETS.keys())

        for key in bucket_keys:
            if key not in BUCKETS:
                self.stderr.write(self.style.ERROR(f'Unknown bucket key: {key}'))
                continue

            bucket_name = _get_bucket_name(key)
            self.stdout.write(f'\nChecking bucket: {bucket_name} ({key})')

            try:
                objects = client.storage.from_(bucket_name).list()
                if not isinstance(objects, list):
                    self.stdout.write(f'  Could not list objects (response: {objects})')
                    continue
            except Exception as e:
                self.stderr.write(self.style.ERROR(f'  Error listing {bucket_name}: {e}'))
                continue

            supabase_url = (settings.SUPABASE_URL or '').rstrip('/')
            orphans = []

            for obj in objects:
                if not isinstance(obj, dict):
                    continue
                name = obj.get('name', '')
                if not name:
                    continue
                public_url = f"{supabase_url}/storage/v1/object/public/{bucket_name}/{name}"
                if public_url not in db_urls:
                    orphans.append((name, public_url))

            self.stdout.write(f'  {len(objects)} files in bucket, {len(orphans)} orphans found.')
            total_orphans += len(orphans)

            for name, url in orphans:
                if dry_run:
                    self.stdout.write(f'  [DRY RUN] Would delete: {name}')
                else:
                    success = delete_file(url, key)
                    if success:
                        self.stdout.write(self.style.SUCCESS(f'  Deleted: {name}'))
                        total_deleted += 1
                    else:
                        self.stderr.write(self.style.ERROR(f'  Failed to delete: {name}'))

        self.stdout.write(f'\nSummary: {total_orphans} orphans found.')
        if not dry_run:
            self.stdout.write(self.style.SUCCESS(f'{total_deleted} files deleted.'))

    def _collect_db_urls(self) -> set:
        """Collect all Supabase file URLs currently stored in the database."""
        from accounts.models import (
            Profile, AnnouncementAttachment, LearningMaterial,
            Assignment, Submission, EnrollmentApplication,
            SystemSetting, WebsiteContent,
        )

        urls = set()

        # Profile pictures
        for url in Profile.objects.exclude(profile_picture__isnull=True).exclude(profile_picture='').values_list('profile_picture', flat=True):
            if url:
                urls.add(url)

        # Announcement attachments
        for url in AnnouncementAttachment.objects.exclude(file='').values_list('file', flat=True):
            if url:
                urls.add(url)

        # Learning materials
        for url in LearningMaterial.objects.exclude(file__isnull=True).exclude(file='').values_list('file', flat=True):
            if url:
                urls.add(url)

        # Assignments
        for url in Assignment.objects.exclude(file__isnull=True).exclude(file='').values_list('file', flat=True):
            if url:
                urls.add(url)

        # Submissions
        for url in Submission.objects.exclude(file='').values_list('file', flat=True):
            if url:
                urls.add(url)

        # Enrollment documents
        doc_fields = [
            'birth_certificate', 'report_card', 'form_138',
            'certificate_of_completion', 'good_moral_certificate',
            'last_school_attended_cert',
        ]
        for field in doc_fields:
            for url in EnrollmentApplication.objects.exclude(**{f'{field}__isnull': True}).exclude(**{field: ''}).values_list(field, flat=True):
                if url:
                    urls.add(url)

        # Branding
        setting = SystemSetting.objects.first()
        if setting and setting.school_logo:
            urls.add(setting.school_logo)

        for url in WebsiteContent.objects.exclude(image__isnull=True).exclude(image='').values_list('image', flat=True):
            if url:
                urls.add(url)

        return urls
