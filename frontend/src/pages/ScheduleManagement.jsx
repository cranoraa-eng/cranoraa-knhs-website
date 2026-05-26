import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import Spinner from '../components/Spinner';
import { Modal } from '../components/ui/Modal';

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday'];
const DAY_FULL = { monday:'Monday', tuesday:'Tuesday', wednesday:'Wednesday', thursday:'Thursday', friday:'Friday', saturday:'Saturday' };
const DAY_SHORT = { monday:'Mon', tuesday:'Tue', wednesday:'Wed', thursday:'Thu', friday:'Fri', saturday:'Sat' };

const SUBJECT_COLORS = [
  'bg-violet-50 border-violet-200 text-violet-800',
  'bg-blue-50 border-blue-200 text-blue-800',
  'bg-emerald-50 border-emerald-200 text-emerald-800',
  'bg-amber-50 border-amber-200 text-amber-800',
  'bg-rose-50 border-rose-200 text-rose-800',
  'bg-indigo-50 border-indigo-200 text-indigo-800',
  'bg-teal-50 border-teal-200 text-teal-800',
  'bg-orange-50 border-orange-200 text-orange-800',
];

const emptyForm = {
  classroom: '', subject: '', teacher: '', room: '',
  time_slot: '', academic_year: '', semester: '', notes: '',
};

