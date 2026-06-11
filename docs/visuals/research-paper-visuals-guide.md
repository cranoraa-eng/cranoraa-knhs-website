# Research Paper Visuals Guide

This file lists the visuals needed for the research paper and breaks each one down into specific parts.

## Required Visual Set

- 1 architecture diagram
- 1 use case diagram
- 1 ERD
- 3 to 5 workflow diagrams
- 4 to 6 UI screenshots
- 1 deployment/data flow diagram

---

## 1. Architecture Diagram

### Title Suggestion

**Figure 1. Overall System Architecture of the School Web Application**

### Purpose

This diagram explains the major technical parts of the system and how they connect.

### Specific Parts To Show

- **Client side**
  - Public website
  - Portal frontend
  - Browser/PWA access
- **Frontend layer**
  - React
  - Vite
  - React Router
- **Backend layer**
  - Django
  - Django REST API
  - Authentication and permissions
- **Database layer**
  - SQLite or production database
  - Core models such as users, classrooms, grades, attendance, enrollment
- **External services**
  - Firebase Cloud Messaging
  - File/storage service for uploads
- **Main user roles**
  - Admin
  - Teacher
  - Student
  - Parent
  - Applicant

### What The Connections Should Show

- User accesses frontend through browser
- Frontend sends requests to Django API
- API reads and writes database records
- API sends notifications through FCM
- API stores uploaded files in storage service

### Best Source From Your Project

