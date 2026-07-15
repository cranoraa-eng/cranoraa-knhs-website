# Technical Design Document: Performance and Code Quality Improvements

## Overview

This design outlines a comprehensive approach to improving the performance, code quality, and developer experience of the KNHS School Portal. The portal is built with React 18 and Vite on the frontend, with a Django REST Framework backend.

### Current State

The application currently has:
- **Build System**: Vite 5.0.8 with basic vendor chunking
- **Type System**: JavaScript with minimal TypeScript infrastructure (@types packages installed but no TypeScript files)
- **Code Quality**: ESLint configured but no Prettier, no pre-commit hooks
- **Bundle Size**: Vendor chunking in place but no route-level code splitting
- **Performance**: No memoization patterns, no virtual scrolling, basic lazy loading for routes
- **Error Handling**: Basic error boundaries but inconsistent API error handling

### Goals

1. **Performance**: Reduce initial bundle size to <200KB gzipped, implement route and component lazy loading
2. **Code Quality**: Establish TypeScript migration path, fix deprecated APIs, enforce consistent formatting
3. **Developer Experience**: Improve IDE support, error messages, and tooling
4. **Maintainability**: Create clear patterns for error handling, type definitions, and code organization

### Design Principles

- **Progressive Enhancement**: Gradual TypeScript migration without blocking feature development
- **Zero Breaking Changes**: All improvements must maintain backward compatibility
- **Measurable Impact**: Each optimization must have clear performance metrics
- **Developer Productivity**: Tooling should accelerate development, not slow it down


## Architecture

### Build System Architecture

The build system is responsible for code splitting, tree shaking, and bundle optimization using Vite's Rollup-based build pipeline.

```
┌──────────────────────────────────────────────────────────────┐
│                    Source Files                              │
│  (JSX/TSX, CSS, Assets)                                      │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                 Vite Build Pipeline                          │
│                                                              │
│  ┌────────────────┐    ┌──────────────┐    ┌─────────────┐ │
│  │ TypeScript     │───▶│ React        │───▶│ Rollup      │ │
│  │ Compiler       │    │ Transform    │    │ Bundler     │ │
│  └────────────────┘    └──────────────┘    └─────────────┘ │
│                                                   │          │
│                                                   ▼          │
│                                          ┌──────────────┐   │
│                                          │ Tree Shaking │   │
│                                          │ Dead Code    │   │
│                                          │ Elimination  │   │
│                                          └──────────────┘   │
│                                                   │          │
│                                                   ▼          │
│                                          ┌──────────────┐   │
│                                          │ Code         │   │
│                                          │ Splitting    │   │
│                                          └──────────────┘   │
└──────────────────────────────────────────────┬───────────────┘
                                               │
                                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    Output Bundles                            │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Main Bundle  │  │ Vendor       │  │ Route Chunks     │  │
│  │ <200KB gz    │  │ Chunks       │  │ (Lazy Loaded)    │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Component    │  │ Shared       │  │ CSS Modules      │  │
│  │ Chunks       │  │ Dependencies │  │ (Extracted)      │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

**Key Components:**

1. **TypeScript Compiler**: Transpiles .ts/.tsx files to JavaScript with type checking
2. **React Transform**: JSX → JavaScript, handles Fast Refresh
3. **Rollup Bundler**: Module bundling, chunk generation, asset optimization
4. **Tree Shaking**: Eliminates unused exports from modules
5. **Code Splitting**: Creates separate chunks for routes, components, and vendors


### TypeScript Integration Architecture

TypeScript will be introduced gradually using a **hybrid JavaScript/TypeScript approach**.

```
┌──────────────────────────────────────────────────────────────┐
│                  TypeScript Configuration                    │
│                                                              │
│  tsconfig.json                                               │
│  ├── strict: true                                            │
│  ├── allowJs: true                                           │
│  ├── checkJs: false                                          │
│  └── skipLibCheck: true                                      │
└──────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                Migration Strategy                            │
│                                                              │
│  Phase 1: Type Definitions                                   │
│  └── Create interfaces for API responses, domain models      │
│                                                              │
│  Phase 2: Core Utilities                                     │
│  └── Migrate api.js, auth.js to TypeScript                  │
│                                                              │
│  Phase 3: Shared Components                                  │
│  └── Migrate reusable UI components                         │
│                                                              │
│  Phase 4: Feature Pages                                      │
│  └── Gradually migrate page components                      │
└──────────────────────────────────────────────────────────────┘
```

**Migration Rules:**

- New files: Write in TypeScript (.ts/.tsx)
- Existing files: Migrate on touch (when making changes)
- Type definitions: Create .d.ts files for JavaScript modules
- No forced migration: JavaScript remains valid indefinitely


### Error Handling Architecture

Centralized error handling system for consistent user feedback and logging.

```
┌──────────────────────────────────────────────────────────────┐
│                    Error Sources                             │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐ │
│  │ API Errors │  │ Component  │  │ Form Validation Errors │ │
│  │ (axios)    │  │ Errors     │  │ (client-side)          │ │
│  └─────┬──────┘  └─────┬──────┘  └───────────┬────────────┘ │
└────────┼────────────────┼─────────────────────┼──────────────┘
         │                │                     │
         ▼                ▼                     ▼
