import { useState, useEffect } from 'react';
import api from '../utils/api';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';

const GRADE_LEVELS = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

const gradeNum = (name = '') => {
  const m = name.match(/\d+/);
  return m ? parseInt(m[0]) : 999;
};

const ClassManagement = () => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [formData, setFormData] = useState({ name: '', teacher: '', grade_level: '' });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [classRes, teacherRes] = await Promise.all([
        api.get('/classrooms/'),
        api.get('/users/?role=teacher'),
      ]);
      setClasses(classRes.data);
      setTeachers(teacherRes.data);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingClass(null);
    setFormData({ name: '', teacher: '', grade_level: '' });
    setShowModal(true);
  };

  const openEdit = (cls) => {
    setEditingClass(cls);
    setFormData({ 
      name: cls.name, 
      teacher: cls.teacher, 
      grade_level: cls.grade_level || '' 
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
    if (!formData.teacher) return toast.error('Please select a teacher');
    setSaving(true);
    try {
      // Send only the fields the backend expects
      const payload = { 
        name: formData.name.trim(), 
        teacher: formData.teacher,
        grade_level: formData.grade_level
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
      toast.error(err.response?.data?.detail || 'Failed to save class');
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
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 md:gap-4 mb-2 md:mb-6">
        <div className="text-center md:text-left">
          <h1 className="text-lg md:text-3xl font-black text-gray-800 tracking-tight uppercase">Class Management</h1>
          <p className="text-gray-500 text-[8px] md:text-base mt-0.5 font-medium uppercase tracking-widest">
            {classes.length} classrooms total
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white font-black py-1.5 md:py-2.5 px-3 md:px-6 rounded-lg md:rounded-xl transition-all shadow-md active:scale-95 text-[10px] md:text-sm uppercase tracking-widest w-full sm:w-auto"
        >
          <svg className="w-3.5 h-3.5 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add Class
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-1.5 md:gap-3 mb-2 md:mb-5 bg-white p-1.5 md:p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 md:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 text-[10px] md:text-sm font-bold shadow-inner uppercase tracking-wider"
          />
        </div>
        <select
          value={filterLevel}
          onChange={e => setFilterLevel(e.target.value)}
          className="px-3 py-1.5 md:px-4 md:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 text-[10px] md:text-sm font-bold shadow-sm uppercase tracking-wider"
        >
          <option value="">All Levels</option>
          {GRADE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 md:h-10 md:w-10 border-b-2 border-purple-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-10 md:p-16 text-center">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
            <svg className="w-6 h-6 md:w-8 md:h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="text-[10px] md:text-base text-gray-500 font-bold uppercase tracking-widest">
            {search || filterLevel ? 'No results found.' : 'No classes yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3 md:space-y-6">
          {sortedGroups.map(([level, items]) => (
            <div key={level} className="bg-white border border-gray-200 rounded-lg md:rounded-xl shadow-sm overflow-hidden">
              {/* Group header */}
              <div className="flex items-center justify-between px-3 py-1.5 md:px-6 md:py-3 bg-[#2D1B4D] text-white border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="font-black text-[10px] md:text-base uppercase tracking-tight">{level}</span>
                  <span className="text-[7px] md:text-xs font-black bg-white/10 px-2 py-0.5 rounded-full uppercase tracking-widest">
                    {items.length}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 max-w-full">
                <table className="w-full min-w-[350px] md:min-w-full">
                  <thead className="bg-gray-50">
                    <tr className="text-[7px] md:text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                      <th className="text-left px-3 py-1.5 md:px-6 md:py-3">Class</th>
                      <th className="hidden md:table-cell text-left px-6 py-3">Adviser</th>
                      <th className="text-center px-3 py-1.5 md:px-6 md:py-3">Students</th>
                      <th className="text-center px-3 py-1.5 md:px-6 md:py-3">Opt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map(cls => (
                      <tr key={cls.id} className="hover:bg-purple-50 transition-colors">
                        <td className="px-3 py-2 md:px-6 md:py-4">
                          <div className="flex items-center gap-1.5 md:gap-3">
                            <div className="w-7 h-7 md:w-9 md:h-9 rounded md:rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black text-[9px] md:text-sm flex-shrink-0 shadow-sm">
                              {gradeNum(cls.name) !== 999 ? gradeNum(cls.name) : cls.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-black text-gray-800 text-[9px] md:text-sm uppercase tracking-tighter truncate">{cls.name}</span>
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-6 py-4 text-sm font-bold text-gray-600">
                          {cls.teacher_name || <span className="text-gray-400 italic">Not assigned</span>}
                        </td>
                        <td className="px-3 py-2 md:px-6 md:py-4 text-center">
                          <span className="inline-flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full bg-purple-100 text-purple-700 font-black text-[8px] md:text-sm shadow-inner">
                            {cls.student_count ?? 0}
                          </span>
                        </td>
                        <td className="px-3 py-2 md:px-6 md:py-4 text-center">
                          <div className="flex items-center justify-center gap-1 md:gap-2">
                            <button
                              onClick={() => openEdit(cls)}
                              className="p-1 md:px-3 md:py-1.5 text-[8px] md:text-xs font-black text-purple-700 bg-purple-100 hover:bg-purple-200 rounded md:rounded-lg transition-all active:scale-90 uppercase tracking-widest"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(cls)}
                              className="p-1 md:px-3 md:py-1.5 text-[8px] md:text-xs font-black text-red-700 bg-red-100 hover:bg-red-200 rounded md:rounded-lg transition-all active:scale-90 uppercase tracking-widest"
                            >
                              Del
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
        <p className="text-sm text-gray-400 mt-4">
          Showing {filtered.length} of {classes.length} classes
        </p>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">
                {editingClass ? 'Edit Class' : 'Add New Class'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Grade Level <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.grade_level}
                  onChange={e => {
                    const level = e.target.value;
                    // Auto-fill name prefix if name is empty
                    setFormData(prev => ({
                      ...prev,
                      grade_level: level,
                      name: prev.name || level + ' - ',
                    }));
                  }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  required
                >
                  <option value="">Select grade level</option>
                  {GRADE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Class Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Grade 7 - Rizal"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">Include the grade level in the name so it groups correctly, e.g. "Grade 7 - Rizal"</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Adviser / Teacher <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.teacher}
                  onChange={e => setFormData({ ...formData, teacher: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  required
                >
                  <option value="">Select a teacher</option>
                  {teachers.map(t => {
                    // Check if this teacher is already an advisor for ANOTHER classroom
                    const otherClass = classes.find(c => c.teacher === t.id && c.id !== editingClass?.id);
                    const isAssigned = !!otherClass;
                    
                    return (
                      <option key={t.id} value={t.id} disabled={isAssigned}>
                        {t.first_name && t.last_name ? `${t.first_name} ${t.last_name}` : t.username} 
                        {isAssigned ? ` (Already advisor for ${otherClass.name})` : ` (${t.email})`}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
                >
                  {saving ? 'Saving...' : editingClass ? 'Update Class' : 'Create Class'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg transition-colors text-sm"
                >
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
