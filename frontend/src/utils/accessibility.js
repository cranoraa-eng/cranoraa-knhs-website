/**
 * Accessibility Utilities
 * 
 * Helper functions for accessibility compliance (WCAG 2.1 AA)
 */

/**
 * Check if a color contrast ratio meets WCAG standards
 * 
 * @param {string} foreground - Foreground color (hex, rgb, or rgba)
 * @param {string} background - Background color (hex, rgb, or rgba)
 * @param {string} level - WCAG level ('AA' or 'AAA')
 * @param {string} size - Text size ('normal' or 'large')
 * @returns {Object} - { ratio, passes, level }
 * 
 * @example
 * const result = checkColorContrast('#000000', '#FFFFFF', 'AA', 'normal');
 * // { ratio: 21, passes: true, level: 'AAA' }
 */
export function checkColorContrast(foreground, background, level = 'AA', size = 'normal') {
  const fgLuminance = getRelativeLuminance(foreground);
  const bgLuminance = getRelativeLuminance(background);
  
  const ratio = calculateContrastRatio(fgLuminance, bgLuminance);
  
  // WCAG 2.1 requirements
  const requirements = {
    'AA': {
      'normal': 4.5,  // Normal text (< 18pt or < 14pt bold)
      'large': 3.0    // Large text (>= 18pt or >= 14pt bold)
    },
    'AAA': {
      'normal': 7.0,
      'large': 4.5
    }
  };
  
  const required = requirements[level][size];
  const passes = ratio >= required;
  
  // Determine actual level achieved
  let achievedLevel = 'Fail';
  if (ratio >= requirements.AAA[size]) {
    achievedLevel = 'AAA';
  } else if (ratio >= requirements.AA[size]) {
    achievedLevel = 'AA';
  }
  
  return {
    ratio: Math.round(ratio * 100) / 100,
    passes,
    level: achievedLevel,
    required
  };
}

/**
 * Calculate relative luminance of a color
 * Based on WCAG 2.1 formula
 */
function getRelativeLuminance(color) {
  const rgb = parseColor(color);
  
  const [r, g, b] = rgb.map(channel => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two luminance values
 */
function calculateContrastRatio(lum1, lum2) {
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Parse color string to RGB array
 */
function parseColor(color) {
  // Remove whitespace
  color = color.replace(/\s/g, '');
  
  // Hex format (#RGB or #RRGGBB)
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    
    if (hex.length === 3) {
      // #RGB -> #RRGGBB
      return [
        parseInt(hex[0] + hex[0], 16),
        parseInt(hex[1] + hex[1], 16),
        parseInt(hex[2] + hex[2], 16)
      ];
    } else if (hex.length === 6) {
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16)
      ];
    }
  }
  
  // RGB/RGBA format
  const rgbMatch = color.match(/rgba?\((\d+),(\d+),(\d+)/);
  if (rgbMatch) {
    return [
      parseInt(rgbMatch[1]),
      parseInt(rgbMatch[2]),
      parseInt(rgbMatch[3])
    ];
  }
  
  // Named colors (basic support)
  const namedColors = {
    'white': [255, 255, 255],
    'black': [0, 0, 0],
    'red': [255, 0, 0],
    'green': [0, 128, 0],
    'blue': [0, 0, 255],
    'yellow': [255, 255, 0],
    'cyan': [0, 255, 255],
    'magenta': [255, 0, 255],
    'gray': [128, 128, 128],
    'grey': [128, 128, 128]
  };
  
  const lowerColor = color.toLowerCase();
  if (namedColors[lowerColor]) {
    return namedColors[lowerColor];
  }
  
  // Default to black if parsing fails
  console.warn(`Unable to parse color: ${color}`);
  return [0, 0, 0];
}

/**
 * Generate ARIA attributes for a component
 * 
 * @param {Object} options - Configuration options
 * @returns {Object} - ARIA attributes object
 * 
 * @example
 * const ariaProps = generateAriaAttributes({
 *   label: 'Close dialog',
 *   role: 'button',
 *   pressed: false,
 *   expanded: true
 * });
 * // Returns: { 'aria-label': 'Close dialog', 'role': 'button', ... }
 */
export function generateAriaAttributes(options = {}) {
  const {
    label,
    labelledBy,
    describedBy,
    role,
    live,
    atomic,
    relevant,
    busy,
    pressed,
    expanded,
    selected,
    checked,
    disabled,
    required,
    invalid,
    hidden,
    current,
    controls,
    owns,
    haspopup,
    modal
  } = options;
  
  const attributes = {};
  
  if (label) attributes['aria-label'] = label;
  if (labelledBy) attributes['aria-labelledby'] = labelledBy;
  if (describedBy) attributes['aria-describedby'] = describedBy;
  if (role) attributes['role'] = role;
  if (live) attributes['aria-live'] = live;
  if (atomic !== undefined) attributes['aria-atomic'] = atomic;
  if (relevant) attributes['aria-relevant'] = relevant;
  if (busy !== undefined) attributes['aria-busy'] = busy;
  if (pressed !== undefined) attributes['aria-pressed'] = pressed;
  if (expanded !== undefined) attributes['aria-expanded'] = expanded;
  if (selected !== undefined) attributes['aria-selected'] = selected;
  if (checked !== undefined) attributes['aria-checked'] = checked;
  if (disabled !== undefined) attributes['aria-disabled'] = disabled;
  if (required !== undefined) attributes['aria-required'] = required;
  if (invalid !== undefined) attributes['aria-invalid'] = invalid;
  if (hidden !== undefined) attributes['aria-hidden'] = hidden;
  if (current) attributes['aria-current'] = current;
  if (controls) attributes['aria-controls'] = controls;
  if (owns) attributes['aria-owns'] = owns;
  if (haspopup) attributes['aria-haspopup'] = haspopup;
  if (modal !== undefined) attributes['aria-modal'] = modal;
  
  return attributes;
}

/**
 * Announce a message to screen readers
 * 
 * @param {string} message - Message to announce
 * @param {string} priority - 'polite' or 'assertive'
 */
export function announceToScreenReader(message, priority = 'polite') {
  let announcer = document.getElementById('screen-reader-announcer');
  
  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = 'screen-reader-announcer';
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    document.body.appendChild(announcer);
  }
  
  announcer.setAttribute('aria-live', priority);
  announcer.textContent = '';
  
  setTimeout(() => {
    announcer.textContent = message;
  }, 100);
  
  setTimeout(() => {
    announcer.textContent = '';
  }, 3000);
}

