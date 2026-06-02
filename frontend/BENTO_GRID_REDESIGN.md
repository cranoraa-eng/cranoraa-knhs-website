# 🎨 Teacher Dashboard - Bento Grid Redesign

**Date**: June 2, 2026  
**Status**: 🚧 In Progress  
**Previous Version**: Dashboard.jsx.backup

---

## 🎯 Design Goals

Transform the Teacher Dashboard from traditional admin panel into a modern **Bento-style academic workspace** with:

- ✅ **Apple-inspired polish** (16px border radius, soft shadows, spacious cards)
- ✅ **CSS Grid layout** (not stacked Flex)
- ✅ **Information-dense but not crowded**
- ✅ **Purple brand color** used strategically (KPIs, active states, primary actions)
- ✅ **Minimalist professional** (Notion/Linear/Stripe level polish)
- ✅ **Card sizes based on importance** (no unnecessarily tall cards)

---

## 📐 Bento Grid Layout Specification

### Desktop Grid: 12 columns, 6px gap

```
┌─────────────────────────────────────────────────────────────────┐
│ ROW 1                                                            │
│ ┌──────────────────────────────────┬─────────────────────────┐ │
│ │  WELCOME (col-span-8, 2x1)       │  SCHEDULE (col-span-4)  │ │
│ │  - Teacher name + date            │  - Next class           │ │
│ │  - Classes/Students/Pending KPIs  │  - Empty state          │ │
│ └──────────────────────────────────┴─────────────────────────┘ │
│                                                                  │
│ ROW 2                                                            │
│ ┌────────────────┬────────────────┬───────────────────────────┐ │
│ │  ATTENDANCE    │  QUICK ACTIONS │  MESSAGES PREVIEW         │ │
│ │  ALERT         │  (col-span-4)  │  (col-span-4)             │ │
│ │  (col-span-4)  │  - 6 actions   │  - Latest convos          │ │
│ │  - High pri    │                │                            │ │
│ └────────────────┴────────────────┴───────────────────────────┘ │
│                                                                  │
│ ROW 3                                                            │
│ ┌──────────────────────────────────┬─────────────────────────┐ │
│ │  TEACHING LOAD (col-span-8)      │  PERFORMANCE            │ │
│ │  - Class cards (not table)        │  SNAPSHOT               │ │
│ │  - Section/subject/students       │  (col-span-4)           │ │
│ │  - Quick actions per class        │  - Attendance %         │ │
│ │                                   │  - Grade %              │ │
│ │                                   │  - Announcements        │ │
│ └──────────────────────────────────┴─────────────────────────┘ │
│                                                                  │
│ ROW 4                                                            │
│ ┌──────────────────────────────────┬─────────────────────────┐ │
│ │  RECENT ACTIVITY (col-span-8)    │  UPCOMING EVENTS        │ │
│ │  - Timeline of actions            │  (col-span-4)           │ │
│ │  - Grade/attendance/announce      │  - School calendar      │ │
│ └──────────────────────────────────┴─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Tablet Grid: 6 columns
- Welcome: col-span-6
- Schedule: col-span-6
- Attendance: col-span-3
- Quick Actions: col-span-3
- Messages: col-span-6
- etc.

### Mobile: Single column stack

---

## 🎨 Visual Design System

### Border Radius
- All cards: `rounded-2xl` (16px)
- Inner elements: `rounded-xl` (12px) or `rounded-lg` (8px)

### Shadows
- Default: `shadow-sm`
- Hover: `shadow-md`
- Elevated: `shadow-lg`

### Colors - White Surfaces with Purple Accents

**White/Neutral:**
- Card backgrounds: `bg-white`
- Page background: `bg-slate-50`
- Borders: `border-slate-200/80`

**Purple (Strategic Use):**
- KPIs: `bg-violet-50` with `text-violet-700`
- Primary buttons: `bg-violet-600 hover:bg-violet-700`
- Active states: `border-violet-300`
- Icons hover: `hover:bg-violet-600 hover:text-white`

**Other Accent Colors:**
- Attendance alert: `bg-amber-50` with `border-amber-200`
- Success: `bg-emerald-50` with `text-emerald-600`
- Info: `bg-blue-50` with `text-blue-600`

### Typography
- Page title: `text-2xl font-bold`
- Card titles: `text-sm font-bold uppercase tracking-wide`
- Body: `text-xs md:text-sm font-medium`
- Meta: `text-xs font-semibold text-slate-500`

---

## 🧩 Key Components

### 1. Welcome Card (2x1)
```jsx
- Compact header (~80-100px height)
- Avatar + name + date (left)
- KPI chips (right): Classes, Students, Pending
- Purple gradient avatar
- Clean, spacious layout
```

### 2. Today's Schedule (1x1)
```jsx
- Next class highlighted
- Empty state: "No classes scheduled"
- Clean list with time + subject
```

### 3. Attendance Alert (1x1) - Conditional
```jsx
- Only shows if unmarked classes exist
- Amber warning styling
- One-click "Mark Now" button
- Lists affected classes
```

### 4. Quick Actions (1x1)
```jsx
- 6 icon cards in 3x2 grid
- Color-coded: emerald, violet, blue, indigo, amber, rose
- Hover effect: background fills with action color
```

### 5. Messages Preview (1x1)
```jsx
- Latest 3-4 conversations
- Avatar + name + snippet
- Unread badge
- Click to open full messages
```

### 6. Teaching Load (2x1)
```jsx
- Class cards in 2-column grid
- Each card:
  - Section badge (gradient)
  - Subject name
  - Student count
  - Attendance status badge
  - Two action buttons (attendance/grades)
