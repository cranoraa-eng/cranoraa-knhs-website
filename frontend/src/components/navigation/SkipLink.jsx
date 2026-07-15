import { useEffect, useRef } from 'react';

/**
 * SkipLink Component for Accessibility
 * 
 * Provides a "Skip to main content" link that is visually hidden until focused.
 * This allows keyboard users to bypass repetitive navigation and jump directly
 * to the main content of the page.
 * 
 * Features:
 * - Visually hidden until focused (sr-only with focus:not-sr-only)
 * - Keyboard accessible (Tab to focus)
 * - ARIA compliant
 * - Proper focus management on activation
 * - WCAG 2.1 AA compliant
 * 
 * @param {Object} props
 * @param {string} props.targetId - ID of the main content element to skip to (default: 'main-content')
 * @param {string} props.label - Text label for the skip link (default: 'Skip to main content')
 * @param {string} props.className - Additional CSS classes
 */
export const SkipLink = ({
  targetId = 'main-content',
  label = 'Skip to main content',
  className = ''
}) => {
  const linkRef = useRef(null);

  /**
   * Handle skip link activation
   * Moves focus to the target element and scrolls it into view
   */
  const handleClick = (e) => {
    e.preventDefault();
    
    const targetElement = document.getElementById(targetId);
    
    if (targetElement) {
      // Set tabindex to -1 if not already focusable
      if (!targetElement.hasAttribute('tabindex')) {
        targetElement.setAttribute('tabindex', '-1');
      }
      
      // Focus the target element
      targetElement.focus();
      
      // Scroll into view smoothly (if available)
      if (typeof targetElement.scrollIntoView === 'function') {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      
      // Remove the outline after a short delay (for visual users)
      // The focus remains on the element for screen reader users
      setTimeout(() => {
        if (targetElement.style) {
          targetElement.style.outline = 'none';
        }
      }, 100);
    } else {
      console.warn(`SkipLink: Target element with id "${targetId}" not found`);
    }
  };

  /**
   * Ensure the skip link is the first focusable element
   * This is verified on component mount
   */
  useEffect(() => {
    const verifyFirstFocusable = () => {
      const focusableElements = document.querySelectorAll(
        'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length > 0 && focusableElements[0] !== linkRef.current) {
        console.warn('SkipLink: This component should be the first focusable element in the document');
      }
    };

    // Verify after a short delay to ensure DOM is fully loaded
    setTimeout(verifyFirstFocusable, 100);
  }, []);

  return (
    <a
      ref={linkRef}
      href={`#${targetId}`}
      onClick={handleClick}
      className={`
        sr-only focus:not-sr-only
        focus:absolute focus:top-4 focus:left-4 focus:z-50
        focus:px-4 focus:py-2
        focus:bg-violet-600 focus:text-white
        focus:rounded-lg focus:shadow-lg
        focus:ring-2 focus:ring-violet-500 focus:ring-offset-2
        focus:outline-none
        font-medium text-sm
        transition-all duration-200
        ${className}
      `}
      aria-label={label}
    >
      {label}
    </a>
  );
};

/**
 * Usage Example:
 * 
 * In Layout.jsx:
 * 
 * function Layout({ children }) {
 *   return (
 *     <>
 *       <SkipLink targetId="main-content" />
 *       <Header />
 *       <Sidebar />
 *       <main id="main-content" tabIndex="-1">
 *         {children}
 *       </main>
 *     </>
 *   );
 * }
 * 
 * The SkipLink should be the FIRST element in your Layout component
 * so keyboard users can immediately access it with the Tab key.
 * 
 * The target element (main content) should have:
 * - An id matching the targetId prop
 * - A tabindex of -1 (if not naturally focusable)
 * - Proper semantic HTML (e.g., <main> element)
 * 
 * Keyboard Usage:
 * - Press Tab from any page to focus the skip link
 * - Press Enter to skip to main content
 * - Focus moves directly to main content, bypassing navigation
 */

export default SkipLink;
