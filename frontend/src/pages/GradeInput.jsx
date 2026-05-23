import { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { playSound } from '../utils/sounds';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const QUARTERS = [1, 2, 3, 4];

const scoreColor = (score) => {
  if (score == null) return '';
  if (score >= 90) return 'bg-green-100 text-green-800';
  if (score >= 85) return 'bg-blue-100 text-blue-800';
  if (score >= 80) return 'bg-yellow-100 text-yellow-800';
  if (score >= 75) return 'bg-orange-100 text-orange-800';
  return 'bg-red-100 text-red-800';
};

const remarksFor = (score) => {
  if (score == null) return '';
  if (score >= 90) return 'Outstanding';
  if (score >= 85) return 'Very Satisfactory';
  if (score >= 80) return 'Satisfactory';
  if (score >= 75) return 'Fairly Satisfactory';
  return 'Did Not Meet Expectations';
};

const GradeInput = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [classrooms, setClassrooms]     = useState([]);
  const [subjects, setSubjects]         = useState([]);
  const [students, setStudents]         = useState([]);
  const [selClassroom, setSelClassroom] = useState(location.state?.classroomId || '');
  const [selSubject, setSelSubject]     = useState(location.state?.subjectId || '');
  const [selQuarter, setSelQuarter]     = useState(1);
  const [academicYear, setAcademicYear] = useState(localStorage.getItem('knhs_academic_year') || '2025-2026');

  const handleYearChange = (dir) => {
    const [start, end] = academicYear.split('-').map(Number);
    const newYear = dir === 'next' ? `${start + 1}-${end + 1}` : `${start - 1}-${end - 1}`;
    setAcademicYear(newYear);
    localStorage.setItem('knhs_academic_year', newYear);
  };

  const [cells, setCells]               = useState({});
  const [existingGrades, setExistingGrades] = useState({});
  const [active, setActive]             = useState(null);
  const [loading, setLoading]           = useState(false);
  const [submitting, setSubmitting]     = useState(false);

  const inputRefs = useRef({});

  const formatName = useCallback((fullName = '') => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length < 2) return fullName;
    const last = parts.pop();
    return `${last}, ${parts.join(' ')}`;
  }, []);

  useEffect(() => {
    api.get('/classrooms/').then(r => setClassrooms(r.data)).catch(() => toast.error('Failed to load classrooms'));
  }, []);

  useEffect(() => {
    if (!selClassroom) { setSubjects([]); setStudents([]); setCells({}); setExistingGrades({}); return; }
    api.get(`/classroom-subjects/by_classroom/?classroom_id=${selClassroom}`)
      .then(r => setSubjects(r.data))
      .catch(() => toast.error('Failed to load subjects'));
  }, [selClassroom]);

  const loadStudents = useCallback(async () => {
    if (!selClassroom) return;
    setLoading(true);
    try {
      const res = await api.get(`/enrollments/?classroom=${selClassroom}`);
      const sorted = res.data.sort((a, b) => {
        // Group by sex (Male first, then Female, then Other/None)
        const sexOrder = { 'male': 1, 'female': 2, 'other': 3 };
        const sexA = sexOrder[a.student_sex?.toLowerCase()] || 4;
        const sexB = sexOrder[b.student_sex?.toLowerCase()] || 4;
        
        if (sexA !== sexB) return sexA - sexB;

        // Then by last name
        const nameA = formatName(a.student_name).toLowerCase();
        const nameB = formatName(b.student_name).toLowerCase();
        return nameA.localeCompare(nameB);
      });
      setStudents(sorted);
      
      const init = {};
      sorted.forEach(s => { init[s.student] = ''; });
      setCells(init);
    } catch { toast.error('Failed to load students'); }
    finally { setLoading(false); }
  }, [selClassroom, formatName]);

  const fetchExistingGrades = useCallback(async () => {
    if (!selClassroom || !selSubject || !selQuarter) {
      setExistingGrades({});
      return;
    }
    try {
      const res = await api.get(`/grades/?classroom=${selClassroom}&subject=${selSubject}&quarter=${selQuarter}&academic_year=${academicYear}&grade_type=final_grade`);
      const map = {};
      res.data.forEach(g => {
        map[g.student] = g;
      });
      setExistingGrades(map);
    } catch (err) {
      console.error('Failed to fetch existing grades', err);
    }
  }, [selClassroom, selSubject, selQuarter, academicYear]);

  useEffect(() => { loadStudents(); }, [loadStudents]);
  useEffect(() => { fetchExistingGrades(); }, [fetchExistingGrades]);

  const handleGradeChange = (studentId, value) => {
    setCells(prev => ({ ...prev, [studentId]: value }));
  };

  const handleKeyDown = (e, studentId) => {
    const idx = students.findIndex(s => s.student === studentId);
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const next = students[idx + 1];
      if (next) { inputRefs.current[next.student]?.focus(); setActive(next.student); }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = students[idx - 1];
      if (prev) { inputRefs.current[prev.student]?.focus(); setActive(prev.student); }
    }
  };

  const filled  = students.filter(s => cells[s.student] !== '');
  const scores  = filled.map(s => parseFloat(cells[s.student])).filter(v => !isNaN(v) && v >= 0 && v <= 100);
  const avg     = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : null;
  const highest = scores.length ? Math.max(...scores) : null;
  const lowest  = scores.length ? Math.min(...scores) : null;
  const passing = scores.filter(s => s >= 75).length;

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

  const handleSubmit = async () => {
    if (!selSubject) return toast.error('Please select a subject');
    const toSubmit = students.filter(s => cells[s.student] !== '');
    if (!toSubmit.length) return toast.error('Enter at least one grade');

    for (const s of toSubmit) {
      const val = parseFloat(cells[s.student]);
      if (isNaN(val) || val < 0 || val > 100)
        return toast.error(`${formatName(s.student_name)}: grade must be between 0 and 100`);
    }

    // Check for overwrites
    const overwriting = toSubmit.filter(s => {
      const existing = existingGrades[s.student];
      return existing && parseFloat(cells[s.student]) !== parseFloat(existing.raw_score);
    });

    let confirmTitle = 'Submit Final Grades?';
    let confirmHtml = `Submit final grades for <strong>${toSubmit.length}</strong> student(s) — Q${selQuarter}?`;
    let confirmIcon = 'question';

    if (overwriting.length > 0) {
      confirmTitle = 'Overwrite Existing Grades?';
      confirmIcon = 'warning';
      confirmHtml = `
        <div class="text-left space-y-2">
          <p class="font-bold text-amber-600 mb-2">You are about to overwrite grades for ${overwriting.length} student(s):</p>
          <div class="max-h-32 overflow-y-auto border border-amber-100 rounded-lg p-2 bg-amber-50/50 text-[10px] md:text-xs">
            ${overwriting.map(s => {
              const ex = existingGrades[s.student];
              return `<div class="py-0.5 border-b border-amber-100 last:border-0">
                <strong>${formatName(s.student_name)}</strong>: ${ex.raw_score} → <span class="text-purple-700 font-black">${cells[s.student]}</span>
              </div>`;
            }).join('')}
          </div>
          <p class="text-[10px] md:text-xs text-gray-500 mt-2 italic">Total to submit: ${toSubmit.length} students.</p>
        </div>
      `;
    }

    const result = await Swal.fire({
      title: confirmTitle,
      html: confirmHtml,
      icon: confirmIcon, 
      showCancelButton: true,
      confirmButtonColor: '#9333ea', 
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Submit',
      customClass: { popup: 'rounded-3xl' }
    });
    if (!result.isConfirmed) return;

    const cs = subjects.find(s => String(s.subject) === String(selSubject));
    if (!cs) return toast.error('Subject assignment not found');

    setSubmitting(true);
    const errors = [];

    await Promise.all(toSubmit.map(async s => {
      const finalScore = parseFloat(cells[s.student]);
      try {
        // Final grade: raw_score = final_score, total_score = 100
        await api.post('/grades/', {
          student: s.student,
          subject: selSubject,
          classroom: selClassroom,
          teacher: cs.teacher,
          grade_type: 'final_grade',
          quarter: selQuarter,
          academic_year: academicYear,
          raw_score: finalScore,
          total_score: 100,
        });
      } catch (err) {
        let msg = err.response?.data?.non_field_errors?.[0] || err.response?.data?.detail || 'Error';
        if (msg.toLowerCase().includes('unique set')) {
          msg = 'Grade already submitted for this period';
        }
        errors.push(`${formatName(s.student_name)}: ${msg}`);
      }
    }));

    setSubmitting(false);

    if (!errors.length) {
      playSound('gradeSubmit');
      toast.success('Final grades submitted');
      // Instead of navigating away, just clear the inputs but keep the context
      setCells({});
      fetchExistingGrades();
    } else {
      playSound('error');
      const allDuplicates = errors.every(e => e.toLowerCase().includes('already submitted'));
      Swal.fire({
        icon: errors.length < toSubmit.length ? 'warning' : 'error',
        title: allDuplicates ? 'Grades Already Submitted' : (errors.length < toSubmit.length ? 'Partial Success' : 'Submission Failed'),
        html: `
          <div className="text-sm text-gray-600 mb-2">
            ${allDuplicates ? 'All selected students already have grades recorded for this quarter/year.' : 'There were issues submitting some grades:'}
          </div>
          <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-lg p-2 bg-gray-50">
            ${errors.map(e => `<div class="text-xs text-left py-1 border-b border-gray-200 last:border-0">${e}</div>`).join('')}
          </div>
        `,
        confirmButtonColor: '#9333ea',
      });
    }
  };

  return (
    <div className="flex flex-col bg-gray-50 overflow-hidden max-w-full" style={{ height: 'calc(100dvh - 68px - 80px)' }}>

      {/* ── Toolbar ── */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-2 md:px-4 py-2 md:py-2.5 shadow-sm z-30">
        {/* Row 1: Class + Subject + Submit */}
        <div className="flex items-center gap-2 mb-2 md:mb-0 md:hidden">
          <select value={selClassroom} onChange={e => { setSelClassroom(e.target.value); setSelSubject(''); }}
            className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium bg-white min-w-0">
            <option value="">— Class —</option>
            {sortedClassrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={selSubject} onChange={e => setSelSubject(e.target.value)}
            disabled={!selClassroom}
            className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium bg-white min-w-0 disabled:bg-gray-50 disabled:text-gray-400">
            <option value="">— Subject —</option>
            {subjects.map(s => <option key={s.id} value={s.subject}>{s.subject_name}</option>)}
          </select>
        </div>

        {/* Row 2 (mobile) / Single row (desktop): Quarter + Year + Submit */}
        <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
          {/* Back button */}
          <button onClick={() => navigate('/grade-management')}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-all active:scale-95 flex-shrink-0 border border-gray-200 md:border-transparent">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>

          <div className="hidden md:block w-px h-5 bg-gray-200 flex-shrink-0" />

          {/* Class (desktop only) */}
          <div className="hidden md:flex items-center gap-1 flex-1 min-w-0">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Class</label>
            <select value={selClassroom} onChange={e => { setSelClassroom(e.target.value); setSelSubject(''); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-[130px] shadow-sm font-medium">
              <option value="">— Class —</option>
              {sortedClassrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Subject (desktop only) */}
          <div className="hidden md:flex items-center gap-1 flex-1 min-w-0">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Subject</label>
            <select value={selSubject} onChange={e => setSelSubject(e.target.value)}
              disabled={!selClassroom}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-[150px] disabled:bg-gray-50 disabled:text-gray-400 shadow-sm font-medium">
              <option value="">— Subject —</option>
              {subjects.map(s => <option key={s.id} value={s.subject}>{s.subject_name}</option>)}
            </select>
          </div>

          {/* Quarter */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden shadow-sm flex-shrink-0">
            {QUARTERS.map(q => (
              <button key={q} onClick={() => setSelQuarter(q)}
                className={`px-3 py-2 text-xs font-bold transition-all ${
                  selQuarter === q ? 'bg-[#2D1B4D] text-white' : 'bg-white text-gray-600 hover:bg-purple-50'
                }`}>
                Q{q}
              </button>
            ))}
          </div>

          {/* Academic Year */}
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm flex-shrink-0">
            <button onClick={() => handleYearChange('prev')} className="px-2 py-2 hover:bg-gray-50 text-gray-500 border-r border-gray-200 transition-colors">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="px-2 text-center text-xs font-bold text-gray-700 select-none min-w-[72px]">{academicYear}</div>
            <button onClick={() => handleYearChange('next')} className="px-2 py-2 hover:bg-gray-50 text-gray-500 border-l border-gray-200 transition-colors">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          {/* Submit */}
          <button onClick={handleSubmit}
            disabled={submitting || !selSubject || !students.length}
            className="flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-md active:scale-95 flex-1 md:flex-none min-w-[80px]">
            {submitting ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>Submit</>
            )}
          </button>
        </div>
      </div>

      {/* Context breadcrumb */}
      {selClassroom && selSubject && (
        <div className="flex-shrink-0 bg-[#2D1B4D] text-purple-200 px-2 md:px-4 py-1 md:py-2 flex flex-wrap items-center gap-1 md:gap-2 text-[8px] md:text-xs font-medium z-20 min-w-0">
          <div className="flex items-center gap-1 md:gap-1.5 min-w-0 truncate">
            <span className="text-white bg-white/10 px-1 py-0.5 rounded uppercase tracking-wider truncate">{classrooms.find(c => String(c.id) === String(selClassroom))?.name}</span>
            <span className="opacity-40 shrink-0">/</span>
            <span className="text-purple-100 truncate">{subjects.find(s => String(s.subject) === String(selSubject))?.subject_name}</span>
            <span className="opacity-40 shrink-0">/</span>
            <span className="bg-purple-500/20 text-purple-300 px-1 py-0.5 rounded tracking-wide font-bold shrink-0">Q{selQuarter}</span>
          </div>
          <span className="hidden md:inline ml-auto text-purple-400/80 text-[10px] uppercase tracking-widest font-bold">
            Keyboard Nav: Tab / Enter / Arrows
          </span>
        </div>
      )}

      {/* Spreadsheet */}
      <div className="flex-1 overflow-auto min-h-0 scrollbar-thin scrollbar-thumb-gray-300 max-w-full">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
          </div>
        ) : !selClassroom ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-2 md:gap-4 p-4 md:p-8 text-center select-none">
            <div className="p-3 md:p-6 bg-gray-100 rounded-full">
              <svg className="w-8 h-8 md:w-24 md:h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 10h18M3 14h18M10 3v18M14 3v18M3 3h18v18H3z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm md:text-xl font-bold text-gray-500 uppercase tracking-wider">Ready to input grades?</p>
              <p className="text-[8px] md:text-sm text-gray-400 mt-1 max-w-xs mx-auto uppercase tracking-widest font-bold">Select a classroom and subject above</p>
            </div>
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
             <svg className="w-12 h-12 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            <p className="text-base font-semibold">No students found</p>
            <p className="text-xs">There are no students enrolled in this classroom for the selected academic year.</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-w-full scrollbar-thin scrollbar-thumb-gray-200">
            <table className="border-collapse w-full text-[10px] md:text-sm min-w-[400px] md:min-w-[600px]">
              <thead className="sticky top-0 z-20">
                <tr>
                  <th className="w-8 md:w-12 bg-[#3D2B5D] border border-[#4D3B6D] text-center text-[7px] md:text-[10px] text-purple-300 font-bold py-1.5 md:py-3 sticky left-0 z-30 select-none uppercase tracking-widest shrink-0">#</th>
                  <th className="bg-[#3D2B5D] text-white border border-[#4D3B6D] text-left px-1.5 md:px-4 py-1.5 md:py-3 font-bold sticky left-8 md:left-12 z-30 min-w-[120px] md:min-w-[240px] uppercase tracking-wider text-[8px] md:text-xs">Student Name</th>
                  <th className="bg-[#3D2B5D] text-white border border-[#4D3B6D] text-center px-1.5 md:px-4 py-1.5 md:py-3 font-bold min-w-[80px] md:min-w-[140px] uppercase tracking-wider text-[8px] md:text-xs">
                    Grade
                    <div className="hidden md:block text-[10px] font-normal text-purple-300 tracking-widest mt-0.5">SCALE: 0 – 100</div>
                  </th>
                  <th className="bg-[#3D2B5D] text-white border border-[#4D3B6D] text-center px-1.5 md:px-4 py-1.5 md:py-3 font-bold min-w-[100px] md:min-w-[160px] uppercase tracking-wider text-[8px] md:text-xs">Performance</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let lastSex = null;
                  let maleIdx = 0;
                  let femaleIdx = 0;
                  
                  return students.map((s, idx) => {
                    const currentSex = (s.student_sex || 'other').toLowerCase();
                    const showHeader = currentSex !== lastSex;
                    lastSex = currentSex;
                    
                    if (currentSex === 'male') maleIdx++;
                    if (currentSex === 'female') femaleIdx++;
                    const displayIdx = currentSex === 'male' ? maleIdx : currentSex === 'female' ? femaleIdx : idx + 1;

                    const raw      = cells[s.student];
                    const score    = raw !== '' && !isNaN(parseFloat(raw)) ? parseFloat(raw) : null;
                    const isOver   = score !== null && score > 100;
                    const isActive = active === s.student;
                    const rowBg    = isActive ? 'bg-violet-50/80' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40';

                    return (
                      <Fragment key={s.student}>
                        {showHeader && (
                          <tr className="bg-slate-100/80 backdrop-blur-sm border-y border-slate-200">
                            <td colSpan="4" className="px-3 py-1.5 md:px-6 md:py-2 text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                              <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${currentSex === 'male' ? 'bg-blue-500' : currentSex === 'female' ? 'bg-rose-500' : 'bg-slate-400'}`} />
                                {currentSex === 'male' ? 'Male Students' : currentSex === 'female' ? 'Female Students' : 'Other / Unassigned'}
                              </div>
                            </td>
                          </tr>
                        )}
                        <tr onClick={() => setActive(s.student)}
                          className={`cursor-default transition-colors ${isActive ? 'outline outline-2 outline-purple-500 outline-offset-[-2px] z-10' : 'hover:bg-purple-50/30'}`}>
                          <td className={`border border-gray-100 text-center text-[7px] md:text-[10px] font-bold text-gray-400 py-1.5 md:py-3 sticky left-0 z-10 ${rowBg} select-none`}>{displayIdx}</td>
                          <td className={`border border-gray-100 px-1 md:px-4 py-1 md:py-2.5 sticky left-8 md:left-12 z-10 ${rowBg} min-w-0`}>
                            <div className="flex items-center gap-1 md:gap-3 min-w-0">
                              <div className={`hidden sm:flex w-5 h-5 md:w-8 md:h-8 rounded-lg items-center justify-center text-white font-black text-[9px] md:text-xs flex-shrink-0 shadow-sm transition-transform group-hover:scale-110 ${currentSex === 'male' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : currentSex === 'female' ? 'bg-gradient-to-br from-rose-500 to-purple-600' : 'bg-gradient-to-br from-slate-500 to-slate-700'}`}>
                                {s.student_name?.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/profile?student_id=${s.student}`);
                                  }}
                                  className="font-black text-gray-800 text-xs md:text-sm leading-tight truncate block hover:text-purple-600 transition-colors uppercase tracking-tight max-w-[90px] sm:max-w-[140px] md:max-w-none"
                                  title="View Profile"
                                >
                                  {formatName(s.student_name)}
                                </button>
                                <div className="hidden md:block text-[10px] text-gray-400 leading-tight mt-0.5 font-medium truncate">{s.student_email}</div>
                              </div>
                            </div>
                          </td>
                          <td className={`p-0 border border-gray-100 relative ${isActive ? 'bg-white' : isOver ? 'bg-red-50' : rowBg}`}>
                            {existingGrades[s.student] && cells[s.student] === '' && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30 select-none">
                                <span className="font-mono text-[10px] md:text-sm font-black text-slate-400 tracking-tighter">
                                  {existingGrades[s.student].raw_score}
                                </span>
                              </div>
                            )}
                            <input
                              ref={el => inputRefs.current[s.student] = el}
                              type="number" min="0" max="100" step="0.01"
                              value={raw}
                              onChange={e => handleGradeChange(s.student, e.target.value)}
                              onFocus={() => setActive(s.student)}
                              onKeyDown={e => handleKeyDown(e, s.student)}
                              placeholder="—"
                              className={`w-full h-full px-2 py-3 md:px-4 md:py-3 text-center font-mono text-sm bg-transparent focus:outline-none transition-all ${isOver ? 'text-red-600 font-bold' : 'text-gray-900 font-semibold'}`}
                            />
                          </td>
                          <td className={`border border-gray-100 text-center py-2 px-1 md:px-3 ${rowBg}`}>
                            {score !== null && !isOver ? (
                              <span className={`text-[9px] md:text-[10px] font-black px-1.5 py-0.5 md:px-3 md:py-1 rounded-md md:rounded-lg shadow-sm border border-black/5 uppercase tracking-tight ${scoreColor(score)}`}>
                                <span className="hidden sm:inline">{remarksFor(score).toUpperCase()}</span>
                                <span className="sm:hidden">{score >= 90 ? 'O' : score >= 85 ? 'VS' : score >= 80 ? 'S' : score >= 75 ? 'FS' : 'DNM'}</span>
                              </span>
                            ) : isOver ? (
                              <span className="text-[9px] text-red-600 font-black uppercase bg-red-50 px-1.5 py-0.5 rounded">OVER</span>
                            ) : existingGrades[s.student] ? (
                              <span className={`text-[9px] md:text-[10px] font-black px-1.5 py-0.5 md:px-3 md:py-1 rounded-md md:rounded-lg shadow-sm border border-black/5 uppercase tracking-tight opacity-40 ${scoreColor(parseFloat(existingGrades[s.student].raw_score))}`}>
                                <span className="hidden sm:inline">{remarksFor(parseFloat(existingGrades[s.student].raw_score)).toUpperCase()}</span>
                                <span className="sm:hidden">{parseFloat(existingGrades[s.student].raw_score) >= 90 ? 'O' : parseFloat(existingGrades[s.student].raw_score) >= 85 ? 'VS' : parseFloat(existingGrades[s.student].raw_score) >= 80 ? 'S' : parseFloat(existingGrades[s.student].raw_score) >= 75 ? 'FS' : 'DNM'}</span>
                              </span>
                            ) : (
                              <span className="text-gray-300 text-xs font-bold">—</span>
                            )}
                          </td>
                        </tr>
                      </Fragment>
                    );
                  });
                })()}

                {/* Summary row */}
                <tr className="sticky bottom-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                  <td className="bg-[#2D1B4D] border-r border-[#3D2B5D]" />
                  <td className="bg-[#2D1B4D] text-purple-200 border-r border-[#3D2B5D] px-1.5 md:px-4 py-1.5 md:py-3 font-black text-[7px] md:text-[10px] uppercase tracking-widest sticky left-8 md:left-12 z-20">
                    <div className="flex items-center gap-1 md:gap-2">
                      <span className="text-white">Summary</span>
                      <span className="text-purple-400 hidden sm:inline">/</span>
                      <span className="text-purple-100 hidden sm:inline">{filled.length} of {students.length} encoded</span>
                    </div>
                  </td>
                  <td className="bg-[#2D1B4D] text-white border-r border-[#3D2B5D] text-center py-1 md:py-2">
                    {avg != null ? (
                      <div className="animate-in fade-in zoom-in duration-300">
                        <div className="font-black text-xs md:text-lg text-purple-100 leading-none">{avg}</div>
                        <div className="text-[6px] md:text-[9px] text-purple-400 font-bold uppercase tracking-tighter mt-0.5">Avg</div>
                      </div>
                    ) : <span className="text-purple-500 font-black tracking-widest">—</span>}
                  </td>
                  <td className="bg-[#2D1B4D] border-r border-[#3D2B5D] text-center py-1 md:py-2">
                    {scores.length > 0 ? (
                      <div className="flex justify-center gap-1.5 md:gap-6 text-[7px] md:text-[10px] font-bold animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex flex-col"><span className="text-emerald-400">{highest}</span><span className="text-purple-500 uppercase text-[6px] tracking-tighter">Hi</span></div>
                        <div className="flex flex-col"><span className="text-red-400">{lowest}</span><span className="text-purple-500 uppercase text-[6px] tracking-tighter">Lo</span></div>
                        <div className="flex flex-col"><span className="text-blue-400">{passing}</span><span className="text-purple-500 uppercase text-[6px] tracking-tighter">Pass</span></div>
                      </div>
                    ) : <span className="text-purple-500 font-black tracking-widest">—</span>}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex-shrink-0 bg-[#2D1B4D] border-t border-[#3D2B5D] px-2 md:px-4 py-1 md:py-1.5 flex flex-wrap items-center justify-center gap-3 md:gap-8 text-[8px] md:text-[10px] font-bold text-purple-300 uppercase tracking-widest">
        <div className="flex items-center gap-1">STU: <span className="text-white">{students.length}</span></div>
        <div className="flex items-center gap-1">ENC: <span className="text-white">{filled.length}</span></div>
        {avg     && <div className="flex items-center gap-1">AVG: <span className="text-purple-100">{avg}</span></div>}
        {highest && <div className="flex items-center gap-1 md:hidden">HI: <span className="text-emerald-400">{highest}</span></div>}
        {highest && <div className="hidden md:flex items-center gap-2">Highest: <span className="text-emerald-400">{highest}</span></div>}
        {lowest  && <div className="hidden md:flex items-center gap-2">Lowest: <span className="text-red-400">{lowest}</span></div>}
        {scores.length > 0 && <div className="flex items-center gap-1 md:gap-2">PAS: <span className="text-blue-400">{passing}/{scores.length}</span></div>}
      </div>
    </div>
  );
};

export default GradeInput;
