# Requirements Document

## Introduction

This document covers bug fixes and UX improvements for the ClassroomHub page, spanning two source files: `frontend/src/pages/ClassroomHub.jsx` and `frontend/src/pages/ClassroomHub/EmbeddedViews.jsx`. The changes address thirteen discrete issues grouped into bug fixes (items 1–7) and UX/design improvements (items 8–13). The goal is to produce a more reliable, accessible, and mobile-friendly classroom management interface while keeping the existing data model and API contract intact.

## Glossary

- **ClassroomHub**: The React page component at `frontend/src/pages/ClassroomHub.jsx` that lists a teacher's or student's classrooms and renders a detail view per classroom.
- **EmbeddedViews**: The React module at `frontend/src/pages/ClassroomHub/EmbeddedViews.jsx` that exports `GradeManagementView`, `AttendanceView`, and `AnalyticsView`.
- **GradeInputView**: The inline `GradeInputView` component inside `ClassroomHub.jsx` used by teachers to enter new grades.
- **GradeManagementView**: The exported component in `EmbeddedViews.jsx` used by teachers to review, edit, and delete existing grades.
- **AttendanceView**: The exported component in `EmbeddedViews.jsx` used by teachers to mark and submit attendance.
- **Modal**: The existing modal component located in `frontend/src/components/ui` used throughout the portal for confirmation and input dialogs.
- **API**: The Axios wrapper at `frontend/src/utils/api.js` used for all HTTP calls to the Django backend.
- **Upsert**: An operation that creates a new record via POST when no record exists, or updates an existing record via PUT when one does.
- **existingGrades**: The state map in `GradeInputView` keyed by student ID that holds raw scores already saved for the selected subject/quarter/academic year combination.
- **Enrollment record**: A record returned by `/enrollments/?classroom=<id>` that links a student to a classroom.
- **Announcement endpoint**: The backend REST endpoint `/announcements/` used to create and retrieve classroom announcements.
- **activeTab**: The state variable in `ClassroomHub` that tracks which inner tab (stream, materials, people, grades) is currently displayed.
- **useSearchParams**: The React Router hook already used in `ClassroomHub` to read and write URL query parameters.

---

## Requirements

### Requirement 1 — Replace Browser Dialogs with Modal Component

**User Story:** As a teacher, I want confirmation and input dialogs to match the application's design system, so that the experience is consistent and works correctly in all environments.

#### Acceptance Criteria

1. WHEN the teacher triggers the delete action for a single grade, THE ClassroomHub SHALL display a Modal component requesting confirmation before calling the delete API, instead of using `window.confirm`.
2. WHEN the teacher triggers the "Delete All" action for a quarter, THE ClassroomHub SHALL display a Modal component requesting confirmation before executing the bulk delete loop, instead of using `window.confirm`.
3. WHEN the teacher triggers the "Fill All with Same Grade" action, THE ClassroomHub SHALL display a Modal component with a numeric input field to collect the grade value, instead of using `window.prompt`.
4. IF the teacher dismisses any confirmation or input Modal without confirming, THEN THE ClassroomHub SHALL take no destructive or data-modifying action.
5. THE Modal SHALL be sourced from the existing `components/ui` Modal component and SHALL NOT introduce a new modal implementation.

---

### Requirement 2 — Grade Submission Upsert

**User Story:** As a teacher, I want submitting grades to update existing records rather than create duplicates, so that the grade book stays accurate when I re-enter grades for the same student, subject, and quarter.

#### Acceptance Criteria

1. WHEN the teacher submits a grade for a student whose ID is present in the `existingGrades` map for the selected subject and quarter, THE GradeInputView SHALL send a PUT request to `/grades/<id>/` with the updated `raw_score` instead of a POST request.
2. WHEN the teacher submits a grade for a student whose ID is absent from the `existingGrades` map, THE GradeInputView SHALL send a POST request to `/grades/` to create a new record.
3. THE GradeInputView SHALL store the grade record ID returned by the `/grades/` endpoint in the `existingGrades` map after a successful POST, so that any subsequent submission within the same session uses PUT.
4. IF a PUT or POST request fails, THEN THE GradeInputView SHALL increment the error count and display a toast error message without resetting successfully submitted grades.

---

### Requirement 3 — Attendance Submission Upsert

