# Implementation Plan: Performance and Code Quality Improvements

## Overview

This implementation plan converts the performance and code quality design into actionable coding tasks. The approach focuses on six key areas: bundle optimization and code splitting, TypeScript migration for type safety, deprecated API fixes, code quality tooling, runtime performance optimizations, and developer experience enhancements. Each task builds incrementally to minimize risk and validate improvements early.

## Tasks

- [x] 1. Set up bundle optimization and code splitting infrastructure
  - [x] 1.1 Configure Vite for route-based code splitting
    - Update `vite.config.js` with manualChunks configuration
    - Add chunk naming strategy for pages (page-${name})
    - Add chunk naming strategy for components (component-heavy for >50KB)
    - Configure chunkSizeWarningLimit to 200KB
    - _Requirements: 1.1, 1.4, 3.2_
  
  - [x] 1.2 Create retry utility for lazy imports
    - Create `src/utils/lazyImport.ts` with retryImport function
    - Implement exponential backoff (1s delay, max 3 retries)
    - Add TypeScript types for retry configuration
    - _Requirements: 1.6, 2.5_
  
  - [x] 1.3 Create RouteLoadingIndicator component
    - Create `src/components/loading/RouteLoadingIndicator.tsx`
    - Implement loading spinner with 200ms delay threshold
    - Add ARIA labels for accessibility
    - _Requirements: 1.5_
  
  - [x] 1.4 Update routes.js to use lazy loading with retry
    - Import retryImport utility
    - Wrap all route lazy imports with retryImport
    - Add Suspense boundaries with RouteLoadingIndicator fallback
    - Add error boundaries for route loading failures
    - _Requirements: 1.2, 1.5, 1.6_
  
  - [ ]* 1.5 Generate bundle analysis report
    - Run `npm run build` with production mode
    - Generate bundle visualizer report
    - Document bundle sizes before optimization
    - _Requirements: 3.3_

- [~] 2. Checkpoint - Verify route lazy loading works
  - Test navigation between routes
  - Verify loading indicators display
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 3. Implement component-level lazy loading
  - [~] 3.1 Identify large components for lazy loading
    - Analyze build output to find components >50KB
    - Create list of candidates (PostComposerModal, charts, editors)
    - Document current sizes in code comments
    - _Requirements: 2.1, 2.9_
  
  - [~] 3.2 Create LazyComponentWrapper utility
    - Create `src/components/lazy/LazyComponentWrapper.tsx`
    - Implement error boundary for lazy components
    - Add ComponentErrorFallback component
    - Add retry logic with max 3 attempts
    - _Requirements: 2.5, 2.6, 2.7_
  
  - [~] 3.3 Convert PostComposerModal to lazy loading
    - Update imports to use lazy()
    - Wrap with Suspense and fallback spinner
    - Add preloading with requestIdleCallback
    - Test modal opens correctly after lazy load
    - _Requirements: 2.2, 2.3, 2.4, 2.8_
  
  - [~] 3.4 Convert chart components to lazy loading
    - Identify chart components in dashboard
    - Convert to lazy imports with LazyComponentWrapper
    - Add skeleton UI as fallback
    - Test chart rendering after lazy load
    - _Requirements: 2.2, 2.3, 2.4_
  
  - [ ]* 3.5 Write unit tests for LazyComponentWrapper
    - Test successful lazy load
    - Test retry on failure
    - Test error boundary activation after 3 failures
    - Test fallback UI display during loading
    - _Requirements: 2.3, 2.5, 2.6, 2.7_

