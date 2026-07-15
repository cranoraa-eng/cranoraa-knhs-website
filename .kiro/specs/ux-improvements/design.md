# Design Document: UX Improvements

## Overview

This design document outlines the technical approach for implementing comprehensive user experience improvements to the Kiwalan National High School portal. The portal currently serves students, teachers, parents, and administrators through a Django backend with a React frontend (using React Router, Tailwind CSS, Framer Motion, and Recharts).

### Current System Context

**Technology Stack:**
- **Backend**: Django (REST API)
- **Frontend**: React 18.2 + Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS 3.3
- **Animation**: Framer Motion 12.40
- **Charts**: Recharts 3.8
- **Notifications**: React Hot Toast 2.6
- **HTTP Client**: Axios
- **State Management**: React Context API (AuthContext, NotificationContext, AcademicYearContext)

**Current Architecture:**
- Role-based routing with protected routes
- Layout component with persistent sidebar navigation
- Dashboard-per-role pattern (Admin, Teacher, Student, Parent)
- Real-time notifications via WebSocket and fallback polling
- Responsive grid layouts using Tailwind breakpoints
- Component library (`components/ui/`) for consistency


**Research Findings:**

1. **Navigation Patterns** (WCAG 2.1 & Nielsen Norman Group):
   - Top-level navigation should contain 5-7 items maximum to avoid cognitive overload
   - Breadcrumbs improve wayfinding in hierarchical structures
   - Active page indicators must have 3:1 contrast ratio minimum
   - Keyboard navigation requires visible focus indicators (2px outline, 3:1 contrast)
   - Skip links should be the first focusable element on each page

2. **Mobile UX Best Practices** (Google Mobile UX Guidelines):
   - Touch targets: minimum 44×44px (iOS) or 48×48dp (Material Design)
   - Hamburger menus acceptable for mobile but must be discoverable
   - Tables: horizontal scroll or card transformation at <768px breakpoint
   - Form fields: 16px minimum font size to prevent zoom on iOS
   - Stacked vertical layout prevents horizontal scrolling

3. **Accessibility Standards** (WCAG 2.1 AA):
   - Color contrast: 4.5:1 for normal text, 3:1 for large text (18pt+)
   - ARIA live regions for dynamic content announcements
   - All form inputs require associated labels (visible or aria-label)
   - Focus order must follow visual order
   - Alternative representations required for visual data (charts → tables)

