# Presentation-Friendly System Workflow Overview

This version is optimized for presentations, walkthroughs, and stakeholder reviews.

## Presentation Flow

1. Public-facing experience
2. User access and portal entry
3. Academic operations
4. Communication and engagement
5. Enrollment and parent visibility
6. Governance and system operations

---

## 1. Public-Facing Experience

### What This Covers

- Public website pages
- Website content management
- Public announcements
- Online enrollment entry point

### Workflow

```mermaid
flowchart LR
    VIS[Visitors] --> SITE[Public Website]
    SITE --> CONTENT[Website Content]
    SITE --> NEWS[Public Announcements]
    SITE --> ENROLL[Online Enrollment Form]

    ADM[Admin] --> CMS[Website Content Management]
    CMS --> CONTENTDB[(WebsiteContent)]
    CONTENTDB --> CONTENT

    ADM --> ANN[Announcement Publishing]
    ANN --> ANNDB[(Announcement)]
    ANNDB --> NEWS
```

### Key Message

The webapp starts as a public school website, then directs users into announcements, information pages, and enrollment.

---

## 2. User Access And Portal Entry

### What This Covers

- Login and authentication
- Role-based portal access
- Protected routes
- Password change and onboarding

### Workflow

```mermaid
flowchart LR
    USER[User] --> LOGIN[Login]
    LOGIN --> AUTH[Authentication]
    AUTH --> ROLE[Role Detection]
    ROLE --> ADMIN[Admin Portal]
    ROLE --> TEACHER[Teacher Portal]
    ROLE --> STUDENT[Student Portal]
    ROLE --> PARENT[Parent Portal]

    AUTH --> PROFILE[Profile Load]
    AUTH --> FORCE[Force Password Change]
    AUTH --> ONBOARD[Onboarding Flow]
```

### Key Message

The same login system branches users into the correct workspace based on their role and account state.

---

## 3. Academic Operations

### What This Covers

- Academic years and semesters
- Classrooms and subject assignment
- Attendance
- Grades and reports
- Materials, assignments, and submissions
- Scheduling

### Workflow

```mermaid
flowchart TD
    ADM[Admin Setup] --> YEAR[Academic Year / Semester]
    ADM --> CLASS[Classrooms]
    ADM --> SUBJECT[Subjects]
    ADM --> ASSIGN[Teacher-Subject Assignment]
    ADM --> ROOM[Rooms and Time Slots]

    YEAR --> CORE[Academic Structure]
    CLASS --> CORE
    SUBJECT --> CORE
    ASSIGN --> CORE
    ROOM --> CORE

    CORE --> ATT[Attendance]
    CORE --> GRADES[Grades and Reports]
    CORE --> MATERIALS[Materials and Assignments]
    CORE --> SCHED[Schedules]

    TEA[Teacher] --> ATT
    TEA --> GRADES
    TEA --> MATERIALS
    TEA --> SCHED

    STU[Student] --> VIEW1[View Grades]
    STU --> VIEW2[Access Materials]
    STU --> VIEW3[See Schedule]

    GRADES --> VIEW1
    MATERIALS --> VIEW2
    SCHED --> VIEW3
```

### Key Message

Academic setup is the foundation of the portal. Once classes, subjects, and schedules exist, the rest of the learning workflow becomes available.

---

## 4. Communication And Engagement

### What This Covers

- Announcements
- Notifications
- Messaging
- Friend requests
- Moderation and reporting

### Workflow

```mermaid
flowchart LR
    STAFF[Admin / Staff / Teachers] --> POST[Post Announcement]
    POST --> FEED[Portal Announcement Feed]

    USERS[Users] --> CHAT[Messaging]
    CHAT --> ROOM[Chat Rooms]
    CHAT --> MSG[Messages]
    MSG --> REPORT[Report Message]
    REPORT --> MOD[Moderation Review]

    FEED --> NOTIF[Notifications]
    MSG --> NOTIF
    SYSTEM[Grades / Attendance / Fees / System Events] --> NOTIF
    NOTIF --> PUSH[Realtime + Push Alerts]
```

### Key Message

The communication layer keeps users informed through announcements, alerts, and direct messaging, while moderation keeps the environment safe.

---

## 5. Enrollment And Parent Visibility

### What This Covers

- Applicant journey
- Admin review workflow
- Student enrollment completion
- Parent linking and parent dashboard

### Workflow

```mermaid
flowchart TD
    APP[Applicant / Parent] --> FORM[Submit Enrollment Application]
    FORM --> DOCS[Upload Requirements]
    DOCS --> REVIEW[Admin Review]
    REVIEW --> VERIFY[Verify Documents]
    VERIFY --> DECISION[Approve or Reject]
    DECISION --> ENROLL[Create Student Account]
    ENROLL --> CLASS[Assign Classroom]
    ENROLL --> LINK[Link Parent Account]

    LINK --> PDASH[Parent Dashboard]
    PDASH --> PGRADES[Child Grades]
    PDASH --> PATT[Child Attendance]
    PDASH --> PSCHED[Child Schedule]
```

### Key Message

Enrollment does not end at approval. It continues into account creation, classroom assignment, and parent visibility into the student journey.

---

## 6. Governance And System Operations

### What This Covers

- School settings
- Maintenance mode
- Audit logs
- Backups
- Analytics
- System health

### Workflow

```mermaid
flowchart LR
    ADM[Admin] --> SETTINGS[System Settings]
    SETTINGS --> BRAND[School Branding]
    SETTINGS --> PORTAL[Portal Rules]
    SETTINGS --> MAINT[Maintenance Mode]

    ACTIONS[Portal Actions] --> AUDIT[Audit Logs]
    SYSTEM[System Processes] --> BACKUP[Backups]
    SYSTEM --> HEALTH[System Health]
    SYSTEM --> ANALYTICS[Analytics]

    MAINT --> APP[Portal Access Behavior]
    AUDIT --> ADMVIEW[Admin Monitoring]
    BACKUP --> ADMVIEW
    HEALTH --> ADMVIEW
    ANALYTICS --> ADMVIEW
```

### Key Message

These systems help administrators control the portal, monitor activity, protect data, and keep the platform stable.

---

## One-Slide Executive View

```mermaid
flowchart LR
    A[Public Website] --> B[Authentication]
    B --> C[Role-Based Portal]
    C --> D[Academic Operations]
    C --> E[Communication]
    A --> F[Enrollment]
    F --> C
    F --> G[Parent Portal]
    C --> H[Admin Governance]
```

### Summary

- The public website attracts, informs, and receives applicants.
- Authentication moves each user into the correct role-based portal.
- Academic operations power teaching, grading, materials, and scheduling.
- Communication systems keep the school community connected.
- Enrollment connects applicants, students, classrooms, and parents.
- Governance systems keep the platform manageable and secure.

