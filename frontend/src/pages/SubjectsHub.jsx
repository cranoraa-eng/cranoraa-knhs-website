import { useState, useMemo, useCallback } from 'react';
import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { useParallelFetch } from '../hooks/useFetch';
import { LoadingSpinner, EmptyState, Button, Badge } from '../components/ui';

const GRADE_LEVELS = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
const EMPTY_SUBJECT = { name: '', code: '', description: '', grade_level: '' };

function SubjectsTab() {
  const navigate = useNavigate();
  const { data, loading, refetch } = useParallelFetch({
    subjects: '/subjects/',
  });
  const subjects = useMemo(() => Array.isArray(data.subjects) ? data.subjects : [], [data.subjects]);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_SUBJECT);
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('');

  const openCreate = () => { setEditing(null); setForm(EMPTY_SUBJECT); setShowModal(true); };
  const openEdit = (s) => { setEditing(s); setForm({ name: s.name, code: s.code, description: s.description || '', grade_level: s.grade_level }); setShowModal(true); };

  const handleDelete = async (subject) => {
    const result = await Swal.fire({ title: 'Delete Subject?', text: `"${subject.name}" will be permanently removed.`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#6b7280', confirmButtonText: 'Delete' });
    if (!result.isConfirmed) return;
    try { await api.delete(`/subjects/${subject.id}/`); toast.success('Subject deleted'); refetch(); } catch { toast.error('Failed to delete subject'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Subject name is required');
    if (!form.code.trim()) return toast.error('Subject code is required');
    if (!form.grade_level) return toast.error('Grade level is required');
    setSaving(true);
    try {
      if (editing) { await api.patch(`/subjects/${editing.id}/`, form); toast.success('Subject updated'); }
      else { await api.post('/subjects/', form); toast.success('Subject created'); }
      setShowModal(false); refetch();
    } catch (err) {
      toast.error(err.response?.data?.code?.[0] || err.response?.data?.detail || 'Failed to save subject');
    } finally { setSaving(false); }
  };

  const gradeLevels = useMemo(() => [...new Set(subjects.map(s => s.grade_level))].sort((a, b) => (parseInt(a.replace(/\D/g, '')) || 999) - (parseInt(b.replace(/\D/g, '')) || 999)), [subjects]);

  const filtered = useMemo(() => subjects.filter(s => {
    const q = search.toLowerCase();
    return (!q || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)) && (!filterLevel || s.grade_level === filterLevel);
  }), [subjects, search, filterLevel]);

  const grouped = useMemo(() => filtered.reduce((acc, s) => { const key = s.grade_level || 'Unassigned'; if (!acc[key]) acc[key] = []; acc[key].push(s); return acc; }, {}), [filtered]);

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner /></div>;

  return (
    <div className="page-bottom-safe bg-slate-50/50">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">Subjects</h1>
          <p className="text-xs text-slate-500 mt-1">{subjects.length} subjects in the curriculum</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/classes')} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            View Sections
          </button>
          <Button variant="primary" onClick={openCreate}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            Add Subject
          </Button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Search by name or code..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 transition-all" />
          </div>
          <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} className="px-4 py-2.5 border border-slate-300 rounded-md bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 transition-all">
            <option value="">All Grade Levels</option>
            {gradeLevels.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12">
          <EmptyState icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332-.477-4.5-1.253" /></svg>} title="No Subjects Found" message={search || filterLevel ? 'Try adjusting your filters' : 'Add your first subject to get started'} />
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).sort(([a], [b]) => (parseInt(a.replace(/\D/g, '')) || 999) - (parseInt(b.replace(/\D/g, '')) || 999)).map(([level, items]) => (
            <div key={level} className="bg-white border border-slate-200 rounded-xl border-l-4 border-l-violet-500 overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-violet-100 flex items-center justify-center font-extrabold text-sm text-violet-700 border border-violet-200">{parseInt(level.replace(/\D/g, '')) || level.charAt(0)}</div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">{level}</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{items.length} Subjects</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-xs font-extrabold text-slate-700 uppercase tracking-wider w-32">Code</th>
                      <th className="px-4 py-3 text-xs font-extrabold text-slate-700 uppercase tracking-wider">Subject Name</th>
                      <th className="hidden md:table-cell px-4 py-3 text-xs font-extrabold text-slate-700 uppercase tracking-wider">Description</th>
                      <th className="px-4 py-3 text-xs font-extrabold text-slate-700 uppercase tracking-wider text-center w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3"><Badge variant="blue" className="font-mono">{s.code}</Badge></td>
                        <td className="px-4 py-3"><span className="text-sm font-bold text-slate-900">{s.name}</span></td>
                        <td className="hidden md:table-cell px-4 py-3 text-sm text-slate-600 max-w-xs"><span className="line-clamp-1">{s.description || <span className="italic text-slate-400">No description</span>}</span></td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button variant="secondary" size="sm" onClick={() => openEdit(s)}>Edit</Button>
                            <Button variant="danger" size="sm" onClick={() => handleDelete(s)}>Delete</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          <p className="text-xs text-slate-500 font-semibold text-center">{filtered.length} entries · {Object.keys(grouped).length} grade levels</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white w-full max-w-lg border border-gray-300 shadow-2xl rounded-sm flex flex-col max-h-[92vh]" onClick={e => e.stopPropagation()}>
            <div className="bg-[#5e2a84] flex items-center justify-between px-5 py-3 flex-shrink-0 border-b-2 border-violet-900">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 rounded-full bg-white/20 border border-white/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332-.477-4.5-1.253" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-widest leading-none">{editing ? 'Edit Subject' : 'New Subject'}</h2>
                  <p className="text-violet-200 text-[10px] mt-0.5 font-medium uppercase tracking-wide">Subject Management</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)}
                className="ml-4 w-7 h-7 flex items-center justify-center rounded text-white/60 hover:bg-white/20 hover:text-white transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Subject Code <span className="text-red-500">*</span></label>
                    <input type="text" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. MATH7" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Grade Level <span className="text-red-500">*</span></label>
                    <select value={form.grade_level} onChange={e => setForm({ ...form, grade_level: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500" required>
                      <option value="">— Select —</option>
                      {GRADE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject Name <span className="text-red-500">*</span></label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Mathematics" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                  <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief subject overview (optional)" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 resize-none" />
                </div>
              </div>
              <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3 flex-shrink-0">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 sm:px-6 py-2.5 bg-white text-gray-700 text-xs font-black uppercase tracking-widest border border-gray-300 hover:bg-gray-100 rounded-sm">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="px-4 sm:px-6 py-2.5 bg-[#5e2a84] text-white text-xs font-black uppercase tracking-widest hover:bg-violet-700 rounded-sm disabled:opacity-50">
                  {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AssignmentsTab() {
  const navigate = useNavigate();
  const { data, loading, refetch } = useParallelFetch({
    assignments: '/classroom-subjects/',
    classrooms: '/classrooms/',
    subjects: '/subjects/',
    teachers: '/users/?role=staff',
  });
  const assignments = useMemo(() => data.assignments?.results || data.assignments || [], [data.assignments]);
  const classrooms = useMemo(() => data.classrooms?.results || data.classrooms || [], [data.classrooms]);
  const subjects = useMemo(() => Array.isArray(data.subjects) ? data.subjects : [], [data.subjects]);
  const teachers = useMemo(() => Array.isArray(data.teachers) ? data.teachers : [], [data.teachers]);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterClassroom, setFilterClassroom] = useState('');
  const [form, setForm] = useState({ classroom: '', subject: '', teacher: '' });

  const openCreate = () => { setEditing(null); setForm({ classroom: '', subject: '', teacher: '' }); setShowModal(true); };
  const openEdit = (a) => { setEditing(a); setForm({ classroom: a.classroom, subject: a.subject, teacher: a.teacher }); setShowModal(true); };

  const handleDelete = async (assignment) => {
    const result = await Swal.fire({ title: 'Remove Assignment?', text: `Remove "${assignment.subject_name}" from "${assignment.classroom_name}"?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#6b7280', confirmButtonText: 'Remove' });
    if (!result.isConfirmed) return;
    try { await api.delete(`/classroom-subjects/${assignment.id}/`); toast.success('Assignment removed'); refetch(); } catch { toast.error('Failed to remove assignment'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.classroom) return toast.error('Section is required');
    if (!form.subject) return toast.error('Subject is required');
    if (!form.teacher) return toast.error('Teacher is required');
    setSaving(true);
    const payload = { classroom: parseInt(form.classroom), subject: parseInt(form.subject), teacher: parseInt(form.teacher) };
    try {
      if (editing) { await api.patch(`/classroom-subjects/${editing.id}/`, payload); toast.success('Assignment updated'); }
      else { await api.post('/classroom-subjects/', payload); toast.success('Assignment created'); }
      setShowModal(false); refetch();
    } catch (err) {
      const msg = err.response?.data?.detail || Object.values(err.response?.data || {})[0]?.[0] || 'Failed to save assignment';
      toast.error(msg);
    } finally { setSaving(false); }
  };

  const filtered = useMemo(() => assignments.filter(a => {
    const q = search.toLowerCase();
    return (!q || a.subject_name?.toLowerCase().includes(q) || a.subject_code?.toLowerCase().includes(q) || a.classroom_name?.toLowerCase().includes(q) || a.teacher_name?.toLowerCase().includes(q)) && (!filterClassroom || String(a.classroom) === filterClassroom);
  }), [assignments, search, filterClassroom]);

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner /></div>;

  return (
    <div className="page-bottom-safe bg-slate-50/50">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">Subject Assignments</h1>
          <p className="text-xs text-slate-500 mt-1">{assignments.length} assignments across {classrooms.length} sections</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/classes')} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            View Sections
          </button>
          <Button variant="primary" onClick={openCreate}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            Assign Subject
          </Button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Search by subject, section, or teacher..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 transition-all" />
          </div>
          <select value={filterClassroom} onChange={e => setFilterClassroom(e.target.value)} className="px-4 py-2.5 border border-slate-300 rounded-md bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 transition-all">
            <option value="">All Sections</option>
            {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12">
          <EmptyState icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>} title="No Assignments Found" message={search || filterClassroom ? 'Try adjusting your filters' : 'Assign subjects to sections to get started'} />
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-xs font-extrabold text-slate-700 uppercase tracking-wider">Section</th>
                  <th className="px-4 py-3 text-xs font-extrabold text-slate-700 uppercase tracking-wider">Subject</th>
                  <th className="px-4 py-3 text-xs font-extrabold text-slate-700 uppercase tracking-wider">Teacher</th>
                  <th className="px-4 py-3 text-xs font-extrabold text-slate-700 uppercase tracking-wider text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3"><span className="text-sm font-bold text-slate-900">{a.classroom_name}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="blue" className="font-mono text-[10px]">{a.subject_code}</Badge>
                        <span className="text-sm font-semibold text-slate-700">{a.subject_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className="text-sm text-slate-600">{a.teacher_name || '—'}</span></td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="secondary" size="sm" onClick={() => openEdit(a)}>Edit</Button>
                        <Button variant="danger" size="sm" onClick={() => handleDelete(a)}>Remove</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50">
            <p className="text-xs text-slate-500 font-semibold">{filtered.length} assignments</p>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white w-full max-w-lg border border-gray-300 shadow-2xl rounded-sm flex flex-col max-h-[92vh]" onClick={e => e.stopPropagation()}>
            <div className="bg-[#5e2a84] flex items-center justify-between px-5 py-3 flex-shrink-0 border-b-2 border-violet-900">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 rounded-full bg-white/20 border border-white/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-widest leading-none">{editing ? 'Edit Assignment' : 'New Assignment'}</h2>
                  <p className="text-violet-200 text-[10px] mt-0.5 font-medium uppercase tracking-wide">Subject Assignments</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)}
                className="ml-4 w-7 h-7 flex items-center justify-center rounded text-white/60 hover:bg-white/20 hover:text-white transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Section <span className="text-red-500">*</span></label>
                    <select value={form.classroom} onChange={e => setForm({ ...form, classroom: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500" required>
                      <option value="">— Select —</option>
                      {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Subject <span className="text-red-500">*</span></label>
                    <select value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500" required>
                      <option value="">— Select —</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Teacher <span className="text-red-500">*</span></label>
                  <select value={form.teacher} onChange={e => setForm({ ...form, teacher: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500" required>
                    <option value="">— Select —</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                  </select>
                </div>
              </div>
              <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3 flex-shrink-0">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 sm:px-6 py-2.5 bg-white text-gray-700 text-xs font-black uppercase tracking-widest border border-gray-300 hover:bg-gray-100 rounded-sm">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="px-4 sm:px-6 py-2.5 bg-[#5e2a84] text-white text-xs font-black uppercase tracking-widest hover:bg-violet-700 rounded-sm disabled:opacity-50">
                  {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const tabs = [
  { id: 'subjects',    label: 'Subjects',    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332-.477-4.5-1.253" /></svg> },
  { id: 'assignments', label: 'Assignments', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
];

const SubjectsHub = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabId = searchParams.get('tab') || 'subjects';
  const setTab = (id) => {
    const p = new URLSearchParams(searchParams);
    p.set('tab', id);
    setSearchParams(p);
  };

  return (
    <div className="page-bottom-safe bg-slate-50 min-h-screen">
      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#5e2a84] flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332-.477-4.5-1.253" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Subject Management</h1>
              <p className="text-xs font-semibold text-violet-600 uppercase tracking-wide">Curriculum subjects & section assignments</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTabId === tab.id ? 'bg-violet-600 text-white' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}>
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 py-4">
        {activeTabId === 'subjects'    && <SubjectsTab />}
        {activeTabId === 'assignments' && <AssignmentsTab />}
      </div>
    </div>
  );
};

export default SubjectsHub;
