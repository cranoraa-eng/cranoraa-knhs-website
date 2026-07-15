# Full Model Breakdown

This document gives a detailed breakdown of the backend data models used in the webapp.

## Model Sources

- `backend/accounts/models.py`
- `backend/portal/models.py`

## How To Read This

Each model section includes:

- Purpose
- Main fields
- Relationships
- System role

---

# 1. Accounts App Models

## 1. User

### Purpose

This is the custom authentication model for the whole system. It extends Django's `AbstractUser` and becomes the main identity record for admins, teachers, students, and parents.

### Main Fields

- `username`: primary login identifier
- `email`: unique email, optional but commonly used
- `role`: determines whether the user is an admin, teacher, student, or parent
- `is_verified`: indicates verification status
- `is_approved`: indicates whether the account is approved for use
- `last_activity`: used to determine online presence
- `must_change_password`: forces password reset after initial account issue
- `account_status`: supports states like active, inactive, suspended, and pending reset

### Relationships

- One-to-one with `Profile`
- One-to-one with `OnboardingState`
- Referenced by almost every operational model in the system

### System Role

This is the root model for access control, permissions, dashboard routing, and user ownership across the whole platform.

---

## 2. OnboardingState

### Purpose

Stores tutorial and onboarding progress for a user.

### Main Fields

- `user`: linked account
- `role`: role snapshot used for onboarding content
- `has_seen_welcome`: whether welcome screen was shown
- `completed_tutorials`: list of finished tutorials
- `skipped_tutorials`: list of skipped tutorials
- `dismissed_tips`: hidden contextual tips
- `checklist_progress`: progress tracker for onboarding checklist
- `last_tutorial`, `last_step_id`: helps resume onboarding
- `metadata`: extra flexible storage

### Relationships

- One-to-one with `User`

### System Role

Supports guided tours, tutorials, first-run experience, and contextual help.

---

## 3. OTP

### Purpose

Stores one-time password records for signup and password reset flows.

### Main Fields

- `user`: owner of the OTP
- `hashed_code`: stored hashed version of the OTP
- `otp_type`: signup or password reset
- `expires_at`: expiration timestamp
- `is_used`: prevents reuse

### Relationships

- Many OTP records can belong to one `User`

### System Role

Used in account verification and secure recovery workflows.

---

## 4. Profile

### Purpose

Stores extended personal and school-specific information that does not belong directly in the `User` table.

### Main Fields

- `user`: linked account
- `lrn`: learner reference number for students
- `title`: teacher honorific
- `grade_level`: student grade level
- `employee_id`: teacher identifier
- `phone_number`, `address`, `date_of_birth`
- `registration_number`: student registration number
- `profile_picture`: stored profile image URL
- `sex`, `state`, `nationality`, `middle_name`
- `father_name`, `mother_name`, `contact_information`
- `mute_until`, `is_suspended`: moderation fields
- `linked_students`: students connected to a parent profile

### Relationships

- One-to-one with `User`
- Many-to-many from parent profile to student users through `linked_students`

### System Role

Acts as the detailed identity layer for users and enables parent-student linking plus moderation flags.

---

## 5. Classroom

### Purpose

Represents a homeroom or class section.

### Main Fields

- `name`: section name
- `description`
- `grade_level`
- `capacity`: student limit
- `teacher`: advisory teacher
- `academic_year`
- `semester`
- `created_at`, `updated_at`

### Relationships

- Advisory `teacher` is a `User`
- Linked to `portal.AcademicYear`
- Linked to `portal.Semester`
- Referenced by enrollments, subjects, attendance, materials, announcements, assignments, schedules, grades, and reports

### System Role

This is one of the core academic container models in the system.

---

## 6. ChatRoom

### Purpose

Represents a messaging room, either direct or group-based.

### Main Fields

- `name`: optional room name
- `is_group`: distinguishes group chat from direct chat
- `participants`: users in the room
- `pinned_by`: users who pinned the room
- `created_by`
- `last_action_type`, `last_action_sender`, `last_action_content`

### Relationships

- Many-to-many with `User` through participants
- Many-to-many with `User` through pinned state
- One-to-many with `ChatMessage`

### System Role

Provides the container for all chat conversations.

---

## 7. ChatMessage

### Purpose

Stores a single message inside a chat room.