┌──────────────────────────────────────────────────────────────┐
│                   Error Handlers                             │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ API Error Interceptor (axios.interceptors.response)     ││
│  │ ├── 401: Token refresh → retry                          ││
│  │ ├── 4xx: Display user-friendly message                  ││
│  │ ├── 5xx: Display "Try again" with retry button          ││
│  │ └── Timeout: Display connection failure message         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Error Boundary (React Component)                        ││
│  │ ├── Catches rendering errors                            ││
│  │ ├── Logs stack trace to console                         ││
│  │ └── Displays fallback UI with reload option             ││
│  └─────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│                  User Feedback                               │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Toast        │  │ Inline Field │  │ Error Boundary   │  │
│  │ Notifications│  │ Errors       │  │ Fallback UI      │  │
│  │ (6 seconds)  │  │ (Form)       │  │ (Component)      │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```


### Performance Monitoring Architecture

Runtime performance tracking and optimization identification.

```
┌──────────────────────────────────────────────────────────────┐
│              React DevTools Profiler API                     │
│                                                              │
│  <Profiler id="App" onRender={onRenderCallback}>            │
│    <ComponentTree />                                         │
│  </Profiler>                                                 │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│               Performance Metrics Collection                 │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Component Render Times                                  │ │
│  │ ├── Component name                                      │ │
│  │ ├── Actual render duration (ms)                         │ │
│  │ └── Base duration (ms)                                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Web Vitals                                              │ │
│  │ ├── Time to Interactive (TTI)                           │ │
│  │ ├── First Contentful Paint (FCP)                        │ │
│  │ └── Largest Contentful Paint (LCP)                      │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                Analysis & Recommendations                    │
│                                                              │
│  IF render time > 16ms THEN                                  │
│    → Recommend memoization (React.memo, useMemo, useCallback)│
│                                                              │
│  IF context triggers 5+ child re-renders THEN                │
│    → Recommend context splitting                            │
│                                                              │
│  IF list contains 100+ items THEN                            │
│    → Recommend virtual scrolling                            │
└──────────────────────────────────────────────────────────────┘
```


## Components and Interfaces

### Bundle Optimizer Component

**Responsibilities:**
- Configure Vite/Rollup for optimal code splitting
- Implement route-based chunk generation
- Generate bundle analysis reports
- Enforce bundle size limits

**Configuration:**

```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor chunks (existing)
          if (id.includes('node_modules/react')) return 'vendor-react';
          if (id.includes('node_modules/recharts')) return 'vendor-charts';
          
          // Route-based chunks (new)
          if (id.includes('/pages/')) {
            const pageName = id.split('/pages/')[1].split('.')[0];
            return `page-${pageName.toLowerCase()}`;
          }
          
          // Component chunks for large components (>50KB)
          if (id.includes('/components/') && isLargeComponent(id)) {
            return 'component-heavy';
          }
        }
      }
    },
    chunkSizeWarningLimit: 200, // Main bundle <200KB
  }
});
```


### Route Lazy Loader Component

**Interface:**

```typescript
interface RouteConfig {
  path: string;
  element: React.LazyExoticComponent<React.ComponentType>;
  roles?: string[];
  redirect?: string;
  props?: Record<string, any>;
}

interface LazyRouteProps {
  config: RouteConfig;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  loadingThreshold?: number; // Default: 200ms
  retryAttempts?: number; // Default: 3
}
```

**Implementation Pattern:**

```jsx
// Current pattern (already in routes.js)
const Dashboard = lazy(() => import('../pages/Dashboard'));

// Enhanced with error handling
const DashboardWithRetry = lazy(() => 
  retryImport(() => import('../pages/Dashboard'), 3)
);

// Loading wrapper
<Suspense fallback={<RouteLoadingIndicator />}>
  <DashboardWithRetry />
</Suspense>
```

**Retry Logic:**

```typescript
function retryImport<T>(
  importFn: () => Promise<{ default: T }>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<{ default: T }> {
  return importFn().catch((error) => {
    if (maxRetries === 0) throw error;
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(retryImport(importFn, maxRetries - 1, delay));
      }, delay);
    });
  });
}
```


### Component Lazy Loader

**Identification Strategy:**

Identify components >50KB using build analysis:

```bash
# Generate bundle report
npm run build -- --mode production --report

# Analyze component sizes
npx vite-bundle-visualizer
```

**Implementation Pattern:**

```jsx
// Heavy components (modals, charts, editors)
const PostComposerModal = lazy(() => 
  import('../components/announcements/PostComposerModal')
);
const ReportChart = lazy(() => 
  import('../components/charts/ReportChart')
);

// Usage with preloading for critical components
function Dashboard() {
  useEffect(() => {
    // Preload on idle
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        import('../components/announcements/PostComposerModal');
      });
    }
  }, []);
  
  return (
    <Suspense fallback={<Spinner />}>
      <PostComposerModal />
    </Suspense>
  );
}
```

**Error Boundary Wrapper:**

```typescript
interface LazyComponentWrapperProps {
  loader: () => Promise<{ default: React.ComponentType }>;
  fallback?: React.ReactNode;
  maxRetries?: number;
}

