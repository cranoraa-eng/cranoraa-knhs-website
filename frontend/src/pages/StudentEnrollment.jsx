import { useState, useEffect } from 'react';
import api from '../utils/api';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';

const StudentEnrollment = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [formData, setFormData] = useState({ classroom: '' });

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    if (selectedClassroom) fetchEnrollments(selectedClassroom);
    else setEnrollments([]);
  }, [selectedClassroom]);

  const fetchMeta = async () => {
    setLoading(true);
    try {
      const [classRes, studentRes] = await Promise.all([
        api.get('/classrooms/'),
        api.get('/users/?role=student'),
      ]);
      setClassrooms(classRes.data);
      setStudents(studentRes.data);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async (classroomId) => {
    try {
      const res = await api.get(`/enrollments/?classroom=${classroomId}`);
      setEnrollments(res.data);
    } catch {
      toast.error('Failed to load enrollments');
    }
  };

  const openModal = () => {
    setFormData({ classroom: selectedClassroom });
    setSelectedStudents([]);
    setStudentSearch('');
    setShowModal(true);
  };

  const handleRemove = async (enrollment) => {
    const result = await Swal.fire({
      title: 'Remove Student?',
      text: `Remove "${enrollment.student_name}" from this classroom?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Remove',
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/enrollments/${enrollment.id}/`);
      toast.success('Student removed');
      fetchEnrollments(selectedClassroom);
    } catch {
      toast.error('Failed to remove student');
    }
  };

  const toggleStudentSelection = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedStudents.length === 0) return toast.error('Please select at least one student');
    setSaving(true);
    
    const loadingToast = toast.loading(`Enrolling ${selectedStudents.length} student(s)...`);
    
    try {
      // Since backend usually handles single enrollment, we map and await all
      // If backend had a bulk endpoint, we would use that.
      await Promise.all(selectedStudents.map(studentId => 
        api.post('/enrollments/', {
          classroom: parseInt(formData.classroom),
          student: parseInt(studentId),
        })
      ));
      
      toast.success(`${selectedStudents.length} student(s) enrolled successfully`, { id: loadingToast });
      setShowModal(false);
      fetchEnrollments(selectedClassroom);
    } catch (err) {
      const msg = err.response?.data?.error
        || err.response?.data?.detail
        || err.response?.data?.non_field_errors?.[0];
      toast.error(msg || 'Failed to enroll student(s)', { id: loadingToast });
    } finally {
      setSaving(false);
    }
  };

  const enrolledIds = new Set(enrollments.map(e => e.student));
  const filteredStudents = students.filter(s =>
    ((s.username || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
     (s.email || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
     (`${s.first_name || ''} ${s.last_name || ''}`).toLowerCase().includes(studentSearch.toLowerCase())) &&
    !enrolledIds.has(s.id)
  );

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

  const getRemarksLabel = (avg) => {
    if (!avg) return null;
    const n = parseFloat(avg);
    if (n >= 90) return { label: 'Outstanding', color: 'text-green-600 bg-green-50' };
    if (n >= 85) return { label: 'Very Satisfactory', color: 'text-blue-600 bg-blue-50' };
    if (n >= 80) return { label: 'Satisfactory', color: 'text-yellow-600 bg-yellow-50' };
    if (n >= 75) return { label: 'Fairly Satisfactory', color: 'text-orange-600 bg-orange-50' };
    return { label: 'Did Not Meet Expectations', color: 'text-red-600 bg-red-50' };
  };

  return (
    <div className="p-1.5 md:p-6 space-y-2 md:space-y-6 bg-slate-50/50 max-w-full">
      <div className="mb-2 md:mb-6 text-center md:text-left">
        <h1 className="text-lg md:text-3xl font-black text-slate-800 tracking-tight uppercase">Student Enrollment</h1>
        <p className="text-slate-500 text-[8px] md:text-base mt-0.5 font-medium uppercase tracking-widest">Enroll students per classroom</p>
      </div>

      {/* Classroom picker */}
      <div className={`bg-white border border-slate-200 rounded-xl shadow-sm p-3 md:p-5 transition-all duration-300 ${selectedClassroom ? 'mb-2 md:mb-5' : 'mb-5'}`}>
        <label className="block text-[10px] md:text-sm font-black text-slate-700 mb-1 md:mb-2 uppercase tracking-widest">Select Classroom</label>
        {loading ? (
          <div className="h-8 md:h-10 bg-slate-100 rounded-lg animate-pulse" />
        ) : (
          <select
            value={selectedClassroom}
            onChange={e => setSelectedClassroom(e.target.value)}
            className="w-full px-3 py-1.5 md:px-4 md:py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-violet-500 text-[10px] md:text-sm font-bold shadow-inner uppercase tracking-wider"
          >
            <option value="">— Choose a classroom —</option>
            {sortedClassrooms.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Enrollments table */}
      {selectedClassroom && (
        <div className="bg-white border border-slate-200 rounded-lg md:rounded-xl shadow-sm overflow-hidden min-w-0">
          <div className="flex items-center justify-between px-2 py-1 md:px-6 md:py-4 border-b border-slate-100 bg-[#2D1B4D]">
            <h2 className="font-black text-[9px] md:text-base uppercase tracking-tight !text-white flex items-center gap-1">
              ENROLLED
              <span className="text-[7px] md:text-sm font-bold !text-white">({enrollments.length})</span>
            </h2>
            <button
              onClick={openModal}
              className="flex items-center gap-1 bg-violet-600 hover:bg-violet-700 text-white text-[7px] md:text-sm font-black py-0.5 px-1.5 md:py-2 md:px-3 rounded md:rounded-lg transition-all active:scale-95 uppercase tracking-widest shadow-sm"
            >
              <svg className="w-2.5 h-2.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Enroll
            </button>
          </div>

          {enrollments.length === 0 ? (
            <div className="text-center py-6 md:py-12 text-slate-400 font-bold text-[9px] md:text-sm uppercase tracking-widest">
              No students enrolled yet.
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 max-w-full">
              <table className="w-full min-w-[320px] md:min-w-full">
                <thead className="bg-slate-50">
                  <tr className="text-[6px] md:text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="text-left px-2 py-1 md:px-6 md:py-3">Student</th>
                    <th className="text-center px-1 py-1 md:px-6 md:py-3">Q1</th>
                    <th className="text-center px-1 py-1 md:px-6 md:py-3">Q2</th>
                    <th className="text-center px-1 py-1 md:px-6 md:py-3">Q3</th>
                    <th className="text-center px-1 py-1 md:px-6 md:py-3">Q4</th>
                    <th className="text-center px-1 py-1 md:px-6 md:py-3">AVG</th>
                    <th className="text-center px-2 py-1 md:px-6 md:py-3">OPT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {enrollments.map(e => {
                    const remarks = getRemarksLabel(e.transmuted_average || e.gpa);
                    return (
                      <tr key={e.id} className="hover:bg-violet-50 transition-colors">
                        <td className="px-2 py-1 md:px-6 md:py-4">
                          <div className="font-black text-slate-800 text-[8px] md:text-sm uppercase tracking-tighter truncate max-w-[100px] md:max-w-none">{e.student_name}</div>
                          <div className="text-[6px] md:text-xs text-slate-400 font-bold truncate max-w-[100px] md:max-w-none leading-none">{e.student_email}</div>
                        </td>
                        {['q1','q2','q3','q4'].map(q => (
                          <td key={q} className="px-1 py-1 md:px-6 md:py-4 text-center text-[8px] md:text-sm font-bold text-slate-600">
                            {e[q] ?? <span className="text-slate-300">—</span>}
                          </td>
                        ))}
                        <td className="px-1 py-1 md:px-6 md:py-4 text-center">
                          {remarks ? (
                            <span className={`inline-flex items-center justify-center min-w-[18px] md:min-w-[32px] px-1 py-0 rounded-full text-[7px] md:text-xs font-black shadow-inner ${remarks.color}`}>
                              {e.transmuted_average || e.gpa}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-[8px] md:text-sm">—</span>
                          )}
                        </td>
                        <td className="px-2 py-1 md:px-6 md:py-4 text-center">
                          <button
                            onClick={() => handleRemove(e)}
                            className="p-0.5 md:px-3 md:py-1.5 text-[7px] md:text-xs font-black text-red-700 bg-red-100 hover:bg-red-200 rounded transition-all active:scale-90 uppercase tracking-widest"
                          >
                            Rem
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-2 md:p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-base md:text-xl font-black text-slate-800 uppercase tracking-tight">Enroll Student</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-white rounded-full transition-all text-slate-400 hover:text-slate-600 shadow-sm">
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-3 md:space-y-4">
              <div>
                <label className="block text-[10px] md:text-sm font-black text-slate-700 mb-1.5 uppercase tracking-widest">
                  Select Student
                  <span className="ml-2 text-[8px] md:text-xs font-bold text-slate-400 lowercase tracking-normal">
                    ({filteredStudents.length} available)
                  </span>
                </label>

                {/* Search */}
                <div className="relative mb-2">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search name or email..."
                    value={studentSearch}
                    onChange={e => setStudentSearch(e.target.value)}
                    className="w-full pl-9 pr-9 py-1.5 md:py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-violet-500 text-[10px] md:text-sm font-bold shadow-inner uppercase tracking-wider"
                  />
                  {studentSearch && (
                    <button type="button" onClick={() => setStudentSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
                      <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Student card list */}
                <div className="border border-slate-200 rounded-lg md:rounded-xl overflow-hidden shadow-sm">
                  {filteredStudents.length === 0 ? (
                    <div className="py-6 md:py-8 text-center text-slate-400 text-[10px] md:text-sm font-bold uppercase tracking-widest">
                      <svg className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {studentSearch ? 'No matches' : 'All enrolled'}
                    </div>
                  ) : (
                    <div className="max-h-40 md:max-h-56 overflow-y-auto divide-y divide-slate-100 scrollbar-thin scrollbar-thumb-slate-200">
                      {filteredStudents.map(s => {
                        const fullName = s.first_name && s.last_name
                          ? `${s.first_name} ${s.last_name}`
                          : s.username;
                        const initials = fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                        const isSelected = selectedStudents.includes(s.id);
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => toggleStudentSelection(s.id)}
                            className={`w-full flex items-center gap-2 md:gap-3 px-3 py-2 md:px-4 md:py-3 text-left transition-colors border-l-2 md:border-l-4 ${
                              isSelected
                                ? 'bg-violet-50 border-violet-500'
                                : 'hover:bg-slate-50 border-transparent'
                            }`}
                          >
                            {/* Checkbox-like Indicator */}
                            <div className={`w-3.5 h-3.5 md:w-5 md:h-5 rounded border flex items-center justify-center transition-colors ${
                              isSelected ? 'bg-violet-600 border-violet-600' : 'bg-white border-slate-300'
                            }`}>
                              {isSelected && (
                                <svg className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>

                            {/* Avatar */}
                            <div className={`w-7 h-7 md:w-9 md:h-9 rounded md:rounded-lg flex items-center justify-center text-[8px] md:text-sm font-black flex-shrink-0 shadow-sm ${
                              isSelected
                                ? 'bg-violet-600 text-white'
                                : 'bg-gradient-to-br from-purple-400 to-indigo-500 text-white'
                            }`}>
                              {initials}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0 leading-tight">
                              <div className={`text-[9px] md:text-sm font-black truncate uppercase tracking-tighter ${isSelected ? 'text-purple-800' : 'text-slate-800'}`}>
                                {fullName}
                              </div>
                              <div className="text-[7px] md:text-xs text-slate-400 truncate font-bold">{s.email}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Selected confirmation */}
                {selectedStudents.length > 0 && (
                  <div className="mt-1.5 flex items-center justify-between text-[8px] md:text-xs text-violet-700 bg-violet-50 border border-violet-200 rounded-md md:rounded-lg px-2 py-1 md:px-3 md:py-2 font-bold uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      Selected: {selectedStudents.length} Student(s)
                    </div>
                    <button 
                      type="button"
                      onClick={() => setSelectedStudents([])}
                      className="text-violet-400 hover:text-violet-600 transition-colors px-1"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
              <div className="flex gap-2 md:gap-3 pt-1 md:pt-2">
                <button
                  type="submit"
                  disabled={saving || selectedStudents.length === 0}
                  className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-black py-2 md:py-2.5 rounded md:rounded-lg transition-all active:scale-95 text-[9px] md:text-sm uppercase tracking-widest"
                >
                  {saving ? 'Enrolling...' : `Enroll ${selectedStudents.length || ''}`}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-2 md:py-2.5 rounded md:rounded-lg transition-all active:scale-95 text-[9px] md:text-sm uppercase tracking-widest"
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

export default StudentEnrollment;
