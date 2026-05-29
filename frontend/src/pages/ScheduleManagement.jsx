import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import Spinner from '../components/Spinner';
import { Modal } from '../components/ui/Modal';

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday'];
const DAY_FULL = { monday:'Monday', tuesday:'Tuesday', wednesday:'Wednesday', thursday:'Thursday', friday:'Friday', saturday:'Saturday' };
const DAY_SHORT = { monday:'Mon', tuesday:'Tue', wednesday:'Wed', thursday:'Thu', friday:'Fri', saturday:'Sat' };

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const DEFAULT_BELL_PERIODS = [
  { start_time: '07:30', end_time: '08:30', label: 'Period 1' },
  { start_time: '08:30', end_time: '09:30', label: 'Period 2' },
  { start_time: '09:30', end_time: '10:30', label: 'Period 3' },
  { start_time: '10:45', end_time: '11:45', label: 'Period 4' },
  { start_time: '11:45', end_time: '12:45', label: 'Period 5' },
  { start_time: '13:30', end_time: '14:30', label: 'Period 6' },
  { start_time: '14:30', end_time: '15:30', label: 'Period 7' },
];

const normalizeTime = (value) => {
  if (!value) return '';
  const str = String(value);
  const match = str.match(/(\d{1,2}):(\d{2})/);
  if (!match) return str.slice(0, 5);
  return `${match[1].padStart(2, '0')}:${match[2]}`;
};

const periodKey = (start, end) => `${normalizeTime(start)}-${normalizeTime(end)}`;

const slotExists = (slots, day, start, end) =>
  slots.some(
    (ts) => ts.day === day && periodKey(ts.start_time, ts.end_time) === periodKey(start, end)
  );

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
    className="w-full px-3 py-2.5 rounded-sm border border-violet-200 text-sm font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all"
  >
    {children}
  </select>
);

const ScheduleEntryCard = ({ entry, subjectColorMap, onEdit, onDelete, compact }) => (
  <div
    className={`${compact ? 'p-2' : 'p-2.5'} rounded-sm border ${subjectColorMap[entry.subject] || SUBJECT_COLORS[0]} relative group shadow-sm hover:shadow-md transition-all`}
  >
    <p className="text-[10px] font-bold uppercase tracking-tight leading-none">{entry.subject_code}</p>
    <p className={`${compact ? 'text-[10px]' : 'text-[11px]'} font-bold leading-tight line-clamp-1`}>{entry.subject_name}</p>
    {!compact && entry.classroom_name && (
      <p className="text-[9px] opacity-70 mt-0.5 truncate">{entry.classroom_name}</p>
    )}
    {entry.teacher_name && <p className="text-[9px] opacity-60 truncate">{entry.teacher_name}</p>}
    {entry.room_name && (
      <p className="text-[9px] opacity-60 mt-0.5 truncate">{entry.room_name}</p>
    )}
    <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
      <button type="button" onClick={() => onEdit(entry)} className="w-5 h-5 rounded-sm bg-white/90 flex items-center justify-center hover:bg-white shadow-sm" title="Edit">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
      </button>
      <button type="button" onClick={() => onDelete(entry.id, `${entry.subject_name} — ${entry.classroom_name}`)} className="w-5 h-5 rounded-sm bg-rose-500 flex items-center justify-center hover:bg-rose-600 shadow-sm" title="Delete">
        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  </div>
);

