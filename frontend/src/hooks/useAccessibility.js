import { useState, useEffect, useCallback } from 'react';

/**
 * Default accessibility settings
 */
const DEFAULT_SETTINGS = {
  highContrast: false,
  reducedMotion: false,
  screenReaderMode: false,
  fontSize: 'medium', // 'small', 'medium', 'large', 'x-large'
  focusIndicators: true,
  keyboardNavigation: true
};

const STORAGE_KEY = 'accessibility-settings';

/**
 * useAccessibility Hook
 * 
 * Manages accessibility settings for the application.
 * Persists settings to localStorage and provides methods to update them.
 * Also detects system-level accessibility preferences.
 * 
 * @returns {Object} - Accessibility state and methods
 * 
 * @example
 * function AccessibilityPanel() {
 *   const {
 *     settings,
 *     updateSetting,
 *     resetSettings,
 *     systemPreferences
 *   } = useAccessibility();
 *   
 *   return (
 *     <div>
 *       <label>
 *         <input
 *           type="checkbox"
 *           checked={settings.highContrast}
 *           onChange={(e) => updateSetting('highContrast', e.target.checked)}
 *         />
 *         High Contrast
 *       </label>
 *     </div>
 *   );
 * }
 */
export function useAccessibility() {
  // Load settings from localStorage or use defaults
  const [settings, setSettings] = useState(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_SETTINGS;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load accessibility settings:', error);
    }

    return DEFAULT_SETTINGS;
  });

  // Detect system-level accessibility preferences
  const [systemPreferences, setSystemPreferences] = useState({
    prefersReducedMotion: false,
    prefersHighContrast: false,
    prefersDarkMode: false
  });

  // Detect system preferences
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateSystemPreferences = () => {
      setSystemPreferences({
        prefersReducedMotion: reducedMotionQuery.matches,
        prefersHighContrast: highContrastQuery.matches,
        prefersDarkMode: darkModeQuery.matches
      });
    };

    // Set initial values
    updateSystemPreferences();

    // Listen for changes
    const handleChange = () => updateSystemPreferences();
    
    reducedMotionQuery.addEventListener('change', handleChange);
    highContrastQuery.addEventListener('change', handleChange);
    darkModeQuery.addEventListener('change', handleChange);

    return () => {
      reducedMotionQuery.removeEventListener('change', handleChange);
      highContrastQuery.removeEventListener('change', handleChange);
      darkModeQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save accessibility settings:', error);
    }
  }, [settings]);

  // Apply settings to document root
  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;

    // High contrast mode
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Reduced motion
    if (settings.reducedMotion || systemPreferences.prefersReducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Screen reader mode
    if (settings.screenReaderMode) {
      root.classList.add('screen-reader-mode');
    } else {
      root.classList.remove('screen-reader-mode');
    }

    // Font size
    root.classList.remove('text-sm', 'text-base', 'text-lg', 'text-xl');
    switch (settings.fontSize) {
      case 'small':
        root.classList.add('text-sm');
        break;
      case 'large':
        root.classList.add('text-lg');
        break;
      case 'x-large':
        root.classList.add('text-xl');
        break;
      default:
        root.classList.add('text-base');
    }

    // Focus indicators
    if (!settings.focusIndicators) {
      root.classList.add('hide-focus-indicators');
    } else {
      root.classList.remove('hide-focus-indicators');
    }
  }, [settings, systemPreferences]);

  /**
   * Update a specific accessibility setting
   */
  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value
    }));
  }, []);

  /**
   * Update multiple settings at once
   */
  const updateSettings = useCallback((updates) => {
    setSettings((prev) => ({
      ...prev,
      ...updates
    }));
  }, []);

  /**
   * Reset all settings to defaults
   */
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  /**
   * Check if motion should be reduced (user setting OR system preference)
   */
  const shouldReduceMotion = settings.reducedMotion || systemPreferences.prefersReducedMotion;

  /**
   * Check if high contrast should be enabled (user setting OR system preference)
   */
  const shouldUseHighContrast = settings.highContrast || systemPreferences.prefersHighContrast;

  return {
    settings,
    systemPreferences,
    updateSetting,
    updateSettings,
    resetSettings,
    shouldReduceMotion,
    shouldUseHighContrast
  };
}

/**
 * useAnnouncer Hook
 * 
 * Creates a screen reader announcement utility.
 * Useful for announcing dynamic content changes to screen reader users.
 * 
 * @returns {Function} - Announce function
 * 
 * @example
 * function SaveButton() {
 *   const announce = useAnnouncer();
 *   
 *   const handleSave = async () => {
 *     await saveData();
 *     announce('Data saved successfully');
 *   };
 *   
 *   return <button onClick={handleSave}>Save</button>;
 * }
 */
export function useAnnouncer() {
  const [announcer, setAnnouncer] = useState(null);

  useEffect(() => {
    // Create announcer element if it doesn't exist
    let element = document.getElementById('screen-reader-announcer');
    
    if (!element) {
      element = document.createElement('div');
      element.id = 'screen-reader-announcer';
      element.setAttribute('role', 'status');
      element.setAttribute('aria-live', 'polite');
      element.setAttribute('aria-atomic', 'true');
      element.className = 'sr-only';
      document.body.appendChild(element);
    }

    setAnnouncer(element);

    return () => {
      // Don't remove the element on unmount - it's shared across the app
    };
  }, []);

  const announce = useCallback((message, priority = 'polite') => {
    if (!announcer) {
      return;
    }

    // Set aria-live priority
    announcer.setAttribute('aria-live', priority);

    // Clear previous message
    announcer.textContent = '';

    // Add new message after a brief delay to ensure screen readers pick it up
    setTimeout(() => {
      announcer.textContent = message;
    }, 100);

    // Clear message after it's been announced
    setTimeout(() => {
      announcer.textContent = '';
    }, 3000);
  }, [announcer]);

  return announce;
}

/**
 * useKeyboardOnly Hook
 * 
 * Detects if the user is navigating with keyboard only.
 * Useful for showing/hiding focus indicators.
 * 
 * @returns {boolean} - Whether keyboard navigation is active
 */
export function useKeyboardOnly() {
  const [isKeyboardOnly, setIsKeyboardOnly] = useState(false);

  useEffect(() => {
    const handleKeyDown = () => {
      setIsKeyboardOnly(true);
    };

    const handleMouseDown = () => {
      setIsKeyboardOnly(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return isKeyboardOnly;
}

export default useAccessibility;