4. **Loading & Feedback Patterns** (Jakob Nielsen's Response Time Guidelines):
   - 0.1s: perceived as instantaneous
   - 1.0s: user flow maintained
   - 10s: maximum attention span without feedback
   - Display loading indicator within 200ms of user action
   - Progress bars for operations >3 seconds
   - Optimistic UI updates where possible


5. **Onboarding Strategies** (Appcues & UserGuiding Research):
   - First-time user tours: 3-5 steps maximum per feature
   - Contextual tooltips triggered by hover/focus
   - Empty states with actionable guidance
   - Progressive disclosure: show features as users advance
   - Tour dismissal + restart options prevent frustration

6. **Data Visualization Principles** (Edward Tufte & Stephen Few):
   - Charts should have clear legends and axis labels
   - Color blindness considerations: use patterns + colors
   - Gradual color scales: green (good) → amber (warning) → red (critical)
   - Alternative table views required for screen readers
   - Responsive charts maintain aspect ratio across devices

7. **Form Usability** (Luke Wroblewski's "Web Form Design"):
   - Inline validation reduces error rates by 22%
   - Required field indicators: asterisk (*) + aria-required
   - Field help text appears on focus
   - Multi-step forms: progress indicator reduces abandonment
   - Unsaved changes warning prevents data loss

8. **Notification Patterns** (Material Design & iOS Human Interface Guidelines):
   - Toast notifications: bottom-right corner, 4-6 second duration
   - Non-blocking: user can continue working
   - Grouping multiple notifications prevents clutter
   - Critical alerts: persistent banners requiring acknowledgment
   - Dismiss controls on all notifications

### Design Goals


1. **Enhance navigation clarity** to reduce time-to-task completion
2. **Ensure full mobile compatibility** for on-the-go access
3. **Achieve WCAG 2.1 AA compliance** for inclusive access
4. **Provide immediate, clear feedback** for all user actions
5. **Reduce learning curve** for new users through guided onboarding
6. **Visualize data effectively** to support decision-making
7. **Streamline form interactions** to reduce errors and frustration
8. **Optimize dashboard layouts** for various screen sizes
9. **Implement unobtrusive notifications** that keep users informed
10. **Improve calendar usability** for event tracking

## Architecture

### System Architecture Overview

The UX improvements will be implemented as enhancements to the existing React frontend without requiring backend API changes, except for:
- New endpoint for onboarding tour completion status (`/api/users/onboarding-status/`)
- New endpoint for dashboard widget preferences (`/api/users/dashboard-preferences/`)

### Frontend Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  - Pages (Dashboard, Grades, Attendance, etc.)              │
│  - Layout (Sidebar, Header, Breadcrumbs)                    │
│  - New: Onboarding Tour, Help System, Skip Links           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    UI Component Library                      │
│  - Existing: Card, Button, Modal, Table, Input             │
│  - New: Breadcrumb, Tooltip, ProgressBar, Chart            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Business Logic Layer                     │
│  - Context Providers (Auth, Notifications, Onboarding)      │
│  - Custom Hooks (useMediaQuery, useAccessibility)           │
│  - Utility Functions (color contrast, validation)           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Data Layer                            │
│  - API Client (Axios)                                       │
│  - Local Storage (preferences, tour status)                 │
└─────────────────────────────────────────────────────────────┘
```


### Component Organization Strategy

**New Components to Create:**
- `components/navigation/Breadcrumb.jsx` - Hierarchical navigation trail
- `components/navigation/SearchBar.jsx` - Feature search functionality
- `components/navigation/SkipLink.jsx` - Accessibility skip-to-content links
- `components/feedback/LoadingIndicator.jsx` - Unified loading states
- `components/feedback/ProgressBar.jsx` - Long operation progress
- `components/feedback/Toast.jsx` - Enhanced toast notifications (extending react-hot-toast)
- `components/onboarding/Tour.jsx` - Interactive feature tours
- `components/onboarding/Tooltip.jsx` - Contextual help popups
- `components/onboarding/EmptyStateWithGuidance.jsx` - Instructional empty states
- `components/charts/LineChart.jsx` - Grade trend visualizations
- `components/charts/BarChart.jsx` - Class comparison charts
- `components/charts/AttendanceCalendar.jsx` - Calendar heatmap
- `components/forms/ValidatedInput.jsx` - Real-time validation inputs
- `components/forms/MultiStepForm.jsx` - Wizard-style forms
- `components/calendar/CalendarView.jsx` - Month/week/day view toggle
- `components/calendar/EventModal.jsx` - Event detail display
- `components/dashboard/ResponsiveGrid.jsx` - Adaptive dashboard layout
- `components/dashboard/DraggableWidget.jsx` - Rearrangeable widgets

**Enhanced Components:**
- `Layout.jsx` - Add breadcrumb integration, skip links, improved mobile menu
- `Dashboard.jsx` - Integrate responsive grid and widget preferences
- Form components - Add inline validation and help text support

### Navigation Architecture

**Top-Level Categories (Maximum 5):**
1. **Home** - Dashboard/overview
2. **Academics** - Grades, attendance, materials, schedule
3. **Communication** - Announcements, messages, calendar
4. **Directory** - Students, teachers, parents (role-dependent)
5. **Settings** - Profile, preferences, system admin

**Navigation State Management:**

```javascript
// Navigation breadcrumb generation utility
const generateBreadcrumbs = (pathname, role) => {
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbs = [{ label: 'Home', path: '/dashboard' }];
  
  // Map path segments to human-readable labels
  const labelMap = {
    'academics-hub': 'Academics Hub',
    'grading-suite': 'Grading Suite',
    'communication-center': 'Communication',
    'people-directory': 'Directory',
    'system-admin': 'System Admin',
    // ... additional mappings
  };
  
  pathSegments.forEach((segment, index) => {
    const path = '/' + pathSegments.slice(0, index + 1).join('/');
    breadcrumbs.push({
      label: labelMap[segment] || segment,
      path: path
    });
  });
  
  return breadcrumbs;
};
```

### Mobile Responsiveness Strategy

**Breakpoint System (Tailwind CSS):**
- `sm`: 640px (small tablets, portrait)
- `md`: 768px (tablets, landscape)
- `lg`: 1024px (laptops, desktops)
- `xl`: 1280px (large desktops)
- `2xl`: 1536px (extra large screens)

**Mobile-First Transformations:**
1. **Navigation**: Sidebar → Hamburger menu at <1024px
2. **Tables**: Grid → Horizontal scroll or card stack at <768px
3. **Forms**: Multi-column → Single column at <768px
4. **Dashboard**: 3-col → 2-col → 1-col responsive grid
5. **Calendar**: Month grid → Agenda list at <768px


### Accessibility Architecture

**Focus Management System:**
```javascript
// Custom hook for focus trap in modals
const useFocusTrap = (ref, isOpen) => {
  useEffect(() => {
    if (!isOpen || !ref.current) return;
    
    const focusableElements = ref.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const handleTab = (e) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };
    
    firstElement?.focus();
    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen, ref]);
};
```

**ARIA Pattern Implementation:**
- Skip links: `<a href="#main-content" className="sr-only focus:not-sr-only">`
- Live regions: `<div aria-live="polite" aria-atomic="true">` for toast notifications
- Form labels: `<label htmlFor="field-id">` + `aria-describedby` for help text
- Focus indicators: `focus:ring-2 focus:ring-violet-500 focus:ring-offset-2`
- Modal dialogs: `role="dialog" aria-modal="true" aria-labelledby="modal-title"`


## Components and Interfaces

### Navigation Components

#### Breadcrumb Component
```typescript
interface BreadcrumbProps {
  items: Array<{
    label: string;
    path: string;
    current?: boolean;
  }>;
  maxItems?: number; // Collapse middle items if exceeded
  separator?: React.ReactNode;
}

// Usage:
<Breadcrumb items={[
  { label: 'Home', path: '/dashboard' },
  { label: 'Academics', path: '/academics-hub' },
  { label: 'My Classes', path: '/my-classes', current: true }
]} />
```

#### SearchBar Component
```typescript
interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  suggestions?: Array<{
    label: string;
    path: string;
    category: string;
  }>;
  debounceMs?: number; // Default 300ms
}
```

#### SkipLink Component
```typescript
interface SkipLinkProps {
  targetId: string; // ID of main content container
  label?: string; // Default: "Skip to main content"
}
```

### Feedback Components

#### LoadingIndicator Component
```typescript
interface LoadingIndicatorProps {
  type: 'spinner' | 'skeleton' | 'progress';
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  progress?: number; // For progress type (0-100)
}
```


#### Enhanced Toast Component
```typescript
interface ToastConfig {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number; // Default 4000ms
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean; // Default true
}

