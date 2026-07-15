import { useState, useEffect } from 'react';

/**
 * useMediaQuery Hook
 * 
 * Tracks the state of a CSS media query and returns whether it matches.
 * Automatically updates when the viewport size changes.
 * 
 * @param {string} query - CSS media query string (e.g., '(min-width: 768px)')
 * @returns {boolean} - Whether the media query matches
 * 
 * @example
 * // Check if viewport is desktop size
 * const isDesktop = useMediaQuery('(min-width: 1024px)');
 * 
 * @example
 * // Check if viewport is mobile
 * const isMobile = useMediaQuery('(max-width: 767px)');
 * 
 * @example
 * // Check for dark mode preference
 * const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
 * 
 * @example
 * // Conditional rendering based on screen size
 * function ResponsiveComponent() {
 *   const isMobile = useMediaQuery('(max-width: 767px)');
 *   const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
 *   const isDesktop = useMediaQuery('(min-width: 1024px)');
 *   
 *   if (isMobile) return <MobileView />;
 *   if (isTablet) return <TabletView />;
 *   return <DesktopView />;
 * }
 */
export function useMediaQuery(query) {
  // Initialize state with current match status
  const [matches, setMatches] = useState(() => {
    // Check if window is available (SSR safety)
    if (typeof window === 'undefined' || !window.matchMedia) {
      return false;
    }
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    // Check if window is available (SSR safety)
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia(query);
    
    // Update state when media query match changes
    const handleChange = (event) => {
      setMatches(event.matches);
    };

    // Set initial value
    setMatches(mediaQuery.matches);

    // Listen for changes
    // Use modern API if available, fall back to deprecated addListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }

    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // Fallback for older browsers
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [query]);

  return matches;
}

/**
 * Common breakpoint hooks for convenience
 * Based on Tailwind CSS default breakpoints
 */

/**
 * Check if viewport is mobile (< 640px)
 */
export function useIsMobile() {
  return useMediaQuery('(max-width: 639px)');
}

/**
 * Check if viewport is tablet (640px - 1023px)
 */
export function useIsTablet() {
  return useMediaQuery('(min-width: 640px) and (max-width: 1023px)');
}

/**
 * Check if viewport is desktop (>= 1024px)
 */
export function useIsDesktop() {
  return useMediaQuery('(min-width: 1024px)');
}

/**
 * Check if viewport is small (< 768px)
 */
export function useIsSmall() {
  return useMediaQuery('(max-width: 767px)');
}

/**
 * Check if viewport is medium (768px - 1023px)
 */
export function useIsMedium() {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
}

/**
 * Check if viewport is large (>= 1024px)
 */
export function useIsLarge() {
  return useMediaQuery('(min-width: 1024px)');
}

/**
 * Check if user prefers dark mode
 */
export function usePrefersDarkMode() {
  return useMediaQuery('(prefers-color-scheme: dark)');
}

/**
 * Check if user prefers reduced motion
 */
export function usePrefersReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

export default useMediaQuery;
