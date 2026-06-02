import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { getUser } from '../utils/auth';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import {
  Card, CardHeader, CardBody, CardTitle, Button, Badge,
  LoadingSpinner, EmptyState, Modal, ModalHeader, ModalBody, ModalFooter
} from '../components/ui';

/**
 * Grade Management - DepEd Academic Style
 * Card-based dashboard for viewing and managing student grades
 */

// Performance level configuration
const PERFORMANCE_LEVELS = {
  outstanding: { min: 90, label: 'Outstanding', shortLabel: 'O', color: 'emerald' },
  verySatisfactory: { min: 85, label: 'Very Satisfactory', shortLabel: 'VS', color: 'blue' },
  satisfactory: { min: 80, label: 'Satisfactory', shortLabel: 'S', color: 'amber' },
  fairlySatisfactory: { min: 75, label: 'Fairly Satisfactory', shortLabel: 'FS', color: 'orange' },
  didNotMeet: { min: 0, label: 'Did Not Meet Expectations', shortLabel: 'DNM', color: 'red' },
};

const getPerformanceLevel = (score) => {
  if (score == null || isNaN(score)) return null;
  if (score >= 90) return PERFORMANCE_LEVELS.outstanding;
  if (score >= 85) return PERFORMANCE_LEVELS.verySatisfactory;
  if (score >= 80) return PERFORMANCE_LEVELS.satisfactory;
  if (score >= 75) return PERFORMANCE_LEVELS.fairlySatisfactory;
  return PERFORMANCE_LEVELS.didNotMeet;
};

const ScoreBadge = ({ score, size = 'md' }) => {
  if (score == null || isNaN(score)) {
    return <span className="text-slate-300 text-xs font-bold">—</span>;
  }
  const level = getPerformanceLevel(parseFloat(score));
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';
  
  return (
    <Badge variant={level?.color || 'slate'} className={sizeClass}>
      {parseFloat(score).toFixed(0)}
    </Badge>
  );
};

