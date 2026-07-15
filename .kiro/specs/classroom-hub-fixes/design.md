# Design Document: ClassroomHub Bug Fixes and UX Improvements

## 1. Introduction

### 1.1 Purpose

This design document specifies the technical approach for fixing thirteen issues in the ClassroomHub page and its embedded views. The changes address critical bugs (duplicate data creation, infinite fetch loops, broken UI controls) and UX improvements (mobile touch targets, loading states, URL persistence, visual warnings).

### 1.2 Scope

**In Scope:**
- Bug fixes in `frontend/src/pages/ClassroomHub.jsx`
- Bug fixes in `frontend/src/pages/ClassroomHub/EmbeddedViews.jsx`
- Modal component integration for confirmations and inputs
- Upsert logic for grades and attendance
- Stream tab announcement posting
- Mobile-friendly touch targets
- Loading indicators and URL state persistence

**Out of Scope:**
- Backend API contract changes (all fixes work with existing endpoints)
- New classroom management features beyond the listed fixes
- Data model schema changes
- Authentication or authorization changes

### 1.3 Technology Stack

- **Frontend Framework:** React 18.2
- **State Management:** React hooks (useState, useEffect, useCallback, useRef)
- **Routing:** React Router v6 with useSearchParams
- **HTTP Client:** Axios (via `frontend/src/utils/api.js`)
- **UI Components:** Existing Modal component from `frontend/src/components/ui`
- **Styling:** Tailwind CSS

---

## 2. Architecture Overview

### 2.1 Component Structure

```
ClassroomHub.jsx
├── ClassroomListView (left sidebar)
│   ├── ClassroomCard[] (displays enrollment count from API)
│   └── LoadingIndicator (shown during classroom fetch)
├── ClassroomDetailView (main content area)
│   ├── ClassroomHeader
│   │   ├── Back button (clears URL params)
│   │   └── Settings button (removed or wired)
│   ├── TabNavigation (synced with URL ?tab= parameter)
│   │   ├── Stream tab
│   │   ├── Materials tab
│   │   ├── People tab
│   │   └── Grades tab
│   └── TabContent (conditional render based on activeTab)
│       ├── StreamView (announcement input + list)
│       ├── MaterialsView
│       ├── PeopleView
│       └── GradesView
│           ├── GradeInputView (inline, for new grades with upsert)
│           └── GradeManagementView (from EmbeddedViews, with stable fetchGrades)
└── Modal (confirmation/input dialogs)

EmbeddedViews.jsx
├── GradeManagementView
│   ├── fetchGrades (wrapped in useCallback)
│   ├── GradeTable
│   │   └── GradeCell (edit/delete buttons always visible when showActions=true)
│   └── Actions (Show/Hide Actions toggle, bulk delete with Modal)
├── AttendanceView
│   ├── fetchAttendance (loads existing records by date)
│   ├── AttendanceGrid
│   └── submitAttendance (upsert logic: PUT if record exists, POST otherwise)
└── AnalyticsView
```

### 2.2 Data Flow

1. **Classroom Selection:**
   - User clicks classroom card → `selectClassroom(classroom)` → fetch subjects, announcements, enrollments → render detail view
   - Loading state shown during fetch
   - URL updated with `?classroom=<id>&tab=<activeTab>`

2. **Grade Submission (Upsert):**
   - Teacher enters grades → `handleSubmit` checks `existingGrades` map → PUT if ID exists, POST if absent → update `existingGrades` map → show toast

3. **Attendance Submission (Upsert):**
   - Teacher marks attendance → `handleSubmit` checks `attendanceRecords` map → PUT if ID exists, POST if absent → show toast

4. **Announcement Posting:**
   - Teacher types message → clicks submit → POST to `/announcements/` → append to list → clear input

5. **Modal Confirmations:**
   - User triggers delete/fill action → set modal state (open, message, callback) → user confirms → execute callback → close modal

### 2.3 State Management