### Main Fields

- `room`
- `sender`
- `content`
- `message_type`: text, image, or file
- `attachment_url`, `attachment_filename`, `attachment_content_type`
- `file_size_bytes`
- `timestamp`
- `is_delivered`, `is_read`, `is_pinned`, `is_edited`
- `parent_message`: reply support

### Relationships

- Belongs to one `ChatRoom`
- Sent by one `User`
- Can reference another `ChatMessage` for replies
- Has related `MessageReaction`
- Has related `ReportedMessage`

### System Role

This is the main record for messaging activity.

---

## 8. MessageReaction

### Purpose

Stores emoji reactions on chat messages.

### Main Fields

- `message`
- `user`
- `emoji`
- `created_at`

### Relationships

- Many reactions can belong to one `ChatMessage`
- One user can react to many messages

### System Role

Adds lightweight social interaction inside chat.

---

## 9. ReportedMessage

### Purpose

Stores moderation reports filed against messages.

### Main Fields

- `message`: original message, optional to preserve reports even after deletion
- `reported_user`
- `message_content_snapshot`
- `reporter`
- `reason`
- `status`: pending, resolved, dismissed
- `moderator_note`
- `resolved_by`
- `created_at`, `resolved_at`

### Relationships

- Linked to `ChatMessage`
- Linked to reporting `User`
- Linked to reported `User`
- Linked to resolving moderator `User`

### System Role

This is the moderation case record for chat abuse handling.

---

## 10. Friendship

### Purpose

Tracks friend requests and accepted friend connections between users.

### Main Fields

- `from_user`
- `to_user`
- `status`: pending, accepted, rejected
- `is_pinned_by_from`
- `is_pinned_by_to`
- `created_at`, `updated_at`

### Relationships

- Both ends point to `User`

### System Role

Supports private messaging and social connection workflows.

---

## 11. Subject

### Purpose

Represents an academic subject offered by the school.

### Main Fields

- `name`
- `code`
- `description`
- `grade_level`
- `created_at`, `updated_at`

### Relationships

- Linked to classrooms through `ClassroomSubject`
- Referenced by assignments, grades, and schedules

### System Role

This is the academic subject catalog.

---

## 12. ClassroomSubject

### Purpose

Maps a subject to a classroom and assigns the teacher responsible for it.

### Main Fields

- `classroom`
- `subject`
- `teacher`
- `assigned_at`
- `ww_weight`, `pt_weight`, `qa_weight`: grading component weights

### Relationships

- Belongs to one `Classroom`
- Belongs to one `Subject`
- Belongs to one teacher `User`

### System Role

This is the bridge that turns subjects into actual teachable class offerings.

---

## 13. SystemSetting

### Purpose

Stores global portal configuration.

### Main Fields

- `site_name`, `school_address`, `school_phone`, `school_email`
- `school_logo`
- `primary_color`, `secondary_color`
- `maintenance_mode`, `maintenance_message`
- `enrollment_open`
- `current_quarter`
- `academic_year`
- `allow_student_chat`, `allow_teacher_chat`
- `updated_at`

### Relationships

- Standalone singleton-style configuration model

### System Role

Controls branding, maintenance, enrollment access, and communication permissions.

---

## 14. StudentClassEnrollment

### Purpose

Connects a student user to a classroom and stores quarter summary grades and GPA-like values.

### Main Fields

- `student`
- `classroom`
- `q1`, `q2`, `q3`, `q4`
- `gpa`
- `enrolled_at`, `updated_at`

### Relationships

- Belongs to one student `User`
- Belongs to one `Classroom`

### System Role

Represents official class membership and supports academic averaging.

---

## 15. Announcement

### Purpose

Stores portal and public announcements with targeting and publishing options.

### Main Fields

- `title`, `content`
- `category`
- `priority`
- `status`: draft, live, expired
- `target_audience`
- `target_classrooms`
- `author`
- `is_pinned`
- `is_public`
- `event_date`, `end_date`
- `attachment`
- `read_by`
- `created_at`, `updated_at`

### Relationships

- Belongs to author `User`
- Many-to-many with `Classroom` through `target_classrooms`
- Many-to-many with `User` through `read_by`
- Has related `AnnouncementAttachment`
- Has related `AnnouncementComment`

### System Role