```

### 7. Performance Snapshot (1x1)
```jsx
- 3 metrics:
  1. Attendance completion % (progress bar)
  2. Grade completion % (progress bar)
  3. Announcements sent (this month)
```

### 8. Recent Activity (2x1)
```jsx
- 2-column grid of activity cards
- Icon + message + timestamp
- Max 6 items shown
```

### 9. Upcoming Events (1x1)
```jsx
- Calendar date badge + event title
- Max 4 events
- Empty state: "No upcoming events"
```

---

## ✅ Implementation Checklist

- [x] Backup original Dashboard.jsx
- [ ] Remove all duplicate old code
- [ ] Implement Bento Grid container with proper col-spans
- [ ] Build Welcome Card (2x1)
- [ ] Build Schedule Widget (1x1)
- [ ] Build Attendance Alert (1x1, conditional)
- [ ] Build Quick Actions (1x1)
- [ ] Build Messages Preview (1x1)
- [ ] Build Teaching Load (2x1, card-based)
- [ ] Build Performance Snapshot (1x1)
- [ ] Build Recent Activity (2x1)
- [ ] Build Upcoming Events (1x1)
- [ ] Test responsive behavior (desktop/tablet/mobile)
- [ ] Verify no breaking changes to API calls
- [ ] Run diagnostics
- [ ] Document changes

---

## 🔧 Technical Notes

### Data Structure
```javascript
// Calculate metrics
const attendanceCompletion = classrooms.length > 0 
  ? Math.round((classrooms.filter(c => todayAttendance[c.id]).length / classrooms.length) * 100)
  : 0;
const gradeCompletion = data?.grade_completion || 0;
const announcementsSent = data?.announcements_sent || 0;
```

### Grid CSS
```jsx
<div className="grid grid-cols-1 sm:grid-cols-6 lg:grid-cols-12 gap-4 md:gap-6 auto-rows-auto">
  <div className="sm:col-span-6 lg:col-span-8">{/* Welcome */}</div>
  <div className="sm:col-span-6 lg:col-span-4">{/* Schedule */}</div>
  // ... etc
</div>
```

---

## 🎯 Success Criteria

✅ **Visual Polish**
- All cards use 16px border radius
- Consistent soft shadows
- Clean white surfaces with purple accents
- No gradient backgrounds (except welcome avatar)

✅ **Layout**
- True CSS Grid (not Flex stacks)
- Different card sizes based on importance
- No unnecessarily tall cards
- Responsive breakpoints work smoothly

✅ **Functionality**
- All existing features preserved
- Zero breaking changes to API calls
- Navigation works correctly
- Loading states handled

✅ **Performance**
- Fast rendering
- Smooth animations
- No layout shift

---

**Design Philosophy**: 
> "Make every pixel count. Remove empty whitespace. 
> Convert lists into compact cards. 
> Use Grid instead of stacked Flex.
> Apple-level polish with academic formality."