function LazyComponentWrapper({ 
  loader, 
  fallback = <Spinner />,
  maxRetries = 3 
}: LazyComponentWrapperProps) {
  const Component = lazy(() => retryImport(loader, maxRetries));
  
  return (
    <ErrorBoundary fallback={<ComponentErrorFallback />}>
      <Suspense fallback={fallback}>
        <Component />
      </Suspense>
    </ErrorBoundary>
  );
}
```


### Deprecation Fixer Component

**Detection Strategy:**

Use AST analysis to find deprecated APIs:

```javascript
// ESLint custom rule
module.exports = {
  rules: {
    'no-deprecated-substr': {
      create(context) {
        return {
          MemberExpression(node) {
            if (node.property.name === 'substr') {
              context.report({
                node,
                message: 'substr is deprecated. Use substring or slice instead.'
              });
            }
          }
        };
      }
    }
  }
};
```

**Automated Replacement:**

```javascript
// Codemod using jscodeshift
module.exports = function(fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);
  
  // Replace String.prototype.substr
  root
    .find(j.CallExpression, {
      callee: {
        type: 'MemberExpression',
        property: { name: 'substr' }
      }
    })
    .replaceWith(path => {
      const args = path.value.arguments;
      const start = args[0];
      const length = args[1];
      
      // Negative index → use slice
      if (start.type === 'UnaryExpression' && start.operator === '-') {
        return j.callExpression(
          j.memberExpression(path.value.callee.object, j.identifier('slice')),
          [start, length]
        );
      }
      
      // Positive index → use substring
      return j.callExpression(
        j.memberExpression(path.value.callee.object, j.identifier('substring')),
        [start, length ? j.binaryExpression('+', start, length) : undefined].filter(Boolean)
      );
    });
  
  return root.toSource();
};
```


### Code Quality System

**ESLint Configuration:**

```javascript
// .eslintrc.cjs
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier' // Disables ESLint rules that conflict with Prettier
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['react', 'react-hooks', '@typescript-eslint'],
  rules: {
    'react/prop-types': 'off', // TypeScript handles this
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    'react-hooks/exhaustive-deps': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }]
  },
  settings: {
    react: { version: 'detect' }
  }
};
```

**Prettier Configuration:**

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "always"
}
```

**Pre-commit Hooks (Husky + lint-staged):**

```json
// package.json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,css,md}": [
      "prettier --write"
    ]
  }
}
```


### Type Migration Tool

