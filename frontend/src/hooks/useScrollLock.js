import { useEffect } from 'react';

/**
 * Hook to lock body scroll when a modal/overlay is open.
 * @param {boolean} lock - Whether to lock the scroll.
 */
export const useScrollLock = (lock) => {
  useEffect(() => {
    if (lock) {
      // Save original overflow
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      
      // Cleanup: restore original overflow
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [lock]);
};