**ClassroomHub.jsx:**
- `classrooms` - list of teacher's classrooms
- `selectedClassroom` - currently viewed classroom object
- `activeTab` - synced with URL ?tab= parameter
- `announcements` - list for stream tab
- `enrollments` - map of classroom ID to student count
- `loading` - boolean for classroom detail loading state
- `modalState` - { open, title, message, onConfirm }

**GradeInputView (inline in ClassroomHub):**
- `existingGrades` - map of studentId → { gradeId, rawScore }
- `gradeInputs` - map of studentId → new grade value
- `selectedSubject`, `selectedQuarter`, `academicYear`

**GradeManagementView (EmbeddedViews):**
- `grades` - list of grade records
- `showActions` - boolean for edit/delete button visibility

**AttendanceView (EmbeddedViews):**
- `attendanceRecords` - map of studentId → { recordId, status }
- `selectedDate` - date picker value
- `attendanceStatus` - map of studentId → new status value

---

## 3. Detailed Design

### 3.1 Replace Browser Dialogs with Modal Component (Requirement 1)

**Problem:** `window.confirm` and `window.prompt` are used for delete confirmations and fill-all input, creating inconsistent UX and failing in some environments.

**Solution:**

Create reusable modal state management in ClassroomHub:

```javascript
const [modalState, setModalState] = useState({
  open: false,
  title: '',
  message: '',
  inputValue: '',
  showInput: false,
  onConfirm: null
});

const openConfirmModal = (title, message, onConfirm) => {
  setModalState({ open: true, title, message, showInput: false, onConfirm });
};

const openInputModal = (title, message, defaultValue, onConfirm) => {
  setModalState({ 
    open: true, 
    title, 
    message, 
    inputValue: defaultValue, 
    showInput: true, 
    onConfirm 
  });
};

const closeModal = () => {
  setModalState({ open: false, title: '', message: '', inputValue: '', showInput: false, onConfirm: null });
};

const handleModalConfirm = () => {
  if (modalState.onConfirm) {
    modalState.onConfirm(modalState.inputValue);
  }
  closeModal();
};
```

**Usage for delete confirmation:**
```javascript
const handleDeleteGrade = (gradeId) => {
  openConfirmModal(
    'Delete Grade',
    'Are you sure you want to delete this grade?',
    () => performDelete(gradeId)
  );
};
```

**Usage for fill-all input:**
```javascript
const handleFillAll = () => {
  openInputModal(
    'Fill All Grades',
    'Enter the grade value to apply to all students:',
    '',
    (value) => {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0 || numValue > 100) {
        toast.error('Please enter a valid grade between 0 and 100');
        return;
      }
      fillAllGrades(numValue);
    }
  );
};
```

**Modal Component Rendering:**
```jsx
<Modal
  open={modalState.open}
  onClose={closeModal}
  title={modalState.title}
>
  <p>{modalState.message}</p>
  {modalState.showInput && (
    <input
      type="number"
      className="w-full px-3 py-2 border rounded mt-2"
      value={modalState.inputValue}
      onChange={(e) => setModalState({ ...modalState, inputValue: e.target.value })}
      min="0"
      max="100"
    />
  )}
  <div className="flex gap-2 mt-4 justify-end">
    <button onClick={closeModal} className="px-4 py-2 border rounded">
      Cancel
    </button>
    <button onClick={handleModalConfirm} className="px-4 py-2 bg-blue-600 text-white rounded">
      Confirm
    </button>
  </div>
</Modal>
```

**Acceptance:**
- ✅ Delete grade shows Modal instead of window.confirm
- ✅ Delete all grades shows Modal instead of window.confirm
- ✅ Fill all grades shows Modal with input instead of window.prompt
- ✅ Dismissing Modal performs no action

---

### 3.2 Grade Submission Upsert (Requirement 2)

**Problem:** Submitting grades creates duplicate records instead of updating existing ones.

**Solution:**

**Data Structure:**
```javascript
const [existingGrades, setExistingGrades] = useState({});
// Structure: { [studentId]: { gradeId: number, rawScore: number } }
```

