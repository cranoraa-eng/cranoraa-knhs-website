# Dashboard Modernization Guide

## Current State Analysis

The Dashboard.jsx file contains:
- ✅ **Good**: Already uses compact, professional styling
- ✅ **Good**: Responsive grid layouts
- ✅ **Good**: Custom components (StatCard, WelcomeBanner, etc.)
- ⚠️ **Needs Update**: Uses inline style tokens instead of new design system
- ⚠️ **Needs Update**: Custom chart styling can be more consistent
- ⚠️ **Needs Update**: Some components can use new Card/Badge system

## Modernization Strategy

### Phase 1: Import New Components
Replace custom components with design system components where appropriate:

```jsx
// Add to imports
import { Card, CardHeader, CardBody, CardTitle, Badge, Button, EmptyState, LoadingSpinner } from '../components/ui';
import { cn } from '../styles/designSystem';
```

### Phase 2: Refactor StatCard
The current StatCard is already well-designed. Minor updates:

```jsx
const StatCard = ({ label, value, sub, icon, color = 'violet', onClick, badge }) => {
  return (
    <Card 
      interactive={!!onClick}
      className="border-l-4 border-l-purple-500 hover:border-l-purple-600"
      onClick={onClick}
    >
      <CardBody className="p-4 flex flex-col justify-between min-h-[120px]">
        <div className="flex items-start justify-between">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            color === 'violet' && "bg-purple-100 text-purple-600",
            color === 'blue' && "bg-blue-100 text-blue-600",
            color === 'emerald' && "bg-emerald-100 text-emerald-600",
            // ... other colors
          )}>
            {icon}
          </div>
          {badge > 0 && (
            <Badge variant="red" size="sm">{badge}</Badge>
          )}
        </div>
        <div className="mt-4">
          <p className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">
            {label}
          </p>
          <h3 className="text-2xl font-bold text-slate-900">
            {value ?? '—'}
          </h3>
          {sub && (
            <p className="text-xs text-slate-500 mt-1">{sub}</p>
          )}
        </div>
      </CardBody>
    </Card>
  );
};
```

### Phase 3: Modernize WelcomeBanner
Keep the current design but use Card component:

```jsx
const WelcomeBanner = ({ user, today, actions, subtitle, statusChips }) => {
  const getGreetingData = () => {
    // ... existing logic
  };

  const greeting = getGreetingData();
  
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-purple-700 to-indigo-800 border-none shadow-xl">
      {/* Decorative orbs */}
      <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
      <div className="absolute -bottom-14 -left-8 h-44 w-44 rounded-full bg-white/10" />
      
      <CardBody className="relative z-10 p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Left content */}
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="purple" className="bg-white/20 text-white border-white/30">
                {greeting.text}
              </Badge>
              <Badge variant="purple" className="bg-white/20 text-white border-white/30">
                {today}
              </Badge>
            </div>
            
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Welcome back, {user?.first_name}
              </h1>
              {subtitle && (
                <p className="text-sm text-purple-200 mt-1">{subtitle}</p>
              )}
            </div>

            {statusChips && (
              <div className="flex flex-wrap gap-2">
                {statusChips.map((chip, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-lg px-3 py-2">
                    <span className="text-lg font-bold text-white">{chip.value}</span>
                    <span className="text-xs text-white/80">{chip.label}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {actions}
            </div>
          </div>

          {/* Right avatar */}
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-white/40 shadow-xl">
                {user?.profile_picture ? (
                  <img src={user.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white" />
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
```

### Phase 4: Modernize Chart Panels

```jsx
// Attendance Trends Panel
<Card>
  <CardHeader divider>
    <div className="flex items-center justify-between">
      <CardTitle subtitle="Last 30 days">
        Attendance Trends
      </CardTitle>
      <Badge variant="purple" dot>Rate %</Badge>
    </div>
  </CardHeader>
  <CardBody>
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        {/* ... chart */}
      </ResponsiveContainer>
    </div>
  </CardBody>
</Card>

// Grade Distribution Panel
<Card>
  <CardHeader divider>
    <div className="flex items-center justify-between">
      <CardTitle subtitle={distView === 'general_average' ? 'General average' : 'All subjects'}>
        Grade Analysis
      </CardTitle>
      <Button variant="ghost" size="sm" onClick={toggleDistView}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </Button>
    </div>
  </CardHeader>
  <CardBody>
    {/* ... pie chart and legend */}
  </CardBody>
</Card>
```

