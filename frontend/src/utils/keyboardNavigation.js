/**
 * Keyboard Navigation Detection Utility
 * 
 * Adds/removes 'user-is-tabbing' class to body when user navigates with keyboard.
 * This allows showing focus indicators only for keyboard users.
 */

let isInitialized = false;

/**
 * Initialize keyboard navigation detection
 * Call this once when the app starts
 */
export function initKeyboardNavigation() {
  if (isInitialized || typeof window === 'undefined') {
    return;
  }

  // Listen for Tab key
  function handleFirstTab(e) {
    if (e.key === 'Tab') {
      document.body.classList.add('user-is-tabbing');
      window.removeEventListener('keydown', handleFirstTab);
      window.addEventListener('mousedown', handleMouseDown);
    }
  }

  // Listen for mouse clicks
  function handleMouseDown() {
    document.body.classList.remove('user-is-tabbing');
    window.removeEventListener('mousedown', handleMouseDown);
    window.addEventListener('keydown', handleFirstTab);
  }

  // Start listening
  window.addEventListener('keydown', handleFirstTab);
  
  isInitialized = true;
}

/**
 * Check if user is currently using keyboard navigation
 */
export function isUsingKeyboard() {
  if (typeof document === 'undefined') {
    return false;
  }
  return document.body.classList.contains('user-is-tabbing');
}

export default initKeyboardNavigation;
