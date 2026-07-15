/**
 * Grade Color Visualization Utilities
 * 
 * Provides color-coded grade visualization with color-blind friendly patterns.
 * Follows WCAG 2.1 AA guidelines with sufficient contrast and alternative indicators.
 */

/**
 * Grade thresholds (configurable based on institution)
 */
export const GRADE_THRESHOLDS = {
  excellent: 95,  // 95-100
  good: 90,       // 90-94
  passing: 75,    // 75-89
  warning: 60,    // 60-74
  failing: 0,     // 0-59
};

/**
 * Grade status configuration with colors and patterns
 */
export const GRADE_STATUS_CONFIG = {
  excellent: {
    color: 'bg-green-500',
    textColor: 'text-green-700',
    borderColor: 'border-green-500',
    lightBg: 'bg-green-50',
    darkBg: 'bg-green-600',
    ring: 'ring-green-500',
    label: 'Excellent',
    icon: '★',
    pattern: 'checkered',
  },
  good: {
    color: 'bg-blue-500',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-500',
    lightBg: 'bg-blue-50',
    darkBg: 'bg-blue-600',
    ring: 'ring-blue-500',
    label: 'Good',
    icon: '✓',
    pattern: 'striped',
  },
  passing: {
    color: 'bg-cyan-500',
    textColor: 'text-cyan-700',
    borderColor: 'border-cyan-500',
    lightBg: 'bg-cyan-50',
    darkBg: 'bg-cyan-600',
    ring: 'ring-cyan-500',
    label: 'Passing',
    icon: '○',
    pattern: 'dotted',
  },
  warning: {
    color: 'bg-amber-500',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-500',
    lightBg: 'bg-amber-50',
    darkBg: 'bg-amber-600',
    ring: 'ring-amber-500',
    label: 'Warning',
    icon: '⚠',
    pattern: 'diagonal',
  },
  failing: {
    color: 'bg-red-500',
    textColor: 'text-red-700',
    borderColor: 'border-red-500',
    lightBg: 'bg-red-50',
    darkBg: 'bg-red-600',
    ring: 'ring-red-500',
    label: 'Failing',
    icon: '✗',
    pattern: 'crossed',
  },
  incomplete: {
    color: 'bg-slate-400',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-400',
    lightBg: 'bg-slate-50',
    darkBg: 'bg-slate-600',
    ring: 'ring-slate-400',
    label: 'Incomplete',
    icon: '－',
    pattern: 'plain',
  },
};

/**
 * Get grade status based on numeric value
 * 
 * @param {number} grade - Numeric grade value
 * @returns {string} Status key ('excellent', 'good', 'passing', 'warning', 'failing')
 */
export const getGradeStatus = (grade) => {
  if (grade === null || grade === undefined || isNaN(grade)) {
    return 'incomplete';
  }

  const numGrade = Number(grade);

  if (numGrade >= GRADE_THRESHOLDS.excellent) return 'excellent';
  if (numGrade >= GRADE_THRESHOLDS.good) return 'good';
  if (numGrade >= GRADE_THRESHOLDS.passing) return 'passing';
  if (numGrade >= GRADE_THRESHOLDS.warning) return 'warning';
  return 'failing';
};

/**
 * Get grade configuration for a given grade value
 * 
 * @param {number} grade - Numeric grade value
 * @returns {Object} Grade configuration object
 */
export const getGradeConfig = (grade) => {
  const status = getGradeStatus(grade);
  return GRADE_STATUS_CONFIG[status];
};

/**
 * Get color classes for a grade badge
 * 
 * @param {number} grade - Numeric grade value
 * @param {string} variant - Badge variant ('solid', 'light', 'outline')
 * @returns {string} Tailwind CSS classes
 */
export const getGradeBadgeClasses = (grade, variant = 'light') => {
  const config = getGradeConfig(grade);

  switch (variant) {
    case 'solid':
      return `${config.darkBg} text-white border-2 ${config.borderColor}`;
    
    case 'outline':
      return `bg-white ${config.textColor} border-2 ${config.borderColor}`;
    
    case 'light':
    default:
      return `${config.lightBg} ${config.textColor} border ${config.borderColor}`;
  }
};

/**
 * Get text color class for a grade
 * 
 * @param {number} grade - Numeric grade value
 * @returns {string} Tailwind CSS text color class
 */
export const getGradeTextColor = (grade) => {
  const config = getGradeConfig(grade);
  return config.textColor;
};

