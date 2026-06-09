import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import {
  Card, CardHeader, CardBody, CardTitle, Button, Badge,
  LoadingSpinner, EmptyState, Modal, ModalHeader, ModalBody, ModalFooter,
  ModalTitle, ModalField, ModalBtnPrimary, ModalBtnSecondary, modalInputCls, modalSelectCls
} from '../components/ui';

/**
 * Class Management Page - DepEd Academic Style
 * Professional classroom/section management interface for administrators
 */

const GRADE_LEVELS = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

const gradeNum = (name = '') => {
  const m = name.match(/\d+/);
  return m ? parseInt(m[0]) : 999;
};

const ClassManagement = () => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  // Global year context — all operations use this year
  const [selectedYearId, setSelectedYearId] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [formData, setFormData] = useState({ name: '', teacher: '', grade_level: '' });

  // Load years + teachers once, then load classes whenever year changes
  useEffect(() => {
    const init = async () => {
      try {
        const [teacherRes, yearRes] = await Promise.all([
          api.get('/users/?role=teacher'),
          api.get('/admin/academic-years/'),
        ]);
        setTeachers(teacherRes.data);
        const years = [...yearRes.data].sort((a, b) => b.name.localeCompare(a.name));
        setAcademicYears(years);
        // Default to the active year
        const active = years.find(y => y.is_active) || years[0];
        if (active) setSelectedYearId(String(active.id));
      } catch {
        toast.error('Failed to load data');
      }
    };
    init();
  }, []);

  // Reload classrooms whenever the selected year changes
  useEffect(() => {
    if (!selectedYearId) return;
    fetchClasses();
  }, [selectedYearId]);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const yearName = getSelectedYearName();
      const res = await api.get(`/classrooms/${yearName ? `?academic_year=${encodeURIComponent(yearName)}` : ''}`);
      setClasses(res.data);
    } catch {
      toast.error('Failed to load classrooms');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedYearName = () => {
    const y = academicYears.find(y => String(y.id) === String(selectedYearId));
    return y?.name || '';
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
      teacher: cls.teacher || '',
      grade_level: cls.grade_level || '',
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
      fetchClasses();
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
        // Always assign the currently selected year — this is the key change
        academic_year: selectedYearId || null,
      };
      if (editingClass) {
        await api.patch(`/classrooms/${editingClass.id}/`, payload);
        toast.success('Class updated');
      } else {
        await api.post('/classrooms/', payload);
        toast.success('Class created');
      }
      setShowModal(false);
      fetchClasses();
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

  // Group by grade level, sorted 7→12
  const grouped = filtered.reduce((acc, cls) => {
    const level = cls.grade_level || GRADE_LEVELS.find(l => cls.name.toLowerCase().includes(l.toLowerCase())) || 'Other';
    if (!acc[level]) acc[level] = [];
    acc[level].push(cls);
    return acc;
  }, {});

  const sortedGroups = Object.entries(grouped).sort(([a], [b]) => gradeNum(a) - gradeNum(b));
  const selectedYearName = getSelectedYearName();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="page-bottom-safe max-w-[1800px] mx-auto bg-slate-50 px-4 py-4 md:px-6 md:py-6 space-y-5 md:space-y-6"
    >
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* PAGE HEADER */}
      {/* ══════════════════════════════════════════════════════════════ */}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-violet-700 uppercase tracking-wide mb-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span>Academic Management</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Class Management
          </h1>
          <p className="text-xs text-slate-600 mt-1 font-semibold">
            {classes.length} classroom{classes.length !== 1 ? 's' : ''} in{' '}
            <span className="font-bold text-violet-700">{selectedYearName || '…'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Academic Year Selector */}
          <div className="relative">
            <select
              value={selectedYearId}
              onChange={e => {
                setSelectedYearId(e.target.value);
                setSearch('');
                setFilterLevel('');
              }}
              className="pl-4 pr-10 py-2.5 border border-slate-300 bg-white rounded-md text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 transition-all appearance-none cursor-pointer min-w-[160px]"
            >
              {academicYears.length === 0 && (
                <option value="">No years set up</option>
              )}
              {academicYears.map(y => (
                <option key={y.id} value={y.id}>
                  SY {y.name}{y.is_active ? ' ★' : ''}
                </option>
              ))}
            </select>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          <Button
            variant="primary"
            onClick={openCreate}
            disabled={!selectedYearId}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add Class
          </Button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* FILTERS */}
      {/* ══════════════════════════════════════════════════════════════ */}

      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name or teacher..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 transition-all"
              />
            </div>
            <select
              value={filterLevel}
              onChange={e => setFilterLevel(e.target.value)}
              className="px-4 py-2.5 border border-slate-300 rounded-md bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 transition-all"
            >
              <option value="">All Levels</option>
              {GRADE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </CardBody>
      </Card>

      {/* No year set up warning */}
      {!loading && academicYears.length === 0 && (
        <Card className="border-l-4 border-l-amber-500 bg-amber-50">
          <CardBody className="p-5">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-bold text-amber-900">No Academic Years Configured</p>
                <p className="text-xs text-amber-700 mt-1">Go to <strong>Settings → Academic Years</strong> to create one before adding classrooms.</p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* CONTENT */}
      {/* ══════════════════════════════════════════════════════════════ */}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardBody className="p-12">
            <EmptyState
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
              title={search || filterLevel ? 'No Results Found' : `No Classes in ${selectedYearName}`}
              message={search || filterLevel ? 'Try adjusting your filters' : `Click "Add Class" to create the first classroom for ${selectedYearName}`}
            />
          </CardBody>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {sortedGroups.map(([level, items]) => (
              <Card key={level} className="border-l-4 border-l-blue-500">
                <CardHeader divider className="bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-violet-100 flex items-center justify-center font-extrabold text-sm text-violet-700 border border-violet-200">
                      {gradeNum(level) !== 999 ? gradeNum(level) : level.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-base uppercase">{level}</CardTitle>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{items.length} Classes</p>
                    </div>
                  </div>
                </CardHeader>
                <CardBody className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-extrabold text-slate-700 uppercase tracking-wider">Class</th>
                          <th className="hidden md:table-cell text-left px-4 py-3 text-xs font-extrabold text-slate-700 uppercase tracking-wider">Adviser</th>
                          <th className="text-center px-4 py-3 text-xs font-extrabold text-slate-700 uppercase tracking-wider">Students</th>
                          <th className="text-center px-4 py-3 text-xs font-extrabold text-slate-700 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {items.map(cls => (
                          <tr key={cls.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-md bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-white font-extrabold text-sm shadow-sm border border-violet-700">
                                  {gradeNum(cls.name) !== 999 ? gradeNum(cls.name) : cls.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-bold text-slate-900 text-sm">{cls.name}</span>
                              </div>
                            </td>
                            <td className="hidden md:table-cell px-4 py-3 text-sm text-slate-600">
                              {cls.teacher_name || <span className="text-slate-400 italic">Not assigned</span>}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Badge variant="blue" size="md" className="font-extrabold">
                                {cls.student_count ?? 0}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Button variant="secondary" size="sm" onClick={() => openEdit(cls)}>
                                  Edit
                                </Button>
                                <Button variant="danger" size="sm" onClick={() => handleDelete(cls)}>
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          <p className="text-xs text-slate-500 font-semibold text-center">
            Showing {filtered.length} of {classes.length} classes in {selectedYearName}
          </p>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* MODAL */}
      {/* ══════════════════════════════════════════════════════════════ */}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="md">
        <ModalHeader onClose={() => setShowModal(false)}>
          <ModalTitle
            title={editingClass ? 'Edit Classroom' : 'Add New Classroom'}
            subtitle={`Academic Year ${selectedYearName}`}
          />
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <div className="space-y-4">
              {/* Info banner */}
              <div className="flex items-start gap-3 p-3 bg-violet-50 border border-violet-200 rounded-sm">
                <svg className="w-4 h-4 text-violet-700 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p className="text-xs text-violet-800">Fill in all required fields. Class name should follow the format: Grade Level - Section Name.</p>
              </div>

              <ModalField label="Grade Level" required>
                <select
                  value={formData.grade_level}
                  onChange={e => {
                    const level = e.target.value;
                    setFormData(prev => ({ ...prev, grade_level: level, name: prev.name || level + ' - ' }));
                  }}
                  className={modalSelectCls}
                  required
                >
                  <option value="">— Select Grade Level —</option>
                  {GRADE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </ModalField>

              <ModalField label="Class / Section Name" required hint='Example: "Grade 7 - Rizal" or "Grade 11 - STEM A"'>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Grade 7 - Rizal"
                  className={modalInputCls}
                  required
                />
              </ModalField>

              <ModalField label="Adviser / Class Teacher" hint="Optional — can be assigned later.">
                <select
                  value={formData.teacher || ''}
                  onChange={e => setFormData({ ...formData, teacher: e.target.value })}
                  className={modalSelectCls}
                >
                  <option value="">— No Adviser Assigned —</option>
                  {teachers.map(t => {
                    const otherClass = classes.find(c => c.teacher === t.id && c.id !== editingClass?.id);
                    const isAssigned = !!otherClass;
                    return (
                      <option key={t.id} value={t.id} disabled={isAssigned}>
                        {t.first_name && t.last_name ? `${t.first_name} ${t.last_name}` : t.username}
                        {isAssigned ? ` (Assigned: ${otherClass.name})` : ` — ${t.email}`}
                      </option>
                    );
                  })}
                </select>
              </ModalField>
            </div>
          </ModalBody>
          <ModalFooter>
            <ModalBtnSecondary onClick={() => setShowModal(false)}>Cancel</ModalBtnSecondary>
            <ModalBtnPrimary loading={saving}>
              {editingClass ? 'Update Classroom' : 'Create Classroom'}
            </ModalBtnPrimary>
          </ModalFooter>
        </form>
      </Modal>
    </motion.div>
  );
};

export default ClassManagement;
