import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { getUser } from '../utils/auth';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';

const REMARKS_STYLE = {
  'Outstanding':               'bg-green-100 text-green-700 border-green-200',
  'Very Satisfactory':         'bg-blue-100 text-blue-700 border-blue-200',
  'Satisfactory':              'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Fairly Satisfactory':       'bg-orange-100 text-orange-700 border-orange-200',
  'Did Not Meet Expectations': 'bg-red-100 text-red-700 border-red-200',
};

const scoreColor = (score) => {
  if (score == null) return 'bg-gray-100 text-gray-600 border-gray-200';
  const n = parseFloat(score);
  if (n >= 90) return 'bg-green-100 text-green-700 border-green-200';
  if (n >= 85) return 'bg-blue-100 text-blue-700 border-blue-200';
  if (n >= 80) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  if (n >= 75) return 'bg-orange-100 text-orange-700 border-orange-200';
  return 'bg-red-100 text-red-700 border-red-200';
};

const remarksFor = (score) => {
  if (score == null) return null;
  const n = parseFloat(score);
  if (n >= 90) return 'Outstanding';
  if (n >= 85) return 'Very Satisfactory';
  if (n >= 80) return 'Satisfactory';
  if (n >= 75) return 'Fairly Satisfactory';
  return 'Did Not Meet Expectations';
};

