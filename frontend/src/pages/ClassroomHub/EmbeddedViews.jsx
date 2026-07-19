import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
  Card, CardHeader, CardBody, CardTitle, Button, Badge,
  LoadingSpinner, EmptyState
} from '../../components/ui';
import Modal, { ModalBody, ModalFooter, ModalBtnPrimary, ModalBtnSecondary } from '../../components/ui/Modal';
import {
  ArrowLeft, Users, Award, Search, BarChart2, Trash2, Edit2, Download, X, Check
} from 'lucide-react';

// Grade Management View - Custom inline implementation with edit, delete, export
export const GradeManagementView = ({ classroom, onBack }) => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingGrade, setEditingGrade] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState('all');

  // Modal state for confirmations
  const [modalState, setModalState] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null
  });

  // Load subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await api.get(`/classroom-subjects/by_classroom/?classroom_id=${classroom.id}`);
        setSubjects(res.data);
        if (res.data.length > 0) {
          setSelectedSubject(res.data[0].subject.toString());
        }
      } catch {
        toast.error('Failed to load subjects');
      }
    };
    fetchSubjects();
  }, [classroom.id]);

  // Load grades - FIXED: Wrapped in useCallback with correct dependencies
  const fetchGrades = useCallback(async () => {
    if (!selectedSubject) return;
    setLoading(true);
    setGrades([]); // Clear immediately before fetching new subject's grades
    try {
      const res = await api.get(`/grades/?classroom=${classroom.id}&subject=${selectedSubject}&grade_type=final_grade`);
      
      // Only process grades that actually belong to the selected subject
      const relevantGrades = res.data.filter(g => g.subject.toString() === selectedSubject.toString());

      // Group by student and store full grade data
      const studentGrades = {};
      relevantGrades.forEach(g => {
        if (!studentGrades[g.student]) {
          studentGrades[g.student] = {
            id: g.student,
            name: g.student_name,
            email: g.student_email,
            profile_picture: g.student_profile_picture,
            quarters: {},
            gradeIds: {},
            gradeData: {}
          };
        }
        studentGrades[g.student].quarters[`q${g.quarter}`] = parseFloat(g.raw_score);
        studentGrades[g.student].gradeIds[`q${g.quarter}`] = g.id;
        studentGrades[g.student].gradeData[`q${g.quarter}`] = g;
      });
      setGrades(Object.values(studentGrades));
    } catch {
      toast.error('Failed to load grades');
    } finally {
      setLoading(false);
    }
  }, [classroom.id, selectedSubject]);

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  const filteredGrades = useMemo(() => {
    if (!searchQuery) return grades;
    const query = searchQuery.toLowerCase();
    return grades.filter(g => g.name?.toLowerCase().includes(query));
  }, [grades, searchQuery]);

  const calculateFinalGrade = (quarters) => {
    const scores = Object.values(quarters).filter(s => !isNaN(s));
    if (scores.length === 0) return null;
    return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);
  };

  const getPerformanceColor = (grade) => {
    if (!grade) return 'slate';
    if (grade >= 90) return 'green';
    if (grade >= 85) return 'blue';
    if (grade >= 80) return 'violet';
    if (grade >= 75) return 'amber';
    return 'red';
  };

  const handleEdit = (studentId, quarter, currentGrade) => {
    setEditingGrade({ studentId, quarter });
    setEditValue(currentGrade?.toString() || '');
  };

  const handleSaveEdit = async () => {
    if (!editingGrade) return;
    
    const { studentId, quarter } = editingGrade;
    const student = grades.find(g => g.id === studentId);
    const gradeId = student?.gradeIds[quarter];
    const originalGrade = student?.gradeData[quarter];
    
    if (!gradeId || !originalGrade) {
      toast.error('Grade record not found');
      setEditingGrade(null);
      return;
    }

    // Safety check: confirm this grade belongs to the selected subject
    if (originalGrade.subject.toString() !== selectedSubject.toString()) {
      toast.error('Subject mismatch — please refresh and try again');
      setEditingGrade(null);
      return;
    }

    const newValue = parseFloat(editValue);
    if (isNaN(newValue) || newValue < 0 || newValue > 100) {
      toast.error('Invalid grade value (0-100)');
      return;
    }

    try {
      // Use PUT with full grade object
      await api.put(`/grades/${gradeId}/`, {
        student: originalGrade.student,
        subject: originalGrade.subject,
        classroom: originalGrade.classroom,
        teacher: originalGrade.teacher,
        grade_type: originalGrade.grade_type,
        quarter: originalGrade.quarter,
        academic_year: originalGrade.academic_year,
        raw_score: newValue,
        total_score: originalGrade.total_score || 100
      });
      toast.success('Grade updated successfully');
      setEditingGrade(null);
      fetchGrades();
    } catch (error) {
      console.error('Update error:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.detail || 'Failed to update grade';
      toast.error(errorMsg);
    }
  };

  const handleDelete = async (studentId, quarter) => {
    const student = grades.find(g => g.id === studentId);
    const gradeId = student?.gradeIds[quarter];
    const gradeData = student?.gradeData[quarter];
    
    if (!gradeId) {
      toast.error('Grade record not found');
      return;
    }

    // Safety check: confirm this grade belongs to the selected subject
    if (gradeData && gradeData.subject.toString() !== selectedSubject.toString()) {
      toast.error('Subject mismatch — please refresh and try again');
      return;
    }

    setModalState({
      open: true,
      title: 'Delete Grade?',
      message: `Delete ${quarter.toUpperCase()} grade for ${student.name}? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await api.delete(`/grades/${gradeId}/`);
          toast.success('Grade deleted successfully');
          fetchGrades();
          setModalState(prev => ({ ...prev, open: false }));
        } catch (error) {
          console.error('Delete error:', error);
          const errorMsg = error.response?.data?.error || error.response?.data?.detail || 'Failed to delete grade';
          toast.error(errorMsg);
        }
      }
    });
  };

  const handleDeleteAllQuarter = async () => {
    if (selectedQuarter === 'all') {
      toast.error('Select a specific quarter to delete');
      return;
    }

    setModalState({
      open: true,
      title: 'Delete All Quarter Grades?',
      message: `Delete ALL ${selectedQuarter.toUpperCase()} grades for this class? This cannot be undone.`,
      onConfirm: async () => {
        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        for (const student of grades) {
          const gradeId = student.gradeIds[selectedQuarter];
          if (gradeId) {
            try {
              await api.delete(`/grades/${gradeId}/`);
              successCount++;
            } catch (error) {
              console.error(`Delete error for grade ${gradeId}:`, error);
              errorCount++;
              errors.push(error.response?.data?.error || error.message);
            }
          }
        }

        if (successCount > 0) {
          toast.success(`Deleted ${successCount} grade(s)`);
          fetchGrades();
        }
        if (errorCount > 0) {
          toast.error(`Failed to delete ${errorCount} grade(s). Check permissions.`);
          if (errors.length > 0) {
            console.error('Delete errors:', errors);
          }
        }
        setModalState(prev => ({ ...prev, open: false }));
      }
    });
  };

  const handleExport = () => {
    if (filteredGrades.length === 0) {
      toast.error('No data to export');
      return;
    }

    // Create CSV content
    const headers = ['#', 'Student Name', 'Q1', 'Q2', 'Q3', 'Q4', 'Final Grade'];
    const rows = filteredGrades.map((student, idx) => {
      const finalGrade = calculateFinalGrade(student.quarters);
      return [
        idx + 1,
        student.name,
        student.quarters.q1 || '-',
        student.quarters.q2 || '-',
        student.quarters.q3 || '-',
        student.quarters.q4 || '-',
        finalGrade || '-'
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${classroom.name}_${subjects.find(s => s.subject.toString() === selectedSubject)?.subject_name || 'grades'}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Grades exported successfully');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Overview
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!selectedSubject || filteredGrades.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader divider>
          <div className="flex items-center justify-between">
            <CardTitle>Grade Management - {classroom.name}</CardTitle>
          </div>
        </CardHeader>
        <CardBody className="p-6">
          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Subject
              </label>
              <select
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">Select subject</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.subject}>
                    {s.subject_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Quarter Filter
              </label>
              <select
                value={selectedQuarter}
                onChange={e => setSelectedQuarter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="all">All Quarters</option>
                <option value="q1">Quarter 1</option>
                <option value="q2">Quarter 2</option>
                <option value="q3">Quarter 3</option>
                <option value="q4">Quarter 4</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Search Students
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by name..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>
          </div>

          {selectedQuarter !== 'all' && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-600" />
                <span className="text-sm text-amber-900 font-medium">
                  Bulk Actions for {selectedQuarter.toUpperCase()}
                </span>
              </div>
              <Button variant="outline" size="sm" className="border-red-300 text-red-600 hover:bg-red-50" onClick={handleDeleteAllQuarter}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete All {selectedQuarter.toUpperCase()}
              </Button>
            </div>
          )}

          {/* Grades Table */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner />
            </div>
          ) : !selectedSubject ? (
            <div className="text-center py-12">
              <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600">Select a subject to view grades</p>
            </div>
          ) : filteredGrades.length === 0 ? (
            <EmptyState
              title="No Grades Found"
              description={searchQuery ? "No students match your search" : "No grades have been entered yet"}
              icon={<Award className="w-8 h-8" />}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b-2 border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Student</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-700 uppercase">Q1</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-700 uppercase">Q2</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-700 uppercase">Q3</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-700 uppercase">Q4</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-700 uppercase">Final</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {filteredGrades.map((student) => {
                    const finalGrade = calculateFinalGrade(student.quarters);
                    return (
                      <tr key={student.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm text-slate-500 font-semibold">{filteredGrades.indexOf(student) + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {student.profile_picture ? (
                              <img src={student.profile_picture} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-xs">
                                {student.name?.split(' ').map(n => n.charAt(0)).join('')}
                              </div>
                            )}
                            <span className="text-sm font-semibold text-slate-900">{student.name}</span>
                          </div>
                        </td>
                        {['q1', 'q2', 'q3', 'q4'].map(quarter => (
                          <td key={quarter} className="px-4 py-3 text-center">
                            {editingGrade?.studentId === student.id && editingGrade?.quarter === quarter ? (
                              <div className="flex items-center justify-center gap-1">
                                <input
                                  type="number"
                                  value={editValue}
                                  onChange={e => setEditValue(e.target.value)}
                                  className="w-16 px-2 py-1 text-sm border border-violet-300 rounded focus:outline-none focus:ring-2 focus:ring-violet-500"
                                  min="0"
                                  max="100"
                                  autoFocus
                                />
                                <button onClick={handleSaveEdit} className="p-1 text-green-600 hover:bg-green-50 rounded">
                                  <Check className="w-4 h-4" />
                                </button>
                                <button onClick={() => setEditingGrade(null)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : student.quarters[quarter] ? (
                              <div className="inline-flex items-center gap-1.5">
                                <Badge variant={getPerformanceColor(student.quarters[quarter])} className="font-semibold">
                                  {student.quarters[quarter]}
                                </Badge>
                                <div className="flex gap-0.5">
                                  <button
                                    onClick={() => handleEdit(student.id, quarter, student.quarters[quarter])}
                                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    title="Edit grade"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(student.id, quarter)}
                                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Delete grade"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-center">
                          {finalGrade ? (
                            <Badge variant={getPerformanceColor(parseFloat(finalGrade))} className="font-bold text-base px-3 py-1">
                              {finalGrade}
                            </Badge>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Confirmation Modal */}
      <Modal
        open={modalState.open}
        onClose={() => setModalState(prev => ({ ...prev, open: false }))}
        title={modalState.title}
        size="md"
      >
        <ModalBody>
          <p className="text-sm text-slate-700">{modalState.message}</p>
        </ModalBody>
        <ModalFooter>
          <ModalBtnSecondary onClick={() => setModalState(prev => ({ ...prev, open: false }))}>
            Cancel
          </ModalBtnSecondary>
          <ModalBtnPrimary onClick={() => {
            if (modalState.onConfirm) {
              modalState.onConfirm();
            }
          }}>
            Confirm
          </ModalBtnPrimary>
        </ModalFooter>
      </Modal>
    </div>
  );
};

// Attendance View — full-featured system matching /attendance page
const ATTENDANCE_STATUS_CONFIG = {
  present: { label: 'Present', short: 'P', color: 'emerald', buttonClass: 'bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-700' },
  absent:  { label: 'Absent',  short: 'A', color: 'red',     buttonClass: 'bg-red-600 text-white hover:bg-red-700 border-red-700' },
  late:    { label: 'Late',    short: 'L', color: 'amber',   buttonClass: 'bg-amber-600 text-white hover:bg-amber-700 border-amber-700' },
  excused: { label: 'Excused', short: 'E', color: 'violet',  buttonClass: 'bg-violet-600 text-white hover:bg-violet-700 border-violet-700' },
};

const getTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const AttendanceView = ({ classroom, onBack, isStudent = false }) => {
  const { user } = useAuth();
  const todayStr = useMemo(() => getTodayStr(), []);

  // For students, default to history view and hide mark view
  const availableViews = isStudent ? ['history', 'analytics'] : ['mark', 'history', 'analytics'];
  const [view, setView] = useState(() => isStudent ? 'history' : 'mark');
  
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [students, setStudents] = useState([]);
  const [draftAttendance, setDraftAttendance] = useState({});
  const [draftRemarks, setDraftRemarks] = useState({});
  const [savedAttendance, setSavedAttendance] = useState({});
  const [savedRemarks, setSavedRemarks] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // History state
  const [history, setHistory] = useState([]);
  const [historyDate, setHistoryDate] = useState(todayStr);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Analytics state
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // For students, filter students to only show themselves
  const visibleStudents = isStudent 
    ? students.filter(s => s.student === user?.id)
    : students;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Overview
        </Button>
        <div className="flex rounded-lg border border-slate-300 overflow-hidden shadow-sm">
          {availableViews.map(v => {
            const labels = { mark: 'Mark', history: 'History', analytics: 'Analytics' };
            const icons = { mark: '✏️', history: '📋', analytics: '📊' };
            return (
              <button key={v.key} onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide transition-all ${view === v ? 'bg-violet-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
                <span className="mr-1">{icons[v]}</span>{labels[v]}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ MARK VIEW - Teachers only ═══ */}
      {!isStudent && view === 'mark' && (
        <>
          <Card>
            <CardBody className="p-4">
              {isWeekend(selectedDate) && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-amber-800 uppercase tracking-wide">Weekend Detected ({getDayName(selectedDate)})</p>
                    <p className="text-xs font-semibold text-amber-700 mt-0.5">Marking on weekends is typically not required.</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">Date</label>
                  <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 text-sm font-semibold shadow-sm transition-all" />
                </div>
                {students.length > 0 && (
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">Quick Mark All</label>
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" onClick={() => markAllDraft('present')}
                        className="flex-1 bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100">Present</Button>
                      <Button variant="secondary" size="sm" onClick={() => markAllDraft('absent')}
                        className="flex-1 bg-red-50 text-red-700 border-red-300 hover:bg-red-100">Absent</Button>
                    </div>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {!loadingStudents && students.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {[{ key: 'present', label: 'Present', color: 'emerald' }, { key: 'absent', label: 'Absent', color: 'red' },
                { key: 'late', label: 'Late', color: 'amber' }, { key: 'excused', label: 'Excused', color: 'violet' },
                { key: 'unmarked', label: 'Unmarked', color: 'slate' }].map(s => (
                <div key={s.key} className={`rounded-lg border-l-4 border-l-${s.color}-500 bg-white p-3 text-center shadow-sm`}>
                  <div className={`text-2xl font-extrabold text-${s.color}-600`}>{stats[s.key] || 0}</div>
                  <div className="text-xs font-bold text-slate-600 uppercase tracking-wide mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {attendanceRate !== null && (
            <Card>
              <CardBody className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">Attendance Rate</span>
                  <span className={`text-lg font-extrabold ${attendanceRate >= 75 ? 'text-emerald-600' : 'text-red-600'}`}>{attendanceRate}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3">
                  <div className={`h-3 rounded-full transition-all ${attendanceRate >= 75 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${attendanceRate}%` }} />
                </div>
              </CardBody>
            </Card>
          )}

          {loadingStudents ? (
            <div className="flex items-center justify-center h-48"><LoadingSpinner /></div>
          ) : students.length === 0 ? (
            <Card><CardBody className="p-12">
              <EmptyState title="No Students" description="No students enrolled in this class" icon={<Users className="w-8 h-8" />} />
            </CardBody></Card>
          ) : (
            <>
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-700 uppercase tracking-wider w-12">#</th>
                        <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-700 uppercase tracking-wider">Student Name</th>
                        <th className="px-4 py-3 text-center text-xs font-extrabold text-slate-700 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-700 uppercase tracking-wider hidden md:table-cell">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {visibleStudents.map((s, i) => {
                        const status = draftAttendance[s.student]?.status;
                        const savedStatus = savedAttendance[s.student]?.status;
                        const changed = status !== savedStatus;
                        const name = s.student_name || 'Unknown';
                        return (
                          <tr key={s.student}
                            className={`hover:bg-slate-50 transition-colors ${status === 'absent' ? 'bg-red-50/30' : status === 'late' ? 'bg-amber-50/30' : status === 'present' ? 'bg-emerald-50/20' : ''}`}>
                            <td className="px-4 py-3 text-xs font-bold text-slate-500">{i + 1}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {s.student_profile_picture ? (
                                  <img src={s.student_profile_picture} alt="" className="w-9 h-9 rounded-md object-cover ring-2 ring-white shadow-sm shrink-0" />
                                ) : (
                                  <div className="w-9 h-9 rounded-md bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-white font-extrabold text-xs shadow-sm border border-violet-700 shrink-0">
                                    {name.split(' ').map(n => n.charAt(0).toUpperCase()).join('').slice(0, 2)}
                                  </div>
                                )}
                                <div>
                                  <p className="text-sm font-bold text-slate-900">{name}</p>
                                  {changed && <Badge variant="blue" size="sm" className="mt-0.5">Unsaved</Badge>}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-1">
                                {Object.keys(ATTENDANCE_STATUS_CONFIG).map(key => {
                                  const cfg = ATTENDANCE_STATUS_CONFIG[key];
                                  return (
                                    <button key={key} onClick={() => markDraft(s.student, key)}
                                      className={`px-2 py-2 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-extrabold uppercase tracking-wide rounded border transition-all ${status === key ? cfg.buttonClass + ' shadow-sm' : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'}`}
                                      aria-label={`Mark ${name} as ${cfg.label}`}
                                      aria-pressed={status === key}
                                      title={cfg.label}>
                                      {cfg.short}
                                    </button>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell">
                              <input type="text" value={draftRemarks[s.student] || ''}
                                onChange={e => setDraftRemarks(prev => ({ ...prev, [s.student]: e.target.value }))}
                                placeholder="Add note..."
                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>

              {hasChanges && (
                <>
                  <div className="flex justify-end">
                    <Button variant="primary" onClick={saveAttendance} disabled={submitting}>
                      {submitting ? 'Saving...' : 'Save Attendance'}
                    </Button>
                  </div>
                  <div className="md:hidden">
                    <Button variant="primary" onClick={saveAttendance} disabled={submitting} className="w-full">
                      {submitting ? 'Saving...' : 'Save Attendance'}
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}

      {/* ═══ HISTORY VIEW ═══ */}
      {view === 'history' && (
        <>
          <Card>
            <CardBody className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">Date</label>
                  <div className="flex gap-2">
                    <input type="date" value={historyDate} onChange={e => setHistoryDate(e.target.value)}
                      className="flex-1 px-3 py-2.5 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 text-sm font-semibold shadow-sm transition-all" />
                    {historyDate && <Button variant="secondary" size="sm" onClick={() => setHistoryDate('')}>All</Button>}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {loadingHistory ? (
            <div className="flex items-center justify-center h-48"><LoadingSpinner /></div>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-700 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-700 uppercase tracking-wider">Student</th>
                      <th className="px-4 py-3 text-center text-xs font-extrabold text-slate-700 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-700 uppercase tracking-wider hidden md:table-cell">Remarks</th>
                      <th className="px-4 py-3 text-center text-xs font-extrabold text-slate-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {history.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">No records found</td></tr>
                    ) : history.map((record) => {
                      const cfg = ATTENDANCE_STATUS_CONFIG[record.status];
                      const date = new Date(record.date + 'T00:00:00');
                      return (
                        <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-bold text-slate-900">
                            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-slate-900">{record.student_name}</td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant={cfg?.color || 'slate'}>{cfg?.label || record.status}</Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 hidden md:table-cell">{record.remarks || '—'}</td>
                          <td className="px-4 py-3 text-center">
                            <button onClick={() => deleteAttendance(record)} className="p-2 rounded-md text-red-600 hover:bg-red-50 transition-all" title="Delete Record">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      {/* ═══ ANALYTICS VIEW ═══ */}
      {view === 'analytics' && (
        <>
          {loadingAnalytics ? (
            <div className="flex items-center justify-center h-48"><LoadingSpinner /></div>
          ) : !analytics ? (
            <Card><CardBody className="p-12">
              <EmptyState title="No Analytics Available" description="No attendance data to analyze" icon={<BarChart2 className="w-8 h-8" />} />
            </CardBody></Card>
          ) : (
            <>
              {analytics.pie_data && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {analytics.pie_data.map(item => (
                    <div key={item.name} className={`rounded-lg border-l-4 border-l-${item.name === 'Present' ? 'emerald' : item.name === 'Late' ? 'amber' : item.name === 'Absent' ? 'red' : 'violet'}-500 bg-white p-4 text-center shadow-sm`}>
                      <div className={`text-3xl font-extrabold text-${item.name === 'Present' ? 'emerald' : item.name === 'Late' ? 'amber' : item.name === 'Absent' ? 'red' : 'violet'}-600 mb-1`}>{item.value}</div>
                      <div className="text-xs font-bold text-slate-600 uppercase tracking-wide">{item.name}</div>
                    </div>
                  ))}
                </div>
              )}

              {analytics.daily_trends && analytics.daily_trends.length > 0 && (
                <Card>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-700 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-center text-xs font-extrabold text-slate-700 uppercase tracking-wider">Present</th>
                          <th className="px-4 py-3 text-center text-xs font-extrabold text-slate-700 uppercase tracking-wider hidden sm:table-cell">Late</th>
                          <th className="px-4 py-3 text-center text-xs font-extrabold text-slate-700 uppercase tracking-wider hidden md:table-cell">Excused</th>
                          <th className="px-4 py-3 text-center text-xs font-extrabold text-slate-700 uppercase tracking-wider">Rate</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {analytics.daily_trends.slice(-14).reverse().map(d => (
                          <tr key={d.date} className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-sm font-bold text-slate-900">
                              {new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </td>
                            <td className="px-4 py-3 text-center text-sm font-bold text-emerald-600">{d.present}</td>
                            <td className="px-4 py-3 text-center text-sm font-bold text-amber-600 hidden sm:table-cell">{d.late}</td>
                            <td className="px-4 py-3 text-center text-sm font-bold text-violet-600 hidden md:table-cell">{d.excused}</td>
                            <td className="px-4 py-3 text-center">
                              <Badge variant={d.rate >= 75 ? 'green' : 'red'}>{d.rate}%</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

// Analytics View - Custom inline implementation
export const AnalyticsView = ({ classroom, onBack }) => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await api.get(`/classroom-subjects/by_classroom/?classroom_id=${classroom.id}`);
        setSubjects(res.data);
        if (res.data.length > 0) {
          setSelectedSubject(res.data[0].subject.toString());
        }
      } catch {
        toast.error('Failed to load subjects');
      }
    };
    fetchSubjects();
  }, [classroom.id]);

  // Load analytics
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!selectedSubject) return;
      setLoading(true);
      try {
        const res = await api.get(`/grades/?classroom=${classroom.id}&subject=${selectedSubject}&grade_type=final_grade`);
        
        const grades = res.data;
        const scores = grades.map(g => parseFloat(g.raw_score)).filter(s => !isNaN(s));
        
        if (scores.length > 0) {
          const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
          const sorted = [...scores].sort((a, b) => a - b);
          const median = sorted.length % 2 === 0
            ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
            : sorted[Math.floor(sorted.length / 2)];
          
          const passing = scores.filter(s => s >= 75).length;
          const failing = scores.filter(s => s < 75).length;
          
          const distribution = {
            '90-100': scores.filter(s => s >= 90 && s <= 100).length,
            '85-89': scores.filter(s => s >= 85 && s < 90).length,
            '80-84': scores.filter(s => s >= 80 && s < 85).length,
            '75-79': scores.filter(s => s >= 75 && s < 80).length,
            'Below 75': scores.filter(s => s < 75).length,
          };

          setAnalytics({
            average: avg.toFixed(2),
            median: median.toFixed(2),
            highest: Math.max(...scores),
            lowest: Math.min(...scores),
            passing,
            failing,
            total: scores.length,
            distribution
          });
        } else {
          setAnalytics(null);
        }
      } catch {
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [classroom.id, selectedSubject]);

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Overview
      </Button>

      <Card>
        <CardHeader divider>
          <CardTitle>Analytics - {classroom.name}</CardTitle>
        </CardHeader>
        <CardBody className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Subject
            </label>
            <select
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Select subject</option>
              {subjects.map(s => (
                <option key={s.id} value={s.subject}>
                  {s.subject_name}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner />
            </div>
          ) : !selectedSubject ? (
            <div className="text-center py-12">
              <BarChart2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600">Select a subject to view analytics</p>
            </div>
          ) : !analytics ? (
            <EmptyState
              title="No Data"
              description="No grades available for analysis"
              icon={<BarChart2 className="w-8 h-8" />}
            />
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-violet-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-violet-600">{analytics.average}</div>
                  <div className="text-xs text-violet-700 uppercase font-semibold mt-1">Average</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600">{analytics.median}</div>
                  <div className="text-xs text-blue-700 uppercase font-semibold mt-1">Median</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">{analytics.highest}</div>
                  <div className="text-xs text-green-700 uppercase font-semibold mt-1">Highest</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-red-600">{analytics.lowest}</div>
                  <div className="text-xs text-red-700 uppercase font-semibold mt-1">Lowest</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-slate-700">{analytics.total}</div>
                  <div className="text-xs text-slate-600 uppercase font-semibold mt-1">Total Students</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {analytics.passing} ({((analytics.passing / analytics.total) * 100).toFixed(1)}%)
                  </div>
                  <div className="text-xs text-green-700 uppercase font-semibold mt-1">Passing {'(≥75)'}</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {analytics.failing} ({((analytics.failing / analytics.total) * 100).toFixed(1)}%)
                  </div>
                  <div className="text-xs text-red-700 uppercase font-semibold mt-1">Failing {'(<75)'}</div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Grade Distribution</h3>
                <div className="space-y-3">
                  {Object.entries(analytics.distribution).map(([range, count]) => {
                    const percentage = (count / analytics.total) * 100;
                    const colorClass = range === '90-100' ? 'bg-green-500' :
                                     range === '85-89' ? 'bg-blue-500' :
                                     range === '80-84' ? 'bg-violet-500' :
                                     range === '75-79' ? 'bg-amber-500' :
                                     'bg-red-500';
                    const labelInside = percentage >= 15; // only show text inside bar if wide enough
                    return (
                      <div key={range}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-semibold text-slate-700">{range}</span>
                          <span className="text-slate-500 text-xs">{count} student{count !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="relative w-full bg-slate-200 rounded-full h-6 overflow-hidden">
                          <div
                            className={`h-full ${colorClass} transition-all duration-500 flex items-center`}
                            style={{ width: `${Math.max(percentage, 0)}%` }}
                          >
                            {labelInside && (
                              <span className="pl-2 text-white text-xs font-bold select-none whitespace-nowrap">
                                {percentage.toFixed(1)}%
                              </span>
                            )}
                          </div>
                          {!labelInside && count > 0 && (
                            <span
                              className="absolute top-1/2 -translate-y-1/2 text-slate-700 text-xs font-bold select-none"
                              style={{ left: `calc(${percentage}% + 6px)` }}
                            >
                              {percentage.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
