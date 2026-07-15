# Implementation Plan: ClassroomHub Bug Fixes and UX Improvements

## Overview

This implementation plan converts the ClassroomHub fixes design into actionable coding tasks. The tasks are organized into phases based on priority: critical bug fixes first, then UI control fixes, followed by UX improvements and polish.

## Tasks

### Phase 1: Critical Bug Fixes

- [ ] 1. Implement grade submission upsert logic in GradeInputView
  - Add `existingGrades` state map (studentId → { gradeId, rawScore })
  - Create `fetchExistingGrades` function to load grades for selected subject/quarter/academic year
  - Update `handleSubmit` to check `existingGrades` map before submission
  - Use PUT `/grades/<id>/` when grade exists, POST `/grades/` when absent
  - Store new grade ID in `existingGrades` map after successful POST
  - Update error handling to count successes and failures separately
  - Remove hardcoded console.log statements from grade submission
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 7.1, 7.2_

- [ ] 2. Implement attendance submission upsert logic in AttendanceView
  - Add `attendanceRecords` state map (studentId → recordId)
  - Create `fetchAttendance` function to load records for selected date
  - Update `handleSubmitAttendance` to check `attendanceRecords` map
  - Use PUT `/attendance/<id>/` when record exists, POST `/attendance/` when absent
  - Store new record ID in `attendanceRecords` map after successful POST
  - Re-fetch attendance records when selected date changes
  - Update error handling to count successes and failures separately
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 3. Fix infinite fetch loop in GradeManagementView
  - Wrap `fetchGrades` function in `useCallback` hook
  - Add dependency array with `classroom.id` and `selectedSubject`
  - Verify useEffect dependency includes `fetchGrades`
  - Test that grades load exactly once when classroom or subject changes
  - _Requirements: 4.1, 4.2, 4.3_

### Phase 2: UI Control Fixes

- [ ] 4. Replace browser dialogs with Modal component
  - Create `modalState` state object with open, title, message, inputValue, showInput, onConfirm fields
  - Create `openConfirmModal` function for confirmation dialogs
  - Create `openInputModal` function for input dialogs
  - Create `closeModal` and `handleModalConfirm` functions
  - Replace `window.confirm` in delete grade action with `openConfirmModal`
  - Replace `window.confirm` in bulk delete action with `openConfirmModal`
  - Replace `window.prompt` in fill-all action with `openInputModal`
  - Add Modal component rendering with conditional input field
  - Test that dismissing Modal performs no action
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 5. Remove non-functional settings button
  - Locate settings button in ClassroomHeader component
  - Remove button element and associated onClick handler
  - Verify no dead UI elements remain
  - _Requirements: 5.1, 5.2_

- [ ] 6. Wire stream tab announcement input
  - Add `announcements`, `announcementText`, `loadingAnnouncements` state variables
  - Create `fetchAnnouncements` function to load from `/announcements/?classroom=<id>`
  - Create `handlePostAnnouncement` function to POST to `/announcements/`
  - Add useEffect to fetch announcements when Stream tab opens
  - Update Stream tab rendering to show textarea and Post button
  - Wire textarea value to `announcementText` state
  - Wire Post button to `handlePostAnnouncement` function
  - Append new announcement to list on successful POST
  - Clear input field after successful POST
  - Preserve input text on error for retry
  - Display loading state while fetching announcements
  - Display empty state when no announcements exist
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

### Phase 3: UX Improvements

