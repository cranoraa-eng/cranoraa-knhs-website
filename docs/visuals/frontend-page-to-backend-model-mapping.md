# Frontend Page To Backend Model Mapping

This document maps frontend pages and major shared UI surfaces to the backend models they most directly depend on.

## Scope

- Frontend routes and major page components in `frontend/src/pages`
- Shared dashboard and announcement components where they load backend data
- Model mapping inferred from the API endpoints each page calls

## Important Notes

- Most frontend pages use `/api/...` endpoints from `accounts.urls` and `portal.urls`.
- Some mappings are direct, while others are inferred through serializer/viewset behavior.
- The frontend mostly uses `accounts` app models for day-to-day portal features.
- `portal` app models mainly appear in admin/system features like academic years, audit logs, and backups.

---

## 1. Public Website Pages

| Frontend page | Main route | Main API/endpoints used | Backend models involved | Notes |
|---|---|---|---|---|
| `Home.jsx` / `HomeDepEd.jsx` / `Home_OLD.jsx` | `/` | `/website-content/public/`, `/announcements/public/` | `accounts.WebsiteContent`, `accounts.Announcement` | Homepage content and public news feed |
| `About.jsx` | `/about` | `/website-content/public/` | `accounts.WebsiteContent` | Pulls editable website content |
| `Mission.jsx` | `/mission` | `/website-content/public/` | `accounts.WebsiteContent` | Pulls editable website content |
| `Vision.jsx` | `/vision` | `/website-content/public/` | `accounts.WebsiteContent` | Pulls editable website content |
| `Programs.jsx` | `/programs` | `/website-content/public/` | `accounts.WebsiteContent` | Program page content is CMS-driven |
| `Contact.jsx` | `/contact` | `/website-content/public/` | `accounts.WebsiteContent` | Contact page content is CMS-driven |
| `AnnouncementDetails.jsx` | `/announcement` | `/website-content/public/` | `accounts.WebsiteContent` | Uses website content; public announcement content may also appear through route context |
| `NewsEvents.jsx` | `/news-events` | `/announcements/public/` | `accounts.Announcement` | Public news/events listing |
| `Calendar.jsx` | `/calendar` | `/student/calendar/` | `accounts.Announcement`, `accounts.Schedule`, `accounts.Classroom`, `accounts.Subject`, `accounts.Room`, `accounts.TimeSlot` | Calendar endpoint likely combines public events and school scheduling context |
| `Enrollment.jsx` | `/enroll` | `/enrollment-applications/` | `accounts.EnrollmentApplication`, `accounts.EnrollmentDocument`, `accounts.ParentLink` | Public application submission flow |
| `EnrollmentTracking.jsx` | `/track-enrollment` | `/enrollment-applications/track/` | `accounts.EnrollmentApplication`, `accounts.EnrollmentStatusHistory` | Tracks admission progress |
| `LearningMaterials.jsx` | `/learning-materials` | none found in page scan | likely `accounts.LearningMaterial` or static | May be static or fed by child components |
| `Faculty.jsx` | `/faculty` | none found in page scan | none found directly | Likely static/presentational at current state |
| `K12Programs.jsx` | `/k12-programs` | none found in page scan | none found directly | Likely static/presentational at current state |
| `SeniorHigh.jsx` | `/senior-high` | none found in page scan | none found directly | Likely static/presentational at current state |
| `Portals.jsx` | `/portals` | none found in page scan | none found directly | Likely navigation/landing content |
| `PrivacyPolicy.jsx` | `/privacy` | none found in page scan | none | Static legal content |
| `TermsOfService.jsx` | `/terms` | none found in page scan | none | Static legal content |

---

## 2. Auth And Entry Pages

