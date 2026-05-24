import { useState, useEffect } from 'react';
import api from '../utils/api';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { useScrollLock } from '../hooks/useScrollLock';
import { getCurrentAcademicYear } from '../utils/dateHelpers';

const GRADE_LEVELS = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

const gradeNum = (name = '') => {
  const m = name.match(/\d+/);
  return m ? parseInt(m[0]) : 999;
};

const ClassManagement = () => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [formData, setFormData] = useState({
    name: '', teacher: '', grade_level: '', academic_year: ''
  });

  useScrollLock(showModal);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [classRes, teacherRes, yearRes] = await Promise.all([
        api.get('/classrooms/'),
        api.get('/users/?role=teacher'),
        api.get('/admin/academic-years/'),
      ]);
      setClasses(classRes.data);
      setTeachers(teacherRes.data);
      // Sort years newest first
      const years = [...yearRes.data].sort((a, b) => b.name.localeCompare(a.name));
      setAcademicYears(years);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingClass(null);
    // Default to the active academic year or current year
    const activeYear = academicYears.find(y => y.is_active);
    setFormData({
      name: '',
      teacher: '',
      grade_level: '',
      academic_year: activeYear?.id || ''
    });
    setShowModal(true);
  };

  const openEdit = (cls) => {
    setEditingClass(cls);
    setFormData({
      name: cls.name,
      teacher: cls.teacher || '',
      grade_level: cls.grade_level || '',
      academic_year: cls.academic_year || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (cls) => {
    const result = await Swal.fire({
      title: 'Delete Class?',
      text: `"${cls.name}" and all its data will be permanently removed.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete',
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/classrooms/${cls.id}/`);
      toast.success('Class deleted');
      fetchAll();
    } catch {
      toast.error('Failed to delete class');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Class name is required');
    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        teacher: formData.teacher || null,
        grade_level: formData.grade_level,
        academic_year: formData.academic_year || null,
      };
      if (editingClass) {
        await api.patch(`/classrooms/${editingClass.id}/`, payload);
        toast.success('Class updated');
      } else {
        await api.post('/classrooms/', payload);
        toast.success('Class created');
      }
      setShowModal(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || err.response?.data?.teacher?.[0] || 'Failed to save class');
    } finally {
      setSaving(false);
    }
  };

  // Filter
  const filtered = classes.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || (c.teacher_name || '').toLowerCase().includes(q);
    const matchLevel = !filterLevel || c.name.toLowerCase().includes(filterLevel.toLowerCase());
    return matchSearch && matchLevel;
  });

  // Group by grade level field, sorted 7→12
  const grouped = filtered.reduce((acc, cls) => {
    const level = cls.grade_level || GRADE_LEVELS.find(l => cls.name.toLowerCase().includes(l.toLowerCase())) || 'Other';
    if (!acc[level]) acc[level] = [];
    acc[level].push(cls);
    return acc;
  }, {});

  const sortedGroups = Object.entries(grouped).sort(([a], [b]) => gradeNum(a) - gradeNum(b));

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Class Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">{classes.length} classrooms total</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 active:scale-95 transition-all shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add Class
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or teacher…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 focus:bg-white transition-all"
            />
          </div>
          <select
            value={filterLevel}
            onChange={e => setFilterLevel(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all"
          >
            <option value="">All Levels</option>
            {GRADE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
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
            <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-700 mb-1">
              {search || filterLevel ? 'No results found' : 'No classes yet'}
            </h3>
            <p className="text-sm text-slate-400">
              {search || filterLevel ? 'Try adjusting your filters.' : 'Create your first classroom to get started.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedGroups.map(([level, items]) => (
            <div key={level} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              {/* Group header */}
              <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{level}</span>
                  <span className="text-[10px] font-black text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full uppercase tracking-widest">
                    {items.length}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Class</th>
                      <th className="hidden md:table-cell text-left px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Adviser</th>
                      <th className="hidden lg:table-cell text-left px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">School Year</th>
                      <th className="text-center px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Students</th>
                      <th className="text-center px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map(cls => (
                      <tr key={cls.id} className="hover:bg-violet-50/40 transition-colors group">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-sm">
                              {gradeNum(cls.name) !== 999 ? gradeNum(cls.name) : cls.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-bold text-slate-800 text-sm">{cls.name}</span>
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-5 py-3.5 text-sm font-medium text-slate-600">
                          {cls.teacher_name || <span className="text-slate-400 italic text-xs">Not assigned</span>}
                        </td>
                        <td className="hidden lg:table-cell px-5 py-3.5">
                          {cls.academic_year_name
                            ? <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-violet-50 border border-violet-100 text-violet-700 text-xs font-black tracking-tight">{cls.academic_year_name}</span>
                            : <span className="text-slate-400 italic text-xs">Not set</span>
                          }
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-violet-100 text-violet-700 font-black text-sm">
                            {cls.student_count ?? 0}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => openEdit(cls)}
                              className="px-3 py-1.5 text-xs font-bold text-violet-700 bg-violet-100 hover:bg-violet-200 rounded-lg transition-all active:scale-90 no-min">
                              Edit
                            </button>
                            <button onClick={() => handleDelete(cls)}
                              className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all active:scale-90 no-min">
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

      {!loading && classes.length > 0 && (
        <p className="text-sm text-slate-400 mt-4">
          Showing {filtered.length} of {classes.length} classes
        </p>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                {editingClass ? 'Edit Class' : 'Add New Class'}
              </h2>
              <button onClick={() => setShowModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all no-min">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Grade Level <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.grade_level}
                  onChange={e => {
                    const level = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      grade_level: level,
                      name: prev.name || level + ' - ',
                    }));
                  }}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all"
                  required
                >
                  <option value="">Select grade level</option>
                  {GRADE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Academic Year <span className="text-slate-400 font-medium normal-case tracking-normal">(optional)</span>
                </label>
                <select
                  value={formData.academic_year || ''}
                  onChange={e => setFormData({ ...formData, academic_year: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all"
                >
                  <option value="">— No Year Assigned —</option>
                  {academicYears.map(y => (
                    <option key={y.id} value={y.id}>
                      {y.name}{y.is_active ? ' (Active)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400">Required for year-based filtering in attendance and analytics.</p>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Class Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Grade 7 - Rizal"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all"
                  required
                />
                <p className="text-xs text-slate-400">Include the grade level, e.g. "Grade 7 - Rizal"</p>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Adviser / Teacher <span className="text-slate-400 font-medium normal-case tracking-normal">(optional)</span>
                </label>
                <select
                  value={formData.teacher || ''}
                  onChange={e => setFormData({ ...formData, teacher: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all"
                >
                  <option value="">— No Adviser —</option>
                  {teachers.map(t => {
                    const otherClass = classes.find(c => c.teacher === t.id && c.id !== editingClass?.id);
                    const isAssigned = !!otherClass;
                    return (
                      <option key={t.id} value={t.id} disabled={isAssigned}>
                        {t.first_name && t.last_name ? `${t.first_name} ${t.last_name}` : t.username}
                        {isAssigned ? ` (Adviser of ${otherClass.name})` : ` (${t.email})`}
                      </option>
                    );
                  })}
                </select>
                <p className="text-xs text-slate-400">Leave empty to assign an adviser later.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 active:scale-95 transition-all disabled:opacity-50">
                  {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {saving ? 'Saving…' : editingClass ? 'Update Class' : 'Create Class'}
                </button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 active:scale-95 transition-all">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManagement;
