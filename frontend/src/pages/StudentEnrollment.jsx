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
  const [formData, setFormData] = useState({ classroom: '', student: '' });

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
    setFormData({ classroom: selectedClassroom, student: '' });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.student) return toast.error('Please select a student');
    setSaving(true);
    try {
      await api.post('/enrollments/', {
        classroom: parseInt(formData.classroom),
        student: parseInt(formData.student),
      });
      toast.success('Student enrolled');
      setShowModal(false);
      fetchEnrollments(selectedClassroom);
    } catch (err) {
      const msg = err.response?.data?.error
        || err.response?.data?.detail
        || err.response?.data?.non_field_errors?.[0];
      toast.error(msg || 'Failed to enroll student');    } finally {
      setSaving(false);
    }
  };

  const enrolledIds = new Set(enrollments.map(e => e.student));
  const filteredStudents = students.filter(s =>
    (s.username.toLowerCase().includes(studentSearch.toLowerCase()) ||
     s.email.toLowerCase().includes(studentSearch.toLowerCase())) &&
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
    <div className="overflow-y-auto h-[calc(100vh-4rem)] p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Student Enrollment</h1>
        <p className="text-gray-500 mt-1">Manage student enrollment per classroom</p>
      </div>

      {/* Classroom picker */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mb-5">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Select Classroom</label>
        {loading ? (
          <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
        ) : (
          <select
            value={selectedClassroom}
            onChange={e => setSelectedClassroom(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
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
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">
              Enrolled Students
              <span className="ml-2 text-sm font-normal text-gray-400">({enrollments.length})</span>
            </h2>
            <button
              onClick={openModal}
              className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Enroll Student
            </button>
          </div>

          {enrollments.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No students enrolled yet. Click "Enroll Student" to add students.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Q1</th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Q2</th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Q3</th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Q4</th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Average</th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {enrollments.map(e => {
                    const remarks = getRemarksLabel(e.transmuted_average || e.gpa);
                    return (
                      <tr key={e.id} className="hover:bg-purple-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-800 text-sm">{e.student_name}</div>
                          <div className="text-xs text-gray-400">{e.student_email}</div>
                        </td>
                        {['q1','q2','q3','q4'].map(q => (
                          <td key={q} className="px-6 py-4 text-center text-sm text-gray-600">
                            {e[q] ?? <span className="text-gray-300">—</span>}
                          </td>
                        ))}
                        <td className="px-6 py-4 text-center">
                          {remarks ? (
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${remarks.color}`}>
                              {e.transmuted_average || e.gpa}
                            </span>
                          ) : (
                            <span className="text-gray-300 text-sm">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleRemove(e)}
                            className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
                          >
                            Remove
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">Enroll Student</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Select Student
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    ({filteredStudents.length} available)
                  </span>
                </label>

                {/* Search */}
                <div className="relative mb-2">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={studentSearch}
                    onChange={e => setStudentSearch(e.target.value)}
                    className="w-full pl-9 pr-9 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                  {studentSearch && (
                    <button type="button" onClick={() => setStudentSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Student card list */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  {filteredStudents.length === 0 ? (
                    <div className="py-8 text-center text-gray-400 text-sm">
                      <svg className="w-8 h-8 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {studentSearch ? 'No students match your search' : 'All students are already enrolled'}
                    </div>
                  ) : (
                    <div className="max-h-56 overflow-y-auto divide-y divide-gray-100">
                      {filteredStudents.map(s => {
                        const fullName = s.first_name && s.last_name
                          ? `${s.first_name} ${s.last_name}`
                          : s.username;
                        const initials = fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                        const isSelected = String(formData.student) === String(s.id);
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, student: String(s.id) })}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-l-4 ${
                              isSelected
                                ? 'bg-purple-50 border-purple-500'
                                : 'hover:bg-gray-50 border-transparent'
                            }`}
                          >
                            {/* Avatar */}
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                              isSelected
                                ? 'bg-purple-600 text-white'
                                : 'bg-gradient-to-br from-purple-400 to-indigo-500 text-white'
                            }`}>
                              {initials}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className={`text-sm font-semibold truncate ${isSelected ? 'text-purple-800' : 'text-gray-800'}`}>
                                {fullName}
                              </div>
                              <div className="text-xs text-gray-400 truncate">{s.email}</div>
                            </div>

                            {/* Checkmark */}
                            {isSelected && (
                              <svg className="flex-shrink-0 w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Selected confirmation */}
                {formData.student && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-purple-700 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Selected: <strong className="ml-1">
                      {(() => {
                        const s = students.find(s => String(s.id) === String(formData.student));
                        return s ? (s.first_name && s.last_name ? `${s.first_name} ${s.last_name}` : s.username) : '';
                      })()}
                    </strong>
                  </div>
                )}

                <p className="text-xs text-gray-400 mt-1.5">Already-enrolled students are hidden from this list.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
                >
                  {saving ? 'Enrolling...' : 'Enroll'}
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

export default StudentEnrollment;