// Extended react-hot-toast with custom positioning and grouping
const toast = {
  success: (message: string, options?: ToastConfig) => {},
  error: (message: string, options?: ToastConfig) => {},
  warning: (message: string, options?: ToastConfig) => {},
  info: (message: string, options?: ToastConfig) => {},
  group: (toasts: ToastConfig[]) => {}, // Stack multiple toasts
};
```

### Onboarding Components

#### Tour Component
```typescript
interface TourStep {
  target: string; // CSS selector
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface TourProps {
  steps: TourStep[];
  role: 'student' | 'staff' | 'admin' | 'parent';
  onComplete: () => void;
  onSkip: () => void;
  isFirstLogin: boolean;
}
```

#### Tooltip Component
```typescript
interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'focus' | 'click';
  delay?: number; // Default 200ms
}
```


### Chart Components (Using Recharts)

#### LineChart Component
```typescript
interface LineChartProps {
  data: Array<{
    label: string;
    value: number;
    [key: string]: any;
  }>;
  xAxisKey: string;
  yAxisKey: string;
  title?: string;
  color?: string;
  height?: number; // Default 300px
  responsive?: boolean; // Default true
}
```

#### BarChart Component
```typescript
interface BarChartProps {
  data: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  orientation?: 'vertical' | 'horizontal';
  title?: string;
  height?: number;
  showValues?: boolean; // Display values on bars
}
```

#### AttendanceCalendar Component
```typescript
interface AttendanceDay {
  date: string; // ISO format
  status: 'present' | 'absent' | 'late' | 'excused';
}

