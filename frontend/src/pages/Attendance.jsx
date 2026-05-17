import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { getUser } from '../utils/auth';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const STATUS_CONFIG = {
  present: { label: 'Present', short: 'P', active: 'bg-green-500 text-white border-green-500',   inactive: 'bg-white text-gray-500 border-gray-300 hover:border-green-400 hover:text-green-600' },
  absent:  { label: 'Absent',  short: 'A', active: 'bg-red-500 text-white border-red-500',      inactive: 'bg-white text-gray-500 border-gray-300 hover:border-red-400 hover:text-red-600' },
  late:    { label: 'Late',    short: 'L', active: 'bg-yellow-500 text-white border-yellow-500', inactive: 'bg-white text-gray-500 border-gray-300 hover:border-yellow-400 hover:text-yellow-600' },
  excused: { label: 'Excused', short: 'E', active: 'bg-blue-500 text-white border-blue-500',    inactive: 'bg-white text-gray-500 border-gray-300 hover:border-blue-400 hover:text-blue-600' },
};

const STAT_CONFIG = [
  { key: 'present',  label: 'Present',  color: 'text-green-600',  bg: 'bg-green-50 border-green-200' },
  { key: 'absent',   label: 'Absent',   color: 'text-red-600',    bg: 'bg-red-50 border-red-200' },
  { key: 'late',     label: 'Late',     color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
  { key: 'excused',  label: 'Excused',  color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200' },
  { key: 'unmarked', label: 'Unmarked', color: 'text-gray-500',   bg: 'bg-gray-50 border-gray-200' },
];

const Attendance = () => {
  const user = getUser();
  const navigate = useNavigate();
  const isStudent = user?.role === 'student';

  // Teacher/admin state
  const [classrooms, setClassrooms]             = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [selectedDate, setSelectedDate]         = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents]                 = useState([]);
  const [savedAttendance, setSavedAttendance]   = useState({}); // { studentId: { id, status } }
  const [draftAttendance, setDraftAttendance]   = useState({}); // local unsaved status
  const [draftRemarks, setDraftRemarks]         = useState({}); // local unsaved remarks
  const [submitting, setSubmitting]             = useState(false);
  const [loadingStudents, setLoadingStudents]   = useState(false);

  // Student state
  const [myAttendance, setMyAttendance] = useState([]);
  const [filterMonth, setFilterMonth]   = useState(new Date().toISOString().slice(0, 7));

  // History view
  const [view, setView]               = useState('mark');
  const [history, setHistory]         = useState([]);
  const [historyDate, setHistoryDate] = useState(new Date().toISOString().split('T')[0]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!isStudent) {
      api.get('/classrooms/').then(r => setClassrooms(r.data)).catch(() => toast.error('Failed to load classrooms'));
    } else {
      api.get('/attendance/').then(r => setMyAttendance(r.data)).catch(() => toast.error('Failed to load attendance'));
    }
  }, [isStudent]);

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
      setDraftAttendance(map);
      setDraftRemarks(remarks);
    } catch { toast.error('Failed to load attendance data'); }
    finally { setLoadingStudents(false); }
  }, [selectedClassroom, selectedDate, isStudent]);

  useEffect(() => { loadAttendance(); }, [loadAttendance]);

  const fetchHistory = useCallback(async () => {
    if (!selectedClassroom) return;
    setLoadingHistory(true);
    try {
      const params = new URLSearchParams({ classroom: selectedClassroom });
      if (historyDate) params.append('date', historyDate);
      const res = await api.get(`/attendance/?${params}`);
      setHistory(res.data);
    } catch { toast.error('Failed to load history'); }
    finally { setLoadingHistory(false); }
  }, [selectedClassroom, historyDate]);

  useEffect(() => {
    if (view === 'history' && selectedClassroom) fetchHistory();
  }, [view, fetchHistory]);

  // Mark in draft only (no API call)
  const markDraft = (studentId, status) => {
    setDraftAttendance(prev => ({ ...prev, [studentId]: { ...prev[studentId], status } }));
  };

  const markAllDraft = (status) => {
    const updated = {};
    students.forEach(s => { updated[s.student] = { ...draftAttendance[s.student], status }; });
    setDraftAttendance(prev => ({ ...prev, ...updated }));
    toast(`All marked as ${STATUS_CONFIG[status].label} — click Save to confirm`, { icon: 'ℹ️' });
  };

  // Save all draft changes to backend
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
    setDraftAttendance(newSaved);
    setSubmitting(false);

    if (ok > 0) toast.success(`Attendance saved for ${ok} student${ok !== 1 ? 's' : ''}`);
    if (fail > 0) toast.error(`${fail} record${fail !== 1 ? 's' : ''} failed to save`);
  };

  const deleteAttendance = async (record) => {
    const result = await Swal.fire({
      title: 'Delete Record?',
      html: `Delete attendance for <strong>${record.student_name}</strong> on ${new Date(record.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}?`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#ef4444', cancelButtonColor: '#6b7280',
      confirmButtonText: 'Delete',
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/attendance/${record.id}/`);
      toast.success('Record deleted');
      fetchHistory();
    } catch { toast.error('Failed to delete record'); }
  };

  // Stats from draft
  const stats = students.reduce((acc, s) => {
    const status = draftAttendance[s.student]?.status;
    if (status) acc[status] = (acc[status] || 0) + 1;
    else acc.unmarked = (acc.unmarked || 0) + 1;
    return acc;
  }, { present: 0, absent: 0, late: 0, excused: 0, unmarked: 0 });

  const attendanceRate = students.length > 0
    ? Math.round(((stats.present + stats.late) / students.length) * 100) : null;

  const hasChanges = students.some(s =>
    draftAttendance[s.student]?.status !== savedAttendance[s.student]?.status
  );

  // Student filter
  const filteredMyAttendance = myAttendance.filter(r => r.date?.startsWith(filterMonth));
  const myStats = filteredMyAttendance.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1; return acc;
  }, {});

  const sortedClassrooms = useMemo(() => {
    return [...classrooms].sort((a, b) => {
      const numA = parseInt(a.name.match(/\d+/)?.[0] || '0');
      const numB = parseInt(b.name.match(/\d+/)?.[0] || '0');
      if (numA !== numB) return numA - numB;
      return a.name.localeCompare(b.name);
    });
  }, [classrooms]);

  // ── STUDENT VIEW ──────────────────────────────────────────────
  if (isStudent) {
    const total = filteredMyAttendance.length;
    const attRate = total > 0 ? Math.round(((myStats.present || 0) + (myStats.late || 0)) / total * 100) : null;
    return (
      <div className="overflow-y-auto h-[calc(100vh-4rem)] p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">My Attendance</h1>
          <p className="text-gray-500 mt-1">Your attendance record by month</p>
        </div>
        <div className="flex items-center gap-3 mb-5">
          <label className="text-sm font-semibold text-gray-600">Month</label>
          <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {STAT_CONFIG.filter(s => s.key !== 'unmarked').map(s => (
            <div key={s.key} className={`border rounded-xl p-4 text-center ${s.bg}`}>
              <div className={`text-3xl font-bold ${s.color}`}>{myStats[s.key] || 0}</div>
              <div className={`text-sm font-medium mt-1 ${s.color} opacity-80`}>{s.label}</div>
            </div>
          ))}
        </div>
        {attRate !== null && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">Monthly Attendance Rate</span>
              <span className={`text-sm font-bold ${attRate >= 75 ? 'text-green-600' : 'text-red-600'}`}>{attRate}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div className={`h-3 rounded-full transition-all ${attRate >= 75 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${attRate}%` }} />
            </div>
            {attRate < 75 && <p className="text-xs text-red-500 mt-2 font-medium">⚠️ Attendance below 75% — please attend regularly.</p>}
          </div>
        )}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {filteredMyAttendance.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No attendance records for this month.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-[#2D1B4D] to-[#4B2D7F] text-white">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider">Date</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider">Day</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider">Classroom</th>
                    <th className="text-center px-6 py-3 text-xs font-semibold uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredMyAttendance.map((r, idx) => {
                    const cfg = STATUS_CONFIG[r.status];
                    const date = new Date(r.date + 'T00:00:00');
                    return (
                      <tr key={r.id} className={`hover:bg-purple-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <td className="px-6 py-3 text-sm font-medium text-gray-800">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                        <td className="px-6 py-3 text-sm text-gray-500">{date.toLocaleDateString('en-US', { weekday: 'long' })}</td>
                        <td className="px-6 py-3 text-sm text-gray-600">{r.classroom_name}</td>
                        <td className="px-6 py-3 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cfg?.active || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                            {cfg?.label || r.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-500">{r.remarks || <span className="text-gray-300">—</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {total > 0 && <p className="text-sm text-gray-400 mt-3">{total} record{total !== 1 ? 's' : ''} in {new Date(filterMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>}
      </div>
    );
  }

  // ── TEACHER / ADMIN VIEW ──────────────────────────────────────
  return (
    <div className="overflow-y-auto h-[calc(100vh-4rem)] p-4 md:p-6 scrollbar-thin scrollbar-thumb-gray-300">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="text-center lg:text-left">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Attendance Tracker</h1>
          <p className="text-sm text-gray-500 mt-1">
            {view === 'mark'
              ? `Marking for ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`
              : 'Browse attendance history'}
          </p>
        </div>
        <div className="flex rounded-xl border border-gray-300 overflow-hidden text-sm shadow-sm w-full lg:w-auto">
          {[{ key: 'mark', label: '✏️ Mark Attendance' }, { key: 'history', label: '📋 History' }].map(v => (
            <button key={v.key} onClick={() => setView(v.key)}
              className={`flex-1 lg:px-6 py-2.5 font-bold transition-all ${view === v.key ? 'bg-[#2D1B4D] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 md:p-5 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Classroom</label>
            <select value={selectedClassroom} onChange={e => setSelectedClassroom(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm shadow-sm transition-all hover:border-purple-300">
              <option value="">Select classroom</option>
              {sortedClassrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Date</label>
            <div className="flex gap-2">
              <input type="date"
                value={view === 'mark' ? selectedDate : historyDate}
                onChange={e => view === 'mark' ? setSelectedDate(e.target.value) : setHistoryDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm shadow-sm transition-all hover:border-purple-300" />
              {view === 'history' && historyDate && (
                <button onClick={() => setHistoryDate('')}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-500 hover:text-purple-600 font-bold text-xs transition-all hover:bg-purple-50">All</button>
              )}
            </div>
          </div>
          {view === 'mark' && selectedClassroom && students.length > 0 && (
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Quick Actions</label>
              <div className="flex gap-2">
                <button onClick={() => markAllDraft('present')}
                  className="flex-1 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all shadow-sm active:scale-95">✓ Present</button>
                <button onClick={() => markAllDraft('absent')}
                  className="flex-1 px-3 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all shadow-sm active:scale-95">✗ Absent</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MARK VIEW ── */}
      {view === 'mark' && (
        <>
          {!selectedClassroom ? (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-16 text-center text-gray-400">Select a classroom to start marking attendance.</div>
          ) : loadingStudents ? (
            <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" /></div>
          ) : students.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-16 text-center text-gray-400">No students enrolled.</div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
                {STAT_CONFIG.map(s => (
                  <div key={s.key} className={`border rounded-xl p-3 text-center ${s.bg}`}>
                    <div className={`text-2xl font-bold ${s.color}`}>{stats[s.key] || 0}</div>
                    <div className={`text-xs font-medium mt-0.5 ${s.color} opacity-80`}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Rate bar */}
              {attendanceRate !== null && (
                <div className="mb-5 bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1 text-xs">
                      <span className="font-semibold text-gray-600">Attendance Rate</span>
                      <span className={`font-bold ${attendanceRate >= 75 ? 'text-green-600' : 'text-red-600'}`}>{attendanceRate}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className={`h-2 rounded-full transition-all ${attendanceRate >= 75 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${attendanceRate}%` }} />
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0">{stats.present + stats.late} / {students.length} present</span>
                </div>
              )}

              {/* Student table */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#2D1B4D] text-white">
                        <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest w-10">#</th>
                        <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest">Student</th>
                        <th className="text-center px-5 py-3 text-[10px] font-bold uppercase tracking-widest min-w-[200px]">Status</th>
                        <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest min-w-[150px]">Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {students.map((s, i) => {
                        const status = draftAttendance[s.student]?.status;
                        const savedStatus = savedAttendance[s.student]?.status;
                        const changed = status !== savedStatus;
                        const rowBg = status === 'absent' ? 'bg-red-50/40'
                          : status === 'late' ? 'bg-yellow-50/40'
                          : status === 'excused' ? 'bg-blue-50/40'
                          : status === 'present' ? 'bg-green-50/20'
                          : i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30';
                        return (
                          <tr key={s.student} className={`transition-colors ${rowBg}`}>
                            <td className="px-5 py-3.5 text-xs font-bold text-gray-400">{i + 1}</td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs flex-shrink-0 shadow-sm transition-transform hover:scale-110">
                                  {s.student_name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-[140px]">
                                  <div className="font-bold text-gray-800 text-sm flex items-center gap-1.5 leading-tight">
                                    <button 
                                      onClick={() => navigate(`/profile?student_id=${s.student}`)}
                                      className="hover:text-purple-600 transition-colors"
                                      title="View Profile"
                                    >
                                      {s.student_name}
                                    </button>
                                    {changed && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block shadow-sm" title="Unsaved change" />}
                                  </div>
                                  <div className="text-[10px] text-gray-400 font-medium">{s.student_email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center justify-center gap-2">
                                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                  <button key={key} onClick={() => markDraft(s.student, key)} title={cfg.label}
                                    className={`w-10 h-10 md:w-9 md:h-9 rounded-xl border-2 font-black text-[10px] transition-all active:scale-90 shadow-sm ${status === key ? cfg.active : cfg.inactive}`}>
                                    {cfg.short}
                                  </button>
                                ))}
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <input type="text" placeholder="Add note..."
                                value={draftRemarks[s.student] || ''}
                                onChange={e => setDraftRemarks(prev => ({ ...prev, [s.student]: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white/50 focus:bg-white transition-all shadow-sm" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Save bar */}
                <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex flex-wrap gap-x-4 gap-y-1">
                    <span>P: Present</span>
                    <span>A: Absent</span>
                    <span>L: Late</span>
                    <span>E: Excused</span>
                    {hasChanges && <span className="text-amber-600 animate-pulse">● Unsaved changes</span>}
                  </div>
                  <button onClick={saveAttendance} disabled={submitting || !hasChanges}
                    className={`flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 w-full md:w-auto ${
                      hasChanges
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                    } disabled:opacity-60`}>
                    {submitting ? (
                      <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>Saving...</>
                    ) : (
                      <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                      </svg>{hasChanges ? 'Save Attendance' : 'All Changes Saved'}</>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ── HISTORY VIEW ── */}
      {view === 'history' && (
        <>
          {!selectedClassroom ? (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-16 text-center text-gray-400">Select a classroom to view history.</div>
          ) : loadingHistory ? (
            <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" /></div>
          ) : history.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-16 text-center text-gray-400">No attendance records found.</div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#2D1B4D] to-[#4B2D7F] text-white">
                      <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider">Date</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider">Student</th>
                      <th className="text-center px-6 py-3 text-xs font-semibold uppercase tracking-wider">Status</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider">Marked By</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider">Remarks</th>
                      <th className="text-center px-6 py-3 text-xs font-semibold uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {history.map((r, idx) => {
                      const cfg = STATUS_CONFIG[r.status];
                      return (
                        <tr key={r.id} className={`hover:bg-purple-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                          <td className="px-6 py-3 text-sm font-medium text-gray-800">{new Date(r.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</td>
                          <td className="px-6 py-3">
                            <button 
                              onClick={() => navigate(`/profile?student_id=${r.student}`)}
                              className="text-sm font-semibold text-gray-800 hover:text-purple-600 transition-colors text-left"
                              title="View Profile"
                            >
                              {r.student_name}
                            </button>
                            <div className="text-xs text-gray-400">{r.student_email}</div>
                          </td>
                          <td className="px-6 py-3 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cfg?.active || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                              {cfg?.label || r.status}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-500">{r.marked_by_name || '—'}</td>
                          <td className="px-6 py-3 text-sm text-gray-500">{r.remarks || '—'}</td>
                          <td className="px-6 py-3 text-center">
                            <button onClick={() => deleteAttendance(r)}
                              className="px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors">
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-2.5 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
                {history.length} record{history.length !== 1 ? 's' : ''} found
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Attendance;