**User Story:** As a teacher, I want saving attendance to update existing records for the same date rather than create duplicate entries, so that each student has exactly one attendance record per classroom per date.

#### Acceptance Criteria

1. WHEN the teacher opens the AttendanceView for a given date, THE AttendanceView SHALL fetch existing attendance records from `/attendance/?classroom=<id>&date=<date>` and store the record IDs in a map keyed by student ID.
2. WHEN the teacher submits attendance for a student whose record ID exists in the map, THE AttendanceView SHALL send a PUT request to `/attendance/<id>/` with the updated status.
3. WHEN the teacher submits attendance for a student whose record ID is absent from the map, THE AttendanceView SHALL send a POST request to `/attendance/` to create a new record.
4. WHEN the selected date changes, THE AttendanceView SHALL re-fetch existing attendance records and update the attendance record ID map before the teacher can submit.
5. IF a PUT or POST request fails for one or more students, THEN THE AttendanceView SHALL report the count of failures via a toast error message without preventing successful submissions from being saved.

---

### Requirement 4 — Stable fetchGrades Callback in GradeManagementView

**User Story:** As a teacher, I want the grade management view to load grades reliably without infinite re-fetch loops, so that the page remains responsive and does not produce excessive API requests.

#### Acceptance Criteria

1. THE GradeManagementView SHALL wrap the `fetchGrades` function in a `useCallback` hook with a dependency array containing `classroom.id` and `selectedSubject`.
2. WHEN `classroom.id` or `selectedSubject` changes, THE GradeManagementView SHALL call the updated `fetchGrades` function exactly once to reload the grade list.
3. THE GradeManagementView SHALL NOT trigger additional `fetchGrades` calls due to stale closure references or missing dependencies.

---

### Requirement 5 — Remove or Wire the Settings Button

**User Story:** As a teacher, I want every visible UI control to perform an action, so that the interface does not contain dead elements that create confusion.

#### Acceptance Criteria

1. THE ClassroomHub SHALL remove the "Settings" button from the classroom detail header if no settings functionality is implemented.
2. WHERE a settings dialog or route is implemented in a future update, THE ClassroomHub SHALL replace the removed button with a wired button that opens the settings interface.

---

### Requirement 6 — Wire Stream Tab Announcement Input

**User Story:** As a teacher, I want to post announcements from the Stream tab, so that students can see class updates without leaving the ClassroomHub.

#### Acceptance Criteria

1. WHEN the teacher types a message in the Stream tab input field and submits it, THE ClassroomHub SHALL send a POST request to `/announcements/` with the announcement text and the current classroom ID.
2. WHEN an announcement is successfully created, THE ClassroomHub SHALL append the new announcement to the announcements list displayed in the Stream tab.
3. WHEN an announcement is successfully created, THE ClassroomHub SHALL clear the input field.
4. IF the POST request to `/announcements/` fails, THEN THE ClassroomHub SHALL display a toast error message and preserve the typed text in the input field.
5. WHEN the Stream tab is rendered for a classroom, THE ClassroomHub SHALL fetch existing announcements from `/announcements/?classroom=<id>` and display them in reverse chronological order.
6. WHILE no announcements exist for the classroom, THE ClassroomHub SHALL display the "No announcements yet" empty state.

---

### Requirement 7 — Remove Debug console.log Statements

**User Story:** As a developer, I want production code to be free of debug logging, so that sensitive grade data is not exposed in browser consoles in production environments.

#### Acceptance Criteria

1. THE GradeInputView SHALL remove the `console.log` statement inside `handleSubmit` that logs the grade payload per student.
2. THE ClassroomHub SHALL NOT call `console.log` with grade payloads or student personal data in any code path that executes during normal grade submission.

---

### Requirement 8 — Always-Visible Edit and Delete Actions

**User Story:** As a teacher on a touch device, I want edit and delete buttons to be permanently visible when actions are enabled, so that I can tap them without relying on hover state that does not exist on touchscreens.

#### Acceptance Criteria

1. WHEN `showActions` is true, THE GradeManagementView SHALL render the edit and delete buttons for each grade cell as permanently visible elements, not hidden behind an `opacity-0 group-hover:opacity-100` CSS class.
2. WHEN `showActions` is false, THE GradeManagementView SHALL hide the edit and delete buttons for all grade cells.
3. THE GradeManagementView SHALL maintain the existing toggle behavior of the "Show Actions" / "Hide Actions" button.