| Frontend page | Main route | Main API/endpoints used | Backend models involved | Notes |
|---|---|---|---|---|
| `Login.jsx` | `/login` | not captured in scan, but uses login flow | `accounts.User`, `accounts.Profile`, `accounts.OTP` | Auth entry page; backend login and profile loading support it |
| `ForcePasswordChange.jsx` | `/force-password-change` | `/force-password-change/` | `accounts.User` | Updates password after temporary credential login |
| `PasswordReset.jsx` | `/password-reset` | `/auth/change-password/` | `accounts.User`, `accounts.OTP` | Password/security flow; endpoint naming suggests auth helper view |
| `Dashboard.jsx` | `/dashboard` | data delegated to role dashboards/shared components | varies by role | Wrapper page that routes to admin/teacher/student experiences |

---

## 3. Shared Shell, Context, And Shared Components

| Frontend surface | Main API/endpoints used | Backend models involved | Notes |
|---|---|---|---|
| `AuthContext.jsx` | `/profile/`, `/student/profile/` | `accounts.User`, `accounts.Profile` | Refreshes identity and profile picture state |
| `Layout.jsx` | `/notifications/mark-all-read/`, `/notifications/{id}/mark-read/`, `/fcm-tokens/` | `accounts.Notification`, `accounts.FCMToken`, `accounts.User` | Topbar notifications and push enrollment |
| `LatestNews.jsx` | `/announcements/public/` | `accounts.Announcement` | Shared public news widget |
| `AnnouncementCommentsPanel.jsx` | `/announcements/{id}/comments/` | `accounts.Announcement`, `accounts.AnnouncementComment`, `accounts.User` | Comment thread under announcements |
| `StudentDashboardView.jsx` | `/schedules/today/`, `/grades/my_grades/`, `/attendance/`, `/student/dashboard/stats/`, `/assignments/`, `/announcements/` | `accounts.Schedule`, `accounts.TimeSlot`, `accounts.Room`, `accounts.Grade`, `accounts.Attendance`, `accounts.Assignment`, `accounts.Announcement`, `accounts.Classroom`, `accounts.Subject` | Shared student dashboard data loader |
| `dashboards/shared.jsx` | `/schedules/today/`, `/announcements/?limit=5` | `accounts.Schedule`, `accounts.Announcement` | Shared dashboard cards/widgets |

---

## 4. Admin Academic And School Management Pages

| Frontend page | Main route | Main API/endpoints used | Backend models involved | Notes |
|---|---|---|---|---|
| `ClassManagement.jsx` | `/class-management` | `/users/?role=teacher`, `/admin/academic-years/`, `/classrooms/` | `accounts.Classroom`, `accounts.User`, `portal.AcademicYear`, `portal.Semester` | Manages class sections and advisory teacher assignments |
| `Subjects.jsx` | `/subjects` | `/subjects/` | `accounts.Subject` | Subject catalog management |
| `SubjectAssignment.jsx` | `/subject-assignment` | `/classrooms/`, `/subjects/`, `/users/?role=teacher`, `/classroom-subjects/by_classroom/`, `/classroom-subjects/` | `accounts.Classroom`, `accounts.Subject`, `accounts.User`, `accounts.ClassroomSubject` | Connects teachers, classes, and subjects |
| `ScheduleManagement.jsx` | `/schedule-management` | `/schedules/`, `/rooms/`, `/time-slots/`, `/classrooms/`, `/subjects/`, `/users/?role=teacher`, `/admin/academic-years/`, `/admin/semesters/`, `/classroom-subjects/by_classroom/`, `/schedules/conflict_check/` | `accounts.Schedule`, `accounts.Room`, `accounts.TimeSlot`, `accounts.Classroom`, `accounts.Subject`, `accounts.ClassroomSubject`, `accounts.User`, `portal.AcademicYear`, `portal.Semester` | Full timetable builder and conflict checker |
| `Settings.jsx` | `/settings` | `/system/settings/`, `/admin/academic-years/`, `/student/profile/`, `/force-password-change/` | `accounts.SystemSetting`, `portal.AcademicYear`, `accounts.Profile`, `accounts.User` | Mixes school settings, academic year management, profile, and security |
| `WebsiteContentManagement.jsx` | `/website-content` | not captured in scan, but route strongly implies website content CRUD | `accounts.WebsiteContent` | CMS/admin page for public site content |

---

## 5. Admin People And Admissions Pages