**TypeScript Configuration:**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    
    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    
    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    
    /* Gradual migration */
    "allowJs": true,
    "checkJs": false,
    
    /* Path aliases */
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@utils/*": ["src/utils/*"],
      "@pages/*": ["src/pages/*"],
      "@types/*": ["src/types/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

**Migration Workflow:**

1. Create `src/types/index.ts` for shared types
2. Migrate utilities: `api.js` → `api.ts`, `auth.js` → `auth.ts`
3. Generate `.d.ts` files for JavaScript modules still being used
4. Gradually convert components as they're touched


### Performance Monitor Component

**React Profiler Integration:**

```typescript
interface PerformanceMetrics {
  componentName: string;
  phase: 'mount' | 'update';
  actualDuration: number;
  baseDuration: number;
  startTime: number;
  commitTime: number;
}

function PerformanceMonitor({ children }: { children: React.ReactNode }) {
  const handleRender = (
    id: string,
    phase: 'mount' | 'update',
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number
  ) => {
    if (actualDuration > 16) { // > 1 frame at 60fps
      console.warn(`Slow component: ${id}`, {
        phase,
        actualDuration: `${actualDuration.toFixed(2)}ms`,
        recommendation: getSuggestion(actualDuration)
      });
    }
    
    // Collect metrics in development
    if (import.meta.env.DEV) {
      window.__PERF_METRICS__ = window.__PERF_METRICS__ || [];
      window.__PERF_METRICS__.push({
        componentName: id,
        phase,
        actualDuration,
        baseDuration,
        startTime,
        commitTime,
        timestamp: Date.now()
      });
    }
  };
  
  return (
    <Profiler id="App" onRender={handleRender}>
      {children}
    </Profiler>
  );
}

function getSuggestion(duration: number): string {
  if (duration > 100) return 'Consider code splitting this component';
  if (duration > 50) return 'Consider virtualization for lists';
  if (duration > 16) return 'Consider React.memo or useMemo';
  return 'Performance acceptable';
}
```


**Web Vitals Integration:**

```typescript
import { onCLS, onFCP, onLCP, onTTFB, onINP } from 'web-vitals';

export function initWebVitals() {
  if (import.meta.env.PROD) {
    onCLS(metric => sendToAnalytics('CLS', metric));
    onFCP(metric => sendToAnalytics('FCP', metric));
    onLCP(metric => sendToAnalytics('LCP', metric));
    onTTFB(metric => sendToAnalytics('TTFB', metric));
    onINP(metric => sendToAnalytics('INP', metric));
  } else {
    // Log to console in development
    onCLS(console.log);
    onFCP(console.log);
    onLCP(console.log);
    onTTFB(console.log);
    onINP(console.log);
  }
}

function sendToAnalytics(metricName: string, metric: any) {
  // Send to backend analytics endpoint
  fetch('/api/v1/analytics/vitals/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: metricName,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id
    })
  }).catch(() => {
    // Silently fail - don't break app for analytics
  });
}
```


### Memoization Engine

**Optimization Patterns:**

```typescript
// 1. React.memo for pure components
interface StudentCardProps {
  student: Student;
  onClick: (id: string) => void;
}

const StudentCard = React.memo(({ student, onClick }: StudentCardProps) => {
  return (
    <div onClick={() => onClick(student.id)}>
      {student.name}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if student data changed
  return prevProps.student.id === nextProps.student.id &&
         prevProps.student.name === nextProps.student.name;
});

// 2. useMemo for expensive computations
function GradeAnalytics({ grades }: { grades: Grade[] }) {
  const statistics = useMemo(() => {
    return {
      average: grades.reduce((sum, g) => sum + g.score, 0) / grades.length,
      median: calculateMedian(grades.map(g => g.score)),
      distribution: calculateDistribution(grades)
    };
  }, [grades]); // Only recompute when grades array changes
  
  return <StatisticsDisplay data={statistics} />;
}

// 3. useCallback for stable function references
function StudentList({ students }: { students: Student[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Without useCallback, this function is recreated on every render
  // causing all StudentCard children to re-render
  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []); // No dependencies - function never changes
  
  return (
    <>
      {students.map(student => (
        <StudentCard
          key={student.id}
          student={student}
          onClick={handleSelect} // Stable reference
        />
      ))}
    </>
  );
}
```


### Virtual Scroller Component

**Implementation using react-window:**

```typescript
import { FixedSizeList, VariableSizeList } from 'react-window';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number | ((index: number) => number);
  renderItem: (item: T, index: number) => React.ReactNode;
  height: number;
  width: string | number;
}

function VirtualList<T>({ 
  items, 
  itemHeight, 
  renderItem,
  height,
  width 
}: VirtualListProps<T>) {
  const isFixedHeight = typeof itemHeight === 'number';
  
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      {renderItem(items[index], index)}
    </div>
  );
  
  if (isFixedHeight) {
    return (
      <FixedSizeList
        height={height}
        itemCount={items.length}
        itemSize={itemHeight}
        width={width}
      >
        {Row}
      </FixedSizeList>
    );
  }
  
  return (
    <VariableSizeList
      height={height}
      itemCount={items.length}
      itemSize={itemHeight as (index: number) => number}
      width={width}
    >
      {Row}
    </VariableSizeList>
  );
}

// Usage example
function StudentDirectory({ students }: { students: Student[] }) {
  if (students.length < 100) {
    // Regular rendering for small lists
    return students.map(s => <StudentCard key={s.id} student={s} />);
  }
  
  // Virtual scrolling for large lists
  return (
    <VirtualList
      items={students}
      itemHeight={80}
      height={600}
      width="100%"
      renderItem={(student) => <StudentCard student={student} />}
    />
  );
}
```


### Image Optimizer Component

**Implementation:**

```typescript
interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  placeholder?: string;
}

function OptimizedImage({ 
  src, 
  alt, 
  className,
  sizes,
  loading = 'lazy',
  placeholder = '/placeholder.svg'
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Fallback to intersection observer if native lazy loading not supported
  useEffect(() => {
    if (!('loading' in HTMLImageElement.prototype) && imgRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting && imgRef.current) {
              imgRef.current.src = src;
              observer.unobserve(entry.target);
            }
          });
        },
        { rootMargin: '50px' }
      );
      
      observer.observe(imgRef.current);
      return () => observer.disconnect();
    }
  }, [src]);
  
  return (
    <div className={`relative ${className}`}>
      {!isLoaded && !error && (
        <img 
          src={placeholder} 
          alt="" 
          className="absolute inset-0 blur-sm"
          aria-hidden="true"
        />
      )}
      <img
        ref={imgRef}
        src={loading === 'eager' ? src : undefined}
        data-src={loading === 'lazy' ? src : undefined}
        alt={alt}
        loading={loading}
        sizes={sizes}
        onLoad={() => setIsLoaded(true)}
        onError={() => setError(true)}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
      {error && (
        <div className="flex items-center justify-center bg-gray-100">
          Failed to load image
        </div>
      )}
    </div>
  );
}
```


## Data Models

### Type Definitions

All TypeScript interfaces and types will be defined in `src/types/index.ts`.

**Core Domain Models:**

```typescript
// User and Authentication
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'staff' | 'student' | 'parent';
  is_approved: boolean;
  is_verified: boolean;
}

export interface Profile {
  id: string;
  user: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  contact_information?: string;
  date_of_birth?: string;
  registration_number?: string;
}

export interface AuthTokens {
  access: string;
  refresh?: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
  profile: Profile;
}

// Academic Models
export interface Classroom {
  id: string;
  name: string;
  grade_level: number;
  section: string;
  school_year: string;
  adviser: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface Grade {
  id: string;
  student: string;
  subject: string;
  quarter: 1 | 2 | 3 | 4;
  written_work?: number;
  performance_task?: number;
  quarterly_exam?: number;
  final_grade: number;
}
```


**API Response Types:**

```typescript
// Generic API response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  detail?: string;
  message?: string;
  errors?: Record<string, string[]>;
}

// Specific response types
export interface AnnouncementResponse {
  id: string;
  title: string;
  content: string;
  author: string;
  created_at: string;
  is_public: boolean;
  priority: 'low' | 'normal' | 'high';
  expiration_date?: string;
  attachment?: string;
}

export interface NotificationResponse {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  related_object_id?: string;
}

export interface AttendanceRecord {
  id: string;
  student: string;
  classroom: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  remarks?: string;
}
```


**Utility Function Types:**

```typescript
// API utility types (for api.ts migration)
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestConfig {
  url: string;
  method?: HttpMethod;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
}

export interface ApiClient {
  get<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>>;
  post<T>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>>;
  put<T>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>>;
  patch<T>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>>;
  delete<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>>;
}

// Auth utility types (for auth.ts migration)
export interface TokenManager {
  getAccessToken(): string | null;
  updateTokens(access: string, refresh?: string): void;
  clearSession(): void;
  isAuthenticated(): boolean;
}

// Performance monitoring types
export interface PerformanceMetric {
  componentName: string;
  renderTime: number;
  timestamp: number;
  phase: 'mount' | 'update';
}

export interface WebVital {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}
```


## Error Handling

### Error Classification

Errors are classified into four categories, each with specific handling strategies:

**1. Network Errors**
- Timeouts (>30 seconds)
- Connection failures
- DNS resolution errors
- Handler: Axios interceptor
- User feedback: Toast notification with retry button

**2. HTTP Errors**
- 401 Unauthorized → Token refresh → Retry request
- 4xx Client errors → Display error message from response
- 5xx Server errors → Display "Try again" with retry
- Handler: Axios response interceptor
- User feedback: Toast notification (6 seconds)

**3. Component Rendering Errors**
- Runtime exceptions during render
- Invalid props or state
- Handler: Error Boundary component
- User feedback: Fallback UI with reload option
- Logging: Stack trace to console

**4. Form Validation Errors**
- Field-level validation (Yup schema)
- Cross-field validation
- Handler: Form component local state
- User feedback: Inline error messages below fields
- No toast notifications (field errors only)


### Error Handler Implementation

**Enhanced API Error Interceptor:**

```typescript
// Extend existing api.js error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    
    // Log all API errors (non-blocking)
    logApiError(error);
    
    // 401: Token refresh (existing logic)
    if (error.response?.status === 401 && !original._retry) {
      return handleTokenRefresh(error, original);
    }
    
    // 5xx: Server errors
    if (error.response?.status >= 500) {
      showErrorToast({
        message: 'Server temporarily unavailable. Please try again.',
        action: { label: 'Retry', onClick: () => api.request(original) }
      });
    }
    
    // 4xx: Client errors (except 401)
    if (error.response?.status >= 400 && error.response?.status < 500) {
      const message = error.response.data?.detail || 
                      error.response.data?.message ||
                      'An error occurred. Please try again.';
      showErrorToast({ message });
    }
    
    // Timeout errors
    if (error.code === 'ECONNABORTED') {
      showErrorToast({
        message: 'Request timed out. Check your connection.',
        action: { label: 'Retry', onClick: () => api.request(original) }
      });
    }
    
    return Promise.reject(error);
  }
);

function logApiError(error: any) {
  console.error('[API Error]', {
    timestamp: new Date().toISOString(),
    status: error.response?.status,
    url: error.config?.url,
    method: error.config?.method,
    message: error.message,
    user: getStoredUser()?.role
  });
}
```


**Enhanced Error Boundary:**

```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class EnhancedErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to console with stack trace
    console.error('[Component Error]', {
      timestamp: new Date().toISOString(),
      component: errorInfo.componentStack,
      error: error.message,
      stack: error.stack
    });
    
    this.setState({ errorInfo });
    
    // Optional: Send to error tracking service
    if (import.meta.env.PROD) {
      sendErrorToTracking(error, errorInfo);
    }
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <h1 className="text-xl font-bold text-red-600 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-700 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={this.handleReload}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Reload Page
            </button>
            {import.meta.env.DEV && this.state.errorInfo && (
              <details className="mt-4 text-sm text-gray-600">
                <summary className="cursor-pointer">Error Details</summary>
                <pre className="mt-2 overflow-auto">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```


### Error Recovery Strategies

**Retry with Exponential Backoff:**

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}
```

**Graceful Degradation:**

```typescript
// When a non-critical feature fails, continue with reduced functionality
async function loadOptionalFeature() {
  try {
    const feature = await import('./OptionalFeature');
    return feature.default;
  } catch (error) {
    console.warn('Optional feature failed to load, continuing without it', error);
    return null; // Graceful degradation
  }
}
```


## Testing Strategy

This project primarily involves **infrastructure configuration, build tooling, and code quality setup**. Property-based testing is **not appropriate** for this type of work. Instead, we will use:

### Testing Approach

**1. Unit Tests** (Vitest)
- Test utility functions (retryImport, retryWithBackoff, URL normalization)
- Test React components (error boundaries, lazy wrappers)
- Test memoization correctness
- Test deprecation fixer transformations

**2. Integration Tests** (Vitest + Testing Library)
- Test route lazy loading with actual imports
- Test error boundary with component failures
- Test API error handling with mock responses
- Test form validation error display

**3. Build Verification Tests**
- Verify bundle sizes meet requirements (<200KB main, <500KB total gzipped)
- Verify code splitting produces separate route chunks
- Verify tree shaking eliminates unused code
- Use `npm run build` + bundle analyzer

**4. Type Checking Tests**
- Verify TypeScript compilation succeeds for .ts/.tsx files
- Verify type definitions are correct and usable
- Use `tsc --noEmit` in CI/CD pipeline

**5. Linting Tests**
- Verify ESLint passes with zero errors
- Verify Prettier formatting is consistent
- Use pre-commit hooks + CI checks

**6. Manual Testing**
- Performance profiling with React DevTools
- Visual verification of lazy loading indicators
- Error boundary testing with intentional errors
- Web Vitals measurement in production


### Why Property-Based Testing is Not Applicable

Property-based testing (PBT) is designed for testing **pure functions and algorithms** with universal properties across wide input spaces. This project involves:

- **Infrastructure as Code**: Vite/Rollup configuration, TypeScript setup
- **Configuration files**: ESLint, Prettier, tsconfig.json
- **Build tooling**: Code splitting, tree shaking, bundle optimization
- **Developer experience tools**: IDE integrations, error messages
- **UI patterns**: Loading indicators, error boundaries (not pure functions)

These are **declarative configurations and tooling setups**, not algorithms with testable properties. The appropriate testing strategies are:

- **Snapshot tests** for build outputs (bundle sizes, chunk names)
- **Integration tests** for build pipeline (does it produce correct artifacts?)
- **Schema validation** for configuration files (are they valid JSON/JS?)
- **Example-based unit tests** for utility functions (retry logic, URL parsing)

### Test Coverage Goals

- **Unit tests**: 80%+ coverage for utility functions
- **Integration tests**: Cover all critical user flows (lazy loading, error handling)
- **Type coverage**: 100% of migrated TypeScript files must compile without errors
- **Build tests**: All builds must pass bundle size limits
- **Linting**: Zero ESLint errors, zero Prettier violations

### Test Execution

```bash
# Unit tests
npm run test

# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Build verification
npm run build && npx vite-bundle-visualizer

# Pre-commit (automatic)
git commit # Triggers lint-staged → ESLint + Prettier
```


### Example Test Cases

**Unit Test: Retry Logic**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { retryImport } from './lazyLoading';

describe('retryImport', () => {
  it('should succeed on first attempt if import succeeds', async () => {
    const mockImport = vi.fn().mockResolvedValue({ default: 'Component' });
    const result = await retryImport(mockImport, 3);
    expect(result).toEqual({ default: 'Component' });
    expect(mockImport).toHaveBeenCalledTimes(1);
  });

  it('should retry up to maxRetries times', async () => {
    const mockImport = vi.fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValueOnce({ default: 'Component' });
    
    const result = await retryImport(mockImport, 3);
    expect(result).toEqual({ default: 'Component' });
    expect(mockImport).toHaveBeenCalledTimes(3);
  });

  it('should throw error after max retries exhausted', async () => {
    const mockImport = vi.fn().mockRejectedValue(new Error('Always fails'));
    await expect(retryImport(mockImport, 3)).rejects.toThrow('Always fails');
    expect(mockImport).toHaveBeenCalledTimes(3);
  });
});
```

**Integration Test: Error Boundary**

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ErrorBoundary from './ErrorBoundary';

const ThrowError = () => {
  throw new Error('Test error');
};

describe('ErrorBoundary', () => {
  it('should catch errors and display fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/test error/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();
  });

  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Normal content</div>
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });
});
```


**Build Test: Bundle Size Verification**

```typescript
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { gzipSync } from 'zlib';
import { glob } from 'glob';

describe('Build artifacts', () => {
  it('should have main bundle < 200KB gzipped', () => {
    const mainBundle = glob.sync('dist/assets/index-*.js')[0];
    const content = readFileSync(mainBundle);
    const gzipped = gzipSync(content);
    const sizeKB = gzipped.length / 1024;
    
    expect(sizeKB).toBeLessThan(200);
  });

  it('should have total bundle < 500KB gzipped', () => {
    const allBundles = glob.sync('dist/assets/*.js');
    const totalSize = allBundles.reduce((sum, file) => {
      const content = readFileSync(file);
      const gzipped = gzipSync(content);
      return sum + gzipped.length;
    }, 0);
    
    const totalSizeKB = totalSize / 1024;
    expect(totalSizeKB).toBeLessThan(500);
  });

  it('should create separate chunks for routes', () => {
    const chunks = glob.sync('dist/assets/page-*.js');
    expect(chunks.length).toBeGreaterThan(5); // At least 5 route chunks
  });
});
```

**Unit Test: Deprecation Fixer**

```typescript
import { describe, it, expect } from 'vitest';
import { replaceSubstr } from './deprecationFixer';

describe('replaceSubstr', () => {
  it('should replace positive index substr with substring', () => {
    const input = 'str.substr(0, 5)';
    const output = replaceSubstr(input);
    expect(output).toBe('str.substring(0, 5)');
  });

  it('should replace negative index substr with slice', () => {
    const input = 'str.substr(-5)';
    const output = replaceSubstr(input);
    expect(output).toBe('str.slice(-5)');
  });

  it('should preserve behavior for all valid inputs', () => {
    const testStr = 'Hello World';
    
    // Test equivalence
    expect(testStr.substring(0, 5)).toBe('Hello');
    expect(testStr.slice(-5)).toBe('World');
  });
});
```


## Implementation Guidelines

### Phase 1: Build System Optimization (Week 1)

**Objectives:**
- Configure route-based code splitting
- Implement component lazy loading for heavy components (>50KB)
- Optimize bundle size through tree shaking
- Generate bundle analysis reports

**Tasks:**
1. Update `vite.config.js` with enhanced code splitting
2. Identify and lazy-load heavy components using bundle analyzer
3. Add retry logic for dynamic imports
4. Add loading indicators for lazy routes/components
5. Verify bundle sizes meet targets (<200KB main, <500KB total)

**Success Criteria:**
- Main bundle <200KB gzipped
- Route chunks loaded on demand
- Loading indicators appear after 200ms threshold
- Error boundaries catch failed imports

### Phase 2: Code Quality Infrastructure (Week 1-2)

**Objectives:**
- Configure TypeScript with strict mode
- Set up ESLint and Prettier
- Implement pre-commit hooks
- Replace deprecated APIs

**Tasks:**
1. Create `tsconfig.json` with allowJs and strict settings
2. Install and configure Prettier
3. Update ESLint config for TypeScript
4. Set up Husky + lint-staged for pre-commit hooks
5. Create and run deprecation fixer codemod
6. Verify all tests pass after replacements

**Success Criteria:**
- TypeScript compiles without errors
- ESLint passes with zero errors
- Prettier formats code consistently
- Pre-commit hooks run automatically
- Zero deprecated API usage


### Phase 3: TypeScript Migration (Week 2-4)

**Objectives:**
- Create type definitions for API responses
- Migrate core utilities to TypeScript
- Establish migration patterns and documentation

**Tasks:**
1. Create `src/types/index.ts` with all domain models and API types
2. Migrate `src/utils/api.js` → `api.ts`
3. Migrate `src/utils/auth.js` → `auth.ts`
4. Generate `.d.ts` files for JavaScript modules
5. Create migration guide with 8+ patterns and 2+ examples per pattern
6. Update import statements to use TypeScript utilities

**Success Criteria:**
- Type definitions cover all API responses
- Core utilities compile with strict TypeScript
- JavaScript files can import TypeScript modules
- Migration guide is complete and tested

**Migration Priority Order:**
1. **Utilities** (`api.ts`, `auth.ts`, `validation.ts`)
2. **Shared Components** (`ErrorBoundary.tsx`, `Layout.tsx`)
3. **Feature Pages** (migrate as they're touched)

### Phase 4: Performance Optimizations (Week 3-4)

**Objectives:**
- Implement React memoization patterns
- Add virtual scrolling for large lists
- Implement image lazy loading
- Set up performance monitoring

**Tasks:**
1. Add React.memo to pure components
2. Add useMemo for expensive computations
3. Add useCallback for stable function references
4. Install and configure react-window for virtual scrolling
5. Create OptimizedImage component with native lazy loading
6. Integrate React Profiler and Web Vitals
7. Create performance monitoring dashboard (development only)

**Success Criteria:**
- Components >16ms render time identified
- Virtual scrolling applied to lists >100 items
- Images load lazily with placeholders
- Performance metrics logged to console in dev mode
- Web Vitals captured in production


### Phase 5: Error Handling Enhancement (Week 4)

**Objectives:**
- Implement consistent API error handling
- Enhance error boundaries
- Improve error messages and logging

**Tasks:**
1. Extend axios interceptor with comprehensive error handling
2. Add error logging function
3. Create toast notification system for API errors
4. Enhance ErrorBoundary with better fallback UI
5. Add source maps configuration for development
6. Test error scenarios (network failures, 4xx/5xx, timeouts)

**Success Criteria:**
- All HTTP errors display user-friendly messages
- Error boundaries catch and display rendering errors
- Stack traces include source-mapped locations
- Errors logged with context (timestamp, user role, URL)

## Migration Documentation Structure

The TypeScript migration guide will be created at `docs/typescript-migration.md` with the following structure:

### 1. Overview
- Why TypeScript
- Migration strategy (gradual, non-breaking)
- Timeline and phases

### 2. Setup and Configuration
- tsconfig.json explained
- Path aliases configuration
- Build process integration

### 3. Type Definitions (`src/types/index.ts`)
- Core domain models (User, Profile, Classroom, etc.)
- API response types
- Utility types
- Exporting and importing types


### 4. Migration Patterns (8+ patterns)

**Pattern 1: React Functional Components**

```typescript
// Before (JavaScript)
function StudentCard({ student, onClick }) {
  return (
    <div onClick={() => onClick(student.id)}>
      <h3>{student.name}</h3>
      <p>{student.email}</p>
    </div>
  );
}

// After (TypeScript)
interface StudentCardProps {
  student: Student;
  onClick: (id: string) => void;
}

function StudentCard({ student, onClick }: StudentCardProps): JSX.Element {
  return (
    <div onClick={() => onClick(student.id)}>
      <h3>{student.name}</h3>
      <p>{student.email}</p>
    </div>
  );
}
```

**Pattern 2: React Hooks (useState, useEffect)**

```typescript
// Before (JavaScript)
function useStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    const response = await api.get('/students/');
    setStudents(response.data);
    setLoading(false);
  };

  return { students, loading };
}

// After (TypeScript)
interface UseStudentsResult {
  students: Student[];
  loading: boolean;
}

function useStudents(): UseStudentsResult {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async (): Promise<void> => {
    setLoading(true);
    const response = await api.get<Student[]>('/students/');
    setStudents(response.data);
    setLoading(false);
  };

  return { students, loading };
}
```


**Pattern 3: Event Handlers**

```typescript
// Before (JavaScript)
function LoginForm() {
  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle login
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Update state
  };

  return <form onSubmit={handleSubmit}>...</form>;
}

// After (TypeScript)
function LoginForm(): JSX.Element {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    // Handle login
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    // Update state
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

**Pattern 4: Props Destructuring**

```typescript
// Before (JavaScript)
function Dropdown({ options, value, onChange, placeholder }) {
  return (
    <select value={value} onChange={onChange}>
      <option value="">{placeholder}</option>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// After (TypeScript)
interface Option {
  value: string;
  label: string;
}

interface DropdownProps {
  options: Option[];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  placeholder?: string; // Optional with ?
}

function Dropdown({ 
  options, 
  value, 
  onChange, 
  placeholder = 'Select...' // Default value
}: DropdownProps): JSX.Element {
  return (
    <select value={value} onChange={onChange}>
      <option value="">{placeholder}</option>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
```


**Pattern 5: Async/Await Functions**

```typescript
// Before (JavaScript)
async function deleteStudent(id) {
  try {
    const response = await api.delete(`/students/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Failed to delete student', error);
    throw error;
  }
}

// After (TypeScript)
async function deleteStudent(id: string): Promise<void> {
  try {
    const response = await api.delete<void>(`/students/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Failed to delete student', error);
    throw error;
  }
}
```

**Pattern 6: Context Providers**

```typescript
// Before (JavaScript)
const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

// After (TypeScript)
interface ThemeContextValue {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps): JSX.Element {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```


**Pattern 7: Custom Hooks**

```typescript
// Before (JavaScript)
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [url]);

  return { data, loading, error };
}

// After (TypeScript)
interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

function useFetch<T>(url: string): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then((data: T) => setData(data))
      .catch((err: Error) => setError(err))
      .finally(() => setLoading(false));
  }, [url]);

  return { data, loading, error };
}

// Usage with type inference
const { data, loading, error } = useFetch<Student[]>('/api/students/');
// data is typed as Student[] | null
```

**Pattern 8: Error Boundaries**

```typescript
// Before (JavaScript)
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}

// After (TypeScript)
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Error caught:', error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}
```


### 5. API Response Type Definitions (3+ examples)

**Success Response:**

```typescript
// Generic successful API response
export interface ApiSuccessResponse<T> {
  data: T;
  message?: string;
  status: number;
}

// Example usage
async function getStudent(id: string): Promise<Student> {
  const response = await api.get<ApiSuccessResponse<Student>>(`/students/${id}/`);
  return response.data.data;
}
```

**Error Response:**

```typescript
// API error response structure
export interface ApiErrorResponse {
  detail?: string;
  message?: string;
  errors?: Record<string, string[]>; // Field-level validation errors
  status: number;
}

// Example usage
try {
  await api.post('/students/', studentData);
} catch (error) {
  if (axios.isAxiosError(error)) {
    const errorData = error.response?.data as ApiErrorResponse;
    if (errorData.errors) {
      // Handle field-level errors
      Object.entries(errorData.errors).forEach(([field, messages]) => {
        console.error(`${field}: ${messages.join(', ')}`);
      });
    } else {
      console.error(errorData.detail || errorData.message);
    }
  }
}
```

**Paginated Response:**

```typescript
// Paginated list response
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Example usage
async function getStudents(page: number = 1): Promise<PaginatedResponse<Student>> {
  const response = await api.get<PaginatedResponse<Student>>(
    `/students/?page=${page}`
  );
  return response.data;
}

// Using in component
function StudentList() {
  const [students, setStudents] = useState<Student[]>([]);
  const [pagination, setPagination] = useState({ count: 0, next: null, previous: null });

  useEffect(() => {
    getStudents().then(data => {
      setStudents(data.results);
      setPagination({
        count: data.count,
        next: data.next,
        previous: data.previous
      });
    });
  }, []);

  return (
    <div>
      {students.map(s => <StudentCard key={s.id} student={s} />)}
      <Pagination {...pagination} />
    </div>
  );
}
```


### 6. Handling Third-Party Libraries Without Types

**Strategy 1: Use @types packages**

```bash
# Install type definitions from DefinitelyTyped
npm install --save-dev @types/react-router-dom
npm install --save-dev @types/axios
```

**Strategy 2: Declare module for libraries without types**

```typescript
// src/types/modules.d.ts

// For libraries without type definitions
declare module 'some-untyped-library' {
  export function someFunction(param: string): void;
  export interface SomeInterface {
    prop: string;
  }
}

// For JSON imports
declare module '*.json' {
  const value: any;
  export default value;
}

// For CSS modules
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

// For SVG imports
declare module '*.svg' {
  const content: string;
  export default content;
}
```

**Strategy 3: Use 'any' type assertions (last resort)**

```typescript
// When type definitions are unavailable and creating them is impractical
import SomeLibrary from 'untyped-library';

// Temporary any assertion with TODO comment
// TODO: Add proper type definitions for untyped-library
const result = (SomeLibrary as any).someMethod();

// Better: Create minimal interface
interface UntypedLibrary {
  someMethod: () => unknown;
}

const typedLibrary = SomeLibrary as unknown as UntypedLibrary;
const result = typedLibrary.someMethod();
```


### 7. Migration Checklist

For each file being migrated from `.js` to `.ts` or `.jsx` to `.tsx`:

- [ ] Rename file extension (`.js` → `.ts`, `.jsx` → `.tsx`)
- [ ] Add explicit return types to all functions
- [ ] Add types to all function parameters
- [ ] Define interfaces for props (React components)
- [ ] Type useState hooks with generics: `useState<Type>(initialValue)`
- [ ] Type API responses with proper interfaces
- [ ] Replace `any` with specific types where possible
- [ ] Add JSDoc comments for complex types
- [ ] Run `npx tsc --noEmit` to check for type errors
- [ ] Fix all type errors before committing
- [ ] Update imports in other files if needed
- [ ] Verify tests still pass

### 8. Common Pitfalls and Solutions

**Pitfall 1: Implicit any**

```typescript
// ❌ Bad - implicit any
function processData(data) {
  return data.map(item => item.value);
}

// ✅ Good - explicit types
function processData(data: Array<{ value: number }>): number[] {
  return data.map(item => item.value);
}
```

**Pitfall 2: Missing null checks**

```typescript
// ❌ Bad - potential null reference
function getStudentName(student: Student) {
  return student.profile.first_name; // profile might be undefined
}

// ✅ Good - handle null/undefined
function getStudentName(student: Student): string {
  return student.profile?.first_name ?? 'Unknown';
}
```

**Pitfall 3: Type assertions without validation**

```typescript
// ❌ Bad - unsafe type assertion
const data = JSON.parse(response) as Student;

// ✅ Good - validate before asserting
function isStudent(obj: any): obj is Student {
  return obj && typeof obj.id === 'string' && typeof obj.name === 'string';
}

const parsed = JSON.parse(response);
if (isStudent(parsed)) {
  const student: Student = parsed;
  // Use student safely
}
```

## Conclusion

This design provides a comprehensive approach to improving performance, code quality, and developer experience for the KNHS School Portal. The implementation follows a gradual, non-breaking migration strategy that allows the team to adopt improvements incrementally while maintaining productivity.

Key success metrics:
- **Performance**: Main bundle <200KB, route chunks lazy-loaded, virtual scrolling for lists >100 items
- **Code Quality**: Zero linting errors, consistent formatting, TypeScript strict mode
- **Developer Experience**: IDE autocomplete, inline error messages, clear migration guides
- **Reliability**: Comprehensive error handling, retry logic, error boundaries