Drives school-wide communication across the portal and public website.

---

## 16. AnnouncementAttachment

### Purpose

Stores metadata for files attached to announcements.

### Main Fields

- `announcement`
- `file`
- `filename`
- `file_size_bytes`
- `content_type`
- `uploaded_at`

### Relationships

- Belongs to one `Announcement`

### System Role

Supports downloadable files and media in announcement posts.

---

## 17. AnnouncementComment

### Purpose

Stores comments attached to announcements.

### Main Fields

- `announcement`
- `author`
- `content`
- `created_at`, `updated_at`

### Relationships

- Belongs to one `Announcement`
- Belongs to one author `User`

### System Role

Adds interaction and discussion under portal announcements.

---

## 18. Attendance

### Purpose

Stores per-student daily attendance records.

### Main Fields

- `student`
- `classroom`
- `date`
- `status`: present, absent, late, excused
- `remarks`
- `marked_by`
- `created_at`, `updated_at`

### Relationships

- Belongs to student `User`
- Belongs to `Classroom`
- Marked by another `User`

### System Role

Supports daily attendance tracking, summaries, and parent visibility.

---

## 19. LearningMaterial

### Purpose

Stores lesson resources and teaching files.

### Main Fields

- `title`, `description`
- `material_type`
- `classroom`
- `uploaded_by`
- `file`
- `file_size_bytes`
- `original_filename`
- `quarter`, `week`
- `created_at`, `updated_at`

### Relationships

- Optional link to one `Classroom`
- Uploaded by one `User`

### System Role

Used for instructional content distribution to classes.

---

## 20. ScratchCard

### Purpose

Stores scratch card records associated with students.

### Main Fields

- `serial_number`
- `student`
- `is_used`
- `used_at`
- `created_at`

### Relationships

- Belongs to one student `User`

### System Role

Supports result checking or controlled access workflows tied to serial numbers.

---

## 21. Fee

### Purpose

Tracks student payment obligations and status.

### Main Fields

- `student`
- `fee_type`
- `amount`
- `amount_paid`
- `status`
- `due_date`
- `paid_date`
- `description`
- `created_at`, `updated_at`

### Relationships

- Belongs to one student `User`

### System Role

Supports billing reminders, pending fee checks, and payment status views.

---

## 22. Notification

### Purpose

Stores user-facing alerts generated by different system events.

### Main Fields

- `recipient`
- `notification_type`
- `title`
- `message`
- `is_read`
- `link`
- `created_at`

### Relationships

- Belongs to one recipient `User`

### System Role

Acts as the central alert model for announcements, grades, attendance, messages, fees, and system notices.

---

## 23. FCMToken

### Purpose

Stores Firebase Cloud Messaging tokens for push notifications.

### Main Fields

- `user`
- `token`
- `device_type`
- `is_active`
- `created_at`, `updated_at`

### Relationships

- Belongs to one `User`

### System Role

Enables push notifications for web and mobile devices.

---

## 24. EnrollmentApplication

### Purpose

Stores the full online application submitted by a prospective or returning student.

### Main Fields

- `enrollment_number`
- `enrollment_type`
- `school_year`
- applicant identity fields such as `first_name`, `last_name`, `middle_name`, `sex`, `date_of_birth`
- address fields such as `street_address`, `barangay`, `city_municipality`, `province`
- family and guardian fields
- academic fields such as `grade_level`, `strand`, `previous_school`, `lrn`
- uploaded document URLs
- contact and emergency contact fields
- `enrolled_student`
- `assigned_classroom`
- `temp_password_display`
- `linked_parent`
- `status`
- `remarks`
- `reviewed_by`
- `submitted_at`, `updated_at`, `reviewed_at`

### Relationships

- Can link to enrolled student `User`
- Can link to assigned `Classroom`
- Can link to parent `User`
- Can link to reviewing admin `User`
- Has related `EnrollmentDocument`
- Has related `EnrollmentStatusHistory`
- Has related `ParentLink`

### System Role

This is the central admissions workflow model.

---

## 25. EnrollmentDocument

### Purpose

Stores uploaded application documents as separate records with verification state.

### Main Fields

- `application`
- `document_type`
- `file_url`
- `file_name`
- `verification_status`
- `admin_notes`
- `uploaded_at`, `updated_at`

