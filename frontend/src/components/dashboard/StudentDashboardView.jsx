import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../Spinner';

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

const PANEL = 'bg-white border border-violet-200/90 shadow-[0_1px_2px_rgba(91,33,182,0.07)] rounded-sm h-full flex flex-col';
const BTN = 'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-sm text-[10px] font-bold uppercase tracking-wide transition-colors';
const BTN_PRIMARY = `${BTN} bg-violet-700 text-white border border-violet-800 hover:bg-violet-800`;
const BTN_BANNER_PRIMARY = `${BTN} bg-white text-violet-900 border border-white hover:bg-violet-50`;
const BTN_BANNER_SECONDARY = `${BTN} bg-violet-600/50 text-white border border-violet-400/70 hover:bg-violet-600/80`;
const BTN_SECONDARY = `${BTN} bg-white text-violet-900 border border-violet-300 hover:bg-violet-50`;
const LINK_BTN = `${BTN} bg-white text-violet-800 border border-violet-300 hover:bg-violet-700 hover:text-white hover:border-violet-700 px-2.5 py-1.5 text-[10px]`;
const LIST_ITEM = 'rounded-sm border border-violet-100 bg-violet-50/40 hover:bg-white hover:border-violet-200 transition-all cursor-pointer';

const PanelHeader = ({ title, subtitle, icon, action }) => (
  <div className="flex items-start justify-between gap-2 mb-3 shrink-0">
    <div className="flex items-center gap-2.5 min-w-0">
      {icon && (
        <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded-sm bg-violet-50 text-violet-700 border border-violet-200">
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        {subtitle && <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

const EmptyBlock = ({ title, description }) => (
  <div className="flex-1 flex flex-col items-center justify-center text-center rounded-sm border border-dashed border-violet-200 bg-violet-50/40 px-4 py-6">
    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">{title}</p>
    {description && <p className="text-[10px] text-slate-500 mt-1 max-w-[200px]">{description}</p>}
  </div>
);

const StudentWelcomeBanner = ({ user, today, chips, onNavigate }) => {
  const hours = new Date().getHours();
  const greeting = hours < 12 ? 'Good morning' : hours < 17 ? 'Good afternoon' : 'Good evening';
  const shell = hours < 12 ? 'bg-violet-700 border-violet-500' : hours < 17 ? 'bg-violet-800 border-violet-600' : 'bg-violet-950 border-violet-700';

  return (
    <div className={`relative overflow-hidden rounded-sm border p-5 md:p-6 ${shell}`}>
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-violet-200">{today}</p>
          <h1 className="text-xl md:text-2xl font-bold text-white">
            {greeting}, <span className="text-violet-100">{user?.first_name || 'Student'}</span>
          </h1>
          <div className="flex flex-wrap gap-2 pt-1">
            {chips.map((chip) => (
              <span key={chip.label} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 border border-white/20 text-white text-xs font-semibold">
                <span className="text-violet-200 text-[10px] uppercase">{chip.label}</span>
                <span>{chip.value}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button type="button" onClick={() => onNavigate('/student-grades')} className={BTN_BANNER_PRIMARY}>
            My Grades
          </button>
          <button type="button" onClick={() => onNavigate('/schedule')} className={BTN_BANNER_SECONDARY}>
            Schedule
          </button>
          <button type="button" onClick={() => onNavigate('/materials')} className={BTN_BANNER_SECONDARY}>
            Materials
          </button>
        </div>
      </div>
    </div>
  );
};

const StudentTodaySchedule = ({ navigate }) => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/schedules/today/').then((r) => setSchedule(r.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

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

  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className={`${PANEL} p-4 md:p-5`}>
      <PanelHeader
        title="Today's Classes"
        subtitle={todayLabel}
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        }
        action={<button type="button" onClick={() => navigate('/schedule')} className={LINK_BTN}>Full schedule</button>}
      />
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none space-y-2">
        {loading ? (
          [1, 2, 3].map((i) => <div key={i} className="h-14 bg-violet-50 animate-pulse rounded-sm" />)
        ) : schedule.length === 0 ? (
          <EmptyBlock title="No classes today" description="Check your full schedule for the week." />
        ) : (
          schedule.map((s, idx) => {
            const isCurrent = idx === currentIdx;
            const isPast = currentIdx !== -1 && idx < currentIdx;
            return (
              <div
                key={s.id}
                className={`flex items-center gap-3 px-3 py-2.5 border rounded-sm ${
                  isCurrent ? 'bg-violet-700 border-violet-700 text-white' : isPast ? 'bg-violet-50/50 border-violet-100 opacity-60' : 'bg-white border-violet-200'
                }`}
              >
                <div className="text-center min-w-[48px] shrink-0">
                  <p className={`text-[11px] font-bold leading-none ${isCurrent ? 'text-white' : 'text-slate-800'}`}>
                    {s.time_slot_detail?.start_time_display}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold truncate ${isCurrent ? 'text-white' : 'text-slate-900'}`}>{s.subject_detail?.name}</p>
                  <p className={`text-[10px] truncate ${isCurrent ? 'text-violet-200' : 'text-slate-500'}`}>{s.classroom_detail?.name}</p>
                </div>
                {isCurrent && <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const StudentAttendanceSummary = ({ attRate, presentCount, lateCount, absentCount, streak, hasAttData, todayLabel, navigate }) => (
  <div className={`${PANEL} p-4 md:p-5`}>
    <PanelHeader
      title="Attendance"
      subtitle="This school year"
      icon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
      action={<button type="button" onClick={() => navigate('/attendance')} className={LINK_BTN}>Details</button>}
    />
    {!hasAttData ? (
      <EmptyBlock title="No records yet" />
    ) : (
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-3xl font-black text-violet-800 tabular-nums leading-none">{attRate}%</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1">Attendance rate</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-black text-emerald-700 tabular-nums">{streak}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Day streak</p>
          </div>
        </div>
        <p className="text-[10px] font-semibold text-slate-600 px-2 py-1.5 rounded-sm bg-slate-50 border border-slate-100">{todayLabel}</p>
        <div className="grid grid-cols-3 gap-2 mt-auto">
          {[
            { label: 'Present', value: presentCount, cls: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
            { label: 'Late', value: lateCount, cls: 'text-amber-700 bg-amber-50 border-amber-100' },
            { label: 'Absent', value: absentCount, cls: 'text-rose-700 bg-rose-50 border-rose-100' },
          ].map((row) => (
            <div key={row.label} className={`rounded-sm border px-2 py-2.5 text-center ${row.cls}`}>
              <p className="text-base font-black tabular-nums">{row.value}</p>
              <p className="text-[9px] font-bold uppercase tracking-wide mt-0.5 opacity-80">{row.label}</p>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

const StudentGradeSummary = ({ overallAvg, topSubject, lowestSubject, navigate }) => {
  const avgNum = overallAvg ? parseFloat(overallAvg) : null;
  return (
    <div className={`${PANEL} p-4 md:p-5`}>
      <PanelHeader
        title="Grade Summary"
        subtitle="Current standing"
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        }
        action={<button type="button" onClick={() => navigate('/student-grades')} className={LINK_BTN}>All grades</button>}
      />
      {!avgNum ? (
        <EmptyBlock title="No grades posted" description="Grades appear when teachers post them." />
      ) : (
        <div className="flex-1 flex flex-col gap-4">
          <div>
            <p className="text-3xl font-black text-violet-800 tabular-nums leading-none">{overallAvg}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1">Current average</p>
          </div>
          <div>
            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase mb-1">
              <span>Progress</span>
              <span>{Math.round(avgNum)}%</span>
            </div>
            <div className="h-2 w-full bg-violet-100 rounded-full overflow-hidden">
              <div className="h-full bg-violet-600 rounded-full transition-all" style={{ width: `${Math.min(100, avgNum)}%` }} />
            </div>
          </div>
          <div className="space-y-2 mt-auto text-xs">
            {topSubject && (
              <div className="flex justify-between gap-2 px-2 py-1.5 rounded-sm bg-emerald-50 border border-emerald-100">
                <span className="text-slate-600 truncate">Top: {topSubject.name}</span>
                <span className="font-black text-emerald-700 shrink-0">{topSubject.score}</span>
              </div>
            )}
            {lowestSubject && lowestSubject.name !== topSubject?.name && (
              <div className="flex justify-between gap-2 px-2 py-1.5 rounded-sm bg-amber-50 border border-amber-100">
                <span className="text-slate-600 truncate">Focus: {lowestSubject.name}</span>
                <span className="font-black text-amber-700 shrink-0">{lowestSubject.score}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const StudentSubjectPerformance = ({ grades, navigate }) => (
  <div className={`${PANEL} p-4 md:p-5`}>
    <PanelHeader
      title="Subject Performance"
      subtitle="Current grades by subject"
      icon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      }
      action={<button type="button" onClick={() => navigate('/student-grades')} className={LINK_BTN}>View all</button>}
    />
    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none space-y-2">
      {grades.length === 0 ? (
        <EmptyBlock title="No subjects graded yet" />
      ) : (
        grades.slice(0, 8).map((g) => {
          const score = gradeScore(g);
          const barColor = score >= 90 ? 'bg-emerald-500' : score >= 75 ? 'bg-violet-500' : 'bg-rose-500';
          return (
            <div key={g.id} className={`px-3 py-2.5 ${LIST_ITEM}`} onClick={() => navigate('/student-grades')} role="button" tabIndex={0}>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <p className="text-xs font-bold text-slate-800 truncate">{g.subject_name}</p>
                <span className={`text-sm font-black tabular-nums ${score >= 90 ? 'text-emerald-600' : score >= 75 ? 'text-violet-700' : 'text-rose-600'}`}>{score}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(100, score)}%` }} />
              </div>
            </div>
          );
        })
      )}
    </div>
  </div>
);

const StudentUpcomingActivities = ({ assignments, navigate }) => (
  <div className={`${PANEL} p-4 md:p-5`}>
    <PanelHeader
      title="Upcoming Activities"
      subtitle="Assignments & deadlines"
      icon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
    />
    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none space-y-2">
      {assignments.length === 0 ? (
        <EmptyBlock title="No upcoming deadlines" description="New assignments will show here." />
      ) : (
        assignments.map((a) => (
          <div key={a.id} className={`px-3 py-2.5 ${LIST_ITEM}`} onClick={() => navigate('/materials')} role="button" tabIndex={0}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{a.title}</p>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">{a.subject_name} · {a.classroom_name}</p>
              </div>
              <span className={`text-[10px] font-bold uppercase shrink-0 px-1.5 py-0.5 rounded-sm ${
                formatDue(a.due_date) === 'Overdue' ? 'bg-rose-50 text-rose-700' : 'bg-violet-50 text-violet-700'
              }`}>
                {formatDue(a.due_date)}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

const StudentAnnouncementsFeed = ({ announcements, navigate }) => (
  <div className={`${PANEL} p-4 md:p-5`}>
    <PanelHeader
      title="Announcements"
      subtitle="School & class updates"
      icon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      }
      action={<Link to="/announcements" className={LINK_BTN}>View feed</Link>}
    />
    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none space-y-2">
      {announcements.length === 0 ? (
        <EmptyBlock title="No announcements" />
      ) : (
        announcements.map((a) => (
          <div key={a.id} className={`px-3 py-2.5 ${LIST_ITEM}`} onClick={() => navigate('/announcements')} role="button" tabIndex={0}>
            <p className="text-xs font-bold text-slate-800 line-clamp-1">{a.title}</p>
            <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{a.content}</p>
            <p className="text-[10px] font-semibold text-violet-600 mt-1">{formatFeedTime(a.created_at)}</p>
          </div>
        ))
      )}
    </div>
  </div>
);

const StudentMessagesFeed = ({ messages, unreadCount, onOpenChat }) => (
  <div className={`${PANEL} p-4 md:p-5`}>
    <PanelHeader
      title="Messages"
      subtitle={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Recent conversations'}
      icon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      }
      action={<button type="button" onClick={onOpenChat} className={LINK_BTN}>Open inbox</button>}
    />
    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none space-y-2">
      {messages?.length ? (
        messages.map((m) => (
          <div key={m.id} className={`flex gap-2.5 p-2.5 ${LIST_ITEM}`} onClick={onOpenChat}>
            <div className="w-8 h-8 rounded-sm bg-violet-100 text-violet-800 flex items-center justify-center text-xs font-bold shrink-0">
              {(m.sender || '?')[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex justify-between gap-2">
                <p className="text-xs font-bold text-slate-800 truncate">{m.sender}</p>
                <span className="text-[9px] text-slate-400 shrink-0">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{m.content}</p>
            </div>
          </div>
        ))
      ) : (
        <EmptyBlock title="No messages yet" />
      )}
    </div>
  </div>
);

const ROW_HEIGHT = 'min-h-[280px] lg:min-h-[300px]';

const StudentDashboardView = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/grades/my_grades/').catch(() => ({ data: [] })),
      api.get('/attendance/').catch(() => ({ data: [] })),
      api.get('/student/dashboard/stats/').catch(() => ({ data: {} })),
      api.get('/assignments/').catch(() => ({ data: [] })),
      api.get('/announcements/').catch(() => ({ data: [] })),
    ]).then(([gradeRes, attRes, statsRes, assignRes, annRes]) => {
      setGrades(gradeRes.data);
      setAttendance(attRes.data);
      setStats(statsRes.data);
      setAssignments(Array.isArray(assignRes.data) ? assignRes.data : assignRes.data?.results || []);
      setAnnouncements(Array.isArray(annRes.data) ? annRes.data : annRes.data?.results || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

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
  const lowestSubject = sortedGrades.length > 0
    ? { name: sortedGrades[sortedGrades.length - 1].subject_name, score: gradeScore(sortedGrades[sortedGrades.length - 1]) }
    : null;

  const now = new Date();
  const upcomingAssignments = assignments
    .filter((a) => a.due_date && new Date(a.due_date) >= now)
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 6);

  const recentAnnouncements = announcements.slice(0, 5);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const bannerChips = [
    { label: 'Grade Level', value: user?.profile?.grade_level || 'N/A' },
    { label: 'Attendance', value: validAtt.length > 0 ? `${attRate}%` : '—' },
    { label: 'Avg Grade', value: overallAvg || '—' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="page-bottom-safe w-full max-w-[min(1600px,92vw)] mx-auto px-4 md:px-6 py-6 space-y-6 bg-violet-50/40 min-h-0"
    >
      {/* Row 1 — Welcome */}
      <StudentWelcomeBanner user={user} today={today} chips={bannerChips} onNavigate={navigate} />

      {/* Row 2 — Schedule | Attendance | Grades (2fr 1fr 1fr) */}
      <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-6 items-stretch ${ROW_HEIGHT}`}>
        <div className="xl:col-span-6 h-full min-h-[280px]">
          <StudentTodaySchedule navigate={navigate} />
        </div>
        <div className="xl:col-span-3 h-full min-h-[280px]">
          <StudentAttendanceSummary
            attRate={attRate}
            presentCount={presentCount}
            lateCount={lateCount}
            absentCount={absentCount}
            streak={streak}
            hasAttData={hasAttData}
            todayLabel={todayAttLabel}
            navigate={navigate}
          />
        </div>
        <div className="xl:col-span-3 h-full min-h-[280px] md:col-span-2 xl:col-span-3">
          <StudentGradeSummary
            overallAvg={overallAvg}
            topSubject={topSubject}
            lowestSubject={lowestSubject}
            navigate={navigate}
          />
        </div>
      </div>

      {/* Row 3 — Subject Performance | Upcoming (2fr 1fr) */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch ${ROW_HEIGHT}`}>
        <div className="lg:col-span-8 h-full min-h-[280px]">
          <StudentSubjectPerformance grades={finalGrades} navigate={navigate} />
        </div>
        <div className="lg:col-span-4 h-full min-h-[280px]">
          <StudentUpcomingActivities assignments={upcomingAssignments} navigate={navigate} />
        </div>
      </div>

      {/* Row 4 — Announcements | Messages */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch ${ROW_HEIGHT}`}>
        <div className="lg:col-span-6 h-full min-h-[260px]">
          <StudentAnnouncementsFeed announcements={recentAnnouncements} navigate={navigate} />
        </div>
        <div className="lg:col-span-6 h-full min-h-[260px]">
          <StudentMessagesFeed
            messages={stats?.latest_messages}
            unreadCount={stats?.unread_notifications || 0}
            onOpenChat={() => navigate('/messages')}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default StudentDashboardView;