**Fetch Existing Grades:**
```javascript
const fetchExistingGrades = async () => {
  try {
    const response = await api.get('/grades/', {
      params: {
        classroom: selectedClassroom.id,
        subject: selectedSubject,
        quarter: selectedQuarter,
        academic_year: academicYear
      }
    });
    
    const gradesMap = {};
    response.data.forEach(grade => {
      gradesMap[grade.student] = {
        gradeId: grade.id,
        rawScore: grade.raw_score
      };
    });
    setExistingGrades(gradesMap);
  } catch (error) {
    toast.error('Failed to load existing grades');
  }
};

useEffect(() => {
  if (selectedSubject && selectedQuarter && academicYear) {
    fetchExistingGrades();
  }
}, [selectedSubject, selectedQuarter, academicYear]);
```

**Submit with Upsert Logic:**
```javascript
const handleSubmit = async () => {
  let successCount = 0;
  let errorCount = 0;
  
  for (const [studentId, gradeValue] of Object.entries(gradeInputs)) {
    if (gradeValue === '') continue;
    
    const payload = {
      student: studentId,
      subject: selectedSubject,
      quarter: selectedQuarter,
      academic_year: academicYear,
      raw_score: parseFloat(gradeValue)
    };
    
    try {
      if (existingGrades[studentId]) {
        // UPDATE: PUT request
        const gradeId = existingGrades[studentId].gradeId;
        await api.put(`/grades/${gradeId}/`, payload);
      } else {
        // CREATE: POST request
        const response = await api.post('/grades/', payload);
        // Store new grade ID for future updates
        setExistingGrades(prev => ({
          ...prev,
          [studentId]: { gradeId: response.data.id, rawScore: response.data.raw_score }
        }));
      }
      successCount++;
    } catch (error) {
      errorCount++;
    }
  }
  
  if (successCount > 0) {
    toast.success(`${successCount} grade(s) saved successfully`);
  }
  if (errorCount > 0) {
    toast.error(`${errorCount} grade(s) failed to save`);
  }
};
```

**Acceptance:**
- ✅ New grades create records via POST
- ✅ Existing grades update records via PUT
- ✅ Grade ID stored after POST for subsequent updates
- ✅ Errors counted and reported without blocking successful submissions

---

### 3.3 Attendance Submission Upsert (Requirement 3)

**Problem:** Saving attendance creates duplicate records for the same date instead of updating existing ones.

**Solution:**

**Data Structure:**
```javascript
const [attendanceRecords, setAttendanceRecords] = useState({});
// Structure: { [studentId]: recordId }
```

**Fetch Existing Attendance:**
```javascript
const fetchAttendance = async (date) => {
  try {
    const response = await api.get('/attendance/', {
      params: {
        classroom: classroom.id,
        date: date
      }
    });
    
    const recordsMap = {};
    const statusMap = {};
    response.data.forEach(record => {
      recordsMap[record.student] = record.id;
      statusMap[record.student] = record.status;
    });
    
    setAttendanceRecords(recordsMap);
    setAttendanceStatus(statusMap);
  } catch (error) {
    toast.error('Failed to load attendance records');
  }
};

useEffect(() => {
  if (selectedDate) {
    fetchAttendance(selectedDate);
  }
}, [selectedDate]);
```

**Submit with Upsert Logic:**
```javascript
const handleSubmitAttendance = async () => {
  let successCount = 0;
  let errorCount = 0;
  
  for (const [studentId, status] of Object.entries(attendanceStatus)) {
    const payload = {
      student: studentId,
      classroom: classroom.id,
      date: selectedDate,
      status: status
    };
    
    try {
      if (attendanceRecords[studentId]) {
        // UPDATE: PUT request
        const recordId = attendanceRecords[studentId];
        await api.put(`/attendance/${recordId}/`, payload);
      } else {
        // CREATE: POST request
        const response = await api.post('/attendance/', payload);
        // Store new record ID for future updates
        setAttendanceRecords(prev => ({
          ...prev,
          [studentId]: response.data.id
        }));
      }
      successCount++;
    } catch (error) {
      errorCount++;
    }
  }
  
  if (successCount > 0) {
    toast.success(`Attendance saved for ${successCount} student(s)`);
  }
  if (errorCount > 0) {
    toast.error(`${errorCount} record(s) failed to save`);
  }
};
```