### Relationships

- Belongs to one `EnrollmentApplication`

### System Role

Supports document checking, verification, and admissions completeness tracking.

---

## 26. EnrollmentStatusHistory

### Purpose

Stores the timeline of application status changes.

### Main Fields

- `application`
- `from_status`
- `to_status`
- `changed_by`
- `notes`
- `created_at`

### Relationships

- Belongs to one `EnrollmentApplication`
- Changed by one `User`

### System Role

Provides traceability for admissions decisions and workflow progress.

---

## 27. ParentLink

### Purpose

Represents an explicit link between a parent account and a student account.

### Main Fields

- `parent`
- `student`
- `application`
- `relationship`
- `is_primary`
- `created_at`, `updated_at`

### Relationships

- Belongs to parent `User`
- Belongs to student `User`
- Belongs to `EnrollmentApplication`

### System Role

Connects parent accounts to student records for dashboard visibility.

---

## 28. WebsiteContent

### Purpose

Stores editable content blocks used by public website pages.

### Main Fields

- `section`
- `category`
- `content`
- `image`
- `updated_at`
- `updated_by`

### Relationships

- Updated by one `User`

### System Role

Acts as the CMS content table for the public-facing website.

---

## 29. Assignment

### Purpose

Stores class assignment records created by teachers.

### Main Fields

- `title`, `description`
- `classroom`
- `subject`
- `teacher`
- `file`
- `original_filename`
- `file_size_bytes`
- `due_date`
- `points`
- `created_at`, `updated_at`

### Relationships

- Belongs to `Classroom`
- Belongs to `Subject`
- Belongs to teacher `User`
- Has related `Submission`

### System Role

Represents work issued to students for completion.

---

## 30. Submission

### Purpose

Stores a student's assignment submission.

### Main Fields

- `assignment`
- `student`
- `file`
- `original_filename`
- `file_size_bytes`
- `submitted_at`
- `grade`
- `feedback`
- `is_late`

### Relationships

- Belongs to one `Assignment`
- Belongs to one student `User`

### System Role

Tracks student work submission, grading, and feedback.

---

## 31. Grade

### Purpose

Stores subject-level grade entries for students.

### Main Fields

- `student`
- `subject`
- `classroom`
- `teacher`
- `grade_type`
- `quarter`
- `raw_score`
- `total_score`
- `final_grade`
- `remarks`
- `computed_remarks`
- `academic_year`
- `submitted_at`, `updated_at`
- `is_locked`

### Relationships

- Belongs to one student `User`
- Belongs to one `Subject`
- Optionally belongs to one `Classroom`
- Belongs to one teacher `User`

### System Role

This is the detailed grade-entry model used for academic assessment.

---

## 32. Room

### Purpose

Represents a physical room or teaching location.

### Main Fields

- `name`
- `building`
- `capacity`
- `room_type`
- `is_active`
- `created_at`

### Relationships

- Referenced by `Schedule`

### System Role

Part of timetable and resource allocation management.

---

## 33. TimeSlot

### Purpose

Defines a reusable scheduled time block.

### Main Fields

- `day`
- `start_time`
- `end_time`
- `label`

### Relationships

- Referenced by `Schedule`

### System Role

Used to standardize the timetable structure.

---

## 34. Schedule

### Purpose

Represents one scheduled class session entry.

### Main Fields

- `classroom`
- `subject`
- `teacher`
- `room`
- `time_slot`
- `academic_year`
- `semester`
- `is_active`
- `notes`
- `created_at`, `updated_at`

### Relationships

- Belongs to `Classroom`
- Belongs to `Subject`
- Belongs to teacher `User`
- Belongs to optional `Room`
- Belongs to `TimeSlot`
- Belongs to `portal.AcademicYear`
- Belongs to optional `portal.Semester`

### System Role

This is the main timetable model and includes conflict protection rules.

---

## 35. GradeReport

### Purpose

Stores generated quarter-level summary reports for a student in a classroom.

### Main Fields

- `student`
- `classroom`
- `quarter`
- `school_year`
- `general_average`
- `total_subjects`
- `passed_subjects`
- `failed_subjects`
- `overall_remarks`
- `class_rank`
- `generated_at`
- `generated_by`
- `is_final`

### Relationships

