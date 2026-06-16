# Migration Summary — Phases 1-9

All migrations must be run in order with `python manage.py migrate`.

## Migration Order

| Migration | Phase | What It Does |
|-----------|-------|-------------|
| `0092_add_notificationpreference.py` | 1 | Creates `NotificationPreference` model for user notification settings |
| `0093_enhance_assignment_submission.py` | 2 | Adds 9 fields to `Assignment` (type, weight, publish, late policy, template) and 2 fields to `Submission` (graded_at, graded_by) |
| `0094_academic_records.py` | 3 | Creates 6 models: `Transcript`, `TranscriptLineItem`, `TransferCertificate`, `CharacterCertificate`, `AchievementRecord`, `RecordRequest` |
| `0095_attendance_enhancements.py` | 4 | Adds 5 fields to `Attendance` (arrival/departure, minutes_late, excuse), creates `AbsenceExcuse` and `EnrollmentWaitlist` models |
| `0096_grading_enhancements.py` | 5 | Adds `gpa`, `status`, `approved_by`, `approved_at` to `GradeReport` |
| `0097_parent_enhancements.py` | 6 | Creates `ParentTeacherMeeting`, `BehavioralRecord`, `SchoolEvent` models |
| `0098_messaging_enhancements.py` | 7 | Creates `UserBlock` and `EmergencyMessage` models |
| `0099_admin_enhancements.py` | 8 | Creates `Department` and `StaffPerformance` models |

## New Models Added (20 total)

| Phase | Model | Purpose |
|-------|-------|---------|
| 1 | NotificationPreference | User notification delivery preferences |
| 3 | Transcript | Official academic transcript |
| 3 | TranscriptLineItem | Per-subject grade on transcript |
| 3 | TransferCertificate | Form 137-T |
| 3 | CharacterCertificate | Good Moral Character cert |
| 3 | AchievementRecord | Student awards/achievements |
| 3 | RecordRequest | Unified record request system |
| 4 | AbsenceExcuse | Student absence excuse workflow |
| 4 | EnrollmentWaitlist | Waitlist for full classrooms |
| 6 | ParentTeacherMeeting | Parent-teacher conference scheduling |
| 6 | BehavioralRecord | Student disciplinary records |
| 6 | SchoolEvent | School-wide event calendar |
| 7 | UserBlock | User blocking for chat |
| 7 | EmergencyMessage | Emergency broadcast system |
| 8 | Department | Academic department management |
| 8 | StaffPerformance | Teacher performance evaluation |

## Enhanced Models (3)

| Phase | Model | New Fields |
|-------|-------|-----------|
| 2 | Assignment | assignment_type, percentage_weight, is_published, publish_at, allow_late_submissions, max_late_submissions, grade_component, is_template, template_name |
| 2 | Submission | graded_at, graded_by |
| 4 | Attendance | arrival_time, departure_time, minutes_late, has_excuse, excuse_verified |
| 5 | GradeReport | gpa, status, approved_by, approved_at |

## How to Apply

```bash
# From the backend directory
python manage.py migrate
```

If you get errors about missing dependencies, ensure migrations are applied in numeric order:
```bash
python manage.py migrate accounts 0092
python manage.py migrate accounts 0093
python manage.py migrate accounts 0094
python manage.py migrate accounts 0095
python manage.py migrate accounts 0096
python manage.py migrate accounts 0097
python manage.py migrate accounts 0098
python manage.py migrate accounts 0099
```

## Frontend Build

After all backend changes, rebuild the frontend:
```bash
cd frontend
npm install
npm run build
```

## New API Endpoints (Complete List)

### Phase 1
- `GET/PUT /v1/notification-preferences/` — Notification preferences

### Phase 2
- `POST /v1/assignments/{id}/clone/` — Clone an assignment
- `POST /v1/submissions/{id}/grade_submission/` — Grade a submission

### Phase 3
- `/v1/transcripts/` — CRUD + generate/finalize/pdf actions
- `/v1/transfer-certificates/` — CRUD + process_request/pdf actions
- `/v1/character-certificates/` — CRUD + process_request/pdf actions
- `/v1/achievement-records/` — CRUD + verify action
- `/v1/record-requests/` — CRUD + process_request action

### Phase 4
- `/v1/absence-excuses/` — CRUD + review action
- `/v1/enrollment-waitlist/` — CRUD + process action
- `GET /v1/attendance/export/` — CSV export

### Phase 5
- `POST /v1/grade-reports/{id}/submit_for_review/`
- `POST /v1/grade-reports/{id}/approve/`
- `POST /v1/grade-reports/notify_missing_grades/`
- `GET /v1/grade-reports/export_csv/`
- `POST /v1/grade-reports/import_csv/`

### Phase 6
- `/v1/ptm-meetings/` — CRUD + complete/cancel actions
- `/v1/behavioral-records/` — CRUD
- `/v1/school-events/` — CRUD
- `GET /v1/parent/child/{id}/report-card-pdf/`
- `GET /v1/parent/child/{id}/year-over-year/`

### Phase 7
- `GET /v1/chat/messages/search/?q=...`
- `GET /v1/chat/messages/pinned/`
- `POST /v1/chat/rooms/create_class_chat/`
- `POST /v1/chat/rooms/emergency_broadcast/`
- `/v1/user-blocks/` — CRUD + check_blocked/unblock
- `/v1/emergency-messages/` — Read-only

### Phase 8
- `/v1/departments/` — CRUD
- `/v1/staff-performance/` — CRUD
- `GET /v1/admin/attendance-analytics/`
- `GET /v1/admin/grade-analytics/`
- `POST /v1/admin/data-retention/`
- `POST /v1/admin/run-backup-enhanced/`

## Performance Improvements

- `parent_dashboard_view`: Reduced from ~7N queries to 5 total queries (batch-fetching)
- Missing-grade detection: Reduced from students×subjects queries to 3 queries
- `GradeViewSet`: Added `student__profile` to `select_related`
- WebSocket `RateLimiter`: Now uses Django cache (Redis in production)
- Shared `PERFORMANCE_LEVELS` constant extracted to `frontend/src/utils/grading.js`