/**
 * Get all focusable elements within a container
 * 
 * @param {HTMLElement} container - Container element
 * @returns {Array} - Array of focusable elements
 */
export function getFocusableElements(container) {
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
      return (
        element.offsetWidth > 0 &&
        element.offsetHeight > 0 &&
        element.tabIndex >= 0
      );
    }
  );
}

/**
 * Check if element is visible to screen readers
 * 
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} - Whether element is visible to screen readers
 */
export function isVisibleToScreenReader(element) {
  if (!element) return false;
  
  const style = window.getComputedStyle(element);
  
  return !(
    element.getAttribute('aria-hidden') === 'true' ||
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    element.hasAttribute('hidden')
  );
}

/**
 * Generate a unique ID for accessibility relationships
 * 
 * @param {string} prefix - Prefix for the ID
 * @returns {string} - Unique ID
 */
let idCounter = 0;
export function generateUniqueId(prefix = 'a11y') {
  return `${prefix}-${Date.now()}-${++idCounter}`;
}

/**
 * Check if user prefers reduced motion
 * 
 * @returns {boolean} - Whether user prefers reduced motion
 */
export function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false;
  }
  
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if user prefers high contrast
 * 
 * @returns {boolean} - Whether user prefers high contrast
 */
export function prefersHighContrast() {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false;
  }
  
  return window.matchMedia('(prefers-contrast: high)').matches;
}

/**
 * Check if user prefers dark mode
 * 
 * @returns {boolean} - Whether user prefers dark mode
 */
export function prefersDarkMode() {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false;
  }
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Validate ARIA attribute value
 * 
 * @param {string} attribute - ARIA attribute name
 * @param {*} value - Value to validate
 * @returns {boolean} - Whether value is valid
 */
export function validateAriaAttribute(attribute, value) {
  const booleanAttributes = [
    'aria-atomic', 'aria-busy', 'aria-disabled', 'aria-hidden',
    'aria-modal', 'aria-multiline', 'aria-multiselectable', 'aria-readonly',
    'aria-required'
  ];
  
  const tristateAttributes = [
    'aria-checked', 'aria-pressed', 'aria-selected'
  ];
  
  if (booleanAttributes.includes(attribute)) {
    return value === 'true' || value === 'false' || value === true || value === false;
  }
  
  if (tristateAttributes.includes(attribute)) {
    return value === 'true' || value === 'false' || value === 'mixed' ||
           value === true || value === false;
  }
  
  return true; // Default: assume valid
}

export default {
  checkColorContrast,
  generateAriaAttributes,
  announceToScreenReader,
  getFocusableElements,
  isVisibleToScreenReader,
  generateUniqueId,
  prefersReducedMotion,
  prefersHighContrast,
  prefersDarkMode,
  validateAriaAttribute
};
