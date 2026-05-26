import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
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
  if (score == null) return 'bg-slate-100 text-slate-600 border-slate-200';
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
  const { user } = useAuth();
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
        api.get(`/grades/?student=${studentIdParam}&academic_year=${filterYear}`),
        api.get(`/users/${studentIdParam}/`),
      ]).then(([gRes, uRes]) => {
        // Only final grades
        setGrades(gRes.data.filter(g => g.grade_type === 'final_grade'));
        setViewingUser(uRes.data);
      }).catch(() => toast.error('Failed to load student grades'))
        .finally(() => setLoading(false));
    } else {
      api.get(`/grades/my_grades/?academic_year=${filterYear}`)
        .then(r => setGrades(r.data.filter(g => g.grade_type === 'final_grade')))
        .catch(() => toast.error('Failed to load grades'))
        .finally(() => setLoading(false));
    }
  }, [studentIdParam, filterYear]);

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
  const overallRounded = overallAvg ? Math.round(parseFloat(overallAvg)) : null;
  const overallRemarks = overallRounded != null ? remarksFor(overallRounded) : null;
  const subjectEntries = Object.values(bySubject);

  const displayName = viewingUser
    ? (viewingUser.first_name && viewingUser.last_name ? `${viewingUser.first_name} ${viewingUser.last_name}` : viewingUser.username)
    : (user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.username);

  const downloadPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210; const H = 297; const ML = 20; const MR = 20; const CW = W - ML - MR;
    const PRIMARY_RGB = [45, 27, 77];

    const sf = (size, weight = 'normal', r = 0, g = 0, b = 0) => {
      doc.setFontSize(size); doc.setFont('helvetica', weight); doc.setTextColor(r, g, b);
    };
    const hl = (y, lw = 0.2, r = 200, g = 200, b = 200) => {
      doc.setDrawColor(r, g, b); doc.setLineWidth(lw); doc.line(ML, y, W - MR, y);
    };

    let y = 15;

    // --- DepEd Official Header ---
    sf(8, 'normal', 100, 100, 100);
    doc.text('Republic of the Philippines', W/2, y, {align:'center'}); y+=4;
    sf(9, 'bold', 0, 0, 0);
    doc.text('Department of Education', W/2, y, {align:'center'}); y+=4;
    sf(8, 'normal', 100, 100, 100);
    doc.text('Region X — Northern Mindanao', W/2, y, {align:'center'}); y+=4;
    doc.text('Division of Iligan City', W/2, y, {align:'center'}); y+=6;

    sf(12, 'bold', ...PRIMARY_RGB);
    doc.text('KIWALAN NATIONAL HIGH SCHOOL', W/2, y, {align:'center'}); y+=4;
    sf(7, 'italic', 120, 120, 120);
    doc.text('Kiwalan, Iligan City, Lanao del Norte | School ID: 304050', W/2, y, {align:'center'}); y+=6;

    doc.setDrawColor(...PRIMARY_RGB); doc.setLineWidth(0.5); doc.line(ML, y, W-MR, y); y+=1;
    doc.setLineWidth(0.1); doc.line(ML, y, W-MR, y); y+=8;

    // --- Title & Metadata ---
    sf(11, 'bold', 0, 0, 0);
    doc.text('OFFICIAL LEARNER PROGRESS REPORT', W/2, y, {align:'center'}); y+=7;
    
    // Metadata grid
    const metaY = y;
    sf(7, 'bold', 120, 120, 120); doc.text('LEARNER INFORMATION', ML, y);
    doc.text('ACADEMIC CONTEXT', W/2 + 5, y); y+=5;
    
    const drawMeta = (label, value, x, currY) => {
      sf(7, 'normal', 100, 100, 100); doc.text(`${label}:`, x, currY);
      sf(7, 'bold', 0, 0, 0); doc.text(String(value || '—'), x + 25, currY);
    };

    drawMeta('Full Name', displayName.toUpperCase(), ML, y);
    drawMeta('Academic Year', filterYear, W/2 + 5, y); y+=5;
    drawMeta('LRN', viewingUser?.username || user?.username, ML, y);
    drawMeta('Reporting Period', filterQuarter ? `Quarter ${filterQuarter}` : 'Annual Report', W/2 + 5, y); y+=5;
    drawMeta('Grade Level', viewingUser?.profile?.grade_level || user?.profile?.grade_level, ML, y);
    drawMeta('Date Issued', new Date().toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' }), W/2 + 5, y); y+=8;

    hl(y); y+=8;

    // --- Scholastic Achievement Table ---
    sf(9, 'bold', ...PRIMARY_RGB);
    doc.text('I. SCHOLASTIC ACHIEVEMENT', ML, y); y+=5;

    const COL = { sub:ML, q1:105, q2:118, q3:131, q4:144, rnd:162, rem:175 };
    
    // Table Header
    doc.setFillColor(...PRIMARY_RGB);
    doc.rect(ML, y, CW, 7, 'F');
    sf(7, 'bold', 255, 255, 255);
    doc.text('LEARNING AREAS', COL.sub+2, y+4.5);
    ['Q1','Q2','Q3','Q4','FINAL'].forEach((h,i) => {
      const xs = [COL.q1, COL.q2, COL.q3, COL.q4, COL.rnd];
      doc.text(h, xs[i], y+4.5, {align:'center'});
    });
    doc.text('REMARKS', COL.rem, y+4.5);
    y+=7;

    // Table Body
    subjectEntries.forEach((s, idx) => {
      if (y > H - 100) { // Leave room for interpretation and signatures
        doc.addPage(); y = 20;
        sf(8, 'bold', ...PRIMARY_RGB); doc.text('SCHOLASTIC ACHIEVEMENT (Continued)', ML, y); y+=6;
      }
      
      const scores = [1,2,3,4].map(q => s.quarters[q] ? parseFloat(s.quarters[q].raw_score) : null).filter(v => v !== null);
      const avg = scores.length ? scores.reduce((a,b)=>a+b,0)/scores.length : null;
      const rounded = avg !== null ? Math.round(avg) : null;
      const remark = rounded !== null ? remarksFor(rounded) : null;

      if (idx % 2 !== 0) { doc.setFillColor(250, 250, 252); doc.rect(ML, y, CW, 8, 'F'); }
      doc.setDrawColor(240, 240, 245); doc.setLineWidth(0.1); doc.line(ML, y+8, W-MR, y+8);

      sf(7.5, 'bold', 30, 30, 30);
      doc.text(s.subject_name, COL.sub+2, y+5);
      
      sf(8, 'normal', 0, 0, 0);
      [1,2,3,4].forEach(q => {
        const g = s.quarters[q];
        const val = g ? String(g.raw_score) : '—';
        if (val === '—') doc.setTextColor(200, 200, 200);
        doc.text(val, COL[`q${q}`], y+5, {align:'center'});
        doc.setTextColor(0, 0, 0);
      });

      if (rounded !== null) {
        sf(8, 'bold', ...PRIMARY_RGB);
        doc.text(String(rounded), COL.rnd, y+5, {align:'center'});
        sf(6.5, 'normal', 80, 80, 80);
        doc.text(remark === 'Did Not Meet Expectations' ? 'Failed' : 'Passed', COL.rem, y+5);
      }
      y+=8;
    });

    // General Average Row
    if (overallRounded) {
      doc.setFillColor(245, 245, 250);
      doc.rect(ML, y, CW, 9, 'F');
      doc.setDrawColor(...PRIMARY_RGB); doc.setLineWidth(0.3); doc.line(ML, y, W-MR, y);
      doc.line(ML, y+9, W-MR, y+9);
      
      sf(8, 'bold', 0, 0, 0);
      doc.text('GENERAL AVERAGE', COL.sub+2, y+6);
      sf(10, 'bold', ...PRIMARY_RGB);
      doc.text(String(overallRounded), COL.rnd, y+6, {align:'center'});
      sf(8, 'bold', ...PRIMARY_RGB);
      doc.text(overallRemarks || '', COL.rem, y+6);
      y+=15;
    }

    // --- II. DATA INTERPRETATION & SUMMARY ---
    if (y > H - 80) { doc.addPage(); y = 20; }
    sf(9, 'bold', ...PRIMARY_RGB);
    doc.text('II. QUALITATIVE INTERPRETATION & SUMMARY', ML, y); y+=6;

    // Interpretation Logic
    let interpretation = "";
    if (overallRounded >= 90) {
      interpretation = "The learner has demonstrated an outstanding mastery of the core competencies and consistently produces work of exceptional quality. Their academic performance reflects a deep understanding of the learning areas.";
    } else if (overallRounded >= 85) {
      interpretation = "The learner has shown a very satisfactory level of performance, meeting most competencies with high proficiency and showing strong analytical skills across major subjects.";
    } else if (overallRounded >= 80) {
      interpretation = "The learner has achieved a satisfactory level of proficiency. They have met the basic requirements of the curriculum and show steady progress in their academic journey.";
    } else if (overallRounded >= 75) {
      interpretation = "The learner has met the minimum passing requirements. Consistent effort and focused intervention are recommended to further improve proficiency in key learning areas.";
    } else {
      interpretation = "The learner is currently working towards meeting the minimum standards. Intensive academic support and regular parent-teacher consultation are highly recommended for the next reporting period.";
    }

    sf(8, 'normal', 50, 50, 50);
    const splitInterpretation = doc.splitTextToSize(interpretation, CW - 10);
    doc.text(splitInterpretation, ML + 5, y);
    y += (splitInterpretation.length * 4.5) + 8;

    // Strengths and Improvements
    const validEntries = subjectEntries.filter(s => {
      const scores = [1,2,3,4].map(q => s.quarters[q] ? parseFloat(s.quarters[q].raw_score) : null).filter(v => v !== null);
      return scores.length > 0;
    }).map(s => {
      const scores = [1,2,3,4].map(q => s.quarters[q] ? parseFloat(s.quarters[q].raw_score) : null).filter(v => v !== null);
      return { name: s.subject_name, avg: scores.reduce((a,b)=>a+b,0)/scores.length };
    }).sort((a,b) => b.avg - a.avg);

    if (validEntries.length > 0) {
      sf(7.5, 'bold', 80, 80, 80);
      doc.text('ACADEMIC HIGHLIGHTS', ML + 5, y);
      y += 5;
      sf(7, 'normal', 100, 100, 100);
      doc.text(`• Academic Strength: ${validEntries[0].name}`, ML + 8, y); y+=4;
      if (validEntries.length > 1) {
        const lowest = validEntries[validEntries.length - 1];
        if (lowest.avg < 80) {
          doc.text(`• Area for Development: ${lowest.name} (Requires focused attention)`, ML + 8, y); y+=4;
        }
      }
    }
    y+=10;

    // --- Grading Scale ---
    if (y > H - 40) { doc.addPage(); y = 20; }
    sf(7, 'bold', 120, 120, 120);
    doc.text('GRADING SCALE (DepEd Order No. 8, s. 2015)', ML, y); y+=4;
    const scale = [['90–100','Outstanding'],['85–89','Very Satisfactory'],['80–84','Satisfactory'],['75–79','Fairly Satisfactory'],['Below 75','Did Not Meet Exp.']];
    scale.forEach(([range, label], i) => {
      const sx = ML + (i * (CW/5));
      sf(6.5, 'bold', 80, 80, 80); doc.text(range, sx, y);
      sf(6, 'normal', 120, 120, 120); doc.text(label, sx, y+3.5);
    });
    y+=15;

    // --- Signatures ---
    if (y > H - 50) { doc.addPage(); y = 20; }
    const sigW = CW / 3;
    const drawSig = (label, x) => {
      doc.setDrawColor(0,0,0); doc.setLineWidth(0.2);
      doc.line(x + 5, y + 10, x + sigW - 5, y + 10);
      sf(7, 'bold', 0, 0, 0);
      doc.text(label, x + sigW/2, y + 14, {align:'center'});
      sf(6, 'normal', 120, 120, 120);
      doc.text('Signature over Printed Name', x + sigW/2, y + 17.5, {align:'center'});
    };

    drawSig('Class Adviser', ML);
    drawSig('School Registrar', ML + sigW);
    drawSig('School Principal', ML + 2*sigW);

    // --- Footer ---
    sf(6, 'italic', 150, 150, 150);
    doc.text('This is a formal academic record generated by the Kiwalan National High School Portal.', W/2, H-15, {align:'center'});
    doc.text(`Document Reference: ${viewingUser?.username || user?.username}-${Date.now()}`, W/2, H-12, {align:'center'});

    const fname = (viewingUser?.last_name || user?.last_name || 'Student').toUpperCase();
    doc.save(`KNHS_Grade_Report_${fname}_${filterYear}.pdf`);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 rounded-full border-2 border-slate-100 border-t-violet-600 animate-spin" />
    </div>
  );

  return (
    <div className="animate-in fade-in duration-700 p-2.5 sm:p-4 md:p-6 page-bottom-safe">

      {/* Header */}
      <div className="mb-4 flex flex-row items-start justify-between gap-3 sm:mb-6 sm:items-center md:gap-6">
        <div className="flex items-start gap-2.5 sm:items-center sm:gap-3">
          {isViewingOther && (
            <button onClick={() => navigate(-1)}
              className="mt-0.5 shrink-0 rounded-lg border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition-all hover:text-violet-600 active:scale-95 sm:mt-0 sm:rounded-xl sm:p-2.5">
              <svg className="h-4.5 w-4.5 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          )}
          <div className="min-w-0 text-left">
            <h1 className="truncate text-lg font-black tracking-tight text-slate-800 sm:text-2xl md:text-3xl">
              {isViewingOther ? `${displayName}'s Grades` : 'My Grades'}
            </h1>
            <p className="mt-0.5 line-clamp-1 text-[11px] font-medium leading-snug text-slate-500 sm:mt-1 sm:text-sm md:text-base">
              {isViewingOther
                ? `Final grades for ${displayName}`
                : 'Your final grades by subject and quarter'}
            </p>
          </div>
        </div>
        {grades.length > 0 && (
          <button onClick={downloadPDF} title="Download PDF"
            className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#2D1B4D] p-2 text-[13px] font-bold text-white shadow-md transition-all hover:bg-[#3D2B5D] active:scale-95 sm:w-auto sm:gap-2 sm:rounded-xl sm:px-6 sm:py-2.5 sm:text-sm">
            <svg className="h-5 w-5 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="hidden sm:inline">Download PDF</span>
          </button>
        )}
      </div>

      {/* Filters */}
      {grades.length > 0 && (
        <div className="mb-5 grid grid-cols-1 gap-2.5 rounded-xl border border-slate-100 bg-white p-2.5 shadow-sm sm:mb-6 sm:grid-cols-2 sm:gap-3 sm:rounded-2xl sm:p-4 lg:grid-cols-3">
          <select value={filterQuarter} onChange={e => setFilterQuarter(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] font-medium shadow-sm transition-all cursor-pointer hover:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-500 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm">
            <option value="">All Quarters</option>
            <option value="1">Q1 — First Quarter</option>
            <option value="2">Q2 — Second Quarter</option>
            <option value="3">Q3 — Third Quarter</option>
            <option value="4">Q4 — Fourth Quarter</option>
          </select>
          <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] font-medium shadow-sm transition-all cursor-pointer hover:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-500 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm">
            <option value="">All Subjects</option>
            {uniqueSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <div className="flex items-center overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all focus-within:ring-2 focus-within:ring-violet-500 sm:col-span-2 sm:rounded-xl lg:col-span-1">
            <button onClick={() => handleYearChange('prev')} className="border-r border-slate-100 px-2.5 py-2 text-slate-500 transition-colors hover:bg-slate-50 active:bg-slate-100 sm:px-4 sm:py-2.5">
              <svg className="h-3.5 w-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="min-w-0 flex-1 px-2 text-center text-[13px] font-bold text-slate-700 select-none sm:text-sm">{filterYear}</div>
            <button onClick={() => handleYearChange('next')} className="border-l border-slate-100 px-2.5 py-2 text-slate-500 transition-colors hover:bg-slate-50 active:bg-slate-100 sm:px-4 sm:py-2.5">
              <svg className="h-3.5 w-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Grade table */}
      {subjectEntries.length === 0 ? (
        <div className="animate-in zoom-in-95 rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm duration-500 sm:rounded-2xl sm:p-16">
          <div className="mb-4 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-violet-50 sm:mb-6 sm:h-20 sm:w-20">
            <svg className="h-8 w-8 text-purple-300 sm:h-10 sm:w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="mb-2 text-base font-bold tracking-tight text-slate-700 sm:text-xl">No Final Grades Yet</h3>
          <p className="mx-auto max-w-xs text-[13px] font-medium leading-snug text-slate-400 sm:text-sm">Final grades will appear here once encoded by your subject teachers.</p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md sm:rounded-2xl">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300">
              <table className="w-full min-w-[480px] sm:min-w-[820px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                    <th className="min-w-[120px] px-3 py-3 text-left text-[9px] font-bold uppercase tracking-[0.18em] sm:min-w-[200px] sm:px-6 sm:py-4 sm:text-[10px] sm:tracking-widest">Subject Details</th>
                    <th className="px-1.5 py-3 text-center text-[9px] font-bold uppercase tracking-[0.18em] sm:px-4 sm:py-4 sm:text-[10px] sm:tracking-widest">Q1</th>
                    <th className="px-1.5 py-3 text-center text-[9px] font-bold uppercase tracking-[0.18em] sm:px-4 sm:py-4 sm:text-[10px] sm:tracking-widest">Q2</th>
                    <th className="px-1.5 py-3 text-center text-[9px] font-bold uppercase tracking-[0.18em] sm:px-4 sm:py-4 sm:text-[10px] sm:tracking-widest">Q3</th>
                    <th className="px-1.5 py-3 text-center text-[9px] font-bold uppercase tracking-[0.18em] sm:px-4 sm:py-4 sm:text-[10px] sm:tracking-widest">Q4</th>
                    <th className="hidden px-4 py-4 text-center text-[10px] font-bold uppercase tracking-widest sm:table-cell">Average</th>
                    <th className="px-1.5 py-3 text-center text-[9px] font-bold uppercase tracking-[0.18em] sm:px-4 sm:py-4 sm:text-[10px] sm:tracking-widest">Rounded</th>
                    <th className="hidden min-w-[140px] px-4 py-4 text-center text-[10px] font-bold uppercase tracking-widest sm:table-cell">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subjectEntries.map((s, idx) => {
                    const scores = [1,2,3,4].map(q => s.quarters[q] ? parseFloat(s.quarters[q].raw_score) : null).filter(v => v !== null);
                    const avg = scores.length ? (scores.reduce((a,b) => a+b,0)/scores.length).toFixed(2) : null;
                    const rounded = avg ? Math.round(parseFloat(avg)) : null;
                    const remarks = rounded != null ? remarksFor(rounded) : null;
                    return (
                      <tr key={s.subject_code} className={`hover:bg-violet-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                        <td className="px-3 py-3 sm:px-6 sm:py-4">
                          <div className="text-[12px] font-bold leading-tight text-slate-800 sm:text-sm">{s.subject_name}</div>
                          <div className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.18em] text-slate-400 sm:mt-1 sm:text-[10px] sm:tracking-widest">{s.subject_code}</div>
                        </td>
                        {[1,2,3,4].map(q => {
                          const g = s.quarters[q];
                          const score = g ? parseFloat(g.raw_score) : null;
                          return (
                            <td key={q} className="px-1.5 py-3 text-center sm:px-4 sm:py-4">
                              {score != null ? (
                                <span className={`inline-flex h-6.5 w-8.5 items-center justify-center rounded-md border-2 text-[10px] font-black shadow-sm sm:h-8 sm:w-11 sm:rounded-lg sm:text-[13px] ${scoreColor(score)}`}>
                                  {score}
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-slate-300 sm:text-xs">—</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="hidden px-4 py-4 text-center sm:table-cell">
                          {avg ? (
                            <span className={`inline-flex items-center justify-center px-3 py-1 rounded-lg border-2 text-[13px] font-black shadow-sm ${scoreColor(parseFloat(avg))}`}>
                              {avg}
                            </span>
                          ) : <span className="text-slate-300 text-xs font-bold">—</span>}
                        </td>
                        <td className="px-1.5 py-3 text-center sm:px-4 sm:py-4">
                          {rounded ? (
                            <span className={`inline-flex min-w-[2rem] items-center justify-center rounded-md border-2 px-1.5 py-0.5 text-[10px] font-black shadow-sm sm:rounded-lg sm:px-3 sm:py-1 sm:text-[13px] ${scoreColor(rounded)}`}>
                              {rounded}
                            </span>
                          ) : <span className="text-[10px] font-bold text-slate-300 sm:text-xs">—</span>}
                        </td>
                        <td className="hidden px-4 py-4 text-center sm:table-cell">
                          {remarks ? (
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full border shadow-sm uppercase tracking-wider ${REMARKS_STYLE[remarks] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                              {remarks}
                            </span>
                          ) : <span className="text-slate-300 text-xs font-bold">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Overall average footer */}
            {overallAvg && (
              <div className="flex flex-col justify-between gap-3 bg-gradient-to-r from-[#2D1B4D] to-[#4B2D7F] px-3 py-3.5 sm:flex-row sm:items-center sm:gap-4 sm:px-6 sm:py-5">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white sm:text-sm sm:tracking-widest">General Average</span>
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-6">
                  <div className="hidden flex-col sm:flex sm:items-end">
                    <div className="text-2xl md:text-3xl font-black text-white leading-none">{overallAvg}</div>
                    <div className="text-[10px] text-purple-300 font-bold uppercase tracking-tighter mt-1">Exact Average</div>
                  </div>
                  <div className="hidden sm:block w-px h-10 bg-white/20" />
                  <div className="flex flex-col sm:items-end">
                    <div className="text-lg font-black leading-none text-white sm:text-2xl md:text-3xl">{overallRounded}</div>
                    <div className="mt-1 text-[8px] font-bold uppercase tracking-[0.16em] text-purple-300 sm:text-[10px] sm:tracking-tighter">Rounded Score</div>
                  </div>
                  {overallRemarks && (
                    <span className="hidden rounded-xl border border-white/10 bg-white/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-white shadow-lg backdrop-blur-md sm:inline-flex">
                      {overallRemarks}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:mt-4 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
            {[
              { label: 'Total Subjects', value: subjectEntries.length, color: 'text-slate-800' },
              { label: 'Outstanding (90+)', value: allScores.filter(s => s >= 90).length, color: 'text-green-600' },
              { label: 'Passing (75–89)', value: allScores.filter(s => s >= 75 && s < 90).length, color: 'text-blue-600' },
              { label: 'Below 75', value: allScores.filter(s => s < 75).length, color: 'text-red-600' },
            ].map(stat => (
              <div key={stat.label} className="rounded-lg border border-slate-200 bg-white p-3 text-center shadow-sm sm:rounded-xl sm:p-4">
                <div className={`text-xl font-bold ${stat.color} sm:text-2xl`}>{stat.value}</div>
                <div className="mt-1 text-[10px] leading-snug text-slate-500 sm:text-xs">{stat.label}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default StudentGradeView;
