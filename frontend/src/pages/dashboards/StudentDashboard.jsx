import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
  Card, CardHeader, CardBody, CardTitle, Button, Badge,
  LoadingSpinner, EmptyState
} from '../../components/ui';

/**
 * Student Dashboard - DepEd Government Education Style
 * Professional academic dashboard for students
 */

const getLocalDateStr = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
};

const isWeekend = (dateStr) => {
  const day = new Date(dateStr + 'T00:00:00').getDay();
  return day === 0 || day === 6;
};

const computeStreak = (records) => {
  if (!Array.isArray(records) || records.length === 0) return { streak: 0, hasData: false };
  const weekdayRecords = records
    .filter((r) => r.date && !isWeekend(r.date))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  if (weekdayRecords.length === 0) return { streak: 0, hasData: false };
  let streak = 0;
  for (const r of weekdayRecords) {
    if (['present', 'late'].includes(r.status)) streak++;
    else break;
  }
  return { streak, hasData: true };
};

const gradeScore = (g) => parseFloat(g.transmuted_score ?? g.raw_score ?? 0);

const formatDue = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil((d - now) / 86400000);
  if (diffDays < 0) return 'Overdue';
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatFeedTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const diffHours = Math.floor((Date.now() - date) / 3600000);
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/grades/my_grades/').catch(() => ({ data: [] })),
      api.get('/attendance/').catch(() => ({ data: [] })),
      api.get('/student/dashboard/stats/').catch(() => ({ data: {} })),
      api.get('/assignments/').catch(() => ({ data: [] })),
      api.get('/announcements/').catch(() => ({ data: [] })),
      api.get('/schedules/today/').catch(() => ({ data: [] })),
    ]).then(([gradeRes, attRes, statsRes, assignRes, annRes, schedRes]) => {
      setGrades(gradeRes.data);
      setAttendance(attRes.data);
      setStats(statsRes.data);
      setAssignments(Array.isArray(assignRes.data) ? assignRes.data : assignRes.data?.results || []);
      setAnnouncements(Array.isArray(annRes.data) ? annRes.data : annRes.data?.results || []);
      setSchedule(schedRes.data || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Calculate attendance stats
  const validAtt = Array.isArray(attendance) ? attendance.filter((r) => !isWeekend(r.date)) : [];
  const presentCount = validAtt.filter((r) => r.status === 'present').length;
  const lateCount = validAtt.filter((r) => r.status === 'late').length;
  const absentCount = validAtt.filter((r) => r.status === 'absent').length;
  const totalPresentForRate = validAtt.filter((r) => ['present', 'late'].includes(r.status)).length;
  const attRate = validAtt.length > 0 ? Math.round((totalPresentForRate / validAtt.length) * 100) : 0;
  const { streak, hasData: hasAttData } = computeStreak(attendance);

  const todayStr = getLocalDateStr();
  const todayRecord = Array.isArray(attendance) ? attendance.find((r) => r.date === todayStr) : null;
  const todayIsWeekend = isWeekend(todayStr);
  const todayAttLabel = todayIsWeekend
    ? 'Weekend — no class today'
    : !todayRecord
    ? 'Today not marked yet'
    : `Today: ${todayRecord.status.charAt(0).toUpperCase()}${todayRecord.status.slice(1)}`;

  // Calculate grade stats
  const finalGrades = Array.isArray(grades)
    ? grades.filter((g) => g.grade_type === 'final_grade' && (g.transmuted_score != null || g.raw_score != null))
    : [];
  const sortedGrades = [...finalGrades].sort((a, b) => gradeScore(b) - gradeScore(a));
  const overallAvg =
    finalGrades.length > 0
      ? (finalGrades.reduce((s, g) => s + gradeScore(g), 0) / finalGrades.length).toFixed(1)
      : null;
  const topSubject = sortedGrades[0]
    ? { name: sortedGrades[0].subject_name, score: gradeScore(sortedGrades[0]) }
    : null;

  // Get upcoming assignments
  const now = new Date();
  const upcomingAssignments = assignments
    .filter((a) => a.due_date && new Date(a.due_date) >= now)
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 6);

  const recentAnnouncements = announcements.slice(0, 5);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  // Schedule helpers
  const toMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 0;
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const period = match[3].toUpperCase();
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  };

  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const currentIdx = schedule.findIndex((s) => {
    const start = toMinutes(s.time_slot_detail?.start_time_display);
    const end = toMinutes(s.time_slot_detail?.end_time_display);
    return nowMinutes >= start && nowMinutes < end;
  });

  const hours = new Date().getHours();
  const greeting = hours < 12 ? 'Good morning' : hours < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="page-bottom-safe max-w-[1800px] mx-auto bg-slate-50 px-4 py-4 md:px-6 md:py-6 space-y-5 md:space-y-6"
    >
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* WELCOME BANNER */}
      {/* ══════════════════════════════════════════════════════════════ */}
      
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 border-blue-700">
        <CardBody className="p-5 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-blue-200 mb-2">
                {today}
              </p>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                {greeting}, <span className="text-blue-100">{user?.first_name || 'Student'}</span>
              </h1>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="slate" className="bg-white/10 border-white/20 text-white">
                  Grade {user?.profile?.grade_level || 'N/A'}
                </Badge>
                <Badge variant="slate" className="bg-white/10 border-white/20 text-white">
                  Attendance: {attRate}%
                </Badge>
                {overallAvg && (
                  <Badge variant="slate" className="bg-white/10 border-white/20 text-white">
                    Average: {overallAvg}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => navigate('/student-grades')}>
                My Grades
              </Button>
              <Button variant="secondary" size="sm" onClick={() => navigate('/schedule')}>
                Schedule
              </Button>
              <Button variant="secondary" size="sm" onClick={() => navigate('/materials')}>
                Materials
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ROW 1: TODAY'S SCHEDULE | ATTENDANCE | GRADES */}
      {/* ══════════════════════════════════════════════════════════════ */}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5">
        {/* Today's Classes */}
        <div className="lg:col-span-6">
          <Card className="h-full min-h-[320px] flex flex-col">
            <CardHeader divider>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div className="flex-1">
                  <CardTitle>Today's Classes</CardTitle>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/schedule')}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardBody className="flex-1 min-h-0 overflow-auto space-y-2">
              {schedule.length === 0 ? (
                <EmptyState
                  title="No Classes Today"
                  description="Check your full schedule for the week"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  }
                />
              ) : (
                schedule.map((s, idx) => {
                  const isCurrent = idx === currentIdx;
                  const isPast = currentIdx !== -1 && idx < currentIdx;
                  return (
                    <div
                      key={s.id}
                      className={`flex items-center gap-3 px-3 py-2.5 border rounded-md transition-all ${
                        isCurrent
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : isPast
                          ? 'bg-slate-50 border-slate-200 opacity-60'
                          : 'bg-white border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="text-center min-w-[48px]">
                        <p className={`text-xs font-bold ${isCurrent ? 'text-white' : 'text-slate-800'}`}>
                          {s.time_slot_detail?.start_time_display}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${isCurrent ? 'text-white' : 'text-slate-900'}`}>
                          {s.subject_detail?.name}
                        </p>
                        <p className={`text-xs truncate ${isCurrent ? 'text-blue-100' : 'text-slate-500'}`}>
                          {s.classroom_detail?.name}
                        </p>
                      </div>
                      {isCurrent && <div className="w-2 h-2 rounded-full bg-emerald-400" />}
                    </div>
                  );
                })
              )}
            </CardBody>
          </Card>
        </div>

        {/* Attendance Summary */}
        <div className="lg:col-span-3">
          <Card className="h-full min-h-[320px] flex flex-col border-l-4 border-l-emerald-500">
            <CardHeader divider>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <CardTitle>Attendance</CardTitle>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">This School Year</p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="flex-1 flex flex-col">
              {!hasAttData ? (
                <EmptyState title="No Records Yet" />
              ) : (
                <>
                  <div className="flex items-end justify-between mb-4">
                    <div>
                      <p className="text-3xl font-extrabold text-emerald-600 tabular-nums">{attRate}%</p>
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mt-1">Rate</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-extrabold text-blue-600 tabular-nums">{streak}</p>
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mt-1">Streak</p>
                    </div>
                  </div>
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-md mb-3">
                    <p className="text-xs font-semibold text-slate-700">{todayAttLabel}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-auto">
                    <div className="text-center p-2 bg-emerald-50 border border-emerald-200 rounded-md">
                      <p className="text-lg font-extrabold text-emerald-600">{presentCount}</p>
                      <p className="text-xs font-bold text-emerald-700 uppercase">Present</p>
                    </div>
                    <div className="text-center p-2 bg-amber-50 border border-amber-200 rounded-md">
                      <p className="text-lg font-extrabold text-amber-600">{lateCount}</p>
                      <p className="text-xs font-bold text-amber-700 uppercase">Late</p>
                    </div>
                    <div className="text-center p-2 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-lg font-extrabold text-red-600">{absentCount}</p>
                      <p className="text-xs font-bold text-red-700 uppercase">Absent</p>
                    </div>
                  </div>
                </>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Grade Summary */}
        <div className="lg:col-span-3">
          <Card className="h-full min-h-[320px] flex flex-col border-l-4 border-l-blue-500">
            <CardHeader divider>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <div className="flex-1">
                  <CardTitle>Grade Summary</CardTitle>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">Current Standing</p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="flex-1 flex flex-col">
              {!overallAvg ? (
                <EmptyState title="No Grades Posted" description="Grades appear when teachers post them" />
              ) : (
                <>
                  <div className="mb-4">
                    <p className="text-3xl font-extrabold text-blue-600 tabular-nums">{overallAvg}</p>
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mt-1">Current Average</p>
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between text-xs font-bold text-slate-600 uppercase mb-2">
                      <span>Progress</span>
                      <span>{Math.round(parseFloat(overallAvg))}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ width: `${Math.min(100, parseFloat(overallAvg))}%` }}
                      />
                    </div>
                  </div>
                  {topSubject && (
                    <div className="flex justify-between items-center gap-2 px-3 py-2 rounded-md bg-emerald-50 border border-emerald-200 mt-auto">
                      <span className="text-xs font-semibold text-slate-700 truncate">Top: {topSubject.name}</span>
                      <span className="text-sm font-extrabold text-emerald-600">{topSubject.score}</span>
                    </div>
                  )}
                </>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ROW 2: SUBJECT PERFORMANCE | UPCOMING ACTIVITIES */}
      {/* ══════════════════════════════════════════════════════════════ */}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5">
        {/* Subject Performance */}
        <div className="lg:col-span-8">
          <Card className="h-full min-h-[320px] flex flex-col">
            <CardHeader divider>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <div className="flex-1">
                  <CardTitle>Subject Performance</CardTitle>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">Current Grades by Subject</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/student-grades')}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardBody className="flex-1 min-h-0 overflow-auto space-y-2">
              {finalGrades.length === 0 ? (
                <EmptyState title="No Subjects Graded Yet" />
              ) : (
                finalGrades.slice(0, 8).map((g) => {
                  const score = gradeScore(g);
                  const barColor = score >= 90 ? 'bg-emerald-500' : score >= 75 ? 'bg-blue-500' : 'bg-red-500';
                  const textColor = score >= 90 ? 'text-emerald-600' : score >= 75 ? 'text-blue-600' : 'text-red-600';
                  return (
                    <div
                      key={g.id}
                      className="px-3 py-2.5 border border-slate-200 rounded-md bg-white hover:bg-slate-50 hover:border-blue-300 cursor-pointer transition-all"
                      onClick={() => navigate('/student-grades')}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <p className="text-sm font-bold text-slate-900 truncate">{g.subject_name}</p>
                        <span className={`text-lg font-extrabold tabular-nums ${textColor}`}>{score}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(100, score)}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </CardBody>
          </Card>
        </div>

        {/* Upcoming Activities */}
        <div className="lg:col-span-4">
          <Card className="h-full min-h-[320px] flex flex-col">
            <CardHeader divider>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <CardTitle>Upcoming</CardTitle>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">Assignments & Deadlines</p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="flex-1 min-h-0 overflow-auto space-y-2">
              {upcomingAssignments.length === 0 ? (
                <EmptyState title="No Upcoming Deadlines" description="New assignments will show here" />
              ) : (
                upcomingAssignments.map((a) => (
                  <div
                    key={a.id}
                    className="px-3 py-2.5 border border-slate-200 rounded-md bg-white hover:bg-slate-50 hover:border-blue-300 cursor-pointer transition-all"
                    onClick={() => navigate('/materials')}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900 truncate">{a.title}</p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {a.subject_name} · {a.classroom_name}
                        </p>
                      </div>
                      <Badge
                        variant={formatDue(a.due_date) === 'Overdue' ? 'red' : 'amber'}
                        size="sm"
                        className="shrink-0"
                      >
                        {formatDue(a.due_date)}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ROW 3: ANNOUNCEMENTS | MESSAGES */}
      {/* ══════════════════════════════════════════════════════════════ */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
        {/* Announcements */}
        <Card className="min-h-[280px] flex flex-col">
          <CardHeader divider>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
              <div className="flex-1">
                <CardTitle>Announcements</CardTitle>
                <p className="text-xs font-semibold text-slate-600 mt-0.5">School & Class Updates</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/announcements')}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardBody className="flex-1 min-h-0 overflow-auto space-y-2">
            {recentAnnouncements.length === 0 ? (
              <EmptyState title="No Announcements" />
            ) : (
              recentAnnouncements.map((a) => (
                <div
                  key={a.id}
                  className="px-3 py-2.5 border border-slate-200 rounded-md bg-white hover:bg-slate-50 hover:border-blue-300 cursor-pointer transition-all"
                  onClick={() => navigate('/announcements')}
                >
                  <p className="text-sm font-bold text-slate-900 line-clamp-1">{a.title}</p>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">{a.content}</p>
                  <p className="text-xs font-semibold text-blue-600 mt-2">{formatFeedTime(a.created_at)}</p>
                </div>
              ))
            )}
          </CardBody>
        </Card>

        {/* Messages */}
        <Card className="min-h-[280px] flex flex-col">
          <CardHeader divider>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <div className="flex-1">
                <CardTitle>Messages</CardTitle>
                <p className="text-xs font-semibold text-slate-600 mt-0.5">
                  {stats?.unread_notifications > 0
                    ? `${stats.unread_notifications} unread`
                    : 'Recent Conversations'}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/messages')}>
                Open Inbox
              </Button>
            </div>
          </CardHeader>
          <CardBody className="flex-1 min-h-0 overflow-auto space-y-2">
            {stats?.latest_messages?.length ? (
              stats.latest_messages.map((m) => (
                <div
                  key={m.id}
                  className="flex gap-2.5 px-3 py-2.5 border border-slate-200 rounded-md bg-white hover:bg-slate-50 hover:border-blue-300 cursor-pointer transition-all"
                  onClick={() => navigate('/messages')}
                >
                  <div className="w-9 h-9 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-extrabold shrink-0">
                    {(m.sender || '?')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2 mb-1">
                      <p className="text-sm font-bold text-slate-900 truncate">{m.sender}</p>
                      <span className="text-xs text-slate-400 shrink-0">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">{m.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="No Messages Yet" />
            )}
          </CardBody>
        </Card>
      </div>
    </motion.div>
  );
};

export default StudentDashboard;