const SectionTimetableGrid = ({
  days,
  periods,
  getCellSchedules,
  hasSlotForCell,
  subjectColorMap,
  onAdd,
  onEdit,
  onDelete,
  singleSection,
  addingCell,
}) => (
  <>
    {/* Mobile: day cards */}
    <div className="md:hidden p-3 space-y-4">
      {days.map((d) => (
        <div key={d}>
          <p className="text-[10px] font-bold text-violet-700 uppercase tracking-wide mb-2">{DAY_FULL[d]}</p>
          <div className="space-y-2">
            {periods.map((period) => {
              const entries = getCellSchedules(d, period);
              const slotReady = hasSlotForCell(d, period);
              const cellKey = `${d}-${period.start_time}-${period.end_time}`;
              const isAdding = addingCell === cellKey;

              if (singleSection && entries.length === 0) {
                return (
                  <button
                    key={cellKey}
                    type="button"
                    onClick={() => onAdd(d, period)}
                    disabled={isAdding}
                    className={`w-full py-3 px-3 rounded-sm border text-left transition-all ${
                      slotReady
                        ? 'border-dashed border-violet-200 hover:border-violet-400 hover:bg-violet-50/50'
                        : 'border-dashed border-amber-200 bg-amber-50/40 hover:border-amber-400 hover:bg-amber-50'
                    } ${isAdding ? 'opacity-60 cursor-wait' : ''}`}
                  >
                    <p className="text-xs font-bold text-slate-700">{period.start_display} – {period.end_display}</p>
                    <p className="text-[10px] mt-0.5 font-semibold text-violet-600">
                      {isAdding ? 'Setting up…' : slotReady ? 'Tap to assign class' : 'Tap to enable period'}
                    </p>
                  </button>
                );
              }
              if (entries.length === 0) return null;
              return entries.map((s) => (
                <div key={s.id} className="flex gap-2 items-stretch">
                  <div className="text-[10px] font-bold text-slate-500 w-14 shrink-0 pt-2 leading-tight">
                    {period.start_display}
                  </div>
                  <div className="flex-1 min-w-0">
                    <ScheduleEntryCard entry={s} subjectColorMap={subjectColorMap} onEdit={onEdit} onDelete={onDelete} compact={!singleSection} />
                  </div>
                </div>
              ));
            })}
          </div>
        </div>
      ))}
    </div>

    {/* Desktop grid */}
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full border-separate border-spacing-0" style={{ minWidth: 720 }}>
        <thead>
          <tr className="bg-violet-800">
            <th className="px-3 py-2.5 text-left w-24 border-r border-violet-700">
              <span className="text-[10px] font-bold text-violet-200 uppercase tracking-wide">Period</span>
            </th>
            {days.map((d) => (
              <th key={d} className="px-2 py-2.5 text-left border-r border-violet-700/50 min-w-[120px]">
                <span className="text-[10px] font-bold text-violet-100 uppercase tracking-wide">{DAY_SHORT[d]}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periods.map((period, rowIdx) => (
            <tr key={`${period.start_time}-${period.end_time}`} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-violet-50/30'}>
              <td className="px-3 py-2 border-r border-violet-100 align-top">
                <p className="text-xs font-bold text-slate-800">{period.start_display}</p>
                <p className="text-[10px] text-slate-400">{period.end_display}</p>
                {period.label && (
                  <span className="mt-1 inline-block text-[9px] font-bold text-violet-600 uppercase">{period.label}</span>
                )}
              </td>
              {days.map((d) => {
                const entries = getCellSchedules(d, period);
                const slotReady = hasSlotForCell(d, period);
                const cellKey = `${d}-${period.start_time}-${period.end_time}`;
                const isAdding = addingCell === cellKey;
                const showAdd = singleSection || entries.length === 0;

                return (
                  <td key={d} className="px-1.5 py-1.5 align-top border-r border-violet-100 min-h-[72px] group/cell">
                    <div className="space-y-1 min-h-[64px]">
                      {entries.map((s) => (
                        <ScheduleEntryCard
                          key={s.id}
                          entry={s}
                          subjectColorMap={subjectColorMap}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          compact={!singleSection}
                        />
                      ))}
                      {showAdd && (
                        <button
                          type="button"
                          onClick={() => onAdd(d, period)}
                          disabled={isAdding}
                          title={slotReady ? 'Assign class' : 'Create period & assign class'}
                          className={`w-full py-1.5 border border-dashed rounded-sm flex flex-col items-center justify-center gap-0.5 transition-all text-[9px] font-bold uppercase tracking-wide ${
                            isAdding ? 'opacity-50 cursor-wait border-violet-200 text-violet-400' :
                            slotReady
                              ? `text-slate-300 hover:border-violet-300 hover:text-violet-500 hover:bg-violet-50/40 ${entries.length ? 'opacity-0 group-hover/cell:opacity-100' : 'opacity-60 hover:opacity-100'}`
                              : 'border-amber-200 text-amber-600 bg-amber-50/50 hover:border-amber-400 hover:bg-amber-50 opacity-80 hover:opacity-100'
                          }`}
                        >
                          {isAdding ? (
                            <span>…</span>
                          ) : slotReady ? (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                          ) : (
                            <>
                              <span>Enable</span>
                              <span className="font-normal normal-case text-[8px]">+ assign</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
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
  const [activeTab, setActiveTab]       = useState('section');
  const [showSetupMenu, setShowSetupMenu] = useState(false);
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
  const [slotForm, setSlotForm]         = useState({ days: [...WEEKDAYS], start_time:'07:30', end_time:'08:30', label:'' });
  const [savingRoom, setSavingRoom]     = useState(false);
  const [savingSlot, setSavingSlot]     = useState(false);
  const [slotFilterDay, setSlotFilterDay] = useState('');
  const [quickAddContext, setQuickAddContext] = useState(null);
  const [addingCell, setAddingCell]     = useState('');

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

  const sortedSlots = useMemo(() =>
    [...timeSlots].sort((a, b) => {
      const dayDiff = DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
      if (dayDiff !== 0) return dayDiff;
      return a.start_time.localeCompare(b.start_time);
    }),
  [timeSlots]);

  // Rows = unique bell periods (same start/end across days), columns = weekdays
  const uniquePeriods = useMemo(() => {
    const map = new Map();
    sortedSlots.forEach((ts) => {
      const key = periodKey(ts.start_time, ts.end_time);
      if (!map.has(key)) {
        map.set(key, {
          start_time: ts.start_time,
          end_time: ts.end_time,
          label: ts.label,
          start_display: ts.start_time_display || normalizeTime(ts.start_time),
          end_display: ts.end_time_display || normalizeTime(ts.end_time),
        });
      }
    });
    return [...map.values()].sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [sortedSlots]);

  const getSlotForCell = useCallback((day, period) =>
    timeSlots.find(
      (ts) => ts.day === day
        && periodKey(ts.start_time, ts.end_time) === periodKey(period.start_time, period.end_time)
    ),
  [timeSlots]);

  const hasSlotForCell = useCallback(
    (day, period) => Boolean(getSlotForCell(day, period)),
    [getSlotForCell]
  );

  const periodCoverage = useMemo(() =>
    uniquePeriods.map((period) => ({
      ...period,
      coveredDays: DAYS.filter((d) => hasSlotForCell(d, period)).length,
    })),
  [uniquePeriods, hasSlotForCell]);

  const missingSlotCount = useMemo(() => {
    let missing = 0;
    uniquePeriods.forEach((period) => {
      DAYS.forEach((d) => {
        if (!hasSlotForCell(d, period)) missing++;
      });
    });
    return missing;
  }, [uniquePeriods, hasSlotForCell]);

  const getCellSchedules = useCallback((day, period, classroomId = filterClassroom) => {
    const slot = getSlotForCell(day, period);
    if (!slot) return [];
    return filtered.filter((s) => String(s.time_slot) === String(slot.id) && (
      !classroomId || String(s.classroom) === String(classroomId)
    ));
  }, [filtered, filterClassroom, getSlotForCell]);

  const classroomScheduleCounts = useMemo(() => {
    const counts = {};
    filtered.forEach((s) => {
      counts[s.classroom] = (counts[s.classroom] || 0) + 1;
    });
    return counts;
  }, [filtered]);

  const hasFilters = Boolean(search || filterDay || filterClassroom || filterTeacher);

  const clearFilters = () => {
    setSearch('');
    setFilterDay('');
    setFilterClassroom('');
    setFilterTeacher('');
  };

  // ── Actions ───────────────────────────────────────────────────────────────
  const ensureTimeSlot = useCallback(async (day, period) => {
    const existing = getSlotForCell(day, period);
    if (existing) return existing;
    try {
      const res = await api.post('/time-slots/', {
        day,
        start_time: normalizeTime(period.start_time),
        end_time: normalizeTime(period.end_time),
        label: period.label || '',
      });
      const created = res.data;
      setTimeSlots((prev) => [...prev, created]);
      return created;
    } catch (err) {
      toast.error(err.response?.data?.non_field_errors?.[0] || 'Could not create time slot');
      return null;
    }
  }, [getSlotForCell]);

  const openCreate = useCallback((slotId = '', prefill = {}, quickContext = null) => {
    const ay = academicYears.find((a) => String(a.id) === activeAY) || academicYears.find((a) => a.is_active);
    setEditItem(null);
    setQuickAddContext(quickContext);
    setForm({
      ...emptyForm,
      time_slot: slotId,
      academic_year: ay ? String(ay.id) : '',
      classroom: prefill.classroom || filterClassroom || '',
      ...prefill,
    });
    setShowForm(true);
  }, [academicYears, activeAY, filterClassroom]);

  const openCreateAtCell = useCallback(async (day, period) => {
    if (activeTab === 'section' && !filterClassroom) {
      toast.error('Select a section first');
      return;
    }
    const cellKey = `${day}-${period.start_time}-${period.end_time}`;
    setAddingCell(cellKey);
    try {
      const slot = await ensureTimeSlot(day, period);
      if (!slot) return;
      const section = classrooms.find((c) => String(c.id) === filterClassroom);
      openCreate(String(slot.id), { classroom: filterClassroom || '' }, {
        dayLabel: DAY_FULL[day],
        timeLabel: `${period.start_display} – ${period.end_display}`,
        sectionName: section?.name || 'Section',
      });
    } finally {
      setAddingCell('');
    }
  }, [activeTab, filterClassroom, ensureTimeSlot, openCreate, classrooms]);

  const openEdit = useCallback((s) => {
    setQuickAddContext(null);
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
      setQuickAddContext(null);
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

  const saveSlotBulk = async (e) => {
    e.preventDefault();
    if (!slotForm.days.length) {
      toast.error('Select at least one day');
      return;
    }
    setSavingSlot(true);
    let created = 0;
    let skipped = 0;
    const newSlots = [];
    try {
      for (const day of slotForm.days) {
        if (slotExists(timeSlots, day, slotForm.start_time, slotForm.end_time)) {
          skipped++;
          continue;
        }
        const res = await api.post('/time-slots/', {
          day,
          start_time: slotForm.start_time,
          end_time: slotForm.end_time,
          label: slotForm.label,
        });
        newSlots.push(res.data);
        created++;
      }
      if (created) {
        setTimeSlots((prev) => [...prev, ...newSlots]);
        toast.success(`Added ${created} period${created > 1 ? 's' : ''}${skipped ? ` · ${skipped} skipped (exist)` : ''}`);
        setSlotForm((f) => ({ ...f, label: '' }));
      } else {
        toast.error('This period already exists on all selected days');
      }
    } catch (err) {
      toast.error(err.response?.data?.non_field_errors?.[0] || 'Failed to add time slots');
    } finally {
      setSavingSlot(false);
    }
  };

  const applyStandardBellSchedule = async (includeSaturday = false) => {
    const targetDays = includeSaturday ? DAYS : WEEKDAYS;
    setSavingSlot(true);
    let created = 0;
    const newSlots = [];
    try {
      for (const period of DEFAULT_BELL_PERIODS) {
        for (const day of targetDays) {
          if (slotExists(timeSlots, day, period.start_time, period.end_time)) continue;
          const res = await api.post('/time-slots/', { day, ...period });
          newSlots.push(res.data);
          created++;
        }
      }
      if (created) {
        setTimeSlots((prev) => [...prev, ...newSlots]);
        toast.success(`Created ${created} bell period slots`);
      } else {
        toast.success('Standard bell schedule is already set up');
      }
    } catch (err) {
      toast.error(err.response?.data?.non_field_errors?.[0] || 'Failed to apply bell schedule');
    } finally {
      setSavingSlot(false);
    }
  };

  const fillMissingPeriodSlots = async () => {
    if (!uniquePeriods.length) {
      toast.error('Add at least one period first');
      return;
    }
    setSavingSlot(true);
    let created = 0;
    const newSlots = [];
    try {
      for (const period of uniquePeriods) {
        for (const day of WEEKDAYS) {
          if (hasSlotForCell(day, period)) continue;
          const res = await api.post('/time-slots/', {
            day,
            start_time: normalizeTime(period.start_time),
            end_time: normalizeTime(period.end_time),
            label: period.label || '',
          });
          newSlots.push(res.data);
          created++;
        }
      }
      if (created) {
        setTimeSlots((prev) => [...prev, ...newSlots]);
        toast.success(`Filled ${created} missing day slots`);
      } else {
        toast.success('All weekday periods are already complete');
      }
    } catch (err) {
      toast.error('Failed to fill missing slots');
    } finally {
      setSavingSlot(false);
    }
  };

  const deleteSlot = async (id, label) => {
    const r = await Swal.fire({ title: `Delete "${label}"?`, text: 'Schedules using this slot will be affected.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Delete', customClass: { popup: 'rounded-2xl' } });
    if (!r.isConfirmed) return;
    try { await api.delete(`/time-slots/${id}/`); toast.success('Time slot deleted'); setTimeSlots((prev) => prev.filter((ts) => ts.id !== id)); }
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
    <div className="space-y-4 md:space-y-5 page-bottom-safe max-w-[1600px] mx-auto">

      {/* ── Sticky toolbar ── */}
      <div className="sticky top-0 z-20 -mx-3 px-3 md:-mx-6 md:px-6 py-3 bg-violet-50/95 backdrop-blur-sm border-b border-violet-100 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Schedule Management</h1>
            <p className="text-slate-500 text-xs md:text-sm mt-0.5">Build section timetables, assign teachers, and resolve conflicts</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSetupMenu((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-sm border border-violet-200 bg-white text-violet-800 text-[10px] font-bold uppercase tracking-wide hover:bg-violet-50 transition-colors"
              >
                Setup
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {showSetupMenu && (
                <>
                  <button type="button" className="fixed inset-0 z-10" aria-label="Close menu" onClick={() => setShowSetupMenu(false)} />
                  <div className="absolute right-0 mt-1 w-44 py-1 bg-white border border-violet-200 rounded-sm shadow-lg z-20">
                    <button type="button" onClick={() => { setShowSlotPanel(true); setShowSetupMenu(false); }} className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-violet-50">Time Slots</button>
                    <button type="button" onClick={() => { setShowRoomPanel(true); setShowSetupMenu(false); }} className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-violet-50">Rooms</button>
                  </div>
                </>
              )}
            </div>
            <button type="button" onClick={checkConflicts}
              className="flex items-center gap-1.5 px-3 py-2 rounded-sm border border-amber-200 bg-amber-50 text-amber-800 text-[10px] font-bold uppercase tracking-wide hover:bg-amber-100 transition-colors">
              Check Conflicts
            </button>
            <button type="button" onClick={() => openCreate()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-sm bg-violet-700 text-white text-[10px] font-bold uppercase tracking-wide hover:bg-violet-800 shadow-sm transition-colors">
              + Add Class
            </button>
          </div>
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…"
              className="w-full pl-8 pr-3 py-2 bg-white border border-violet-200 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-violet-300/40 focus:border-violet-400" />
          </div>
          <select value={activeAY} onChange={(e) => setActiveAY(e.target.value)}
            className="px-3 py-2 rounded-sm border border-violet-200 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-violet-300/40 min-w-[140px]">
            <option value="">All Years</option>
            {academicYears.map((a) => <option key={a.id} value={String(a.id)}>{a.name}{a.is_active ? ' ★' : ''}</option>)}
          </select>
          <select value={filterClassroom} onChange={(e) => setFilterClassroom(e.target.value)}
            className="px-3 py-2 rounded-sm border border-violet-300 text-sm font-semibold bg-violet-50 text-violet-900 focus:outline-none focus:ring-2 focus:ring-violet-400/40 min-w-[160px]">
            <option value="">All Sections</option>
            {classrooms.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}{classroomScheduleCounts[c.id] ? ` (${classroomScheduleCounts[c.id]})` : ''}
              </option>
            ))}
          </select>
          <select value={filterDay} onChange={(e) => setFilterDay(e.target.value)}
            className="px-3 py-2 rounded-sm border border-violet-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-300/40">
            <option value="">All Days</option>
            {DAYS.map((d) => <option key={d} value={d}>{DAY_FULL[d]}</option>)}
          </select>
          <select value={filterTeacher} onChange={(e) => setFilterTeacher(e.target.value)}
            className="px-3 py-2 rounded-sm border border-violet-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-300/40 min-w-[140px]">
            <option value="">All Teachers</option>
            {teachers.map((t) => <option key={t.id} value={String(t.id)}>{t.full_name || `${t.first_name} ${t.last_name}`}</option>)}
          </select>
          {hasFilters && (
            <button type="button" onClick={clearFilters}
              className="px-3 py-2 rounded-sm text-[10px] font-bold uppercase tracking-wide text-rose-600 hover:bg-rose-50 border border-rose-200">
              Clear
            </button>
          )}
        </div>

        {/* View tabs + compact stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex gap-1 bg-violet-100/80 rounded-sm p-1 w-fit">
            {[
              { id: 'section', label: 'Section Timetable' },
              { id: 'master', label: 'School Overview' },
              { id: 'list', label: 'List' },
            ].map((t) => (
              <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
                className={`px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wide transition-all ${
                  activeTab === t.id ? 'bg-white text-violet-800 shadow-sm' : 'text-violet-600 hover:text-violet-900'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            <span className="px-2 py-1 rounded-sm bg-white border border-violet-100">{stats.total} classes</span>
            <span className="px-2 py-1 rounded-sm bg-white border border-violet-100">{stats.classrooms} sections</span>
            <span className="px-2 py-1 rounded-sm bg-white border border-violet-100">{stats.teachers} teachers</span>
          </div>
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
                  <button type="button" onClick={() => applyStandardBellSchedule(false)}
                    className="px-3 py-1.5 rounded-sm bg-violet-700 text-white text-xs font-bold hover:bg-violet-800 transition-all">
                    Apply Standard Bell Schedule
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
        <div className="bg-emerald-50 border border-emerald-200 rounded-sm p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <p className="text-sm font-bold text-emerald-700">No scheduling conflicts found.</p>
          <button type="button" onClick={() => setShowConflicts(false)} className="ml-auto text-emerald-500 hover:text-emerald-700 text-xs font-bold">Dismiss</button>
        </div>
      )}

      {missingSlotCount > 0 && timeSlots.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-sm p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-amber-900">{missingSlotCount} timetable cell{missingSlotCount > 1 ? 's' : ''} missing a time slot</p>
            <p className="text-xs text-amber-700 mt-0.5">Some periods exist on one day but not others. Fill gaps or click amber cells in the grid to auto-create.</p>
          </div>
          <button type="button" onClick={fillMissingPeriodSlots} disabled={savingSlot}
            className="shrink-0 px-3 py-2 rounded-sm bg-amber-600 text-white text-[10px] font-bold uppercase tracking-wide hover:bg-amber-700 disabled:opacity-50">
            Fill Weekday Gaps
          </button>
        </div>
      )}

      {/* ── SECTION TIMETABLE ── */}
      {activeTab === 'section' && (
        <div className="bg-white border border-violet-200 rounded-sm shadow-sm overflow-hidden">
          {!filterClassroom ? (
            <div className="p-5 md:p-8">
              <div className="max-w-xl mb-6">
                <h2 className="text-sm font-bold text-slate-900">Select a section to edit its timetable</h2>
                <p className="text-xs text-slate-500 mt-1">Pick a classroom section below or use the section filter above. Each section gets its own weekly grid.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {classrooms.map((c) => {
                  const count = classroomScheduleCounts[c.id] || 0;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setFilterClassroom(String(c.id))}
                      className="text-left p-4 rounded-sm border border-violet-200 bg-violet-50/40 hover:bg-white hover:border-violet-400 hover:shadow-sm transition-all group"
                    >
                      <p className="text-sm font-bold text-slate-900 group-hover:text-violet-800">{c.name}</p>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mt-1">
                        {count ? `${count} scheduled class${count === 1 ? '' : 'es'}` : 'No classes yet'}
                      </p>
                    </button>
                  );
                })}
              </div>
              {classrooms.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-12">Create classrooms in Class Management first.</p>
              )}
            </div>
          ) : uniquePeriods.length === 0 ? (
            <div className="py-16 text-center px-4">
              <p className="text-slate-600 font-bold text-sm">No bell periods configured yet</p>
              <p className="text-slate-400 text-xs mt-1 max-w-md mx-auto">Apply the standard 7-period school day to get started in one click, or add custom periods in Setup.</p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <button type="button" onClick={() => applyStandardBellSchedule(false)} disabled={savingSlot}
                  className="px-4 py-2 rounded-sm bg-violet-700 text-white text-xs font-bold hover:bg-violet-800 disabled:opacity-50">
                  Apply Standard Schedule (Mon–Fri)
                </button>
                <button type="button" onClick={() => setShowSlotPanel(true)}
                  className="px-4 py-2 rounded-sm border border-violet-300 text-violet-800 text-xs font-bold hover:bg-violet-50">
                  Custom Periods
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-violet-100 bg-violet-50/60 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-violet-900">
                    {classrooms.find((c) => String(c.id) === filterClassroom)?.name || 'Section'}
                  </p>
                  <p className="text-[10px] font-semibold text-violet-600 uppercase tracking-wide">Weekly timetable</p>
                </div>
                <button type="button" onClick={() => setFilterClassroom('')} className="text-[10px] font-bold uppercase tracking-wide text-violet-600 hover:text-violet-800">
                  Change section
                </button>
              </div>
              <SectionTimetableGrid
                days={filterDay ? [filterDay] : DAYS}
                periods={uniquePeriods}
                getCellSchedules={getCellSchedules}
                hasSlotForCell={hasSlotForCell}
                subjectColorMap={subjectColorMap}
                onAdd={openCreateAtCell}
                onEdit={openEdit}
                onDelete={handleDelete}
                singleSection
                addingCell={addingCell}
              />
            </>
          )}
        </div>
      )}

      {/* ── SCHOOL OVERVIEW (master grid) ── */}
      {activeTab === 'master' && (
        <div className="bg-white border border-violet-200 rounded-sm shadow-sm overflow-hidden">
          {uniquePeriods.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-slate-500 font-bold text-sm">No time slots yet</p>
              <button type="button" onClick={() => setShowSlotPanel(true)} className="mt-4 px-4 py-2 rounded-sm bg-violet-700 text-white text-xs font-bold">+ Add Time Slots</button>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-violet-100 bg-slate-50">
                <p className="text-xs text-slate-600">All sections at a glance — click a class to edit. Use Section Timetable to add entries faster.</p>
              </div>
              <SectionTimetableGrid
                days={filterDay ? [filterDay] : DAYS}
                periods={uniquePeriods}
                getCellSchedules={getCellSchedules}
                hasSlotForCell={hasSlotForCell}
                subjectColorMap={subjectColorMap}
                onAdd={openCreateAtCell}
                onEdit={openEdit}
                onDelete={handleDelete}
                singleSection={false}
                addingCell={addingCell}
              />
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
        onClose={() => { setShowForm(false); setQuickAddContext(null); }}
        title={editItem ? 'Edit Class' : quickAddContext ? 'Assign Class' : 'New Class'}
        subtitle={quickAddContext
          ? `${quickAddContext.sectionName} · ${quickAddContext.dayLabel} · ${quickAddContext.timeLabel}`
          : editItem ? 'Update assignment details' : 'Assign subject to a time slot'}
        size="md"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={() => { setShowForm(false); setQuickAddContext(null); }}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-sm border border-violet-200 text-slate-600 font-bold text-[10px] uppercase tracking-wide hover:bg-violet-50 transition-all">
              Cancel
            </button>
            <button type="submit" form="schedule-form" disabled={saving}
              className="flex-[2] sm:flex-none px-8 py-2.5 rounded-sm bg-violet-700 text-white font-bold text-[10px] uppercase tracking-wide hover:bg-violet-800 disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
              {saving && <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
              {saving ? 'Saving…' : editItem ? 'Save Changes' : 'Assign Class'}
            </button>
          </div>
        }
      >
        <form id="schedule-form" onSubmit={handleSave} className="px-6 py-6 space-y-6">
          {(!quickAddContext || editItem) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Section" required>
                <Select required value={form.classroom} onChange={(e) => setForm((f) => ({ ...f, classroom: e.target.value, subject: '', teacher: '' }))}>
                  <option value="">Select section…</option>
                  {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </Field>
              <Field label="Time Slot" required>
                <Select required value={form.time_slot} onChange={(e) => setForm((f) => ({ ...f, time_slot: e.target.value }))}>
                  <option value="">Select time…</option>
                  {DAYS.map((d) => {
                    const daySlots = sortedSlots.filter((ts) => ts.day === d);
                    if (!daySlots.length) return null;
                    return (
                      <optgroup key={d} label={DAY_FULL[d]}>
                        {daySlots.map((ts) => (
                          <option key={ts.id} value={ts.id}>
                            {ts.start_time_display || normalizeTime(ts.start_time)} – {ts.end_time_display || normalizeTime(ts.end_time)}{ts.label ? ` (${ts.label})` : ''}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </Select>
              </Field>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <Field label="Teacher" required>
              <Select required value={form.teacher} onChange={(e) => setForm((f) => ({ ...f, teacher: e.target.value }))}>
                <option value="">Select teacher…</option>
                {(form.classroom && form.subject
                  ? classroomAssignments.filter((a) => String(a.subject) === String(form.subject))
                  : teachers
                ).map((a) => (
                  <option key={a.teacher || a.id} value={a.teacher || a.id}>{a.teacher_name || a.full_name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Room (optional)">
              <Select value={form.room} onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}>
                <option value="">No room</option>
                {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}{r.building ? ` · ${r.building}` : ''}</option>)}
              </Select>
            </Field>
          </div>

          {!quickAddContext && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-violet-100">
              <Field label="Academic Year" required>
                <Select required value={form.academic_year} onChange={(e) => setForm((f) => ({ ...f, academic_year: e.target.value, semester: '' }))}>
                  <option value="">Select year…</option>
                  {academicYears.map((a) => <option key={a.id} value={a.id}>{a.name}{a.is_active ? ' ★' : ''}</option>)}
                </Select>
              </Field>
              <Field label="Semester (optional)">
                <Select value={form.semester} onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value }))}>
                  <option value="">None</option>
                  {semesters.map((s) => <option key={s.id} value={s.id}>{s.semester_type}</option>)}
                </Select>
              </Field>
            </div>
          )}

          <Field label="Notes (optional)">
            <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2} placeholder="Optional notes…"
              className="w-full px-3 py-2.5 rounded-sm border border-violet-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 resize-none" />
          </Field>
        </form>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════
          TIME SLOTS MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        open={showSlotPanel}
        onClose={() => setShowSlotPanel(false)}
        title="Bell Periods"
        subtitle={`${timeSlots.length} slots · ${uniquePeriods.length} unique periods`}
        size="lg"
      >
        <div className="flex flex-col md:flex-row min-h-0 max-h-[70vh]">
          <div className="w-full md:w-[340px] p-5 border-b md:border-b-0 md:border-r border-violet-100 bg-violet-50/30 overflow-y-auto shrink-0 space-y-4">
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-violet-800 uppercase tracking-wide">Quick setup</p>
              <button type="button" onClick={() => applyStandardBellSchedule(false)} disabled={savingSlot}
                className="w-full py-2.5 rounded-sm bg-violet-700 text-white text-[10px] font-bold uppercase tracking-wide hover:bg-violet-800 disabled:opacity-50">
                Apply Standard Day (Mon–Fri)
              </button>
              <button type="button" onClick={fillMissingPeriodSlots} disabled={savingSlot || !uniquePeriods.length}
                className="w-full py-2.5 rounded-sm border border-violet-300 bg-white text-violet-800 text-[10px] font-bold uppercase tracking-wide hover:bg-violet-50 disabled:opacity-50">
                Fill Missing Weekday Slots
              </button>
            </div>

            <form onSubmit={saveSlotBulk} className="space-y-4 pt-4 border-t border-violet-200">
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Add one period</p>
              <Field label="Period label">
                <input value={slotForm.label} onChange={(e) => setSlotForm((f) => ({ ...f, label: e.target.value }))}
                  placeholder="e.g. Period 1"
                  className="w-full px-3 py-2 rounded-sm border border-violet-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Start" required>
                  <input required type="time" value={slotForm.start_time} onChange={(e) => setSlotForm((f) => ({ ...f, start_time: e.target.value }))}
                    className="w-full px-3 py-2 rounded-sm border border-violet-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30" />
                </Field>
                <Field label="End" required>
                  <input required type="time" value={slotForm.end_time} onChange={(e) => setSlotForm((f) => ({ ...f, end_time: e.target.value }))}
                    className="w-full px-3 py-2 rounded-sm border border-violet-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30" />
                </Field>
              </div>
              <Field label="Apply to days">
                <div className="flex flex-wrap gap-1.5">
                  {DAYS.map((d) => {
                    const selected = slotForm.days.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setSlotForm((f) => ({
                          ...f,
                          days: selected ? f.days.filter((x) => x !== d) : [...f.days, d],
                        }))}
                        className={`px-2 py-1 rounded-sm text-[10px] font-bold uppercase border transition-colors ${
                          selected ? 'bg-violet-700 text-white border-violet-800' : 'bg-white text-slate-600 border-violet-200 hover:border-violet-400'
                        }`}
                      >
                        {DAY_SHORT[d]}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2 mt-2">
                  <button type="button" onClick={() => setSlotForm((f) => ({ ...f, days: [...WEEKDAYS] }))} className="text-[10px] font-bold text-violet-600 hover:underline">Mon–Fri</button>
                  <button type="button" onClick={() => setSlotForm((f) => ({ ...f, days: [...DAYS] }))} className="text-[10px] font-bold text-violet-600 hover:underline">All days</button>
                </div>
              </Field>
              <button type="submit" disabled={savingSlot}
                className="w-full py-2.5 rounded-sm bg-violet-700 text-white text-[10px] font-bold uppercase tracking-wide hover:bg-violet-800 disabled:opacity-50">
                {savingSlot ? 'Adding…' : `Add to ${slotForm.days.length} day${slotForm.days.length === 1 ? '' : 's'}`}
              </button>
            </form>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-white">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Period overview</p>
              <select value={slotFilterDay} onChange={(e) => setSlotFilterDay(e.target.value)}
                className="px-2 py-1 rounded-sm border border-violet-200 text-[10px] font-bold uppercase bg-white">
                <option value="">All days</option>
                {DAYS.map((d) => <option key={d} value={d}>{DAY_FULL[d]}</option>)}
              </select>
            </div>

            {periodCoverage.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-12">No periods yet. Use quick setup on the left.</p>
            ) : (
              periodCoverage.map((period) => (
                <div key={periodKey(period.start_time, period.end_time)} className="rounded-sm border border-violet-100 p-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{period.start_display} – {period.end_display}</p>
                      {period.label && <p className="text-[10px] text-violet-600 font-semibold">{period.label}</p>}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${
                      period.coveredDays === DAYS.length ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {period.coveredDays}/{DAYS.length} days
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(slotFilterDay ? [slotFilterDay] : DAYS).map((d) => {
                      const has = hasSlotForCell(d, period);
                      const daySlots = sortedSlots.filter(
                        (ts) => ts.day === d && periodKey(ts.start_time, ts.end_time) === periodKey(period.start_time, period.end_time)
                      );
                      return (
                        <div key={d} className={`flex items-center gap-1 px-2 py-1 rounded-sm text-[10px] font-bold border ${
                          has ? 'bg-violet-50 border-violet-200 text-violet-800' : 'bg-slate-50 border-dashed border-slate-200 text-slate-400'
                        }`}>
                          {DAY_SHORT[d]}
                          {daySlots.map((ts) => (
                            <button key={ts.id} type="button" onClick={() => deleteSlot(ts.id, `${DAY_SHORT[d]} ${normalizeTime(ts.start_time)}`)}
                              className="ml-1 text-rose-500 hover:text-rose-700" title="Delete">×</button>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
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
