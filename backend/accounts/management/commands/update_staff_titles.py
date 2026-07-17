"""
Management command: update_staff_titles

Updates the staff_title field on existing faculty accounts to use the
proper DepEd rank codes (teacher_i, teacher_iii, etc.) instead of the
old generic 'teacher' / 'other' values that were set by the original
seed_faculty_accounts run.

Usage:
    python manage.py update_staff_titles
    python manage.py update_staff_titles --dry-run
"""

from django.core.management.base import BaseCommand
from accounts.models import User

# Map username → correct staff_title
TITLE_MAP = {
    # Administration
    "sanny.delfin":          "principal",
    "jaylen.navato":         "guidance_counselor",
    "michelyn.biera":        "administrative_officer",
    "cherry.sagrado":        "admin_assistant",
    # Master / Special Science
    "beverly.perez":         "master_teacher_i",
    "jessica.actub":         "special_science_teacher_i",
    # Teacher VI
    "rusty.bartolata":       "teacher_vi",
    "tahany.rangaig":        "teacher_vi",
    "jonathan.tatoy":        "teacher_vi",
    # Teacher V
    "ellen.gedaro":          "teacher_v",
    "mildred.gomez":         "teacher_v",
    "janice.valdez":         "teacher_v",
    # Teacher IV
    "kimberly.acaso":        "teacher_iv",
    "lucelle.catubig":       "teacher_iv",
    "clarence.pabillar":     "teacher_iv",
    # Teacher III
    "markryan.bacus":        "teacher_iii",
    "norhata.casana":        "teacher_iii",
    "clarice.cena":          "teacher_iii",
    "jellieta.clordealta":   "teacher_iii",
    "hegenia.coca":          "teacher_iii",
    "monalissa.dicol":       "teacher_iii",
    "leoann.garma":          "teacher_iii",
    "daisy.layos":           "teacher_iii",
    "maryjean.nunez":        "teacher_iii",
    "krystinemae.pastidio":  "teacher_iii",
    # Teacher II
    "mariacristina.turtosa": "teacher_ii",
    "grace.macatol":         "teacher_ii",
    # Teacher I
    "tasneemah.amer":        "teacher_i",
    "elizalde.cabual":       "teacher_i",
    "shane.cadiz":           "teacher_i",
    "annabel.cantila":       "teacher_i",
    "darwin.castillon":      "teacher_i",
    "julius.paler":          "teacher_i",
    "chozily.tatoy":         "teacher_i",
    # ALS
    "aldrin.maghinay":       "als_teacher",
}


class Command(BaseCommand):
    help = "Update existing faculty accounts to use proper DepEd rank staff_title values."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Print what would change without saving.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        updated = 0
        not_found = []

        for username, new_title in TITLE_MAP.items():
            try:
                user = User.objects.get(username=username)
                old_title = user.staff_title or "(none)"
                if user.staff_title != new_title:
                    if not dry_run:
                        user.staff_title = new_title
                        user.save(update_fields=["staff_title"])
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"  {'[DRY RUN] ' if dry_run else ''}✓  {username}: {old_title} → {new_title}"
                        )
                    )
                    updated += 1
                else:
                    self.stdout.write(f"  —   {username}: already {new_title}, skipped")
            except User.DoesNotExist:
                not_found.append(username)
                self.stdout.write(self.style.WARNING(f"  ⚠   {username}: not found in DB"))

        self.stdout.write("\n" + "─" * 60)
        self.stdout.write(self.style.SUCCESS(
            f"{'Would update' if dry_run else 'Updated'}: {updated} accounts"
        ))
        if not_found:
            self.stdout.write(self.style.WARNING(
                f"Not found: {len(not_found)} — {', '.join(not_found)}"
            ))
        self.stdout.write(
            "\nRe-run seed_faculty_accounts for any accounts that don't exist yet.\n"
        )
