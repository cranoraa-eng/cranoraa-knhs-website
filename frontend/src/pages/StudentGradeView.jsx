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

  const displayName = viewingUser
    ? (viewingUser.first_name && viewingUser.last_name ? `${viewingUser.first_name} ${viewingUser.last_name}` : viewingUser.username)
    : (user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.username);

  const downloadPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210; const H = 297; const ML = 15; const MR = 15; const CW = W - ML - MR;

    const sf = (size, weight = 'normal', r = 0, g = 0, b = 0) => {
      doc.setFontSize(size); doc.setFont('helvetica', weight); doc.setTextColor(r, g, b);
    };
    const hl = (y, lw = 0.3, r = 0, g = 0, b = 0) => {
      doc.setDrawColor(r, g, b); doc.setLineWidth(lw); doc.line(ML, y, W - MR, y);
    };

    // Double border
    doc.setDrawColor(0,0,0); doc.setLineWidth(0.8); doc.rect(8, 8, W-16, H-16);
    doc.setLineWidth(0.3); doc.rect(10, 10, W-20, H-20);

    // Watermark
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.04 }));
    doc.setFontSize(52); doc.setFont('helvetica','bold'); doc.setTextColor(0,0,0);
    doc.text('OFFICIAL', W/2, H/2-10, { align:'center', angle:45 });
    doc.restoreGraphicsState();

    let y = 18;
    // Republic header
    sf(7,'normal',80,80,80);
    doc.text('Republic of the Philippines', W/2, y, {align:'center'}); y+=4;
    doc.text('Department of Education', W/2, y, {align:'center'}); y+=4;
    doc.text('Region X — Northern Mindanao', W/2, y, {align:'center'}); y+=4;
    doc.text('Division of Iligan City', W/2, y, {align:'center'}); y+=5;

    sf(14,'bold',0,0,0);
    doc.text('KIWALAN NATIONAL HIGH SCHOOL', W/2, y, {align:'center'}); y+=5;
    sf(8,'normal',60,60,60);
    doc.text('Kiwalan, Iligan City, Lanao del Norte', W/2, y, {align:'center'}); y+=5;

    hl(y, 0.8); y+=1; hl(y, 0.3); y+=5;

    sf(11,'bold',0,0,0);
    doc.text('STUDENT GRADE REPORT', W/2, y, {align:'center'}); y+=4;
    sf(8,'normal',60,60,60);
    doc.text(filterQuarter ? `Quarter ${filterQuarter}` : 'Full Academic Year', W/2, y, {align:'center'}); y+=6;
    hl(y, 0.3, 120,120,120); y+=5;

    // Student info
    const infoLeft = [
      ['Name', displayName.toUpperCase()],
      ['LRN / Student ID', viewingUser?.username || user?.username || '—'],
      ['Grade Level', viewingUser?.profile?.grade_level || user?.profile?.grade_level || '—'],
    ];
    const infoRight = [
      ['Academic Year', filterYear],
      ['Date Generated', new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })],
      ['Report Period', filterQuarter ? `Quarter ${filterQuarter}` : 'Annual'],
    ];
    infoLeft.forEach(([label, value], i) => {
      const iy = y + i * 6;
      sf(7.5,'normal',80,80,80); doc.text(`${label}:`, ML, iy);
      sf(7.5,'bold',0,0,0); doc.text(value, ML+28, iy);
    });
    infoRight.forEach(([label, value], i) => {
      const iy = y + i * 6;
      sf(7.5,'normal',80,80,80); doc.text(`${label}:`, W/2+2, iy);
      sf(7.5,'bold',0,0,0); doc.text(value, W/2+30, iy);
    });
    y += infoLeft.length * 6 + 4;
    hl(y, 0.3, 120,120,120); y += 6;

    // Table
    const COL = { sub:ML, q1:100, q2:114, q3:128, q4:142, avg:156, rnd:167, rem:178 };
    const ROW_H = 7.5;

    const drawHeader = (startY) => {
      doc.setFillColor(220,220,220); doc.rect(ML, startY, CW, 8, 'F');
      doc.setDrawColor(0,0,0); doc.setLineWidth(0.4); doc.rect(ML, startY, CW, 8);
      sf(7.5,'bold',0,0,0);
      doc.text('SUBJECT', COL.sub+2, startY+5.5);
      ['Q1','Q2','Q3','Q4','AVG','RND'].forEach((h,i) => {
        const xs = [COL.q1,COL.q2,COL.q3,COL.q4,COL.avg,COL.rnd];
        doc.text(h, xs[i], startY+5.5, {align:'center'});
      });
      doc.text('REMARKS', COL.rem+2, startY+5.5);
      doc.setLineWidth(0.2);
      [COL.q1-5,COL.q2-5,COL.q3-5,COL.q4-5,COL.avg-5,COL.rnd-5,COL.rem-5].forEach(x => doc.line(x, startY, x, startY+8));
      return startY + 8;
    };

    y = drawHeader(y);

    Object.values(bySubject).forEach((s, idx) => {
      if (y + ROW_H > H - 40) {
        doc.addPage();
        doc.setDrawColor(0,0,0); doc.setLineWidth(0.8); doc.rect(8,8,W-16,H-16);
        doc.setLineWidth(0.3); doc.rect(10,10,W-20,H-20);
        y = 18; sf(8,'bold',0,0,0);
        doc.text('STUDENT GRADE REPORT (Continued)', W/2, y, {align:'center'}); y+=6;
        y = drawHeader(y);
      }
      if (idx % 2 === 0) { doc.setFillColor(248,248,248); doc.rect(ML, y, CW, ROW_H, 'F'); }
      doc.setDrawColor(200,200,200); doc.setLineWidth(0.2); doc.rect(ML, y, CW, ROW_H);
      [COL.q1-5,COL.q2-5,COL.q3-5,COL.q4-5,COL.avg-5,COL.rnd-5,COL.rem-5].forEach(x => doc.line(x, y, x, y+ROW_H));

      sf(7.5,'bold',0,0,0);
      const subText = s.subject_name.length > 28 ? s.subject_name.substring(0,25)+'…' : s.subject_name;
      doc.text(subText, COL.sub+2, y+4.5);
      sf(6,'normal',100,100,100); doc.text(s.subject_code, COL.sub+2, y+7);

      // Quarter scores — plain black, no color
      sf(8,'normal',0,0,0);
      [1,2,3,4].forEach(q => {
        const g = s.quarters[q];
        if (g && g.raw_score != null) {
          doc.text(String(g.raw_score), COL[`q${q}`], y+5, {align:'center'});
        } else {
          sf(8,'normal',180,180,180); doc.text('—', COL[`q${q}`], y+5, {align:'center'}); sf(8,'normal',0,0,0);
        }
      });

      const scores = [1,2,3,4].map(q => s.quarters[q] ? parseFloat(s.quarters[q].raw_score) : null).filter(v => v !== null);
      const avg = scores.length ? scores.reduce((a,b)=>a+b,0)/scores.length : null;
      const rounded = avg !== null ? Math.round(avg) : null;
      const remark = rounded !== null ? remarksFor(rounded) : null;
      if (avg !== null) {
        sf(8,'bold',0,0,0);
        doc.text(avg.toFixed(2), COL.avg, y+5, {align:'center'});
        doc.text(String(rounded), COL.rnd, y+5, {align:'center'});
        sf(7,'normal',0,0,0);
        const short = {'Did Not Meet Expectations':'Did Not Meet Exp.'};
        doc.text(short[remark] || remark || '—', COL.rem+2, y+5);
      } else {
        sf(8,'normal',180,180,180);
        doc.text('—', COL.avg, y+5, {align:'center'}); doc.text('—', COL.rnd, y+5, {align:'center'});
      }
      y += ROW_H;
    });

    // General average row
    if (overallAvg) {
      y += 1;
      doc.setFillColor(200,200,200); doc.rect(ML, y, CW, 9, 'F');
      doc.setDrawColor(0,0,0); doc.setLineWidth(0.5); doc.rect(ML, y, CW, 9);
      sf(8.5,'bold',0,0,0);
      doc.text('GENERAL AVERAGE', COL.sub+2, y+6);
      doc.text(overallAvg, COL.avg, y+6, {align:'center'});
      doc.text(String(Math.round(parseFloat(overallAvg))), COL.rnd, y+6, {align:'center'});
      sf(7.5,'bold',0,0,0);
      doc.text(remarksFor(Math.round(parseFloat(overallAvg))) || '', COL.rem+2, y+6);
      y += 12;
    }

    // Grading scale
    if (y + 30 > H - 45) { doc.addPage(); y = 18; }
    hl(y, 0.3, 150,150,150); y += 5;
    sf(7.5,'bold',0,0,0); doc.text('GRADING SCALE (DepEd Order No. 8, s. 2015)', ML, y); y += 4;
    const scale = [['90–100','Outstanding (O)'],['85–89','Very Satisfactory (VS)'],['80–84','Satisfactory (S)'],['75–79','Fairly Satisfactory (FS)'],['Below 75','Did Not Meet Exp. (DNME)']];
    const colW = CW / scale.length;
    scale.forEach(([range, label], i) => {
      const sx = ML + i * colW;
      doc.setFillColor(240,240,240); doc.setDrawColor(180,180,180); doc.setLineWidth(0.2); doc.rect(sx, y, colW-1, 10);
      sf(6.5,'bold',0,0,0); doc.text(range, sx+colW/2, y+4, {align:'center'});
      sf(6,'normal',60,60,60); doc.text(label, sx+colW/2, y+8, {align:'center'});
    });
    y += 14;

    // Signatures
    if (y + 30 > H - 20) { doc.addPage(); y = 18; }
    hl(y, 0.3, 150,150,150); y += 8;
    const sigs = [ML+20, W/2, W-MR-20];
    const sigLabels = ['Class Adviser','School Registrar','School Principal'];
    sigs.forEach((sx, i) => {
      doc.setDrawColor(0,0,0); doc.setLineWidth(0.4); doc.line(sx-22, y, sx+22, y);
      sf(7.5,'bold',0,0,0); doc.text(sigLabels[i], sx, y+4.5, {align:'center'});
      sf(6.5,'normal',80,80,80); doc.text('Signature over Printed Name', sx, y+8.5, {align:'center'});
    });

    // Document footer
    hl(H-18, 0.3, 150,150,150);
    sf(6.5,'italic',100,100,100);
    doc.text('This is a computer-generated document from the Kiwalan National High School Portal. Unauthorized alteration is prohibited.', W/2, H-13, {align:'center'});
    doc.text(`Generated: ${new Date().toLocaleString()}`, W/2, H-9, {align:'center'});

    const fname = viewingUser?.username || user?.username || 'student';
    doc.save(`KNHS_Grade_Report_${fname}_${filterYear}.pdf`);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 rounded-full border-2 border-slate-100 border-t-violet-600 animate-spin" />
    </div>
  );

  return (
    <div className="animate-in fade-in duration-700 p-4 md:p-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
        <div className="flex items-center gap-3">
          {isViewingOther && (
            <button onClick={() => navigate(-1)}
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-violet-600 transition-all shadow-sm active:scale-95">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          )}
          <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
              {isViewingOther ? `${displayName}'s Grades` : 'My Grades'}
            </h1>
            <p className="text-slate-500 text-sm md:text-base mt-1 font-medium">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <select value={filterQuarter} onChange={e => setFilterQuarter(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm font-medium transition-all hover:border-violet-300 shadow-sm cursor-pointer">
            <option value="">All Quarters</option>
            <option value="1">Q1 — First Quarter</option>
            <option value="2">Q2 — Second Quarter</option>
            <option value="3">Q3 — Third Quarter</option>
            <option value="4">Q4 — Fourth Quarter</option>
          </select>
          <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm font-medium transition-all hover:border-violet-300 shadow-sm cursor-pointer">
            <option value="">All Subjects</option>
            {uniqueSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all focus-within:ring-2 focus-within:ring-violet-500">
            <button onClick={() => handleYearChange('prev')} className="px-4 py-2.5 hover:bg-slate-50 text-slate-500 border-r border-slate-100 transition-colors active:bg-slate-100">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 text-center text-sm font-bold text-slate-700 select-none min-w-[80px]">{filterYear}</div>
            <button onClick={() => handleYearChange('next')} className="px-4 py-2.5 hover:bg-slate-50 text-slate-500 border-l border-slate-100 transition-colors active:bg-slate-100">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Grade table */}
      {Object.keys(bySubject).length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2 tracking-tight">No Final Grades Yet</h3>
          <p className="text-slate-400 text-sm font-medium max-w-xs mx-auto">Final grades will appear here once encoded by your subject teachers.</p>
        </div>
      ) : (
        <>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-md overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
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
                <tbody className="divide-y divide-slate-100">
                  {Object.values(bySubject).map((s, idx) => {
                    const scores = [1,2,3,4].map(q => s.quarters[q] ? parseFloat(s.quarters[q].raw_score) : null).filter(v => v !== null);
                    const avg = scores.length ? (scores.reduce((a,b) => a+b,0)/scores.length).toFixed(2) : null;
                    const rounded = avg ? Math.round(parseFloat(avg)) : null;
                    const remarks = rounded ? remarksFor(rounded) : null;
                    return (
                      <tr key={s.subject_code} className={`hover:bg-violet-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800 text-sm leading-tight">{s.subject_name}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{s.subject_code}</div>
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
                                <span className="text-slate-300 text-xs font-bold">—</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-4 py-4 text-center">
                          {avg ? (
                            <span className={`inline-flex items-center justify-center px-3 py-1 rounded-lg border-2 text-[13px] font-black shadow-sm ${scoreColor(parseFloat(avg))}`}>
                              {avg}
                            </span>
                          ) : <span className="text-slate-300 text-xs font-bold">—</span>}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {rounded ? (
                            <span className={`inline-flex items-center justify-center px-3 py-1 rounded-lg border-2 text-[13px] font-black shadow-sm ${scoreColor(rounded)}`}>
                              {rounded}
                            </span>
                          ) : <span className="text-slate-300 text-xs font-bold">—</span>}
                        </td>
                        <td className="px-4 py-4 text-center">
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
              { label: 'Total Subjects', value: Object.keys(bySubject).length, color: 'text-slate-800' },
              { label: 'Outstanding (90+)', value: allScores.filter(s => s >= 90).length, color: 'text-green-600' },
              { label: 'Passing (75–89)', value: allScores.filter(s => s >= 75 && s < 90).length, color: 'text-blue-600' },
              { label: 'Below 75', value: allScores.filter(s => s < 75).length, color: 'text-red-600' },
            ].map(stat => (
              <div key={stat.label} className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm">
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default StudentGradeView;