| Frontend page | Main route | Main API/endpoints used | Backend models involved | Notes |
|---|---|---|---|---|
| `Teachers.jsx` | `/teachers` | `/users/?role=teacher`, `/classrooms/`, `/admin/create-user/`, `/users/{id}/`, `/users/{id}/reset_password/`, `/users/{id}/update_status/`, `/users/import_teachers_csv/`, `/chat/rooms/get_or_create_private_chat/` | `accounts.User`, `accounts.Profile`, `accounts.Classroom`, `accounts.ChatRoom` | Teacher account lifecycle and direct messaging |
| `StudentManagement.jsx` | `/student-management` | `/users/?role=student`, `/classrooms/`, `/admin/create-user/`, `/users/import_csv/`, `/users/bulk-delete/`, `/users/{id}/reset_password/`, `/enrollments/assign-classroom/`, `/chat/rooms/get_or_create_private_chat/`, `/users/{id}/update_status/` | `accounts.User`, `accounts.Profile`, `accounts.Classroom`, `accounts.StudentClassEnrollment`, `accounts.ChatRoom` | Student accounts and classroom assignment |
| `ParentManagement.jsx` | `/parent-management` | `/users/?role=parent`, `/users/?role=student`, `/admin/create-user/`, `/users/{id}/`, `/users/{id}/reset_password/` | `accounts.User`, `accounts.Profile`, `accounts.ParentLink` | Parent account admin and child linkage context |
| `StudentEnrollment.jsx` | `/student-enrollment` | `/classrooms/`, `/users/?role=student`, `/enrollments/?classroom=...`, `/enrollments/` | `accounts.Classroom`, `accounts.User`, `accounts.StudentClassEnrollment` | Manual student-class enrollment manager |
| `EnrollmentManagement.jsx` | `/enrollment-management` | `/enrollment-applications/`, `/enrollment-applications/analytics/`, `/classrooms/`, `/enrollment-applications/{id}/...`, `/enrollment-applications/update-classroom-capacity/`, export endpoints | `accounts.EnrollmentApplication`, `accounts.EnrollmentDocument`, `accounts.EnrollmentStatusHistory`, `accounts.Classroom`, `accounts.ParentLink`, `accounts.User` | Full admissions workflow and transition to enrolled student |

---

## 6. Admin Academic Execution Pages

| Frontend page | Main route | Main API/endpoints used | Backend models involved | Notes |
|---|---|---|---|---|
| `Attendance.jsx` | `/attendance` | `/system/settings/`, `/admin/academic-years/`, `/classrooms/`, `/attendance/`, `/enrollments/`, `/attendance/summary/` | `accounts.Attendance`, `accounts.Classroom`, `accounts.StudentClassEnrollment`, `accounts.SystemSetting`, `portal.AcademicYear` | Attendance entry, edit, and summary analytics |
| `GradeInput.jsx` | `/grade-input` | `/classrooms/`, `/classroom-subjects/by_classroom/`, `/enrollments/`, `/grades/` | `accounts.Classroom`, `accounts.ClassroomSubject`, `accounts.StudentClassEnrollment`, `accounts.Grade`, `accounts.Subject`, `accounts.User` | Teacher/admin grade entry page |
| `GradeManagement.jsx` | `/grade-management` | `/grades/`, `/classrooms/`, `/grades/{id}/` | `accounts.Grade`, `accounts.Classroom`, `accounts.Subject`, `accounts.User` | Grade record administration, locking, deletion |
| `StudentGradeView.jsx` | `/student-grades` | `/grades/`, `/grades/my_grades/`, `/users/{id}/` | `accounts.Grade`, `accounts.GradeReport`, `accounts.User`, `accounts.Subject`, `accounts.Classroom` | Student-facing or filtered grade view |
| `Materials.jsx` | `/materials` | `/materials/`, `/classrooms/` | `accounts.LearningMaterial`, `accounts.Classroom`, `accounts.User` | Learning resource upload and listing |
| `MyClasses.jsx` | `/my-classes` | `/classroom-subjects/by_teacher/` | `accounts.ClassroomSubject`, `accounts.Classroom`, `accounts.Subject`, `accounts.User` | Teacher class load view |
| `ClassMembers.jsx` | `/class-members` | `/enrollments/`, `/classroom-subjects/by_classroom/`, `/chat/rooms/get_or_create_private_chat/` | `accounts.StudentClassEnrollment`, `accounts.ClassroomSubject`, `accounts.Classroom`, `accounts.User`, `accounts.ChatRoom` | Class roster and quick contact |

