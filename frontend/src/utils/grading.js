/**
 * DepEd K-12 Performance Levels
 * Used across all grading-related components.
 */
export const PERFORMANCE_LEVELS = {
  outstanding: { min: 90, label: 'Outstanding', shortLabel: 'O', color: 'emerald' },
  verySatisfactory: { min: 85, label: 'Very Satisfactory', shortLabel: 'VS', color: 'blue' },
  satisfactory: { min: 80, label: 'Satisfactory', shortLabel: 'S', color: 'amber' },
  fairlySatisfactory: { min: 75, label: 'Fairly Satisfactory', shortLabel: 'FS', color: 'orange' },
  didNotMeet: { min: 0, label: 'Did Not Meet Expectations', shortLabel: 'DNM', color: 'red' },
};

export const getPerformanceLevel = (score) => {
  if (score == null || isNaN(score)) return null;
  if (score >= 90) return PERFORMANCE_LEVELS.outstanding;
  if (score >= 85) return PERFORMANCE_LEVELS.verySatisfactory;
  if (score >= 80) return PERFORMANCE_LEVELS.satisfactory;
  if (score >= 75) return PERFORMANCE_LEVELS.fairlySatisfactory;
  return PERFORMANCE_LEVELS.didNotMeet;
};

export const getRemarksLabel = (score) => {
  const level = getPerformanceLevel(score);
  return level ? level.label : '—';
};
