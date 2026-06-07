# Full Webapp System Workflows

This document consolidates the main workflows implemented across the KNHS public website, portal, and admin systems into a single reference.

## System Map

- Public website and content management
- Authentication, access control, and onboarding
- User, teacher, student, and parent management
- Enrollment and admissions
- Academic setup, classrooms, and subject assignment
- Attendance
- Grades and reports
- Learning materials, assignments, and submissions
- Scheduling and calendars
- Announcements and comments
- Notifications and push delivery
- Messaging, friendships, and moderation
- Parent portal
- Settings, maintenance mode, and school configuration
- Audit logs, backups, analytics, and system health

---

## 1. Public Website And Content Management

### Workflow Summary

1. Visitor opens the public website.
2. Public pages load content such as home, about, programs, contact, news, calendar, and enrollment.
3. Public announcements and website content are fetched from the backend.
4. Admin updates website sections in Website Content Management.
5. Saved content is stored in `WebsiteContent` and reused by the public site.

```mermaid
flowchart TD
    VIS[Visitor] --> PUB[Public website pages]
    PUB --> API[Public content and announcement endpoints]
    API --> WC[(WebsiteContent)]
    API --> ANN[(Announcement)]

    ADM[Admin] --> CMS[Website Content Management]
    CMS --> SAVE[Create or update section content]
    SAVE --> WC
    WC --> PUB
```

---

## 2. Authentication, Access Control, And Onboarding

### Workflow Summary

1. User signs in through the login page.
2. Backend validates credentials and returns portal access.
3. Frontend loads the user profile and role.
4. Protected routes render role-specific navigation for admin, teacher, student, or parent.
5. If the account requires a password change, the user is redirected to force password change.
6. Onboarding state tracks welcome flow, tutorials, checklist progress, and dismissed tips.

```mermaid
flowchart TD
    USER[User] --> LOGIN[Login page]
    LOGIN --> AUTH[POST /api/login/]
    AUTH --> ACC[(User)]
    AUTH --> PROF[(Profile)]
    AUTH --> ROLE[Resolve role and permissions]
    ROLE --> ROUTES[Protected routes and layout]
    ROUTES --> ONB[Onboarding state]
    ONB --> TIPS[Welcome, tours, help, checklist]
    ROLE --> FORCE[Force password change when required]
```

---

## 3. User, Teacher, Student, And Parent Management

### Workflow Summary

1. Admin creates or manages user accounts.
2. Profiles store role-specific details such as LRN, employee ID, contact info, and linked students.
3. Teachers can be assigned to classrooms and classroom subjects.
4. Parents can be linked to students through profile links and enrollment flows.
5. User status, approval, verification, mute, and suspension state affect system access.

```mermaid
flowchart TD
    ADM[Admin] --> UMG[User management]
    UMG --> USERDB[(User)]
    UMG --> PROFDB[(Profile)]

    USERDB --> TEA[Teacher account]
    USERDB --> STU[Student account]
    USERDB --> PAR[Parent account]

    TEA --> CLASS[Advisory classroom or subject assignment]
    STU --> ENR[Student enrollment records]
    PAR --> LINK[Linked students]
    LINK --> PROFDB
```

---

## 4. Enrollment And Admissions

### Workflow Summary

1. Applicant submits the online enrollment form from the public site.
2. Uploaded requirements are stored as application documents.
3. Admin opens the application, which can move from pending to under review.
4. Admin verifies or rejects documents, requests missing requirements, assigns a section, and approves or rejects the application.
5. When approved, admin enrolls the student, generates credentials, optionally links a parent, and assigns a classroom.
6. Status history records each transition until the application becomes enrolled.