### Phase 5: Modernize Empty States

```jsx
// Replace custom empty states with EmptyState component
<EmptyState
  icon={
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  }
  title="No schedule today"
  description="Enjoy your free time."
/>
```

### Phase 6: Modernize Loading States

```jsx
// Replace Spinner with LoadingSpinner
if (loading) {
  return <LoadingSpinner fullScreen message="Loading dashboard..." />;
}

// Use SkeletonCard for placeholder content
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <SkeletonCard />
  <SkeletonCard />
  <SkeletonCard />
  <SkeletonCard />
</div>
```

### Phase 7: Update Action Buttons

```jsx
// Replace custom buttons with Button component
<Button 
  variant="primary" 
  onClick={() => navigate('/announcements')}
  icon={<PlusIcon />}
>
  Post Announcement
</Button>

{data?.pending_approvals > 0 && (
  <Button 
    variant="primary"
    onClick={() => navigate('/account-approvals')}
  >
    Approvals ({data.pending_approvals})
  </Button>
)}
```

## Implementation Checklist

### Student Dashboard
- [ ] Replace StatCard styling with Card component
- [ ] Update WelcomeBanner to use Card
- [ ] Modernize TodayScheduleWidget with Card + Badge
- [ ] Update QuickActions with Button component
- [ ] Replace loading state with LoadingSpinner
- [ ] Update empty states with EmptyState
- [ ] Ensure responsive grid on mobile

### Teacher Dashboard
- [ ] Apply same updates as Student Dashboard
- [ ] Update class management cards
- [ ] Modernize recent activity feed
- [ ] Update action buttons

### Admin Dashboard
- [ ] Update stat cards grid
- [ ] Modernize chart panels with Card system
- [ ] Update announcement/message widgets
- [ ] Modernize system activity feed
- [ ] Update grade distribution visualization
- [ ] Ensure all modals use Modal component

## Color Consistency

Replace custom color tokens with design system:

```jsx
// OLD
const DASH_PANEL = 'bg-white border border-violet-200/90 shadow-sm rounded-sm';

// NEW - use Card component
<Card className="...">
```

## Testing Checklist

After modernization:
- [ ] Test all 3 dashboard views (Student, Teacher, Admin)
- [ ] Verify responsiveness on mobile/tablet/desktop
- [ ] Check all interactive elements (clicks, hovers)
- [ ] Verify charts render correctly
- [ ] Test loading states
- [ ] Test empty states
- [ ] Verify all navigation links work
- [ ] Check stat card click handlers
- [ ] Test schedule widget
- [ ] Verify announcements display correctly
- [ ] Test messages widget

## Notes

- **Keep existing logic**: All API calls, data processing, and business logic remain unchanged
- **Preserve animations**: Maintain framer-motion animations
- **Keep chart styling**: Recharts configuration is already professional
- **Mobile-first**: Ensure all changes work on mobile first
- **Accessibility**: Add ARIA labels where needed

## Example: Before & After

### Before (Current)
```jsx
<div className="bg-white border border-violet-200 shadow-sm rounded-sm p-4">
  <h3 className="text-sm font-bold text-slate-900">Panel Title</h3>
  {/* content */}
</div>
```

### After (Modernized)
```jsx
<Card>
  <CardHeader divider>
    <CardTitle>Panel Title</CardTitle>
  </CardHeader>
  <CardBody>
    {/* content */}
  </CardBody>
</Card>
```

## Priority Order

1. ✅ Import new components
2. ⏳ Update StatCard (high impact, visible everywhere)
3. ⏳ Modernize WelcomeBanner (first thing users see)
4. ⏳ Update chart panels (major visual elements)
5. ⏳ Replace loading/empty states
6. ⏳ Update all buttons
7. ⏳ Polish responsive behavior
8. ⏳ Accessibility audit

---

**Next Steps**: Begin with StatCard refactoring as it's used across all dashboard views.
