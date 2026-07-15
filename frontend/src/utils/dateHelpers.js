/**
 * Calculates the current academic year based on the current date.
 * If the current month is May (5) or later, it assumes the upcoming/current 
 * academic year starts in the current calendar year.
 * Example: May 2026 -> 2026-2027
 * Example: April 2026 -> 2025-2026
 */
export const getCurrentAcademicYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed, so 4 is May

  if (month >= 4) { // May or later
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};

/**
 * Gets the current date in YYYY-MM-DD format using local time.
 */
export const getLocalDate = () => {
  const now = new Date();
  return now.toLocaleDateString('en-CA'); // en-CA gives YYYY-MM-DD
};