```mermaid
flowchart TD
    APP[Applicant or Parent] --> FORM[Public enrollment form]
    FORM --> SUBMIT[Submit application]
    SUBMIT --> EA[(EnrollmentApplication)]
    SUBMIT --> DOCS[(EnrollmentDocument)]

    ADM[Admin] --> REVIEW[Enrollment Management]
    REVIEW --> START[Start review]
    START --> VERIFY[Verify or reject documents]
    VERIFY --> REQUEST[Request missing requirements]
    VERIFY --> ASSIGN[Assign section]
    ASSIGN --> APPROVE[Approve application]
    APPROVE --> ENROLL[Enroll student]
    ENROLL --> USER[(Student User)]
    ENROLL --> CLASS[(Classroom)]
    ENROLL --> PLINK[(ParentLink)]
    ENROLL --> HIST[(EnrollmentStatusHistory)]
```

---

## 5. Academic Setup, Classrooms, And Subject Assignment

### Workflow Summary

1. Admin creates academic years and semesters.
2. Admin creates classrooms and assigns advisory teachers.
3. Admin creates subjects by grade level.
4. Admin maps subjects to classrooms and assigns teachers through `ClassroomSubject`.
5. Student enrollment records connect students to classrooms.
6. These structures feed attendance, grades, materials, assignments, schedules, and parent views.

```mermaid
flowchart TD
    ADM[Admin] --> AY[Create academic year]
    ADM --> SEM[Create semester]
    ADM --> CLASS[Create classroom]
    ADM --> SUBJ[Create subject]
    ADM --> MAP[Assign subject to classroom]
    ADM --> ENROLL[Enroll student in classroom]

    AY --> CLASS
    SEM --> CLASS
    CLASS --> CS[(Classroom)]
    SUBJ --> SS[(Subject)]
    MAP --> CSM[(ClassroomSubject)]
    ENROLL --> SCE[(StudentClassEnrollment)]

    CSM --> ATT[Attendance]
    CSM --> GRD[Grades]
    CSM --> MAT[Materials]
    CSM --> SCH[Schedules]
```

---

## 6. Attendance

### Workflow Summary

1. Teacher or admin opens the attendance module for a classroom.
2. The class roster is derived from student classroom enrollments.
3. Attendance is marked per student and date.
4. Records are stored in `Attendance`.
5. Summaries feed analytics and can be viewed by teachers, students, and linked parents.
6. Attendance actions can also contribute to audit history and notifications.

```mermaid
flowchart TD
    TEA[Teacher or Admin] --> ROSTER[Load classroom roster]
    ROSTER --> MARK[Mark status per student]
    MARK --> API[POST attendance]
    API --> ATT[(Attendance)]
    ATT --> SUM[Attendance summary and trends]

    STU[Student] --> VIEW[View own attendance]
    PAR[Parent] --> PVIEW[View child attendance]
    SUM --> DASH[Dashboards and analytics]
```

---

## 7. Grades And Reports

### Workflow Summary

1. Teacher selects classroom, subject, student, quarter, and grade type.
2. Grade entries are created or updated in `Grade`.
3. The system computes score fields and remarks.
4. Final grade entries support quarter summaries and report generation.
5. `GradeReport` computes averages, pass-fail counts, and overall remarks.
6. Students and parents can view finalized grades and reports.

```mermaid
flowchart TD
    TEA[Teacher or Admin] --> INPUT[Grade input]
    INPUT --> SAVE[Create or update grade]
    SAVE --> GRADE[(Grade)]
    GRADE --> CALC[Compute remarks and quarter data]
    CALC --> REPORT[Generate grade report]
    REPORT --> GREP[(GradeReport)]

    STU[Student] --> MINE[View my grades]
    PAR[Parent] --> CHILD[View child grades]
    GREP --> MINE
    GREP --> CHILD
```

---

## 8. Learning Materials, Assignments, And Submissions

### Workflow Summary

1. Teacher or admin uploads learning materials for a classroom.
2. Material files are stored remotely and metadata is saved in `LearningMaterial`.
3. Teacher creates assignments with due dates, classroom, subject, and optional files.
4. Students submit work, which creates `Submission` records.
5. The system flags late submissions based on due date.
6. Teachers review submissions, add grades or feedback, and students can revisit results.