- [App.jsx](file:///C:/Users/dragon/Desktop/AI-made%20Website/frontend/src/App.jsx)
- [accounts/models.py](file:///C:/Users/dragon/Desktop/AI-made%20Website/backend/accounts/models.py)
- [school_portal/urls.py](file:///C:/Users/dragon/Desktop/AI-made%20Website/backend/school_portal/urls.py)
- [accounts/urls.py](file:///C:/Users/dragon/Desktop/AI-made%20Website/backend/accounts/urls.py)

---

## 2. Use Case Diagram

### Title Suggestion

**Figure 2. Use Case Diagram of the School Portal**

### Purpose

This diagram shows what each type of user can do in the system.

### Actors To Include

- Applicant
- Admin
- Teacher
- Student
- Parent

### Specific Use Cases To Show

- **Applicant**
  - Submit enrollment application
  - Upload requirements
  - Track enrollment status
- **Admin**
  - Manage users
  - Manage classrooms
  - Assign subjects
  - Approve enrollment
  - Manage announcements
  - Monitor system health
  - Manage website content
  - Manage backups and audit logs
- **Teacher**
  - Mark attendance
  - Input grades
  - Upload materials
  - Manage assignments
  - View class members
  - Send messages
- **Student**
  - View grades
  - View attendance
  - Access materials
  - View schedule
  - Receive announcements
  - Send messages
- **Parent**
  - View child grades
  - View child attendance
  - View child schedule
  - Receive notifications

### Best Source From Your Project

- [Layout.jsx](file:///C:/Users/dragon/Desktop/AI-made%20Website/frontend/src/components/Layout.jsx)
- [App.jsx](file:///C:/Users/dragon/Desktop/AI-made%20Website/frontend/src/App.jsx)
- [accounts/models.py](file:///C:/Users/dragon/Desktop/AI-made%20Website/backend/accounts/models.py)

---

## 3. ERD

### Title Suggestion

**Figure 3. Entity Relationship Diagram of the System Database**

### Purpose

This diagram shows the data structure and relationships between the major models.

### Specific Entities To Include

- **Identity**
  - User
  - Profile
  - OnboardingState
- **Academic structure**
  - Classroom
  - Subject
  - ClassroomSubject
  - StudentClassEnrollment
  - AcademicYear
  - Semester
- **Academic operations**
  - Attendance
  - Grade
  - GradeReport
  - LearningMaterial
  - Assignment
  - Submission
  - Schedule
  - Room
  - TimeSlot
- **Communication**
  - Announcement
  - AnnouncementAttachment
  - AnnouncementComment
  - Notification
  - ChatRoom
  - ChatMessage
  - MessageReaction
  - ReportedMessage
  - Friendship
- **Admissions**
  - EnrollmentApplication
  - EnrollmentDocument
  - EnrollmentStatusHistory
  - ParentLink
- **System**
  - SystemSetting
  - AuditLog
  - DatabaseBackup
  - APIRequestLog
  - WebsiteContent

### Specific Relationships To Show

- User to Profile
- User to Classroom as teacher
- Classroom to StudentClassEnrollment
- Classroom to Subject through ClassroomSubject
- Grade to Student, Subject, Classroom, Teacher
- Attendance to Student and Classroom
- Assignment to Classroom and Subject
- Submission to Assignment and Student
- EnrollmentApplication to EnrollmentDocument and ParentLink
- ParentLink between parent User and student User
- Schedule to Classroom, Subject, Teacher, Room, TimeSlot
- Announcement to User, Classroom, Comment, Attachment

### Best Source From Your Project

- [accounts/models.py](file:///C:/Users/dragon/Desktop/AI-made%20Website/backend/accounts/models.py)
- [portal/models.py](file:///C:/Users/dragon/Desktop/AI-made%20Website/backend/portal/models.py)
- [full-model-breakdown.md](file:///C:/Users/dragon/Desktop/AI-made%20Website/docs/visuals/full-model-breakdown.md)

---

## 4. Workflow Diagrams

You need **3 to 5** workflow diagrams. The best set for this project is:

- Enrollment workflow
- Academic management workflow
- Attendance and grading workflow
- Messaging and moderation workflow
- Notification and announcement workflow

### 4.1 Enrollment Workflow

#### Title Suggestion

**Figure 4. Enrollment and Admission Workflow**

#### Specific Parts To Show

- Applicant opens enrollment form
- Applicant fills out details
- Applicant uploads requirements
- Application is submitted
- Admin reviews application
- Admin verifies or rejects documents
- Admin approves or rejects application
- Student account is created
- Classroom is assigned
- Parent account is linked

#### Main Models

- `EnrollmentApplication`
- `EnrollmentDocument`
- `EnrollmentStatusHistory`
- `ParentLink`
- `User`
- `Classroom`

---

### 4.2 Academic Management Workflow

#### Title Suggestion

**Figure 5. Academic Setup Workflow**

#### Specific Parts To Show

- Admin creates academic year
- Admin creates semester
- Admin creates classroom
- Admin creates subject
- Admin assigns subject to classroom
- Admin assigns teacher
- Students are enrolled into classroom

#### Main Models

- `AcademicYear`
- `Semester`
- `Classroom`
- `Subject`
- `ClassroomSubject`
- `StudentClassEnrollment`

---

### 4.3 Attendance And Grading Workflow

#### Title Suggestion

**Figure 6. Attendance and Grade Processing Workflow**

#### Specific Parts To Show

- Teacher selects classroom
- Teacher loads enrolled students
- Teacher marks attendance
- Teacher inputs grades
- System computes remarks
- Reports are generated
- Students and parents view results

#### Main Models

- `Attendance`
- `Grade`
- `GradeReport`
- `StudentClassEnrollment`
- `Classroom`
- `Subject`

---

### 4.4 Messaging And Moderation Workflow

#### Title Suggestion

**Figure 7. Messaging and Moderation Workflow**

#### Specific Parts To Show

- User opens chat room
- User sends message
- Message is stored
- Other user receives message
- User reacts or replies
- User reports abusive content
- Moderator reviews report
- Moderator resolves, dismisses, mutes, or suspends

#### Main Models

- `ChatRoom`
- `ChatMessage`
- `MessageReaction`
- `ReportedMessage`
- `Friendship`
- `User`

---

### 4.5 Announcement And Notification Workflow

#### Title Suggestion

**Figure 8. Announcement and Notification Workflow**

#### Specific Parts To Show

- Admin creates announcement
- Target audience is selected
- Announcement is published
- Notification is created
- Realtime broadcast is triggered
- Push notification is sent
- User opens announcement
- User marks it as read

#### Main Models

- `Announcement`
- `AnnouncementAttachment`
- `AnnouncementComment`
- `Notification`
- `FCMToken`
- `User`

---

## 5. UI Screenshots

You need **4 to 6** screenshots. The best set is below.

### 5.1 Homepage Screenshot

#### Title Suggestion

**Figure 9. Public Homepage of the School Web Application**

#### What To Capture

- Hero section
- School branding
- Public navigation
- News or announcements preview

#### Why It Matters

Shows the public-facing side of the system.

#### Best Source Page

- [HomeDepEd.jsx](file:///C:/Users/dragon/Desktop/AI-made%20Website/frontend/src/pages/HomeDepEd.jsx)

---

### 5.2 Admin Dashboard Screenshot

#### Title Suggestion

**Figure 10. Administrator Dashboard**

#### What To Capture

- Summary cards
- Key admin metrics
- Navigation sidebar
- Quick monitoring widgets

#### Why It Matters

Shows system control and management features.

#### Best Source Page

- [AdminDashboard.jsx](file:///C:/Users/dragon/Desktop/AI-made%20Website/frontend/src/pages/dashboards/AdminDashboard.jsx)

---

### 5.3 Enrollment Management Screenshot

#### Title Suggestion

**Figure 11. Enrollment Management Interface**

#### What To Capture

- Application list
- Status indicators
- Review controls
- Approval/rejection actions

#### Why It Matters

Shows the admissions processing feature.

#### Best Source Page

- [EnrollmentManagement.jsx](file:///C:/Users/dragon/Desktop/AI-made%20Website/frontend/src/pages/EnrollmentManagement.jsx)

---

### 5.4 Grade Management Or Grade Input Screenshot

#### Title Suggestion

**Figure 12. Grade Input and Management Module**

#### What To Capture

- Class or subject selectors
- Student list
- Grade fields
- Submission/save action

#### Why It Matters

Shows the academic evaluation feature.

#### Best Source Pages

- [GradeInput.jsx](file:///C:/Users/dragon/Desktop/AI-made%20Website/frontend/src/pages/GradeInput.jsx)
- [GradeManagement.jsx](file:///C:/Users/dragon/Desktop/AI-made%20Website/frontend/src/pages/GradeManagement.jsx)

---

### 5.5 Attendance Module Screenshot

#### Title Suggestion

**Figure 13. Attendance Monitoring Interface**

#### What To Capture

- Classroom selector
- Date selector
- Student roster
- Attendance status controls

#### Why It Matters

Shows daily classroom monitoring.

#### Best Source Page

- [Attendance.jsx](file:///C:/Users/dragon/Desktop/AI-made%20Website/frontend/src/pages/Attendance.jsx)

---

### 5.6 Messaging Interface Screenshot

#### Title Suggestion

**Figure 14. Portal Messaging Interface**

#### What To Capture

- Chat list
- Conversation area
- Message input
- Moderation/report option if visible

#### Why It Matters

Shows communication and collaboration features.

#### Best Source Page

- [Messages.jsx](file:///C:/Users/dragon/Desktop/AI-made%20Website/frontend/src/pages/Messages.jsx)

---

## 6. Deployment Or Data Flow Diagram

### Title Suggestion

**Figure 15. Deployment and Data Flow of the System**

### Purpose

This visual explains where the system runs and how data travels between components.

### Specific Parts To Show

- **User device**
  - Browser
  - Mobile/PWA access
- **Frontend host**
  - React frontend
- **Backend host**
  - Django application
  - REST API
- **Database**
  - Main relational database
- **Storage**
  - File uploads for profile pictures, materials, attachments, submissions, enrollment documents
- **Push service**
  - Firebase Cloud Messaging

### Specific Data Flows To Show

- Login requests from frontend to backend
- Data retrieval from backend to database
- File upload from frontend to backend then storage
- Notification creation from backend to FCM then user device
- Admin actions from frontend to backend to database

### Best Source From Your Project

- [accounts/models.py](file:///C:/Users/dragon/Desktop/AI-made%20Website/backend/accounts/models.py)
- [accounts/urls.py](file:///C:/Users/dragon/Desktop/AI-made%20Website/backend/accounts/urls.py)
- [Layout.jsx](file:///C:/Users/dragon/Desktop/AI-made%20Website/frontend/src/components/Layout.jsx)

---

## 7. Recommended Order In The Research Paper

### Chapter 3 Or System Design

- Figure 1. Architecture Diagram
- Figure 2. Use Case Diagram
- Figure 3. ERD
- Figure 4 to Figure 8. Workflow Diagrams
- Figure 15. Deployment/Data Flow Diagram

### Chapter 4 Or Implementation / Results

- Figure 9. Homepage Screenshot
- Figure 10. Admin Dashboard Screenshot
- Figure 11. Enrollment Management Screenshot
- Figure 12. Grade Module Screenshot
- Figure 13. Attendance Screenshot
- Figure 14. Messaging Screenshot

---

## 8. Minimum Final Visual Package

If you want the cleanest final set, use exactly these:

- **Architecture diagram**
  - Overall system architecture
- **Use case diagram**
  - Applicant, admin, teacher, student, parent
- **ERD**
  - Core system models and relationships
- **Workflow diagrams**
  - Enrollment
  - Academic setup
  - Attendance and grading
  - Messaging and moderation
  - Announcement and notification
- **UI screenshots**
  - Homepage
  - Admin dashboard
  - Enrollment management
  - Grade input/management
  - Attendance
  - Messaging
- **Deployment/data flow diagram**
  - Client, frontend, backend, database, storage, FCM

---

## 9. Output Checklist

Before finalizing the paper, make sure each visual has:

- Figure number
- Clear title
- Short caption
- Readable labels
- Consistent colors and style
- Matching terminology with the paper text
- High enough resolution for printing or PDF export

