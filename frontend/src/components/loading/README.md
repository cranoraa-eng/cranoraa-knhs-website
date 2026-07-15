# Loading Components

This directory contains loading indicators and skeleton UI components for the application.

## RouteLoadingIndicator

A loading indicator specifically designed for route transitions with lazy-loaded components.

### Features

- **Delayed Display**: Only shows after 200ms threshold (configurable) to prevent flash of loading state for fast loads
- **Accessibility**: Full ARIA support with proper roles, labels, and screen reader announcements
- **Customizable**: Supports custom threshold and loading text
- **TypeScript**: Fully typed with TypeScript interfaces

### Usage

```tsx
import { Suspense, lazy } from 'react';
import RouteLoadingIndicator from '@/components/loading/RouteLoadingIndicator';

const Dashboard = lazy(() => import('./pages/Dashboard'));

function App() {
  return (
    <Suspense fallback={<RouteLoadingIndicator />}>
      <Dashboard />
    </Suspense>
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `threshold` | `number` | `200` | Delay in milliseconds before showing the loading indicator |
| `loadingText` | `string` | `'Loading page...'` | Custom text to display below the spinner |

### Examples

**Default usage:**
```tsx
<RouteLoadingIndicator />
```

**Custom threshold (500ms):**
```tsx
<RouteLoadingIndicator threshold={500} />
```

**Custom loading text:**
```tsx
<RouteLoadingIndicator loadingText="Loading dashboard..." />
```

**Both custom props:**
```tsx
<RouteLoadingIndicator 
  threshold={300} 
  loadingText="Fetching your data..." 
/>
```

### Requirements Validation

This component satisfies **Requirement 1.5** from the performance-code-quality spec:
- ✅ Displays loading indicator for route chunks that take >200ms to load
- ✅ Provides proper ARIA labels for accessibility
- ✅ Prevents flash of loading state with configurable threshold
- ✅ Full TypeScript support

### Accessibility

The component implements the following accessibility features:

- `role="status"` - Identifies the element as a status message
- `aria-live="polite"` - Announces changes to screen readers without interruption
- `aria-label="Loading page content"` - Describes the loading state
- `aria-hidden="true"` on spinner - Hides decorative animation from screen readers
- Screen reader only text - Provides additional context for assistive technologies

### Testing

Unit tests are available in `RouteLoadingIndicator.test.tsx` covering:
- Threshold behavior (default and custom)
- Accessibility features (ARIA attributes)
- Visual content rendering
- Component cleanup on unmount

Run tests:
```bash
npm test -- RouteLoadingIndicator.test.tsx
```