```mermaid
flowchart TD
    TEA[Teacher or Admin] --> MAT[Upload learning material]
    MAT --> MATDB[(LearningMaterial)]

    TEA --> ASG[Create assignment]
    ASG --> ASGDB[(Assignment)]

    STU[Student] --> SUBMIT[Upload submission]
    SUBMIT --> SUBDB[(Submission)]
    ASGDB --> SUBDB

    TEA --> REVIEW[Review submissions]
    REVIEW --> FEED[Add score and feedback]
    FEED --> SUBDB
```

---

## 9. Scheduling And Calendars

### Workflow Summary

1. Admin creates rooms and reusable time slots.
2. Admin creates schedule entries that combine classroom, subject, teacher, room, academic year, and semester.
3. Backend uniqueness rules prevent teacher, room, or classroom conflicts for the same time slot.
4. Teachers and students open their schedule views.
5. Parents can view the linked child schedule.
6. Calendar views surface events and portal schedule context.

```mermaid
flowchart TD
    ADM[Admin] --> ROOM[Create room]
    ADM --> SLOT[Create time slot]
    ADM --> BUILD[Create schedule]
    ROOM --> BUILD
    SLOT --> BUILD
    BUILD --> SCH[(Schedule)]
    SCH --> CHECK[Conflict constraints]

    TEA[Teacher] --> TSCHED[My schedule]
    STU[Student] --> SSCHED[Student schedule]
    PAR[Parent] --> PSCHED[Child schedule]
    SCH --> TSCHED
    SCH --> SSCHED
    SCH --> PSCHED
```

---

## 10. Announcements And Comments

### Workflow Summary

1. Admin or authorized staff creates an announcement.
2. Announcement can be saved as draft, published live, pinned, made public, or targeted by audience and classroom.
3. Attachments and event dates can be added.
4. Public visitors see public announcements on the website.
5. Logged-in users see portal announcements based on role and target audience.
6. Users can comment, and read state is tracked per user.

```mermaid
flowchart TD
    ADM[Admin or Staff] --> CREATE[Create announcement]
    CREATE --> TARGET[Set status, audience, classroom targets]
    TARGET --> ANN[(Announcement)]
    CREATE --> ATTACH[(AnnouncementAttachment)]
    ANN --> COMM[(AnnouncementComment)]

    WEB[Public website] --> PULL[Public announcements]
    PORTAL[Portal users] --> FEED[Portal announcement feed]
    ANN --> PULL
    ANN --> FEED
    FEED --> READ[Track read_by]
```

---

## 11. Notifications And Push Delivery

### Workflow Summary

1. System events such as announcements, grades, attendance, fees, messages, or friend requests create `Notification` records.
2. The backend broadcasts new notifications through realtime channels.
3. If web push is enabled, FCM tokens are used to send push notifications.
4. The frontend notification provider shows unread counts, dropdown previews, and the full notifications page.
5. Users mark single items or all items as read.
6. If realtime is unavailable, polling acts as fallback.

```mermaid
flowchart TD
    EVENT[System event] --> NREC[(Notification)]
    NREC --> WS[Realtime broadcast]
    NREC --> FCM[FCM web push]
    FCM --> TOK[(FCMToken)]

    USER[Portal user] --> BELL[Notification UI]
    WS --> BELL
    FCM --> BELL
    BELL --> READ[Mark read or mark all read]
    READ --> NREC
```

---

## 12. Messaging, Friendships, And Moderation

### Workflow Summary

1. Users create friendships or direct/group chat rooms.
2. Participants send text, image, or file messages.
3. Messages support delivery, read state, pinning, replies, edits, and reactions.
4. Reported content creates moderation cases in `ReportedMessage`.
5. Admin reviews reported messages, adds moderator notes, and resolves or dismisses cases.
6. Profile mute and suspension controls can restrict abusive users.