- [~] 4. Checkpoint - Verify component lazy loading
  - Test heavy components load correctly
  - Verify error boundaries work on failure
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Set up TypeScript configuration and type definitions
  - [x] 5.1 Create tsconfig.json
    - Create `tsconfig.json` in frontend root
    - Configure strict mode (strict: true)
    - Enable JavaScript files (allowJs: true, checkJs: false)
    - Add path aliases (@components, @utils, @pages, @types)
    - Configure for React JSX and Vite bundler mode
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.9_
  
  - [x] 5.2 Create central type definitions file
    - Create `src/types/index.ts`
    - Define User, Profile, AuthTokens, AuthResponse interfaces
    - Define Classroom, Subject, Grade interfaces
    - Define ApiResponse<T> and PaginatedResponse<T> generic types
    - Define ApiError interface
    - Export all types from central module
    - _Requirements: 8.1, 8.2, 8.3, 8.5_
  
  - [x] 5.3 Configure Vite to compile TypeScript
    - Update `vite.config.js` to include TypeScript plugin
    - Add build step for type checking
    - Configure source maps for TypeScript files
    - _Requirements: 7.6_
  
  - [ ]* 5.4 Write unit tests for type definitions
    - Test type inference works correctly
    - Test generic types with sample data
    - Verify no TypeScript compilation errors
    - _Requirements: 8.4_

- [ ] 6. Migrate core utilities to TypeScript
  - [~] 6.1 Migrate api.js to TypeScript
    - Rename `src/utils/api.js` to `src/utils/api.ts`
    - Add explicit type annotations for all function parameters
    - Add explicit return type annotations for all functions
    - Type axios configuration objects
    - Type request/response interceptors
    - Generate `api.d.ts` declaration file
    - _Requirements: 9.1, 9.3, 9.4, 9.5_
  
  - [~] 6.2 Migrate auth.js to TypeScript
    - Rename `src/utils/auth.js` to `src/utils/auth.ts`
    - Add type annotations for token management functions
    - Add type annotations for user authentication functions
    - Type localStorage interactions
    - Generate `auth.d.ts` declaration file
    - _Requirements: 9.2, 9.3, 9.4, 9.5_
  
  - [~] 6.3 Update imports in JavaScript files
    - Verify imports resolve correctly without path changes
    - Test that JavaScript files can import from TypeScript modules
    - Handle any import resolution issues
    - _Requirements: 9.6_
  
  - [ ]* 6.4 Write integration tests for migrated utilities
    - Test API utility functions with typed responses
    - Test auth utility functions with typed tokens
    - Verify type safety in error handling
    - _Requirements: 8.4, 9.7_

- [~] 7. Checkpoint - Verify TypeScript integration
  - Run TypeScript compiler to check for errors
  - Verify IDE autocomplete works for typed functions
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Fix deprecated JavaScript APIs
  - [x] 8.1 Create ESLint rule for deprecated APIs
    - Create `.eslintrc.cjs` custom rule for substr detection
    - Add rules for escape/unescape detection
    - Add rules for HTML string methods detection
    - Configure error messages with replacement suggestions
    - _Requirements: 4.1, 4.4_
  
  - [x] 8.2 Create codemod for String.prototype.substr
    - Create `scripts/codemods/fix-substr.js` using jscodeshift
    - Detect substr with positive index → replace with substring
    - Detect substr with negative index → replace with slice
    - Preserve original behavior for edge cases
    - _Requirements: 4.2, 4.3, 4.7_
  
  - [ ] 8.3 Create codemod for escape/unescape
    - Create `scripts/codemods/fix-escape-unescape.js`
    - Replace escape() with encodeURIComponent()
    - Replace unescape() with decodeURIComponent()
    - Add comments for manual review if needed
    - _Requirements: 4.6, 4.8_
  
  - [-] 8.4 Create codemod for HTML string methods
    - Create `scripts/codemods/fix-html-methods.js`
    - Replace anchor(), bold(), italics() etc. with template literals
    - Generate equivalent HTML output
    - Preserve original behavior
    - _Requirements: 4.5, 4.7_
  
  - [~] 8.5 Run codemods across codebase
    - Execute substr codemod on all JavaScript files
    - Execute escape/unescape codemod
    - Execute HTML methods codemod
    - Review generated changes for correctness
    - _Requirements: 4.2, 4.3, 4.5, 4.6_
  
  - [ ]* 8.6 Verify deprecated API fixes with tests
    - Run existing test suite
    - Verify zero test failures compared to baseline
    - Test edge cases for replaced methods
    - _Requirements: 4.9_

