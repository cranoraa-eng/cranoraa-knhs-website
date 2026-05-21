import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { getUser } from '../utils/auth';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const StudentManagement = () => {
  const user = getUser();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const GRADE_ORDER = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await api.get('/users/?role=student');
      setStudents(Array.isArray(response.data) ? response.data : []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch students:', err);
      toast.error('Failed to load students');
      setStudents([]);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this! All associated data (grades, attendance) will be deleted.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/users/${id}/`);
        fetchStudents();
        toast.success('Student account deleted');
      } catch (err) {
        console.error('Failed to delete student:', err);
        toast.error('Failed to delete student');
      }
    }
  };

  const handleResetPassword = async (studentId) => {
    const newPassword = prompt('Enter new password for this student:');
    if (newPassword) {
      if (newPassword.length < 8) {
        toast.error('Password must be at least 8 characters long');
        return;
      }
      try {
        await api.patch(`/users/${studentId}/`, { password: newPassword });
        toast.success('Password reset successfully!');
      } catch (err) {
        console.error('Failed to reset password:', err);
        toast.error('Failed to reset password');
      }
    }
  };

  const handleStartChat = async (studentId) => {
    try {
      await api.post('/chat/rooms/get_or_create_private_chat/', { user_id: studentId });
      navigate('/messages');
    } catch (err) {
      toast.error('Failed to start conversation');
    }
  };

  const handleToggleActive = async (student) => {
    try {
      const response = await api.post(`/users/${student.id}/toggle_active/`);
      toast.success(response.data.status);
      fetchStudents();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const organizedData = useMemo(() => {
    const filtered = students.filter(s => {
      const search = searchQuery.toLowerCase();
      const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
      const lrn = (s.profile?.registration_number || '').toLowerCase();
      return (
        s.email.toLowerCase().includes(search) ||
        fullName.includes(search) ||
        lrn.includes(search)
      );
    });

    // Group by Grade -> Classroom
    const groups = {};
    
    filtered.forEach(s => {
      const grade = s.profile?.grade_level || 'Unassigned';
      const classroom = s.profile?.classroom_name || 'No Classroom';
      
      if (!groups[grade]) groups[grade] = {};
      if (!groups[grade][classroom]) groups[grade][classroom] = [];
      groups[grade][classroom].push(s);
    });

    // Sort Grades
    const sortedGrades = Object.keys(groups).sort((a, b) => {
      const indexA = GRADE_ORDER.indexOf(a);
      const indexB = GRADE_ORDER.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

    return sortedGrades.map(grade => ({
      grade,
      classrooms: Object.keys(groups[grade]).sort().map(classroom => ({
        name: classroom,
        students: groups[grade][classroom].sort((a, b) => a.last_name.localeCompare(b.last_name))
      }))
    }));
  }, [students, searchQuery]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const ProfileField = ({ label, value }) => (
    <div className="border-b border-gray-50 py-3 last:border-0">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm font-bold text-gray-700">{value || <span className="text-gray-300 font-normal">Not provided</span>}</p>
    </div>
  );

  return (
    <div className="overflow-y-auto h-[calc(100vh-4rem)] p-1.5 md:p-6 space-y-2 md:space-y-6 bg-gray-50/50 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-6">
        <div className="text-center md:text-left">
          <h1 className="text-lg md:text-3xl font-black text-gray-800 tracking-tight uppercase">Student Management</h1>
          <p className="text-gray-500 text-[8px] md:text-base mt-0.5 font-medium uppercase tracking-widest">All registered students</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="bg-white px-3 py-1.5 md:px-5 md:py-2.5 rounded-xl md:rounded-2xl border border-gray-200 shadow-sm flex items-center gap-2 md:gap-3">
            <div>
              <p className="text-[7px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Students</p>
              <p className="text-sm md:text-xl font-black text-gray-800 leading-none">{students.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-1.5 md:p-4 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative group max-w-xl mx-auto">
          <svg className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-5 md:h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Search name or LRN..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 md:pl-12 pr-3 md:pr-4 py-1.5 md:py-3 bg-gray-50 border border-gray-200 rounded-lg md:rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 focus:bg-white text-[10px] md:text-sm font-bold transition-all shadow-inner uppercase tracking-wider" 
          />
        </div>
      </div>

      {/* Organized List */}
      <div className="space-y-4 md:space-y-10 pb-6 md:pb-10">
        {organizedData.length === 0 ? (
          <div className="bg-white rounded-2xl md:rounded-3xl border border-gray-200 shadow-sm p-10 md:p-20 text-center">
            <div className="w-12 h-12 md:w-24 md:h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-6">
              <svg className="w-6 h-6 md:w-12 md:h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-sm md:text-2xl font-black text-gray-700 mb-1 md:mb-2 uppercase tracking-tight">No Students Found</h3>
            <p className="text-[10px] md:text-base text-gray-400 font-bold uppercase tracking-widest">Try a different search.</p>
          </div>
        ) : (
          organizedData.map((gradeGroup) => (
            <div key={gradeGroup.grade} className="space-y-2 md:space-y-6">
              <div className="flex items-center gap-2 md:gap-4 px-1 md:px-2">
                <h2 className="text-xs md:text-xl font-black text-gray-800 uppercase tracking-tight">{gradeGroup.grade}</h2>
                <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent"></div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:gap-8">
                {gradeGroup.classrooms.map((cls) => (
                  <div key={cls.name} className="bg-white rounded-lg md:rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-w-0">
                    <div className="px-3 py-1.5 md:px-6 md:py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 md:gap-3">
                        <div className="w-5 h-5 md:w-8 md:h-8 bg-indigo-100 rounded md:rounded-lg flex items-center justify-center">
                          <svg className="w-3 h-3 md:w-4 md:h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <h3 className="font-black text-gray-700 text-[9px] md:text-sm uppercase tracking-wider">{cls.name}</h3>
                      </div>
                      <span className="text-[7px] md:text-[10px] font-black text-indigo-500 bg-indigo-50 px-1.5 py-0.5 md:px-2.5 md:py-1 rounded-full uppercase tracking-widest">
                        {cls.students.length}
                      </span>
                    </div>

                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 max-w-full">
                      <table className="w-full text-left min-w-[400px] md:min-w-full">
                        <thead>
                          <tr className="text-[7px] md:text-[10px] font-black text-white uppercase tracking-widest border-b border-gray-50 bg-[#2D1B4D]">
                            <th className="px-3 py-1.5 md:px-6 md:py-4 w-10 md:w-16">#</th>
                            <th className="px-3 py-1.5 md:px-6 md:py-4">Student</th>
                            <th className="hidden md:table-cell px-6 py-4">Email</th>
                            <th className="hidden md:table-cell px-6 py-4">LRN</th>
                            <th className="px-3 py-1.5 md:px-6 md:py-4 text-center">Status</th>
                            <th className="px-3 py-1.5 md:px-6 md:py-4 text-center">Opt</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {cls.students.map((student, idx) => (
                            <tr key={student.id} className="group hover:bg-purple-50 transition-colors">
                              <td className="px-3 py-1 md:px-6 md:py-4 text-[7px] md:text-xs font-black text-gray-300">{idx + 1}</td>
                              <td className="px-3 py-1 md:px-6 md:py-4">
                                <div className="flex items-center gap-1.5 md:gap-3">
                                  <div className="relative flex-shrink-0">
                                    <div className="w-6 h-6 md:w-8 md:h-8 rounded md:rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black text-[8px] md:text-xs shadow-sm">
                                      {student.first_name?.charAt(0)}{student.last_name?.charAt(0)}
                                    </div>
                                    <div className={`absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 md:w-2.5 md:h-2.5 rounded-full border border-white shadow-sm ${student.is_online ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-[9px] md:text-sm font-black text-gray-800 leading-tight uppercase tracking-tighter truncate">{student.first_name} {student.last_name}</span>
                                    <span className={`text-[6px] md:text-[9px] font-black uppercase tracking-widest truncate ${student.is_online ? 'text-green-500' : 'text-gray-400'}`}>
                                      {student.is_online ? 'Online' : 'Offline'}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="hidden md:table-cell px-6 py-4 text-sm font-medium text-gray-500">{student.email}</td>
                              <td className="hidden md:table-cell px-6 py-4">
                                <span className="text-xs font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                  {student.profile?.registration_number || '—'}
                                </span>
                              </td>
                              <td className="px-3 py-1 md:px-6 md:py-4 text-center">
                                <span className={`text-[7px] md:text-[10px] font-black px-1.5 py-0.5 md:px-2 md:py-1 rounded uppercase tracking-widest ${student.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                  {student.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-3 py-1 md:px-6 md:py-4">
                                <div className="flex items-center justify-center gap-0.5 md:gap-2">
                                  <button
                                    onClick={() => handleToggleActive(student)}
                                    className={`p-1 md:p-2 rounded md:rounded-lg transition-all active:scale-90 ${student.is_active ? 'text-rose-500 hover:bg-rose-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                                    title={student.is_active ? 'Deactivate' : 'Activate'}
                                  >
                                    <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      {student.is_active ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                      ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      )}
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleStartChat(student.id)}
                                    className="p-1 md:p-2 text-violet-500 hover:bg-violet-50 rounded md:rounded-lg transition-all active:scale-90"
                                    title="Send Message"
                                  >
                                    <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => { setSelectedStudent(student); setShowProfileModal(true); }}
                                    className="p-1 md:p-2 text-blue-500 hover:bg-blue-50 rounded md:rounded-lg transition-all active:scale-90"
                                    title="View Profile"
                                  >
                                    <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleResetPassword(student.id)}
                                    className="p-1 md:p-2 text-amber-500 hover:bg-amber-50 rounded md:rounded-lg transition-all active:scale-90"
                                    title="Reset Password"
                                  >
                                    <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDelete(student.id)}
                                    className="p-1 md:p-2 text-red-500 hover:bg-red-50 rounded md:rounded-lg transition-all active:scale-90"
                                    title="Delete Student"
                                  >
                                    <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
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
            </div>
          ))
        )}
      </div>

      {/* Profile Modal */}
      {showProfileModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="p-8 bg-gradient-to-br from-indigo-600 to-purple-700 text-white relative">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white font-black text-3xl border border-white/30 shadow-inner">
                    {selectedStudent.first_name?.charAt(0).toUpperCase()}{selectedStudent.last_name?.charAt(0).toUpperCase()}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-indigo-600 shadow-sm ${selectedStudent.is_online ? 'bg-green-500' : 'bg-gray-300'}`} title={selectedStudent.is_online ? 'Online' : 'Offline'}>
                    {selectedStudent.is_online && <span className="absolute w-full h-full rounded-full bg-green-500 animate-ping opacity-20"></span>}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-black tracking-tight">{selectedStudent.first_name} {selectedStudent.last_name}</h2>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${selectedStudent.is_online ? 'bg-green-500/20 border-green-400 text-green-200' : 'bg-white/10 border-white/20 text-white/60'}`}>
                      {selectedStudent.is_online ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <p className="text-indigo-100 text-sm font-bold uppercase tracking-widest opacity-90">{selectedStudent.email}</p>
                </div>
              </div>
              <button onClick={() => setShowProfileModal(false)} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
              <div className="md:col-span-2 mb-4">
                <h3 className="text-xs font-black text-indigo-500 uppercase tracking-[0.2em] pb-2 border-b-2 border-indigo-50">Personal Information</h3>
              </div>
              <ProfileField label="LRN (Learner Reference Number)" value={selectedStudent.profile?.registration_number} />
              <ProfileField label="Grade Level" value={selectedStudent.profile?.grade_level} />
              <ProfileField label="Sex" value={selectedStudent.profile?.sex} />
              <ProfileField label="Date of Birth" value={selectedStudent.profile?.date_of_birth} />
              <ProfileField label="Nationality" value={selectedStudent.profile?.nationality} />
              <ProfileField label="Province / State" value={selectedStudent.profile?.state} />
              
              <div className="md:col-span-2 mt-6 mb-4">
                <h3 className="text-xs font-black text-indigo-500 uppercase tracking-[0.2em] pb-2 border-b-2 border-indigo-50">Family & Contact</h3>
              </div>
              <ProfileField label="Father's Name" value={selectedStudent.profile?.father_name} />
              <ProfileField label="Mother's Name" value={selectedStudent.profile?.mother_name} />
              <ProfileField label="Phone Number" value={selectedStudent.profile?.phone_number} />
              <ProfileField label="Home Address" value={selectedStudent.profile?.address} />
              <div className="md:col-span-2">
                <ProfileField label="Emergency Contact Info" value={selectedStudent.profile?.contact_information} />
              </div>
            </div>

            <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3">
              <button
                onClick={() => handleStartChat(selectedStudent.id)}
                className="px-6 py-2.5 bg-violet-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-violet-200 hover:bg-violet-700 transition-all active:scale-95 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                Message Student
              </button>
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-6 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all active:scale-95"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
