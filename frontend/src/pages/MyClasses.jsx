import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Card, CardHeader, CardBody, CardTitle, Button, Badge, LoadingSpinner, EmptyState, Modal, ModalHeader, ModalBody, ModalFooter } from '../components/ui';

const MyClasses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState(null);

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
        const sortedStudents = [...(a.students || [])].sort((x, y) => {
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
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="page-bottom-safe max-w-[1600px] mx-auto min-h-0 bg-slate-50 px-4 py-4 md:px-6 md:py-6 space-y-5 md:space-y-6"
    >
      {/* Page Header - Official DepEd Style */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span>Teaching Load</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Assigned Classes
          </h1>
          <p className="text-xs text-slate-600 mt-1 font-semibold">
            Classrooms and subjects you handle this semester
          </p>
        </div>

        {/* Stats Summary */}
        <div className="flex gap-3">
          <div className="px-4 py-2 rounded-md bg-blue-50 border border-blue-200">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Sections</p>
            <p className="text-2xl font-extrabold text-blue-700">{groupedAssignments.length}</p>
          </div>
          <div className="px-4 py-2 rounded-md bg-emerald-50 border border-emerald-200">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Subjects</p>
            <p className="text-2xl font-extrabold text-emerald-700">
              {groupedAssignments.reduce((sum, c) => sum + c.subjects.length, 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Classes Grid */}
      {groupedAssignments.length === 0 ? (
        <Card>
          <CardBody className="p-12">
            <EmptyState
              title="No Classes Assigned"
              description="You haven't been assigned to any classrooms yet. Please coordinate with the school administration."
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
            />
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
          {groupedAssignments.map((classroom) => (
            <Card key={classroom.id} className="border-l-4 border-l-blue-500">
              <CardHeader divider>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-extrabold text-lg shadow-sm border border-blue-700">
                      {classroom.name?.match(/\d+/)?.[0] || 'C'}
                    </div>
                    <div>
                      <CardTitle>{classroom.name}</CardTitle>
                      <p className="text-xs font-semibold text-slate-600 mt-0.5">
                        {classroom.subjects.length} {classroom.subjects.length === 1 ? 'Subject' : 'Subjects'} • {classroom.students.length} Students
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedClassroom(classroom)}
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>

              <CardBody>
                {/* Subjects Section */}
                <div className="mb-4">
                  <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                    Subjects Handled
                  </h3>
                  <div className="space-y-2">
                    {classroom.subjects.map(subject => (
                      <div
                        key={subject.id}
                        className="flex items-center justify-between p-3 rounded-md bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-white transition-all group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-extrabold text-blue-700 uppercase tracking-wide mb-0.5">
                            {subject.subject_code}
                          </p>
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {subject.subject_name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <button
                            onClick={() => navigate('/grade-input', { 
                              state: { 
                                classroomId: classroom.id, 
                                subjectId: subject.subject 
                              } 
                            })}
                            className="p-2 rounded-md bg-white border border-slate-300 text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm"
                            title="Input Grades"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => navigate('/attendance', { 
                              state: { 
                                classroomId: classroom.id, 
                                subjectId: subject.subject 
                              } 
                            })}
                            className="p-2 rounded-md bg-white border border-slate-300 text-emerald-600 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all shadow-sm"
                            title="Mark Attendance"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth{2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8l2 2 4-4" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Students Preview */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                      Enrolled Students
                    </h3>
                    <Badge variant="slate" size="sm">
                      {classroom.students.length} Total
                    </Badge>
                  </div>

                  {classroom.students.length === 0 ? (
                    <div className="p-6 rounded-md bg-slate-50 border border-slate-200 text-center">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                        No students enrolled
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="max-h-[200px] overflow-y-auto rounded-md border border-slate-200">
                        <table className="w-full">
                          <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                                #
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                                Name
                              </th>
                              <th className="px-3 py-2 text-center text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-100">
                            {classroom.students.slice(0, 5).map((student, idx) => (
                              <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-3 py-2 text-xs font-bold text-slate-500">
                                  {idx + 1}
                                </td>
                                <td className="px-3 py-2 text-sm font-bold text-slate-900 truncate">
                                  {student.last_name}, {student.first_name}
                                </td>
                                <td className="px-3 py-2">
                                  <div className="flex items-center justify-center gap-1">
                                    <button 
                                      onClick={() => { setSelectedStudent(student); setShowProfileModal(true); }}
                                      className="p-1.5 rounded text-blue-600 hover:bg-blue-50 transition-all"
                                      title="View Profile"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                    </button>
                                    <button 
                                      onClick={() => navigate(`/student-grades?student_id=${student.id}`)}
                                      className="p-1.5 rounded text-emerald-600 hover:bg-emerald-50 transition-all"
                                      title="View Grades"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                      </svg>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {classroom.students.length > 5 && (
                        <button
                          onClick={() => setSelectedClassroom(classroom)}
                          className="w-full mt-2 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-md transition-all uppercase tracking-wide"
                        >
                          + {classroom.students.length - 5} More Students
                        </button>
                      )}
                    </>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Full Classroom Modal */}
      {selectedClassroom && (
        <Modal onClose={() => setSelectedClassroom(null)}>
          <ModalHeader onClose={() => setSelectedClassroom(null)}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-extrabold shadow-sm border border-blue-700">
                {selectedClassroom.name?.match(/\d+/)?.[0] || 'C'}
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">{selectedClassroom.name}</h2>
                <p className="text-xs text-slate-600 font-semibold">Complete Student Roster</p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="max-h-[500px] overflow-y-auto rounded-md border border-slate-200">
              <table className="w-full">
                <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                      Last Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                      First Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                      LRN/ID
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {selectedClassroom.students.map((student, idx) => (
                    <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-xs font-bold text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-slate-900">
                        {student.last_name}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-slate-900">
                        {student.first_name}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-600">
                        {student.registration_number || student.username}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => { 
                              setSelectedClassroom(null); 
                              setSelectedStudent(student); 
                              setShowProfileModal(true); 
                            }}
                            className="p-2 rounded-md bg-white border border-slate-300 text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all"
                            title="View Profile"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedClassroom(null);
                              navigate(`/student-grades?student_id=${student.id}`);
                            }}
                            className="p-2 rounded-md bg-white border border-slate-300 text-emerald-600 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all"
                            title="View Grades"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setSelectedClassroom(null)}>
              Close
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {/* Student Profile Modal */}
      {showProfileModal && selectedStudent && (
        <Modal onClose={() => setShowProfileModal(false)}>
          <ModalHeader onClose={() => setShowProfileModal(false)}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-extrabold text-lg shadow-sm border border-blue-700">
                {selectedStudent.first_name?.charAt(0)}{selectedStudent.last_name?.charAt(0)}
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 uppercase">
                  {selectedStudent.last_name}, {selectedStudent.first_name}
                </h2>
                <p className="text-xs text-blue-700 font-bold uppercase tracking-wide">Student Profile</p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-2 gap-6">
              {/* Account Info */}
              <div className="space-y-4">
                <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-3">
                  Account Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                      Student ID / LRN
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {selectedStudent.registration_number || selectedStudent.username || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                      Email Address
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {selectedStudent.email || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                      Account Status
                    </p>
                    <Badge variant={selectedStudent.account_status === 'active' ? 'green' : 'slate'}>
                      {selectedStudent.account_status || 'Unknown'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Academic Info */}
              <div className="space-y-4">
                <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-3">
                  Academic Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                      Grade Level
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {selectedStudent.grade_level || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                      Gender
                    </p>
                    <p className="text-sm font-bold text-slate-900 capitalize">
                      {selectedStudent.student_sex || '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <div className="flex gap-3 w-full">
              <Button 
                variant="primary"
                onClick={() => {
                  setShowProfileModal(false);
                  navigate(`/student-grades?student_id=${selectedStudent.id}`);
                }}
                className="flex-1"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                View Full Grades
              </Button>
              <Button variant="secondary" onClick={() => setShowProfileModal(false)}>
                Close
              </Button>
            </div>
          </ModalFooter>
        </Modal>
      )}
    </motion.div>
  );
};

export default MyClasses;