interface AttendanceCalendarProps {
  data: AttendanceDay[];
  month: number; // 0-11
  year: number;
  onDayClick?: (day: AttendanceDay) => void;
}
```

### Form Components

#### ValidatedInput Component
```typescript
interface ValidationRule {
  type: 'required' | 'email' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message: string;
  validator?: (value: string) => boolean;
}

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  rules?: ValidationRule[];
  helpText?: string;
  showValidation?: 'always' | 'onBlur' | 'onChange';
}
```


#### MultiStepForm Component
```typescript
interface FormStep {
  id: string;
  title: string;
  fields: React.ReactNode;
  validation?: () => Promise<boolean>;
}

interface MultiStepFormProps {
  steps: FormStep[];
  onSubmit: (data: any) => Promise<void>;
  onCancel?: () => void;
  showProgress?: boolean; // Default true
}
```

### Calendar Components

#### CalendarView Component
```typescript
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  category: 'academic' | 'holiday' | 'deadline' | 'event';
  description?: string;
  location?: string;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  view: 'month' | 'week' | 'day' | 'agenda';
  onViewChange: (view: string) => void;
  onEventClick: (event: CalendarEvent) => void;
  filters?: string[]; // Active category filters
  onFilterChange?: (filters: string[]) => void;
}
```

### Dashboard Components

#### ResponsiveGrid Component
```typescript
interface GridConfig {
  cols: { xs: number; sm: number; md: number; lg: number; xl: number };
  gap: number;
  autoFlow?: 'row' | 'column' | 'dense';
}

interface ResponsiveGridProps {
  config?: GridConfig;
  children: React.ReactNode;
  className?: string;
}
```


#### DraggableWidget Component
```typescript
interface WidgetProps {
  id: string;
  title: string;
  content: React.ReactNode;
  allowResize?: boolean;
  allowHide?: boolean;
  defaultSize?: { width: number; height: number };
  onPositionChange?: (position: { x: number; y: number }) => void;
}
```

## Data Models

### OnboardingStatus Model
```typescript
interface OnboardingStatus {
  userId: string;
  role: 'student' | 'staff' | 'admin' | 'parent';
  completedTours: string[]; // Tour IDs
  dismissedTooltips: string[]; // Tooltip IDs
  lastUpdated: Date;
}

// Backend: Django model
// class OnboardingStatus(models.Model):
//     user = models.OneToOneField(User, on_delete=models.CASCADE)
//     completed_tours = models.JSONField(default=list)
//     dismissed_tooltips = models.JSONField(default=list)
//     last_updated = models.DateTimeField(auto_now=True)
```

### DashboardPreferences Model
```typescript
interface WidgetPosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
}

interface DashboardPreferences {
  userId: string;
  role: 'student' | 'staff' | 'admin' | 'parent';
  layout: WidgetPosition[];
  theme?: 'light' | 'dark' | 'auto';
  lastUpdated: Date;
}

// Backend: Django model
// class DashboardPreferences(models.Model):
//     user = models.OneToOneField(User, on_delete=models.CASCADE)
//     layout = models.JSONField(default=list)
//     theme = models.CharField(max_length=10, default='light')
//     last_updated = models.DateTimeField(auto_now=True)
```


### AccessibilitySettings Model
```typescript
interface AccessibilitySettings {
  userId: string;
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'x-large';
  screenReaderMode: boolean;
}

