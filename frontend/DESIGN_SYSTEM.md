# KNHS School Portal Design System

## Overview

This design system establishes a **professional, academic, minimalist, and purple-themed** visual language for the Kiwalan National High School portal.

---

## Design Principles

1. **Professional** — Suitable for official school deployment
2. **Academic** — Reflects educational institution standards
3. **Minimalist** — Clean, uncluttered, focused
4. **Consistent** — Unified design language across all pages
5. **Accessible** — WCAG-compliant, keyboard navigable

---

## Color Palette

### Primary (Academic Purple)
- **Main**: `#8b5cf6` (purple-500)
- **Active**: `#7c3aed` (purple-600)
- **Dark**: `#6d28d9` (purple-700)

### Neutral (Slate)
- **Background**: `#f8fafc` (slate-50)
- **Surface**: `#ffffff` (white)
- **Border**: `#e2e8f0` (slate-200)
- **Text Primary**: `#0f172a` (slate-900)
- **Text Secondary**: `#64748b` (slate-500)

### Semantic
- **Success**: `#10b981` (emerald-600)
- **Warning**: `#f59e0b` (amber-500)
- **Error**: `#ef4444` (red-600)
- **Info**: `#3b82f6` (blue-600)

---

## Typography

### Font Stack
- **Primary**: Inter, system-ui, sans-serif
- **Display**: Montserrat, system-ui, sans-serif

### Scale
- **H1**: `text-2xl md:text-3xl font-bold` (24px/30px)
- **H2**: `text-xl md:text-2xl font-bold` (20px/24px)
- **H3**: `text-lg md:text-xl font-semibold` (18px/20px)
- **Body Large**: `text-base` (16px)
- **Body**: `text-sm` (14px)
- **Body Small**: `text-xs` (12px)
- **Label/Caption**: `text-[11px]` (11px)

### Font Weights
- **Bold**: 700 (headings, emphasis)
- **Semibold**: 600 (subheadings)
- **Medium**: 500 (labels, buttons)
- **Normal**: 400 (body text)

---

## Spacing

### Scale (Tailwind units)
- `0.5` = 2px
- `1` = 4px
- `2` = 8px
- `3` = 12px
- `4` = 16px
- `6` = 24px
- `8` = 32px
- `12` = 48px

### Common Patterns
- **Page Padding**: `p-4 md:p-6 lg:p-8`
- **Card Padding**: `p-4 md:p-6`
- **Section Spacing**: `space-y-6 md:space-y-8`
- **Stack (small)**: `space-y-3`
- **Stack (medium)**: `space-y-4`
- **Stack (large)**: `space-y-6`

---

## Components

### Buttons

#### Primary
```jsx
<Button variant="primary">Submit</Button>
```
- Purple background, white text
- Use for primary CTAs

#### Secondary
```jsx
<Button variant="secondary">Cancel</Button>
```
- White background, slate text, border
- Use for secondary actions

#### Ghost
```jsx
<Button variant="ghost">View More</Button>
```
- No background, hover state
- Use for tertiary actions

#### Danger
```jsx
<Button variant="danger">Delete</Button>
```
- Red background, white text
- Use for destructive actions

### Cards

```jsx
<Card>
  <CardHeader divider>
    <CardTitle subtitle="Optional subtitle">Card Title</CardTitle>
  </CardHeader>
  <CardBody>
    Content goes here
  </CardBody>
  <CardFooter>
    Footer content or actions
  </CardFooter>
</Card>
```

### Inputs

```jsx
<Input 
  label="Email Address" 
  error="Error message"
  hint="Help text"
  required
/>
```

### Badges

```jsx
<Badge variant="purple">Active</Badge>
<Badge variant="green">Approved</Badge>
<Badge variant="red">Rejected</Badge>
```

### Modals