const StudentGradeView = () => {
  const user = getUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const studentIdParam = searchParams.get('student_id');
  const isViewingOther = !!studentIdParam;

  const [grades, setGrades]         = useState([]);
  const [viewingUser, setViewingUser] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [filterQuarter, setFilterQuarter] = useState('');
  const [filterYear, setFilterYear] = useState(localStorage.getItem('knhs_academic_year') || '2025-2026');
  const [filterSubject, setFilterSubject] = useState('');

  const handleYearChange = (dir) => {
    const [start, end] = filterYear.split('-').map(Number);
    const newYear = dir === 'next' ? `${start + 1}-${end + 1}` : `${start - 1}-${end - 1}`;
    setFilterYear(newYear);
    localStorage.setItem('knhs_academic_year', newYear);
  };

  useEffect(() => {
    if (studentIdParam) {
      Promise.all([
        api.get(`/grades/?student=${studentIdParam}`),
        api.get(`/users/${studentIdParam}/`),
      ]).then(([gRes, uRes]) => {
        // Only final grades
        setGrades(gRes.data.filter(g => g.grade_type === 'final_grade'));
        setViewingUser(uRes.data);
      }).catch(() => toast.error('Failed to load student grades'))
        .finally(() => setLoading(false));
    } else {
      api.get('/grades/my_grades/')
        .then(r => setGrades(r.data.filter(g => g.grade_type === 'final_grade')))
        .catch(() => toast.error('Failed to load grades'))
        .finally(() => setLoading(false));
    }
  }, [studentIdParam]);

  const filtered = grades.filter(g => {
    const matchQ = !filterQuarter || String(g.quarter) === filterQuarter;
    const matchS = !filterSubject || String(g.subject) === filterSubject;
    const matchYear = !filterYear || g.academic_year === filterYear;
    return matchQ && matchS && matchYear;
  });

  // Group by subject
  const bySubject = filtered.reduce((acc, g) => {
    if (!acc[g.subject]) acc[g.subject] = { subject_name: g.subject_name, subject_code: g.subject_code, quarters: {} };
    acc[g.subject].quarters[g.quarter] = g;
    return acc;
  }, {});

  const uniqueSubjects = [...new Map(grades.map(g => [g.subject, { id: g.subject, name: g.subject_name }])).values()];

  // Overall average across all final grades
  const allScores = filtered.map(g => parseFloat(g.raw_score)).filter(v => !isNaN(v));
  const overallAvg = allScores.length ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(2) : null;

  const displayName = viewingUser
    ? (viewingUser.first_name && viewingUser.last_name ? `${viewingUser.first_name} ${viewingUser.last_name}` : viewingUser.username)
    : (user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.username);

  const downloadPDF = () => {
    const doc = new jsPDF();
    const primaryColor = [45, 27, 77]; // #2D1B4D
    const secondaryColor = [75, 45, 127]; // #4B2D7F
    const textColor = [45, 55, 72];
    const lightGray = [247, 250, 252];
    
    // --- Helper: Get Color by Score ---
    const getColorForPDF = (score) => {
      if (score == null) return [160, 174, 192];
      const n = parseFloat(score);
      if (n >= 90) return [22, 163, 74];  // green-600
      if (n >= 85) return [37, 99, 235];  // blue-600
      if (n >= 80) return [202, 138, 4];  // yellow-600
      if (n >= 75) return [234, 88, 12];  // orange-600
      return [220, 38, 38];               // red-600
    };

    // --- Page Border ---
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.rect(5, 5, 200, 287);
    doc.setLineWidth(0.2);
    doc.rect(7, 7, 196, 283);

    // --- Watermark ---
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.05 }));
    doc.setFontSize(60);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('OFFICIAL REPORT', 105, 150, { align: 'center', angle: 45 });
    doc.restoreGraphicsState();
    
    // --- Header ---
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, 'F');
    
    // Logo Placeholder
    doc.setFillColor(255, 255, 255);
    doc.circle(25, 20, 12, 'F');
    doc.setTextColor(...primaryColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('KNHS', 25, 21, { align: 'center' });

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('KIWALAN NATIONAL HIGH SCHOOL', 115, 18, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Iligan City, Lanao del Norte, Philippines', 115, 24, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text('OFFICIAL STUDENT GRADE REPORT', 115, 32, { align: 'center' });
    
    if (isViewingOther) {
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text(user?.role === 'admin' ? "ADMIN'S COPY" : "TEACHER'S COPY", 195, 10, { align: 'right' });
    }
    
    // --- Student Info Card ---
    doc.setFillColor(...lightGray);
    doc.roundedRect(15, 45, 180, 35, 3, 3, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(15, 45, 180, 35, 3, 3, 'S');
    
    doc.setTextColor(...primaryColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('STUDENT INFORMATION', 22, 53);
    
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Name:`, 22, 62);
    doc.setFont('helvetica', 'bold');
    doc.text(displayName.toUpperCase(), 45, 62);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Email:`, 22, 69);
    doc.text(viewingUser?.email || user?.email || 'N/A', 45, 69);

    const regNum = viewingUser?.profile?.registration_number || user?.profile?.registration_number;
    if (regNum) {
      doc.text(`Reg. No:`, 22, 76);
      doc.setFont('helvetica', 'bold');
      doc.text(regNum, 45, 76);
    }
    
    doc.text(`Date Generated:`, 120, 62);
    doc.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), 155, 62);
    
    doc.text(`Academic Year:`, 120, 69);
    doc.text(filterYear, 155, 69);

    doc.text(`Report Period:`, 120, 76);
    doc.setFont('helvetica', 'bold');
    doc.text(filterQuarter ? `Quarter ${filterQuarter}` : 'Full Academic Year', 155, 76);

    // --- Grades Table ---
    let y = 90;
    
    // Table Header
    doc.setFillColor(...primaryColor);
    doc.rect(15, y, 180, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    
    const cols = {
      subject: 18,
      q1: 82,
      q2: 95,
      q3: 108,
      q4: 121,
      avg: 134,
      rounded: 148,
      remarks: 162
    };
    
    doc.text('SUBJECT', cols.subject, y + 6.5);
    doc.text('Q1', cols.q1, y + 6.5, { align: 'center' });
    doc.text('Q2', cols.q2, y + 6.5, { align: 'center' });
    doc.text('Q3', cols.q3, y + 6.5, { align: 'center' });
    doc.text('Q4', cols.q4, y + 6.5, { align: 'center' });
    doc.text('AVG', cols.avg, y + 6.5, { align: 'center' });
    doc.text('RND', cols.rounded, y + 6.5, { align: 'center' });
    doc.text('REMARKS', cols.remarks, y + 6.5);
    
    y += 10;
    
    Object.values(bySubject).forEach((s, idx) => {
      if (y > 240) {
        doc.addPage();
        y = 20;
        // Re-draw table header on new page
        doc.setFillColor(...primaryColor);
        doc.rect(15, y, 180, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text('SUBJECT', cols.subject, y + 6.5);
        doc.text('Q1', cols.q1, y + 6.5, { align: 'center' });
        doc.text('Q2', cols.q2, y + 6.5, { align: 'center' });
        doc.text('Q3', cols.q3, y + 6.5, { align: 'center' });
        doc.text('Q4', cols.q4, y + 6.5, { align: 'center' });
        doc.text('AVG', cols.avg, y + 6.5, { align: 'center' });
        doc.text('RND', cols.rounded, y + 6.5, { align: 'center' });
        doc.text('REMARKS', cols.remarks, y + 6.5);
        y += 10;
      }
      
      if (idx % 2 === 0) {
        doc.setFillColor(252, 252, 252);
        doc.rect(15, y, 180, 8, 'F');
      }
      
      doc.setTextColor(...textColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      const subjectText = s.subject_name.length > 30 ? s.subject_name.substring(0, 27) + '...' : s.subject_name;
      doc.text(subjectText, cols.subject, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(s.subject_code, cols.subject, y + 8);
      
      doc.setFontSize(8);
      [1,2,3,4].forEach((q, i) => {
        const g = s.quarters[q];
        if (g) {
          doc.setTextColor(...getColorForPDF(g.raw_score));
          doc.text(String(g.raw_score), cols[`q${q}`], y + 5.5, { align: 'center' });
        } else {
          doc.setTextColor(200, 200, 200);
          doc.text('—', cols[`q${q}`], y + 5.5, { align: 'center' });
        }
      });
      
      const scores = Object.values(s.quarters).map(g => parseFloat(g.raw_score)).filter(v => !isNaN(v));
      const avgValue = scores.length ? (scores.reduce((a,b) => a+b,0)/scores.length) : null;
      const exactAvg = avgValue ? avgValue.toFixed(2) : '—';
      const roundedAvg = avgValue ? Math.round(avgValue) : '—';
      const remark = avgValue ? remarksFor(Math.round(avgValue)) : '—';
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...getColorForPDF(avgValue));
      doc.text(String(exactAvg), cols.avg, y + 5.5, { align: 'center' });
      doc.text(String(roundedAvg), cols.rounded, y + 5.5, { align: 'center' });
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(remark, cols.remarks, y + 5.5);
      
      y += 9;
    });

    // --- Footer Summary ---
    if (overallAvg) {
      y += 5;
      doc.setFillColor(...secondaryColor);
      doc.rect(15, y, 180, 12, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('GENERAL AVERAGE', 22, y + 7.5);
      
      const roundedOverall = Math.round(parseFloat(overallAvg));
      doc.text(`${overallAvg}`, cols.avg, y + 7.5, { align: 'center' });
      doc.text(`${roundedOverall}`, cols.rounded, y + 7.5, { align: 'center' });
      
      const overallRemark = remarksFor(roundedOverall);
      doc.setFontSize(8);
      doc.text(overallRemark || '', cols.remarks, y + 7.5);

      // Add Subject Count
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(255, 255, 255);
      doc.text(`Total Subjects: ${Object.keys(bySubject).length}`, 22, y + 10.5);
      
      y += 20;
    }

    // --- Grading Scale & Signatures ---
    if (y > 240) { doc.addPage(); y = 20; }
    
    // Grading Scale Legend
    doc.setTextColor(...primaryColor);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('GRADING SCALE LEGEND', 15, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    const legend = [
      ['90 - 100', 'Outstanding'],
      ['85 - 89', 'Very Satisfactory'],
      ['80 - 84', 'Satisfactory'],
      ['75 - 79', 'Fairly Satisfactory'],
      ['Below 75', 'Did Not Meet Expectations']
    ];
    legend.forEach(([range, label], i) => {
      doc.text(`${range}: ${label}`, 15, y + (i * 4));
    });

    // Signatures
    y += 35;
    doc.setDrawColor(200, 200, 200);
    doc.line(15, y, 75, y);
    doc.line(135, y, 195, y);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('CLASS ADVISER', 45, y + 5, { align: 'center' });
    doc.text('SCHOOL PRINCIPAL', 165, y + 5, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('(Signature over Printed Name)', 45, y + 9, { align: 'center' });
    doc.text('(Signature over Printed Name)', 165, y + 9, { align: 'center' });

    // Page Footer
    doc.setTextColor(160, 174, 192);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.text('This is a computer-generated document from the Kiwalan National High School Portal.', 105, 285, { align: 'center' });
    doc.text(`Generated on ${new Date().toLocaleString()}`, 105, 290, { align: 'center' });
    
    doc.save(`KNHS_Grade_Report_${viewingUser?.username || user?.username}.pdf`);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
    </div>
  );

  return (
    <div className="animate-in fade-in duration-700 p-4 md:p-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
        <div className="flex items-center gap-3">
          {isViewingOther && (
            <button onClick={() => navigate(-1)}
              className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-purple-600 transition-all shadow-sm active:scale-95">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          )}
          <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tight">
              {isViewingOther ? `${displayName}'s Grades` : 'My Grades'}
            </h1>
            <p className="text-gray-500 text-sm md:text-base mt-1 font-medium">
              {isViewingOther
                ? `Final grades for ${displayName}`
                : 'Your final grades by subject and quarter'}
            </p>
          </div>
        </div>
        {grades.length > 0 && (
          <button onClick={downloadPDF}
            className="flex items-center justify-center gap-2 bg-[#2D1B4D] hover:bg-[#3D2B5D] text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md active:scale-95 w-full md:w-auto">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF
          </button>
        )}
      </div>

      {/* Filters */}
      {grades.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <select value={filterQuarter} onChange={e => setFilterQuarter(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium transition-all hover:border-purple-300 shadow-sm cursor-pointer">
            <option value="">All Quarters</option>
            <option value="1">Q1 — First Quarter</option>
            <option value="2">Q2 — Second Quarter</option>
            <option value="3">Q3 — Third Quarter</option>
            <option value="4">Q4 — Fourth Quarter</option>
          </select>
          <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium transition-all hover:border-purple-300 shadow-sm cursor-pointer">
            <option value="">All Subjects</option>
            {uniqueSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all focus-within:ring-2 focus-within:ring-purple-500">
            <button onClick={() => handleYearChange('prev')} className="px-4 py-2.5 hover:bg-gray-50 text-gray-500 border-r border-gray-100 transition-colors active:bg-gray-100">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 text-center text-sm font-bold text-gray-700 select-none min-w-[80px]">{filterYear}</div>
            <button onClick={() => handleYearChange('next')} className="px-4 py-2.5 hover:bg-gray-50 text-gray-500 border-l border-gray-100 transition-colors active:bg-gray-100">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Grade table */}
      {Object.keys(bySubject).length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-16 text-center animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-700 mb-2 tracking-tight">No Final Grades Yet</h3>
          <p className="text-gray-400 text-sm font-medium max-w-xs mx-auto">Final grades will appear here once encoded by your subject teachers.</p>
        </div>
      ) : (
        <>
          <div className="bg-white border border-gray-200 rounded-2xl shadow-md overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#2D1B4D] text-white">
                    <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-widest min-w-[200px]">Subject Details</th>
                    <th className="text-center px-4 py-4 text-[10px] font-bold uppercase tracking-widest">Q1</th>
                    <th className="text-center px-4 py-4 text-[10px] font-bold uppercase tracking-widest">Q2</th>
                    <th className="text-center px-4 py-4 text-[10px] font-bold uppercase tracking-widest">Q3</th>
                    <th className="text-center px-4 py-4 text-[10px] font-bold uppercase tracking-widest">Q4</th>
                    <th className="text-center px-4 py-4 text-[10px] font-bold uppercase tracking-widest">Average</th>
                    <th className="text-center px-4 py-4 text-[10px] font-bold uppercase tracking-widest">Rounded</th>
                    <th className="text-center px-4 py-4 text-[10px] font-bold uppercase tracking-widest min-w-[140px]">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {Object.values(bySubject).map((s, idx) => {
                    const scores = [1,2,3,4].map(q => s.quarters[q] ? parseFloat(s.quarters[q].raw_score) : null).filter(v => v !== null);
                    const avg = scores.length ? (scores.reduce((a,b) => a+b,0)/scores.length).toFixed(2) : null;
                    const rounded = avg ? Math.round(parseFloat(avg)) : null;
                    const remarks = rounded ? remarksFor(rounded) : null;
                    return (
                      <tr key={s.subject_code} className={`hover:bg-purple-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-800 text-sm leading-tight">{s.subject_name}</div>
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{s.subject_code}</div>
                        </td>
                        {[1,2,3,4].map(q => {
                          const g = s.quarters[q];
                          const score = g ? parseFloat(g.raw_score) : null;
                          return (
                            <td key={q} className="px-4 py-4 text-center">
                              {score != null ? (
                                <span className={`inline-flex items-center justify-center w-11 h-8 rounded-lg border-2 text-[13px] font-black shadow-sm ${scoreColor(score)}`}>
                                  {score}
                                </span>
                              ) : (
                                <span className="text-gray-300 text-xs font-bold">—</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-4 py-4 text-center">
                          {avg ? (
                            <span className={`inline-flex items-center justify-center px-3 py-1 rounded-lg border-2 text-[13px] font-black shadow-sm ${scoreColor(parseFloat(avg))}`}>
                              {avg}
                            </span>
                          ) : <span className="text-gray-300 text-xs font-bold">—</span>}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {rounded ? (
                            <span className={`inline-flex items-center justify-center px-3 py-1 rounded-lg border-2 text-[13px] font-black shadow-sm ${scoreColor(rounded)}`}>
                              {rounded}
                            </span>
                          ) : <span className="text-gray-300 text-xs font-bold">—</span>}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {remarks ? (
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full border shadow-sm uppercase tracking-wider ${REMARKS_STYLE[remarks] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                              {remarks}
                            </span>
                          ) : <span className="text-gray-300 text-xs font-bold">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Overall average footer */}
            {overallAvg && (
              <div className="px-6 py-5 bg-gradient-to-r from-[#2D1B4D] to-[#4B2D7F] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <span className="text-white font-black text-sm uppercase tracking-widest">General Average</span>
                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                  <div className="flex flex-col sm:items-end">
                    <div className="text-2xl md:text-3xl font-black text-white leading-none">{overallAvg}</div>
                    <div className="text-[10px] text-purple-300 font-bold uppercase tracking-tighter mt-1">Exact Average</div>
                  </div>
                  <div className="hidden sm:block w-px h-10 bg-white/20" />
                  <div className="flex flex-col sm:items-end">
                    <div className="text-2xl md:text-3xl font-black text-white leading-none">{Math.round(parseFloat(overallAvg))}</div>
                    <div className="text-[10px] text-purple-300 font-bold uppercase tracking-tighter mt-1">Rounded Score</div>
                  </div>
                  {remarksFor(Math.round(parseFloat(overallAvg))) && (
                    <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-xl text-[11px] font-black text-white uppercase tracking-widest border border-white/10 shadow-lg">
                      {remarksFor(Math.round(parseFloat(overallAvg)))}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {[
              { label: 'Total Subjects', value: Object.keys(bySubject).length, color: 'text-gray-800' },
              { label: 'Outstanding (90+)', value: allScores.filter(s => s >= 90).length, color: 'text-green-600' },
              { label: 'Passing (75–89)', value: allScores.filter(s => s >= 75 && s < 90).length, color: 'text-blue-600' },
              { label: 'Below 75', value: allScores.filter(s => s < 75).length, color: 'text-red-600' },
            ].map(stat => (
              <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default StudentGradeView;