// Stored in localStorage for immediate application
// localStorage.setItem('a11y-settings', JSON.stringify(settings));
```

### FormValidationState Model
```typescript
interface FieldError {
  field: string;
  message: string;
  type: string;
}

interface FormValidationState {
  isValid: boolean;
  errors: FieldError[];
  touched: Set<string>; // Fields user has interacted with
  isDirty: boolean; // Form has unsaved changes
}
```

### NotificationState Model (Enhanced)
```typescript
interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  persistent?: boolean; // Critical notifications
  groupId?: string; // For grouping related notifications
}

interface NotificationGroup {
  groupId: string;
  notifications: Notification[];
  collapsed: boolean;
}
```


### ChartData Model
```typescript
interface ChartDataPoint {
  label: string;
  value: number;
  metadata?: Record<string, any>;
}

interface GradeTrendData extends ChartDataPoint {
  quarter: 1 | 2 | 3 | 4;
  subject: string;
  grade: number;
}

interface AttendanceData {
  date: string; // ISO format
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
}
```

## Error Handling

### Error Classification

1. **Network Errors**
   - Connection timeout (>30s)
   - Server unavailable (500, 502, 503)
   - Authentication expired (401)
   - **Strategy**: Display toast with retry button, fallback to cached data if available

2. **Validation Errors**
   - Form field validation failures
   - File upload size/type restrictions
   - **Strategy**: Inline field-level errors, prevent submission until resolved

3. **User Errors**
   - Attempting to access unauthorized features
   - Invalid navigation paths
   - **Strategy**: Redirect to appropriate page with explanation message

4. **Accessibility Errors**
   - Focus trap failures
   - ARIA attribute conflicts
   - **Strategy**: Graceful degradation, log to console for debugging


### Error Handling Patterns

#### API Error Handler
```javascript
const handleApiError = (error, context) => {
  // Network timeout
  if (error.code === 'ECONNABORTED') {
    toast.error('Request timed out. Please check your connection.', {
      action: { label: 'Retry', onClick: context.retryFn }
    });
    return;
  }
  
  // Authentication error
  if (error.response?.status === 401) {
    signOut();
    navigate('/login', { state: { expired: true } });
    return;
  }
  
  // Server error
  if (error.response?.status >= 500) {
    toast.error('Server error. Our team has been notified.', {
      duration: 6000
    });
    return;
  }
  
  // Client error
  const message = error.response?.data?.message || 'An error occurred';
  toast.error(message);
};
```

#### Form Validation Error Handler
```javascript
const displayValidationErrors = (errors, formRef) => {
  errors.forEach(error => {
    const field = formRef.current?.querySelector(`[name="${error.field}"]`);
    if (field) {
      // Add error styling
      field.setAttribute('aria-invalid', 'true');
      field.setAttribute('aria-describedby', `${error.field}-error`);
      
      // Display error message below field
      const errorEl = document.getElementById(`${error.field}-error`);
      if (errorEl) {
        errorEl.textContent = error.message;
        errorEl.classList.remove('hidden');
      }
    }
  });
  
  // Focus first error field
  const firstError = errors[0];
  formRef.current?.querySelector(`[name="${firstError.field}"]`)?.focus();
};
```


#### Accessibility Error Recovery
```javascript
// Focus trap fallback
const ensureFocusWithinModal = (modalRef) => {
  const checkFocus = () => {
    if (modalRef.current && !modalRef.current.contains(document.activeElement)) {
      const firstFocusable = modalRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    }
  };
  
  // Check every 100ms
  const interval = setInterval(checkFocus, 100);
  return () => clearInterval(interval);
};