**Acceptance:**
- ✅ New attendance creates records via POST
- ✅ Existing attendance updates records via PUT
- ✅ Record map refreshes when date changes
- ✅ Errors reported without blocking successful submissions

---

### 3.4 Stable fetchGrades Callback (Requirement 4)

**Problem:** `fetchGrades` in GradeManagementView triggers infinite re-fetch loops due to missing `useCallback` wrapper.

**Solution:**

**Before (causes infinite loop):**
```javascript
const fetchGrades = async () => {
  // fetch logic
};

useEffect(() => {
  fetchGrades();
}, [fetchGrades]); // fetchGrades recreated every render
```

**After (stable reference):**
```javascript
const fetchGrades = useCallback(async () => {
  try {
    const response = await api.get('/grades/', {
      params: {
        classroom: classroom.id,
        subject: selectedSubject
      }
    });
    setGrades(response.data);
  } catch (error) {
    toast.error('Failed to load grades');
  }
}, [classroom.id, selectedSubject]); // Only recreate when these change

useEffect(() => {
  fetchGrades();
}, [fetchGrades]); // Now stable, only runs when classroom or subject changes
```

**Acceptance:**
- ✅ fetchGrades wrapped in useCallback
- ✅ Dependencies include only classroom.id and selectedSubject
- ✅ No infinite fetch loops
- ✅ Grades reload exactly once when classroom or subject changes

---

### 3.5 Remove or Wire Settings Button (Requirement 5)

**Problem:** Settings button exists but has no functionality.

**Solution:**

**Option A: Remove the button (immediate fix):**
```jsx
// ClassroomHub.jsx - ClassroomHeader component
<div className="flex items-center gap-2">
  <button onClick={() => setSelectedClassroom(null)}>
    <ChevronLeft /> Back to Classes
  </button>
  {/* Settings button removed */}
</div>
```

**Option B: Wire to settings dialog (if settings exist):**
```jsx
const [showSettings, setShowSettings] = useState(false);

<button onClick={() => setShowSettings(true)}>
  <Settings /> Settings
</button>

{showSettings && (
  <Modal open={showSettings} onClose={() => setShowSettings(false)} title="Classroom Settings">
    {/* Settings form */}
  </Modal>
)}
```

**Decision:** Remove the button for this iteration. Add back when settings functionality is designed.

**Acceptance:**
- ✅ Settings button removed from ClassroomHeader
- ✅ No dead UI elements remain

---

### 3.6 Wire Stream Tab Announcement Input (Requirement 6)

**Problem:** Stream tab input field is non-functional. Teachers cannot post announcements.

**Solution:**

**State Management:**
```javascript
const [announcements, setAnnouncements] = useState([]);
const [announcementText, setAnnouncementText] = useState('');
const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
```

**Fetch Announcements:**
```javascript
const fetchAnnouncements = async () => {
  setLoadingAnnouncements(true);
  try {
    const response = await api.get('/announcements/', {
      params: { classroom: selectedClassroom.id }
    });
    setAnnouncements(response.data.reverse()); // Most recent first
  } catch (error) {
    toast.error('Failed to load announcements');
  } finally {
    setLoadingAnnouncements(false);
  }
};

useEffect(() => {
  if (selectedClassroom && activeTab === 'stream') {
    fetchAnnouncements();
  }
}, [selectedClassroom, activeTab]);
```

