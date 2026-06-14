import { useState, useEffect } from 'react';
import api from '../utils/api';
import { getCurrentAcademicYear } from '../utils/dateHelpers';

export function useActiveAcademicYear() {
  const [academicYear, setAcademicYear] = useState(
    () => localStorage.getItem('knhs_academic_year') || getCurrentAcademicYear()
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.get('/admin/academic-years/active/')
      .then(r => {
        if (cancelled) return;
        const year = r.data.name;
        localStorage.setItem('knhs_academic_year', year);
        setAcademicYear(year);
      })
      .catch(() => {
        if (cancelled) return;
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { academicYear, loading, setAcademicYear };
}
