import { useState, useEffect, useMemo, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { getUser } from '../utils/auth';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const GRADE_LEVELS = ['Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'];

const REMARKS_STYLE = {
  'Outstanding':               'bg-emerald-50 text-emerald-700 border-emerald-100',
  'Very Satisfactory':         'bg-blue-50 text-blue-700 border-blue-100',
  'Satisfactory':              'bg-amber-50 text-amber-700 border-amber-100',
  'Fairly Satisfactory':       'bg-orange-50 text-orange-700 border-orange-100',
  'Did Not Meet Expectations': 'bg-rose-50 text-rose-700 border-rose-100',
};

const gradeNum = (name = '') => { const m = name.match(/\d+/); return m ? parseInt(m[0]) : 999; };

const ScoreBadge = ({ score }) => {
  if (score == null) return <span className="text-slate-300 text-[10px] font-black">—</span>;
  const n = parseFloat(score);
  const cls = n >= 90 ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
    : n >= 85 ? 'text-blue-700 bg-blue-50 border-blue-100'
    : n >= 80 ? 'text-amber-700 bg-amber-50 border-amber-100'
    : n >= 75 ? 'text-orange-700 bg-orange-50 border-orange-100'
    : 'text-rose-700 bg-rose-50 border-rose-100';
  return <span className={`inline-flex items-center justify-center min-w-[2rem] md:min-w-[2.5rem] px-1.5 md:px-2 py-0.5 rounded-md md:rounded-lg border text-[9px] md:text-xs font-black font-mono tracking-tighter ${cls}`}>{n}</span>;
};

const ChevronIcon = ({ open }) => (
  <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const GradeManagement = () => {
  const navigate = useNavigate();
  const user = getUser();

  const [grades, setGrades]         = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading]       = useState(true);

  const [openLevel, setOpenLevel]           = useState(null);
  const [openClassroom, setOpenClassroom]   = useState(null);
  const [openSubject, setOpenSubject]       = useState(null);

  const [filterQuarter, setFilterQuarter] = useState('');
  const [filterYear, setFilterYear]       = useState(localStorage.getItem('knhs_academic_year') || '2025-2026');
  const [search, setSearch]               = useState('');

  const handleYearChange = (dir) => {
    const [start, end] = filterYear.split('-').map(Number);
    const newYear = dir === 'next' ? `${start + 1}-${end + 1}` : `${start - 1}-${end - 1}`;
    setFilterYear(newYear);
    localStorage.setItem('knhs_academic_year', newYear);
  };

  useEffect(() => {
    Promise.all([api.get('/grades/'), api.get('/classrooms/')])
      .then(([gRes, cRes]) => {
        setGrades(gRes.data.filter(g => g.grade_type === 'final_grade'));
        setClassrooms(cRes.data);
      })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  const refresh = async () => {
    try {
      const [gRes, cRes] = await Promise.all([api.get('/grades/'), api.get('/classrooms/')]);
      setGrades(gRes.data.filter(g => g.grade_type === 'final_grade'));
      setClassrooms(cRes.data);
    } catch { toast.error('Failed to refresh'); }
  };

  const handleLockAll = async (studentData) => {
    const grades = Object.values(studentData.quarters);
    const anyUnlocked = grades.some(g => !g.is_locked);
    const targetStatus = anyUnlocked; // If any are unlocked, lock all. Else unlock all.
    
    try {
      await Promise.all(grades.map(g => 
        api.patch(`/grades/${g.id}/`, { is_locked: targetStatus })
      ));
      toast.success(targetStatus ? 'All quarters locked' : 'All quarters unlocked');
      refresh();
    } catch { toast.error('Failed to update lock status'); }
  };

  const handleDeleteAll = async (studentData) => {
    const grades = Object.values(studentData.quarters);
    const result = await Swal.fire({
      title: 'Delete All Grades?',
      text: `This will delete all recorded quarters for ${studentData.name}. This action cannot be undone.`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#ef4444', cancelButtonColor: '#6b7280',
      confirmButtonText: 'Delete All',
    });
    if (!result.isConfirmed) return;
    try {
      await Promise.all(grades.map(g => api.delete(`/grades/${g.id}/`)));
      toast.success('Grades deleted');
      refresh();
    } catch { toast.error('Failed to delete grades'); }
  };

  // Filtered grades
  const filteredGrades = useMemo(() => {
    const res = grades.filter(g => {
      const q = search.toLowerCase();
      const matchSearch = !q || g.student_name?.toLowerCase().includes(q) || g.subject_name?.toLowerCase().includes(q);
      const matchQ = !filterQuarter || String(g.quarter) === filterQuarter;
      const matchYear = !filterYear || g.academic_year === filterYear;
      return matchSearch && matchQ && matchYear;
    });
    return res.sort((a, b) => {
      const nameA = a.student_name || '';
      const nameB = b.student_name || '';
      if (nameA !== nameB) return nameA.localeCompare(nameB);
      return (a.quarter || 0) - (b.quarter || 0);
    });
  }, [grades, search, filterQuarter]);

  // Classrooms grouped by grade level
  const classroomsByLevel = useMemo(() => {
    const map = {};
    classrooms.forEach(c => {
      const level = GRADE_LEVELS.find(l => c.name.toLowerCase().includes(l.toLowerCase())) || 'Other';
      if (!map[level]) map[level] = [];
      map[level].push(c);
    });
    return map;
  }, [classrooms]);

  // Grade index: classroomId → subjectId → studentId → grouped student data
  const gradeIndex = useMemo(() => {
    const idx = {};
    filteredGrades.forEach(g => {
      if (!idx[g.classroom]) idx[g.classroom] = {};
      if (!idx[g.classroom][g.subject]) idx[g.classroom][g.subject] = {};
      if (!idx[g.classroom][g.subject][g.student]) {
        idx[g.classroom][g.subject][g.student] = {
          id: g.student,
          name: g.student_name,
          email: g.student_email,
          sex: g.student_sex, // Added sex field
          quarters: {},
        };
      }
      idx[g.classroom][g.subject][g.student].quarters[g.quarter] = g;
    });
    return idx;
  }, [filteredGrades]);

  // Subjects per classroom
  const subjectsByClassroom = useMemo(() => {
    const map = {};
    filteredGrades.forEach(g => {
      if (!map[g.classroom]) map[g.classroom] = {};
      map[g.classroom][g.subject] = { id: g.subject, name: g.subject_name, code: g.subject_code };
    });
    return map;
  }, [filteredGrades]);

  const calculateFinal = (quarters) => {
    const scores = Object.values(quarters).map(g => parseFloat(g.raw_score)).filter(s => !isNaN(s));
    if (scores.length === 0) return null;
    return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);
  };

  const getRemarks = (score) => {
    if (score == null) return null;
    const n = parseFloat(score);
    if (n >= 90) return 'Outstanding';
    if (n >= 85) return 'Very Satisfactory';
    if (n >= 80) return 'Satisfactory';
    if (n >= 75) return 'Fairly Satisfactory';
    return 'Did Not Meet Expectations';
  };

  const sortedLevels = GRADE_LEVELS.filter(l => classroomsByLevel[l]);
  if (classroomsByLevel['Other']) sortedLevels.push('Other');

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Grade Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Final grades organized by student (Q1–Q4)</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'teacher') && (
          <button onClick={() => navigate('/grade-input')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 active:scale-95 transition-all shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Input Grades
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Search student or subject…"
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 focus:bg-white transition-all" />
          </div>
          <select value={filterQuarter} onChange={e => setFilterQuarter(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all">
            <option value="">All Quarters</option>
            <option value="1">Q1 — First Quarter</option>
            <option value="2">Q2 — Second Quarter</option>
            <option value="3">Q3 — Third Quarter</option>
            <option value="4">Q4 — Fourth Quarter</option>
          </select>
          <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <button onClick={() => handleYearChange('prev')}
              className="px-4 py-2.5 hover:bg-slate-50 text-slate-500 border-r border-slate-200 transition-colors no-min">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 text-center text-sm font-black text-slate-700 select-none">{filterYear}</div>
            <button onClick={() => handleYearChange('next')}
              className="px-4 py-2.5 hover:bg-slate-50 text-slate-500 border-l border-slate-200 transition-colors no-min">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-48 gap-4">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-2 border-slate-100" />
            <div className="absolute inset-0 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
          </div>
        </div>
      ) : sortedLevels.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            </div>
            <h3 className="text-base font-bold text-slate-700 mb-1">No grade records</h3>
            <p className="text-sm text-slate-400">Final grades will appear here once encoded.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedLevels.map((level, lIdx) => {
            const levelClassrooms = (classroomsByLevel[level] || []).filter(c => subjectsByClassroom[c.id]);
            if (!levelClassrooms.length) return null;
            const levelOpen = openLevel === level;
            const levelCount = levelClassrooms.reduce((sum, c) => sum + filteredGrades.filter(g => g.classroom === c.id).length, 0);

            return (
              <div key={level} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all hover:shadow-md">

                {/* Level 1: Grade Level */}
                <button onClick={() => setOpenLevel(levelOpen ? null : level)}
                  className="w-full flex items-center justify-between px-5 py-4 bg-[#1A0B2E] text-white hover:bg-[#2D1452] transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center font-black text-sm border border-white/10">
                      {gradeNum(level) !== 999 ? gradeNum(level) : level.charAt(0)}
                    </div>
                    <div className="text-left">
                      <div className="font-black text-sm uppercase tracking-widest">{level}</div>
                      <div className="text-violet-300/70 text-[10px] font-bold uppercase tracking-widest">{levelClassrooms.length} Rooms · {levelCount} Entries</div>
                    </div>
                  </div>
                  <ChevronIcon open={levelOpen} />
                </button>

                {levelOpen && (
                  <div className="divide-y divide-slate-100">
                    {levelClassrooms.map(classroom => {
                      const classroomOpen = openClassroom === classroom.id;
                      const subjects = Object.values(subjectsByClassroom[classroom.id] || {});
                      const classroomGrades = filteredGrades.filter(g => g.classroom === classroom.id);

                      return (
                        <div key={classroom.id}>
                          {/* Level 2: Classroom */}
                          <button onClick={() => setOpenClassroom(classroomOpen ? null : classroom.id)}
                            className="w-full flex items-center justify-between px-3 md:px-6 py-2.5 md:py-3.5 bg-slate-50 hover:bg-slate-100 transition-colors group border-b border-slate-100">
                            <div className="flex items-center gap-2 md:gap-3 transition-transform group-hover:translate-x-1">
                              <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-slate-200 flex items-center justify-center">
                                <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                              </div>
                              <div className="text-left">
                                <div className="font-black text-slate-800 text-xs md:text-sm uppercase tracking-tight">{classroom.name}</div>
                                <div className="text-[8px] md:text-xs text-slate-400 font-bold uppercase tracking-widest">{subjects.length} Subjects · {classroomGrades.length} Entries</div>
                              </div>
                            </div>
                            <ChevronIcon open={classroomOpen} />
                          </button>

                          {classroomOpen && (
                            <div className="bg-white animate-in slide-in-from-top duration-200">
                              {subjects.map(subject => {
                                const subjectKey = `${classroom.id}-${subject.id}`;
                                const subjectOpen = openSubject === subjectKey;
                                const studentDataMap = gradeIndex[classroom.id]?.[subject.id] || {};
                                
                                const formatName = (fullName = '') => {
                                  const parts = fullName.trim().split(/\s+/);
                                  if (parts.length < 2) return fullName;
                                  const last = parts.pop();
                                  return `${last}, ${parts.join(' ')}`;
                                };

                                const studentsList = Object.values(studentDataMap).sort((a, b) => {
                                  // Group by sex (Male first, then Female)
                                  const sexOrder = { 'male': 1, 'female': 2, 'other': 3 };
                                  const sexA = sexOrder[a.sex?.toLowerCase()] || 4;
                                  const sexB = sexOrder[b.sex?.toLowerCase()] || 4;
                                  if (sexA !== sexB) return sexA - sexB;

                                  // Then by last name
                                  const nameA = formatName(a.name).toLowerCase();
                                  const nameB = formatName(b.name).toLowerCase();
                                  return nameA.localeCompare(nameB);
                                });

                                return (
                                  <div key={subject.id} className="border-t border-slate-100">
                                    {/* Level 3: Subject */}
                                    <button onClick={() => setOpenSubject(subjectOpen ? null : subjectKey)}
                                      className="w-full flex items-center justify-between px-4 md:px-8 py-2 md:py-3 bg-white hover:bg-indigo-50/30 transition-colors group">
                                      <div className="flex items-center gap-2 md:gap-3 transition-transform group-hover:translate-x-1">
                                        <span className="font-black text-[8px] md:text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded uppercase tracking-widest">
                                          {subject.code}
                                        </span>
                                        <div className="text-left">
                                          <div className="font-black text-slate-700 text-[10px] md:text-sm uppercase tracking-tight">{subject.name}</div>
                                          <div className="text-[7px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest">{studentsList.length} Students</div>
                                        </div>
                                      </div>
                                      <ChevronIcon open={subjectOpen} />
                                    </button>

                                    {/* Level 4: Students Horizontal Table */}
                                    {subjectOpen && (
                                      <div className="px-1 md:px-8 pb-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="overflow-x-auto rounded-lg md:rounded-xl border border-slate-200 shadow-sm scrollbar-thin scrollbar-thumb-slate-300">
                                          <table className="w-full text-[10px] md:text-sm">
                                            <thead className="bg-slate-50 border-b border-slate-200">
                                              <tr>
                                                <th className="text-left px-2 md:px-4 py-2 md:py-3 text-[8px] md:text-xs font-black text-slate-400 uppercase tracking-[0.2em] sticky left-0 bg-slate-50 z-10 w-8 md:w-12 border-r border-slate-100">#</th>
                                                <th className="text-left px-2 md:px-4 py-2 md:py-3 text-[8px] md:text-xs font-black text-slate-400 uppercase tracking-[0.2em] sticky left-8 md:left-12 bg-slate-50 z-10 border-r border-slate-200">Student</th>
                                                <th className="text-center px-1 md:px-4 py-2 md:py-3 text-[8px] md:text-xs font-black text-slate-400 uppercase tracking-[0.2em] bg-blue-50/30">Q1</th>
                                                <th className="text-center px-1 md:px-4 py-2 md:py-3 text-[8px] md:text-xs font-black text-slate-400 uppercase tracking-[0.2em] bg-blue-50/30">Q2</th>
                                                <th className="text-center px-1 md:px-4 py-2 md:py-3 text-[8px] md:text-xs font-black text-slate-400 uppercase tracking-[0.2em] bg-blue-50/30">Q3</th>
                                                <th className="text-center px-1 md:px-4 py-2 md:py-3 text-[8px] md:text-xs font-black text-slate-400 uppercase tracking-[0.2em] bg-blue-50/30">Q4</th>
                                                <th className="hidden md:table-cell text-center px-1 md:px-4 py-2 md:py-3 text-[8px] md:text-xs font-black text-violet-600 uppercase tracking-[0.2em] border-l border-slate-200 bg-violet-50/30">Final</th>
                                                <th className="text-center px-1 md:px-4 py-2 md:py-3 text-[8px] md:text-xs font-black text-indigo-600 uppercase tracking-[0.2em] bg-indigo-50/30">Round</th>
                                                <th className="text-center px-1 md:px-4 py-2 md:py-3 text-[8px] md:text-xs font-black text-slate-400 uppercase tracking-[0.2em] bg-violet-50/30">Remarks</th>
                                                {(user?.role === 'admin' || user?.role === 'teacher') && (
                                                  <th className="text-center px-2 md:px-4 py-2 md:py-3 text-[8px] md:text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
                                                )}
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                              {(() => {
                                                let lastSex = null;
                                                let maleIdx = 0;
                                                let femaleIdx = 0;

                                                return studentsList.map((s, idx) => {
                                                  const currentSex = (s.sex || 'other').toLowerCase();
                                                  const showHeader = currentSex !== lastSex;
                                                  lastSex = currentSex;

                                                  if (currentSex === 'male') maleIdx++;
                                                  if (currentSex === 'female') femaleIdx++;
                                                  const displayIdx = currentSex === 'male' ? maleIdx : currentSex === 'female' ? femaleIdx : idx + 1;

                                                  const final = calculateFinal(s.quarters);
                                                  const rounded = final != null ? Math.round(parseFloat(final)) : null;
                                                  const remarks = getRemarks(rounded);
                                                  const anyLocked = Object.values(s.quarters).some(q => q.is_locked);
                                                  const anyUnlocked = Object.values(s.quarters).some(q => !q.is_locked);

                                                  return (
                                                    <Fragment key={s.id}>
                                                      {showHeader && (
                                                        <tr className="bg-slate-100/80 backdrop-blur-sm border-y border-slate-200">
                                                          <td colSpan={(user?.role === 'admin' || user?.role === 'teacher') ? 10 : 9} className="px-3 py-1.5 md:px-6 md:py-2 text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] text-left">
                                                            <div className="flex items-center gap-2">
                                                              <div className={`w-1.5 h-1.5 rounded-full ${currentSex === 'male' ? 'bg-blue-500' : currentSex === 'female' ? 'bg-rose-500' : 'bg-slate-400'}`} />
                                                              {currentSex === 'male' ? 'Male Students' : currentSex === 'female' ? 'Female Students' : 'Other / Unassigned'}
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      )}
                                                      <tr className="hover:bg-violet-50 transition-colors group/row text-center">
                                                        <td className="px-1 md:px-4 py-2 md:py-3 text-slate-400 text-[8px] md:text-xs font-black sticky left-0 bg-white group-hover/row:bg-violet-50 z-10 w-8 md:w-12 border-r border-slate-100">{displayIdx}</td>
                                                        <td className="px-1 md:px-4 py-2 md:py-3 sticky left-8 md:left-12 bg-white group-hover/row:bg-violet-50 z-10 border-r border-slate-200">
                                                          <div className="flex items-center gap-1.5 md:gap-2 min-w-[70px] md:min-w-[180px] text-left">
                                                            <div className={`hidden sm:flex w-5 h-5 md:w-8 md:h-8 rounded-lg items-center justify-center text-white font-black text-[9px] md:text-xs flex-shrink-0 shadow-sm ${currentSex === 'male' ? 'bg-gradient-to-br from-blue-500 to-indigo-500' : currentSex === 'female' ? 'bg-gradient-to-br from-rose-500 to-purple-500' : 'bg-gradient-to-br from-slate-500 to-slate-700'}`}>
                                                              {s.name?.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="min-w-0">
                                                              <div className="font-black text-slate-800 leading-tight whitespace-nowrap text-[8px] md:text-sm uppercase tracking-tight truncate max-w-[60px] md:max-w-none" title={s.name}>
                                                                <span className="md:hidden">{s.name?.split(' ').pop()}</span>
                                                                <span className="hidden md:inline">{formatName(s.name)}</span>
                                                              </div>
                                                              <div className="hidden md:block text-[7px] md:text-[10px] text-slate-400 truncate max-w-[60px] md:max-w-120px font-medium">{s.email}</div>
                                                            </div>
                                                          </div>
                                                        </td>
                                                    {[1, 2, 3, 4].map(qNum => (
                                                      <td key={qNum} className="px-1 md:px-2 py-2 md:py-3 text-center border-l border-slate-50">
                                                        <div className="flex flex-col items-center gap-0.5">
                                                          <ScoreBadge score={s.quarters[qNum]?.raw_score} />
                                                          {s.quarters[qNum]?.is_locked && <span className="text-[7px] md:text-[10px]" title="Locked">🔒</span>}
                                                        </div>
                                                      </td>
                                                    ))}
                                                    <td className="hidden md:table-cell px-1.5 md:px-4 py-2 md:py-3 text-center border-l border-slate-200 bg-violet-50/10">
                                                      <ScoreBadge score={final} />
                                                    </td>
                                                    <td className="px-1.5 md:px-4 py-2 md:py-3 text-center md:border-l border-indigo-50/10 bg-indigo-50/10">
                                                      <ScoreBadge score={rounded} />
                                                    </td>
                                                    <td className="px-2 md:px-4 py-2 md:py-3 text-center bg-violet-50/10">
                                                      {remarks ? (
                                                        <span className={`text-[7px] md:text-[9px] font-black px-1.5 py-0.5 rounded-full border whitespace-nowrap transition-all group-hover/row:scale-105 uppercase tracking-widest ${REMARKS_STYLE[remarks]}`}>
                                                          {remarks}
                                                        </span>
                                                      ) : '—'}
                                                    </td>
                                                    {(user?.role === 'admin' || user?.role === 'teacher') && (
                                                      <td className="px-1 md:px-4 py-2 md:py-3 text-center">
                                                      {/* Desktop Actions */}
                                                      <div className="hidden md:flex items-center justify-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                                        <button onClick={() => window.open(`/profile?student_id=${s.id}`, '_blank')}
                                                          className="p-1.5 text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-all active:scale-95" title="View Student Profile">
                                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                        </button>
                                                        <button onClick={() => window.open(`/student-grades?student_id=${s.id}`, '_blank')}
                                                          className="p-1.5 text-violet-700 bg-violet-100 hover:bg-violet-200 rounded-lg transition-all active:scale-95" title="View Grade Details">
                                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                        </button>
                                                        <button onClick={() => handleLockAll(s)}
                                                          className={`p-1.5 rounded-lg transition-all active:scale-95 ${anyUnlocked ? 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200' : 'text-green-700 bg-green-100 hover:bg-green-200'}`}
                                                          title={anyUnlocked ? 'Lock All' : 'Unlock All'}>
                                                          {anyUnlocked ? (
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                                          ) : (
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                                                          )}
                                                        </button>
                                                        {user?.role === 'admin' && (
                                                          <button onClick={() => handleDeleteAll(s)}
                                                            className="p-1.5 text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-all active:scale-95" title="Delete All Quarters">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                          </button>
                                                        )}
                                                      </div>

                                                      {/* Mobile Actions Dropdown */}
                                                      <div className="md:hidden relative inline-block text-left">
                                                        <button 
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                            Swal.fire({
                                                              title: '<span class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Manage Grade</span>',
                                                              html: `
                                                                <div class="grid grid-cols-1 gap-2 p-1">
                                                                  <button id="view-profile" class="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-slate-50 transition-all group">
                                                                    <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                                    </div>
                                                                    <span class="text-[10px] font-black uppercase tracking-widest text-slate-600">View Profile</span>
                                                                  </button>
                                                                  <button id="view-details" class="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-slate-50 transition-all group">
                                                                    <div class="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                                                                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                                    </div>
                                                                    <span class="text-[10px] font-black uppercase tracking-widest text-slate-600">Grade Details</span>
                                                                  </button>
                                                                  <button id="lock-grades" class="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-slate-50 transition-all group">
                                                                    <div class="w-8 h-8 rounded-lg flex items-center justify-center ${anyUnlocked ? 'bg-yellow-50 text-yellow-600 group-hover:bg-yellow-600' : 'bg-green-50 text-green-600 group-hover:bg-green-600'} group-hover:text-white transition-colors">
                                                                      ${anyUnlocked ? '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>' : '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>'}
                                                                    </div>
                                                                    <span class="text-[10px] font-black uppercase tracking-widest text-slate-600">${anyUnlocked ? 'Lock Grades' : 'Unlock Grades'}</span>
                                                                  </button>
                                                                  ${user?.role === 'admin' ? `
                                                                    <button id="delete-grades" class="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-red-50 transition-all group">
                                                                      <div class="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                                                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                      </div>
                                                                      <span class="text-[10px] font-black uppercase tracking-widest text-red-600">Delete Record</span>
                                                                    </button>
                                                                  ` : ''}
                                                                </div>
                                                              `,
                                                              showConfirmButton: false,
                                                              showCloseButton: true,
                                                              position: 'center',
                                                              width: '280px',
                                                              customClass: {
                                                                popup: 'rounded-3xl border border-slate-200 shadow-2xl overflow-hidden',
                                                                container: 'p-0',
                                                                htmlContainer: 'p-2'
                                                              },
                                                              didOpen: () => {
                                                                document.getElementById('view-profile')?.addEventListener('click', () => { Swal.close(); window.open(`/profile?student_id=${s.id}`, '_blank'); });
                                                                document.getElementById('view-details')?.addEventListener('click', () => { Swal.close(); window.open(`/student-grades?student_id=${s.id}`, '_blank'); });
                                                                document.getElementById('lock-grades')?.addEventListener('click', () => { Swal.close(); handleLockAll(s); });
                                                                document.getElementById('delete-grades')?.addEventListener('click', () => { Swal.close(); handleDeleteAll(s); });
                                                              }
                                                            });
                                                          }}
                                                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                        >
                                                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                                                          </svg>
                                                        </button>
                                                      </div>
                                                    </td>
                                                    )}
                                                  </tr>
                                                </Fragment>
                                              );
                                            });
                                          })()}
                                        </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && (
        <p className="text-[9px] md:text-sm text-slate-400 mt-4 animate-fade-in-up [animation-delay:400ms] font-black uppercase tracking-widest text-center md:text-left">
          {filteredGrades.length} entries · {sortedLevels.length} grade levels
        </p>
      )}
    </div>
  );
};


export default GradeManagement;
