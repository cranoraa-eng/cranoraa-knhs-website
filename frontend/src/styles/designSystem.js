/**
 * KNHS School Portal Design System
 * Professional, Academic, Minimalist, Purple-themed
 * 
 * This file contains all standardized design tokens, components,
 * and utilities used across the entire portal.
 */

// ═══════════════════════════════════════════════════════════════════════════
// COLOR SYSTEM — Professional Academic Purple
// ═══════════════════════════════════════════════════════════════════════════

export const COLORS = {
  // Primary — Academic Purple
  primary: {
    50:  '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6',   // Main purple
    600: '#7c3aed',   // Active purple
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
  },
  
  // Neutral — Clean slate tones
  neutral: {
    50:  '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },

  // Semantic colors
  success: '#10b981',
  warning: '#f59e0b',
  error:   '#ef4444',
  info:    '#3b82f6',
};

// ═══════════════════════════════════════════════════════════════════════════
// TYPOGRAPHY — Professional academic hierarchy
// ═══════════════════════════════════════════════════════════════════════════

export const TYPOGRAPHY = {
  // Headings
  h1: 'text-2xl md:text-3xl font-bold text-slate-900 tracking-tight',
  h2: 'text-xl md:text-2xl font-bold text-slate-900 tracking-tight',
  h3: 'text-lg md:text-xl font-semibold text-slate-900',
  h4: 'text-base md:text-lg font-semibold text-slate-900',
  h5: 'text-sm md:text-base font-semibold text-slate-900',
  h6: 'text-xs md:text-sm font-semibold text-slate-900',

  // Body text
  body: {
    lg: 'text-base font-normal text-slate-700',
    md: 'text-sm font-normal text-slate-700',
    sm: 'text-xs font-normal text-slate-600',
    xs: 'text-[11px] font-normal text-slate-600',
  },

  // Labels
  label: {
    lg: 'text-sm font-medium text-slate-700',
    md: 'text-xs font-medium text-slate-700',
    sm: 'text-[11px] font-medium text-slate-600',
  },

  // Section headers
  section: 'text-[10px] font-bold text-slate-500 uppercase tracking-widest',

  // Badges & Pills
  badge: 'text-[10px] font-semibold uppercase tracking-wide',
};

// ═══════════════════════════════════════════════════════════════════════════
// SPACING — Consistent rhythm
// ═══════════════════════════════════════════════════════════════════════════

export const SPACING = {
  page: 'p-4 md:p-6 lg:p-8',
  section: 'space-y-6 md:space-y-8',
  card: 'p-4 md:p-6',
  stack: {
    xs: 'space-y-2',
    sm: 'space-y-3',
    md: 'space-y-4',
    lg: 'space-y-6',
    xl: 'space-y-8',
  },
  inline: {
    xs: 'space-x-1',
    sm: 'space-x-2',
    md: 'space-x-3',
    lg: 'space-x-4',
    xl: 'space-x-6',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SHADOWS — Subtle depth
// ═══════════════════════════════════════════════════════════════════════════

export const SHADOWS = {
  sm:  'shadow-sm',
  md:  'shadow-md shadow-slate-100',
  lg:  'shadow-lg shadow-slate-200',
  xl:  'shadow-xl shadow-slate-200',
  card: 'shadow-sm hover:shadow-md transition-shadow',
  purple: 'shadow-lg shadow-purple-100',
};

// ═══════════════════════════════════════════════════════════════════════════
// BORDERS — Clean lines
// ═══════════════════════════════════════════════════════════════════════════

export const BORDERS = {
  default: 'border border-slate-200',
  hover:   'border border-slate-200 hover:border-purple-300',
  focus:   'border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100',
  error:   'border border-red-300',
  success: 'border border-emerald-300',
};

// ═══════════════════════════════════════════════════════════════════════════
// BUTTONS — All button variants
// ═══════════════════════════════════════════════════════════════════════════

export const BUTTONS = {
  // Primary — Main CTA
  primary: `
    inline-flex items-center justify-center gap-2
    px-4 py-2.5 md:px-5 md:py-3
    rounded-lg
    bg-purple-600 text-white
    text-sm font-semibold
    border border-purple-700
    hover:bg-purple-700
    active:scale-[0.98]
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-all duration-150
    shadow-sm
  `,

  // Secondary — Less emphasis
  secondary: `
    inline-flex items-center justify-center gap-2
    px-4 py-2.5 md:px-5 md:py-3
    rounded-lg
    bg-white text-slate-700
    text-sm font-semibold
    border border-slate-300
    hover:bg-slate-50 hover:border-slate-400
    active:scale-[0.98]
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-all duration-150
    shadow-sm
  `,

  // Ghost — Minimal
  ghost: `
    inline-flex items-center justify-center gap-2
    px-4 py-2.5
    rounded-lg
    text-slate-700
    text-sm font-medium
    hover:bg-slate-100
    active:scale-[0.98]
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-all duration-150
  `,

  // Danger — Destructive actions
  danger: `
    inline-flex items-center justify-center gap-2
    px-4 py-2.5 md:px-5 md:py-3
    rounded-lg
    bg-red-600 text-white
    text-sm font-semibold
    border border-red-700
    hover:bg-red-700
    active:scale-[0.98]
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-all duration-150
    shadow-sm
  `,

  // Icon button
  icon: `
    inline-flex items-center justify-center
    w-9 h-9
    rounded-lg
    text-slate-600
    hover:bg-slate-100
    active:scale-95
    transition-all duration-150
  `,

  // Small variants
  small: {
    primary: `
      inline-flex items-center justify-center gap-1.5
      px-3 py-1.5
      rounded-md
      bg-purple-600 text-white
      text-xs font-semibold
      hover:bg-purple-700
      active:scale-[0.98]
      transition-all duration-150
    `,
    secondary: `
      inline-flex items-center justify-center gap-1.5
      px-3 py-1.5
      rounded-md
      bg-white text-slate-700
      text-xs font-semibold
      border border-slate-300
      hover:bg-slate-50
      active:scale-[0.98]
      transition-all duration-150
    `,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// CARDS — Container components
// ═══════════════════════════════════════════════════════════════════════════

export const CARDS = {
  // Standard card
  default: `
    bg-white
    rounded-lg
    border border-slate-200
    shadow-sm
    overflow-hidden
  `,

  // Interactive card
  interactive: `
    bg-white
    rounded-lg
    border border-slate-200
    shadow-sm
    hover:shadow-md hover:border-slate-300
    transition-all duration-200
    cursor-pointer
    overflow-hidden
  `,

  // Highlighted card
  highlighted: `
    bg-purple-50
    rounded-lg
    border border-purple-200
    shadow-sm
    overflow-hidden
  `,

  // Stat card
  stat: `
    bg-white
    rounded-lg
    border border-slate-200
    shadow-sm
    p-4 md:p-5
    hover:shadow-md
    transition-all duration-200
  `,
};

// ═══════════════════════════════════════════════════════════════════════════
// INPUTS — Form controls
// ═══════════════════════════════════════════════════════════════════════════

export const INPUTS = {
  // Text input
  text: `
    w-full
    px-4 py-2.5
    rounded-lg
    bg-white
    text-sm text-slate-900
    border border-slate-300
    placeholder:text-slate-400
    focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500
    disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
    transition-all duration-150
  `,

  // Textarea
  textarea: `
    w-full
    px-4 py-2.5
    rounded-lg
    bg-white
    text-sm text-slate-900
    border border-slate-300
    placeholder:text-slate-400
    focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500
    disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
    resize-none
    transition-all duration-150
  `,

  // Select
  select: `
    w-full
    px-4 py-2.5
    rounded-lg
    bg-white
    text-sm text-slate-900 font-medium
    border border-slate-300
    focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500
    disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
    cursor-pointer
    transition-all duration-150
  `,

  // Checkbox
  checkbox: `
    w-4 h-4
    rounded
    border-slate-300
    text-purple-600
    focus:ring-2 focus:ring-purple-100 focus:ring-offset-0
    cursor-pointer
    transition-all duration-150
  `,

  // Search input
  search: `
    w-full
    pl-10 pr-4 py-2.5
    rounded-lg
    bg-slate-50
    text-sm text-slate-900
    border border-slate-200
    placeholder:text-slate-400
    focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500 focus:bg-white
    transition-all duration-150
  `,

  // Label
  label: `
    block
    text-xs font-medium text-slate-700
    mb-1.5
  `,
};

// ═══════════════════════════════════════════════════════════════════════════
// BADGES & PILLS
// ═══════════════════════════════════════════════════════════════════════════

export const BADGES = {
  default: 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
  
  variants: {
    purple:  'bg-purple-100 text-purple-700 border border-purple-200',
    blue:    'bg-blue-100 text-blue-700 border border-blue-200',
    green:   'bg-emerald-100 text-emerald-700 border border-emerald-200',
    yellow:  'bg-amber-100 text-amber-700 border border-amber-200',
    red:     'bg-red-100 text-red-700 border border-red-200',
    slate:   'bg-slate-100 text-slate-700 border border-slate-200',
  },

  sizes: {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// TABLES
// ═══════════════════════════════════════════════════════════════════════════

export const TABLES = {
  container: 'overflow-x-auto rounded-lg border border-slate-200',
  table: 'min-w-full divide-y divide-slate-200',
  thead: 'bg-slate-50',
  th: 'px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider',
  tbody: 'bg-white divide-y divide-slate-100',
  td: 'px-4 py-3 text-sm text-slate-900',
  tr: 'hover:bg-slate-50 transition-colors',
};

// ═══════════════════════════════════════════════════════════════════════════
// MODALS
// ═══════════════════════════════════════════════════════════════════════════

export const MODALS = {
  overlay: `
    fixed inset-0 z-50
    bg-slate-900/60 backdrop-blur-sm
    flex items-center justify-center
    p-4
    animate-fadeIn
  `,

  container: `
    bg-white
    rounded-2xl
    shadow-2xl
    max-w-md w-full
    max-h-[90vh]
    overflow-hidden
    animate-slideUp
  `,

  header: `
    px-6 py-4
    border-b border-slate-200
    flex items-center justify-between
  `,

  body: `
    px-6 py-4
    overflow-y-auto
    max-h-[60vh]
  `,

  footer: `
    px-6 py-4
    border-t border-slate-200
    bg-slate-50
    flex items-center justify-end gap-3
  `,
};

// ═══════════════════════════════════════════════════════════════════════════
// EMPTY STATES
// ═══════════════════════════════════════════════════════════════════════════

export const EMPTY_STATE = {
  container: `
    flex flex-col items-center justify-center
    py-12 px-6
    text-center
  `,

  icon: `
    w-12 h-12
    rounded-full
    bg-slate-100
    flex items-center justify-center
    text-slate-400
    mb-4
  `,

  title: 'text-sm font-semibold text-slate-900 mb-1',
  description: 'text-xs text-slate-500',
};

// ═══════════════════════════════════════════════════════════════════════════
// LOADING STATES
// ═══════════════════════════════════════════════════════════════════════════

export const LOADING = {
  spinner: `
    w-5 h-5
    border-2 border-slate-200 border-t-purple-600
    rounded-full
    animate-spin
  `,

  skeleton: {
    line: 'h-4 bg-slate-100 rounded animate-pulse',
    card: 'h-32 bg-slate-100 rounded-lg animate-pulse',
    circle: 'w-10 h-10 bg-slate-100 rounded-full animate-pulse',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════════

export const ANIMATIONS = {
  fadeIn: 'animate-fadeIn',
  slideUp: 'animate-slideUp',
  slideDown: 'animate-slideDown',
  scaleIn: 'animate-scaleIn',
  
  // Custom animation classes (add to tailwind.config.js)
  keyframes: {
    fadeIn: {
      '0%': { opacity: '0' },
      '100%': { opacity: '1' },
    },
    slideUp: {
      '0%': { transform: 'translateY(20px)', opacity: '0' },
      '100%': { transform: 'translateY(0)', opacity: '1' },
    },
    slideDown: {
      '0%': { transform: 'translateY(-20px)', opacity: '0' },
      '100%': { transform: 'translateY(0)', opacity: '1' },
    },
    scaleIn: {
      '0%': { transform: 'scale(0.95)', opacity: '0' },
      '100%': { transform: 'scale(1)', opacity: '1' },
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Combines multiple class names, filtering out falsy values
 */
export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Returns the appropriate badge variant based on status
 */
export const getStatusBadge = (status) => {
  const statusMap = {
    active: 'green',
    pending: 'yellow',
    inactive: 'slate',
    rejected: 'red',
    approved: 'green',
    draft: 'slate',
    published: 'green',
    archived: 'slate',
  };

  return BADGES.variants[statusMap[status?.toLowerCase()] || 'slate'];
};

/**
 * Returns the appropriate priority color
 */
export const getPriorityColor = (priority) => {
  const priorityMap = {
    critical: 'red',
    high: 'yellow',
    medium: 'blue',
    low: 'slate',
    info: 'purple',
  };

  return priorityMap[priority?.toLowerCase()] || 'slate';
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT ALL
// ═══════════════════════════════════════════════════════════════════════════

export default {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  SHADOWS,
  BORDERS,
  BUTTONS,
  CARDS,
  INPUTS,
  BADGES,
  TABLES,
  MODALS,
  EMPTY_STATE,
  LOADING,
  ANIMATIONS,
  cn,
  getStatusBadge,
  getPriorityColor,
};