- [x] 9. Set up code quality tooling
  - [x] 9.1 Configure ESLint
    - Create/update `.eslintrc.cjs`
    - Add recommended rules for React and TypeScript
    - Configure parser for TypeScript
    - Add plugins for react-hooks
    - Disable conflicting rules with Prettier
    - _Requirements: 6.1_
  
  - [x] 9.2 Configure Prettier
    - Create `.prettierrc.json`
    - Set formatting rules (semi, quotes, trailing commas)
    - Create `.prettierignore` for build artifacts
    - _Requirements: 6.2_
  
  - [x] 9.3 Set up pre-commit hooks
    - Install husky and lint-staged
    - Configure husky pre-commit hook
    - Configure lint-staged for auto-formatting
    - Test hooks trigger on commit
    - _Requirements: 6.3_
  
  - [x] 9.4 Configure build to fail on lint errors
    - Update package.json scripts to run ESLint
    - Add lint step to CI/CD pipeline
    - Configure exit codes for lint failures
    - _Requirements: 6.4_
  
  - [ ]* 9.5 Test code quality tools
    - Introduce intentional lint error and verify detection
    - Test Prettier auto-fix
    - Test pre-commit hook blocks bad commits
    - Verify CI build fails on lint errors
    - _Requirements: 6.5_

- [~] 10. Checkpoint - Verify code quality tools work
  - Run ESLint across codebase
  - Run Prettier to format all files
  - Test pre-commit hooks
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Implement error handling improvements
  - [~] 11.1 Create centralized API error handler
    - Create `src/utils/errorHandler.ts`
    - Implement axios response interceptor
    - Handle 401 with token refresh
    - Handle 4xx with user-friendly messages
    - Handle 5xx with retry button
    - Handle timeout (30s) with connection failure message
    - _Requirements: 5.1, 5.2, 5.3, 5.8_
  
  - [~] 11.2 Create Toast notification component
    - Create `src/components/feedback/ToastNotification.tsx`
    - Display errors for 6 seconds
    - Add dismiss button
    - Support different severity levels
    - _Requirements: 5.5_
  
  - [~] 11.3 Enhance error boundary component
    - Update existing or create `src/components/errors/ErrorBoundary.tsx`
    - Log error timestamp, stack trace, component name to console
    - Display fallback UI with "Reload Page" button
    - Provide recovery mechanism
    - _Requirements: 5.6, 5.7_
  
  - [~] 11.4 Integrate error handler into API utility
    - Add error interceptor to axios instance in api.ts
    - Log errors with timestamp, status, URL, user role
    - Trigger Toast notifications for API errors
    - _Requirements: 5.4, 5.5_
  
  - [ ]* 11.5 Write integration tests for error handling
    - Test network timeout handling
    - Test server error (5xx) handling
    - Test client error (4xx) handling
    - Test error boundary catches rendering errors
    - Test Toast notifications display correctly
    - _Requirements: 5.1, 5.2, 5.3, 5.6_

- [ ] 12. Implement runtime performance optimizations
  - [~] 12.1 Create performance monitoring component
    - Create `src/utils/performanceMonitor.tsx`
    - Implement React Profiler integration
    - Collect render times for components
    - Warn when render time exceeds 16ms
    - Store metrics in window.__PERF_METRICS__ in dev mode
    - _Requirements: 13.1, 13.2, 13.3_
  
  - [~] 12.2 Integrate Web Vitals tracking
    - Install web-vitals package
    - Create `src/utils/webVitals.ts`
    - Track CLS, FCP, LCP, TTFB, INP metrics
    - Log to console in development
    - Send to backend analytics in production
    - _Requirements: 13.5, 13.6_
  
  - [~] 12.3 Add performance recommendations system
    - Implement getSuggestion() function in performanceMonitor
    - Provide recommendations for slow components
    - Recommend memoization for >16ms renders
    - Recommend code splitting for >100ms renders
    - Recommend virtualization for >50ms renders
    - _Requirements: 13.7, 13.8_
  
  - [ ]* 12.4 Write unit tests for performance monitoring
    - Test Profiler callback captures metrics
    - Test warnings for slow components
    - Test Web Vitals tracking
    - Test recommendation generation
    - _Requirements: 13.1, 13.2, 13.3_