---

## 7. Communication Pages

| Frontend page | Main route | Main API/endpoints used | Backend models involved | Notes |
|---|---|---|---|---|
| `Announcements.jsx` | `/announcements` | `/classrooms/`, `/announcements/`, `/announcements/{id}/publish/`, `/announcements/{id}/archive/`, `/announcements/{id}/mark-read/`, delete and bulk endpoints | `accounts.Announcement`, `accounts.AnnouncementAttachment`, `accounts.AnnouncementComment`, `accounts.Classroom`, `accounts.User` | Main announcement management and feed page |
| `Notifications.jsx` | `/notifications` | `/notifications/`, `/notifications/{id}/mark-read/`, `/notifications/mark-selected-read/`, `/notifications/mark-all-read/`, delete endpoints, `/test-push/` | `accounts.Notification`, `accounts.FCMToken`, `accounts.User` | User alert center and push testing |
| `Messages.jsx` | `/messages` | `/chat/rooms/`, `/friendships/`, `/chat/messages/`, `/users/search/`, `/chat/reports/`, room pin/delete/rename/group endpoints | `accounts.ChatRoom`, `accounts.ChatMessage`, `accounts.MessageReaction`, `accounts.ReportedMessage`, `accounts.Friendship`, `accounts.User`, `accounts.Profile` | Main realtime/direct messaging workspace |
| `Moderation.jsx` | `/moderation` | `/chat/reports/`, `/chat/reports/{id}/...`, mute/suspend endpoints | `accounts.ReportedMessage`, `accounts.ChatMessage`, `accounts.User`, `accounts.Profile` | Admin moderation console for chat abuse |

---

## 8. Dashboards And Analytics Pages

| Frontend page | Main route | Main API/endpoints used | Backend models involved | Notes |
|---|---|---|---|---|
| `dashboards/AdminDashboard.jsx` | used under `/dashboard` | `/admin/stats/?academic_year=...` | aggregate over `accounts.User`, `accounts.Classroom`, `accounts.Grade`, `accounts.Attendance`, `accounts.EnrollmentApplication`, `accounts.Announcement`, plus `portal.AcademicYear` | Executive admin counts and trends |
| `dashboards/TeacherDashboard.jsx` | used under `/dashboard` | `/teacher/stats/`, `/classrooms/`, `/attendance/?classroom=...&date=...` | `accounts.Classroom`, `accounts.Attendance`, `accounts.StudentClassEnrollment`, `accounts.User` | Teacher snapshot and daily class status |
| `dashboards/StudentDashboard.jsx` | used under `/dashboard` | `/grades/my_grades/`, `/attendance/`, `/student/dashboard/stats/`, `/assignments/`, `/announcements/`, `/schedules/today/` | `accounts.Grade`, `accounts.Attendance`, `accounts.Assignment`, `accounts.Announcement`, `accounts.Schedule` | Student personal dashboard |
| `Analytics.jsx` | `/analytics` | `/admin/stats/`, `/admin/grade-distribution/`, `/attendance/summary/` | `accounts.Grade`, `accounts.Attendance`, `accounts.Classroom`, `accounts.Subject`, `portal.AcademicYear` | Admin analytics page across academics and attendance |
| `SystemHealth.jsx` | `/system-health` | `/admin/stats/`, `/admin/system-metrics/`, `/admin/maintenance-feed/` | aggregate/system-level, plus `portal.APIRequestLog`, `portal.AuditLog`, `accounts.SystemSetting` | Operational health and metrics view |

---

## 9. Parent And Student Experience Pages

