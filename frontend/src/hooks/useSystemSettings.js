import { useState, useEffect } from 'react';
import api from '../utils/api';

export function useSystemSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.get('/system/settings/')
      .then(r => {
        if (!cancelled) setSettings(r.data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const isJHS = settings?.academic_level === 'jhs';
  const isSHS = settings?.academic_level === 'shs';

  // Number of grading periods: JHS=4 quarters, SHS=3 semesters
  const gradingPeriods = isSHS ? 3 : 4;

  // Labels: JHS uses "Quarter", SHS uses "Semester"
  const periodLabel = isSHS ? 'Semester' : 'Quarter';

  // Generate period options array: [{value: '1', label: '1st Quarter'}, ...]
  const periodOptions = isSHS
    ? [
        { value: '1', label: '1st Semester' },
        { value: '2', label: '2nd Semester' },
        { value: '3', label: '3rd Semester' },
      ]
    : [
        { value: '1', label: '1st Quarter' },
        { value: '2', label: '2nd Quarter' },
        { value: '3', label: '3rd Quarter' },
        { value: '4', label: '4th Quarter' },
      ];

  // Short labels for table headers: ["S1","S2","S3"] or ["Q1","Q2","Q3","Q4"]
  const periodShortLabels = isSHS
    ? ['S1', 'S2', 'S3']
    : ['Q1', 'Q2', 'Q3', 'Q4'];

  // Numeric values: [1,2,3] or [1,2,3,4]
  const periodValues = Array.from({ length: gradingPeriods }, (_, i) => i + 1);

  return {
    settings,
    loading,
    isJHS,
    isSHS,
    gradingPeriods,
    periodLabel,
    periodOptions,
    periodShortLabels,
    periodValues,
    currentQuarter: settings?.current_quarter || '1',
  };
}
