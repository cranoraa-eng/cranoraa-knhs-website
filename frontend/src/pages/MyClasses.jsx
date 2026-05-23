import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ProfileField = ({ label, value }) => (
  <div className="py-2 border-b border-slate-50 last:border-0">
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
    <p className="text-sm font-bold text-slate-700 truncate">{value || '—'}</p>
  </div>
);

const MyClasses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    if (user?.id) fetchMyClasses();
  }, [user?.id]);

  const fetchMyClasses = async () => {
    try {
      const res = await api.get(`/classroom-subjects/by_teacher/?teacher_id=${user?.id}`);
      setAssignments(res.data);
    } catch (err) {
      toast.error('Failed to load assigned classes');
    } finally {
      setLoading(false);
    }
  };

  const groupedAssignments = useMemo(() => {
    const groups = {};
    assignments.forEach(a => {
      if (!groups[a.classroom]) {
        // Group by sex and sort by last name
        const sortedStudents = [...(a.students || [])].sort((x, y) => {
          // Group by sex (Female first, or Male first? Usually Female first in some contexts, but let's stick to alphabetical if not specified. 
          // Memory says "grouped by sex (Male/Female) and sorted alphabetically by last name")
          if (x.student_sex !== y.student_sex) {
            return x.student_sex === 'female' ? -1 : 1;
          }
          return (x.last_name || '').localeCompare(y.last_name || '');
        });

        groups[a.classroom] = {
          id: a.classroom,
          name: a.classroom_name,
          subjects: [],
          students: sortedStudents
        };
      }
      groups[a.classroom].subjects.push(a);
    });
    return Object.values(groups);
  }, [assignments]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="p-1.5 md:p-4 space-y-3 md:space-y-4 bg-gray-50/50">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 animate-fade-in-up">
        <div>
          <h1 className="text-lg md:text-2xl font-black text-gray-800 tracking-tight uppercase">My Assigned Classes</h1>
          <p className="text-gray-500 text-[8px] md:text-[10px] font-bold uppercase tracking-[0.2em] mt-0.5">Classrooms and subjects you handle</p>
        </div>
      </div>

      {groupedAssignments.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 md:p-12 text-center animate-fade-in-up">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 md:w-10 md:h-10 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-sm md:text-base font-black text-gray-700 mb-1 uppercase tracking-tight">No Classes Assigned</h3>
          <p className="text-[8px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
            You haven't been assigned to any classrooms yet.<br/>Please coordinate with the school administration.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3 md:gap-4 animate-fade-in-up">
          {groupedAssignments.map((classroom) => (
            <div key={classroom.id} className="bg-white border border-gray-200 rounded-xl p-3 md:p-4 hover:shadow-lg transition-all duration-300 group relative border-t-2 border-t-indigo-600 overflow-hidden flex flex-col h-full">
              {/* Classroom Info */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-black text-sm md:text-lg shadow-md flex-shrink-0">
                  {classroom.name?.match(/\d+/)?.[0] || 'C'}
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs md:text-base font-black text-gray-800 leading-tight uppercase truncate">
                    {classroom.name}
                  </h3>
                  <p className="text-[7px] md:text-[8px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-0.5">{classroom.subjects.length} Subjects Handled</p>
                </div>
              </div>

              {/* Subjects List - Ultra Dense */}
              <div className="space-y-1.5 md:space-y-2 mb-3">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Handled Subjects</h4>
                </div>
                <div className="border border-slate-100 rounded-lg overflow-hidden shadow-sm bg-white h-[80px] md:h-[100px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-100">
                  <table className="w-full text-left table-fixed border-separate border-spacing-0">
                    <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                      <tr>
                        <th className="px-2 py-1.5 text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest w-1/2">Subject</th>
                        <th className="px-2 py-1.5 text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {classroom.subjects.map(a => (
                        <tr key={a.id} className="hover:bg-indigo-50/30 transition-colors group/row">
                          <td className="px-2 py-1.5 min-w-0">
                            <div className="flex flex-col">
                              <span className="text-[6px] font-black text-indigo-600 uppercase tracking-tighter">{a.subject_code}</span>
                              <span className="text-[8px] md:text-[9px] font-black text-slate-800 uppercase tracking-tight truncate" title={a.subject_name}>{a.subject_name}</span>
                            </div>
                          </td>
                          <td className="px-2 py-1.5">
                            <div className="flex items-center justify-center gap-1 md:gap-1.5">
                              <button
                                onClick={() => navigate('/grade-input', { 
                                  state: { 
                                    classroomId: classroom.id, 
                                    subjectId: a.subject 
                                  } 
                                })}
                                className="p-1 md:p-1.5 bg-white border border-slate-200 rounded text-violet-500 hover:bg-violet-600 hover:text-white hover:border-violet-600 transition-all active:scale-90 shadow-sm"
                                title="Input Grades"
                              >
                                <svg className="w-2.5 h-2.5 md:w-3 md:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => navigate('/attendance', { 
                                  state: { 
                                    classroomId: classroom.id, 
                                    subjectId: a.subject 
                                  } 
                                })}
                                className="p-1 md:p-1.5 bg-white border border-slate-200 rounded text-emerald-500 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all active:scale-90 shadow-sm"
                                title="Attendance"
                              >
                                <svg className="w-2.5 h-2.5 md:w-3 md:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8l2 2 4-4" />
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

              {/* Students List - Ultra Dense */}
              <div className="flex-1 space-y-1.5 md:space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Enrolled Students</h4>
                  <span className="text-[7px] md:text-[8px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full uppercase tracking-widest leading-none">{classroom.students.length} Total</span>
                </div>
                <div className="border border-slate-100 rounded-lg overflow-hidden shadow-sm bg-white h-[140px] md:h-[180px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-100">
                  <table className="w-full text-left table-fixed border-separate border-spacing-0">
                    <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                      <tr>
                        <th className="px-2 py-1.5 text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest w-1/2">Student Name</th>
                        <th className="px-2 py-1.5 text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest">LRN/ID</th>
                        <th className="px-2 py-1.5 text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {classroom.students.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="px-2 py-4 text-center text-[8px] font-bold text-slate-300 uppercase tracking-widest italic">No students enrolled</td>
                        </tr>
                      ) : (
                        classroom.students.map((student, idx) => (
                          <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-2 py-1.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[7px] md:text-[8px] font-black text-slate-300 w-2.5">{idx + 1}</span>
                                <span className="text-[8px] md:text-[10px] font-bold text-slate-700 uppercase truncate" title={`${student.last_name}, ${student.first_name}`}>
                                  {student.last_name}, {student.first_name}
                                </span>
                              </div>
                            </td>
                            <td className="px-2 py-1.5 text-[7px] md:text-[8px] font-mono font-bold text-slate-400 uppercase truncate">{student.username}</td>
                            <td className="px-2 py-1.5">
                              <div className="flex items-center justify-center gap-1">
                                <button 
                                  onClick={() => { setSelectedStudent(student); setShowProfileModal(true); }}
                                  className="p-1 text-indigo-500 hover:bg-indigo-50 rounded transition-all"
                                  title="View Profile"
                                >
                                  <svg className="w-2.5 h-2.5 md:w-3 md:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </button>
                                <button 
                                  onClick={() => navigate(`/student-grades?student_id=${student.id}`)}
                                  className="p-1 text-emerald-500 hover:bg-emerald-50 rounded transition-all"
                                  title="View Grades"
                                >
                                  <svg className="w-2.5 h-2.5 md:w-3 md:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Decorative accent */}
              <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-indigo-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
            </div>
          ))}
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-white relative">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl font-black border border-white/30 shadow-xl">
                  {selectedStudent.first_name?.charAt(0)}{selectedStudent.last_name?.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight uppercase">{selectedStudent.last_name}, {selectedStudent.first_name}</h2>
                  <p className="text-indigo-100 text-[10px] font-black uppercase tracking-[0.2em] mt-1 opacity-80">Student Profile</p>
                </div>
              </div>
              <button 
                onClick={() => setShowProfileModal(false)}
                className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 transition-all border border-white/10"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-8">
              <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-4">Account Info</h3>
                  <ProfileField label="Student ID / LRN" value={selectedStudent.registration_number || selectedStudent.username} />
                  <ProfileField label="Email Address" value={selectedStudent.email} />
                  <ProfileField label="Account Status" value={selectedStudent.account_status} />
                </div>
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-4">Academic Info</h3>
                  <ProfileField label="Grade Level" value={selectedStudent.grade_level} />
                  <ProfileField label="Gender" value={selectedStudent.student_sex} />
                </div>
              </div>

              <div className="mt-10 flex gap-3">
                <button 
                  onClick={() => {
                    setShowProfileModal(false);
                    navigate(`/student-grades?student_id=${selectedStudent.id}`);
                  }}
                  className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                  View Full Grades
                </button>
                <button 
                  onClick={() => setShowProfileModal(false)}
                  className="px-8 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-100 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyClasses;
