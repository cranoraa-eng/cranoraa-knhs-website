import { useEffect, useRef } from 'react';

/**
 * useFocusTrap Hook
 * 
 * Traps keyboard focus within a container element (e.g., modals, dialogs).
 * Ensures users can't tab outside the container until it's closed.
 * Automatically returns focus to the element that triggered the trap.
 * 
 * @param {boolean} isActive - Whether the focus trap is active
 * @param {Object} options - Configuration options
 * @param {boolean} options.returnFocus - Return focus to trigger element when trap deactivates (default: true)
 * @param {boolean} options.allowOutsideClick - Allow clicking outside to deactivate (default: false)
 * @param {Function} options.onDeactivate - Callback when trap is deactivated
 * @returns {Object} - Ref to attach to the container element
 * 
 * @example
 * function Modal({ isOpen, onClose }) {
 *   const trapRef = useFocusTrap(isOpen, {
 *     returnFocus: true,
 *     onDeactivate: onClose
 *   });
 *   
 *   if (!isOpen) return null;
 *   
 *   return (
 *     <div ref={trapRef} role="dialog" aria-modal="true">
 *       <h2>Modal Title</h2>
 *       <button onClick={onClose}>Close</button>
 *     </div>
 *   );
 * }
 */
export function useFocusTrap(isActive = true, options = {}) {
  const {
    returnFocus = true,
    allowOutsideClick = false,
    onDeactivate = null
  } = options;

  const containerRef = useRef(null);
  const previousActiveElement = useRef(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) {
      return;
    }

    const container = containerRef.current;

    // Store the element that had focus before trap activated
    previousActiveElement.current = document.activeElement;

    // Get all focusable elements within the container
    const getFocusableElements = () => {
      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable="true"]'
      ].join(', ');

      return Array.from(container.querySelectorAll(focusableSelectors)).filter(
        (element) => {
          // Filter out elements that are not visible or have negative tabindex
          return (
            element.offsetWidth > 0 &&
            element.offsetHeight > 0 &&
            element.tabIndex >= 0
          );
        }
      );
    };

    // Focus the first focusable element
    const focusFirstElement = () => {
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    };

    // Handle tab key to trap focus
    const handleKeyDown = (event) => {
      if (event.key !== 'Tab') {
        return;
      }

      const focusableElements = getFocusableElements();
      
      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const currentElement = document.activeElement;

      // Shift + Tab: Move to previous element
      if (event.shiftKey) {
        if (currentElement === firstElement || !container.contains(currentElement)) {
          event.preventDefault();
          lastElement.focus();
        }
      } 
      // Tab: Move to next element
      else {
        if (currentElement === lastElement || !container.contains(currentElement)) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    // Handle click outside to deactivate (if allowed)
    const handleClickOutside = (event) => {
      if (allowOutsideClick && !container.contains(event.target)) {
        if (onDeactivate) {
          onDeactivate();
        }
      }
    };

    // Focus first element when trap activates
    focusFirstElement();

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    if (allowOutsideClick) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);

      // Return focus to previous element
      if (returnFocus && previousActiveElement.current) {
        // Use setTimeout to avoid focus conflicts
        setTimeout(() => {
          if (previousActiveElement.current && previousActiveElement.current.focus) {
            previousActiveElement.current.focus();
          }
        }, 0);
      }
    };
  }, [isActive, returnFocus, allowOutsideClick, onDeactivate]);

  return containerRef;
}

/**
 * useFocusLock Hook (Simpler version)
 * 
 * Simpler alternative to useFocusTrap that just prevents focus from leaving.
 * Useful for simple cases where you don't need full trap functionality.
 * 
 * @param {boolean} isLocked - Whether focus is locked
 * @returns {Object} - Ref to attach to the container element
 * 
 * @example
 * function Popover({ isOpen }) {
 *   const lockRef = useFocusLock(isOpen);
 *   
 *   if (!isOpen) return null;
 *   
 *   return <div ref={lockRef}>Content</div>;
 * }
 */
export function useFocusLock(isLocked = true) {
  return useFocusTrap(isLocked, {
    returnFocus: false,
    allowOutsideClick: false
  });
}

export default useFocusTrap;