// ── Small reusable select ─────────────────────────────────────────────────────
const Field = ({ label, required, children }) => (
  <div className="space-y-1.5">
    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
      {label}{required && <span className="text-rose-400 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const Select = ({ value, onChange, children, required }) => (
  <select
    required={required}
    value={value}
    onChange={onChange}
    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all"
  >
    {children}
  </select>
);

export default function ScheduleManagement() {
  // ── Data ──────────────────────────────────────────────────────────────────
  const [schedules, setSchedules]       = useState([]);
  const [rooms, setRooms]               = useState([]);
  const [timeSlots, setTimeSlots]       = useState([]);
  const [classrooms, setClassrooms]     = useState([]);
  const [subjects, setSubjects]         = useState([]);
  const [teachers, setTeachers]         = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [semesters, setSemesters]       = useState([]);
  const [loading, setLoading]           = useState(true);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab]       = useState('grid');
  const [activeAY, setActiveAY]         = useState('');   // selected academic year filter
  const [filterDay, setFilterDay]       = useState('');
  const [filterClassroom, setFilterClassroom] = useState('');
  const [filterTeacher, setFilterTeacher]     = useState('');
  const [search, setSearch]             = useState('');
  const [conflicts, setConflicts]       = useState([]);
  const [showConflicts, setShowConflicts] = useState(false);

  // ── Modals ────────────────────────────────────────────────────────────────
  const [showForm, setShowForm]         = useState(false);
  const [editItem, setEditItem]         = useState(null);
  const [form, setForm]                 = useState(emptyForm);
  const [saving, setSaving]             = useState(false);
  const [showRoomPanel, setShowRoomPanel] = useState(false);
  const [showSlotPanel, setShowSlotPanel] = useState(false);
  const [roomForm, setRoomForm]         = useState({ name:'', building:'', capacity:40, room_type:'classroom' });
  const [slotForm, setSlotForm]         = useState({ day:'monday', start_time:'07:00', end_time:'08:00', label:'' });
  const [savingRoom, setSavingRoom]     = useState(false);
  const [savingSlot, setSavingSlot]     = useState(false);
  const [slotFilterDay, setSlotFilterDay] = useState(''); // Added for time slot filtering

  // Classroom → subject/teacher assignments (from ClassroomSubject)
  const [classroomAssignments, setClassroomAssignments] = useState([]); // [{subject, subject_name, subject_code, teacher, teacher_name}]
  const [loadingAssignments, setLoadingAssignments]     = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [schR, roomR, slotR, clsR, subR, tchR, ayR] = await Promise.all([
        api.get('/schedules/'),
        api.get('/rooms/'),
        api.get('/time-slots/'),
        api.get('/classrooms/'),
        api.get('/subjects/'),
        api.get('/users/?role=teacher'),
        api.get('/admin/academic-years/'),
      ]);
      setSchedules(schR.data.results || schR.data);
      setRooms(roomR.data.results || roomR.data);
      setTimeSlots(slotR.data.results || slotR.data);
      setClassrooms(clsR.data.results || clsR.data);
      setSubjects(subR.data.results || subR.data);
      setTeachers(tchR.data.results || tchR.data);
      const ays = ayR.data.results || ayR.data;
      setAcademicYears(ays);
      const active = ays.find(a => a.is_active);
      if (active && !activeAY) setActiveAY(String(active.id));
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  }, []); // eslint-disable-line

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (form.academic_year) {
      api.get(`/admin/semesters/?academic_year=${form.academic_year}`)
        .then(r => setSemesters(r.data.results || r.data))
        .catch(() => {});
    }
  }, [form.academic_year]);

  // When classroom changes in the form, fetch its assigned subjects + teachers
  useEffect(() => {
    if (!form.classroom) {
      setClassroomAssignments([]);
      return;
    }
    setLoadingAssignments(true);
    api.get(`/classroom-subjects/by_classroom/?classroom_id=${form.classroom}`)
      .then(r => {
        const data = r.data.results || r.data;
        setClassroomAssignments(data);
        // If current subject/teacher is no longer valid for this classroom, clear them
        setForm(f => {
          const validSubjectIds = data.map(a => String(a.subject));
          const newSubject = validSubjectIds.includes(String(f.subject)) ? f.subject : '';
          // Auto-fill teacher if only one assignment matches the selected subject
          const match = data.find(a => String(a.subject) === String(newSubject));
          const newTeacher = match ? String(match.teacher) : (validSubjectIds.length === 0 ? f.teacher : '');
          return { ...f, subject: newSubject, teacher: newTeacher };
        });
      })
      .catch(() => setClassroomAssignments([]))
      .finally(() => setLoadingAssignments(false));
  }, [form.classroom]);

  // ── Subject → color mapping (stable per subject id) ───────────────────────
  const subjectColorMap = useMemo(() => {
    const map = {};
    subjects.forEach((s, i) => { map[s.id] = SUBJECT_COLORS[i % SUBJECT_COLORS.length]; });
    return map;
  }, [subjects]);

  // ── Filtered schedules ────────────────────────────────────────────────────
  const filtered = useMemo(() => schedules.filter(s => {
    if (activeAY && String(s.academic_year) !== activeAY) return false;
    if (filterDay && s.time_slot_detail?.day !== filterDay) return false;
    if (filterClassroom && String(s.classroom) !== filterClassroom) return false;
    if (filterTeacher && String(s.teacher) !== filterTeacher) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        s.subject_name?.toLowerCase().includes(q) ||
        s.subject_code?.toLowerCase().includes(q) ||
        s.classroom_name?.toLowerCase().includes(q) ||
        s.teacher_name?.toLowerCase().includes(q) ||
        s.room_name?.toLowerCase().includes(q)
      );
    }
    return true;
  }), [schedules, activeAY, filterDay, filterClassroom, filterTeacher, search]);

  // ── Grid data ─────────────────────────────────────────────────────────────
  const gridData = useMemo(() => {
    const g = {};
    DAYS.forEach(d => { g[d] = {}; });
    filtered.forEach(s => {
      const d = s.time_slot_detail?.day;
      const sid = s.time_slot;
      if (d && sid) {
        if (!g[d][sid]) g[d][sid] = [];
        g[d][sid].push(s);
      }
    });
    return g;
  }, [filtered]);

  const sortedSlots = useMemo(() =>
    [...timeSlots].sort((a, b) => a.start_time.localeCompare(b.start_time)),
  [timeSlots]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const openCreate = useCallback((slotId = '', day = '') => {
    const ay = academicYears.find(a => a.is_active);
    setEditItem(null);
    setForm({ ...emptyForm, time_slot: slotId, academic_year: ay ? String(ay.id) : '' });
    setShowForm(true);
  }, [academicYears]);

  const openEdit = useCallback((s) => {
    setEditItem(s);
    setForm({
      classroom: String(s.classroom), subject: String(s.subject),
      teacher: String(s.teacher), room: s.room ? String(s.room) : '',
      time_slot: String(s.time_slot), academic_year: String(s.academic_year),
      semester: s.semester ? String(s.semester) : '', notes: s.notes || '',
    });
    setShowForm(true);
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.room) delete payload.room;
      if (!payload.semester) delete payload.semester;
      if (editItem) {
        await api.patch(`/schedules/${editItem.id}/`, payload);
        toast.success('Schedule updated');
      } else {
        await api.post('/schedules/', payload);
        toast.success('Schedule added');
      }
      setShowForm(false);
      fetchAll();
    } catch (err) {
      const d = err.response?.data;
      const msg = d?.non_field_errors?.[0] || d?.detail || Object.values(d || {})[0]?.[0] || 'Failed to save';
      toast.error(msg);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name = '') => {
    const result = await Swal.fire({
      title: 'Delete schedule?',
      text: name || 'This cannot be undone.',
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#ef4444', confirmButtonText: 'Delete',
      customClass: { popup: 'rounded-2xl' },
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/schedules/${id}/`);
      toast.success('Deleted');
      fetchAll();
    } catch { toast.error('Failed to delete'); }
  };

  const checkConflicts = async () => {
    const ay = academicYears.find(a => String(a.id) === activeAY || a.is_active);
    if (!ay) { toast.error('Select an academic year first'); return; }
    try {
      const r = await api.get(`/schedules/conflict_check/?academic_year=${ay.id}`);
      setConflicts(r.data.conflicts || []);
      setShowConflicts(true);
      if (r.data.total === 0) toast.success('No conflicts found!');
      else toast.error(`${r.data.total} conflict(s) detected`);
    } catch { toast.error('Conflict check failed'); }
  };

  const saveRoom = async (e) => {
    e.preventDefault(); setSavingRoom(true);
    try {
      await api.post('/rooms/', roomForm);
      toast.success('Room added');
      setRoomForm({ name:'', building:'', capacity:40, room_type:'classroom' });
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.name?.[0] || 'Failed to add room');
    } finally { setSavingRoom(false); }
  };

  const deleteRoom = async (id, name) => {
    const r = await Swal.fire({ title: `Delete "${name}"?`, text: 'Schedules using this room will lose their room assignment.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Delete', customClass: { popup: 'rounded-2xl' } });
    if (!r.isConfirmed) return;
    try { await api.delete(`/rooms/${id}/`); toast.success('Room deleted'); fetchAll(); }
    catch { toast.error('Failed to delete room'); }
  };

  const saveSlot = async (e) => {
    e.preventDefault(); setSavingSlot(true);
    try {
      await api.post('/time-slots/', slotForm);
      toast.success('Time slot added');
      setSlotForm({ day:'monday', start_time:'07:00', end_time:'08:00', label:'' });
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.non_field_errors?.[0] || 'Failed to add time slot');
    } finally { setSavingSlot(false); }
  };

  const deleteSlot = async (id, label) => {
    const r = await Swal.fire({ title: `Delete "${label}"?`, text: 'Schedules using this slot will be affected.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Delete', customClass: { popup: 'rounded-2xl' } });
    if (!r.isConfirmed) return;
    try { await api.delete(`/time-slots/${id}/`); toast.success('Time slot deleted'); fetchAll(); }
    catch { toast.error('Failed to delete time slot'); }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: filtered.length,
    classrooms: new Set(filtered.map(s => s.classroom)).size,
    teachers: new Set(filtered.map(s => s.teacher)).size,
    rooms: filtered.filter(s => s.room).length,
  }), [filtered]);

  if (loading) return <Spinner />;

  // ── Setup wizard: show if no time slots or no classrooms yet ─────────────
  const needsSetup = timeSlots.length === 0 || classrooms.length === 0;

  return (
    <div className="space-y-5 page-bottom-safe">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Schedule Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">Build and manage class timetables for all sections</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowSlotPanel(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Time Slots
          </button>
          <button onClick={() => setShowRoomPanel(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            Rooms
          </button>
          <button onClick={checkConflicts}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 font-bold text-xs uppercase tracking-widest hover:bg-amber-100 transition-all">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Check Conflicts
          </button>
          <button onClick={() => openCreate()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-violet-700 shadow-sm transition-all">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            Add Schedule
          </button>
        </div>
      </div>

      {/* ── Setup wizard banner ── */}
      {needsSetup && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-blue-800">Complete setup before adding schedules</p>
              <p className="text-xs text-blue-600 mt-0.5">You need at least one time slot and one classroom to create a schedule.</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {timeSlots.length === 0 && (
                  <button onClick={() => setShowSlotPanel(true)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all">
                    + Add Time Slots
                  </button>
                )}
                {classrooms.length === 0 && (
                  <span className="px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold">
                    ⚠ No classrooms found — create classrooms in Class Management first
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'Time Slots', count: timeSlots.length, done: timeSlots.length > 0, action: () => setShowSlotPanel(true) },
              { label: 'Rooms', count: rooms.length, done: rooms.length > 0, action: () => setShowRoomPanel(true) },
              { label: 'Classrooms', count: classrooms.length, done: classrooms.length > 0, action: null },
            ].map(step => (
              <div key={step.label} className={`flex items-center gap-2 p-3 rounded-xl border ${step.done ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${step.done ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                  {step.done
                    ? <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    : <span className="text-[9px] font-black text-slate-500">{step.count}</span>}
                </div>
                <div className="min-w-0">
                  <p className={`text-[10px] font-black uppercase tracking-widest ${step.done ? 'text-emerald-700' : 'text-slate-500'}`}>{step.label}</p>
                  <p className="text-[9px] text-slate-400">{step.count} added</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Conflicts banner ── */}
      {showConflicts && conflicts.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="font-bold text-rose-700 text-sm">⚠️ {conflicts.length} Conflict{conflicts.length > 1 ? 's' : ''} Detected</p>
            <button onClick={() => setShowConflicts(false)} className="text-rose-400 hover:text-rose-600 text-xs font-bold">Dismiss</button>
          </div>
          <div className="space-y-1">
            {conflicts.map((c, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-rose-400 text-xs mt-0.5">•</span>
                <p className="text-xs text-rose-600">{c.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {showConflicts && conflicts.length === 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <p className="text-sm font-bold text-emerald-700">No scheduling conflicts found.</p>
          <button onClick={() => setShowConflicts(false)} className="ml-auto text-emerald-500 hover:text-emerald-700 text-xs font-bold">Dismiss</button>
        </div>
      )}

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Classes', value: stats.total, color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Sections', value: stats.classrooms, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Teachers', value: stats.teachers, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'With Room', value: stats.rooms, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
              <span className={`text-lg font-black ${s.color}`}>{s.value}</span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search subject, teacher, room…"
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:bg-white transition-all" />
        </div>
        {/* Academic Year */}
        <select value={activeAY} onChange={e => setActiveAY(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-violet-300">
          <option value="">All Years</option>
          {academicYears.map(a => <option key={a.id} value={String(a.id)}>{a.name}{a.is_active ? ' ★' : ''}</option>)}
        </select>
        {/* Day */}
        <select value={filterDay} onChange={e => setFilterDay(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-violet-300">
          <option value="">All Days</option>
          {DAYS.map(d => <option key={d} value={d}>{DAY_FULL[d]}</option>)}
        </select>
        {/* Classroom */}
        <select value={filterClassroom} onChange={e => setFilterClassroom(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-violet-300">
          <option value="">All Sections</option>
          {classrooms.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
        </select>
        {/* Teacher */}
        <select value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-violet-300">
          <option value="">All Teachers</option>
          {teachers.map(t => <option key={t.id} value={String(t.id)}>{t.full_name || `${t.first_name} ${t.last_name}`}</option>)}
        </select>
        {/* Clear filters */}
        {(search || filterDay || filterClassroom || filterTeacher) && (
          <button onClick={() => { setSearch(''); setFilterDay(''); setFilterClassroom(''); setFilterTeacher(''); }}
            className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all">
            Clear ✕
          </button>
        )}
      </div>

      {/* ── View tabs ── */}
      <div className="flex gap-1 bg-slate-100 rounded-2xl p-1 w-fit">
        {[
          { id: 'grid', label: 'Timetable Grid', icon: 'M3 10h18M3 14h18M10 3v18M14 3v18' },
          { id: 'list', label: 'List View', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === t.id ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} /></svg>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TIMETABLE GRID ── */}
      {activeTab === 'grid' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {sortedSlots.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="text-slate-500 font-bold text-sm">No time slots yet</p>
              <p className="text-slate-400 text-xs mt-1">Add time slots to build the timetable grid</p>
              <button onClick={() => setShowSlotPanel(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition-all">
                + Add Time Slots
              </button>
            </div>
          ) : (
            <>
              {/* ── MOBILE: day-by-day card stack (hidden on md+) ── */}
              <div className="md:hidden">
                {/* Day selector tabs */}
                <div className="flex overflow-x-auto scrollbar-none border-b border-slate-100 bg-slate-50">
                  {DAYS.map(d => {
                    const hasEntries = sortedSlots.some(slot => (gridData[d]?.[slot.id] || []).length > 0);
                    return (
                      <button
                        key={d}
                        onClick={() => setFilterDay(filterDay === d ? '' : d)}
                        className={`flex-shrink-0 px-4 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all relative ${
                          filterDay === d
                            ? 'border-violet-600 text-violet-600 bg-white'
                            : 'border-transparent text-slate-400'
                        }`}
                      >
                        {DAY_SHORT[d]}
                        {hasEntries && (
                          <span className="absolute top-2 right-1.5 w-1.5 h-1.5 rounded-full bg-violet-400" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Cards for the selected day (or all days if none selected) */}
                <div className="p-3 space-y-3">
                  {(filterDay ? [filterDay] : DAYS).map(d => {
                    const daySlots = sortedSlots.filter(slot => (gridData[d]?.[slot.id] || []).length > 0);
                    if (daySlots.length === 0 && filterDay) {
                      return (
                        <div key={d} className="py-10 text-center">
                          <p className="text-slate-400 text-sm font-bold">No classes on {DAY_FULL[d]}</p>
                          <button onClick={() => openCreate('')}
                            className="mt-3 px-4 py-2 rounded-xl bg-violet-50 text-violet-600 text-xs font-bold border border-violet-200 hover:bg-violet-100 transition-all">
                            + Add Class
                          </button>
                        </div>
                      );
                    }
                    if (daySlots.length === 0) return null;
                    return (
                      <div key={d}>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{DAY_FULL[d]}</p>
                        <div className="space-y-2">
                          {daySlots.map(slot => {
                            const entries = gridData[d][slot.id] || [];
                            return entries.map(s => (
                              <div key={s.id}
                                className={`flex gap-3 p-3 rounded-2xl border ${subjectColorMap[s.subject] || SUBJECT_COLORS[0]} shadow-sm`}>
                                {/* Time */}
                                <div className="text-center min-w-[52px] flex-shrink-0">
                                  <p className="text-xs font-black leading-none">{slot.start_time?.slice(0,5)}</p>
                                  <p className="text-[9px] opacity-60 mt-0.5">{slot.end_time?.slice(0,5)}</p>
                                  {slot.label && (
                                    <span className="mt-1 inline-block text-[8px] font-black opacity-70 uppercase">{slot.label}</span>
                                  )}
                                </div>
                                {/* Divider */}
                                <div className="w-px bg-current opacity-20 self-stretch" />
                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-[10px] font-black uppercase tracking-tight opacity-70 leading-none mb-0.5">{s.subject_code}</p>
                                  <p className="text-sm font-bold leading-tight truncate">{s.subject_name}</p>
                                  <p className="text-[10px] opacity-70 mt-1 truncate">{s.classroom_name}</p>
                                  {s.room_name && (
                                    <p className="text-[9px] opacity-60 mt-0.5 flex items-center gap-0.5">
                                      <svg className="w-2.5 h-2.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                                      {s.room_name}
                                    </p>
                                  )}
                                </div>
                                {/* Actions */}
                                <div className="flex flex-col gap-1 flex-shrink-0">
                                  <button onClick={() => openEdit(s)}
                                    className="w-8 h-8 rounded-xl bg-white/60 flex items-center justify-center hover:bg-white transition-all active:scale-90"
                                    title="Edit">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                  </button>
                                  <button onClick={() => handleDelete(s.id, `${s.subject_name} — ${s.classroom_name}`)}
                                    className="w-8 h-8 rounded-xl bg-rose-500 flex items-center justify-center hover:bg-rose-600 transition-all active:scale-90"
                                    title="Delete">
                                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                                </div>
                              </div>
                            ));
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* Add button */}
                  <button onClick={() => openCreate('')}
                    className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 flex items-center justify-center gap-2 hover:border-violet-300 hover:text-violet-500 hover:bg-violet-50/30 transition-all text-xs font-bold">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                    Add Schedule
                  </button>
                </div>
              </div>

              {/* ── DESKTOP: full 7-column grid (hidden on mobile) ── */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-separate border-spacing-0" style={{ minWidth: 700 }}>
                  <thead>
                    <tr className="bg-gradient-to-r from-[#1A0B2E] to-[#2D1452]">
                      <th className="px-4 py-3 text-left w-28">
                        <span className="text-[10px] font-black text-violet-300 uppercase tracking-widest">Time</span>
                      </th>
                      {DAYS.map(d => (
                        <th key={d} className="px-3 py-3 text-left">
                          <span className="text-[10px] font-black text-violet-200 uppercase tracking-widest">{DAY_FULL[d]}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedSlots.map((slot, rowIdx) => (
                      <tr key={slot.id} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                        <td className="px-4 py-3 border-r border-slate-100 align-top">
                          <p className="text-xs font-black text-slate-800">{slot.start_time?.slice(0,5)}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{slot.end_time?.slice(0,5)}</p>
                          {slot.label && (
                            <span className="mt-1 inline-block px-1.5 py-0.5 rounded-md bg-violet-100 text-violet-600 text-[9px] font-black uppercase tracking-widest">
                              {slot.label}
                            </span>
                          )}
                        </td>
                        {DAYS.map(d => {
                          const entries = gridData[d]?.[slot.id] || [];
                          return (
                            <td key={d} className="px-2 py-2 align-top border-r border-slate-100 min-w-[130px] group/cell">
                              {entries.map(s => (
                                <div key={s.id}
                                  className={`mb-1.5 p-2.5 rounded-xl border ${subjectColorMap[s.subject] || SUBJECT_COLORS[0]} relative group shadow-sm hover:shadow-md transition-all`}>
                                  <p className="text-[10px] font-black uppercase tracking-tight leading-none mb-1">{s.subject_code}</p>
                                  <p className="text-[11px] font-bold leading-tight line-clamp-1">{s.subject_name}</p>
                                  <p className="text-[9px] opacity-70 mt-1 truncate">{s.classroom_name}</p>
                                  {s.teacher_name && <p className="text-[9px] opacity-60 truncate">{s.teacher_name}</p>}
                                  {s.room_name && (
                                    <p className="text-[9px] opacity-60 mt-0.5 flex items-center gap-0.5">
                                      <svg className="w-2.5 h-2.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                                      {s.room_name}
                                    </p>
                                  )}
                                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEdit(s)}
                                      className="w-5 h-5 rounded-md bg-white/80 flex items-center justify-center hover:bg-white shadow-sm" title="Edit">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    </button>
                                    <button onClick={() => handleDelete(s.id, `${s.subject_name} — ${s.classroom_name}`)}
                                      className="w-5 h-5 rounded-md bg-rose-500 flex items-center justify-center hover:bg-rose-600 shadow-sm" title="Delete">
                                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                  </div>
                                </div>
                              ))}
                              <button onClick={() => openCreate(String(slot.id))}
                                className="w-full py-1.5 border-2 border-dashed border-slate-100 rounded-xl text-slate-300 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 hover:border-violet-300 hover:text-violet-400 hover:bg-violet-50/30 transition-all text-xs">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {activeTab === 'list' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Mobile view (< 640px) */}
          <div className="md:hidden divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <div className="px-4 py-16 text-center">
                <p className="text-slate-400 font-bold text-sm">No schedules match your filters</p>
                <p className="text-slate-300 text-xs mt-1">Try adjusting the filters above</p>
              </div>
            ) : filtered
                .sort((a, b) => {
                  const dayOrder = DAYS.indexOf(a.time_slot_detail?.day) - DAYS.indexOf(b.time_slot_detail?.day);
                  if (dayOrder !== 0) return dayOrder;
                  return (a.time_slot_detail?.start_time || '').localeCompare(b.time_slot_detail?.start_time || '');
                })
                .map(s => (
              <div key={s.id} className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                      s.time_slot_detail?.day === 'monday' ? 'bg-violet-100 text-violet-700' :
                      s.time_slot_detail?.day === 'tuesday' ? 'bg-blue-100 text-blue-700' :
                      s.time_slot_detail?.day === 'wednesday' ? 'bg-emerald-100 text-emerald-700' :
                      s.time_slot_detail?.day === 'thursday' ? 'bg-amber-100 text-amber-700' :
                      s.time_slot_detail?.day === 'friday' ? 'bg-rose-100 text-rose-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {DAY_FULL[s.time_slot_detail?.day] || '—'}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {s.time_slot_detail?.start_time_display} – {s.time_slot_detail?.end_time_display}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(s)} className="p-2 rounded-xl bg-violet-50 text-violet-600 active:scale-95 transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => handleDelete(s.id, `${s.subject_name} — ${s.classroom_name}`)} className="p-2 rounded-xl bg-rose-50 text-rose-500 active:scale-95 transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center text-[10px] font-black ${subjectColorMap[s.subject] || SUBJECT_COLORS[0]}`}>
                    {s.subject_code}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 leading-tight mb-1">{s.subject_name}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        {s.classroom_name}
                      </p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        {s.teacher_name}
                      </p>
                      {s.room_name && (
                        <p className="text-[11px] text-violet-600 font-medium flex items-center gap-1">
                          <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                          {s.room_name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop view (>= 768px) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Day','Time','Section','Subject','Teacher','Room',''].map((h, i) => (
                    <th key={i} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-16 text-center">
                    <p className="text-slate-400 font-bold text-sm">No schedules match your filters</p>
                    <p className="text-slate-300 text-xs mt-1">Try adjusting the filters above</p>
                  </td></tr>
                ) : filtered
                    .sort((a, b) => {
                      const dayOrder = DAYS.indexOf(a.time_slot_detail?.day) - DAYS.indexOf(b.time_slot_detail?.day);
                      if (dayOrder !== 0) return dayOrder;
                      return (a.time_slot_detail?.start_time || '').localeCompare(b.time_slot_detail?.start_time || '');
                    })
                    .map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                        s.time_slot_detail?.day === 'monday' ? 'bg-violet-100 text-violet-700' :
                        s.time_slot_detail?.day === 'tuesday' ? 'bg-blue-100 text-blue-700' :
                        s.time_slot_detail?.day === 'wednesday' ? 'bg-emerald-100 text-emerald-700' :
                        s.time_slot_detail?.day === 'thursday' ? 'bg-amber-100 text-amber-700' :
                        s.time_slot_detail?.day === 'friday' ? 'bg-rose-100 text-rose-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {DAY_SHORT[s.time_slot_detail?.day] || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-bold text-slate-800 whitespace-nowrap">{s.time_slot_detail?.start_time_display}</p>
                      <p className="text-[10px] text-slate-400">{s.time_slot_detail?.end_time_display}</p>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-700">{s.classroom_name}</td>
                    <td className="px-4 py-3">
                      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-black ${subjectColorMap[s.subject] || SUBJECT_COLORS[0]}`}>
                        {s.subject_code}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{s.subject_name}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{s.teacher_name}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{s.room_name || <span className="text-slate-300">—</span>}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg text-violet-600 hover:bg-violet-50 transition-all" title="Edit">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(s.id, `${s.subject_name} — ${s.classroom_name}`)} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-all" title="Delete">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SCHEDULE FORM MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editItem ? 'Edit Schedule' : 'New Schedule'}
        subtitle={editItem ? 'Update assignment details' : 'Assign a class to a time slot'}
        size="md"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)}
              className="flex-1 sm:flex-none px-8 py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-black text-[11px] uppercase tracking-[0.2em] hover:bg-white transition-all active:scale-95">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-[2] sm:flex-none px-10 py-3.5 rounded-2xl bg-violet-600 text-white font-black text-[11px] uppercase tracking-[0.2em] hover:bg-violet-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-200 active:scale-95">
              {saving && <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
              {saving ? 'Processing…' : editItem ? 'Update Assignment' : 'Create Assignment'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSave} className="px-8 py-8 space-y-8">
          {/* Core */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">Core Assignment</h4>
              <div className="h-px w-full bg-slate-100"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Classroom" required>
                <Select required value={form.classroom} onChange={e => setForm(f => ({ ...f, classroom: e.target.value, subject: '', teacher: '' }))}>
                  <option value="">Select section…</option>
                  {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </Field>
              <Field label="Subject" required>
                {loadingAssignments ? (
                  <div className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-400 bg-slate-50 flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin text-violet-400" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Loading…
                  </div>
                ) : (
                  <Select required value={form.subject}
                    onChange={e => {
                      const subjectId = e.target.value;
                      const match = classroomAssignments.find(a => String(a.subject) === subjectId);
                      setForm(f => ({
                        ...f,
                        subject: subjectId,
                        teacher: match ? String(match.teacher) : f.teacher,
                      }));
                    }}>
                    <option value="">
                      {!form.classroom
                        ? 'Select a classroom first'
                        : classroomAssignments.length === 0
                        ? 'No subjects assigned'
                        : 'Select subject…'}
                    </option>
                    {(form.classroom && classroomAssignments.length > 0 ? classroomAssignments : []).map(a => (
                      <option key={a.subject} value={a.subject}>{a.subject_code} — {a.subject_name}</option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">Teacher & Room</h4>
              <div className="h-px w-full bg-slate-100"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <Field label="Teacher" required>
                  <Select required value={form.teacher} onChange={e => setForm(f => ({ ...f, teacher: e.target.value }))}>
                    <option value="">Select teacher…</option>
                    {(form.classroom && form.subject
                      ? classroomAssignments.filter(a => String(a.subject) === String(form.subject))
                      : teachers
                    ).map(a => (
                      <option key={a.teacher || a.id} value={a.teacher || a.id}>{a.teacher_name || a.full_name}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field label="Time Slot" required>
                <Select required value={form.time_slot} onChange={e => setForm(f => ({ ...f, time_slot: e.target.value }))}>
                  <option value="">Select time…</option>
                  {DAYS.map(d => {
                    const daySlots = sortedSlots.filter(ts => ts.day === d);
                    if (!daySlots.length) return null;
                    return (
                      <optgroup key={d} label={DAY_FULL[d]}>
                        {daySlots.map(ts => (
                          <option key={ts.id} value={ts.id}>
                            {ts.start_time_display} – {ts.end_time_display}{ts.label ? ` (${ts.label})` : ''}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </Select>
              </Field>
              <Field label="Room (optional)">
                <Select value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))}>
                  <option value="">No room assigned</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.name}{r.building ? ` · ${r.building}` : ''}</option>)}
                </Select>
              </Field>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">Context & Notes</h4>
              <div className="h-px w-full bg-slate-100"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Academic Year" required>
                <Select required value={form.academic_year} onChange={e => setForm(f => ({ ...f, academic_year: e.target.value, semester: '' }))}>
                  <option value="">Select year…</option>
                  {academicYears.map(a => <option key={a.id} value={a.id}>{a.name}{a.is_active ? ' ★' : ''}</option>)}
                </Select>
              </Field>
              <Field label="Semester (optional)">
                <Select value={form.semester} onChange={e => setForm(f => ({ ...f, semester: e.target.value }))}>
                  <option value="">None</option>
                  {semesters.map(s => <option key={s.id} value={s.id}>{s.semester_type}</option>)}
                </Select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Notes (optional)">
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    rows={2} placeholder="Any additional instructions…"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 transition-all resize-none shadow-sm" />
                </Field>
              </div>
            </div>
          </div>

          <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-[11px] text-amber-700 font-bold leading-relaxed uppercase tracking-tight">
              Conflicts (teacher, room, or section overlapping) are validated automatically upon saving.
            </p>
          </div>
        </form>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════
          TIME SLOTS MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        open={showSlotPanel}
        onClose={() => setShowSlotPanel(false)}
        title="Time Slots"
        subtitle={`${timeSlots.length} Slots Configured`}
        size="lg"
      >
        <div className="flex flex-col md:flex-row min-h-0">
          {/* Left: Add form */}
          <div className="w-full md:w-[320px] p-8 border-b md:border-b-0 md:border-r border-slate-100 bg-violet-50/20 overflow-y-auto scrollbar-none shrink-0">
            <form onSubmit={saveSlot} className="space-y-6">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Register New Slot</h4>
              <div className="grid grid-cols-1 gap-5">
                <Field label="Day of Week" required>
                  <Select required value={slotForm.day} onChange={e => setSlotForm(f => ({ ...f, day: e.target.value }))}>
                    {DAYS.map(d => <option key={d} value={d}>{DAY_FULL[d]}</option>)}
                  </Select>
                </Field>
                <Field label="Slot Label">
                  <input value={slotForm.label} onChange={e => setSlotForm(f => ({ ...f, label: e.target.value }))}
                    placeholder="e.g. 1st Period"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 transition-all" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Start Time" required>
                    <input required type="time" value={slotForm.start_time} onChange={e => setSlotForm(f => ({ ...f, start_time: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 transition-all" />
                  </Field>
                  <Field label="End Time" required>
                    <input required type="time" value={slotForm.end_time} onChange={e => setSlotForm(f => ({ ...f, end_time: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 transition-all" />
                  </Field>
                </div>
              </div>
              <button type="submit" disabled={savingSlot}
                className="w-full py-3.5 rounded-2xl bg-violet-600 text-white font-black text-[11px] uppercase tracking-[0.2em] hover:bg-violet-700 disabled:opacity-50 transition-all shadow-lg shadow-violet-200 active:scale-95">
                {savingSlot ? 'Registering…' : '+ Register Slot'}
              </button>
            </form>
          </div>

          {/* Right: Existing slots */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-white scrollbar-thin">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Registered Slots</h4>
              <select 
                value={slotFilterDay} 
                onChange={e => setSlotFilterDay(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] font-black uppercase tracking-widest bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 transition-all cursor-pointer"
              >
                <option value="">All Days</option>
                {DAYS.map(d => <option key={d} value={d}>{DAY_FULL[d]}</option>)}
              </select>
            </div>

            {(slotFilterDay ? [slotFilterDay] : DAYS).map(d => {
              const daySlots = sortedSlots.filter(ts => ts.day === d);
              if (!daySlots.length) return null;
              return (
                <div key={d} className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-3">
                    {DAY_FULL[d]}
                    <div className="h-px w-full bg-slate-50"></div>
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {daySlots.map(ts => (
                      <div key={ts.id} className="flex items-center justify-between py-3 px-4 rounded-2xl bg-slate-50 hover:bg-violet-50 transition-all group border border-transparent hover:border-violet-100">
                        <div>
                          <p className="text-[13px] font-bold text-slate-800 tracking-tight">{ts.start_time?.slice(0,5)} – {ts.end_time?.slice(0,5)}</p>
                          {ts.label && <p className="text-[9px] text-violet-500 font-black uppercase tracking-widest mt-0.5">{ts.label}</p>}
                        </div>
                        <button onClick={() => deleteSlot(ts.id, `${DAY_SHORT[ts.day]} ${ts.start_time?.slice(0,5)}`)}
                          className="p-2 rounded-xl text-rose-400 hover:text-rose-600 hover:bg-rose-100 opacity-0 group-hover:opacity-100 transition-all active:scale-90">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {timeSlots.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">No slots registered</p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════
          ROOMS MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        open={showRoomPanel}
        onClose={() => setShowRoomPanel(false)}
        title="Facility Management"
        subtitle={`${rooms.length} Rooms Registered`}
        size="lg"
      >
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0">
          {/* Left: Add form */}
          <div className="w-full md:w-[320px] p-8 border-b md:border-b-0 md:border-r border-slate-100 bg-violet-50/20 overflow-y-auto scrollbar-none shrink-0">
            <form onSubmit={saveRoom} className="space-y-6">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Register New Room</h4>
              <div className="grid grid-cols-1 gap-5">
                <Field label="Room Name" required>
                  <input required value={roomForm.name} onChange={e => setRoomForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Room 204"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 transition-all" />
                </Field>
                <Field label="Building">
                  <input value={roomForm.building} onChange={e => setRoomForm(f => ({ ...f, building: e.target.value }))}
                    placeholder="e.g. Main Bldg"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 transition-all" />
                </Field>
                <Field label="Facility Type">
                  <Select value={roomForm.room_type} onChange={e => setRoomForm(f => ({ ...f, room_type: e.target.value }))}>
                    <option value="classroom">Classroom</option>
                    <option value="laboratory">Laboratory</option>
                    <option value="gym">Gymnasium</option>
                    <option value="library">Library</option>
                    <option value="other">Other</option>
                  </Select>
                </Field>
                <Field label="Seating Capacity">
                  <input type="number" min={1} value={roomForm.capacity} onChange={e => setRoomForm(f => ({ ...f, capacity: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 transition-all" />
                </Field>
              </div>
              <button type="submit" disabled={savingRoom}
                className="w-full py-3.5 rounded-2xl bg-violet-600 text-white font-black text-[11px] uppercase tracking-[0.2em] hover:bg-violet-700 disabled:opacity-50 transition-all shadow-lg shadow-violet-200 active:scale-95">
                {savingRoom ? 'Registering…' : '+ Register Room'}
              </button>
            </form>
          </div>

          {/* Right: Existing rooms */}
          <div className="flex-1 overflow-y-auto p-8 space-y-4 bg-white scrollbar-thin">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Registered Facilities</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {rooms.map(r => (
                <div key={r.id} className="flex items-center justify-between py-4 px-5 rounded-2xl bg-slate-50 hover:bg-violet-50 transition-all group border border-transparent hover:border-violet-100 shadow-sm hover:shadow-md">
                  <div className="min-w-0">
                    <p className="text-[14px] font-black text-slate-900 truncate">{r.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-violet-500 bg-violet-100 px-1.5 py-0.5 rounded-md">{r.room_type}</span>
                      {r.building && <span className="text-[10px] text-slate-400 font-bold">· {r.building}</span>}
                    </div>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Cap. {r.capacity} Seats</p>
                  </div>
                  <button onClick={() => deleteRoom(r.id, r.name)}
                    className="p-2.5 rounded-xl text-rose-400 hover:text-rose-600 hover:bg-rose-100 opacity-0 group-hover:opacity-100 transition-all active:scale-90 flex-shrink-0 ml-4">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))}
            </div>
            {rooms.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 012-2h2a2 2 0 012 2v16m-10 0V3a2 2 0 00-2-2H8a2 2 0 00-2 2v18" /></svg>
                </div>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">No rooms registered</p>
              </div>
            )}
          </div>
        </div>
      </Modal>

    </div>
  );
}