// ARIA live region announcement fallback
const announceToScreenReader = (message, priority = 'polite') => {
  const liveRegion = document.querySelector(`[aria-live="${priority}"]`);
  if (liveRegion) {
    liveRegion.textContent = message;
    setTimeout(() => { liveRegion.textContent = ''; }, 1000);
  } else {
    // Fallback: create temporary live region
    const temp = document.createElement('div');
    temp.setAttribute('role', 'status');
    temp.setAttribute('aria-live', priority);
    temp.className = 'sr-only';
    temp.textContent = message;
    document.body.appendChild(temp);
    setTimeout(() => document.body.removeChild(temp), 2000);
  }
};
```

### Error Boundary Implementation
```javascript
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to error tracking service
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold text-red-600">Something went wrong</h2>
          <p className="mt-2 text-slate-600">Please refresh the page or contact support.</p>
          <button onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      );
    }
    return this.props.children;
  }
}
```


## Testing Strategy

### Overview

This feature focuses on UI rendering, user interactions, accessibility, and responsive layouts. **Property-based testing is NOT applicable** because:
- The feature involves UI rendering and layout (not pure functions)
- Visual presentation and interaction patterns cannot be expressed as universal mathematical properties
- Testing requires verification of specific visual states and user behaviors

Instead, we will use:
1. **Snapshot tests** for component rendering
2. **Integration tests** for user interactions
3. **Accessibility audits** using automated tools
4. **Visual regression tests** for layout consistency
5. **Manual testing** for subjective UX quality

### Testing Approach

#### 1. Component Unit Tests (Jest + React Testing Library)

Test individual components in isolation:

**Navigation Components:**
- Breadcrumb: renders correct hierarchy, handles long paths with ellipsis
- SearchBar: debounces input, displays suggestions, triggers onSearch callback
- SkipLink: focuses main content on activation, visible on keyboard focus

**Feedback Components:**
- LoadingIndicator: renders correct type (spinner/skeleton/progress)
- Toast: displays message, auto-dismisses after duration, respects grouping
- ProgressBar: updates percentage, shows completion state

**Form Components:**
- ValidatedInput: displays validation errors inline, triggers on correct event
- MultiStepForm: advances steps, prevents invalid progression, warns on exit

**Chart Components:**
- LineChart: renders with data, handles empty state, responsive sizing
- BarChart: displays bars correctly, handles negative values
- AttendanceCalendar: renders month grid, highlights attendance status


**Example Unit Test:**
```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Breadcrumb } from './Breadcrumb';

