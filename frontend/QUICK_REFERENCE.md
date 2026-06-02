# KNHS Portal - Quick Reference Guide
## For Developers Continuing the Redesign

---

## 🎨 COLOR PALETTE (ALWAYS USE THESE)

```javascript
// Import the design system
import { COLORS } from '../styles/designSystem';

// PRIMARY COLORS
Academic Blue:  #2563eb  (COLORS.blue[600])    // Main action color
DepEd Blue:     #0369a1  (COLORS.deped[700])   // Government official
School Purple:  #7c3aed  (COLORS.purple[600])  // Accent ONLY

// SURFACES
White:          #ffffff  (COLORS.neutral[0])    // Cards, backgrounds
Light Gray:     #f8fafc  (COLORS.neutral[50])   // Page backgrounds
Slate:          #e2e8f0  (COLORS.neutral[200])  // Borders

// SEMANTIC
Success:        #059669  (COLORS.success)       // Attendance, completion
Warning:        #d97706  (COLORS.warning)       // Alerts, pending
Error:          #dc2626  (COLORS.error)         // Urgent, errors
```

---

## 📝 TYPOGRAPHY CLASSES

```javascript
// Page Title
className="text-xl md:text-2xl font-extrabold text-slate-900"

// Section Header
className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-3"

// Card Title
className="text-sm md:text-base font-bold text-slate-900"

// Body Text
className="text-sm text-slate-700"

// Label
className="text-xs font-bold text-slate-600 uppercase tracking-wide"

// Small Text
className="text-xs text-slate-600"
```

---

## 🎯 COMPONENT PATTERNS

### Card (Academic Panel)
```jsx
<Card>
  <CardHeader divider>
    <CardTitle subtitle="Optional subtitle">Card Title</CardTitle>
  </CardHeader>
  <CardBody>
    {/* Content */}
  </CardBody>
</Card>
```

### Stat Card
```jsx
<StatCard 
  label="Label" 
  value={100} 
  sub="Subtitle"
  icon={<svg>...</svg>}
  color="blue"
  onClick={() => navigate('/path')}
  badge={5}  // Optional red badge
/>
```

### Button (Primary)
```jsx
<Button variant="primary" size="md" onClick={handleClick}>
  Action
</Button>

// Variants: "primary", "secondary", "ghost", "danger"
// Sizes: "sm", "md", "lg"
```

### Badge
```jsx
<Badge variant="blue" size="sm">
  Label
</Badge>

// Variants: "blue", "green", "gold", "red", "slate", "purple"
```

### Loading State
```jsx
{loading ? (
  <LoadingSpinner />
) : (
  // Content
)}
```

### Empty State
```jsx
<EmptyState
  title="No data"
  description="Helpful message here"
  icon={<svg>...</svg>}
/>
```

---

## 🏫 SCHOOL BRANDING

### School Header Banner
```jsx
import { SchoolHeaderBanner } from './dashboards/shared';

<SchoolHeaderBanner user={user} today={todayString} />
```

### School Seal Image
```jsx
<img 
  src="/icons/school-logo-source.png" 
  alt="KNHS Seal" 
  className="w-12 h-12"
/>
```

### School Information
```javascript
School Name:      "Kiwalan National High School"
Short Name:       "KNHS"
Tagline:          "Official Digital Campus Portal"
Motto:            "Excellence in Education, Service to Community"
Academic Year:    "2025-2026"
Semester:         "Second Semester"
Quarter:          "Fourth Quarter"
```

---

## 📐 LAYOUT PATTERNS

### Page Container
```jsx
<motion.div
  initial={{ opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, ease: 'easeOut' }}
  className="page-bottom-safe max-w-[1600px] mx-auto min-h-0 bg-slate-50 px-4 py-4 md:px-6 md:py-6 space-y-5 md:space-y-6"
>
  {/* Page content */}
</motion.div>
```

### Grid Layouts
```jsx
// 2 columns on desktop
<div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">

// 3 columns on desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// 4 columns for stats
<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">

// 6 columns for admin stats
<div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
```

### Responsive Spacing
```javascript
Padding:  "p-4 md:p-5"        // Card padding
Gap:      "gap-3 md:gap-4"    // Grid gap
Margin:   "mb-3 md:mb-4"      // Margin bottom
```

---

## 🎨 COMMON TAILWIND CLASSES

### Hover States
```jsx
// Cards
className="hover:border-blue-400 hover:shadow-md transition-all"

// Buttons
className="hover:bg-blue-700 transition-colors"

// Text
className="hover:text-blue-700 transition-colors"
```

### Active States (Navigation)
```jsx
{isActive ? 
  "bg-blue-600 text-white font-bold shadow-sm" :
  "text-slate-600 hover:bg-slate-100 font-semibold"
}
```

### Borders
```jsx
// Card border
className="border border-slate-200"

// Colored left border (stat cards)
className="border-l-4 border-l-blue-500"

// Bottom border (headers)
className="border-b-2 border-blue-600"
```

### Shadows
```jsx
className="shadow-sm"          // Subtle
className="shadow-md"          // Medium
className="hover:shadow-md"    // On hover
```

### Rounded Corners
```jsx
className="rounded-md"         // Standard
className="rounded-sm"         // Smaller
className="rounded-full"       // Circular (badges)
```