- Belongs to one student `User`
- Belongs to one `Classroom`
- Generated by one `User`

### System Role

Used for summarized reporting after detailed grades have been entered.

---

# 2. Portal App Models

## 36. portal.Announcement

### Purpose

A simpler announcement model used by the `portal` app.

### Main Fields

- `title`
- `content`
- `created_at`, `updated_at`
- `is_active`
- `author`

### Relationships

- Belongs to author `User`

### System Role

This appears to support the older or simpler portal announcement endpoints, separate from the richer `accounts.Announcement` model.

---

## 37. SchoolClass

### Purpose

Represents a class record in the `portal` app.

### Main Fields

- `name`
- `grade_level`
- `section`
- `adviser`
- `capacity`
- `created_at`, `updated_at`

### Relationships

- Adviser points to `User`

### System Role

This is another class-related model, likely part of an older or alternate admin structure beside `accounts.Classroom`.

---

## 38. Department

### Purpose

Represents an academic or administrative department.

### Main Fields

- `name`
- `code`
- `head`
- `description`
- `created_at`, `updated_at`

### Relationships

- Department head points to `User`

### System Role

Supports organizational structure and administrative grouping.

---

## 39. AcademicYear

### Purpose

Represents one school year.

### Main Fields

- `name`
- `start_date`
- `end_date`
- `is_active`
- `is_archived`
- `created_at`, `updated_at`

### Relationships

- Has related `Semester`
- Referenced by `accounts.Classroom`
- Referenced by `accounts.Schedule`

### System Role

This is the core timeline model for academic organization.

---

## 40. Semester

### Purpose

Represents a semester inside an academic year.

### Main Fields

- `academic_year`
- `semester_type`
- `start_date`
- `end_date`
- `is_active`
- `created_at`, `updated_at`

### Relationships

- Belongs to `AcademicYear`
- Referenced by `accounts.Classroom`
- Referenced by `accounts.Schedule`

### System Role

Adds sub-period structure for semester-based academic planning.

---

## 41. AuditLog

### Purpose

Stores administrative and operational audit events.

### Main Fields

- `user`
- `action`
- `action_type`
- `model_name`
- `object_id`
- `object_repr`
- `description`
- `ip_address`
- `user_agent`
- `timestamp`

### Relationships

- Optional link to acting `User`

### System Role

Used for traceability, accountability, and monitoring of important actions.

---

## 42. DatabaseBackup

### Purpose

Stores metadata about generated backups.

### Main Fields

- `filename`
- `size`
- `created_at`
- `created_by`

### Relationships

- Created by one `User`

### System Role

Supports backup history and backup management pages.

---

## 43. APIRequestLog

### Purpose

Stores API traffic metrics.

### Main Fields

- `endpoint`
- `method`
- `status_code`
- `response_time_ms`
- `ip_address`
- `user`
- `timestamp`

### Relationships

- Optional link to requesting `User`

### System Role

Supports analytics, performance tracking, and system health reporting.

---

# 3. Important Design Notes

## Core Identity Layer

The most important user-related models are:

- `User`
- `Profile`
- `OnboardingState`
- `ParentLink`

These models define who the user is, how they access the portal, and how they are connected to others.

## Core Academic Layer

The main academic structure is built from:

- `AcademicYear`
- `Semester`
- `Classroom`
- `Subject`
- `ClassroomSubject`
- `StudentClassEnrollment`

These models define the school structure before attendance, grades, or schedules can work.

## Core Learning Layer

The main learning execution models are:

- `Attendance`
- `Grade`
- `GradeReport`
- `LearningMaterial`
- `Assignment`
- `Submission`
- `Schedule`

These models represent day-to-day teaching and student progress.

## Core Communication Layer

The communication stack is made up of:

- `Announcement`
- `AnnouncementAttachment`
- `AnnouncementComment`
- `Notification`
- `FCMToken`
- `ChatRoom`
- `ChatMessage`
- `MessageReaction`
- `ReportedMessage`
- `Friendship`

These handle broadcast communication, alerts, chat, and moderation.

## Core Admissions Layer

The admissions workflow depends on:

- `EnrollmentApplication`
- `EnrollmentDocument`
- `EnrollmentStatusHistory`
- `ParentLink`

These models turn a public applicant into an enrolled student and linked parent account.