describe('Breadcrumb Component', () => {
  it('renders all breadcrumb items', () => {
    const items = [
      { label: 'Home', path: '/dashboard' },
      { label: 'Academics', path: '/academics-hub' },
      { label: 'My Classes', path: '/my-classes', current: true }
    ];
    
    render(<Breadcrumb items={items} />);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Academics')).toBeInTheDocument();
    expect(screen.getByText('My Classes')).toBeInTheDocument();
  });
  
  it('marks current item with aria-current', () => {
    const items = [
      { label: 'Home', path: '/dashboard' },
      { label: 'Current', path: '/current', current: true }
    ];
    
    render(<Breadcrumb items={items} />);
    const currentItem = screen.getByText('Current').closest('a');
    expect(currentItem).toHaveAttribute('aria-current', 'page');
  });
  
  it('collapses middle items when maxItems exceeded', () => {
    const items = [
      { label: 'Home', path: '/' },
      { label: 'Level 1', path: '/1' },
      { label: 'Level 2', path: '/2' },
      { label: 'Level 3', path: '/3' },
      { label: 'Current', path: '/current', current: true }
    ];
    
    render(<Breadcrumb items={items} maxItems={3} />);
    expect(screen.getByText('...')).toBeInTheDocument();
  });
});
```


#### 2. Integration Tests (Cypress or Playwright)

Test complete user workflows across multiple components:

**Navigation Flow:**
- User clicks breadcrumb link → navigates to correct page
- User searches for feature → sees suggestions → clicks suggestion → arrives at feature
- User presses Tab key → skip link appears → press Enter → focus moves to main content

**Form Validation Flow:**
- User enters invalid email → sees inline error → corrects input → error disappears
- User fills multi-step form → sees progress indicator → attempts to leave → sees warning → confirms → navigates away
- User submits form with errors → focus moves to first error field → aria-live announces error count

**Onboarding Flow:**
- New user logs in → tour appears → user advances through steps → tour completes → status saved
- User hovers over tooltip trigger → tooltip appears after delay → user moves away → tooltip disappears

**Dashboard Interaction Flow:**
- User drags widget → widget position changes → page refreshes → widget retains position
- User toggles dashboard view (3-col → 2-col → 1-col) → widgets reflow correctly

**Calendar Interaction Flow:**
- User switches from month to week view → calendar updates → events display correctly
- User filters by category → only matching events shown → calendar updates


**Example Integration Test:**
```javascript
// Cypress test
describe('Form Validation Flow', () => {
  beforeEach(() => {
    cy.login('student');
    cy.visit('/profile');
  });
  
  it('displays inline validation errors and prevents submission', () => {
    // Clear email field (required)
    cy.get('input[name="email"]').clear();
    cy.get('input[name="email"]').blur();
    
    // Error should appear
    cy.get('#email-error').should('be.visible');
    cy.get('#email-error').should('contain', 'Email is required');
    
    // Submit button should be disabled
    cy.get('button[type="submit"]').should('be.disabled');
    
    // Enter valid email
    cy.get('input[name="email"]').type('student@example.com');
    
    // Error should disappear
    cy.get('#email-error').should('not.be.visible');
    
    // Submit button should be enabled
    cy.get('button[type="submit"]').should('not.be.disabled');
  });
  
  it('warns when leaving form with unsaved changes', () => {
    cy.get('input[name="phone"]').type('123-456-7890');
    
    // Attempt to navigate away
    cy.get('a[href="/dashboard"]').click();
    
    // Warning dialog should appear
    cy.get('[role="dialog"]').should('be.visible');
    cy.get('[role="dialog"]').should('contain', 'unsaved changes');
    
    // Confirm navigation
    cy.get('button').contains('Leave').click();
    
    // Should navigate to dashboard
    cy.url().should('include', '/dashboard');
  });
});
```


#### 3. Accessibility Testing

**Automated Tools:**
- **axe-core** (via jest-axe or Cypress axe plugin): Scans for WCAG violations
- **Pa11y**: Command-line accessibility testing
- **Lighthouse**: Chrome DevTools audit for accessibility score

**Manual Testing Checklist:**
- [ ] All interactive elements reachable via keyboard (Tab/Shift+Tab)
- [ ] Visible focus indicators on all focusable elements (2px ring, 3:1 contrast)
- [ ] Skip links functional and visible on focus
- [ ] Screen reader announces all dynamic content changes
- [ ] Color contrast ratios meet WCAG AA (4.5:1 normal text, 3:1 large text)
- [ ] Forms: all inputs have labels, error messages announced
- [ ] Modals: focus trap works, Escape key closes
- [ ] Images: alt text present and descriptive
- [ ] Charts: data table alternative available
- [ ] Touch targets: minimum 44×44px on mobile

**Example Accessibility Test:**
```javascript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Breadcrumb Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<Breadcrumb items={mockItems} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('supports keyboard navigation', () => {
    render(<Breadcrumb items={mockItems} />);
    const links = screen.getAllByRole('link');
    
    links[0].focus();
    expect(links[0]).toHaveFocus();
    
    fireEvent.keyDown(links[0], { key: 'Tab' });
    // Next link should receive focus (browser behavior)
  });
});
```


#### 4. Visual Regression Testing

**Tool**: Chromatic, Percy, or Playwright Visual Comparisons

Test that UI changes don't introduce unintended visual regressions:

**Snapshot Scenarios:**
- Breadcrumb: normal, long path with ellipsis, mobile collapsed
- Navigation: desktop sidebar, mobile hamburger menu (open/closed)
- Forms: pristine state, error state, success state
- Loading states: spinner, skeleton, progress bar at 0%, 50%, 100%
- Toast notifications: single, stacked, grouped
- Dashboard: 3-col, 2-col, 1-col layouts
- Calendar: month view, week view, day view, agenda view
- Charts: with data, empty state, responsive sizes

**Example Visual Test (Playwright):**
```javascript
test('Dashboard layouts at different breakpoints', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Desktop (1280px)
  await page.setViewportSize({ width: 1280, height: 720 });
  await expect(page).toHaveScreenshot('dashboard-desktop.png');
  
  // Tablet (768px)
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(page).toHaveScreenshot('dashboard-tablet.png');
  
  // Mobile (375px)
  await page.setViewportSize({ width: 375, height: 667 });
  await expect(page).toHaveScreenshot('dashboard-mobile.png');
});
```

#### 5. Responsive Design Testing

Test at standard breakpoints:
- Mobile portrait: 375×667 (iPhone SE)
- Mobile landscape: 667×375
- Tablet portrait: 768×1024 (iPad)
- Tablet landscape: 1024×768
- Laptop: 1280×720
- Desktop: 1920×1080

**Test Criteria:**
- No horizontal scrolling at any breakpoint
- Text remains readable (minimum 14px on mobile)
- Touch targets meet minimum size (44×44px)
- Images/media scale appropriately
- Navigation transforms correctly (sidebar → hamburger)
- Tables transform correctly (grid → cards or horizontal scroll)


#### 6. Performance Testing

**Metrics to Monitor:**
- Time to Interactive (TTI): <3.8s on mobile, <2s on desktop
- First Contentful Paint (FCP): <1.8s on mobile, <1s on desktop
- Largest Contentful Paint (LCP): <2.5s
- Cumulative Layout Shift (CLS): <0.1
- First Input Delay (FID): <100ms

**Tools:**
- Lighthouse (Chrome DevTools)
- WebPageTest
- React DevTools Profiler

**Test Scenarios:**
- Dashboard load with 10+ widgets
- Calendar render with 100+ events
- Form with 20+ fields and validation
- Chart render with 365 data points
- Toast notifications: render 10 simultaneous toasts

#### 7. User Acceptance Testing (UAT)

**Test Users:**
- 3 students (various devices)
- 3 teachers (desktop + mobile)
- 1 parent (mobile primary)
- 1 admin (desktop)

**UAT Scenarios:**
1. First-time login: Does onboarding tour help?
2. Find a specific feature: Can you locate "Grade Input" easily?
3. Complete a form: Was validation helpful or frustrating?
4. View attendance: Can you understand the calendar heatmap?
5. Mobile usage: Can you perform all tasks on phone?
6. Accessibility: Can you navigate entire site with keyboard only?

**Success Criteria:**
- 90% task completion rate
- Average SUS (System Usability Scale) score >68
- No critical accessibility blockers
- <3 seconds average time-to-feature via search


### Test Coverage Goals

- **Unit tests**: 80% coverage for all new components
- **Integration tests**: Cover all 10 requirements (1 test suite per requirement)
- **Accessibility tests**: 100% of pages pass axe-core audit
- **Visual regression**: Baseline screenshots for all major UI states
- **Performance**: All pages meet Core Web Vitals thresholds
- **UAT**: 100% of scenarios tested by representative users

### Testing Timeline

1. **Unit tests**: Written alongside component development (continuous)
2. **Integration tests**: Written after feature completion, before PR review
3. **Accessibility audits**: Run on every PR via CI/CD
4. **Visual regression**: Baseline established post-development, checked on every PR
5. **Performance testing**: Weekly during development, final audit before release
6. **UAT**: 1 week testing period before production deployment

### Continuous Integration

**Automated Tests (GitHub Actions):**
```yaml
name: Frontend Tests
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test -- --coverage
      - run: npm run test:a11y
      - run: npm run build
```

**Pre-Commit Hooks:**
- ESLint (code quality)
- Prettier (formatting)
- axe-core scan on changed files

