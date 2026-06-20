import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { useActiveAcademicYear } from '../hooks/useActiveAcademicYear';
import { useAuth } from '../context/AuthContext';
import { getLocalDate } from '../utils/dateHelpers';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import {
  Card, CardHeader, CardBody, CardTitle, Button, Badge,
  LoadingSpinner, EmptyState, Modal, ModalHeader, ModalBody, ModalFooter
} from '../components/ui';
import StudentAttendance from './attendance/StudentAttendance';

const STATUS_CONFIG = {
  present: { label: 'Present', short: 'P', color: 'emerald', buttonClass: 'bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-700' },
  absent:  { label: 'Absent',  short: 'A', color: 'red',     buttonClass: 'bg-red-600 text-white hover:bg-red-700 border-red-700' },
  late:    { label: 'Late',    short: 'L', color: 'amber',   buttonClass: 'bg-amber-600 text-white hover:bg-amber-700 border-amber-700' },
  excused: { label: 'Excused', short: 'E', color: 'violet',  buttonClass: 'bg-violet-600 text-white hover:bg-violet-700 border-violet-700' },
};

const getLocalDateStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const Attendance = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isStudent = user?.role === 'student';
  const isAdmin = user?.role === 'admin';

  const { academicYear, setAcademicYear } = useActiveAcademicYear();
  const [todayStr] = useState(getLocalDateStr());

  // Teacher schedule state
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [scheduleStudents, setScheduleStudents] = useState([]);
  const [scheduleDraft, setScheduleDraft] = useState({});
  const [scheduleRemarks, setScheduleRemarks] = useState({});
  const [scheduleSaved, setScheduleSaved] = useState({});
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [loadingScheduleStudents, setLoadingScheduleStudents] = useState(false);
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false);

  // Class-level mark state (admin fallback)
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState(location.state?.classroomId || '');
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [students, setStudents] = useState([]);
  const [savedAttendance, setSavedAttendance] = useState({});
  const [savedRemarks, setSavedRemarks] = useState({});
  const [draftAttendance, setDraftAttendance] = useState({});
  const [draftRemarks, setDraftRemarks] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Student state
  const [myAttendance, setMyAttendance] = useState([]);
  const [filterMonth, setFilterMonth] = useState(todayStr.slice(0, 7));

  // View state
  const [view, setView] = useState(isAdmin ? 'mark' : 'mark');
  const [markMode, setMarkMode] = useState('schedule');
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [historyDate, setHistoryDate] = useState(todayStr);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => {
    if (!academicYear || isStudent) return;
    if (isAdmin) {
      api.get(`/classrooms/?academic_year=${academicYear}`)
        .then(r => setClassrooms(r.data))
        .catch(() => toast.error('Failed to load classrooms'));
    }
    loadTodaySchedules();
  }, [academicYear, isStudent, isAdmin]);

  useEffect(() => {
    if (isStudent) {
      api.get('/attendance/')
        .then(r => setMyAttendance(r.data))
        .catch(() => toast.error('Failed to load attendance'));
    }
  }, [isStudent]);

  const loadTodaySchedules = async () => {
    setLoadingSchedules(true);
    try {
      const res = await api.get('/attendance/today_schedules/');
      setTodaySchedules(res.data);
    } catch {
      setTodaySchedules([]);
    } finally {
      setLoadingSchedules(false);
    }
  };

  const selectSchedule = async (sch) => {
    setSelectedSchedule(sch);
    setLoadingScheduleStudents(true);
    setScheduleDraft({});
    setScheduleRemarks({});
    setScheduleSaved({});
    try {
      const res = await api.get(`/attendance/by_schedule/?schedule=${sch.id}&date=${todayStr}`);
      const students = res.data.students || [];
      const draft = {}, remarks = {}, saved = {};
      students.forEach(s => {
        if (s.status) {
          draft[s.student_id] = { status: s.status };
          saved[s.student_id] = { id: s.attendance_id, status: s.status };
          remarks[s.student_id] = s.remarks || '';
        }
      });
      setScheduleStudents(students);
      setScheduleDraft(draft);
      setScheduleSaved(saved);
      setScheduleRemarks(remarks);
    } catch {
      toast.error('Failed to load students');
      setScheduleStudents([]);
    } finally {
      setLoadingScheduleStudents(false);
    }
  };

  const markScheduleDraft = (studentId, status) => {
    setScheduleDraft(prev => ({ ...prev, [studentId]: { ...prev[studentId], status } }));
  };

  const markAllScheduleDraft = (status) => {
    const updated = {};
    scheduleStudents.forEach(s => { updated[s.student_id] = { ...scheduleDraft[s.student_id], status }; });
    setScheduleDraft(updated);
    toast(`All marked as ${STATUS_CONFIG[status].label}. Click Save to confirm.`, { icon: 'ℹ️' });
  };

  const saveScheduleAttendance = async () => {
    const toSave = scheduleStudents.filter(s => scheduleDraft[s.student_id]?.status);
    if (!toSave.length) return toast.error('Mark at least one student before saving');

    setScheduleSubmitting(true);
    let ok = 0, fail = 0;
    const newSaved = { ...scheduleSaved };

    await Promise.all(toSave.map(async s => {
      const draft = scheduleDraft[s.student_id];
      const saved = scheduleSaved[s.student_id];
      const remarks = scheduleRemarks[s.student_id] || '';
      try {
        if (saved?.id) {
          await api.patch(`/attendance/${saved.id}/`, { status: draft.status, remarks });
          newSaved[s.student_id] = { id: saved.id, status: draft.status };
        } else {
          const res = await api.post('/attendance/', {
            student: s.student_id,
            classroom: selectedSchedule.classroom,
            date: todayStr,
            status: draft.status,
            remarks,
            schedule: selectedSchedule.id,
          });
          newSaved[s.student_id] = { id: res.data.id, status: draft.status };
        }
        ok++;
      } catch { fail++; }
    }));

    setScheduleSaved(newSaved);
    setScheduleDraft(newSaved);
    setScheduleSubmitting(false);
    if (ok > 0) toast.success(`Attendance saved for ${ok} student${ok !== 1 ? 's' : ''}`);
    if (fail > 0) toast.error(`${fail} record${fail !== 1 ? 's' : ''} failed to save`);
    loadTodaySchedules();
  };

  const scheduleHasChanges = scheduleStudents.some(s =>
    scheduleDraft[s.student_id]?.status !== scheduleSaved[s.student_id]?.status ||
    (scheduleRemarks[s.student_id] || '') !== ('')
  );

  const scheduleStats = scheduleStudents.reduce((acc, s) => {
    const status = scheduleDraft[s.student_id]?.status;
    if (status) acc[status] = (acc[status] || 0) + 1;
    else acc.unmarked = (acc.unmarked || 0) + 1;
    return acc;
  }, { present: 0, absent: 0, late: 0, excused: 0, unmarked: 0 });

  const sortedClassrooms = useMemo(() => {
    return [...classrooms].sort((a, b) => {
      const numA = parseInt(a.name.match(/\d+/)?.[0] || '0');
      const numB = parseInt(b.name.match(/\d+/)?.[0] || '0');
      if (numA !== numB) return numA - numB;
      return a.name.localeCompare(b.name);
    });
  }, [classrooms]);

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
    } catch { toast.error('Failed to load attendance data'); }
    finally { setLoadingStudents(false); }
  }, [selectedClassroom, selectedDate, isStudent]);

  useEffect(() => { loadAttendance(); }, [loadAttendance]);

  const fetchHistory = useCallback(async () => {
    if (!selectedClassroom || !academicYear) return;
    setLoadingHistory(true);
    setHistory([]);
    try {
      const params = new URLSearchParams({ classroom: selectedClassroom, academic_year: academicYear });
      if (historyDate) params.append('date', historyDate);
      const res = await api.get(`/attendance/?${params}`);
      setHistory(res.data);
    } catch { toast.error('Failed to load history'); }
    finally { setLoadingHistory(false); }
  }, [selectedClassroom, historyDate, academicYear]);

  useEffect(() => { if (view === 'history' && selectedClassroom) fetchHistory(); }, [view, fetchHistory, academicYear]);

  const fetchAnalytics = useCallback(async () => {
    if (!academicYear) return;
    setLoadingAnalytics(true);
    setAnalytics(null);
    try {
      const params = { academic_year: academicYear };
      if (selectedClassroom) params.classroom = selectedClassroom;
      const res = await api.get('/attendance/summary/', { params });
      setAnalytics(res.data);
    } catch { toast.error('Failed to load analytics'); }
    finally { setLoadingAnalytics(false); }
  }, [selectedClassroom, academicYear]);

  useEffect(() => { if (view === 'analytics') fetchAnalytics(); }, [view, fetchAnalytics, academicYear]);

  const markDraft = (studentId, status) => {
    setDraftAttendance(prev => ({ ...prev, [studentId]: { ...prev[studentId], status } }));
  };

  const markAllDraft = (status) => {
    const updated = {};
    students.forEach(s => { updated[s.student] = { ...draftAttendance[s.student], status }; });
    setDraftAttendance(prev => ({ ...prev, ...updated }));
    toast(`All marked as ${STATUS_CONFIG[status].label}. Click Save to confirm.`, { icon: 'ℹ️' });
  };

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
          await api.patch(`/attendance/${saved.id}/`, { status: draft.status, remarks });
          newSaved[s.student] = { id: saved.id, status: draft.status };
        } else {
          const res = await api.post('/attendance/', {
            student: s.student, classroom: selectedClassroom,
            date: selectedDate, status: draft.status, remarks,
          });
          newSaved[s.student] = { id: res.data.id, status: draft.status };
        }
        ok++;
      } catch { fail++; }
    }));
    setSavedAttendance(newSaved);
    setSavedRemarks(draftRemarks);
    setDraftAttendance(newSaved);
    setDraftRemarks(draftRemarks);
    setSubmitting(false);
    if (ok > 0) toast.success(`Attendance saved for ${ok} student${ok !== 1 ? 's' : ''}`);
    if (fail > 0) toast.error(`${fail} record${fail !== 1 ? 's' : ''} failed to save`);
  };

  const deleteAttendance = async (record) => {
    const result = await Swal.fire({
      title: 'Delete Record?',
      html: `Delete attendance for <strong>${record.student_name}</strong> on ${new Date(record.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}?`,
      icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#6b7280', confirmButtonText: 'Delete',
    });
    if (!result.isConfirmed) return;
    try { await api.delete(`/attendance/${record.id}/`); toast.success('Record deleted'); fetchHistory(); }
    catch { toast.error('Failed to delete record'); }
  };

  const stats = students.reduce((acc, s) => {
    const status = draftAttendance[s.student]?.status;
    if (status) acc[status] = (acc[status] || 0) + 1;
    else acc.unmarked = (acc.unmarked || 0) + 1;
    return acc;
  }, { present: 0, absent: 0, late: 0, excused: 0, unmarked: 0 });

  const attendanceRate = students.length > 0
    ? Math.round(((stats.present + stats.late) / students.length) * 100) : null;

  const hasChanges = students.some(s =>
    draftAttendance[s.student]?.status !== savedAttendance[s.student]?.status ||
    (draftRemarks[s.student] || '') !== (savedRemarks[s.student] || '')
  );

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
    return <StudentAttendance />;
  }

  // ══════════════════════════════════════════════════════════════
  // TEACHER / ADMIN VIEW
  // ══════════════════════════════════════════════════════════════

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className="page-bottom-safe max-w-[1600px] mx-auto bg-slate-50 px-4 py-4 md:px-6 md:py-6 space-y-5 md:space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-violet-700 uppercase tracking-wide mb-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span>Attendance Management</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Attendance Tracker</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <p className="text-xs text-slate-600 font-semibold">
              {view === 'mark' ? (markMode === 'schedule' ? `Schedule-based marking for today` : `Class-level marking for ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`)
                : view === 'history' ? 'View attendance history' : 'Attendance analytics'}
            </p>
            {academicYear && <Badge variant="blue" size="sm"><span className="w-1.5 h-1.5 rounded-full bg-violet-500 mr-1" />{academicYear}</Badge>}
          </div>
        </div>

        <div className="flex rounded-lg border border-slate-300 overflow-hidden shadow-sm">
          {[{ key: 'mark', label: 'Mark', icon: '✏️' }, { key: 'history', label: 'History', icon: '📋' }, { key: 'analytics', label: 'Analytics', icon: '📊' }].map(v => (
            <button key={v.key} onClick={() => setView(v.key)}
              className={`px-4 md:px-6 py-2.5 text-xs font-extrabold uppercase tracking-wide transition-all ${view === v.key ? 'bg-violet-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
              <span className="mr-1">{v.icon}</span>{v.label}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* MARK VIEW */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {view === 'mark' && (
        <>
          <div className="flex rounded-lg border border-slate-300 overflow-hidden shadow-sm w-fit">
            {[
              { key: 'schedule', label: 'By Period (Today)', icon: '🕐' },
              { key: 'class', label: 'By Class', icon: '🏫' },
            ].map(m => (
              <button key={m.key} onClick={() => setMarkMode(m.key)}
                className={`px-4 md:px-5 py-2 text-xs font-extrabold uppercase tracking-wide transition-all ${markMode === m.key ? 'bg-violet-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
                <span className="mr-1">{m.icon}</span>{m.label}
              </button>
            ))}
          </div>

          {/* SCHEDULE-BASED MARKING */}
          {markMode === 'schedule' && (
            <>
              {loadingSchedules ? (
                <div className="flex items-center justify-center h-48"><LoadingSpinner /></div>
              ) : todaySchedules.length === 0 ? (
                <Card>
                  <CardBody className="p-12">
                    <EmptyState title="No Classes Today" description="You don't have any scheduled classes for today."
                      icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>} />
                  </CardBody>
                </Card>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {todaySchedules.map(sch => {
                      const pct = sch.total_students > 0 ? Math.round((sch.marked_count / sch.total_students) * 100) : 0;
                      const isSel = selectedSchedule?.id === sch.id;
                      return (
                        <button key={sch.id} onClick={() => selectSchedule(sch)}
                          className={`text-left p-4 rounded-xl border-2 transition-all ${isSel ? 'border-violet-600 bg-violet-50 shadow-lg shadow-violet-100' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs font-extrabold uppercase tracking-wider ${isSel ? 'text-violet-700' : 'text-slate-500'}`}>
                              {sch.start_time} - {sch.end_time}
                            </span>
                            {sch.is_complete ? (
                              <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                Done
                              </span>
                            ) : sch.marked_count > 0 ? (
                              <span className="text-[10px] font-black text-amber-600 uppercase">Partial</span>
                            ) : (
                              <span className="text-[10px] font-black text-slate-400 uppercase">Pending</span>
                            )}
                          </div>
                          <h3 className="text-sm font-extrabold text-slate-900 leading-tight mb-1">{sch.subject_name}</h3>
                          <p className="text-xs font-bold text-slate-600">{sch.classroom_name}</p>
                          <div className="flex items-center gap-2 mt-2 text-[10px] font-bold text-slate-500">
                            <span>{sch.room_name || 'No room'}</span>
                            <span>·</span>
                            <span>{sch.marked_count}/{sch.total_students} marked</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                            <div className={`h-1.5 rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : 'bg-violet-400'}`} style={{ width: `${pct}%` }} />
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {selectedSchedule && (
                    <>
                      {loadingScheduleStudents ? (
                        <div className="flex items-center justify-center h-48"><LoadingSpinner /></div>
                      ) : scheduleStudents.length === 0 ? (
                        <Card><CardBody className="p-12">
                          <EmptyState title="No Students" description="No students enrolled in this section." />
                        </CardBody></Card>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <div>
                              <h2 className="text-lg font-extrabold text-slate-900">{selectedSchedule.subject_name} — {selectedSchedule.classroom_name}</h2>
                              <p className="text-xs text-slate-500 font-semibold">{selectedSchedule.time_slot_label}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="hidden md:flex gap-2">
                                <Button variant="secondary" size="sm" onClick={() => markAllScheduleDraft('present')}
                                  className="bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100">Present</Button>
                                <Button variant="secondary" size="sm" onClick={() => markAllScheduleDraft('absent')}
                                  className="bg-red-50 text-red-700 border-red-300 hover:bg-red-100">Absent</Button>
                              </div>
                              {scheduleStudents.some(s => scheduleDraft[s.student_id]?.status !== scheduleSaved[s.student_id]?.status) && (
                                <Button variant="primary" size="sm" onClick={saveScheduleAttendance} disabled={scheduleSubmitting}>
                                  {scheduleSubmitting ? 'Saving...' : 'Save'}
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            {[{ k: 'present', l: 'Present', c: 'emerald' }, { k: 'absent', l: 'Absent', c: 'red' }, { k: 'late', l: 'Late', c: 'amber' }, { k: 'excused', l: 'Excused', c: 'violet' }, { k: 'unmarked', l: 'Unmarked', c: 'slate' }].map(s => (
                              <Card key={s.k} className={`border-l-4 border-l-${s.c}-500`}>
                                <CardBody className="p-3 text-center">
                                  <div className={`text-2xl font-extrabold text-${s.c}-600`}>{scheduleStats[s.k] || 0}</div>
                                  <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">{s.l}</div>
                                </CardBody>
                              </Card>
                            ))}
                          </div>

                          <Card>
                            <CardBody className="p-0">
                              <div className="overflow-x-auto">
                                <table className="w-full">
                                  <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                      <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-700 uppercase tracking-wider w-12">#</th>
                                      <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-700 uppercase tracking-wider">Student</th>
                                      <th className="px-4 py-3 text-center text-xs font-extrabold text-slate-700 uppercase tracking-wider">Status</th>
                                      <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-700 uppercase tracking-wider hidden md:table-cell">Remarks</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-slate-100">
                                    {scheduleStudents.map((s, i) => {
                                      const status = scheduleDraft[s.student_id]?.status;
                                      const saved = scheduleSaved[s.student_id]?.status;
                                      const changed = status !== saved;
                                      return (
                                        <tr key={s.student_id}
                                          className={`hover:bg-slate-50 transition-colors ${status === 'absent' ? 'bg-red-50/30' : status === 'late' ? 'bg-amber-50/30' : status === 'present' ? 'bg-emerald-50/20' : ''}`}>
                                          <td className="px-4 py-3 text-xs font-bold text-slate-500">{i + 1}</td>
                                          <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                              <div className="w-9 h-9 rounded-md bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-white font-extrabold text-xs shadow-sm border border-violet-700 shrink-0">
                                                {s.student_name?.charAt(0).toUpperCase()}
                                              </div>
                                              <div>
                                                <p className="text-sm font-bold text-slate-900">{s.student_name}</p>
                                                {changed && <Badge variant="blue" size="sm" className="mt-0.5">Unsaved</Badge>}
                                              </div>
                                            </div>
                                          </td>
                                          <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-1">
                                              {Object.keys(STATUS_CONFIG).map(key => {
                                                const cfg = STATUS_CONFIG[key];
                                                return (
                              <button key={key} onClick={() => markScheduleDraft(s.student_id, key)}
                                                        className={`px-1.5 py-1 sm:px-2.5 sm:py-1.5 text-[10px] sm:text-xs font-extrabold uppercase tracking-wide rounded border transition-all ${status === key ? cfg.buttonClass + ' shadow-sm' : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'}`}
                                                        title={cfg.label}>
                                                        {cfg.short}
                                                      </button>
                                                );
                                              })}
                                            </div>
                                          </td>
                                          <td className="px-4 py-3 hidden md:table-cell">
                                            <input type="text" value={scheduleRemarks[s.student_id] || ''}
                                              onChange={e => setScheduleRemarks(prev => ({ ...prev, [s.student_id]: e.target.value }))}
                                              placeholder="Add note..."
                                              className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500" />
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </CardBody>
                          </Card>

                          {scheduleStudents.some(s => scheduleDraft[s.student_id]?.status !== scheduleSaved[s.student_id]?.status) && (
                            <div className="md:hidden">
                              <Button variant="primary" onClick={saveScheduleAttendance} disabled={scheduleSubmitting} className="w-full">
                                {scheduleSubmitting ? 'Saving...' : 'Save Attendance'}
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          )}

          {/* CLASS-LEVEL MARKING */}
          {markMode === 'class' && (
            <>
              <Card>
                <CardBody className="p-4 md:p-5">
                  {isWeekend(selectedDate) && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-amber-800 uppercase tracking-wide">Weekend Detected ({getDayName(selectedDate)})</p>
                        <p className="text-xs font-semibold text-amber-700 mt-0.5">Marking on weekends is typically not required.</p>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">Classroom</label>
                      <select value={selectedClassroom} onChange={e => setSelectedClassroom(e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 text-sm font-semibold shadow-sm transition-all">
                        <option value="">Select classroom</option>
                        {sortedClassrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">Date</label>
                      <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} max={todayStr}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 text-sm font-semibold shadow-sm transition-all" />
                    </div>
                    {selectedClassroom && students.length > 0 && (
                      <div>
                        <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">Quick Mark All</label>
                        <div className="flex gap-2">
                          <Button variant="secondary" size="sm" onClick={() => markAllDraft('present')}
                            className="flex-1 bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100">Present</Button>
                          <Button variant="secondary" size="sm" onClick={() => markAllDraft('absent')}
                            className="flex-1 bg-red-50 text-red-700 border-red-300 hover:bg-red-100">Absent</Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>

              {!selectedClassroom ? (
                <Card><CardBody className="p-12">
                  <EmptyState title="Select a Classroom" description="Choose a classroom to start marking attendance"
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>} />
                </CardBody></Card>
              ) : loadingStudents ? (
                <div className="flex items-center justify-center h-48"><LoadingSpinner /></div>
              ) : students.length === 0 ? (
                <Card><CardBody className="p-12">
                  <EmptyState title="No Students Enrolled" description="This classroom doesn't have any students yet" />
                </CardBody></Card>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 md:gap-4">
                    {[{ key: 'present', label: 'Present', color: 'emerald' }, { key: 'absent', label: 'Absent', color: 'red' },
                      { key: 'late', label: 'Late', color: 'amber' }, { key: 'excused', label: 'Excused', color: 'blue' },
                      { key: 'unmarked', label: 'Unmarked', color: 'slate' }].map(s => (
                      <Card key={s.key} className={`border-l-4 border-l-${s.color}-500`}>
                        <CardBody className="p-3 md:p-4 text-center">
                          <div className={`text-2xl md:text-3xl font-extrabold text-${s.color}-600`}>{stats[s.key] || 0}</div>
                          <div className="text-xs font-bold text-slate-600 uppercase tracking-wide mt-1">{s.label}</div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>

                  {attendanceRate !== null && (
                    <Card>
                      <CardBody className="p-4 md:p-5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">Attendance Rate</span>
                          <span className={`text-lg font-extrabold ${attendanceRate >= 75 ? 'text-emerald-600' : 'text-red-600'}`}>{attendanceRate}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3">
                          <div className={`h-3 rounded-full transition-all ${attendanceRate >= 75 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${attendanceRate}%` }} />
                        </div>
                      </CardBody>
                    </Card>
                  )}

                  <Card>
                    <CardHeader divider>
                      <div className="flex items-center justify-between">
                        <CardTitle subtitle={`${students.length} students enrolled`}>Mark Attendance</CardTitle>
                        {hasChanges && (
                          <Button variant="primary" onClick={saveAttendance} disabled={submitting}>
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
                              <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-700 uppercase tracking-wider w-12">#</th>
                              <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-700 uppercase tracking-wider">Student Name</th>
                              <th className="px-4 py-3 text-center text-xs font-extrabold text-slate-700 uppercase tracking-wider">Status</th>
                              <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-700 uppercase tracking-wider hidden md:table-cell">Remarks</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-100">
                            {students.map((s, i) => {
                              const status = draftAttendance[s.student]?.status;
                              const savedStatus = savedAttendance[s.student]?.status;
                              const changed = status !== savedStatus;
                              return (
                                <tr key={s.student}
                                  className={`hover:bg-slate-50 transition-colors ${status === 'absent' ? 'bg-red-50/30' : status === 'late' ? 'bg-amber-50/30' : status === 'present' ? 'bg-emerald-50/20' : ''}`}>
                                  <td className="px-4 py-3 text-xs font-bold text-slate-500">{i + 1}</td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-9 h-9 rounded-md bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-white font-extrabold text-xs shadow-sm border border-violet-700 shrink-0">
                                        {s.student_name?.charAt(0).toUpperCase()}
                                      </div>
                                      <div>
                                        <p className="text-sm font-bold text-slate-900">{s.student_name}</p>
                                        {changed && <Badge variant="blue" size="sm" className="mt-0.5">Unsaved</Badge>}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center justify-center gap-1">
                                      {Object.keys(STATUS_CONFIG).map(key => {
                                        const cfg = STATUS_CONFIG[key];
                                        return (
                                          <button key={key} onClick={() => markDraft(s.student, key)}
                                            className={`px-1.5 py-1 sm:px-2.5 sm:py-1.5 text-[10px] sm:text-xs font-extrabold uppercase tracking-wide rounded border transition-all ${status === key ? cfg.buttonClass + ' shadow-sm' : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'}`}
                                            title={cfg.label}>
                                            {cfg.short}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 hidden md:table-cell">
                                    <input type="text" value={draftRemarks[s.student] || ''}
                                      onChange={e => setDraftRemarks(prev => ({ ...prev, [s.student]: e.target.value }))}
                                      placeholder="Add note..."
                                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500" />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardBody>
                  </Card>

                  {hasChanges && (
                    <div className="md:hidden">
                      <Button variant="primary" onClick={saveAttendance} disabled={submitting} className="w-full">
                        {submitting ? 'Saving...' : 'Save Attendance'}
                      </Button>
                    </div>
                  )}
                </>
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
          <Card>
            <CardBody className="p-4 md:p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">Classroom</label>
                  <select value={selectedClassroom} onChange={e => setSelectedClassroom(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 text-sm font-semibold shadow-sm transition-all">
                    <option value="">Select classroom</option>
                    {sortedClassrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">Date</label>
                  <div className="flex gap-2">
                    <input type="date" value={historyDate} onChange={e => setHistoryDate(e.target.value)}
                      className="flex-1 px-3 py-2.5 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 text-sm font-semibold shadow-sm transition-all" />
                    {historyDate && <Button variant="secondary" size="sm" onClick={() => setHistoryDate('')}>All</Button>}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {!selectedClassroom ? (
            <Card><CardBody className="p-12">
              <EmptyState title="Select a Classroom" description="Choose a classroom to view attendance history"
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>} />
            </CardBody></Card>
          ) : loadingHistory ? (
            <div className="flex items-center justify-center h-48"><LoadingSpinner /></div>
          ) : (
            <Card>
              <CardHeader divider>
                <CardTitle subtitle={historyDate ? `${history.length} records on ${new Date(historyDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` : `${history.length} total records`}>
                  Attendance History
                </CardTitle>
              </CardHeader>
              <CardBody className="p-0">
                {history.length === 0 ? (
                  <div className="p-12">
                    <EmptyState title="No Records Found" description="No attendance records match your criteria"
                      icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>} />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-700 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-700 uppercase tracking-wider">Student</th>
                          <th className="px-4 py-3 text-center text-xs font-extrabold text-slate-700 uppercase tracking-wider hidden md:table-cell">Subject</th>
                          <th className="px-4 py-3 text-center text-xs font-extrabold text-slate-700 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-700 uppercase tracking-wider hidden md:table-cell">Remarks</th>
                          <th className="px-4 py-3 text-center text-xs font-extrabold text-slate-700 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {history.map((record) => {
                          const cfg = STATUS_CONFIG[record.status];
                          const date = new Date(record.date + 'T00:00:00');
                          return (
                            <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3 text-sm font-bold text-slate-900">
                                {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </td>
                              <td className="px-4 py-3 text-sm font-bold text-slate-900">{record.student_name}</td>
                              <td className="px-4 py-3 text-center text-sm font-semibold text-slate-600 hidden md:table-cell">{record.subject_name || '—'}</td>
                              <td className="px-4 py-3 text-center">
                                <Badge variant={cfg?.color || 'slate'}>{cfg?.label || record.status}</Badge>
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600 hidden md:table-cell">{record.remarks || '—'}</td>
                              <td className="px-4 py-3 text-center">
                                <button onClick={() => deleteAttendance(record)} className="p-2 rounded-md text-red-600 hover:bg-red-50 transition-all" title="Delete Record">
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
          <Card>
            <CardBody className="p-4 md:p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">Classroom (Optional)</label>
                  <select value={selectedClassroom} onChange={e => setSelectedClassroom(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 text-sm font-semibold shadow-sm transition-all">
                    <option value="">All Classrooms</option>
                    {sortedClassrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            </CardBody>
          </Card>

          {loadingAnalytics ? (
            <div className="flex items-center justify-center h-48"><LoadingSpinner /></div>
          ) : !analytics ? (
            <Card><CardBody className="p-12">
              <EmptyState title="No Analytics Available" description="No attendance data to analyze"
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>} />
            </CardBody></Card>
          ) : (
            <>
              {analytics.pie_data && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {analytics.pie_data.map(item => (
                    <Card key={item.name} className={`border-l-4 border-l-${item.name === 'Present' ? 'emerald' : item.name === 'Late' ? 'amber' : item.name === 'Absent' ? 'red' : 'violet'}-500`}>
                      <CardBody className="p-4 text-center">
                        <div className={`text-3xl font-extrabold text-${item.name === 'Present' ? 'emerald' : item.name === 'Late' ? 'amber' : item.name === 'Absent' ? 'red' : 'violet'}-600 mb-1`}>{item.value}</div>
                        <div className="text-xs font-bold text-slate-600 uppercase tracking-wide">{item.name}</div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              )}

              {analytics.section_rankings && analytics.section_rankings.length > 0 && (
                <Card>
                  <CardHeader divider>
                    <CardTitle subtitle="Attendance rates by classroom">Section Rankings</CardTitle>
                  </CardHeader>
                  <CardBody className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-700 uppercase tracking-wider">#</th>
                            <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-700 uppercase tracking-wider">Classroom</th>
                            <th className="px-4 py-3 text-center text-xs font-extrabold text-slate-700 uppercase tracking-wider">Rate</th>
                            <th className="px-4 py-3 text-center text-xs font-extrabold text-slate-700 uppercase tracking-wider">Records</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                          {analytics.section_rankings.map((r, i) => (
                            <tr key={r.id} className="hover:bg-slate-50">
                              <td className="px-4 py-3 text-sm font-bold text-slate-500">{i + 1}</td>
                              <td className="px-4 py-3 text-sm font-bold text-slate-900">{r.name}</td>
                              <td className="px-4 py-3 text-center">
                                <Badge variant={r.rate >= 75 ? 'green' : 'red'}>{r.rate}%</Badge>
                              </td>
                              <td className="px-4 py-3 text-center text-sm font-bold text-slate-600">{r.total_records}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardBody>
                </Card>
              )}

              {analytics.daily_trends && analytics.daily_trends.length > 0 && (
                <Card>
                  <CardHeader divider>
                    <CardTitle subtitle="Recent attendance trends">Daily Trends</CardTitle>
                  </CardHeader>
                  <CardBody className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-700 uppercase tracking-wider">Date</th>
                            <th className="px-4 py-3 text-center text-xs font-extrabold text-slate-700 uppercase tracking-wider">Present</th>
                            <th className="px-4 py-3 text-center text-xs font-extrabold text-slate-700 uppercase tracking-wider hidden sm:table-cell">Late</th>
                            <th className="px-4 py-3 text-center text-xs font-extrabold text-slate-700 uppercase tracking-wider hidden md:table-cell">Excused</th>
                            <th className="px-4 py-3 text-center text-xs font-extrabold text-slate-700 uppercase tracking-wider">Rate</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                          {analytics.daily_trends.slice(-14).reverse().map(d => (
                            <tr key={d.date} className="hover:bg-slate-50">
                              <td className="px-4 py-3 text-sm font-bold text-slate-900">
                                {new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </td>
                              <td className="px-4 py-3 text-center text-sm font-bold text-emerald-600">{d.present}</td>
                              <td className="px-4 py-3 text-center text-sm font-bold text-amber-600 hidden sm:table-cell">{d.late}</td>
                              <td className="px-4 py-3 text-center text-sm font-bold text-violet-600 hidden md:table-cell">{d.excused}</td>
                              <td className="px-4 py-3 text-center">
                                <Badge variant={d.rate >= 75 ? 'green' : 'red'}>{d.rate}%</Badge>
                              </td>
                            </tr>
                          ))}
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