**Post Announcement:**
```javascript
const handlePostAnnouncement = async () => {
  if (!announcementText.trim()) {
    toast.error('Announcement cannot be empty');
    return;
  }
  
  try {
    const response = await api.post('/announcements/', {
      classroom: selectedClassroom.id,
      content: announcementText.trim()
    });
    
    // Add new announcement to top of list
    setAnnouncements([response.data, ...announcements]);
    setAnnouncementText('');
    toast.success('Announcement posted');
  } catch (error) {
    toast.error('Failed to post announcement');
    // Keep text in input so teacher can retry
  }
};
```

**Stream Tab Rendering:**
```jsx
{activeTab === 'stream' && (
  <div className="space-y-4">
    <div className="bg-white p-4 rounded shadow">
      <textarea
        className="w-full border rounded p-2"
        placeholder="Share an announcement with your class..."
        value={announcementText}
        onChange={(e) => setAnnouncementText(e.target.value)}
        rows={3}
      />
      <button
        onClick={handlePostAnnouncement}
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Post
      </button>
    </div>
    
    {loadingAnnouncements ? (
      <div>Loading...</div>
    ) : announcements.length === 0 ? (
      <div>No announcements yet</div>
    ) : (
      announcements.map(ann => (
        <div key={ann.id} className="bg-white p-4 rounded shadow">
          <p>{ann.content}</p>
          <span className="text-sm text-gray-500">{ann.created_at}</span>
        </div>
      ))
    )}
  </div>
)}
```

**Acceptance:**
- ✅ Typing and submitting posts to /announcements/
- ✅ New announcement appends to list
- ✅ Input clears after successful post
- ✅ Error preserves text for retry
- ✅ Announcements load when Stream tab opens

---

### 3.7 Remove Debug console.log (Requirement 7)

**Problem:** Production code contains debug logging that exposes grade data in browser console.

**Solution:**

**Search and remove:**
```bash
# Find all console.log in GradeInputView and ClassroomHub
grep -n "console.log" frontend/src/pages/ClassroomHub.jsx
grep -n "console.log" frontend/src/pages/ClassroomHub/EmbeddedViews.jsx
```

**Remove specific statements:**
```javascript
// REMOVE THIS:
console.log('Submitting grade:', payload);

// Keep only critical error logging (or use proper logging library)
```

**Alternative (if logging needed):**
```javascript
// Use conditional logging in development only
if (process.env.NODE_ENV === 'development') {
  console.log('Debug:', data);
}
```

**Acceptance:**
- ✅ No console.log with grade or student data in production paths
- ✅ Console remains clean during grade submission

---

### 3.8 Always-Visible Edit/Delete Actions (Requirement 8)

**Problem:** Edit and delete buttons use hover-only visibility, making them inaccessible on touch devices.

**Solution:**

**Current Implementation (hover-based):**
```jsx
<div className="relative group">
  <span>{grade.raw_score}</span>
  <div className="absolute opacity-0 group-hover:opacity-100">
    <button onClick={() => handleEdit(grade.id)}>Edit</button>
    <button onClick={() => handleDelete(grade.id)}>Delete</button>
  </div>
</div>
```

**New Implementation (toggle-based):**
```jsx
<div className="relative">
  <span>{grade.raw_score}</span>
  {showActions && (
    <div className="flex gap-1 mt-1">
      <button
        onClick={() => handleEdit(grade.id)}
        className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 rounded"
      >
        Edit
      </button>
      <button
        onClick={() => handleDelete(grade.id)}
        className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 rounded"
      >
        Delete
      </button>
    </div>
  )}
</div>
```

**Toggle Button:**
```jsx
<button
  onClick={() => setShowActions(!showActions)}
  className="px-4 py-2 border rounded"
>
  {showActions ? 'Hide Actions' : 'Show Actions'}
</button>
```

**Acceptance:**
- ✅ Edit/delete buttons visible when showActions=true
- ✅ Buttons hidden when showActions=false
- ✅ No hover-dependent visibility
- ✅ Touch-friendly on mobile devices

---

### 3.9 Overwrite Warning in Grade Input (Requirement 9)

