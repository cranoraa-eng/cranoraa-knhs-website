from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0100_add_critical_indexes'),
    ]

    operations = [
        # ── ClassroomSubject: weights must sum to 100 ───────────────────────
        migrations.RunSQL(
            sql=(
                "ALTER TABLE accounts_classroomsubject "
                "ADD CONSTRAINT chk_weight_sum "
                "CHECK (ww_weight + pt_weight + qa_weight = 100.00)"
            ),
            reverse_sql=(
                "ALTER TABLE accounts_classroomsubject "
                "DROP CONSTRAINT IF EXISTS chk_weight_sum"
            ),
        ),

        # ── Fee: amount_paid must be non-negative and <= amount ──────────────
        migrations.RunSQL(
            sql=(
                "ALTER TABLE accounts_fee "
                "ADD CONSTRAINT chk_amount_paid "
                "CHECK (amount_paid >= 0 AND amount_paid <= amount)"
            ),
            reverse_sql=(
                "ALTER TABLE accounts_fee "
                "DROP CONSTRAINT IF EXISTS chk_amount_paid"
            ),
        ),

        # ── TimeSlot: end_time must be after start_time ──────────────────────
        migrations.RunSQL(
            sql=(
                "ALTER TABLE accounts_timeslot "
                "ADD CONSTRAINT chk_time_order "
                "CHECK (end_time > start_time)"
            ),
            reverse_sql=(
                "ALTER TABLE accounts_timeslot "
                "DROP CONSTRAINT IF EXISTS chk_time_order"
            ),
        ),

        # ── Grade: raw_score between 0 and total_score (nullable) ────────────
        migrations.RunSQL(
            sql=(
                "ALTER TABLE accounts_grade "
                "ADD CONSTRAINT chk_score_range "
                "CHECK (raw_score IS NULL OR (raw_score >= 0 AND raw_score <= total_score))"
            ),
            reverse_sql=(
                "ALTER TABLE accounts_grade "
                "DROP CONSTRAINT IF EXISTS chk_score_range"
            ),
        ),
    ]
