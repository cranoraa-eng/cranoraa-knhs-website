import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner';

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday'];
const DAY_LABELS = { monday:'Mon', tuesday:'Tue', wednesday:'Wed', thursday:'Thu', friday:'Fri', saturday:'Sat' };
const DAY_FULL = { monday:'Monday', tuesday:'Tuesday', wednesday:'Wednesday', thursday:'Thursday', friday:'Friday', saturday:'Saturday' };

const emptyForm = {
  classroom: '', subject: '', teacher: '', room: '', time_slot: '',
  academic_year: '', semester: '', notes: '', is_active: true,
};

export default function ScheduleManagement() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filterDay, setFilterDay] = useState('');
  const [filterClassroom, setFilterClassroom] = useState('');
  const [conflicts, setConflicts] = useState([]);
  const [activeTab, setActiveTab] = useState('grid');
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [roomForm, setRoomForm] = useState({ name:'', building:'', capacity:40, room_type:'classroom' });
  const [slotForm, setSlotForm] = useState({ day:'monday', start_time:'07:00', end_time:'08:00', label:'' });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [schRes, roomRes, slotRes, clsRes, subRes, tchRes, ayRes] = await Promise.all([
        api.get('/schedules/'),
        api.get('/rooms/'),
        api.get('/time-slots/'),
        api.get('/classrooms/'),
        api.get('/subjects/'),
        api.get('/users/?role=teacher'),
        api.get('/admin/academic-years/'),
      ]);
      setSchedules(schRes.data.results || schRes.data);
      setRooms(roomRes.data.results || roomRes.data);
      setTimeSlots(slotRes.data.results || slotRes.data);
      setClassrooms(clsRes.data.results || clsRes.data);
      setSubjects(subRes.data.results || subRes.data);
      setTeachers(tchRes.data.results || tchRes.data);
      setAcademicYears(ayRes.data.results || ayRes.data);
      setSelectedIds([]); // Clear selection on refresh
    } catch { toast.error('Failed to load schedule data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (form.academic_year) {
      api.get(`/admin/semesters/?academic_year=${form.academic_year}`)
        .then(r => setSemesters(r.data.results || r.data))
        .catch(() => {});
    }
  }, [form.academic_year]);

  const openCreate = (slotId = '', day = '') => {
    setEditItem(null);
    const activeAY = academicYears.find(a => a.is_active);
    setForm({
      ...emptyForm,
      time_slot: slotId || '',
      academic_year: activeAY ? activeAY.id : '',
    });
    setShowForm(true);
  };
  const openEdit = (s) => {
    setEditItem(s);
    setForm({
      classroom: s.classroom, subject: s.subject, teacher: s.teacher,
      room: s.room || '', time_slot: s.time_slot, academic_year: s.academic_year,
      semester: s.semester || '', notes: s.notes || '', is_active: s.is_active,
    });
    setShowForm(true);
  };

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
        toast.success('Schedule created');
      }
      setShowForm(false);
      fetchAll();
    } catch (err) {
      const msg = err.response?.data?.non_field_errors?.[0] || err.response?.data?.detail || 'Failed to save schedule';
      toast.error(msg);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this schedule entry?')) return;
    try {
      await api.delete(`/schedules/${id}/`);
      toast.success('Deleted');
      fetchAll();
    } catch { toast.error('Failed to delete'); }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected schedule(s)?`)) return;
    
    setLoading(true);
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/schedules/${id}/`)));
      toast.success(`Successfully deleted ${selectedIds.length} items`);
      setSelectedIds([]);
      fetchAll();
    } catch {
      toast.error('Failed to delete some items');
      fetchAll();
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = (ids) => {
    if (selectedIds.length === ids.length) setSelectedIds([]);
    else setSelectedIds(ids);
  };

  const checkConflicts = async () => {
    const ay = academicYears.find(a => a.is_active);
    if (!ay) { toast.error('No active academic year found'); return; }
    try {
      const r = await api.get(`/schedules/conflict_check/?academic_year=${ay.id}`);
      setConflicts(r.data.conflicts || []);
      if (r.data.total === 0) toast.success('No conflicts found!');
      else toast.error(`${r.data.total} conflict(s) detected`);
    } catch { toast.error('Conflict check failed'); }
  };

  const saveRoom = async (e) => {
    e.preventDefault();
    try {
      await api.post('/rooms/', roomForm);
      toast.success('Room created');
      setRoomForm({ name:'', building:'', capacity:40, room_type:'classroom' });
      fetchAll();
    } catch { toast.error('Failed to create room'); }
  };

  const handleDeleteRoom = async (id) => {
    if (!window.confirm('Delete this room? This may affect existing schedules.')) return;
    try {
      await api.delete(`/rooms/${id}/`);
      toast.success('Room deleted');
      fetchAll();
    } catch { toast.error('Failed to delete room'); }
  };

  const saveSlot = async (e) => {
    e.preventDefault();
    try {
      await api.post('/time-slots/', slotForm);
      toast.success('Time slot created');
      setSlotForm({ day:'monday', start_time:'07:00', end_time:'08:00', label:'' });
      fetchAll();
    } catch { toast.error('Failed to create time slot'); }
  };

  const handleDeleteSlot = async (id) => {
    if (!window.confirm('Delete this time slot? This may affect existing schedules.')) return;
    try {
      await api.delete(`/time-slots/${id}/`);
      toast.success('Time slot deleted');
      fetchAll();
    } catch { toast.error('Failed to delete time slot'); }
  };

  const filtered = schedules.filter(s => {
    if (filterDay && s.time_slot_detail?.day !== filterDay) return false;
    if (filterClassroom && String(s.classroom) !== String(filterClassroom)) return false;
    return true;
  });

  // Build timetable grid: rows = time slots, cols = days
  const gridData = {};
  DAYS.forEach(d => { gridData[d] = {}; });
  filtered.forEach(s => {
    const d = s.time_slot_detail?.day;
    const slotId = s.time_slot;
    if (d && slotId) {
      if (!gridData[d][slotId]) gridData[d][slotId] = [];
      gridData[d][slotId].push(s);
    }
  });
  const uniqueSlots = [...new Map(timeSlots.map(ts => [ts.id, ts])).values()]
    .sort((a,b) => a.start_time.localeCompare(b.start_time));

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Schedule Management</h2>
          <p className="text-slate-500 text-sm mt-1">Create and manage class timetables</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowRoomModal(true)} className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">+ Room</button>
          <button onClick={() => setShowSlotModal(true)} className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">+ Time Slot</button>
          <button onClick={checkConflicts} className="px-4 py-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 font-bold text-xs uppercase tracking-widest hover:bg-amber-100 transition-all">Check Conflicts</button>
          <button onClick={openCreate} className="px-4 py-2 rounded-xl bg-violet-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-violet-700 shadow-sm transition-all">+ Add Schedule</button>
        </div>
      </div>

      {/* Conflicts Banner */}
      {conflicts.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
          <p className="font-bold text-rose-700 text-sm mb-2">⚠️ {conflicts.length} Conflict(s) Detected</p>
          {conflicts.map((c,i) => <p key={i} className="text-xs text-rose-600">{c.description}</p>)}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {['grid','list'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab===t ? 'border-violet-600 text-violet-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
            {t === 'grid' ? 'Timetable Grid' : 'List View'}
          </button>
        ))}
      </div>

      {/* Filters & Bulk Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <select value={filterDay} onChange={e => setFilterDay(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-violet-300">
            <option value="">All Days</option>
            {DAYS.map(d => <option key={d} value={d}>{DAY_FULL[d]}</option>)}
          </select>
          <select value={filterClassroom} onChange={e => setFilterClassroom(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-violet-300">
            <option value="">All Classrooms</option>
            {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{selectedIds.length} selected</span>
            <button 
              onClick={handleBulkDelete}
              className="px-4 py-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 font-bold text-xs uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center gap-2"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Delete Selected
            </button>
          </div>
        )}
      </div>

      {/* Timetable Grid */}
      {activeTab === 'grid' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-0 min-w-[700px]">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 w-28">Time</th>
                  {DAYS.map(d => (
                    <th key={d} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                      {DAY_FULL[d]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {uniqueSlots.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">No time slots defined yet. Add time slots to build the grid.</td></tr>
                ) : uniqueSlots.map(slot => (
                  <tr key={slot.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-3 align-top">
                      <p className="text-xs font-black text-slate-700">{slot.start_time?.slice(0,5)}</p>
                      <p className="text-[10px] text-slate-400">{slot.end_time?.slice(0,5)}</p>
                      {slot.label && <p className="text-[9px] text-violet-500 font-bold mt-0.5">{slot.label}</p>}
                    </td>
                    {DAYS.map(d => {
                      const entries = gridData[d]?.[slot.id] || [];
                      return (
                        <td 
                          key={d} 
                          className="px-2 py-2 align-top min-w-[140px] border-r border-slate-50 group/cell relative hover:bg-violet-50/20 transition-colors cursor-pointer"
                          onClick={(e) => {
                            if (e.target === e.currentTarget) openCreate(slot.id);
                          }}
                        >
                          {entries.map(s => (
                            <div key={s.id} className="mb-2 p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm group relative hover:border-violet-300 hover:shadow-md transition-all">
                              <div className="flex justify-between items-start gap-1">
                                <p className="text-[10px] font-black text-violet-700 leading-tight mb-1 uppercase tracking-tight">{s.subject_code}</p>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={(e) => { e.stopPropagation(); openEdit(s); }} className="p-1 rounded bg-violet-50 text-violet-600 hover:bg-violet-100">
                                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                  </button>
                                </div>
                              </div>
                              <p className="text-[10px] font-bold text-slate-800 line-clamp-1">{s.subject_name}</p>
                              <p className="text-[9px] text-slate-500 mt-1 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>
                                {s.classroom_name}
                              </p>
                              {s.room_name && (
                                <p className="text-[9px] text-slate-400 mt-0.5 flex items-center gap-1">
                                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                  {s.room_name}
                                </p>
                              )}
                              
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }} 
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 hover:bg-rose-600 transition-all scale-75 group-hover:scale-100"
                                title="Delete"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </div>
                          ))}
                          
                          {/* Quick Add Button */}
                          <button 
                            onClick={(e) => { e.stopPropagation(); openCreate(slot.id); }}
                            className="w-full py-2 border-2 border-dashed border-slate-100 rounded-xl text-slate-300 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 hover:border-violet-200 hover:text-violet-400 hover:bg-violet-50/30 transition-all"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* List View */}
      {activeTab === 'list' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input 
                      type="checkbox" 
                      checked={filtered.length > 0 && selectedIds.length === filtered.length}
                      onChange={() => toggleSelectAll(filtered.map(s => s.id))}
                      className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                    />
                  </th>
                  {['Day & Time','Classroom','Subject','Teacher','Room','Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">No schedules found.</td></tr>
                ) : filtered.map(s => (
                  <tr key={s.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.includes(s.id) ? 'bg-violet-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(s.id)}
                        onChange={() => toggleSelect(s.id)}
                        className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-bold text-slate-800">{s.time_slot_detail ? DAY_FULL[s.time_slot_detail.day] : '—'}</p>
                      <p className="text-[10px] text-slate-400">{s.time_slot_detail?.start_time_display} – {s.time_slot_detail?.end_time_display}</p>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-700">{s.classroom_name}</td>
                    <td className="px-4 py-3"><p className="text-xs font-bold text-slate-800">{s.subject_name}</p><p className="text-[10px] text-slate-400">{s.subject_code}</p></td>
                    <td className="px-4 py-3 text-xs text-slate-600">{s.teacher_name}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{s.room_name || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg text-violet-600 hover:bg-violet-50 transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                        <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Schedule Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{editItem ? 'Edit Schedule' : 'New Schedule'}</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Assignment Details</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-full hover:bg-slate-200 text-slate-400 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 overflow-y-auto space-y-8">
              {/* Primary Assignment */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">Core Assignment</h4>
                  <div className="h-px w-full bg-slate-100"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Classroom *</label>
                    <select required value={form.classroom} onChange={e => setForm(f=>({...f, classroom:e.target.value}))} 
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 transition-all shadow-sm">
                      <option value="">Select Classroom</option>
                      {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Subject *</label>
                    <select required value={form.subject} onChange={e => setForm(f=>({...f, subject:e.target.value}))} 
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 transition-all shadow-sm">
                      <option value="">Select Subject</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.code} – {s.name}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Assigned Teacher *</label>
                    <select required value={form.teacher} onChange={e => setForm(f=>({...f, teacher:e.target.value}))} 
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 transition-all shadow-sm">
                      <option value="">Select Teacher</option>
                      {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name || `${t.first_name} ${t.last_name}`}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Placement & Timing */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">Timing & Placement</h4>
                  <div className="h-px w-full bg-slate-100"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Time Slot *</label>
                    <select required value={form.time_slot} onChange={e => setForm(f=>({...f, time_slot:e.target.value}))} 
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 transition-all shadow-sm">
                      <option value="">Select Time</option>
                      {timeSlots.map(ts => <option key={ts.id} value={ts.id}>{DAY_FULL[ts.day]} {ts.start_time_display} – {ts.end_time_display}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Room (Optional)</label>
                    <select value={form.room} onChange={e => setForm(f=>({...f, room:e.target.value}))} 
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 transition-all shadow-sm">
                      <option value="">No Room Assigned</option>
                      {rooms.map(r => <option key={r.id} value={r.id}>{r.name}{r.building ? ` (${r.building})` : ''}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Context */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">Academic Context</h4>
                  <div className="h-px w-full bg-slate-100"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Academic Year *</label>
                    <select required value={form.academic_year} onChange={e => setForm(f=>({...f, academic_year:e.target.value, semester:''}))} 
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 transition-all shadow-sm">
                      <option value="">Select Year</option>
                      {academicYears.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Semester (Optional)</label>
                    <select value={form.semester} onChange={e => setForm(f=>({...f, semester:e.target.value}))} 
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 transition-all shadow-sm">
                      <option value="">No Semester</option>
                      {semesters.map(s => <option key={s.id} value={s.id}>{s.semester_type}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Notes</label>
                    <textarea value={form.notes} onChange={e => setForm(f=>({...f, notes:e.target.value}))} rows={2} 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 transition-all shadow-sm resize-none" placeholder="Add any special instructions or notes..." />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowForm(false)} 
                  className="flex-1 px-6 py-3.5 rounded-xl border border-slate-200 text-slate-600 font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={saving} 
                  className="flex-[2] px-6 py-3.5 rounded-xl bg-violet-600 text-white font-black text-[11px] uppercase tracking-widest hover:bg-violet-700 disabled:opacity-50 transition-all shadow-lg shadow-violet-200 flex items-center justify-center gap-2">
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <span>{editItem ? 'Update Schedule' : 'Create Schedule'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Room Modal */}
      {showRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">Manage Rooms</h3>
              <button onClick={() => setShowRoomModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-8">
              {/* Add Room Form */}
              <form onSubmit={saveRoom} className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Add New Room</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Room Name *</label>
                    <input required value={roomForm.name} onChange={e => setRoomForm(f=>({...f, name:e.target.value}))} 
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 transition-all" placeholder="e.g. Room 204" />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Building</label>
                    <input value={roomForm.building} onChange={e => setRoomForm(f=>({...f, building:e.target.value}))} 
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 transition-all" placeholder="e.g. Science Bldg" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Type</label>
                    <select value={roomForm.room_type} onChange={e => setRoomForm(f=>({...f, room_type:e.target.value}))} 
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 transition-all">
                      <option value="classroom">Classroom</option>
                      <option value="laboratory">Laboratory</option>
                      <option value="gym">Gymnasium</option>
                      <option value="library">Library</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="w-full py-2.5 rounded-xl bg-violet-600 text-white font-black text-[11px] uppercase tracking-widest hover:bg-violet-700 transition-all shadow-md shadow-violet-200">
                  Save Room
                </button>
              </form>

              {/* Room List */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Existing Rooms</h4>
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                  {rooms.length === 0 ? (
                    <p className="p-4 text-center text-xs text-slate-400 italic">No rooms added yet</p>
                  ) : rooms.map(r => (
                    <div key={r.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{r.name}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">{r.building || 'No Building'} • {r.room_type}</p>
                      </div>
                      <button onClick={() => handleDeleteRoom(r.id)} 
                        className="p-2 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Time Slot Modal */}
      {showSlotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">Manage Time Slots</h3>
              <button onClick={() => setShowSlotModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-8">
              {/* Add Slot Form */}
              <form onSubmit={saveSlot} className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Add New Time Slot</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Day *</label>
                    <select required value={slotForm.day} onChange={e => setSlotForm(f=>({...f, day:e.target.value}))} 
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 transition-all">
                      {DAYS.map(d => <option key={d} value={d}>{DAY_FULL[d]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Start *</label>
                    <input required type="time" value={slotForm.start_time} onChange={e => setSlotForm(f=>({...f, start_time:e.target.value}))} 
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">End *</label>
                    <input required type="time" value={slotForm.end_time} onChange={e => setSlotForm(f=>({...f, end_time:e.target.value}))} 
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 transition-all" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Label</label>
                    <input value={slotForm.label} onChange={e => setSlotForm(f=>({...f, label:e.target.value}))} 
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 transition-all" placeholder="e.g. 1st Period" />
                  </div>
                </div>
                <button type="submit" className="w-full py-2.5 rounded-xl bg-violet-600 text-white font-black text-[11px] uppercase tracking-widest hover:bg-violet-700 transition-all shadow-md shadow-violet-200">
                  Save Time Slot
                </button>
              </form>

              {/* Slot List */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Existing Slots</h4>
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                  {timeSlots.length === 0 ? (
                    <p className="p-4 text-center text-xs text-slate-400 italic">No slots added yet</p>
                  ) : timeSlots.sort((a,b) => a.start_time.localeCompare(b.start_time)).map(ts => (
                    <div key={ts.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800">{ts.label || 'Unnamed Slot'}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">{DAY_LABELS[ts.day]} • {ts.start_time_display} – {ts.end_time_display}</p>
                      </div>
                      <button onClick={() => handleDeleteSlot(ts.id)} 
                        className="p-2 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
