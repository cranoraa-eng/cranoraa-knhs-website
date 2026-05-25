import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { useScrollLock } from '../hooks/useScrollLock';
import { Modal } from '../components/ui/Modal';

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

  useScrollLock(showModal);

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
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Subject Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">{subjects.length} subjects in the curriculum</p>
        </div>
        <button onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 active:scale-95 transition-all shadow-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add Subject
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Search by name or code…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 focus:bg-white transition-all" />
          </div>
          <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all">
            <option value="">All Grade Levels</option>
            {gradeLevels.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-48 gap-4">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-2 border-slate-100" />
            <div className="absolute inset-0 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-700 mb-1">No subjects found</h3>
            <p className="text-sm text-slate-400">
              {search || filterLevel ? 'Try adjusting your filters.' : 'Add your first subject to get started.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).sort(([a], [b]) => {
            const numA = parseInt(a.replace(/\D/g, '')) || 999;
            const numB = parseInt(b.replace(/\D/g, '')) || 999;
            return numA - numB;
          }).map(([level, items]) => (
            <div key={level} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              {/* Group header */}
              <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center font-black text-xs text-violet-700">
                    {parseInt(level.replace(/\D/g, '')) || level.charAt(0)}
                  </div>
                  <div>
                    <span className="font-black text-sm text-slate-800">{level}</span>
                    <span className="ml-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{items.length} subjects</span>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] w-32">Code</th>
                      <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Subject Name</th>
                      <th className="hidden md:table-cell px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Description</th>
                      <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] text-center w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map(s => (
                      <tr key={s.id} className="hover:bg-violet-50/40 transition-colors group">
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-xs font-black text-violet-700 bg-violet-50 px-2 py-0.5 rounded-lg border border-violet-100">
                            {s.code}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-bold text-slate-800">{s.name}</span>
                        </td>
                        <td className="hidden md:table-cell px-5 py-3.5 text-sm text-slate-500 max-w-xs">
                          <span className="line-clamp-1">{s.description || <span className="italic text-slate-300 text-xs">No description</span>}</span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => openEdit(s)} title="Edit"
                              className="px-3 py-1.5 text-xs font-bold text-violet-700 bg-violet-100 hover:bg-violet-600 hover:text-white rounded-lg transition-all active:scale-90 no-min">
                              Edit
                            </button>
                            <button onClick={() => handleDelete(s)} title="Delete"
                              className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-500 hover:text-white rounded-lg transition-all active:scale-90 no-min">
                              Delete
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

      {/* Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Update Subject' : 'New Subject'}
        subtitle="Subject Curriculum Details"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
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
      </Modal>
    </div>
  );
};

export default Subjects;
