import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParallelFetch } from '../../hooks/useFetch';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { LoadingSpinner, EmptyState, Button } from '../components/ui';

function SectionsTab({ refetch }) {
  const navigate = useNavigate();
  const { data, loading, refetch: localRefetch } = useParallelFetch({
    classes: '/classrooms/',
    teachers: '/users/?role=staff',
    academicYears: '/admin/academic-years/',
    subjects: '/subjects/',
  });
  const classes = useMemo(() => Array.isArray(data.classes) ? data.classes : [], [data.classes]);
  const teachers = useMemo(() => Array.isArray(data.teachers) ? data.teachers : [], [data.teachers]);
  const academicYears = useMemo(() => Array.isArray(data.academicYears) ? data.academicYears : [], [data.academicYears]);
  const subjects = useMemo(() => Array.isArray(data.subjects) ? data.subjects : [], [data.subjects]);
  
  const [selectedYearId, setSelectedYearId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [formData, setFormData] = useState({ name: '', teacher: '', grade_level: '' });
  const [showSubjectPanel, setShowSubjectPanel] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [subjectSearch, setSubjectSearch] = useState('');
  const [subjectForm, setSubjectForm] = useState({ subject: '', teacher: '' });
  const [savingSubject, setSavingSubject] = useState(false);
  const [showBulkEnrollModal, setShowBulkEnrollModal] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [showRolloverModal, setRolloverModal] = useState(false);
  const [rolloverSettings, setRolloverSettings] = useState({ sourceYear: '', targetYear: '', copyTeachers: false, copySubjects: false });

  const activeYear = academicYears.find(y => y.is_active) || academicYears[0];
  useEffect(() => {
    if (activeYear && !selectedYearId) setSelectedYearId(activeYear.id);
  }, [activeYear, selectedYearId]);

  const fetchClassrooms = useCallback(async () => {
    if (!selectedYearId) return;
    try {
      const res = await api.get(`/classrooms/?academic_year=${encodeURIComponent(selectedYearId)}`);
      localRefetch();
    } catch (err) {
      toast.error('Failed to load classrooms');
    }
  }, [selectedYearId, localRefetch]);

  useEffect(() => {
    fetchClassrooms();
  }, [fetchClassrooms]);

  const filteredClasses = useMemo(() => {
    let filtered = classes;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(c => c.name.toLowerCase().includes(q));
    }
    if (filterLevel) {
      filtered = filtered.filter(c => String(c.grade_level) === String(filterLevel));
    }
    return filtered;
  }, [classes, search, filterLevel]);

  const groupedClasses = useMemo(() => {
    const groups = {};
    filteredClasses.forEach(c => {
      const grade = c.grade_level || 'Unassigned';
      if (!groups[grade]) groups[grade] = [];
      groups[grade].push(c);
    });
    return groups;
  }, [filteredClasses]);

  const sortedGrades = useMemo(() => {
    const order = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
    return Object.keys(groupedClasses).sort((a, b) => {
      const iA = order.indexOf(a);
      const iB = order.indexOf(b);
      if (iA === -1 && iB === -1) return a.localeCompare(b);
      if (iA === -1) return 1;
      if (iB === -1) return -1;
      return iA - iB;
    });
  }, [groupedClasses]);

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Section name is required');
    if (!formData.grade_level) return toast.error('Grade level is required');
    setSaving(true);
    try {
      await api.post('/classrooms/', {
        name: formData.name.trim(),
        grade_level: formData.grade_level,
        teacher: formData.teacher || null,
        academic_year: selectedYearId,
      });
      toast.success('Section created');
      setShowModal(false);
      setFormData({ name: '', grade_level: '', teacher: '' });
      localRefetch();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create section');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateClass = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Section name is required');
    setSaving(true);
    try {
      await api.patch(`/classrooms/${editingClass.id}/`, {
        name: formData.name.trim(),
        grade_level: formData.grade_level,
        teacher: formData.teacher || null,
      });
      toast.success('Section updated');
      setShowModal(false);
      setEditingClass(null);
      setFormData({ name: '', grade_level: '', teacher: '' });
      localRefetch();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update section');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClass = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Section?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it!',
    });
    if (result.isConfirmed) {
      try {
        await api.delete(`/classrooms/${id}/`);
        toast.success('Section deleted');
        localRefetch();
      } catch { toast.error('Failed to delete section'); }
    }
  };

  const openSubjectPanel = async (cls) => {
    setSelectedClass(cls);
    setShowSubjectPanel(true);
    try {
      const res = await api.get(`/classroom-subjects/by_classroom/?classroom_id=${cls.id}`);
      setAssignments(res.data);
    } catch { toast.error('Failed to load subjects'); }
  };

  const handleSubjectAssign = async (e) => {
    e.preventDefault();
    if (!subjectForm.subject) return toast.error('Select a subject');
    if (!subjectForm.teacher) return toast.error('Select a teacher');
    setSavingSubject(true);
    try {
      if (editingAssignment) {
        await api.patch(`/classroom-subjects/${editingAssignment.id}/`, subjectForm);
        toast.success('Subject assignment updated');
      } else {
        await api.post('/classroom-subjects/', { ...subjectForm, classroom: selectedClass.id });
        toast.success('Subject assigned');
      }
      setShowSubjectModal(false);
      setSubjectForm({ subject: '', teacher: '' });
      setEditingAssignment(null);
      const res = await api.get(`/classroom-subjects/by_classroom/?classroom_id=${selectedClass.id}`);
      setAssignments(res.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to assign subject');
    } finally {
      setSavingSubject(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-bottom-safe bg-slate-50/50">
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">Class Sections</h1>
        <p className="text-xs text-slate-500 mt-1">Manage classroom sections and subject assignments</p>
      </div>

      <div className="flex items-center gap-2 mb-4 md:mb-6">
        <select value={selectedYearId} onChange={e => setSelectedYearId(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/40">
          {academicYears.map(y => <option key={y.id} value={y.id} selected={y.is_active}>{y.name} {y.is_active && '(Active)'}</option>)}
        </select>
        <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/40">
          <option value="">All Grades</option>
          <option value="Grade 7">Grade 7</option>
          <option value="Grade 8">Grade 8</option>
          <option value="Grade 9">Grade 9</option>
          <option value="Grade 10">Grade 10</option>
          <option value="Grade 11">Grade 11</option>
          <option value="Grade 12">Grade 12</option>
        </select>
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sections..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40" />
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 md:mb-6">
        <Button onClick={() => { setFormData({ name: '', grade_level: '', teacher: '' }); setShowModal(true); }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Section
        </Button>
      </div>

      {sortedGrades.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          <h3 className="text-lg font-bold text-slate-700 mb-2">No Sections Found</h3>
          <p className="text-slate-500">Click "Add Section" to create your first section.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedGrades.map(grade => (
            <div key={grade} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#5e2a84] flex items-center justify-center rounded-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  </div>
                  <h3 className="font-bold text-slate-700">{grade}</h3>
                </div>
                <span className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{groupedClasses[grade].length} sections</span>
              </div>
              <div className="divide-y divide-slate-100">
                {groupedClasses[grade].map(cls => (
                  <div key={cls.id} className="p-4 hover:bg-slate-50 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        {cls.name.match(/\d+/)?.[0] || cls.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 truncate">{cls.name}</h4>
                        <p className="text-sm text-slate-500">{cls.teacher_name ? `Adviser: ${cls.teacher_name}` : 'No adviser assigned'} · {cls.student_count ?? 0} students · {cls.capacity || 40} max</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button variant="secondary" size="sm" onClick={() => openSubjectPanel(cls)}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                        Subjects
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => { setEditingClass(cls); setFormData({ name: cls.name, grade_level: cls.grade_level, teacher: cls.teacher }); setShowModal(true); }}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        Edit
                      </Button>
                      <Button variant="secondary" size="sm" variant="danger" onClick={() => handleDeleteClass(cls.id)}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals for Create/Edit, Subject Panel, Subject Assignment */}
    </div>
  );
}

function SubjectsTab({ refetch }) {
  return (
    <div className="page-bottom-safe bg-slate-50/50">
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">Subject Management</h1>
        <p className="text-xs text-slate-500 mt-1">Manage subjects and assign to sections</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <p className="text-slate-500">Subject management coming soon...</p>
      </div>
    </div>
  );
}

function ScheduleTab({ refetch }) {
  return (
    <div className="page-bottom-safe bg-slate-50/50">
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">Class Schedule</h1>
        <p className="text-xs text-slate-500 mt-1">Weekly timetable editor</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <p className="text-slate-500">Schedule editor coming soon...</p>
      </div>
    </div>
  );
}

export default function ClassesHub() {
  const [activeTab, setActiveTab] = useState('sections');

  const tabs = [
    { id: 'sections', label: 'Sections', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
    { id: 'subjects', label: 'Subjects', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332-.477-4.5-1.253" /></svg> },
    { id: 'schedule', label: 'Schedule', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  ];

  return (
    <div className="page-bottom-safe bg-slate-50">
      <div className="bg-white border-b-2 border-slate-200 px-4 md:px-6 py-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-[#5e2a84] flex items-center justify-center rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Classes Hub</h1>
              <p className="text-sm text-slate-500">Manage sections, subjects, and schedules</p>
            </div>
          </div>
          <div className="flex gap-2">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id ? 'bg-violet-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6">
        {activeTab === 'sections' && <SectionsTab refetch={() => {}} />}
        {activeTab === 'subjects' && <SubjectsTab refetch={() => {}} />}
        {activeTab === 'schedule' && <ScheduleTab refetch={() => {}} />}
      </div>
    </div>
  );
}

export default ClassesHub;