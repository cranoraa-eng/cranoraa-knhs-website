import { useState, useEffect } from 'react';
import api from '../utils/api';
import { getStoredUser } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { LoadingSpinner, EmptyState, Button } from '../components/ui';

const SubjectAssignment = () => {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [classrooms, setClassrooms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [subjectSearch, setSubjectSearch] = useState('');
  const [formData, setFormData] = useState({ classroom: '', subject: '', teacher: '' });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'admin') {
      toast.error('Access denied. Admin only.');
      navigate('/dashboard');
      return;
    }
    fetchMeta();
  }, []);

  useEffect(() => {
    if (selectedClassroom) fetchAssignments(selectedClassroom);
    else setAssignments([]);
  }, [selectedClassroom]);

  const fetchMeta = async () => {
    setLoading(true);
    try {
      const [classRes, subjectRes, teacherRes] = await Promise.all([
        api.get('/classrooms/'),
        api.get('/subjects/'),
        api.get('/users/?role=teacher'),
      ]);
      setClassrooms(classRes.data);
      setSubjects(subjectRes.data);
      setTeachers(teacherRes.data);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async (classroomId) => {
    try {
      const res = await api.get(`/classroom-subjects/by_classroom/?classroom_id=${classroomId}`);
      setAssignments(res.data);
    } catch {
      toast.error('Failed to load assignments');
    }
  };

  const openModal = () => {
    setFormData({ classroom: selectedClassroom, subject: '', teacher: '' });
    setSelectedAssignment(null);
    setSubjectSearch('');
    setShowModal(true);
  };

  const handleEdit = (assignment) => {
    setFormData({
      classroom: assignment.classroom,
      subject: assignment.subject,
      teacher: assignment.teacher
    });
    setSelectedAssignment(assignment);
    setSubjectSearch('');
    setShowModal(true);
  };

  const handleDelete = async (assignment) => {
    const result = await Swal.fire({
      title: 'Remove Assignment?',
      text: `Remove "${assignment.subject_name}" from this classroom?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Remove',
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/classroom-subjects/${assignment.id}/`);
      toast.success('Assignment removed');
      fetchAssignments(selectedClassroom);
    } catch {
      toast.error('Failed to remove assignment');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject) return toast.error('Please select a subject');
    if (!formData.teacher) return toast.error('Please select a teacher');
    setSaving(true);
    try {
      if (selectedAssignment) {
        await api.patch(`/classroom-subjects/${selectedAssignment.id}/`, formData);
        toast.success('Assignment updated');
      } else {
        await api.post('/classroom-subjects/', formData);
        toast.success('Subject assigned');
      }
      setShowModal(false);
      fetchAssignments(selectedClassroom);
    } catch (err) {
      const msg = err.response?.data?.non_field_errors?.[0] || err.response?.data?.detail;
      toast.error(msg || 'This subject is already assigned to this classroom');
    } finally {
      setSaving(false);
    }
  };

  const filteredSubjects = subjects.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(subjectSearch.toLowerCase()) ||
      s.code.toLowerCase().includes(subjectSearch.toLowerCase());

    // Auto-filter by classroom's grade level
    const selectedClassroomObj = classrooms.find(c => String(c.id) === String(selectedClassroom));
    const classroomLevel = selectedClassroomObj?.name
      ? (['Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12']
          .find(l => selectedClassroomObj.name.toLowerCase().includes(l.toLowerCase())))
      : null;
    const matchLevel = !classroomLevel || !s.grade_level ||
      s.grade_level.toLowerCase() === classroomLevel.toLowerCase();

    return matchSearch && matchLevel;
  });

  const assignedSubjectIds = new Set(assignments.map(a => a.subject));

  // Sort classrooms by grade level (Grade 7-12)
  const sortedClassrooms = [...classrooms].sort((a, b) => {
    const gradeOrder = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
    const getGrade = (name) => gradeOrder.find(g => name.toLowerCase().includes(g.toLowerCase())) || '';
    const gradeA = getGrade(a.name);
    const gradeB = getGrade(b.name);
    const indexA = gradeOrder.indexOf(gradeA);
    const indexB = gradeOrder.indexOf(gradeB);
    if (indexA === -1 && indexB === -1) return a.name.localeCompare(b.name);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  return (
    <div className="p-4 md:p-6 space-y-6 page-bottom-safe">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-fade-in-up">
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Subject Assignment</h1>
          <p className="text-slate-500 text-sm md:text-base mt-1 font-medium">Assign subjects and teachers to classrooms</p>
        </div>
      </div>

      {/* Classroom picker */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 animate-fade-in-up [animation-delay:100ms]">
        <div className="relative group max-w-xl">
          <select
            value={selectedClassroom}
            onChange={e => setSelectedClassroom(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white text-sm font-bold transition-all shadow-inner appearance-none cursor-pointer pr-10"
          >
            <option value="">— Select Classroom —</option>
            {sortedClassrooms.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-violet-500 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
      </div>

      {/* Assignments table */}
      {selectedClassroom && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-fade-in-up [animation-delay:200ms]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                Assigned Subjects
                <span className="px-2 py-0.5 bg-violet-100 text-violet-600 text-[10px] font-black rounded-full uppercase tracking-wider">{assignments.length}</span>
              </h2>
            </div>
            <button
              onClick={openModal}
              className="flex items-center justify-center gap-2 bg-[#2D1B4D] hover:bg-[#3D2B5D] text-white text-sm font-bold py-2 px-5 rounded-xl transition-all shadow-md active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Assign Subject
            </button>
          </div>

          {assignments.length === 0 ? (
            <EmptyState
              icon={
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              }
              title="No Subjects Assigned"
              message="This classroom doesn't have any subjects yet."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {assignments.map((a, idx) => {
                return (
                  <div key={a.id} className={`p-5 hover:bg-violet-50/50 transition-all group ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'}`}>
                    <div className="flex items-center gap-5">
                      {/* Subject icon/card */}
                      <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg transition-transform group-hover:scale-105">
                        {a.subject_code?.substring(0, 2).toUpperCase() || 'SB'}
                      </div>

                      {/* Subject info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <h3 className="text-base font-black text-slate-800 tracking-tight leading-none">{a.subject_name}</h3>
                            <p className="text-[10px] font-black text-violet-500 uppercase tracking-widest mt-1.5">{a.subject_code}</p>
                            
                            {/* Grade level mismatch warning */}
                            {(() => {
                              const cls = classrooms.find(c => String(c.id) === String(selectedClassroom));
                              const classroomLevel = cls?.name
                                ? (['Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12']
                                    .find(l => cls.name.toLowerCase().includes(l.toLowerCase())))
                                : null;
                              const subjectLevel = subjects.find(s => s.id === a.subject)?.grade_level;
                              const mismatch = classroomLevel && subjectLevel &&
                                subjectLevel.toLowerCase() !== classroomLevel.toLowerCase();
                              return mismatch ? (
                                <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1 w-fit shadow-sm">
                                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                  Level Mismatch: {subjectLevel}
                                </div>
                              ) : null;
                            })()}
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Teacher badge */}
                            <div className="flex items-center gap-2.5 px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl shadow-sm transition-all group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 group">
                              <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center group-hover:bg-white group-hover:text-blue-600 transition-colors">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                              <span className="text-xs font-black tracking-tight">{a.teacher_name}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(a)}
                                className="p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm active:scale-95"
                                title="Edit Teacher"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              </button>

                              <button
                                onClick={() => handleDelete(a)}
                                className="p-2.5 text-red-600 bg-red-50 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-sm active:scale-95"
                                title="Remove Assignment"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Assign Subject Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg border border-gray-300 shadow-2xl rounded-sm flex flex-col max-h-[92vh]" onClick={e => e.stopPropagation()}>
            <div className="bg-[#5e2a84] flex items-center justify-between px-5 py-3 flex-shrink-0 border-b-2 border-purple-900">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 rounded-full bg-white/20 border border-white/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-widest leading-none">{selectedAssignment ? 'Edit Assignment' : 'Assign Subject'}</h2>
                  <p className="text-purple-200 text-[10px] mt-0.5 font-medium uppercase tracking-wide">Link subject and teacher to classroom</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowModal(false)}
                className="ml-4 w-7 h-7 flex items-center justify-center rounded text-white/60 hover:bg-white/20 hover:text-white transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="px-6 py-5 overflow-y-auto flex-1 space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-gray-700 uppercase tracking-wider">Select Subject</label>
                    {(() => {
                      const cls = classrooms.find(c => String(c.id) === String(selectedClassroom));
                      const level = cls?.name
                        ? (['Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12']
                            .find(l => cls.name.toLowerCase().includes(l.toLowerCase())))
                        : null;
                      return level ? (
                        <span className="text-[9px] font-black text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {level} Only
                        </span>
                      ) : null;
                    })()}
                  </div>

                  {/* Search box */}
                  {!selectedAssignment ? (
                    <div className="relative group">
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-purple-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Quick search by name or code..."
                        value={subjectSearch}
                        onChange={e => setSubjectSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-sm bg-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 placeholder:text-gray-400"
                      />
                      {subjectSearch && (
                        <button type="button" onClick={() => setSubjectSearch('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="px-4 py-3 bg-violet-50 border border-violet-100 rounded-sm text-sm font-black text-violet-700 uppercase tracking-widest flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-violet-600 text-white flex items-center justify-center">
                        {selectedAssignment.subject_code?.charAt(0)}
                      </div>
                      {selectedAssignment.subject_name}
                    </div>
                  )}

                  {/* Subject card list */}
                  {!selectedAssignment && (
                  <div className="border border-gray-200 rounded-sm overflow-hidden shadow-sm bg-gray-50">
                    {filteredSubjects.length === 0 ? (
                      <div className="py-12 text-center text-gray-400">
                        <svg className="w-10 h-10 mx-auto mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <p className="text-xs font-bold uppercase tracking-widest opacity-60">No subjects match filters</p>
                      </div>
                    ) : (
                      <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 scrollbar-thin scrollbar-thumb-gray-200">
                        {filteredSubjects.map(s => {
                          const isAssigned = assignedSubjectIds.has(s.id);
                          const isSelected = String(formData.subject) === String(s.id);
                          return (
                            <button key={s.id} type="button" disabled={isAssigned}
                              onClick={() => !isAssigned && setFormData({ ...formData, subject: String(s.id) })}
                              className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-all ${
                                isAssigned ? 'opacity-40 cursor-not-allowed grayscale bg-gray-100'
                                  : isSelected ? 'bg-violet-600 text-white shadow-lg shadow-violet-200 z-10'
                                  : 'hover:bg-white bg-transparent'
                              }`}>
                              <span className={`flex-shrink-0 font-mono text-[10px] font-black px-2 py-1 rounded uppercase tracking-tight shadow-sm ${
                                isSelected ? 'bg-white text-violet-600' : 'bg-gray-200 text-gray-600'
                              }`}>{s.code}</span>
                              <div className="flex-1 min-w-0">
                                <div className={`text-sm font-black tracking-tight truncate ${isSelected ? 'text-white' : 'text-gray-800'}`}>{s.name}</div>
                                {s.grade_level && (
                                  <div className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${isSelected ? 'text-purple-200' : 'text-gray-400'}`}>{s.grade_level}</div>
                                )}
                              </div>
                              {isAssigned ? (
                                <span className="flex-shrink-0 text-[8px] font-black uppercase tracking-widest bg-gray-200 text-gray-500 px-2 py-1 rounded-full border border-gray-300">Assigned</span>
                              ) : isSelected ? (
                                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm">
                                  <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">Assigned Teacher <span className="text-red-600">*</span></label>
                  <select value={formData.teacher} onChange={e => setFormData({ ...formData, teacher: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-sm bg-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                    required>
                    <option value="">Select a teacher for this subject</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.first_name && t.last_name ? `${t.first_name} ${t.last_name}` : t.username} ({t.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3 flex-shrink-0">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 bg-white text-gray-700 text-xs font-black uppercase tracking-widest border border-gray-300 hover:bg-gray-100 rounded-sm">
                  Cancel
                </button>
                <button type="submit" disabled={!formData.subject || !formData.teacher || saving}
                  className="px-6 py-2.5 bg-[#5e2a84] text-white text-xs font-black uppercase tracking-widest hover:bg-purple-700 rounded-sm">
                  {saving ? 'Saving...' : selectedAssignment ? 'Update Assignment' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectAssignment;
