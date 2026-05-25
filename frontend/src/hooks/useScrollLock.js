import { useEffect } from 'react';

/**
 * Hook to lock body scroll when a modal/overlay is open.
 * @param {boolean} lock - Whether to lock the scroll.
 */
export const useScrollLock = (lock) => {
  useEffect(() => {
    if (lock) {
      // Get scrollbar width to prevent layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      // Save original styles
      const originalOverflow = window.getComputedStyle(document.body).overflow;
      const originalPaddingRight = window.getComputedStyle(document.body).paddingRight;
      
      // Lock scroll on both html and body for maximum compatibility
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      
      // Cleanup: restore original styles
      return () => {
        document.documentElement.style.overflow = '';
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [lock]);
};
