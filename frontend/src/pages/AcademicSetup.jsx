import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  Card, CardHeader, CardBody, CardTitle, Button, Badge,
  LoadingSpinner, EmptyState, Modal, ModalHeader, ModalBody, ModalFooter,
  ModalTitle, ModalField, ModalBtnPrimary, ModalBtnSecondary,
  modalInputCls, modalSelectCls, modalTextareaCls
} from '../components/ui';

const GRADE_LEVELS = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

const STEPS = [
  { id: 'academic-year', label: 'Academic Year', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { id: 'semester', label: 'Semester / Quarter', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'grade-levels', label: 'Grade Levels', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { id: 'sections', label: 'Sections / Classrooms', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { id: 'subjects', label: 'Subjects', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332-.477-4.5-1.253' },
  { id: 'assign-subjects', label: 'Assign Subjects to Classes', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { id: 'assign-teachers', label: 'Assign Teachers', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { id: 'schedule', label: 'Set Class Schedule', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { id: 'enrollment', label: 'Open Enrollment', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
  { id: 'complete', label: 'Setup Complete', icon: 'M5 13l4 4L19 7' },
];

const AcademicSetup = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Data state
  const [academicYears, setAcademicYears] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classroomSubjects, setClassroomSubjects] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [systemSettings, setSystemSettings] = useState(null);

  // Form state
  const [ayForm, setAyForm] = useState({ name: '', start_date: '', end_date: '', is_active: true });
  const [semesterForm, setSemesterForm] = useState({ name: '', academic_year: '', semester_type: 'semester' });
  const [selectedGradeLevels, setSelectedGradeLevels] = useState([]);
  const [sectionForm, setSectionForm] = useState({ name: '', grade_level: '', teacher: '' });
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', description: '', grade_level: '' });
  const [assignSubjectForm, setAssignSubjectForm] = useState({ classroom: '', subject: '', teacher: '' });
  const [enrollmentOpen, setEnrollmentOpen] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ayRes, subRes, tchRes, settingsRes] = await Promise.all([
        api.get('/admin/academic-years/').catch(() => ({ data: [] })),
        api.get('/subjects/').catch(() => ({ data: [] })),
        api.get('/users/?role=staff').catch(() => ({ data: [] })),
        api.get('/system/settings/').catch(() => ({ data: {} })),
      ]);
      setAcademicYears(ayRes.data);
      setSubjects(subRes.data);
      setTeachers(tchRes.data);
      setSystemSettings(settingsRes.data);

      const activeAY = ayRes.data.find(y => y.is_active) || ayRes.data[0];
      if (activeAY) {
        setAyForm({ name: activeAY.name, start_date: activeAY.start_date, end_date: activeAY.end_date, is_active: activeAY.is_active });
        const [clsRes, semRes] = await Promise.all([
          api.get(`/classrooms/?academic_year=${encodeURIComponent(activeAY.name)}`).catch(() => ({ data: [] })),
          api.get(`/admin/semesters/?academic_year=${activeAY.id}`).catch(() => ({ data: [] })),
        ]);
        setClassrooms(clsRes.data);
        setSemesters(semRes.data);

        if (clsRes.data.length > 0) {
          const csPromises = clsRes.data.map(c =>
            api.get(`/classroom-subjects/by_classroom/?classroom_id=${c.id}`).catch(() => ({ data: [] }))
          );
          const csResults = await Promise.all(csPromises);
          setClassroomSubjects(csResults.flatMap(r => r.data));
        }
      }

      if (settingsRes.data?.enrollment_open !== undefined) {
        setEnrollmentOpen(settingsRes.data.enrollment_open);
      }
    } catch {
      toast.error('Failed to load setup data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-detect current step based on data
  useEffect(() => {
    if (loading) return;
    const activeAY = academicYears.find(y => y.is_active);
    if (!activeAY) { setCurrentStep(0); return; }
    if (semesters.length === 0) { setCurrentStep(1); return; }
    if (classrooms.length === 0) { setCurrentStep(3); return; }
    if (subjects.length === 0) { setCurrentStep(4); return; }
    if (classroomSubjects.length === 0) { setCurrentStep(5); return; }
    setCurrentStep(9);
  }, [loading, academicYears, semesters, classrooms, subjects, classroomSubjects]);

  const activeAY = academicYears.find(y => y.is_active);

  // ── Step Handlers ──────────────────────────────────────────────────────────

  const handleCreateAY = async (e) => {
    e.preventDefault();
    if (!ayForm.name.trim()) return toast.error('Year name is required');
    setSaving(true);
    try {
      await api.post('/admin/academic-years/', ayForm);
      toast.success('Academic year created');
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create academic year');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSemester = async (e) => {
    e.preventDefault();
    if (!semesterForm.name.trim()) return toast.error('Semester name is required');
    setSaving(true);
    try {
      await api.post('/admin/semesters/', { ...semesterForm, academic_year: activeAY?.id });
      toast.success('Semester created');
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create semester');
    } finally {
      setSaving(false);
    }
  };

  const handleEnableGradeLevels = () => {
    if (selectedGradeLevels.length === 0) return toast.error('Select at least one grade level');
    toast.success(`${selectedGradeLevels.length} grade level(s) enabled`);
    goToNextStep();
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    if (!sectionForm.name.trim()) return toast.error('Section name is required');
    if (!sectionForm.grade_level) return toast.error('Grade level is required');
    setSaving(true);
    try {
      await api.post('/classrooms/', {
        name: sectionForm.name.trim(),
        grade_level: sectionForm.grade_level,
        teacher: sectionForm.teacher || null,
        academic_year: activeAY?.id || null,
      });
      toast.success('Section created');
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create section');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!subjectForm.name.trim()) return toast.error('Subject name is required');
    if (!subjectForm.code.trim()) return toast.error('Subject code is required');
    setSaving(true);
    try {
      await api.post('/subjects/', subjectForm);
      toast.success('Subject created');
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.code?.[0] || err.response?.data?.detail || 'Failed to create subject');
    } finally {
      setSaving(false);
    }
  };

  const handleAssignSubject = async (e) => {
    e.preventDefault();
    if (!assignSubjectForm.classroom) return toast.error('Select a section');
    if (!assignSubjectForm.subject) return toast.error('Select a subject');
    if (!assignSubjectForm.teacher) return toast.error('Select a teacher');
    setSaving(true);
    try {
      await api.post('/classroom-subjects/', assignSubjectForm);
      toast.success('Subject assigned to class');
      setShowModal(false);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.non_field_errors?.[0] || err.response?.data?.detail || 'Failed to assign';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEnrollment = async () => {
    setSaving(true);
    try {
      await api.patch('/system/settings/', { enrollment_open: !enrollmentOpen });
      setEnrollmentOpen(!enrollmentOpen);
      toast.success(enrollmentOpen ? 'Enrollment closed' : 'Enrollment opened');
    } catch {
      toast.error('Failed to update enrollment setting');
    } finally {
      setSaving(false);
    }
  };

  const goToNextStep = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1);
  };

  const goToPrevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const openModal = (type) => {
    setModalType(type);
    setShowModal(true);
  };

  // ── Step Content Renderers ─────────────────────────────────────────────────

  const renderStepContent = () => {
    switch (STEPS[currentStep].id) {
      case 'academic-year':
        return (
          <div className="space-y-6">
            <div className="text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">Create Academic Year</h3>
              <p className="text-sm text-slate-600">Set up the school year (e.g., 2025-2026) to organize all academic data.</p>
            </div>
            {academicYears.length > 0 ? (
              <div className="space-y-3">
                {academicYears.map(y => (
                  <div key={y.id} className={`flex items-center justify-between p-4 rounded-xl border-2 ${y.is_active ? 'border-violet-300 bg-violet-50' : 'border-slate-200 bg-white'}`}>
                    <div>
                      <p className="font-bold text-slate-900">{y.name}</p>
                      <p className="text-xs text-slate-500">{y.start_date} to {y.end_date}</p>
                    </div>
                    {y.is_active && <Badge variant="violet">Active</Badge>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center">No academic years created yet.</p>
            )}
            <div className="flex justify-center">
              <Button variant="primary" onClick={() => openModal('academic-year')}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                {academicYears.length > 0 ? 'Add Another Year' : 'Create Academic Year'}
              </Button>
            </div>
          </div>
        );

      case 'semester':
        return (
          <div className="space-y-6">
            <div className="text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">Create Semester / Quarter</h3>
              <p className="text-sm text-slate-600">Define the grading periods for {activeAY?.name || 'this academic year'}.</p>
            </div>
            {semesters.length > 0 ? (
              <div className="space-y-3">
                {semesters.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-200 bg-white">
                    <div>
                      <p className="font-bold text-slate-900">{s.name}</p>
                      <p className="text-xs text-slate-500">{s.start_date || 'No start date'} to {s.end_date || 'No end date'}</p>
                    </div>
                    {s.is_active && <Badge variant="green">Active</Badge>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center">No semesters created yet.</p>
            )}
            <div className="flex justify-center">
              <Button variant="primary" onClick={() => openModal('semester')}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                Add Semester / Quarter
              </Button>
            </div>
          </div>
        );

      case 'grade-levels':
        return (
          <div className="space-y-6">
            <div className="text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">Enable Grade Levels</h3>
              <p className="text-sm text-slate-600">Select which grade levels are active for this school year.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-lg mx-auto">
              {GRADE_LEVELS.map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => {
                    setSelectedGradeLevels(prev =>
                      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
                    );
                  }}
                  className={`p-4 rounded-xl border-2 text-center font-bold transition-all ${
                    selectedGradeLevels.includes(level)
                      ? 'border-violet-500 bg-violet-50 text-violet-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        );

      case 'sections':
        return (
          <div className="space-y-6">
            <div className="text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">Create Sections / Classrooms</h3>
              <p className="text-sm text-slate-600">Set up the sections for each grade level.</p>
            </div>
            {classrooms.length > 0 ? (
              <div className="space-y-3 max-w-lg mx-auto">
                {classrooms.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center text-violet-700 font-extrabold text-sm">
                        {c.name?.match(/\d+/)?.[0] || c.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-900">{c.name}</p>
                        <p className="text-xs text-slate-500">{c.grade_level || 'No level'} · {c.student_count ?? 0} students</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center">No sections created yet.</p>
            )}
            <div className="flex justify-center">
              <Button variant="primary" onClick={() => openModal('section')}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                Add Section
              </Button>
            </div>
          </div>
        );

      case 'subjects':
        return (
          <div className="space-y-6">
            <div className="text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332-.477-4.5-1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">Create Subjects</h3>
              <p className="text-sm text-slate-600">Add the subjects for each grade level.</p>
            </div>
            {subjects.length > 0 ? (
              <div className="space-y-3 max-w-lg mx-auto">
                {subjects.slice(0, 10).map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center gap-3">
                      <Badge variant="blue" className="font-mono">{s.code}</Badge>
                      <div>
                        <p className="font-bold text-sm text-slate-900">{s.name}</p>
                        <p className="text-xs text-slate-500">{s.grade_level}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {subjects.length > 10 && <p className="text-xs text-slate-400 text-center">+ {subjects.length - 10} more subjects</p>}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center">No subjects created yet.</p>
            )}
            <div className="flex justify-center">
              <Button variant="primary" onClick={() => openModal('subject')}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                Add Subject
              </Button>
            </div>
          </div>
        );

      case 'assign-subjects':
        return (
          <div className="space-y-6">
            <div className="text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">Assign Subjects to Classes</h3>
              <p className="text-sm text-slate-600">Link subjects to sections and assign a teacher for each.</p>
            </div>
            {classroomSubjects.length > 0 ? (
              <div className="space-y-2 max-w-lg mx-auto">
                {classroomSubjects.slice(0, 10).map(cs => (
                  <div key={cs.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white text-sm">
                    <div className="flex items-center gap-3">
                      <Badge variant="violet" size="sm">{cs.classroom_name}</Badge>
                      <span className="font-bold text-slate-700">{cs.subject_name}</span>
                    </div>
                    <span className="text-xs text-slate-500">{cs.teacher_name}</span>
                  </div>
                ))}
                {classroomSubjects.length > 10 && <p className="text-xs text-slate-400 text-center">+ {classroomSubjects.length - 10} more assignments</p>}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center">No subjects assigned yet.</p>
            )}
            <div className="flex justify-center">
              <Button variant="primary" onClick={() => openModal('assign-subject')}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                Assign Subject to Class
              </Button>
            </div>
          </div>
        );

      case 'assign-teachers':
        return (
          <div className="space-y-6">
            <div className="text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">Assign Teachers</h3>
              <p className="text-sm text-slate-600">Teachers are assigned when linking subjects to classes. You can also set advisory teachers in Class Management.</p>
            </div>
            <div className="space-y-2 max-w-lg mx-auto">
              {teachers.filter(t => t.is_active).slice(0, 8).map(t => (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                    {t.first_name?.charAt(0)}{t.last_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900">{t.first_name} {t.last_name}</p>
                    <p className="text-xs text-slate-500">{t.email}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 text-center">Teachers are assigned per subject in the previous step.</p>
          </div>
        );

      case 'schedule':
        return (
          <div className="space-y-6">
            <div className="text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">Set Class Schedule</h3>
              <p className="text-sm text-slate-600">Configure bell schedules and assign classes to time slots.</p>
            </div>
            <div className="flex justify-center">
              <Button variant="primary" onClick={() => navigate('/academics-hub?tab=schedules')}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Open Schedule Manager
              </Button>
            </div>
          </div>
        );

      case 'enrollment':
        return (
          <div className="space-y-6">
            <div className="text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">Open Enrollment / Student Assignment</h3>
              <p className="text-sm text-slate-600">Toggle enrollment open/close and assign students to sections.</p>
            </div>
            <div className="max-w-md mx-auto space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-200 bg-white">
                <div>
                  <p className="font-bold text-sm text-slate-900">Student Enrollment</p>
                  <p className="text-xs text-slate-500">{enrollmentOpen ? 'Currently open' : 'Currently closed'}</p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleEnrollment}
                  disabled={saving}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    enrollmentOpen ? 'bg-violet-600' : 'bg-slate-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    enrollmentOpen ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              <div className="flex justify-center gap-3">
                <Button variant="secondary" onClick={() => navigate('/enrollment-classes?tab=classrooms')}>
                  Manage Sections
                </Button>
                <Button variant="primary" onClick={() => navigate('/enrollment-classes?tab=applications')}>
                  View Applications
                </Button>
              </div>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="space-y-6 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-2">Academic Setup Complete!</h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Your academic year <span className="font-bold text-violet-700">{activeAY?.name}</span> is fully configured with{' '}
                <span className="font-bold">{classrooms.length} section(s)</span>,{' '}
                <span className="font-bold">{subjects.length} subject(s)</span>, and{' '}
                <span className="font-bold">{teachers.filter(t => t.is_active).length} teacher(s)</span>.
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <Button variant="primary" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
              <Button variant="secondary" onClick={() => navigate('/enrollment-classes?tab=classrooms')}>
                Manage Classes
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ── Modal Content ──────────────────────────────────────────────────────────

  const renderModal = () => {
    switch (modalType) {
      case 'academic-year':
        return (
          <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="md">
            <ModalHeader onClose={() => setShowModal(false)}>
              <ModalTitle title="Create Academic Year" subtitle="Define the school year period" />
            </ModalHeader>
            <form onSubmit={handleCreateAY}>
              <ModalBody>
                <div className="space-y-4">
                  <ModalField label="Year Name" required hint='e.g. "2026-2027"'>
                    <input type="text" value={ayForm.name} onChange={e => setAyForm({ ...ayForm, name: e.target.value })} placeholder="2026-2027" className={modalInputCls} required />
                  </ModalField>
                  <div className="grid grid-cols-2 gap-4">
                    <ModalField label="Start Date" required>
                      <input type="date" value={ayForm.start_date} onChange={e => setAyForm({ ...ayForm, start_date: e.target.value })} className={modalInputCls} required />
                    </ModalField>
                    <ModalField label="End Date" required>
                      <input type="date" value={ayForm.end_date} onChange={e => setAyForm({ ...ayForm, end_date: e.target.value })} className={modalInputCls} required />
                    </ModalField>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={ayForm.is_active} onChange={e => setAyForm({ ...ayForm, is_active: e.target.checked })} className="w-4 h-4 text-violet-600 border-slate-300 rounded focus:ring-violet-500" />
                    <span className="text-sm font-bold text-slate-700">Set as Active Year</span>
                  </label>
                </div>
              </ModalBody>
              <ModalFooter>
                <ModalBtnSecondary onClick={() => setShowModal(false)}>Cancel</ModalBtnSecondary>
                <ModalBtnPrimary loading={saving}>Create</ModalBtnPrimary>
              </ModalFooter>
            </form>
          </Modal>
        );

      case 'semester':
        return (
          <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="md">
            <ModalHeader onClose={() => setShowModal(false)}>
              <ModalTitle title="Create Semester / Quarter" subtitle={`For ${activeAY?.name || 'active year'}`} />
            </ModalHeader>
            <form onSubmit={handleCreateSemester}>
              <ModalBody>
                <div className="space-y-4">
                  <ModalField label="Name" required hint='e.g. "1st Semester" or "1st Quarter"'>
                    <input type="text" value={semesterForm.name} onChange={e => setSemesterForm({ ...semesterForm, name: e.target.value })} placeholder="1st Semester" className={modalInputCls} required />
                  </ModalField>
                  <ModalField label="Type">
                    <select value={semesterForm.semester_type} onChange={e => setSemesterForm({ ...semesterForm, semester_type: e.target.value })} className={modalSelectCls}>
                      <option value="semester">Semester</option>
                      <option value="quarter">Quarter</option>
                    </select>
                  </ModalField>
                </div>
              </ModalBody>
              <ModalFooter>
                <ModalBtnSecondary onClick={() => setShowModal(false)}>Cancel</ModalBtnSecondary>
                <ModalBtnPrimary loading={saving}>Create</ModalBtnPrimary>
              </ModalFooter>
            </form>
          </Modal>
        );

      case 'section':
        return (
          <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="md">
            <ModalHeader onClose={() => setShowModal(false)}>
              <ModalTitle title="Create Section" subtitle="Add a new classroom section" />
            </ModalHeader>
            <form onSubmit={handleCreateSection}>
              <ModalBody>
                <div className="space-y-4">
                  <ModalField label="Grade Level" required>
                    <select value={sectionForm.grade_level} onChange={e => setSectionForm({ ...sectionForm, grade_level: e.target.value })} className={modalSelectCls} required>
                      <option value="">— Select Grade Level —</option>
                      {GRADE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </ModalField>
                  <ModalField label="Section Name" required hint='e.g. "Grade 7 - Rizal"'>
                    <input type="text" value={sectionForm.name} onChange={e => setSectionForm({ ...sectionForm, name: e.target.value })} placeholder="Grade 7 - Rizal" className={modalInputCls} required />
                  </ModalField>
                  <ModalField label="Advisory Teacher">
                    <select value={sectionForm.teacher} onChange={e => setSectionForm({ ...sectionForm, teacher: e.target.value })} className={modalSelectCls}>
                      <option value="">— No Adviser —</option>
                      {teachers.filter(t => t.is_active).map(t => (
                        <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                      ))}
                    </select>
                  </ModalField>
                </div>
              </ModalBody>
              <ModalFooter>
                <ModalBtnSecondary onClick={() => setShowModal(false)}>Cancel</ModalBtnSecondary>
                <ModalBtnPrimary loading={saving}>Create</ModalBtnPrimary>
              </ModalFooter>
            </form>
          </Modal>
        );

      case 'subject':
        return (
          <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="md">
            <ModalHeader onClose={() => setShowModal(false)}>
              <ModalTitle title="Create Subject" subtitle="Add a new subject to the curriculum" />
            </ModalHeader>
            <form onSubmit={handleCreateSubject}>
              <ModalBody>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <ModalField label="Subject Code" required>
                      <input type="text" value={subjectForm.code} onChange={e => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })} placeholder="MATH7" className={modalInputCls + ' font-mono'} required />
                    </ModalField>
                    <ModalField label="Grade Level" required>
                      <select value={subjectForm.grade_level} onChange={e => setSubjectForm({ ...subjectForm, grade_level: e.target.value })} className={modalSelectCls} required>
                        <option value="">— Select —</option>
                        {GRADE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </ModalField>
                  </div>
                  <ModalField label="Subject Name" required>
                    <input type="text" value={subjectForm.name} onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })} placeholder="Mathematics" className={modalInputCls} required />
                  </ModalField>
                  <ModalField label="Description">
                    <textarea rows={2} value={subjectForm.description} onChange={e => setSubjectForm({ ...subjectForm, description: e.target.value })} placeholder="Brief description (optional)" className={modalTextareaCls} />
                  </ModalField>
                </div>
              </ModalBody>
              <ModalFooter>
                <ModalBtnSecondary onClick={() => setShowModal(false)}>Cancel</ModalBtnSecondary>
                <ModalBtnPrimary loading={saving}>Create</ModalBtnPrimary>
              </ModalFooter>
            </form>
          </Modal>
        );

      case 'assign-subject':
        return (
          <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="md">
            <ModalHeader onClose={() => setShowModal(false)}>
              <ModalTitle title="Assign Subject to Class" subtitle="Link a subject, section, and teacher" />
            </ModalHeader>
            <form onSubmit={handleAssignSubject}>
              <ModalBody>
                <div className="space-y-4">
                  <ModalField label="Section" required>
                    <select value={assignSubjectForm.classroom} onChange={e => setAssignSubjectForm({ ...assignSubjectForm, classroom: e.target.value })} className={modalSelectCls} required>
                      <option value="">— Select Section —</option>
                      {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </ModalField>
                  <ModalField label="Subject" required>
                    <select value={assignSubjectForm.subject} onChange={e => setAssignSubjectForm({ ...assignSubjectForm, subject: e.target.value })} className={modalSelectCls} required>
                      <option value="">— Select Subject —</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
                    </select>
                  </ModalField>
                  <ModalField label="Teacher" required>
                    <select value={assignSubjectForm.teacher} onChange={e => setAssignSubjectForm({ ...assignSubjectForm, teacher: e.target.value })} className={modalSelectCls} required>
                      <option value="">— Select Teacher —</option>
                      {teachers.filter(t => t.is_active).map(t => (
                        <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                      ))}
                    </select>
                  </ModalField>
                </div>
              </ModalBody>
              <ModalFooter>
                <ModalBtnSecondary onClick={() => setShowModal(false)}>Cancel</ModalBtnSecondary>
                <ModalBtnPrimary loading={saving}>Assign</ModalBtnPrimary>
              </ModalFooter>
            </form>
          </Modal>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="page-bottom-safe max-w-[1200px] mx-auto bg-slate-50 px-4 py-4 md:px-6 md:py-6 space-y-6"
    >
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center gap-2 text-xs font-bold text-violet-700 uppercase tracking-wide mb-2 justify-center">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <span>Academic Setup</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Setup Wizard</h1>
        <p className="text-xs text-slate-600 mt-1 font-semibold">Follow the steps to configure your academic year</p>
      </div>

      {/* Step Progress */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-6">
        <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none">
          {STEPS.map((step, idx) => (
            <button
              key={step.id}
              type="button"
              onClick={() => idx <= currentStep && setCurrentStep(idx)}
              disabled={idx > currentStep}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                idx === currentStep
                  ? 'bg-violet-600 text-white shadow-md'
                  : idx < currentStep
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer'
                    : 'bg-slate-50 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                idx < currentStep ? 'bg-emerald-500 text-white' : idx === currentStep ? 'bg-white/20' : 'bg-slate-200'
              }`}>
                {idx < currentStep ? '\u2713' : idx + 1}
              </span>
              <span className="hidden sm:inline">{step.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardBody className="p-6 md:p-8">
              {renderStepContent()}
            </CardBody>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          onClick={goToPrevStep}
          disabled={currentStep === 0}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Previous
        </Button>
        {currentStep < STEPS.length - 1 && (
          <Button variant="primary" onClick={goToNextStep}>
            Next Step
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Button>
        )}
      </div>

      {/* Modal */}
      {renderModal()}
    </motion.div>
  );
};

export default AcademicSetup;