/**
 * Get background color class for a grade
 * 
 * @param {number} grade - Numeric grade value
 * @param {boolean} light - Use light variant
 * @returns {string} Tailwind CSS background color class
 */
export const getGradeBackgroundColor = (grade, light = false) => {
  const config = getGradeConfig(grade);
  return light ? config.lightBg : config.color;
};

/**
 * Get icon for a grade status
 * 
 * @param {number} grade - Numeric grade value
 * @returns {string} Icon character
 */
export const getGradeIcon = (grade) => {
  const config = getGradeConfig(grade);
  return config.icon;
};

/**
 * Get label for a grade status
 * 
 * @param {number} grade - Numeric grade value
 * @returns {string} Status label
 */
export const getGradeLabel = (grade) => {
  const config = getGradeConfig(grade);
  return config.label;
};

/**
 * Format grade with color and icon
 * 
 * @param {number} grade - Numeric grade value
 * @param {Object} options - Formatting options
 * @returns {Object} Formatted grade object { value, status, config, formatted }
 */
export const formatGrade = (grade, options = {}) => {
  const {
    showIcon = true,
    showLabel = false,
    decimals = 2,
  } = options;

  const status = getGradeStatus(grade);
  const config = getGradeConfig(grade);
  
  let formatted = '';
  
  if (grade === null || grade === undefined || isNaN(grade)) {
    formatted = showLabel ? config.label : '--';
  } else {
    const displayValue = Number(grade).toFixed(decimals);
    formatted = `${displayValue}${showLabel ? ` (${config.label})` : ''}`;
  }

  return {
    value: grade,
    status,
    config,
    formatted,
    icon: showIcon ? config.icon : null,
  };
};

/**
 * Get progress percentage for grade visualization
 * 
 * @param {number} grade - Numeric grade value
 * @param {number} max - Maximum grade value (default: 100)
 * @returns {number} Progress percentage (0-100)
 */
export const getGradeProgress = (grade, max = 100) => {
  if (grade === null || grade === undefined || isNaN(grade)) {
    return 0;
  }
  return Math.min(100, Math.max(0, (Number(grade) / max) * 100));
};

/**
 * Compare two grades and return comparison result
 * 
 * @param {number} current - Current grade
 * @param {number} previous - Previous grade
 * @returns {Object} Comparison object { trend, difference, percentage }
 */
export const compareGrades = (current, previous) => {
  if (previous === null || previous === undefined || isNaN(previous)) {
    return { trend: 'new', difference: 0, percentage: 0 };
  }

  const diff = Number(current) - Number(previous);
  const percentage = (diff / Number(previous)) * 100;

  return {
    trend: diff > 0 ? 'up' : diff < 0 ? 'down' : 'same',
    difference: diff,
    percentage: percentage,
  };
};

/**
 * Get grade trend icon
 * 
 * @param {string} trend - Trend direction ('up', 'down', 'same')
 * @returns {string} Trend icon
 */
export const getGradeTrendIcon = (trend) => {
  switch (trend) {
    case 'up':
      return '↑';
    case 'down':
      return '↓';
    case 'same':
      return '→';
    default:
      return '–';
  }
};

/**
 * Get grade statistics for an array of grades
 * 
 * @param {Array} grades - Array of numeric grades
 * @returns {Object} Statistics object
 */
export const getGradeStatistics = (grades) => {
  const validGrades = grades.filter(g => g !== null && g !== undefined && !isNaN(g)).map(Number);

  if (validGrades.length === 0) {
    return {
      count: 0,
      min: 0,
      max: 0,
      average: 0,
      median: 0,
      passing: 0,
      failing: 0,
    };
  }

  const sorted = [...validGrades].sort((a, b) => a - b);
  const sum = validGrades.reduce((acc, grade) => acc + grade, 0);
  const average = sum / validGrades.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const passing = validGrades.filter(g => g >= GRADE_THRESHOLDS.passing).length;
  const failing = validGrades.filter(g => g < GRADE_THRESHOLDS.passing).length;

  return {
    count: validGrades.length,
    min: Math.min(...validGrades),
    max: Math.max(...validGrades),
    average,
    median,
    passing,
    failing,
  };
};

export default {
  GRADE_THRESHOLDS,
  GRADE_STATUS_CONFIG,
  getGradeStatus,
  getGradeConfig,
  getGradeBadgeClasses,
  getGradeTextColor,
  getGradeBackgroundColor,
  getGradeIcon,
  getGradeLabel,
  formatGrade,
  getGradeProgress,
  compareGrades,
  getGradeTrendIcon,
  getGradeStatistics,
};
