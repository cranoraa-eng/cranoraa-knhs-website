import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getLocalDate } from '../utils/dateHelpers';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import {
  Card, CardHeader, CardBody, CardTitle, Button, Badge, 
  LoadingSpinner, EmptyState, Modal, ModalHeader, ModalBody, ModalFooter
} from '../components/ui';

/**
 * Attendance Management - DepEd Academic Style
 * Professional attendance tracking for teachers and students
 */

// Status configuration - DepEd standard colors
const STATUS_CONFIG = {
  present: { 
    label: 'Present', 
    short: 'P', 
    color: 'emerald',
    buttonClass: 'bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-700'
  },
  absent: { 
    label: 'Absent', 
    short: 'A', 
    color: 'red',
    buttonClass: 'bg-red-600 text-white hover:bg-red-700 border-red-700'
  },
  late: { 
    label: 'Late', 
    short: 'L', 
    color: 'amber',
    buttonClass: 'bg-amber-600 text-white hover:bg-amber-700 border-amber-700'
  },
  excused: { 
    label: 'Excused', 
    short: 'E', 
    color: 'blue',
    buttonClass: 'bg-blue-600 text-white hover:bg-blue-700 border-blue-700'
  },
};

const Attendance = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isStudent = user?.role === 'student';

  // Academic year
  const [academicYear, setAcademicYear] = useState('');
  const [yearLoading, setYearLoading] = useState(true);

  // Teacher/admin state
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState(location.state?.classroomId || '');
  const [selectedDate, setSelectedDate] = useState(getLocalDate());
  const [students, setStudents] = useState([]);
  const [savedAttendance, setSavedAttendance] = useState({});
  const [savedRemarks, setSavedRemarks] = useState({});
  const [draftAttendance, setDraftAttendance] = useState({});
  const [draftRemarks, setDraftRemarks] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Student state
  const [myAttendance, setMyAttendance] = useState([]);
  const [filterMonth, setFilterMonth] = useState(getLocalDate().slice(0, 7));

  // View state
  const [view, setView] = useState('mark');
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [historyDate, setHistoryDate] = useState(getLocalDate());
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Fetch active academic year
  useEffect(() => {
    api.get('/system/settings/')
      .then(r => {
        const year = r.data.academic_year || '';
        setAcademicYear(year);
      })
      .catch(() => {
        api.get('/admin/academic-years/')
          .then(r => {
            const active = r.data.find(y => y.is_active);
            if (active) setAcademicYear(active.name);
          })
          .catch(() => {});
      })
      .finally(() => setYearLoading(false));
  }, []);

  // Load classrooms or student attendance
  useEffect(() => {
    if (!academicYear) return;
    if (!isStudent) {
      api.get(`/classrooms/?academic_year=${academicYear}`)
        .then(r => setClassrooms(r.data))
        .catch(() => toast.error('Failed to load classrooms'));
    } else {
      api.get('/attendance/')
        .then(r => setMyAttendance(r.data))
        .catch(() => toast.error('Failed to load attendance'));
    }
  }, [isStudent, academicYear]);

  // Load attendance for selected classroom and date
  const loadAttendance = useCallback(async () => {
    if (!selectedClassroom || !selectedDate || isStudent) return;
    setLoadingStudents(true);
    try {
      const [enrollRes, attRes] = await Promise.all([
        api.get(`/enrollments/?classroom=${selectedClassroom}`),
        api.get(`/attendance/?classroom=${selectedClassroom}&date=${selectedDate}`),
      ]);
      setStudents(enrollRes.data);
      const map = {}, remarks = {};
      attRes.data.forEach(r => {
        map[r.student] = { id: r.id, status: r.status };
        remarks[r.student] = r.remarks || '';
      });
      setSavedAttendance(map);
      setSavedRemarks(remarks);
      setDraftAttendance(map);
      setDraftRemarks(remarks);
    } catch {
      toast.error('Failed to load attendance data');
    } finally {
      setLoadingStudents(false);
    }
  }, [selectedClassroom, selectedDate, isStudent]);

  useEffect(() => { loadAttendance(); }, [loadAttendance]);

  // Fetch history
  const fetchHistory = useCallback(async () => {
    if (!selectedClassroom || !academicYear) return;
    setLoadingHistory(true);
    setHistory([]);
    try {
      const params = new URLSearchParams({
        classroom: selectedClassroom,
        academic_year: academicYear,
      });
      if (historyDate) params.append('date', historyDate);
      const res = await api.get(`/attendance/?${params}`);
      setHistory(res.data);
    } catch {
      toast.error('Failed to load history');
    } finally {
      setLoadingHistory(false);
    }
  }, [selectedClassroom, historyDate, academicYear]);

  useEffect(() => {
    if (view === 'history' && selectedClassroom) fetchHistory();
  }, [view, fetchHistory, academicYear]);

  // Fetch analytics
  const fetchAnalytics = useCallback(async () => {
    if (!academicYear) return;
    setLoadingAnalytics(true);
    setAnalytics(null);
    try {
      const params = { academic_year: academicYear };
      if (selectedClassroom) params.classroom = selectedClassroom;
      const res = await api.get('/attendance/summary/', { params });
      setAnalytics(res.data);
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoadingAnalytics(false);
    }
  }, [selectedClassroom, academicYear]);

  useEffect(() => {
    if (view === 'analytics') fetchAnalytics();
  }, [view, fetchAnalytics, academicYear]);

  // Mark attendance in draft
  const markDraft = (studentId, status) => {
    setDraftAttendance(prev => ({ 
      ...prev, 
      [studentId]: { ...prev[studentId], status } 
    }));
  };

  // Mark all students with same status
  const markAllDraft = (status) => {
    const updated = {};
    students.forEach(s => { 
      updated[s.student] = { ...draftAttendance[s.student], status }; 
    });
    setDraftAttendance(prev => ({ ...prev, ...updated }));
    toast(`All marked as ${STATUS_CONFIG[status].label}. Click Save to confirm.`, { icon: 'ℹ️' });
  };

  // Save attendance to backend
  const saveAttendance = async () => {
    const toSave = students.filter(s => draftAttendance[s.student]?.status);
    if (!toSave.length) return toast.error('Mark at least one student before saving');

    setSubmitting(true);
    let ok = 0, fail = 0;
    const newSaved = { ...savedAttendance };

    await Promise.all(toSave.map(async s => {
      const draft = draftAttendance[s.student];
      const saved = savedAttendance[s.student];
      const remarks = draftRemarks[s.student] || '';
      try {
        if (saved?.id) {
          await api.patch(`/attendance/${saved.id}/`, { 
            status: draft.status, 
            remarks 
          });
          newSaved[s.student] = { id: saved.id, status: draft.status };
        } else {
          const res = await api.post('/attendance/', {
            student: s.student, 
            classroom: selectedClassroom,
            date: selectedDate, 
            status: draft.status, 
            remarks,
          });
          newSaved[s.student] = { id: res.data.id, status: draft.status };
        }
        ok++;
      } catch {
        fail++;
      }
    }));

    setSavedAttendance(newSaved);
    setSavedRemarks(draftRemarks);
    setDraftAttendance(newSaved);
    setDraftRemarks(draftRemarks);
    setSubmitting(false);

    if (ok > 0) toast.success(`Attendance saved for ${ok} student${ok !== 1 ? 's' : ''}`);
    if (fail > 0) toast.error(`${fail} record${fail !== 1 ? 's' : ''} failed to save`);
  };

  // Delete attendance record
  const deleteAttendance = async (record) => {
    const result = await Swal.fire({
      title: 'Delete Record?',
      html: `Delete attendance for <strong>${record.student_name}</strong> on ${new Date(record.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Delete',
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/attendance/${record.id}/`);
      toast.success('Record deleted');
      fetchHistory();
    } catch {
      toast.error('Failed to delete record');
    }
  };

  // Calculate stats from draft
  const stats = students.reduce((acc, s) => {
    const status = draftAttendance[s.student]?.status;
    if (status) acc[status] = (acc[status] || 0) + 1;
    else acc.unmarked = (acc.unmarked || 0) + 1;
    return acc;
  }, { present: 0, absent: 0, late: 0, excused: 0, unmarked: 0 });

  const attendanceRate = students.length > 0
    ? Math.round(((stats.present + stats.late) / students.length) * 100) 
    : null;

  const hasChanges = students.some(s =>
    draftAttendance[s.student]?.status !== savedAttendance[s.student]?.status ||
    (draftRemarks[s.student] || '') !== (savedRemarks[s.student] || '')
  );

  // Sort classrooms
  const sortedClassrooms = useMemo(() => {
    return [...classrooms].sort((a, b) => {
      const numA = parseInt(a.name.match(/\d+/)?.[0] || '0');
      const numB = parseInt(b.name.match(/\d+/)?.[0] || '0');
      if (numA !== numB) return numA - numB;
      return a.name.localeCompare(b.name);
    });
  }, [classrooms]);

  // Weekend check
  const isWeekend = (dateStr) => {
    if (!dateStr) return false;
    const day = new Date(dateStr + 'T00:00:00').getDay();
    return day === 0 || day === 6;
  };

  const getDayName = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });
  };

  // ══════════════════════════════════════════════════════════════
  // STUDENT VIEW
  // ══════════════════════════════════════════════════════════════

  if (isStudent) {
    // Filter attendance by month
    const filteredMyAttendance = myAttendance.filter(r => {
      const isDateMatch = r.date?.startsWith(filterMonth);
      const day = new Date(r.date + 'T00:00:00').getDay();
      const isWeekend = day === 0 || day === 6;
      return isDateMatch && !isWeekend;
    });

    // Calculate student stats
    const myStats = filteredMyAttendance.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});

    const total = filteredMyAttendance.length;
    const attRate = total > 0 
      ? Math.round(((myStats.present || 0) + (myStats.late || 0)) / total * 100) 
      : null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="page-bottom-safe max-w-[1600px] mx-auto bg-slate-50 px-4 py-4 md:px-6 md:py-6 space-y-5 md:space-y-6"
      >
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span>Attendance Record</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              My Attendance
            </h1>
            <p className="text-xs text-slate-600 mt-1 font-semibold">
              View your attendance record by month
            </p>
          </div>

          {/* Month Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              Month:
            </label>
            <input 
              type="month" 
              value={filterMonth} 
              onChange={e => setFilterMonth(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm font-semibold shadow-sm"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          {Object.keys(STATUS_CONFIG).map(key => {
            const cfg = STATUS_CONFIG[key];
            const count = myStats[key] || 0;
            return (
              <Card key={key} className={`border-l-4 border-l-${cfg.color}-500`}>
                <CardBody className="p-4 text-center">
                  <div className={`text-3xl font-extrabold text-${cfg.color}-600 mb-1`}>
                    {count}
                  </div>
                  <div className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                    {cfg.label}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>

        {/* Attendance Rate */}
        {attRate !== null && (
          <Card>
            <CardBody className="p-4 md:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                  Monthly Attendance Rate
                </span>
                <span className={`text-lg font-extrabold ${attRate >= 75 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {attRate}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all ${attRate >= 75 ? 'bg-emerald-500' : 'bg-red-500'}`} 
                  style={{ width: `${attRate}%` }} 
                />
              </div>
              {attRate < 75 && (
                <p className="text-xs text-red-600 mt-2 font-bold uppercase tracking-wide">
                  ⚠️ Attendance below 75% threshold
                </p>
              )}
            </CardBody>
          </Card>
        )}

        {/* Attendance Table */}
        <Card>
          <CardHeader divider>
            <CardTitle subtitle={`${total} records for ${new Date(filterMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}>
              Attendance History
            </CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            {filteredMyAttendance.length === 0 ? (
              <div className="p-12">
                <EmptyState
                  title="No Records Found"
                  description="No attendance records for the selected month"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                        Day
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                        Classroom
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-700 uppercase tracking-wider hidden md:table-cell">
                        Remarks
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {filteredMyAttendance.map((r, idx) => {
                      const cfg = STATUS_CONFIG[r.status];
                      const date = new Date(r.date + 'T00:00:00');
                      return (
                        <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-bold text-slate-900">
                            {date.toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase">
                            {date.toLocaleDateString('en-US', { weekday: 'long' })}
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-slate-700">
                            {r.classroom_name}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant={cfg?.color || 'slate'}>
                              {cfg?.label || r.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 hidden md:table-cell">
                            {r.remarks || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </motion.div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // TEACHER / ADMIN VIEW
  // ══════════════════════════════════════════════════════════════

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="page-bottom-safe max-w-[1600px] mx-auto bg-slate-50 px-4 py-4 md:px-6 md:py-6 space-y-5 md:space-y-6"
    >
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span>Attendance Management</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Attendance Tracker
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <p className="text-xs text-slate-600 font-semibold">
              {view === 'mark' 
                ? `Marking for ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                : view === 'history' 
                  ? 'View attendance history'
                  : 'Attendance analytics'}
            </p>
            {view === 'mark' && (
              <Badge variant={isWeekend(selectedDate) ? 'gold' : 'slate'} size="sm">
                {getDayName(selectedDate)}
              </Badge>
            )}
            {academicYear && (
              <Badge variant="blue" size="sm">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1" />
                {academicYear}
              </Badge>
            )}
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex rounded-lg border border-slate-300 overflow-hidden shadow-sm">
          {[
            { key: 'mark', label: 'Mark', icon: '✏️' },
            { key: 'history', label: 'History', icon: '📋' },
            { key: 'analytics', label: 'Analytics', icon: '📊' }
          ].map(v => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`px-4 md:px-6 py-2.5 text-xs font-extrabold uppercase tracking-wide transition-all ${
                view === v.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="mr-1">{v.icon}</span>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Controls Panel */}
      <Card>
        <CardBody className="p-4 md:p-5">
          {view === 'mark' && isWeekend(selectedDate) && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-extrabold text-amber-800 uppercase tracking-wide">
                  Weekend Detected ({getDayName(selectedDate)})
                </p>
                <p className="text-xs font-semibold text-amber-700 mt-0.5">
                  Marking attendance on weekends is typically not required. Proceed only if this is a special class session.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Classroom Selector */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                Classroom
              </label>
              <select
                value={selectedClassroom}
                onChange={e => setSelectedClassroom(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm font-semibold shadow-sm transition-all"
              >
                <option value="">Select classroom</option>
                {sortedClassrooms.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Date Selector */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                Date
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={view === 'mark' ? selectedDate : historyDate}
                  onChange={e => view === 'mark' ? setSelectedDate(e.target.value) : setHistoryDate(e.target.value)}
                  max={getLocalDate()}
                  className="flex-1 px-3 py-2.5 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm font-semibold shadow-sm transition-all"
                />
                {view === 'history' && historyDate && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setHistoryDate('')}
                  >
                    All
                  </Button>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            {view === 'mark' && selectedClassroom && students.length > 0 && (
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                  Quick Mark All
                </label>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => markAllDraft('present')}
                    className="flex-1 bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                  >
                    ✓ Present
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => markAllDraft('absent')}
                    className="flex-1 bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
                  >
                    ✗ Absent
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* MARK VIEW */}
      {/* ══════════════════════════════════════════════════════════════ */}

      {view === 'mark' && (
        <>
          {!selectedClassroom ? (
            <Card>
              <CardBody className="p-12">
                <EmptyState
                  title="Select a Classroom"
                  description="Choose a classroom to start marking attendance"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  }
                />
              </CardBody>
            </Card>
          ) : loadingStudents ? (
            <div className="flex items-center justify-center h-48">
              <LoadingSpinner />
            </div>
          ) : students.length === 0 ? (
            <Card>
              <CardBody className="p-12">
                <EmptyState
                  title="No Students Enrolled"
                  description="This classroom doesn't have any students yet"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  }
                />
              </CardBody>
            </Card>
          ) : (
            <>
              {/* Stats Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 md:gap-4">
                {[
                  { key: 'present', label: 'Present', color: 'emerald' },
                  { key: 'absent', label: 'Absent', color: 'red' },
                  { key: 'late', label: 'Late', color: 'amber' },
                  { key: 'excused', label: 'Excused', color: 'blue' },
                  { key: 'unmarked', label: 'Unmarked', color: 'slate' },
                ].map(s => (
                  <Card key={s.key} className={`border-l-4 border-l-${s.color}-500`}>
                    <CardBody className="p-3 md:p-4 text-center">
                      <div className={`text-2xl md:text-3xl font-extrabold text-${s.color}-600`}>
                        {stats[s.key] || 0}
                      </div>
                      <div className="text-xs font-bold text-slate-600 uppercase tracking-wide mt-1">
                        {s.label}
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>

              {/* Attendance Rate */}
              {attendanceRate !== null && (
                <Card>
                  <CardBody className="p-4 md:p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                        Attendance Rate
                      </span>
                      <span className={`text-lg font-extrabold ${attendanceRate >= 75 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {attendanceRate}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${attendanceRate >= 75 ? 'bg-emerald-500' : 'bg-red-500'}`}
                        style={{ width: `${attendanceRate}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-600 mt-2 font-semibold">
                      {stats.present + stats.late} out of {students.length} students marked present or late
                    </p>
                  </CardBody>
                </Card>
              )}

              {/* Student Attendance Table */}
              <Card>
                <CardHeader divider>
                  <div className="flex items-center justify-between">
                    <CardTitle subtitle={`${students.length} students enrolled`}>
                      Mark Attendance
                    </CardTitle>
                    {hasChanges && (
                      <Button
                        variant="primary"
                        onClick={saveAttendance}
                        disabled={submitting}
                      >
                        {submitting ? 'Saving...' : 'Save Attendance'}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardBody className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-700 uppercase tracking-wider w-12">
                            #
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                            Student Name
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-700 uppercase tracking-wider hidden md:table-cell">
                            Remarks
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {students.map((s, i) => {
                          const status = draftAttendance[s.student]?.status;
                          const savedStatus = savedAttendance[s.student]?.status;
                          const changed = status !== savedStatus;
                          
                          return (
                            <tr 
                              key={s.student} 
                              className={`hover:bg-slate-50 transition-colors ${
                                status === 'absent' ? 'bg-red-50/30' :
                                status === 'late' ? 'bg-amber-50/30' :
                                status === 'present' ? 'bg-emerald-50/20' :
                                ''
                              }`}
                            >
                              <td className="px-4 py-3 text-xs font-bold text-slate-500">
                                {i + 1}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-extrabold text-xs shadow-sm border border-blue-700 shrink-0">
                                    {s.student_name?.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-slate-900">
                                      {s.student_name}
                                    </p>
                                    {changed && (
                                      <Badge variant="blue" size="sm" className="mt-0.5">
                                        Unsaved
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-center gap-1">
                                  {Object.keys(STATUS_CONFIG).map(key => {
                                    const cfg = STATUS_CONFIG[key];
                                    const isActive = status === key;
                                    return (
                                      <button
                                        key={key}
                                        onClick={() => markDraft(s.student, key)}
                                        className={`px-2.5 py-1.5 text-xs font-extrabold uppercase tracking-wide rounded-md border transition-all ${
                                          isActive
                                            ? cfg.buttonClass + ' shadow-sm'
                                            : 'bg-white text-slate-600 border-slate-300 hover:border-' + cfg.color + '-400 hover:bg-' + cfg.color + '-50'
                                        }`}
                                        title={cfg.label}
                                      >
                                        {cfg.short}
                                      </button>
                                    );
                                  })}
                                </div>
                              </td>
                              <td className="px-4 py-3 hidden md:table-cell">
                                <input
                                  type="text"
                                  value={draftRemarks[s.student] || ''}
                                  onChange={e => setDraftRemarks(prev => ({ ...prev, [s.student]: e.target.value }))}
                                  placeholder="Add note..."
                                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardBody>
              </Card>

              {/* Save Button (Mobile) */}
              {hasChanges && (
                <div className="md:hidden">
                  <Button
                    variant="primary"
                    onClick={saveAttendance}
                    disabled={submitting}
                    className="w-full"
                  >
                    {submitting ? 'Saving...' : 'Save Attendance'}
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* HISTORY VIEW */}
      {/* ══════════════════════════════════════════════════════════════ */}

      {view === 'history' && (
        <>
          {!selectedClassroom ? (
            <Card>
              <CardBody className="p-12">
                <EmptyState
                  title="Select a Classroom"
                  description="Choose a classroom to view attendance history"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  }
                />
              </CardBody>
            </Card>
          ) : loadingHistory ? (
            <div className="flex items-center justify-center h-48">
              <LoadingSpinner />
            </div>
          ) : (
            <Card>
              <CardHeader divider>
                <CardTitle 
                  subtitle={historyDate 
                    ? `${history.length} records on ${new Date(historyDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                    : `${history.length} total records`}
                >
                  Attendance History
                </CardTitle>
              </CardHeader>
              <CardBody className="p-0">
                {history.length === 0 ? (
                  <div className="p-12">
                    <EmptyState
                      title="No Records Found"
                      description="No attendance records match your criteria"
                      icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                      }
                    />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                            Student Name
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-700 uppercase tracking-wider hidden md:table-cell">
                            Remarks
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {history.map((record) => {
                          const cfg = STATUS_CONFIG[record.status];
                          const date = new Date(record.date + 'T00:00:00');
                          return (
                            <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3 text-sm font-bold text-slate-900">
                                {date.toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  year: 'numeric' 
                                })}
                              </td>
                              <td className="px-4 py-3 text-sm font-bold text-slate-900">
                                {record.student_name}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <Badge variant={cfg?.color || 'slate'}>
                                  {cfg?.label || record.status}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600 hidden md:table-cell">
                                {record.remarks || '—'}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => deleteAttendance(record)}
                                  className="p-2 rounded-md text-red-600 hover:bg-red-50 transition-all"
                                  title="Delete Record"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ANALYTICS VIEW */}
      {/* ══════════════════════════════════════════════════════════════ */}

      {view === 'analytics' && (
        <>
          {loadingAnalytics ? (
            <div className="flex items-center justify-center h-48">
              <LoadingSpinner />
            </div>
          ) : !analytics ? (
            <Card>
              <CardBody className="p-12">
                <EmptyState
                  title="No Analytics Available"
                  description="No attendance data to analyze"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  }
                />
              </CardBody>
            </Card>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                  <CardBody className="p-4 text-center">
                    <div className="text-3xl font-extrabold text-blue-600 mb-1">
                      {analytics.total_records || 0}
                    </div>
                    <div className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                      Total Records
                    </div>
                  </CardBody>
                </Card>

                <Card className="border-l-4 border-l-emerald-500">
                  <CardBody className="p-4 text-center">
                    <div className="text-3xl font-extrabold text-emerald-600 mb-1">
                      {analytics.average_rate ? `${Math.round(analytics.average_rate)}%` : '—'}
                    </div>
                    <div className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                      Avg. Rate
                    </div>
                  </CardBody>
                </Card>

                <Card className="border-l-4 border-l-amber-500">
                  <CardBody className="p-4 text-center">
                    <div className="text-3xl font-extrabold text-amber-600 mb-1">
                      {analytics.total_late || 0}
                    </div>
                    <div className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                      Late Records
                    </div>
                  </CardBody>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                  <CardBody className="p-4 text-center">
                    <div className="text-3xl font-extrabold text-red-600 mb-1">
                      {analytics.total_absent || 0}
                    </div>
                    <div className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                      Absent Records
                    </div>
                  </CardBody>
                </Card>
              </div>

              {/* Status Breakdown */}
              <Card>
                <CardHeader divider>
                  <CardTitle subtitle="Overall attendance status distribution">
                    Status Breakdown
                  </CardTitle>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    {[
                      { key: 'present', label: 'Present', color: 'emerald', value: analytics.total_present || 0 },
                      { key: 'absent', label: 'Absent', color: 'red', value: analytics.total_absent || 0 },
                      { key: 'late', label: 'Late', color: 'amber', value: analytics.total_late || 0 },
                      { key: 'excused', label: 'Excused', color: 'blue', value: analytics.total_excused || 0 },
                    ].map(item => {
                      const total = analytics.total_records || 1;
                      const percentage = Math.round((item.value / total) * 100);
                      return (
                        <div key={item.key}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                              {item.label}
                            </span>
                            <span className={`text-sm font-extrabold text-${item.color}-600`}>
                              {item.value} ({percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2.5">
                            <div
                              className={`h-2.5 rounded-full bg-${item.color}-500 transition-all`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardBody>
              </Card>

              {/* Class-by-Class Breakdown */}
              {analytics.by_classroom && analytics.by_classroom.length > 0 && (
                <Card>
                  <CardHeader divider>
                    <CardTitle subtitle="Attendance rates by classroom">
                      Classroom Performance
                    </CardTitle>
                  </CardHeader>
                  <CardBody className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                              Classroom
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                              Present
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                              Absent
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                              Late
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                              Rate
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                          {analytics.by_classroom.map((cls) => {
                            const total = (cls.present || 0) + (cls.absent || 0) + (cls.late || 0) + (cls.excused || 0);
                            const rate = total > 0 
                              ? Math.round(((cls.present + cls.late) / total) * 100)
                              : 0;
                            return (
                              <tr key={cls.classroom} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3 text-sm font-bold text-slate-900">
                                  {cls.classroom_name || 'Unknown'}
                                </td>
                                <td className="px-4 py-3 text-center text-sm font-bold text-emerald-600">
                                  {cls.present || 0}
                                </td>
                                <td className="px-4 py-3 text-center text-sm font-bold text-red-600">
                                  {cls.absent || 0}
                                </td>
                                <td className="px-4 py-3 text-center text-sm font-bold text-amber-600">
                                  {cls.late || 0}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <Badge variant={rate >= 75 ? 'green' : 'red'}>
                                    {rate}%
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardBody>
                </Card>
              )}
            </>
          )}
        </>
      )}
    </motion.div>
  );
};

export default Attendance;