```mermaid
flowchart TD
    USER[Student or Teacher] --> FRIEND[Friend request]
    FRIEND --> FDB[(Friendship)]

    USER --> ROOM[Open or create chat room]
    ROOM --> CR[(ChatRoom)]
    USER --> MSG[Send message]
    MSG --> CM[(ChatMessage)]
    CM --> REACT[(MessageReaction)]

    USER --> REPORT[Report message]
    REPORT --> RM[(ReportedMessage)]
    MOD[Moderator or Admin] --> REVIEW[Moderation review]
    REVIEW --> RM
    REVIEW --> ACTION[Mute, suspend, resolve, dismiss]
```

---

## 13. Parent Portal

### Workflow Summary

1. Parent signs in with a linked parent account.
2. Parent dashboard loads linked children.
3. Parent can open child-specific details for grades, attendance, schedules, and relevant announcements.
4. Parent also receives notifications and public or targeted school updates.
5. Parent account data can be maintained through profile and password settings.

```mermaid
flowchart TD
    PAR[Parent] --> LOGIN[Parent login]
    LOGIN --> DASH[Parent dashboard]
    DASH --> LINK[(ParentLink and linked students)]
    LINK --> CHILD[Choose child]
    CHILD --> GRADES[View grades]
    CHILD --> ATT[View attendance]
    CHILD --> SCH[View schedule]
    CHILD --> ANN[View announcements]
```

---

## 14. Settings, Maintenance Mode, And School Configuration

### Workflow Summary

1. Admin updates school identity, branding, and logo.
2. Admin manages academic years and default academic context.
3. Admin controls enrollment availability and chat permissions.
4. Admin can enable maintenance mode and set the maintenance message.
5. Frontend checks maintenance status on load and periodically afterward.
6. Non-admin users are redirected to the maintenance page while maintenance mode is active.

```mermaid
flowchart TD
    ADM[Admin] --> SET[Settings page]
    SET --> SYS[(SystemSetting)]
    SET --> AY[Academic year management]

    SYS --> ENR[Enrollment open or closed]
    SYS --> CHAT[Chat permissions]
    SYS --> MAIN[Maintenance mode]

    APP[Frontend app] --> CHECK[GET maintenance status]
    CHECK --> SYS
    MAIN --> BLOCK[Show maintenance page to non-admins]
```

---

## 15. Audit Logs, Backups, Analytics, And System Health

### Workflow Summary

1. Important actions such as login, grade edits, attendance activity, moderation, and admin operations are recorded in audit logs.
2. Backup tools let admins trigger and manage database backup records.
3. API request logs and storage analytics support operational reporting.
4. Dashboard stats summarize activity for admins, teachers, students, and parents.
5. System health and metrics pages expose maintenance feed, storage, and service visibility for admins.

```mermaid
flowchart TD
    ACTION[Portal action] --> AUDIT[(AuditLog)]
    ADMINOPS[Admin operations] --> BACK[(DatabaseBackup)]
    APIREQ[API traffic] --> APILOG[(APIRequestLog)]

    AUDIT --> ANALYTICS[Analytics and admin review]
    BACK --> HEALTH[Backups and system health]
    APILOG --> HEALTH
    HEALTH --> ADM[Admin monitoring pages]
```

---

## Cross-System Dependency Flow

```mermaid
flowchart LR
    AUTH[Auth and roles] --> PEOPLE[Users and profiles]
    PEOPLE --> ENROLL[Enrollment]
    ENROLL --> ACADEMICS[Classrooms and subject setup]
    ACADEMICS --> ATT[Attendance]
    ACADEMICS --> GRD[Grades]
    ACADEMICS --> MAT[Materials and assignments]
    ACADEMICS --> SCH[Schedules]

    PEOPLE --> MSG[Messaging]
    PEOPLE --> ANN[Announcements]
    ANN --> NOTIF[Notifications]
    GRD --> NOTIF
    ATT --> NOTIF
    MSG --> NOTIF

    ENROLL --> PARENT[Parent portal]
    GRD --> PARENT
    ATT --> PARENT
    SCH --> PARENT

    SETTINGS[System settings] --> AUTH
    SETTINGS --> ENROLL
    SETTINGS --> MSG
    SETTINGS --> APP[Frontend app behavior]
    APP --> HEALTH[System health and operations]
```