---

### Requirement 9 — Overwrite Warning in Grade Input

**User Story:** As a teacher, I want a visual warning when I am about to replace a student's existing grade, so that I do not accidentally overwrite correct grades.

#### Acceptance Criteria

1. WHEN a student row in GradeInputView has a non-empty value in the `existingGrades` map and the teacher has entered a new grade value in the input field, THE GradeInputView SHALL highlight that row with a distinct background color indicating an overwrite.
2. WHEN a student row meets the overwrite condition, THE GradeInputView SHALL display a visible warning badge or icon in the row indicating that an existing grade will be replaced.
3. THE GradeInputView SHALL display the existing grade value alongside the warning so the teacher can compare it with the new value before submitting.
4. WHEN the teacher clears the new grade input for an overwrite row, THE GradeInputView SHALL remove the highlight and warning badge for that row.

---

### Requirement 10 — Accurate Student Count on Classroom Cards

**User Story:** As a teacher, I want the classroom list cards to show the real number of enrolled students, so that I can confirm roster sizes at a glance.

#### Acceptance Criteria

1. WHEN ClassroomHub fetches classrooms for a teacher via `/classroom-subjects/by_teacher/`, THE ClassroomHub SHALL also fetch enrollment counts from `/enrollments/?classroom=<id>` for each classroom.
2. WHEN enrollment data is available for a classroom, THE ClassroomHub SHALL display the enrollment count on the classroom card in place of the hardcoded `classroom.students?.length || 0` value.
3. IF the enrollment fetch for a classroom fails, THEN THE ClassroomHub SHALL display "0 students" for that card without blocking the display of other classroom cards.

---

### Requirement 11 — Loading State When Switching Classrooms

**User Story:** As a teacher, I want a visible loading indicator when I select a classroom, so that I know the detail view is loading and the UI has not frozen.

#### Acceptance Criteria

1. WHEN the teacher clicks a classroom card and `selectClassroom` begins fetching data, THE ClassroomHub SHALL display a loading spinner or skeleton in the classroom detail content area.
2. WHILE classroom detail data is loading, THE ClassroomHub SHALL disable or hide the inner tabs so the teacher cannot select a tab before data is ready.
3. WHEN all classroom detail fetches complete, THE ClassroomHub SHALL remove the loading indicator and render the active tab content.
4. IF a classroom detail fetch fails, THEN THE ClassroomHub SHALL display a toast error message and exit the loading state so the teacher can retry.

---

### Requirement 12 — Active Tab Persisted in URL

**User Story:** As a teacher, I want the selected inner tab to be reflected in the URL, so that I can bookmark or share a direct link to a specific tab and the tab survives a browser refresh.

#### Acceptance Criteria

1. WHEN the teacher selects an inner tab (stream, materials, people, grades), THE ClassroomHub SHALL update the `tab` URL query parameter to the selected tab key using the existing `useSearchParams` hook.
2. WHEN ClassroomHub mounts with a `tab` query parameter present in the URL, THE ClassroomHub SHALL initialise `activeTab` to the value of that parameter instead of the default `'stream'`.
3. IF the `tab` query parameter contains a value that does not correspond to a valid tab key, THEN THE ClassroomHub SHALL fall back to `'stream'` as the active tab.
4. WHEN the teacher navigates back to the classroom list by clicking "Back to Classes", THE ClassroomHub SHALL remove the `tab` query parameter from the URL.

---

### Requirement 13 — Mobile-Friendly Quarter Selector Tap Targets

**User Story:** As a teacher on a mobile device, I want the quarter selector buttons to be large enough to tap accurately, so that I can switch quarters without accidentally hitting the wrong target.

#### Acceptance Criteria

1. THE GradeInputView quarter selector buttons SHALL each have a minimum tap target height of 44 CSS pixels on all screen sizes.
2. WHERE the viewport width is below 640 px, THE GradeInputView SHALL render the quarter selector as a `<select>` element or as buttons with sufficient padding to meet the 44 px minimum tap target height.
3. THE GradeInputView SHALL preserve the current active-quarter highlight visual treatment regardless of the selector style used.