---

## 🔧 UTILITY FUNCTIONS

### Import Design System
```javascript
import { cn, COLORS, TYPOGRAPHY, BUTTONS } from '../styles/designSystem';
```

### Combine Classes
```javascript
className={cn(
  "base-class",
  condition && "conditional-class",
  "another-class"
)}
```

### Get Status Badge Color
```javascript
import { getStatusBadge } from '../styles/designSystem';

const badgeClass = getStatusBadge('active');  // Returns 'green'
```

---

## 📱 RESPONSIVE BREAKPOINTS

```javascript
sm:   640px   // Small tablet
md:   768px   // Tablet
lg:   1024px  // Desktop
xl:   1280px  // Large desktop
2xl:  1536px  // Extra large
```

### Usage Examples
```jsx
// Text size
className="text-sm md:text-base lg:text-lg"

// Grid columns
className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

// Padding
className="p-4 md:p-6 lg:p-8"

// Hidden on mobile
className="hidden lg:block"

// Show only on mobile
className="block lg:hidden"
```

---

## 🚀 QUICK COMMANDS

### Test the app
```bash
cd frontend
npm run dev
# Opens at http://localhost:5173/
```

### Check for errors
```bash
npm run lint
```

### Build for production
```bash
npm run build
```

### Git workflow
```bash
git add .
git commit -m "feat: Description of changes"
git push origin main
```

---

## 📂 FILE STRUCTURE

```
frontend/src/
├── styles/
│   └── designSystem.js          # Color palette, typography, tokens
├── components/
│   ├── ui/                      # Reusable UI components
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Input.jsx
│   │   ├── Modal.jsx
│   │   ├── Badge.jsx
│   │   ├── EmptyState.jsx
│   │   └── LoadingSpinner.jsx
│   └── Layout.jsx               # Main layout with sidebar
├── pages/
│   ├── Dashboard.jsx            # Dashboard router
│   └── dashboards/
│       ├── shared.jsx           # Shared dashboard components
│       ├── TeacherDashboard.jsx
│       ├── AdminDashboard.jsx
│       └── StudentDashboard.jsx
└── utils/
    └── api.js                   # API client
```

---

## 🎯 IMPLEMENTATION CHECKLIST

When redesigning a page, ensure:

```
□ Import design system colors (no hardcoded colors)
□ Use extrabold headings
□ Use uppercase labels with tracking
□ White/light backgrounds (not purple)
□ Blue as primary action color
□ School branding visible (if appropriate)
□ Consistent card styling
□ Mobile responsive (test at 320px)
□ Loading state implemented
□ Empty state implemented
□ Error handling added
□ Hover states on interactive elements
□ ARIA labels for accessibility
□ Keyboard navigation works
□ Color contrast passes WCAG AA
```

---

## 🐛 COMMON MISTAKES TO AVOID

❌ Using purple as primary color
✅ Use blue (#2563eb) as primary

❌ Hardcoding colors like `text-purple-600`
✅ Import from designSystem: `COLORS.blue[600]`

❌ Using thin font weights (300, 400)
✅ Use bold (700) or extrabold (800) for headings

❌ Forgetting mobile breakpoints
✅ Always include `md:` and `lg:` variants

❌ Not handling loading/empty states
✅ Use LoadingSpinner and EmptyState components

❌ Inconsistent spacing
✅ Follow pattern: `p-4 md:p-5` or `gap-3 md:gap-4`

---

## 💡 PRO TIPS

1. **Copy existing patterns**: Look at TeacherDashboard or AdminDashboard for reference

2. **Start with layout**: Get the structure right before styling details

3. **Test mobile first**: Design for 320px width, then scale up

4. **Use shared components**: Don't recreate what already exists

5. **Check the design system**: Most tokens you need are already defined

6. **Keep it simple**: DepEd style is clean and professional, not flashy

7. **Ask for clarification**: If unsure about a design decision, ask before implementing

---

## 📚 HELPFUL RESOURCES

### Documentation Files
- `KNHS_REDESIGN_PLAN.md` - Overall design direction
- `DASHBOARD_ENHANCEMENT_SUMMARY.md` - Phase 1 summary
- `NEXT_STEPS_PLAN.md` - Detailed next steps
- `REDESIGN_ROADMAP.md` - Visual progress tracker

### Key Files to Reference
- `designSystem.js` - Complete design tokens
- `shared.jsx` - Reusable dashboard components
- `Layout.jsx` - Sidebar and navigation structure
- `TeacherDashboard.jsx` - Example of DepEd styling

---

## ✅ BEFORE YOU START

1. Pull latest changes: `git pull origin main`
2. Check the roadmap: See what's next in `REDESIGN_ROADMAP.md`
3. Review the design system: Understand the color palette
4. Look at examples: Study completed dashboards
5. Plan mobile-first: Think responsive from the start

---

## 🎓 REMEMBER

**Goal**: Official DepEd Government Education Portal for KNHS
**NOT**: Startup app, consumer app, or generic template
**Colors**: Blue primary, white surfaces, slate borders
**Typography**: Extrabold headings, uppercase labels
**Feel**: Professional, academic, trustworthy

---

**Happy coding!** 🚀