**Problem:** Teachers can accidentally overwrite existing grades without visual warning.

**Solution:**

**Visual Indicators:**
```jsx
const renderStudentRow = (student) => {
  const hasExistingGrade = existingGrades[student.id];
  const hasNewValue = gradeInputs[student.id] !== undefined && gradeInputs[student.id] !== '';
  const isOverwrite = hasExistingGrade && hasNewValue;
  
  return (
    <tr
      key={student.id}
      className={isOverwrite ? 'bg-yellow-50 border-l-4 border-yellow-500' : ''}
    >
      <td>{student.name}</td>
      <td>
        <input
          type="number"
          value={gradeInputs[student.id] || ''}
          onChange={(e) => handleGradeChange(student.id, e.target.value)}
          className={isOverwrite ? 'border-yellow-500' : ''}
        />
      </td>
      <td>
        {isOverwrite && (
          <div className="flex items-center gap-2 text-yellow-700 text-sm">
            <AlertTriangle size={16} />
            <span>Will replace: {existingGrades[student.id].rawScore}</span>
          </div>
        )}
      </td>
    </tr>
  );
};
```

**Warning Badge:**
```jsx
{isOverwrite && (
  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
    Overwrite
  </span>
)}
```

**Acceptance:**
- ✅ Row highlighted with yellow background when overwriting
- ✅ Warning icon and existing grade value shown
- ✅ Badge indicates overwrite status
- ✅ Highlight removed when new input is cleared

---

### 3.10 Accurate Student Count on Classroom Cards (Requirement 10)

**Problem:** Classroom cards show hardcoded or inaccurate student counts.

**Solution:**

**Fetch Enrollment Counts:**
```javascript
const [enrollmentCounts, setEnrollmentCounts] = useState({});

const fetchEnrollmentCount = async (classroomId) => {
  try {
    const response = await api.get('/enrollments/', {
      params: { classroom: classroomId }
    });
    return response.data.length;
  } catch (error) {
    return 0; // Fail gracefully
  }
};

const loadClassroomsWithCounts = async () => {
  const classroomsResponse = await api.get('/classroom-subjects/by_teacher/');
  const classrooms = classroomsResponse.data;
  
  // Fetch counts in parallel
  const counts = {};
  await Promise.all(
    classrooms.map(async (classroom) => {
      counts[classroom.id] = await fetchEnrollmentCount(classroom.id);
    })
  );
  
  setEnrollmentCounts(counts);
  setClassrooms(classrooms);
};
```

**Display Count on Card:**
```jsx
<div className="classroom-card">
  <h3>{classroom.name}</h3>
  <p>{enrollmentCounts[classroom.id] || 0} students</p>
</div>
```

**Acceptance:**
- ✅ Enrollment counts fetched from /enrollments/
- ✅ Real counts displayed on classroom cards
- ✅ Failed fetches default to 0 without blocking other cards

---

### 3.11 Loading State When Switching Classrooms (Requirement 11)

**Problem:** No visual feedback when selecting a classroom, making the UI feel frozen.

**Solution:**

**Loading State:**
```javascript
const [loadingClassroom, setLoadingClassroom] = useState(false);

const selectClassroom = async (classroom) => {
  setLoadingClassroom(true);
  try {
    // Fetch classroom details, subjects, announcements
    await Promise.all([
      fetchClassroomSubjects(classroom.id),
      fetchAnnouncements(classroom.id)
    ]);
    
    setSelectedClassroom(classroom);
  } catch (error) {
    toast.error('Failed to load classroom details');
  } finally {
    setLoadingClassroom(false);
  }
};
```

**Loading UI:**
```jsx
{loadingClassroom ? (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    <p className="ml-4">Loading classroom...</p>
  </div>
) : selectedClassroom ? (
  <div>
    {/* Classroom detail view */}
  </div>
) : (
  <div>Select a classroom to view details</div>
)}
```

