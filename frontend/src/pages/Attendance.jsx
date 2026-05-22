import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import { getUser } from '../utils/auth';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

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
  const location = useLocation();
  const isStudent = user?.role === 'student';

  // Teacher/admin state
  const [classrooms, setClassrooms]             = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState(location.state?.classroomId || '');
  const [selectedDate, setSelectedDate]         = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents]                 = useState([]);
  const [savedAttendance, setSavedAttendance]   = useState({}); // { studentId: { id, status } }
  const [savedRemarks, setSavedRemarks]         = useState({}); // { studentId: remarks }
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
  const [analytics, setAnalytics]     = useState(null);
  const [historyDate, setHistoryDate] = useState(new Date().toISOString().split('T')[0]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => {
    if (!isStudent) {
      api.get('/classrooms/').then(r => setClassrooms(r.data)).catch(() => toast.error('Failed to load classrooms'));
    } else {
      api.get('/attendance/').then(r => setMyAttendance(r.data)).catch(() => toast.error('Failed to load attendance'));
    }
  }, [isStudent]);

  const fetchAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    try {
      const params = {};
      if (selectedClassroom) params.classroom = selectedClassroom;
      const res = await api.get('/attendance/summary/', { params });
      setAnalytics(res.data);
    } catch { toast.error('Failed to load analytics'); }
    finally { setLoadingAnalytics(false); }
  }, [selectedClassroom]);

  useEffect(() => {
    if (view === 'analytics') fetchAnalytics();
  }, [view, fetchAnalytics]);

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
    draftAttendance[s.student]?.status !== savedAttendance[s.student]?.status ||
    (draftRemarks[s.student] || '') !== (savedRemarks[s.student] || '')
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
      <div className="p-2 md:p-6 max-w-full overflow-x-hidden">
        <div className="mb-3 md:mb-6">
          <h1 className="text-xl md:text-3xl font-black text-gray-800 tracking-tight uppercase">My Attendance</h1>
          <p className="text-gray-500 text-[9px] md:text-sm font-medium mt-0.5 uppercase tracking-widest">Attendance record by month</p>
        </div>
        <div className="flex items-center gap-2 mb-4">
          <label className="text-[10px] md:text-sm font-bold text-gray-400 uppercase tracking-widest">Month</label>
          <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
            className="px-2 py-1 md:px-3 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-[10px] md:text-sm font-bold shadow-sm" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3 mb-4">
          {STAT_CONFIG.filter(s => s.key !== 'unmarked').map(s => (
            <div key={s.key} className={`border rounded-xl p-2 md:p-4 text-center ${s.bg} shadow-sm`}>
              <div className={`text-xl md:text-3xl font-black ${s.color}`}>{myStats[s.key] || 0}</div>
              <div className={`text-[8px] md:text-sm font-bold mt-0.5 md:mt-1 ${s.color} opacity-80 uppercase tracking-tighter md:tracking-normal`}>{s.label}</div>
            </div>
          ))}
        </div>
        {attRate !== null && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3 md:p-4 mb-4">
            <div className="flex items-center justify-between mb-1.5 md:mb-2">
              <span className="text-[10px] md:text-sm font-bold text-gray-600 uppercase tracking-widest">Monthly Rate</span>
              <span className={`text-[10px] md:text-sm font-black ${attRate >= 75 ? 'text-green-600' : 'text-red-600'}`}>{attRate}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 md:h-3">
              <div className={`h-1.5 md:h-3 rounded-full transition-all ${attRate >= 75 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${attRate}%` }} />
            </div>
            {attRate < 75 && <p className="text-[8px] md:text-xs text-red-500 mt-1.5 md:mt-2 font-black uppercase tracking-widest">⚠️ Attendance below 75%</p>}
          </div>
        )}
        <div className="bg-white border border-gray-200 rounded-lg md:rounded-xl shadow-sm overflow-hidden min-w-0">
          {filteredMyAttendance.length === 0 ? (
            <div className="text-center py-10 md:py-12 text-gray-400 font-bold text-[10px] md:text-sm uppercase tracking-widest">No records found.</div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 max-w-full">
              <table className="w-full text-[9px] md:text-sm text-left min-w-[450px] md:min-w-full">
                <thead className="bg-[#2D1B4D] text-white">
                  <tr>
                    <th className="px-3 py-2 md:px-6 md:py-3 font-bold uppercase tracking-widest text-[8px] md:text-xs">Date</th>
                    <th className="px-3 py-2 md:px-6 md:py-3 font-bold uppercase tracking-widest text-[8px] md:text-xs">Day</th>
                    <th className="px-3 py-2 md:px-6 md:py-3 font-bold uppercase tracking-widest text-[8px] md:text-xs">Classroom</th>
                    <th className="text-center px-3 py-2 md:px-6 md:py-3 font-bold uppercase tracking-widest text-[8px] md:text-xs">Status</th>
                    <th className="hidden md:table-cell px-3 py-2 md:px-6 md:py-3 font-bold uppercase tracking-widest text-[8px] md:text-xs">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredMyAttendance.map((r, idx) => {
                    const cfg = STATUS_CONFIG[r.status];
                    const date = new Date(r.date + 'T00:00:00');
                    return (
                      <tr key={r.id} className={`hover:bg-purple-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <td className="px-3 py-2 md:px-6 md:py-3 font-bold text-gray-700">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                        <td className="px-3 py-2 md:px-6 md:py-3 font-medium text-gray-400 uppercase text-[8px] md:text-xs tracking-tighter">{date.toLocaleDateString('en-US', { weekday: 'long' })}</td>
                        <td className="px-3 py-2 md:px-6 md:py-3 font-bold text-gray-600 truncate max-w-[80px] md:max-w-none">{r.classroom_name}</td>
                        <td className="px-3 py-2 md:px-6 md:py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[7px] md:text-xs font-black uppercase tracking-widest border ${cfg?.active || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                            {cfg?.label || r.status}
                          </span>
                        </td>
                        <td className="hidden md:table-cell px-3 py-2 md:px-6 md:py-3 font-medium text-gray-400 truncate max-w-[100px] md:max-w-none">{r.remarks || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {total > 0 && <p className="text-[8px] md:text-sm text-gray-400 mt-2 font-bold uppercase tracking-widest">{total} records in {new Date(filterMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>}
      </div>
    );
  }

  // ── TEACHER / ADMIN VIEW ──────────────────────────────────────
  return (
    <div className="p-2 md:p-6 scrollbar-thin scrollbar-thumb-gray-300 max-w-full overflow-x-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
        <div className="text-center lg:text-left min-w-0">
          <h1 className="text-xl md:text-3xl font-black text-gray-800 tracking-tight uppercase truncate">Attendance Tracker</h1>
          <p className="text-[9px] md:text-sm text-gray-500 font-medium mt-0.5 uppercase tracking-widest truncate">
            {view === 'mark'
              ? `Marking: ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
              : 'Attendance History'}
          </p>
        </div>
        <div className="flex rounded-lg md:rounded-xl border border-gray-300 overflow-hidden text-[10px] md:text-sm shadow-sm w-full lg:w-auto shrink-0">
          {[
            { key: 'mark', label: '✏️ MARK' }, 
            { key: 'history', label: '📋 HISTORY' },
            { key: 'analytics', label: '📊 ANALYTICS' }
          ].map(v => (
            <button key={v.key} onClick={() => setView(v.key)}
              className={`flex-1 lg:px-6 py-2 md:py-2.5 font-black transition-all uppercase tracking-widest ${view === v.key ? 'bg-[#2D1B4D] text-white shadow-inner' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border border-gray-200 rounded-lg md:rounded-xl shadow-sm p-1.5 md:p-5 mb-2 md:mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5 md:gap-4">
          <div className="min-w-0">
            <label className="block text-[7px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Classroom</label>
            <select value={selectedClassroom} onChange={e => setSelectedClassroom(e.target.value)}
              className="w-full px-1.5 py-1 md:px-3 md:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 text-[9px] md:text-sm font-bold shadow-sm transition-all hover:border-purple-300 truncate">
              <option value="">Select classroom</option>
              {sortedClassrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="min-w-0">
            <label className="block text-[7px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Date</label>
            <div className="flex gap-1">
              <input type="date"
                value={view === 'mark' ? selectedDate : historyDate}
                onChange={e => view === 'mark' ? setSelectedDate(e.target.value) : setHistoryDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="flex-1 px-1.5 py-1 md:px-3 md:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 text-[9px] md:text-sm font-bold shadow-sm transition-all hover:border-purple-300" />
              {view === 'history' && historyDate && (
                <button onClick={() => setHistoryDate('')}
                  className="px-1.5 md:px-4 py-1 md:py-2.5 border border-gray-300 rounded-lg text-gray-500 hover:text-purple-600 font-black text-[9px] transition-all hover:bg-purple-50 uppercase tracking-tighter">All</button>
              )}
            </div>
          </div>
          {view === 'mark' && selectedClassroom && students.length > 0 && (
            <div className="min-w-0">
              <label className="block text-[7px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Quick Actions</label>
              <div className="flex gap-1">
                <button onClick={() => markAllDraft('present')}
                  className="flex-1 px-1.5 py-1 md:px-3 md:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[8px] md:text-[10px] font-black uppercase tracking-widest rounded-lg transition-all shadow-sm active:scale-95 whitespace-nowrap">✓ PRESENT</button>
                <button onClick={() => markAllDraft('absent')}
                  className="flex-1 px-1.5 py-1 md:px-3 md:py-2.5 bg-red-100 hover:bg-red-200 text-red-700 text-[8px] md:text-[10px] font-black uppercase tracking-widest rounded-lg transition-all shadow-sm active:scale-95 whitespace-nowrap">✗ ABSENT</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MARK VIEW ── */}
      {view === 'mark' && (
        <>
          {!selectedClassroom ? (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 md:p-16 text-center text-gray-400 font-bold text-[9px] md:text-sm uppercase tracking-widest">Select a classroom to start marking.</div>
          ) : loadingStudents ? (
            <div className="flex items-center justify-center h-32 md:h-48"><div className="animate-spin rounded-full h-6 w-6 md:h-10 md:w-10 border-b-2 border-purple-600" /></div>
          ) : students.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 md:p-16 text-center text-gray-400 font-bold text-[9px] md:text-sm uppercase tracking-widest">No students enrolled.</div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 md:gap-3 mb-2 md:mb-4">
                {STAT_CONFIG.map(s => (
                  <div key={s.key} className={`border rounded-lg md:rounded-xl p-1 md:p-3 text-center ${s.bg} shadow-sm`}>
                    <div className={`text-base md:text-2xl font-black ${s.color}`}>{stats[s.key] || 0}</div>
                    <div className={`text-[7px] md:text-xs font-bold mt-0 ${s.color} opacity-80 uppercase tracking-tighter`}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Rate bar */}
              {attendanceRate !== null && (
                <div className="mb-2 md:mb-4 bg-white border border-gray-200 rounded-lg md:rounded-xl shadow-sm p-1.5 md:p-4 flex items-center gap-2 md:gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between mb-0.5 text-[8px] md:text-xs">
                      <span className="font-black text-gray-600 uppercase tracking-widest">Rate</span>
                      <span className={`font-black ${attendanceRate >= 75 ? 'text-green-600' : 'text-red-600'}`}>{attendanceRate}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1 md:h-2">
                      <div className={`h-1 md:h-2 rounded-full transition-all ${attendanceRate >= 75 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${attendanceRate}%` }} />
                    </div>
                  </div>
                  <span className="text-[7px] md:text-xs font-bold text-gray-400 flex-shrink-0 uppercase tracking-tighter">{stats.present + stats.late}/{students.length}</span>
                </div>
              )}

              {/* Student table */}
              <div className="bg-white border border-gray-200 rounded-lg md:rounded-xl shadow-sm overflow-hidden min-w-0">
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 max-w-full">
                  <table className="w-full text-[8px] md:text-sm text-left min-w-[450px] md:min-w-full">
                    <thead>
                      <tr className="bg-[#2D1B4D] text-white">
                        <th className="px-2 py-1 md:px-5 md:py-3 text-[7px] md:text-[10px] font-black uppercase tracking-widest w-6 md:w-10">#</th>
                        <th className="px-2 py-1 md:px-5 md:py-3 text-[7px] md:text-[10px] font-black uppercase tracking-widest min-w-[100px]">Student</th>
                        <th className="text-center px-2 py-1 md:px-5 md:py-3 text-[7px] md:text-[10px] font-black uppercase tracking-widest min-w-[140px] md:min-w-[200px]">Status</th>
                        <th className="hidden md:table-cell px-2 py-1 md:px-5 md:py-3 text-[7px] md:text-[10px] font-black uppercase tracking-widest min-w-[100px] md:min-w-[150px]">Note</th>
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
                          <tr key={s.student} className={`transition-colors ${rowBg} group`}>
                            <td className="px-2 py-1.5 md:px-5 md:py-3.5 text-[7px] md:text-xs font-black text-gray-400">{i + 1}</td>
                            <td className="px-2 py-1.5 md:px-5 md:py-3.5">
                              <div className="flex items-center gap-1.5 md:gap-3">
                                <div className="w-5 h-5 md:w-9 md:h-9 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black text-[8px] md:text-xs flex-shrink-0 shadow-sm transition-transform group-hover:scale-110">
                                  {s.student_name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-black text-gray-800 text-[8px] md:text-sm flex items-center gap-0.5 leading-tight truncate uppercase tracking-tighter">
                                    <button 
                                      onClick={() => navigate(`/profile?student_id=${s.student}`)}
                                      className="hover:text-purple-600 transition-colors truncate"
                                      title="View Profile"
                                    >
                                      {s.student_name}
                                    </button>
                                    {changed && <span className="w-1 h-1 rounded-full bg-amber-500 shrink-0 shadow-sm animate-pulse" title="Unsaved change" />}
                                  </div>
                                  <div className="text-[6px] md:text-[10px] text-gray-400 font-bold truncate tracking-tight">{s.student_email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-2 py-1.5 md:px-5 md:py-3.5">
                              <div className="flex items-center justify-center gap-1 md:gap-2">
                                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                  <button key={key} onClick={() => markDraft(s.student, key)} title={cfg.label}
                                    className={`w-6 h-6 md:w-9 md:h-9 rounded md:rounded-xl border font-black text-[7px] md:text-[10px] transition-all active:scale-90 shadow-sm ${status === key ? cfg.active : cfg.inactive}`}>
                                    {cfg.short}
                                  </button>
                                ))}
                              </div>
                            </td>
                            <td className="hidden md:table-cell px-2 py-1.5 md:px-5 md:py-3.5">
                              <input type="text" placeholder="..."
                                value={draftRemarks[s.student] || ''}
                                onChange={e => setDraftRemarks(prev => ({ ...prev, [s.student]: e.target.value }))}
                                className="w-full px-1.5 py-1 md:px-3 md:py-2 border border-gray-200 rounded-md text-[7px] md:text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-purple-400 bg-white/50 focus:bg-white transition-all shadow-inner uppercase tracking-tighter" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Save bar */}
                <div className="px-2 py-2 md:px-5 md:py-4 bg-gray-50 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-3">
                  <div className="text-[6px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest flex flex-wrap gap-x-2 gap-y-0.5">
                    <span>P:PRESENT</span>
                    <span>A:ABSENT</span>
                    <span>L:LATE</span>
                    <span>E:EXCUSED</span>
                    {hasChanges && <span className="text-amber-600 animate-pulse">● UNSAVED</span>}
                  </div>
                  <button onClick={saveAttendance} disabled={submitting || !hasChanges}
                    className={`flex items-center justify-center gap-1 px-4 py-1.5 md:px-8 md:py-2.5 rounded-lg md:rounded-xl text-[9px] md:text-sm font-black transition-all shadow-md active:scale-95 w-full md:w-auto uppercase tracking-widest ${
                      hasChanges
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                    } disabled:opacity-60`}>
                    {submitting ? (
                      <><svg className="animate-spin h-2.5 w-2.5 md:h-4 md:w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>...</>
                    ) : (
                      <><svg className="w-2.5 h-2.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                      </svg>{hasChanges ? 'SAVE CHANGES' : 'ALL SAVED'}</>
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
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 md:p-16 text-center text-gray-400 font-bold text-[8px] md:text-sm uppercase tracking-widest">Select a classroom to view history.</div>
          ) : loadingHistory ? (
            <div className="flex items-center justify-center h-24 md:h-48"><div className="animate-spin rounded-full h-5 w-5 md:h-10 md:w-10 border-b-2 border-purple-600" /></div>
          ) : history.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 md:p-16 text-center text-gray-400 font-bold text-[8px] md:text-sm uppercase tracking-widest">No records found.</div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg md:rounded-xl shadow-sm overflow-hidden min-w-0">
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 max-w-full">
                <table className="w-full text-[7px] md:text-sm text-left min-w-[350px] md:min-w-full">
                  <thead>
                    <tr className="bg-[#2D1B4D] text-white">
                      <th className="px-1.5 py-1 md:px-6 md:py-3 text-[6px] md:text-[10px] font-black uppercase tracking-widest">Date</th>
                      <th className="px-1.5 py-1 md:px-6 md:py-3 text-[6px] md:text-[10px] font-black uppercase tracking-widest">Student</th>
                      <th className="text-center px-1.5 py-1 md:px-6 md:py-3 text-[6px] md:text-[10px] font-black uppercase tracking-widest">Status</th>
                      <th className="hidden md:table-cell px-2 py-1 md:px-6 md:py-3 text-[7px] md:text-[10px] font-black uppercase tracking-widest">By</th>
                      <th className="hidden md:table-cell px-2 py-1 md:px-6 md:py-3 text-[7px] md:text-[10px] font-black uppercase tracking-widest">Remarks</th>
                      <th className="text-center px-1.5 py-1 md:px-6 md:py-3 text-[6px] md:text-[10px] font-black uppercase tracking-widest">Opt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {history.map((r, idx) => {
                      const cfg = STATUS_CONFIG[r.status];
                      return (
                        <tr key={r.id} className={`hover:bg-purple-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} group`}>
                          <td className="px-1.5 py-1 md:px-6 md:py-3 font-bold text-gray-700 whitespace-nowrap">{new Date(r.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                          <td className="px-1.5 py-1 md:px-6 md:py-3">
                            <div className="min-w-0">
                              <button 
                                onClick={() => navigate(`/profile?student_id=${r.student}`)}
                                className="font-black text-gray-800 hover:text-purple-600 transition-colors text-left truncate uppercase tracking-tighter"
                                title="View Profile"
                              >
                                {r.student_name}
                              </button>
                              <div className="text-[5px] md:text-xs text-gray-400 font-bold truncate">{r.student_email}</div>
                            </div>
                          </td>
                          <td className="px-1.5 py-1 md:px-6 md:py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-1 py-0 rounded-full text-[5px] md:text-xs font-black uppercase tracking-widest border ${cfg?.active || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                              {cfg?.short || r.status}
                            </span>
                          </td>
                          <td className="hidden md:table-cell px-2 py-1.5 md:px-6 md:py-3 font-bold text-gray-400 uppercase text-[7px] md:text-sm truncate max-w-[50px] md:max-w-none">{r.marked_by_name || '—'}</td>
                          <td className="hidden md:table-cell px-2 py-1.5 md:px-6 md:py-3 font-medium text-gray-500 truncate max-w-[60px] md:max-w-none">{r.remarks || '—'}</td>
                          <td className="px-1.5 py-1 md:px-6 md:py-3 text-center">
                            <button onClick={() => deleteAttendance(r)}
                              className="p-0.5 md:p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded transition-all md:opacity-0 md:group-hover:opacity-100">
                              <svg className="w-2 h-2 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-1.5 py-0.5 md:px-6 md:py-2.5 bg-gray-50 border-t border-gray-100 text-[5px] md:text-xs font-black text-gray-400 uppercase tracking-widest">
                {history.length} records found
              </div>
            </div>
          ) }
        </>
      )}

      {/* ── ANALYTICS VIEW ── */}
      {view === 'analytics' && (
        <div className="space-y-4 animate-fade-in max-w-full overflow-hidden">
          {loadingAnalytics ? (
            <div className="flex items-center justify-center h-48">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Synthesizing Data...</span>
              </div>
            </div>
          ) : !analytics ? (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-16 text-center text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">Failed to load analytics engine.</div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Daily Trends Chart */}
                <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Presence Trends</h3>
                      <p className="text-sm font-black text-slate-900 uppercase tracking-tight">30-Day Activity Monitor</p>
                    </div>
                    <div className="flex gap-1.5">
                      <div className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded text-[7px] font-black text-emerald-600 uppercase tracking-widest">Live</div>
                    </div>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.daily_trends}>
                        <defs>
                          <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="date" 
                          tick={{fontSize: 8, fontWeight: 900, fill: '#64748b'}} 
                          axisLine={false} 
                          tickLine={false} 
                          tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 
                        />
                        <YAxis tick={{fontSize: 8, fontWeight: 900, fill: '#64748b'}} axisLine={false} tickLine={false} />
                        <Tooltip content={<AnalyticsTooltip />} cursor={{stroke: '#cbd5e1', strokeWidth: 1}} />
                        <Area type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorPresent)" name="Present" />
                        <Area type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorLate)" name="Late" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Section Rankings */}
                {user.role === 'admin' && (
                  <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm overflow-hidden flex flex-col">
                    <div className="mb-6">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Rankings</h3>
                      <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Section Performance Index</p>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                      {analytics.section_rankings?.map((rank, idx) => (
                        <div key={rank.id} className="group flex items-center justify-between p-2.5 bg-slate-50/50 rounded-lg border border-slate-100 hover:border-indigo-200 hover:bg-white transition-all">
                          <div className="flex items-center gap-3">
                            <span className={`w-5 h-5 flex items-center justify-center rounded-md font-black text-[9px] ${
                              idx === 0 ? 'bg-amber-100 text-amber-600 shadow-sm' : 
                              idx === 1 ? 'bg-slate-200 text-slate-600' : 
                              idx === 2 ? 'bg-orange-100 text-orange-600' : 
                              'bg-slate-100 text-slate-400'
                            }`}>
                              {idx + 1}
                            </span>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight leading-none mb-1">{rank.name}</span>
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">{rank.total_records} records</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-xs font-black leading-none mb-1 ${rank.rate >= 90 ? 'text-emerald-600' : rank.rate >= 75 ? 'text-blue-600' : 'text-rose-600'}`}>
                              {rank.rate}%
                            </div>
                            <div className="w-12 h-1 bg-slate-200 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${rank.rate >= 90 ? 'bg-emerald-500' : rank.rate >= 75 ? 'bg-blue-500' : 'bg-rose-500'}`} style={{ width: `${rank.rate}%` }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const AnalyticsTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg shadow-2xl backdrop-blur-md bg-opacity-95">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">{label}</p>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{entry.name}</span>
              </div>
              <span className="text-[10px] font-black text-white">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};


export default Attendance;