```jsx
<Modal isOpen={isOpen} onClose={onClose} size="md">
  <ModalHeader onClose={onClose} subtitle="Optional">
    Modal Title
  </ModalHeader>
  <ModalBody>
    Modal content
  </ModalBody>
  <ModalFooter>
    <Button variant="secondary" onClick={onClose}>Cancel</Button>
    <Button variant="primary" onClick={handleSubmit}>Confirm</Button>
  </ModalFooter>
</Modal>
```

### Tables

```jsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow interactive>
      <TableCell>John Doe</TableCell>
      <TableCell>john@example.com</TableCell>
      <TableCell><Badge variant="green">Active</Badge></TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Empty States

```jsx
<EmptyState
  icon={<IconComponent />}
  title="No data found"
  description="There are no records to display"
  actionLabel="Create New"
  onAction={handleCreate}
/>
```

### Loading States

```jsx
<LoadingSpinner size="md" message="Loading..." />
<SkeletonCard />
<SkeletonLine width="1/2" />
```

---

## Layout Patterns

### Page Structure
```jsx
<div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
  {/* Page Header */}
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
        Page Title
      </h1>
      <p className="text-sm text-slate-500 mt-1">
        Page description
      </p>
    </div>
    <Button variant="primary">Primary Action</Button>
  </div>

  {/* Page Content */}
  <Card>
    {/* Content */}
  </Card>
</div>
```

### Dashboard Grid
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <StatCard />
  <StatCard />
  <StatCard />
  <StatCard />
</div>
```

### Two-Column Layout
```jsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">
    {/* Main content */}
  </div>
  <div>
    {/* Sidebar */}
  </div>
</div>
```

---

## Responsive Breakpoints

- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

### Mobile-First Strategy
Always design for mobile first, then enhance for larger screens.

```jsx
className="text-sm md:text-base lg:text-lg"
```

---

## Animations

### Available Animations
- `animate-fade-in` — Fade in (400ms)
- `animate-slide-up` — Slide up with fade (300ms)
- `animate-scale-in` — Scale up with fade (250ms)
- `animate-pulse-slow` — Slow pulse (3s)

### Usage
```jsx
<div className="animate-fade-in">
  Content
</div>
```

---

## Accessibility

### Focus States
All interactive elements have visible focus rings:
```jsx
focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500
```

### Keyboard Navigation
- All buttons and links are keyboard accessible
- Modals trap focus and can be closed with Escape
- Tables and lists support arrow key navigation

### ARIA Labels
- Use `aria-label` for icon-only buttons
- Use `aria-describedby` for form hints
- Use `role` attributes appropriately

### Color Contrast
All text meets WCAG AA standards:
- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum

---

## Best Practices

### ✅ Do
- Use design system components
- Follow spacing scale consistently
- Use semantic HTML
- Provide loading and empty states
- Test on mobile devices
- Include error handling

### ❌ Don't
- Create custom button styles
- Use arbitrary spacing values
- Skip accessibility attributes
- Nest cards more than 2 levels deep
- Use too many colors
- Ignore responsive design

---

## File Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/                  # Reusable UI components
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Table.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── index.js
│   │   └── ...
│   ├── styles/
│   │   └── designSystem.js      # Design tokens
│   └── ...
└── DESIGN_SYSTEM.md             # This file
```

---

## Usage Example

```jsx
import { Button, Card, CardHeader, CardBody, Input, Badge } from '../components/ui';

function MyPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">My Page</h1>
      
      <Card>
        <CardHeader divider>
          <h2 className="text-lg font-semibold">Form Title</h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <Input label="Name" placeholder="Enter your name" required />
            <Input label="Email" type="email" placeholder="you@example.com" />
            <Button variant="primary" fullWidth>Submit</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
```

---

## Maintenance

### When Adding New Components
1. Follow existing patterns
2. Use design tokens from `designSystem.js`
3. Ensure responsive behavior
4. Add accessibility attributes
5. Include prop documentation
6. Update this guide

### When Updating Colors
1. Update `tailwind.config.js`
2. Update `designSystem.js`
3. Test contrast ratios
4. Update this guide

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Maintainer**: KNHS Development Team