**Disable Tabs During Load:**
```jsx
<div className="flex gap-2">
  {['stream', 'materials', 'people', 'grades'].map(tab => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      disabled={loadingClassroom}
      className={loadingClassroom ? 'opacity-50 cursor-not-allowed' : ''}
    >
      {tab}
    </button>
  ))}
</div>
```

**Acceptance:**
- ✅ Spinner displayed during classroom data fetch
- ✅ Tabs disabled while loading
- ✅ Loading state cleared after fetch completes
- ✅ Error toast shown if fetch fails

---

### 3.12 Active Tab Persisted in URL (Requirement 12)

**Problem:** Selected tab is not reflected in URL, breaking bookmarks and refresh.

**Solution:**

**URL Sync with useSearchParams:**
```javascript
import { useSearchParams } from 'react-router-dom';

const [searchParams, setSearchParams] = useSearchParams();
const [activeTab, setActiveTab] = useState(() => {
  const tabParam = searchParams.get('tab');
  const validTabs = ['stream', 'materials', 'people', 'grades'];
  return validTabs.includes(tabParam) ? tabParam : 'stream';
});

const handleTabChange = (newTab) => {
  setActiveTab(newTab);
  setSearchParams({ tab: newTab });
};

const handleBackToClasses = () => {
  setSelectedClassroom(null);
  setSearchParams({}); // Clear all params
};
```

**Tab Buttons:**
```jsx
<button
  onClick={() => handleTabChange('stream')}
  className={activeTab === 'stream' ? 'active' : ''}
>
  Stream
</button>
```

**URL Examples:**
- `/classroom-hub` - No classroom selected
- `/classroom-hub?tab=stream` - Stream tab active
- `/classroom-hub?tab=grades` - Grades tab active

**Acceptance:**
- ✅ Tab selection updates ?tab= URL parameter
- ✅ Page refresh preserves active tab
- ✅ Invalid tab parameter falls back to 'stream'
- ✅ Back button clears URL parameters

---

### 3.13 Mobile-Friendly Quarter Selector (Requirement 13)

**Problem:** Quarter selector buttons are too small for accurate tapping on mobile.

**Solution:**