- [ ] 7. Make edit/delete actions always visible on touch devices
  - Remove `opacity-0 group-hover:opacity-100` CSS classes from action buttons
  - Update rendering to show buttons when `showActions` is true
  - Hide buttons when `showActions` is false
  - Preserve existing "Show Actions" / "Hide Actions" toggle button
  - Style buttons with appropriate padding and background colors
  - Test on touch devices to verify buttons are tappable
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 8. Add overwrite warning for existing grades
  - Create `renderStudentRow` function that checks for overwrite condition
  - Detect overwrite when student has existing grade AND new input value
  - Apply yellow background highlight to overwrite rows
  - Display warning icon and "Will replace: <existing value>" message
  - Add "Overwrite" badge to rows that will be updated
  - Remove highlight when new input is cleared
  - Style with yellow color scheme (bg-yellow-50, border-yellow-500, text-yellow-700)
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 9. Add loading state when switching classrooms
  - Add `loadingClassroom` state variable
  - Update `selectClassroom` function to set loading state
  - Display spinner and "Loading classroom..." message during fetch
  - Disable inner tabs while loading
  - Clear loading state after fetch completes
  - Display error toast if fetch fails
  - Test that UI doesn't appear frozen during classroom switch
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [ ] 10. Improve quarter selector for mobile devices
  - Update quarter selector buttons with `min-h-[44px]` and `min-w-[44px]`
  - Add sufficient padding (px-4 py-3) for touch accuracy
  - Apply active state styling for selected quarter
  - Consider dropdown alternative for screens <640px
  - Test tap accuracy on mobile devices
  - _Requirements: 13.1, 13.2, 13.3_

### Phase 4: Polish

- [ ] 11. Display accurate student counts on classroom cards
  - Add `enrollmentCounts` state map (classroomId → count)
  - Create `fetchEnrollmentCount` function that queries `/enrollments/?classroom=<id>`
  - Update `loadClassroomsWithCounts` to fetch counts in parallel
  - Update classroom card rendering to use `enrollmentCounts[classroom.id]`
  - Default to 0 if fetch fails for a classroom
  - Test that counts are accurate and match backend data
  - _Requirements: 10.1, 10.2, 10.3_

- [ ] 12. Persist active tab in URL
  - Import `useSearchParams` from react-router-dom
  - Initialize `activeTab` from ?tab= URL parameter with fallback to 'stream'
  - Validate tab parameter against ['stream', 'materials', 'people', 'grades']
  - Create `handleTabChange` function that updates both state and URL
  - Update `handleBackToClasses` to clear URL parameters
  - Test that tab selection updates URL
  - Test that page refresh preserves active tab
  - Test that invalid tab parameter falls back to 'stream'
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

### Testing and Validation

- [ ] 13. Test all fixes end-to-end
  - Verify grade upsert: submit new grade (POST), re-submit same grade (PUT)
  - Verify attendance upsert: save attendance (POST), re-save same date (PUT)
  - Verify no infinite fetch loops: check network tab for repeated requests
  - Verify Modal dialogs: delete grade, bulk delete, fill all grades
  - Verify announcement posting: type message, submit, see in list
  - Verify edit/delete buttons visible on touch devices when actions enabled
  - Verify overwrite warning displays for existing grades
  - Verify student counts accurate on classroom cards
  - Verify loading spinner displays when switching classrooms
  - Verify URL persists active tab across refresh
  - Verify quarter selector buttons are 44px+ tall on mobile
  - Run ESLint to check for any new errors
  - Test on desktop (Chrome, Firefox)
  - Test on mobile (iOS Safari, Chrome Android)

## Notes

- All changes are frontend-only and backward compatible with existing API
- No database migrations required
- No backend API changes required
- Tasks in Phase 1 prevent data corruption and must be completed first
- Modal component must be imported from existing `frontend/src/components/ui`
- Grade and attendance upsert logic must correctly identify existing records
- useCallback dependency arrays must be accurate to prevent infinite loops
- All confirmation dialogs must use Modal component, not window.confirm/prompt
- Touch targets must meet 44px minimum for mobile accessibility
- URL parameter sync uses React Router's useSearchParams hook
- Error handling should count successes and failures separately
- Toast notifications should provide clear feedback for all operations

## Task Dependency Graph

```json
{
  "waves": [
    {
      "id": 0,
      "tasks": ["1", "2", "3"]
    },
    {
      "id": 1,
      "tasks": ["4", "5", "6"]
    },
    {
      "id": 2,
      "tasks": ["7", "8", "9", "10"]
    },
    {
      "id": 3,
      "tasks": ["11", "12"]
    },
    {
      "id": 4,
      "tasks": ["13"]
    }
  ]
}
```