- [ ] 13. Implement memoization patterns
  - [~] 13.1 Identify components needing memoization
    - Run performance profiler to find excessive re-renders
    - List components with >10 renders per second
    - Document baseline render counts
    - _Requirements: 10.4_
  
  - [~] 13.2 Apply React.memo to pure components
    - Wrap identified pure components with React.memo
    - Add custom comparison functions where needed
    - Verify props remain stable
    - _Requirements: 10.3_
  
  - [~] 13.3 Apply useMemo to expensive computations
    - Identify expensive calculations in components
    - Wrap with useMemo with correct dependencies
    - Verify computations only run when needed
    - _Requirements: 10.1_
  
  - [~] 13.4 Apply useCallback to callback functions
    - Identify callbacks passed to memoized children
    - Wrap with useCallback to stabilize references
    - Verify dependency arrays are correct
    - _Requirements: 10.2_
  
  - [~] 13.5 Handle context optimization
    - Identify contexts triggering 5+ child re-renders
    - Apply context splitting or selectors
    - Test reduced re-render counts
    - _Requirements: 13.4_
  
  - [ ]* 13.6 Verify memoization reduces re-renders
    - Run performance profiler after optimizations
    - Compare before/after render counts
    - Document performance improvements
    - _Requirements: 10.5_

- [~] 14. Checkpoint - Verify performance optimizations
  - Test application performance with profiler
  - Verify memoization reduces re-renders
  - Check Web Vitals metrics
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Implement virtual scrolling for large lists
  - [~] 15.1 Install react-window library
    - Add react-window as dependency
    - Install type definitions (@types/react-window)
    - _Requirements: 11.1_
  
  - [~] 15.2 Create VirtualList component
    - Create `src/components/virtualization/VirtualList.tsx`
    - Support both fixed and variable height items
    - Implement using FixedSizeList and VariableSizeList
    - Add TypeScript generic types for items
    - _Requirements: 11.1, 11.4_
  
  - [~] 15.3 Update student directory to use virtual scrolling
    - Identify student list components
    - Conditionally render VirtualList for >100 items
    - Use regular rendering for <100 items
    - Test scrolling performance
    - _Requirements: 11.1, 11.2_
  
  - [~] 15.4 Update other large lists
    - Identify announcement lists, grade lists
    - Apply VirtualList component
    - Test scroll position maintenance
    - _Requirements: 11.2, 11.3_
  
  - [ ]* 15.5 Measure virtual scrolling performance
    - Use performance profiler during scrolling
    - Verify frame rate stays above 30 FPS
    - Document performance improvements
    - _Requirements: 11.5_

- [ ] 16. Implement image lazy loading
  - [~] 16.1 Create OptimizedImage component
    - Create `src/components/images/OptimizedImage.tsx`
    - Support native lazy loading with loading="lazy"
    - Add IntersectionObserver fallback for older browsers
    - Support placeholder images during load
    - Add error handling for failed loads
    - _Requirements: 12.1, 12.2, 12.3_
  
  - [~] 16.2 Update components to use OptimizedImage
    - Replace <img> tags with <OptimizedImage>
    - Configure loading="eager" for above-fold images
    - Configure loading="lazy" for below-fold images
    - Add responsive srcset support
    - _Requirements: 12.4, 12.5_
  
  - [ ]* 16.3 Write unit tests for OptimizedImage
    - Test native lazy loading
    - Test IntersectionObserver fallback
    - Test placeholder display during load
    - Test error handling on load failure
    - _Requirements: 12.1, 12.2, 12.3_

- [ ] 17. Enhance developer experience and tooling
  - [~] 17.1 Improve TypeScript error messages
    - Configure TypeScript compiler for detailed errors
    - Add JSDoc comments to utility functions
    - Document common type patterns
    - _Requirements: 15.1_
  
  - [~] 17.2 Enhance ESLint error messages
    - Configure ESLint to show rule names
    - Add links to rule documentation
    - Provide fix suggestions where applicable
    - _Requirements: 15.2_
  
  - [~] 17.3 Improve build error messages
    - Configure Vite to show code context (3 lines)
    - Add file name and line number to errors
    - Configure source maps for better stack traces
    - _Requirements: 15.3, 15.6, 15.7_
  
  - [~] 17.4 Configure IDE support features
    - Verify go-to-definition works for TypeScript
    - Test autocomplete for typed functions
    - Test inline documentation from JSDoc
    - Test rename refactoring
    - _Requirements: 14.1, 14.2, 14.3, 14.5_
  
  - [~] 17.5 Improve type error detection in IDE
    - Configure TypeScript for fast feedback (<2s)
    - Test inline type error highlighting
    - Test missing import suggestions
    - Test type mismatch error messages
    - _Requirements: 7.8, 15.4, 15.5_

