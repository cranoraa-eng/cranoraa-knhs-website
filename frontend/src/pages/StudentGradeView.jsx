import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';
import {
  Card, CardHeader, CardBody, CardTitle, Button, Badge,
  LoadingSpinner, EmptyState
} from '../components/ui';

/**
 * Student Grade View - DepEd Official Report Card Style
 * Professional grade report for students and parents
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
  const n = parseFloat(score);
  if (n >= 90) return PERFORMANCE_LEVELS.outstanding;
  if (n >= 85) return PERFORMANCE_LEVELS.verySatisfactory;
  if (n >= 80) return PERFORMANCE_LEVELS.satisfactory;
  if (n >= 75) return PERFORMANCE_LEVELS.fairlySatisfactory;
  return PERFORMANCE_LEVELS.didNotMeet;
};

const ScoreBadge = ({ score, size = 'md' }) => {
  if (score == null || isNaN(score)) {
    return <span className="text-slate-300 text-sm font-bold">—</span>;
  }
  const level = getPerformanceLevel(parseFloat(score));
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';
  
  return (
    <Badge variant={level?.color || 'slate'} className={sizeClass}>
      {parseFloat(score).toFixed(0)}
    </Badge>
  );
};

const StudentGradeView = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const studentIdParam = searchParams.get('student_id');
  const isViewingOther = !!studentIdParam;

  // State
  const [grades, setGrades] = useState([]);
  const [viewingUser, setViewingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterQuarter, setFilterQuarter] = useState('');
  const [filterYear, setFilterYear] = useState(localStorage.getItem('knhs_academic_year') || '2025-2026');
  const [filterSubject, setFilterSubject] = useState('');

  // Academic year navigation
  const handleYearChange = (dir) => {
    const [start, end] = filterYear.split('-').map(Number);
    const newYear = dir === 'next' ? `${start + 1}-${end + 1}` : `${start - 1}-${end - 1}`;
    setFilterYear(newYear);
    localStorage.setItem('knhs_academic_year', newYear);
  };

  // Load grades
  useEffect(() => {
    if (studentIdParam) {
      Promise.all([
        api.get(`/grades/?student=${studentIdParam}&academic_year=${filterYear}`),
        api.get(`/users/${studentIdParam}/`),
      ])
        .then(([gRes, uRes]) => {
          setGrades(gRes.data.filter(g => g.grade_type === 'final_grade'));
          setViewingUser(uRes.data);
        })
        .catch(() => toast.error('Failed to load student grades'))
        .finally(() => setLoading(false));
    } else {
      api.get(`/grades/my_grades/?academic_year=${filterYear}`)
        .then(r => setGrades(r.data.filter(g => g.grade_type === 'final_grade')))
        .catch(() => toast.error('Failed to load grades'))
        .finally(() => setLoading(false));
    }
  }, [studentIdParam, filterYear]);

  // Filter grades
  const filtered = grades.filter(g => {
    const matchQ = !filterQuarter || String(g.quarter) === filterQuarter;
    const matchS = !filterSubject || String(g.subject) === filterSubject;
    return matchQ && matchS;
  });

  // Group by subject
  const bySubject = filtered.reduce((acc, g) => {
    if (!acc[g.subject]) {
      acc[g.subject] = {
        subject_name: g.subject_name,
        subject_code: g.subject_code,
        quarters: {},
      };
    }
    acc[g.subject].quarters[g.quarter] = g;
    return acc;
  }, {});

  const uniqueSubjects = [
    ...new Map(
      grades.map(g => [g.subject, { id: g.subject, name: g.subject_name }])
    ).values(),
  ];

  // Calculate overall average
  const allScores = filtered
    .map(g => parseFloat(g.raw_score))
    .filter(v => !isNaN(v));
  const overallAvg = allScores.length
    ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(2)
    : null;
  const overallRounded = overallAvg ? Math.round(parseFloat(overallAvg)) : null;
  const overallPerformance = getPerformanceLevel(overallRounded);

  const subjectEntries = Object.values(bySubject);

  const displayName = viewingUser
    ? viewingUser.first_name && viewingUser.last_name
      ? `${viewingUser.first_name} ${viewingUser.last_name}`
      : viewingUser.username
    : user?.first_name && user?.last_name
    ? `${user.first_name} ${user.last_name}`
    : user?.username;

  // PDF Export Handler
  const handlePDFDownload = () => {
    if (!displayName) return toast.error('Student information not available');

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('KIWALAN NATIONAL HIGH SCHOOL', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Official Student Report Card', pageWidth / 2, 28, { align: 'center' });
    
    // Student Info
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Student: ${displayName}`, 20, 45);
    doc.text(`Academic Year: ${filterYear}`, 20, 52);
    
    if (filterQuarter) {
      doc.text(`Quarter: ${filterQuarter}`, 20, 59);
    }
    
    // Table headers
    let yPos = 70;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Subject', 20, yPos);
    doc.text('Q1', 120, yPos, { align: 'center' });
    doc.text('Q2', 140, yPos, { align: 'center' });
    doc.text('Q3', 160, yPos, { align: 'center' });
    doc.text('Q4', 180, yPos, { align: 'center' });
    doc.text('Final', 200, yPos, { align: 'right' });
    
    doc.line(20, yPos + 2, 200, yPos + 2);
    yPos += 8;
    
    // Table rows
    doc.setFont('helvetica', 'normal');
    subjectEntries.forEach((entry) => {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = 20;
      }
      
      const q1 = entry.quarters[1]?.raw_score || '—';
      const q2 = entry.quarters[2]?.raw_score || '—';
      const q3 = entry.quarters[3]?.raw_score || '—';
      const q4 = entry.quarters[4]?.raw_score || '—';
      
      const scores = [q1, q2, q3, q4]
        .map(s => parseFloat(s))
        .filter(s => !isNaN(s));
      const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(0) : '—';
      
      doc.text(entry.subject_name, 20, yPos);
      doc.text(String(q1), 120, yPos, { align: 'center' });
      doc.text(String(q2), 140, yPos, { align: 'center' });
      doc.text(String(q3), 160, yPos, { align: 'center' });
      doc.text(String(q4), 180, yPos, { align: 'center' });
      doc.text(String(avg), 200, yPos, { align: 'right' });
      
      yPos += 7;
    });
    
    // General Average
    if (overallAvg) {
      yPos += 5;
      doc.line(20, yPos, 200, yPos);
      yPos += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('General Average:', 20, yPos);
      doc.text(String(overallRounded), 200, yPos, { align: 'right' });
      
      if (overallPerformance) {
        yPos += 7;
        doc.text('Performance Level:', 20, yPos);
        doc.text(overallPerformance.label, 200, yPos, { align: 'right' });
      }
    }
    
    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 15, { align: 'center' });
    doc.text('Kiwalan National High School - Official Digital Campus', pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    doc.save(`${displayName.replace(/\s+/g, '_')}_Grades_${filterYear}.pdf`);
    toast.success('Report card downloaded');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="page-bottom-safe max-w-[1400px] mx-auto bg-slate-50 px-4 py-4 md:px-6 md:py-6 space-y-5 md:space-y-6"
    >
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* PAGE HEADER WITH SCHOOL IDENTITY */}
      {/* ══════════════════════════════════════════════════════════════ */}
      
      <Card className="border-b-4 border-b-blue-600">
        <CardBody className="p-4 md:p-6">
          <div className="text-center">
            {/* School Seal */}
            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg border-4 border-white ring-2 ring-violet-200">
                K
              </div>
            </div>

            {/* School Name */}
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 uppercase tracking-tight">
              Kiwalan National High School
            </h1>
            <p className="text-xs md:text-sm font-bold text-violet-700 uppercase tracking-wider mt-1">
              Official Student Report Card
            </p>
            <p className="text-xs font-semibold text-slate-600 mt-1">
              Excellence in Education, Service to Community
            </p>
          </div>
        </CardBody>
      </Card>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* STUDENT INFORMATION */}
      {/* ══════════════════════════════════════════════════════════════ */}

      <Card>
        <CardHeader divider>
          <div className="flex items-center gap-2 text-xs font-bold text-violet-700 uppercase tracking-wide">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Student Information</span>
          </div>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Student Name
                </label>
                <p className="text-sm font-bold text-slate-900">
                  {displayName || 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  LRN / Student ID
                </label>
                <p className="text-sm font-bold text-slate-900">
                  {(viewingUser?.username || user?.username) || 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Grade Level
                </label>
                <Badge variant="blue" size="md">
                  {(viewingUser?.profile?.grade_level || user?.profile?.grade_level) || 'N/A'}
                </Badge>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* FILTERS AND CONTROLS */}
      {/* ══════════════════════════════════════════════════════════════ */}

      <Card>
        <CardBody className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Quarter Filter */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                Quarter
              </label>
              <select
                value={filterQuarter}
                onChange={e => setFilterQuarter(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-md bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 transition-all"
              >
                <option value="">All Quarters</option>
                <option value="1">Quarter 1</option>
                <option value="2">Quarter 2</option>
                <option value="3">Quarter 3</option>
                <option value="4">Quarter 4</option>
              </select>
            </div>

            {/* Subject Filter */}
            <div className="md:col-span-2">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                Subject
              </label>
              <select
                value={filterSubject}
                onChange={e => setFilterSubject(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-md bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 transition-all"
              >
                <option value="">All Subjects</option>
                {uniqueSubjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Academic Year */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                Academic Year
              </label>
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

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-slate-200">
            {isViewingOther && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/grade-management')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Overview
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={handlePDFDownload}
              disabled={!subjectEntries.length}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* GENERAL AVERAGE CARD */}
      {/* ══════════════════════════════════════════════════════════════ */}

      {overallAvg && !loading && (
        <Card className="border-l-4 border-l-blue-600 bg-gradient-to-r from-blue-50 to-white">
          <CardBody className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  General Average
                </p>
                <div className="flex items-center gap-3">
                  <div className="text-4xl md:text-5xl font-extrabold text-violet-600">
                    {overallRounded}
                  </div>
                  {overallPerformance && (
                    <Badge variant={overallPerformance.color} className="text-sm px-3 py-1.5">
                      {overallPerformance.label}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-2 font-semibold">
                  Based on {allScores.length} grade{allScores.length === 1 ? '' : 's'} 
                  {filterQuarter && ` (Quarter ${filterQuarter})`}
                </p>
              </div>

              {/* Grade Scale Reference */}
              <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                <p className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                  Performance Scale
                </p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="emerald" size="sm">90-100</Badge>
                    <span className="text-slate-600 font-semibold">Outstanding</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="blue" size="sm">85-89</Badge>
                    <span className="text-slate-600 font-semibold">Very Satisfactory</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="amber" size="sm">80-84</Badge>
                    <span className="text-slate-600 font-semibold">Satisfactory</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="orange" size="sm">75-79</Badge>
                    <span className="text-slate-600 font-semibold">Fairly Satisfactory</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="red" size="sm">Below 75</Badge>
                    <span className="text-slate-600 font-semibold">Did Not Meet</span>
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* STATISTICS CARDS */}
      {/* ══════════════════════════════════════════════════════════════ */}

      {!loading && subjectEntries.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardBody className="p-4 text-center">
              <div className="text-2xl md:text-3xl font-extrabold text-violet-600">
                {subjectEntries.length}
              </div>
              <div className="text-xs font-bold text-slate-600 uppercase tracking-wide mt-1">
                Total Subjects
              </div>
            </CardBody>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <CardBody className="p-4 text-center">
              <div className="text-2xl md:text-3xl font-extrabold text-emerald-600">
                {allScores.filter(s => s >= 90).length}
              </div>
              <div className="text-xs font-bold text-slate-600 uppercase tracking-wide mt-1">
                Outstanding
              </div>
            </CardBody>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardBody className="p-4 text-center">
              <div className="text-2xl md:text-3xl font-extrabold text-amber-600">
                {allScores.filter(s => s >= 75).length}
              </div>
              <div className="text-xs font-bold text-slate-600 uppercase tracking-wide mt-1">
                Passing
              </div>
            </CardBody>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardBody className="p-4 text-center">
              <div className="text-2xl md:text-3xl font-extrabold text-red-600">
                {allScores.filter(s => s < 75).length}
              </div>
              <div className="text-xs font-bold text-slate-600 uppercase tracking-wide mt-1">
                Needs Improvement
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* GRADE REPORT TABLE */}
      {/* ══════════════════════════════════════════════════════════════ */}

      <Card>
        <CardHeader divider>
          <CardTitle subtitle={`Detailed grade breakdown for ${subjectEntries.length} subject${subjectEntries.length === 1 ? '' : 's'}`}>
            Grade Report
          </CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : subjectEntries.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No Grades Available"
                description={filterQuarter || filterSubject ? "Try adjusting your filters" : "Grades will appear here once they are entered by your teachers"}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b-2 border-slate-200 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-700 uppercase tracking-wider min-w-[200px]">
                      Subject
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-extrabold text-slate-700 uppercase tracking-wider w-24">
                      Q1
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-extrabold text-slate-700 uppercase tracking-wider w-24">
                      Q2
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-extrabold text-slate-700 uppercase tracking-wider w-24">
                      Q3
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-extrabold text-slate-700 uppercase tracking-wider w-24">
                      Q4
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-extrabold text-slate-700 uppercase tracking-wider w-24 bg-violet-50">
                      Final
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-extrabold text-slate-700 uppercase tracking-wider w-40">
                      Performance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {subjectEntries.map((entry, idx) => {
                    const q1Score = entry.quarters[1]?.raw_score;
                    const q2Score = entry.quarters[2]?.raw_score;
                    const q3Score = entry.quarters[3]?.raw_score;
                    const q4Score = entry.quarters[4]?.raw_score;

                    // Calculate final grade (average of all quarters)
                    const scores = [q1Score, q2Score, q3Score, q4Score]
                      .map(s => parseFloat(s))
                      .filter(s => !isNaN(s));
                    const finalAvg = scores.length 
                      ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(0)
                      : null;
                    const performance = getPerformanceLevel(finalAvg);

                    return (
                      <tr key={entry.subject_name} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {entry.subject_name}
                            </p>
                            {entry.subject_code && (
                              <Badge variant="slate" size="sm" className="mt-1">
                                {entry.subject_code}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <ScoreBadge score={q1Score} size="sm" />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <ScoreBadge score={q2Score} size="sm" />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <ScoreBadge score={q3Score} size="sm" />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <ScoreBadge score={q4Score} size="sm" />
                        </td>
                        <td className="px-4 py-3 text-center bg-violet-50">
                          <ScoreBadge score={finalAvg} size="md" />
                        </td>
                        <td className="px-4 py-3 text-center">
                          {performance ? (
                            <Badge variant={performance.color} size="sm">
                              {performance.shortLabel}
                            </Badge>
                          ) : (
                            <span className="text-xs text-slate-400 font-semibold">—</span>
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

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* FOOTER NOTE */}
      {/* ══════════════════════════════════════════════════════════════ */}

      {!loading && subjectEntries.length > 0 && (
        <Card className="bg-slate-50 border-slate-300">
          <CardBody className="p-4 text-center">
            <p className="text-xs font-semibold text-slate-600">
              This is an official digital report card from Kiwalan National High School.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </CardBody>
        </Card>
      )}
    </motion.div>
  );
};

export default StudentGradeView;