| Frontend page | Main route | Main API/endpoints used | Backend models involved | Notes |
|---|---|---|---|---|
| `ParentDashboard.jsx` | `/parent-dashboard` | `/parent/dashboard/`, `/parent/child/{id}/` | `accounts.ParentLink`, `accounts.User`, `accounts.Profile`, `accounts.Grade`, `accounts.Attendance`, `accounts.Schedule`, `accounts.Announcement` | Parent overview and child details |
| `MySchedule.jsx` | `/schedule` | `/schedules/my_schedule/`, `/schedules/today/` | `accounts.Schedule`, `accounts.TimeSlot`, `accounts.Room`, `accounts.Classroom`, `accounts.Subject` | Personal schedule page |
| `Profile.jsx` | `/profile` | `/student/profile/` or role-specific profile endpoints | `accounts.User`, `accounts.Profile` | User profile display and update |

---

## 10. Admin Governance Pages

| Frontend page | Main route | Main API/endpoints used | Backend models involved | Notes |
|---|---|---|---|---|
| `AuditLogs.jsx` | `/audit-logs` | `/admin/audit-logs/`, `/admin/audit-logs/stats/`, delete and bulk actions | `portal.AuditLog`, `accounts.User` | Administrative action history |
| `Backups.jsx` | `/backups` | `/admin/backups/`, `/admin/backups/{id}/restore/`, `/admin/backups/{id}/download/` | `portal.DatabaseBackup`, `accounts.User` | Backup management and restore/download actions |

---

## 11. Route-Level Mapping Summary

### Public Content Layer

- Main models: `accounts.WebsiteContent`, `accounts.Announcement`, `accounts.EnrollmentApplication`
- Frontend pages: home, about, mission, vision, programs, contact, news, enrollment, tracking

### Identity And Profile Layer

- Main models: `accounts.User`, `accounts.Profile`, `accounts.OTP`, `accounts.OnboardingState`
- Frontend pages: login, password change, settings, profile, portal shell

### Academic Structure Layer

- Main models: `accounts.Classroom`, `accounts.Subject`, `accounts.ClassroomSubject`, `accounts.StudentClassEnrollment`, `portal.AcademicYear`, `portal.Semester`
- Frontend pages: class management, subject assignment, schedule management, student enrollment, teacher/student dashboards

### Learning Execution Layer

- Main models: `accounts.Attendance`, `accounts.Grade`, `accounts.GradeReport`, `accounts.LearningMaterial`, `accounts.Assignment`, `accounts.Submission`, `accounts.Schedule`, `accounts.Room`, `accounts.TimeSlot`
- Frontend pages: attendance, grade input, grade management, student grade view, materials, my schedule

### Communication Layer

- Main models: `accounts.Announcement`, `accounts.AnnouncementAttachment`, `accounts.AnnouncementComment`, `accounts.Notification`, `accounts.FCMToken`, `accounts.ChatRoom`, `accounts.ChatMessage`, `accounts.MessageReaction`, `accounts.ReportedMessage`, `accounts.Friendship`
- Frontend pages: announcements, notifications, messages, moderation, latest news

### Admissions And Parent Layer

- Main models: `accounts.EnrollmentApplication`, `accounts.EnrollmentDocument`, `accounts.EnrollmentStatusHistory`, `accounts.ParentLink`
- Frontend pages: enrollment, enrollment tracking, enrollment management, parent dashboard, parent management

### Governance And Ops Layer

- Main models: `accounts.SystemSetting`, `portal.AuditLog`, `portal.DatabaseBackup`, `portal.APIRequestLog`, `portal.AcademicYear`
- Frontend pages: settings, audit logs, backups, analytics, system health

---

## 12. Models With The Broadest Frontend Reach

These models appear across the most pages and features:

- `accounts.User`
- `accounts.Profile`
- `accounts.Classroom`
- `accounts.Announcement`
- `accounts.StudentClassEnrollment`
- `accounts.Grade`
- `accounts.Attendance`
- `accounts.Schedule`
- `accounts.SystemSetting`
- `portal.AcademicYear`

They form the main backbone connecting frontend navigation to backend data.