const GradeManagement = () => {
  const navigate = useNavigate();
  const user = getUser();

  // State
  const [grades, setGrades] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filterQuarter, setFilterQuarter] = useState('');
  const [filterYear, setFilterYear] = useState(localStorage.getItem('knhs_academic_year') || '2025-2026');
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState(null);

  // Academic year navigation
  const handleYearChange = (dir) => {
    const [start, end] = filterYear.split('-').map(Number);
    const newYear = dir === 'next' ? `${start + 1}-${end + 1}` : `${start - 1}-${end - 1}`;
    setFilterYear(newYear);
    localStorage.setItem('knhs_academic_year', newYear);
  };

  // Load data
  useEffect(() => {
    Promise.all([
      api.get(`/grades/?academic_year=${filterYear}`),
      api.get(`/classrooms/?academic_year=${filterYear}`)
    ])
      .then(([gRes, cRes]) => {
        setGrades(gRes.data.filter(g => g.grade_type === 'final_grade'));
        setClassrooms(cRes.data);
      })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  }, [filterYear]);

  const refresh = async () => {
    try {
      const [gRes, cRes] = await Promise.all([
        api.get(`/grades/?academic_year=${filterYear}`),
        api.get(`/classrooms/?academic_year=${filterYear}`)
      ]);
      setGrades(gRes.data.filter(g => g.grade_type === 'final_grade'));
      setClassrooms(cRes.data);
      toast.success('Data refreshed');
    } catch {
      toast.error('Failed to refresh');
    }
  };

  // Format student name
  const formatName = (fullName = '') => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length < 2) return fullName.toUpperCase();
    const last = parts.pop();
    return `${last.toUpperCase()}, ${parts.join(' ').toUpperCase()}`;
  };

  // Calculate final grade from quarters
  const calculateFinal = (quarters) => {
    const scores = Object.values(quarters)
      .map(g => parseFloat(g.raw_score))
      .filter(s => !isNaN(s));
    if (scores.length === 0) return null;
    return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);
  };

  // Filtered grades
  const filteredGrades = useMemo(() => {
    return grades.filter(g => {
      const q = search.toLowerCase();
      const matchSearch = !q || 
        g.student_name?.toLowerCase().includes(q) || 
        g.subject_name?.toLowerCase().includes(q) ||
        g.classroom_name?.toLowerCase().includes(q);
      const matchQ = !filterQuarter || String(g.quarter) === filterQuarter;
      return matchSearch && matchQ;
    });
  }, [grades, search, filterQuarter]);

  // Build classroom summaries with grade statistics
  const classroomSummaries = useMemo(() => {
    const summaries = {};

    filteredGrades.forEach(g => {
      if (!summaries[g.classroom]) {
        summaries[g.classroom] = {
          id: g.classroom,
          name: g.classroom_name,
          subjects: {},
          totalStudents: new Set(),
          totalGrades: 0,
          gradeSum: 0,
        };
      }

      const classroom = summaries[g.classroom];
      classroom.totalStudents.add(g.student);
      classroom.totalGrades++;
      classroom.gradeSum += parseFloat(g.raw_score) || 0;

      // Group by subject
      if (!classroom.subjects[g.subject]) {
        classroom.subjects[g.subject] = {
          id: g.subject,
          name: g.subject_name,
          code: g.subject_code,
          students: {},
        };
      }

      const subject = classroom.subjects[g.subject];
      if (!subject.students[g.student]) {
        subject.students[g.student] = {
          id: g.student,
          name: g.student_name,
          email: g.student_email,
          sex: g.student_sex,
          quarters: {},
        };
      }

      subject.students[g.student].quarters[g.quarter] = g;
    });

    // Convert sets to counts and calculate averages
    Object.values(summaries).forEach(c => {
      c.studentCount = c.totalStudents.size;
      c.avgGrade = c.totalGrades > 0 ? (c.gradeSum / c.totalGrades).toFixed(2) : null;
      c.subjectCount = Object.keys(c.subjects).length;
    });

    return Object.values(summaries);
  }, [filteredGrades]);

  // Sort classrooms by grade level
  const sortedClassrooms = useMemo(() => {
    return classroomSummaries.sort((a, b) => {
      const numA = parseInt(a.name.match(/\d+/)?.[0] || '0');
      const numB = parseInt(b.name.match(/\d+/)?.[0] || '0');
      if (numA !== numB) return numA - numB;
      return a.name.localeCompare(b.name);
    });
  }, [classroomSummaries]);

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
          <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Grade Overview</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Grade Management
          </h1>
          <p className="text-xs text-slate-600 mt-1 font-semibold">
            View and manage student grades by classroom and subject
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={refresh}
            disabled={loading}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
          {(user?.role === 'admin' || user?.role === 'teacher') && (
            <Button
              variant="primary"
              onClick={() => navigate('/grade-input')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Input Grades
            </Button>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* FILTERS */}
      {/* ══════════════════════════════════════════════════════════════ */}

      <Card>
        <CardBody className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search */}
            <div className="md:col-span-2 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search student, subject, or classroom..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Quarter Filter */}
            <div>
              <select
                value={filterQuarter}
                onChange={e => setFilterQuarter(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-md bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
              >
                <option value="">All Quarters</option>
                <option value="1">Quarter 1</option>
                <option value="2">Quarter 2</option>
                <option value="3">Quarter 3</option>
                <option value="4">Quarter 4</option>
              </select>
            </div>

            {/* Academic Year */}
            <div>
              <div className="flex items-center border border-slate-300 rounded-md overflow-hidden bg-white shadow-sm">
                <button
                  onClick={() => handleYearChange('prev')}
                  className="px-3 py-2.5 hover:bg-slate-50 text-slate-600 border-r border-slate-300 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex-1 text-center text-xs font-bold text-slate-700 select-none">
                  {filterYear}
                </div>
                <button
                  onClick={() => handleYearChange('next')}
                  className="px-3 py-2.5 hover:bg-slate-50 text-slate-600 border-l border-slate-300 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* CLASSROOM CARDS GRID */}
      {/* ══════════════════════════════════════════════════════════════ */}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      ) : sortedClassrooms.length === 0 ? (
        <Card>
          <CardBody className="p-12">
            <EmptyState
              title="No Grade Records Found"
              description={search || filterQuarter ? "Try adjusting your filters" : "Grades will appear here once they are entered"}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            />
          </CardBody>
        </Card>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardBody className="p-4 text-center">
                <div className="text-2xl md:text-3xl font-extrabold text-blue-600">
                  {sortedClassrooms.length}
                </div>
                <div className="text-xs font-bold text-slate-600 uppercase tracking-wide mt-1">
                  Classrooms
                </div>
              </CardBody>
            </Card>

            <Card className="border-l-4 border-l-emerald-500">
              <CardBody className="p-4 text-center">
                <div className="text-2xl md:text-3xl font-extrabold text-emerald-600">
                  {sortedClassrooms.reduce((sum, c) => sum + c.studentCount, 0)}
                </div>
                <div className="text-xs font-bold text-slate-600 uppercase tracking-wide mt-1">
                  Students
                </div>
              </CardBody>
            </Card>

            <Card className="border-l-4 border-l-amber-500">
              <CardBody className="p-4 text-center">
                <div className="text-2xl md:text-3xl font-extrabold text-amber-600">
                  {sortedClassrooms.reduce((sum, c) => sum + c.subjectCount, 0)}
                </div>
                <div className="text-xs font-bold text-slate-600 uppercase tracking-wide mt-1">
                  Subjects
                </div>
              </CardBody>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardBody className="p-4 text-center">
                <div className="text-2xl md:text-3xl font-extrabold text-purple-600">
                  {filteredGrades.length}
                </div>
                <div className="text-xs font-bold text-slate-600 uppercase tracking-wide mt-1">
                  Grade Entries
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Classroom Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {sortedClassrooms.map((classroom, index) => (
              <motion.div
                key={classroom.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card 
                  interactive
                  onClick={() => setSelectedClass(classroom)}
                  className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all"
                >
                  <CardHeader divider>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-extrabold text-lg shadow-sm border border-blue-700">
                          {classroom.name?.match(/\d+/)?.[0] || classroom.name?.charAt(0)}
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {classroom.name}
                          </CardTitle>
                          <p className="text-xs font-semibold text-slate-600 mt-0.5">
                            {classroom.studentCount} Students
                          </p>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </CardHeader>

                  <CardBody>
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center">
                        <div className="text-lg font-extrabold text-blue-600">
                          {classroom.subjectCount}
                        </div>
                        <div className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                          Subjects
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-extrabold text-emerald-600">
                          {classroom.totalGrades}
                        </div>
                        <div className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                          Grades
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-extrabold text-amber-600">
                          {classroom.avgGrade || '—'}
                        </div>
                        <div className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                          Average
                        </div>
                      </div>
                    </div>

                    {/* Subject Pills */}
                    <div>
                      <p className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                        Subjects
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.values(classroom.subjects).slice(0, 4).map(subject => (
                          <Badge key={subject.id} variant="blue" size="sm">
                            {subject.code}
                          </Badge>
                        ))}
                        {Object.keys(classroom.subjects).length > 4 && (
                          <Badge variant="slate" size="sm">
                            +{Object.keys(classroom.subjects).length - 4}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* CLASSROOM DETAIL MODAL */}
      {/* ══════════════════════════════════════════════════════════════ */}

      <AnimatePresence>
        {selectedClass && (
          <ClassroomDetailModal
            classroom={selectedClass}
            onClose={() => setSelectedClass(null)}
            user={user}
            formatName={formatName}
            calculateFinal={calculateFinal}
            refresh={refresh}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// CLASSROOM DETAIL MODAL COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

const ClassroomDetailModal = ({ classroom, onClose, user, formatName, calculateFinal, refresh }) => {
  const [selectedSubject, setSelectedSubject] = useState(null);
  const subjects = Object.values(classroom.subjects);

  const handleLockGrade = async (gradeId, currentStatus) => {
    try {
      await api.patch(`/grades/${gradeId}/`, { is_locked: !currentStatus });
      toast.success(currentStatus ? 'Grade unlocked' : 'Grade locked');
      refresh();
    } catch {
      toast.error('Failed to update lock status');
    }
  };

  const handleDeleteGrade = async (gradeId, studentName) => {
    const result = await Swal.fire({
      title: 'Delete Grade?',
      text: `Delete grade record for ${studentName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Delete',
    });
    if (!result.isConfirmed) return;
    
    try {
      await api.delete(`/grades/${gradeId}/`);
      toast.success('Grade deleted');
      refresh();
    } catch {
      toast.error('Failed to delete grade');
    }
  };

  return (
    <Modal onClose={onClose} size="xl">
      <ModalHeader onClose={onClose}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-extrabold text-lg shadow-sm border border-blue-700">
            {classroom.name?.match(/\d+/)?.[0] || classroom.name?.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">{classroom.name}</h2>
            <p className="text-xs text-blue-700 font-bold uppercase tracking-wide">
              Grade Records • {classroom.studentCount} Students
            </p>
          </div>
        </div>
      </ModalHeader>

      <ModalBody>
        {/* Subject Tabs */}
        <div className="mb-4 flex gap-2 flex-wrap">
          {subjects.map(subject => (
            <button
              key={subject.id}
              onClick={() => setSelectedSubject(selectedSubject?.id === subject.id ? null : subject)}
              className={`px-4 py-2 rounded-md text-xs font-extrabold uppercase tracking-wide transition-all ${
                selectedSubject?.id === subject.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {subject.code}
            </button>
          ))}
        </div>

        {/* Subject Details */}
        {selectedSubject ? (
          <SubjectGradeTable
            subject={selectedSubject}
            user={user}
            formatName={formatName}
            calculateFinal={calculateFinal}
            handleLockGrade={handleLockGrade}
            handleDeleteGrade={handleDeleteGrade}
          />
        ) : (
          <div className="text-center py-12">
            <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">
              Select a subject to view grades
            </p>
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// SUBJECT GRADE TABLE COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

const SubjectGradeTable = ({ subject, user, formatName, calculateFinal, handleLockGrade, handleDeleteGrade }) => {
  const navigate = useNavigate();
  
  // Sort students: Male first, then Female, then by name
  const sortedStudents = useMemo(() => {
    return Object.values(subject.students).sort((a, b) => {
      const sexOrder = { 'male': 1, 'female': 2, 'other': 3 };
      const sexA = sexOrder[a.sex?.toLowerCase()] || 4;
      const sexB = sexOrder[b.sex?.toLowerCase()] || 4;
      
      if (sexA !== sexB) return sexA - sexB;

      const nameA = formatName(a.name).toLowerCase();
      const nameB = formatName(b.name).toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [subject.students, formatName]);

  let maleIdx = 0;
  let femaleIdx = 0;

  return (
    <div>
      <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <h3 className="text-sm font-extrabold text-blue-900 uppercase tracking-wide">
          {subject.name}
        </h3>
        <p className="text-xs font-semibold text-blue-700 mt-0.5">
          {subject.code} • {sortedStudents.length} Students
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-700 uppercase tracking-wider w-12">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-700 uppercase tracking-wider min-w-[180px]">
                Student Name
              </th>
              <th className="px-4 py-3 text-center text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Q1
              </th>
              <th className="px-4 py-3 text-center text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Q2
              </th>
              <th className="px-4 py-3 text-center text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Q3
              </th>
              <th className="px-4 py-3 text-center text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Q4
              </th>
              <th className="px-4 py-3 text-center text-xs font-extrabold text-slate-700 uppercase tracking-wider bg-blue-50">
                Final
              </th>
              <th className="px-4 py-3 text-center text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Remarks
              </th>
              {(user?.role === 'admin' || user?.role === 'teacher') && (
                <th className="px-4 py-3 text-center text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {sortedStudents.map((student, idx) => {
              const currentSex = (student.sex || 'other').toLowerCase();
              
              if (currentSex === 'male') maleIdx++;
              if (currentSex === 'female') femaleIdx++;
              const displayIdx = currentSex === 'male' ? maleIdx : currentSex === 'female' ? femaleIdx : idx + 1;

              const final = calculateFinal(student.quarters);
              const rounded = final != null ? Math.round(parseFloat(final)) : null;
              const performance = getPerformanceLevel(rounded);

              return (
                <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-xs font-bold text-slate-500">
                    {displayIdx}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-md flex items-center justify-center text-white font-extrabold text-xs shadow-sm shrink-0 ${
                        currentSex === 'male' ? 'bg-gradient-to-br from-blue-500 to-blue-600 border border-blue-700' :
                        currentSex === 'female' ? 'bg-gradient-to-br from-rose-500 to-rose-600 border border-rose-700' :
                        'bg-gradient-to-br from-slate-500 to-slate-600 border border-slate-700'
                      }`}>
                        {student.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {formatName(student.name)}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {student.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  
                  {/* Quarter Grades */}
                  {[1, 2, 3, 4].map(quarter => {
                    const grade = student.quarters[quarter];
                    return (
                      <td key={quarter} className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <ScoreBadge score={grade?.raw_score} size="sm" />
                          {grade?.is_locked && (
                            <span className="text-xs" title="Locked">🔒</span>
                          )}
                        </div>
                      </td>
                    );
                  })}

                  {/* Final Grade */}
                  <td className="px-4 py-3 text-center bg-blue-50">
                    <ScoreBadge score={rounded} />
                  </td>

                  {/* Remarks */}
                  <td className="px-4 py-3 text-center">
                    {performance ? (
                      <Badge variant={performance.color} size="sm">
                        {performance.shortLabel}
                      </Badge>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  {(user?.role === 'admin' || user?.role === 'teacher') && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => navigate(`/profile?student_id=${student.id}`)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                          title="View Profile"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => navigate(`/student-grades?student_id=${student.id}`)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-all"
                          title="View Full Grades"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GradeManagement;
