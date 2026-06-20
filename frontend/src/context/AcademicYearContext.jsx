import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../utils/api';
import { getCurrentAcademicYear } from '../utils/dateHelpers';

const AcademicYearContext = createContext(null);

export function AcademicYearProvider({ children }) {
  const [academicYear, setAcademicYear] = useState(
    () => localStorage.getItem('knhs_academic_year') || getCurrentAcademicYear()
  );
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchActive = api.get('/admin/academic-years/active/').catch(() => null);
    const fetchAll = api.get('/admin/academic-years/').catch(() => ({ data: [] }));

    Promise.all([fetchActive, fetchAll]).then(([activeRes, allRes]) => {
      if (cancelled) return;
      if (activeRes?.data?.name) {
        localStorage.setItem('knhs_academic_year', activeRes.data.name);
        setAcademicYear(activeRes.data.name);
      }
      if (allRes?.data) {
        setAcademicYears(allRes.data);
      }
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  const updateAcademicYear = useCallback((year) => {
    setAcademicYear(year);
    localStorage.setItem('knhs_academic_year', year);
  }, []);

  return (
    <AcademicYearContext.Provider value={{ academicYear, academicYears, loading, setAcademicYear: updateAcademicYear }}>
      {children}
    </AcademicYearContext.Provider>
  );
}

export function useAcademicYear() {
  const ctx = useContext(AcademicYearContext);
  if (!ctx) {
    throw new Error('useAcademicYear must be used within AcademicYearProvider');
  }
  return ctx;
}

export default AcademicYearContext;