**Responsive Quarter Selector:**
```jsx
const QuarterSelector = ({ selectedQuarter, onSelect }) => {
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
  
  return (
    <div className="flex flex-wrap gap-2">
      {quarters.map(quarter => (
        <button
          key={quarter}
          onClick={() => onSelect(quarter)}
          className={`
            px-4 py-3 rounded font-medium
            min-h-[44px] min-w-[44px]
            ${selectedQuarter === quarter 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
          `}
        >
          {quarter}
        </button>
      ))}
    </div>
  );
};
```

**Alternative: Dropdown for Very Small Screens:**
```jsx
const QuarterSelector = ({ selectedQuarter, onSelect }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  if (isMobile) {
    return (
      <select
        value={selectedQuarter}
        onChange={(e) => onSelect(e.target.value)}
        className="px-4 py-3 border rounded min-h-[44px]"
      >
        <option value="Q1">Quarter 1</option>
        <option value="Q2">Quarter 2</option>
        <option value="Q3">Quarter 3</option>
        <option value="Q4">Quarter 4</option>
      </select>
    );
  }
  
  return (
    // Button version for desktop
  );
};
```

**Acceptance:**
- ✅ Each quarter button minimum 44px height
- ✅ Sufficient padding for touch accuracy
- ✅ Active quarter visually distinct
- ✅ Works reliably on mobile devices

---

## 4. Testing Strategy

### 4.1 Unit Testing

**Modal Integration:**
- Test Modal opens on delete action
- Test Modal opens on fill-all action
- Test Modal closes without action on dismiss
- Test Modal callback executes on confirm

**Upsert Logic:**
- Test POST creates new grade when no existing record
- Test PUT updates existing grade when record exists
- Test grade ID stored after POST
- Test POST creates new attendance when no existing record
- Test PUT updates existing attendance when record exists

**Fetch Stability:**
- Test fetchGrades only called once on mount
- Test fetchGrades called again when subject changes
- Test no infinite loops in useEffect

### 4.2 Integration Testing

**Grade Submission Flow:**
1. Teacher selects subject and quarter
2. Existing grades load from API
3. Teacher enters new grade for student with existing grade
4. Overwrite warning displays
5. Teacher submits
6. PUT request sent with correct grade ID
7. Success toast shown

**Announcement Posting Flow:**
1. Teacher types announcement
2. Teacher submits
3. POST request to /announcements/
4. New announcement appears at top of list
5. Input field clears

### 4.3 Manual Testing Checklist

- [ ] Delete grade shows Modal, not window.confirm
- [ ] Fill all grades shows Modal with input
- [ ] Submitting duplicate grade updates existing record
- [ ] Submitting new grade creates new record
- [ ] Attendance upsert works for existing and new records
- [ ] No infinite fetch loops in GradeManagementView
- [ ] Settings button removed or functional
- [ ] Stream tab posts announcements successfully
- [ ] No console.log in production grade submission
- [ ] Edit/delete buttons visible on touch devices when actions enabled
- [ ] Overwrite warning shows for existing grades
- [ ] Classroom cards show real enrollment counts
- [ ] Loading spinner displays when selecting classroom
- [ ] Active tab persists in URL and survives refresh
- [ ] Quarter selector buttons are 44px+ tall on mobile

---

## 5. Implementation Phases

### Phase 1: Critical Bug Fixes (Highest Priority)
- Requirement 2: Grade submission upsert
- Requirement 3: Attendance submission upsert
- Requirement 4: Stable fetchGrades callback
- Requirement 7: Remove debug console.log

**Rationale:** Prevents data corruption and infinite loops.

### Phase 2: UI Control Fixes
- Requirement 1: Replace browser dialogs with Modal
- Requirement 5: Remove or wire settings button
- Requirement 6: Wire stream tab announcement input

**Rationale:** Makes broken UI elements functional.

### Phase 3: UX Improvements
- Requirement 8: Always-visible edit/delete actions
- Requirement 9: Overwrite warning in grade input
- Requirement 11: Loading state when switching classrooms
- Requirement 13: Mobile-friendly quarter selector

**Rationale:** Improves usability on touch devices and provides better feedback.

### Phase 4: Polish
- Requirement 10: Accurate student count on classroom cards
- Requirement 12: Active tab persisted in URL

**Rationale:** Enhances user experience but not blocking.

---

## 6. Risk Assessment

### High Risk
- **Grade/Attendance Upsert:** Must not lose data during migration. Existing records must be correctly identified by student, subject, quarter, date.
- **Infinite Fetch Loop:** Missing useCallback dependency can cause performance issues.

**Mitigation:** Test upsert logic with existing data. Add error handling to prevent data loss.

### Medium Risk
- **Modal Integration:** Existing Modal component may not support input fields.
- **Announcement API:** Backend contract must support classroom-specific announcements.

**Mitigation:** Verify Modal component API. Test announcement endpoint with classroom parameter.

### Low Risk
- **URL Parameter Sync:** React Router useSearchParams is standard.
- **Mobile Touch Targets:** Pure CSS change, low risk.

---

## 7. Rollback Plan

All changes are frontend-only and backward compatible with existing API:
1. Revert commits to restore previous behavior
2. No database migrations required
3. No API changes required

---

## 8. Success Metrics

- ✅ Zero duplicate grade records after submission
- ✅ Zero duplicate attendance records after submission
- ✅ Zero infinite fetch loops in GradeManagementView
- ✅ 100% of confirmation dialogs use Modal component
- ✅ Stream tab announcement input functional
- ✅ Edit/delete buttons accessible on touch devices
- ✅ Grade overwrite warnings visible before submission
- ✅ Student counts accurate on all classroom cards
- ✅ Loading indicators display during classroom selection
- ✅ Active tab persists across page refreshes
- ✅ Quarter selector tap targets meet 44px minimum on mobile