- [ ] 18. Create migration documentation
  - [~] 18.1 Create TypeScript migration guide
    - Create `docs/typescript-migration.md`
    - Document 8 migration patterns (async/await, event handlers, props destructuring, state, API calls, error boundaries, hooks, context)
    - Provide 2+ examples for functional components, hooks, and context
    - Document migration priority: utilities → components → pages
    - _Requirements: 16.1, 16.2, 16.4_
  
  - [~] 18.2 Document API response type definitions
    - Add section for API types in migration guide
    - Provide 3+ code snippets (success, error, paginated responses)
    - Include examples from src/types/index.ts
    - _Requirements: 16.5_
  
  - [~] 18.3 Document third-party library handling
    - Add section for libraries without types
    - Document @types packages usage
    - Document declare module syntax
    - Document any type assertions as last resort
    - _Requirements: 16.6_
  
  - [~] 18.4 Ensure documentation is in markdown format
    - Organize with clear sections and headers
    - Add code examples as TypeScript fenced blocks
    - Verify examples compile without errors
    - _Requirements: 16.3, 16.7_

- [~] 19. Final checkpoint - Verify all improvements work together
  - Run full test suite
  - Generate final bundle analysis report
  - Compare bundle sizes before/after
  - Verify all performance metrics meet targets
  - Test application end-to-end
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Bundle size target: Main bundle <200KB gzipped (Requirements 1.3, 3.2)
- TypeScript migration is gradual: JavaScript remains valid indefinitely (Requirements 7.2, 7.3)
- Error handling improvements maintain backward compatibility (Requirement 5.8)
- Performance optimizations are non-breaking changes
- Memoization should be applied selectively to avoid premature optimization
- Virtual scrolling only applies to lists with 100+ items (Requirement 11.1)
- Image lazy loading uses native browser features with fallback (Requirements 12.1, 12.2)
- All deprecated APIs must be replaced before TypeScript strict mode can catch new violations
- Pre-commit hooks run automatically on git commit (Requirement 6.3)
- IDE support requires TypeScript configured correctly (Requirements 7.8, 14.1-14.5)
- Migration documentation ensures team consistency (Requirement 16.7)

## Task Dependency Graph

```json
{
  "waves": [
    {
      "id": 0,
      "tasks": ["1.1", "1.2", "1.3", "5.1", "5.2", "8.1", "9.1", "9.2"]
    },
    {
      "id": 1,
      "tasks": ["1.4", "1.5", "5.3", "5.4", "8.2", "8.3", "8.4", "9.3", "9.4"]
    },
    {
      "id": 2,
      "tasks": ["3.1", "3.2", "6.1", "6.2", "8.5", "9.5"]
    },
    {
      "id": 3,
      "tasks": ["3.3", "3.4", "6.3", "6.4", "8.6", "11.1", "11.2", "11.3", "12.1", "12.2"]
    },
    {
      "id": 4,
      "tasks": ["3.5", "11.4", "11.5", "12.3", "12.4", "15.1", "15.2", "16.1"]
    },
    {
      "id": 5,
      "tasks": ["13.1", "15.3", "15.4", "16.2"]
    },
    {
      "id": 6,
      "tasks": ["13.2", "13.3", "13.4", "13.5", "15.5", "16.3"]
    },
    {
      "id": 7,
      "tasks": ["13.6", "17.1", "17.2", "17.3", "17.4", "17.5", "18.1"]
    },
    {
      "id": 8,
      "tasks": ["18.2", "18.3", "18.4"]
    }
  ]
}
```
