import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const GRADE_LEVELS = [
  'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10',
  'Grade 11', 'Grade 12',
];

const EMPTY_FORM = { name: '', code: '', description: '', grade_level: '' };

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('');

  useEffect(() => { fetchSubjects(); }, []);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await api.get('/subjects/');
      setSubjects(res.data);
    } catch {
      toast.error('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (subject) => {
    setEditing(subject);
    setForm({
      name: subject.name,
      code: subject.code,
      description: subject.description || '',
      grade_level: subject.grade_level,
    });
    setShowModal(true);
  };

  const handleDelete = async (subject) => {
    const result = await Swal.fire({
      title: 'Delete Subject?',
      text: `"${subject.name}" will be permanently removed. This may affect classrooms using this subject.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Delete',
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/subjects/${subject.id}/`);
      toast.success('Subject deleted');
      fetchSubjects();
    } catch {
      toast.error('Failed to delete subject');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Subject name is required');
    if (!form.code.trim()) return toast.error('Subject code is required');
    if (!form.grade_level) return toast.error('Grade level is required');
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/subjects/${editing.id}/`, form);
        toast.success('Subject updated');
      } else {
        await api.post('/subjects/', form);
        toast.success('Subject created');
      }
      setShowModal(false);
      fetchSubjects();
    } catch (err) {
      const msg = err.response?.data?.code?.[0] || err.response?.data?.detail || 'Failed to save subject';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // Unique grade levels from data for filter
  const gradeLevels = [...new Set(subjects.map(s => s.grade_level))]
    .sort((a, b) => (parseInt(a.replace(/\D/g, '')) || 999) - (parseInt(b.replace(/\D/g, '')) || 999));

  const filtered = subjects.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
    const matchLevel = !filterLevel || s.grade_level === filterLevel;
    return matchSearch && matchLevel;
  });

  // Group by grade level for display
  const grouped = filtered.reduce((acc, s) => {
    const key = s.grade_level || 'Unassigned';
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  return (
    <div className="overflow-y-auto h-[calc(100vh-4rem)] p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="text-center md:text-left">
          <h1 className="text-xl md:text-3xl font-black text-slate-800 uppercase tracking-widest">Subject Management</h1>
          <p className="text-[10px] md:text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">
            {subjects.length} subjects in the curriculum
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] md:text-sm font-black py-2.5 md:py-2 px-6 md:px-4 rounded-lg md:rounded-xl transition-all hover:scale-105 active:scale-95 shadow-sm w-full md:w-auto uppercase tracking-widest"
        >
          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
          </svg>
          Add Subject
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-5">
        <div className="relative flex-1 md:max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="SEARCH BY NAME OR CODE..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all"
          />
        </div>
        <select
          value={filterLevel}
          onChange={e => setFilterLevel(e.target.value)}
          className="w-full md:w-auto px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-10 shadow-sm"
        >
          <option value="">ALL GRADE LEVELS</option>
          {gradeLevels.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-12 md:p-16 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-sm md:text-xl font-black text-slate-700 uppercase tracking-widest mb-2">No Subjects Found</h3>
          <p className="text-[10px] md:text-sm text-slate-400 font-bold uppercase tracking-widest max-w-xs mx-auto leading-relaxed">
            {search || filterLevel ? 'Adjust your search or level filters.' : 'Final subjects will appear here once added.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4 md:space-y-6">
          {Object.entries(grouped).sort(([a], [b]) => {
            const numA = parseInt(a.replace(/\D/g, '')) || 999;
            const numB = parseInt(b.replace(/\D/g, '')) || 999;
            return numA - numB;
          }).map(([level, items]) => (
            <div key={level} className="bg-white border border-slate-200 rounded-xl md:rounded-2xl shadow-sm overflow-hidden">
              {/* Group header */}
              <div className="flex items-center justify-between px-4 md:px-6 py-2.5 md:py-3.5 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-indigo-50 flex items-center justify-center font-black text-[9px] md:text-xs text-indigo-600 border border-indigo-100">
                    {(parseInt(level.replace(/\D/g, '')) || level.charAt(0))}
                  </div>
                  <div className="text-left">
                    <span className="font-black text-xs md:text-base text-slate-800 uppercase tracking-widest">{level}</span>
                    <div className="text-[7px] md:text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">{items.length} Subjects</div>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
                <table className="w-full text-[10px] md:text-sm">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="text-left px-4 py-2 md:py-3 text-[8px] md:text-xs font-black text-slate-400 uppercase tracking-widest w-1/4">Code</th>
                      <th className="text-left px-4 py-2 md:py-3 text-[8px] md:text-xs font-black text-slate-400 uppercase tracking-widest w-1/2">Subject Name</th>
                      <th className="hidden md:table-cell text-center px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Description</th>
                      <th className="text-center px-4 py-2 md:py-3 text-[8px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map(s => (
                      <tr key={s.id} className="hover:bg-indigo-50/30 transition-colors group/row">
                        <td className="px-4 py-2.5 md:py-4">
                          <span className="font-mono text-[9px] md:text-sm font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                            {s.code}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 md:py-4">
                          <div className="font-black text-slate-700 uppercase tracking-tight text-[9px] md:text-sm truncate max-w-[120px] md:max-w-none" title={s.name}>{s.name}</div>
                        </td>
                        <td className="hidden md:table-cell px-6 py-4 text-sm text-slate-500 max-w-xs">
                          <span className="line-clamp-1">{s.description || <span className="italic text-slate-300">No description</span>}</span>
                        </td>
                        <td className="px-4 py-2.5 md:py-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 md:gap-2">
                            <button
                              onClick={() => openEdit(s)}
                              className="p-1.5 md:px-3 md:py-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white rounded-lg transition-all active:scale-95 shadow-sm"
                              title="Edit Subject"
                            >
                              <svg className="w-3 h-3 md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              <span className="hidden md:inline font-black text-[10px] uppercase tracking-widest">Edit</span>
                            </button>
                            <button
                              onClick={() => handleDelete(s)}
                              className="p-1.5 md:px-3 md:py-1.5 text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white rounded-lg transition-all active:scale-95 shadow-sm"
                              title="Delete Subject"
                            >
                              <svg className="w-3 h-3 md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              <span className="hidden md:inline font-black text-[10px] uppercase tracking-widest">Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <p className="text-[9px] md:text-sm text-slate-400 mt-4 font-black uppercase tracking-widest text-center md:text-left">
          {filtered.length} entries · {Object.keys(grouped).length} grade levels
        </p>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 md:p-6 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h2 className="text-sm md:text-xl font-black text-slate-800 uppercase tracking-widest">
                  {editing ? 'Update Subject' : 'New Subject'}
                </h2>
                <p className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">Subject Curriculum Details</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Subject Code <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="E.G. MATH7"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-[11px] md:text-sm font-black uppercase tracking-widest transition-all"
                    required
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Grade Level <span className="text-rose-500">*</span></label>
                  <select
                    value={form.grade_level}
                    onChange={e => setForm({ ...form, grade_level: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-[11px] md:text-sm font-black uppercase tracking-widest transition-all cursor-pointer"
                    required
                  >
                    <option value="">SELECT LEVEL</option>
                    {GRADE_LEVELS.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Subject Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="E.G. MATHEMATICS"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-[11px] md:text-sm font-black uppercase tracking-widest transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Description <span className="text-slate-300 font-normal tracking-normal">(OPTIONAL)</span></label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="BRIEF SUBJECT OVERVIEW..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-[11px] md:text-sm font-bold transition-all resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-[11px] md:text-sm font-black py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest shadow-lg shadow-indigo-200"
                >
                  {saving ? 'PROCESSING...' : editing ? 'SAVE CHANGES' : 'CREATE SUBJECT'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] md:text-sm font-black py-3 rounded-xl transition-all uppercase tracking-widest"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subjects;
