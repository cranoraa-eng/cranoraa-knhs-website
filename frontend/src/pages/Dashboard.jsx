import { getUser } from '../utils/auth';
import { useAuth } from '../context/AuthContext';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { getCurrentAcademicYear } from '../utils/dateHelpers';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import Spinner from '../components/Spinner';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getLocalDateStr = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
};

const isWeekend = (dateStr) => {
  const day = new Date(dateStr + 'T00:00:00').getDay();
  return day === 0 || day === 6;
};

/**
 * Compute consecutive-day attendance streak.
 * - Skips weekends (they don't break or extend the streak).
 * - Stops at the first absent/excused weekday.
 * - Returns { streak, hasData } where hasData=false means no records at all.
 */
const computeStreak = (records) => {
  if (!Array.isArray(records) || records.length === 0) return { streak: 0, hasData: false };
  const weekdayRecords = records
    .filter(r => r.date && !isWeekend(r.date))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  if (weekdayRecords.length === 0) return { streak: 0, hasData: false };
  let streak = 0;
  for (const r of weekdayRecords) {
    if (['present', 'late'].includes(r.status)) streak++;
    else break; // absent or excused breaks the streak
  }
  return { streak, hasData: true };
};

// Formal dashboard surface tokens — purple theme (admin / teacher / student only)
const DASH_PANEL = 'bg-white border border-violet-200/90 shadow-[0_1px_2px_rgba(91,33,182,0.07),0_3px_10px_rgba(91,33,182,0.05)] rounded-sm';
const DASH_PANEL_HEADER = 'border-b border-violet-200 bg-violet-50/70';
const DASH_BTN_PRIMARY = 'inline-flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-sm bg-violet-700 text-white text-[10px] md:text-xs font-bold uppercase tracking-wide border border-violet-800 hover:bg-violet-800 transition-colors active:scale-[0.98]';
const DASH_BTN_SECONDARY = 'inline-flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-sm bg-white text-violet-900 text-[10px] md:text-xs font-bold uppercase tracking-wide border border-violet-300 hover:bg-violet-50 hover:border-violet-400 transition-colors active:scale-[0.98]';
const DASH_ICON_BOX = 'rounded-sm bg-violet-50 text-violet-700 flex items-center justify-center border border-violet-200';
const DASH_ICON_BTN = 'inline-flex items-center justify-center p-2 rounded-sm border border-violet-200 bg-white text-violet-700 hover:bg-violet-700 hover:text-white hover:border-violet-700 transition-colors active:scale-95';
const DASH_ACTIONS_ROW = 'flex flex-wrap items-center justify-center gap-2';
const BANNER_BTN_PRIMARY = 'inline-flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-sm bg-white text-violet-900 text-[10px] md:text-xs font-bold uppercase tracking-wide border border-white shadow-sm hover:bg-violet-50 transition-colors active:scale-[0.98]';
const BANNER_BTN_SECONDARY = 'inline-flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-sm bg-violet-600/50 text-white text-[10px] md:text-xs font-bold uppercase tracking-wide border border-violet-400/70 hover:bg-violet-600/80 hover:border-violet-300 transition-colors active:scale-[0.98]';
const CHART_STROKE = '#7c3aed';
const CHART_FILL = '#ede9fe';

const BANNER_PERIOD_THEME = {
  morning: {
    shell: 'bg-violet-700 border-violet-500',
    orbA: 'bg-amber-300/25',
    orbB: 'bg-violet-500/35',
    chip: 'bg-white/15 border-white/25 text-white',
    chipIcon: 'text-amber-200',
    subtitle: 'text-violet-200',
    message: 'text-violet-100',
  },
  afternoon: {
    shell: 'bg-violet-800 border-violet-600',
    orbA: 'bg-violet-400/20',
    orbB: 'bg-fuchsia-400/15',
    chip: 'bg-white/12 border-white/20 text-white',
    chipIcon: 'text-violet-200',
    subtitle: 'text-violet-200',
    message: 'text-violet-100',
  },
  evening: {
    shell: 'bg-violet-950 border-violet-700',
    orbA: 'bg-indigo-400/20',
    orbB: 'bg-violet-600/30',
    chip: 'bg-white/10 border-white/20 text-white',
    chipIcon: 'text-indigo-200',
    subtitle: 'text-violet-300',
    message: 'text-violet-200',
  },
};

const CHIP_DOT = {
  violet: 'bg-violet-600',
  emerald: 'bg-emerald-600',
  amber: 'bg-amber-600',
  indigo: 'bg-indigo-600',
  blue: 'bg-blue-600',
  rose: 'bg-rose-600',
  yellow: 'bg-yellow-600',
  slate: 'bg-slate-500',
};

// ─── Shared UI Components ───────────────────────────────────────────────────

const GreetingIcon = ({ period, className = 'w-3 h-3 text-violet-600' }) => {
  if (period === 'morning') {
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    );
  }
  if (period === 'afternoon') {
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
      </svg>
    );
  }
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
};

const TeacherActivityIcon = ({ type, className = 'w-4 h-4 md:w-5 md:h-5 text-violet-600' }) => {
  if (type === 'grade') {
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    );
  }
  if (type === 'attendance') {
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  );
};

const WelcomeBanner = ({ user, today, actions, subtitle, statusChips, useSvgGreeting = true }) => {
  const getGreetingData = () => {
    const hours = new Date().getHours();
    if (hours < 12) return { text: 'Good Morning', period: 'morning', message: 'Ready to conquer your classes today?' };
    if (hours < 17) return { text: 'Good Afternoon', period: 'afternoon', message: 'Keep up the great momentum!' };
    return { text: 'Good Evening', period: 'evening', message: 'Time to review and recharge.' };
  };

  const greeting = getGreetingData();
  const theme = BANNER_PERIOD_THEME[greeting.period];
  const initials = [user?.first_name, user?.last_name]
    .filter(Boolean).map(n => n[0].toUpperCase()).join('') || '?';

  return (
    <div
      className={`relative overflow-hidden rounded-sm border shadow-[0_4px_20px_rgba(91,33,182,0.25),0_1px_3px_rgba(15,23,42,0.08)] ${theme.shell} p-4 md:p-6`}
    >
      <div className={`pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full ${theme.orbA}`} aria-hidden="true" />
      <div className={`pointer-events-none absolute -bottom-14 -left-8 h-44 w-44 rounded-full ${theme.orbB}`} aria-hidden="true" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1 bg-white/20" aria-hidden="true" />

      <div className="relative z-10 flex flex-row items-start justify-between gap-4 md:gap-6">
        <div className="flex-1 space-y-2.5 md:space-y-3.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1 text-[9px] md:text-[10px] font-bold uppercase tracking-wide border ${theme.chip}`}>
              <GreetingIcon period={greeting.period} className={`w-3.5 h-3.5 ${theme.chipIcon}`} />
              {greeting.text}
            </span>
            <span className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] md:text-[10px] font-bold uppercase tracking-wide border ${theme.chip}`}>
              <svg className={`w-3 h-3 ${theme.chipIcon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {today}
            </span>
          </div>

          <div className="space-y-1 md:space-y-1.5">
            <h1 className="text-lg md:text-2xl font-bold text-white tracking-tight leading-tight">
              Welcome back,{' '}
              <span className="text-violet-100">{user?.first_name || 'User'}</span>
            </h1>
            {subtitle && (
              <p className={`text-[10px] md:text-xs font-semibold uppercase tracking-wide ${theme.subtitle}`}>{subtitle}</p>
            )}
            <p className={`text-[11px] md:text-sm max-w-lg leading-relaxed hidden sm:block ${theme.message}`}>
              {greeting.message}
            </p>
          </div>

          {statusChips?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 md:gap-2 pt-0.5">
              {statusChips.map((chip, idx) => (
                <div key={idx} className="flex items-center gap-2 border border-white/20 bg-white/10 px-2.5 py-1.5 md:px-3 md:py-2 backdrop-blur-[2px]">
                  <div className={`w-1.5 h-1.5 shrink-0 ${CHIP_DOT[chip.color] || 'bg-white'}`} />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] md:text-xs font-bold text-white leading-none">{chip.value}</span>
                    <span className="text-[9px] md:text-[10px] font-semibold text-violet-200 uppercase tracking-wide mt-0.5 hidden sm:block">{chip.label}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className={`${DASH_ACTIONS_ROW} md:hidden pt-1`}>
            {actions}
          </div>
        </div>

        <div className="flex flex-col items-center md:items-end gap-2.5 md:gap-3 shrink-0">
          <div className="relative">
            <div className="w-14 h-14 md:w-[5.25rem] md:h-[5.25rem] rounded-sm border-2 border-white/40 bg-white/15 overflow-hidden shadow-lg flex items-center justify-center backdrop-blur-sm">
              {user?.profile_picture ? (
                <img src={user.profile_picture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-base md:text-2xl font-bold text-white">{initials}</span>
              )}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 md:w-3 md:h-3 bg-emerald-400 border-2 border-violet-900 shadow-sm" />
          </div>
          <div className={`hidden md:flex ${DASH_ACTIONS_ROW}`}>
            {actions}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, sub, icon, color = 'violet', onClick, badge }) => {
  const themes = {
    violet: 'text-violet-700 bg-violet-50 border-violet-200',
    blue:   'text-blue-700 bg-blue-50 border-blue-200',
    emerald:'text-emerald-700 bg-emerald-50 border-emerald-200',
    rose:   'text-rose-700 bg-rose-50 border-rose-200',
    amber:  'text-amber-700 bg-amber-50 border-amber-200',
    indigo: 'text-indigo-700 bg-indigo-50 border-indigo-200',
  };

  return (
    <div
      onClick={onClick}
      className={`group ${DASH_PANEL} p-2.5 md:p-5 transition-all hover:border-violet-300 hover:shadow-[0_2px_8px_rgba(91,33,182,0.1),0_6px_16px_rgba(91,33,182,0.06)] flex flex-col justify-between min-h-[72px] md:min-h-[132px] ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className={`w-7 h-7 md:w-10 md:h-10 rounded-sm flex items-center justify-center border ${themes[color]}`}>
          {React.cloneElement(icon, { className: 'w-3.5 h-3.5 md:w-5 md:h-5' })}
        </div>
        {badge > 0 && (
          <span className="px-1.5 py-0.5 bg-rose-100 border border-rose-200 text-rose-700 text-[9px] md:text-[10px] font-bold uppercase tracking-wide">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-2 md:mt-4">
        <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-0.5 md:mb-1 truncate">{label}</p>
        <h3 className="text-base md:text-2xl font-bold text-slate-900 tracking-tight leading-none truncate">
          {value ?? '—'}
        </h3>
        {sub && <p className="text-[9px] md:text-[10px] font-medium text-slate-500 mt-1 uppercase tracking-wide truncate">{sub}</p>}
      </div>
    </div>
  );
};

const LatestMessagesWidget = ({ messages, onOpenChat }) => {
  return (
    <div className={`${DASH_PANEL} p-3 md:p-4 flex flex-col h-full`}>
      <div className="flex items-center justify-between mb-2 md:mb-3 shrink-0 gap-2">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 shrink-0 ${DASH_ICON_BOX}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">Latest Messages</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Communication hub</p>
          </div>
        </div>
        <button onClick={onOpenChat}
          className={DASH_ICON_BTN}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5H19M19 5V11M19 5L5 19M5 19H11M5 19V13" /></svg>
        </button>
      </div>
      <div className="space-y-2 flex-1 overflow-y-auto scrollbar-none">
        {messages?.map(m => (
          <div key={m.id} className="flex gap-3 p-2.5 border border-violet-100 bg-violet-50/50 hover:bg-white hover:border-violet-200 hover:shadow-sm transition-all cursor-pointer group/msg" onClick={onOpenChat}>
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-sm bg-white flex items-center justify-center text-slate-600 font-bold text-xs border border-slate-200 overflow-hidden">
                {m.sender_profile_picture
                  ? <img src={m.sender_profile_picture} alt="" className="w-full h-full object-cover" />
                  : m.sender ? m.sender[0].toUpperCase() : '?'}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex justify-between items-center gap-2">
                <h4 className="text-xs font-black text-slate-800 truncate group-hover/msg:text-violet-600 transition-colors">{m.sender || 'Unknown'}</h4>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter shrink-0 bg-slate-100 px-1.5 py-0.5 rounded-sm">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 line-clamp-1 mt-1 font-bold tracking-tight">{m.content}</p>
            </div>
          </div>
        ))}
        {!messages?.length && (
          <div className="flex flex-col items-center justify-center py-8 opacity-40">
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No recent messages</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── TODAY'S SCHEDULE WIDGET ─────────────────────────────────────────────────

const TodayScheduleWidget = ({ role }) => {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/schedules/today/')
      .then(r => setSchedule(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  // Highlight the currently active period
  const toMinutes = (timeStr) => {
    if (!timeStr) return 0;
    // Handle both "09:00 AM" and "9:00 AM" formats
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 0;
    let [_, h, m, period] = match;
    h = parseInt(h);
    m = parseInt(m);
    if (period.toUpperCase() === 'PM' && h !== 12) h += 12;
    if (period.toUpperCase() === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  };
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  
  const currentIdx = schedule.findIndex(s => {
    const start = toMinutes(s.time_slot_detail?.start_time_display);
    const end   = toMinutes(s.time_slot_detail?.end_time_display);
    return nowMinutes >= start && nowMinutes < end;
  });

  const nextClass = schedule.find((s, idx) => {
    const start = toMinutes(s.time_slot_detail?.start_time_display);
    return nowMinutes < start;
  });

  const getCountdown = (startTimeStr) => {
    if (!startTimeStr) return null;
    const startMins = toMinutes(startTimeStr);
    const diff = startMins - nowMinutes;
    if (diff <= 0) return null;
    if (diff < 60) return `${diff}m left`;
    return `${Math.floor(diff / 60)}h ${diff % 60}m`;
  };

  return (
    <div className={`${DASH_PANEL} p-3 md:p-5 flex flex-col h-full`}>
      <div className="flex items-center justify-between mb-3 md:mb-4 shrink-0 gap-2">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 shrink-0 ${DASH_ICON_BOX}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">Today's Schedule</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{todayLabel}</p>
          </div>
        </div>
            <button
              onClick={() => navigate('/schedule')}
              className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-sm border border-violet-300 bg-white text-[10px] font-bold text-violet-800 uppercase tracking-wide hover:bg-violet-700 hover:text-white hover:border-violet-700 transition-colors active:scale-95"
            >
          View Full
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-16 rounded-lg bg-slate-50 animate-pulse border border-slate-100/50" />)}
          </div>
        ) : schedule.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full bg-slate-50/50 rounded-lg border border-dashed border-slate-200 p-6 text-center">
            <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center mb-3 shadow-sm">
              <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">No classes scheduled</p>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Enjoy your free time!</p>
          </div>
        ) : (
          <div className="space-y-2.5 h-full overflow-y-auto pr-1 -mr-1 scrollbar-none pb-2">
            {schedule.map((s, idx) => {
              const isCurrent = idx === currentIdx;
              const isPast    = currentIdx !== -1 && idx < currentIdx;
              return (
                <div key={s.id} className={`flex items-center gap-4 px-3 py-3 border transition-colors group/item ${
                  isCurrent
                    ? 'bg-violet-700 border-violet-700 text-white'
                    : isPast
                    ? 'bg-violet-50/40 border-violet-100 opacity-60'
                    : 'bg-white border-violet-200 hover:border-violet-300 hover:shadow-sm'
                }`}>
                  <div className="text-center min-w-[50px] shrink-0">
                    <p className={`text-xs font-bold leading-none ${isCurrent ? 'text-white' : 'text-slate-700'}`}>
                      {s.time_slot_detail?.start_time_display}
                    </p>
                    <p className={`text-xs font-medium mt-1 ${isCurrent ? 'text-slate-300' : 'text-slate-500'}`}>
                      {s.time_slot_detail?.end_time_display}
                    </p>
                  </div>
                  
                  <div className={`w-px h-8 shrink-0 ${isCurrent ? 'bg-violet-400' : 'bg-violet-200'}`} />
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold truncate ${isCurrent ? 'text-white' : 'text-slate-800'}`}>
                      {s.classroom_detail?.name}
                    </p>
                    <p className={`text-[10px] font-medium mt-0.5 truncate uppercase tracking-wide ${isCurrent ? 'text-slate-300' : 'text-slate-500'}`}>
                      {s.subject_detail?.name}
                    </p>
                  </div>

                  {isCurrent ? (
                    <div className="flex items-center justify-center w-2 h-2 shrink-0">
                      <div className="w-2 h-2 bg-emerald-400" />
                    </div>
                  ) : (
                    !isPast && s === nextClass && (
                      <div className="px-2 py-0.5 border border-violet-200 bg-violet-50 text-[10px] font-bold text-violet-700 uppercase tracking-wide shrink-0">
                        In {getCountdown(s.time_slot_detail?.start_time_display)}
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const DashboardQuickActions = ({ title, items, navigate }) => (
  <div className={`${DASH_PANEL} p-4 md:p-5`}>
    <h3 className="text-[10px] font-bold uppercase tracking-wide text-violet-700 border-b border-violet-200 pb-2 mb-3">{title}</h3>
    <div className="grid grid-cols-4 gap-2">
      {items.map((a) => (
        <button
          key={a.path}
          type="button"
          onClick={() => navigate(a.path)}
          className="flex flex-col items-center justify-center gap-1.5 p-2 min-h-[72px] border border-violet-200 bg-violet-50/60 hover:bg-white hover:border-violet-400 hover:text-violet-800 rounded-sm transition-colors"
        >
          <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={a.icon} />
          </svg>
          <span className="text-[9px] font-bold text-violet-700 uppercase tracking-wide text-center leading-tight">{a.label}</span>
        </button>
      ))}
    </div>
  </div>
);

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────

const AdminView = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [distView, setDistView] = useState('general_average');

  useEffect(() => {
    const academicYear = localStorage.getItem('knhs_academic_year') || getCurrentAcademicYear();
    api.get(`/admin/stats/?academic_year=${academicYear}`)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) return <Spinner />;

  const dist = distView === 'general_average' ? data?.general_average : data?.all_subjects;
  const gradeData = dist?.counts || [];
  const attendanceTrends = data?.dashboard?.charts?.attendance_trends || [];
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const COLORS = ['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#6d28d9'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="space-y-3 md:space-y-4 page-bottom-safe max-w-[1600px] mx-auto px-2 py-2 md:px-6 md:py-6"
    >
      <WelcomeBanner
        user={user}
        today={today}
        stats={data}
        subtitle="System Administrator • Portal Management"
        actions={
          <div className={DASH_ACTIONS_ROW}>
            <button
              onClick={() => navigate('/announcements')}
              className={BANNER_BTN_SECONDARY}
            >
              Post Announcement
            </button>
            {data?.pending_approvals > 0 && (
              <button
                onClick={() => navigate('/account-approvals')}
                className={BANNER_BTN_PRIMARY}
              >
                Approvals ({data.pending_approvals})
              </button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2 md:gap-2.5">
        <StatCard label="Total Students" value={data?.total_students} sub="Enrolled" color="blue" onClick={() => navigate('/student-management')} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} />
        <StatCard label="Faculty" value={data?.total_teachers} sub="Verified" color="emerald" onClick={() => navigate('/teachers')} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
        <StatCard label="Classrooms" value={data?.total_classes} sub="Sections" color="violet" onClick={() => navigate('/class-management')} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} />
        <StatCard label="Announcements" value={data?.total_announcements} sub="Live" color="amber" onClick={() => navigate('/announcements')} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>} />
        <StatCard label="Active Users" value={data?.active_users} sub="Realtime" color="indigo" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} />
        <StatCard label="Attendance" value={`${data?.today_rate || 0}%`} sub="Today's Rate" color={data?.today_rate >= 75 ? 'emerald' : 'rose'} onClick={() => navigate('/attendance')} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4 overflow-hidden">
        {/* Attendance Trends */}
        <div className={`lg:col-span-8 ${DASH_PANEL} p-3 md:p-4 overflow-hidden flex flex-col min-h-[220px] md:min-h-0`}>
          <div className="flex items-center justify-between mb-3 shrink-0">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">Attendance Trends</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Last 30 Days · Presence Rate</p>
            </div>
            <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <span className="w-2 h-2 bg-violet-600" /> Rate (%)
            </span>
          </div>
          <div className="flex-1 min-h-[180px] sm:min-h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceTrends} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false}
                  tick={{ fontSize: 9, fontWeight: 800, fill: '#94a3b8' }} dy={8}
                  tickFormatter={str => { const d = new Date(str); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 800, fill: '#94a3b8' }} unit="%" dx={-3} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', padding: '10px' }}
                  labelStyle={{ fontWeight: 900, color: '#1e293b', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}
                  itemStyle={{ fontWeight: 800, fontSize: '11px', color: '#8b5cf6' }}
                />
                <Area type="monotone" dataKey="rate" stroke={CHART_STROKE} strokeWidth={2} fill={CHART_FILL} fillOpacity={0.9} animationDuration={1200} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grade Distribution */}
        <div className={`lg:col-span-4 ${DASH_PANEL} p-3 md:p-4 flex flex-col min-h-[280px] md:min-h-0`}>
          <div className="flex items-center justify-between mb-3 shrink-0 gap-2">
            <div className="min-w-0">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">Grade Analysis</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{distView === 'general_average' ? 'General Average' : 'All Subjects'}</p>
            </div>
            <button onClick={() => setDistView(distView === 'general_average' ? 'all_subjects' : 'general_average')}
              className={`${DASH_ICON_BTN} text-violet-600 hover:text-white`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
          </div>
          <div className="flex-1 flex flex-col justify-between min-h-[200px]">
            <div className="h-36 relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={gradeData} cx="50%" cy="50%" innerRadius={45} outerRadius={65}
                    paddingAngle={6} dataKey="value" animationDuration={1200}>
                    {gradeData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 900, fontSize: '10px', textTransform: 'uppercase' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-base font-black text-slate-900 leading-none">{dist?.total_count || 0}</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">
                  {distView === 'general_average' ? 'Students' : 'Entries'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 px-1">
              {gradeData.map((item, index) => {
                const total = gradeData.reduce((sum, d) => sum + d.value, 0);
                const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
                return (
                  <div key={item.name} className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest truncate leading-none">{item.name}</span>
                    </div>
                    <div className="flex items-baseline gap-1 pl-3.5">
                      <span className="text-xs font-black text-slate-900 leading-none">{percentage}%</span>
                      <span className="text-[9px] font-bold text-slate-400 leading-none">({item.value})</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {/* Recent Announcements */}
        <div className={`${DASH_PANEL} p-3 md:p-4 flex flex-col min-h-[200px]`}>
          <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">Recent Announcements</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">School-wide updates</p>
            </div>
            <Link to="/announcements" className={DASH_ICON_BTN}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            </Link>
          </div>
          <div className="space-y-2 flex-1 overflow-y-auto scrollbar-none">
            {data?.recent_announcements?.map(a => (
              <div key={a.id} className="group flex gap-3 p-2.5 border border-violet-100 bg-violet-50/50 hover:bg-white hover:border-violet-200 hover:shadow-sm transition-all cursor-pointer">
                <div className="shrink-0 w-9 h-9 rounded-sm bg-white border border-violet-200 flex items-center justify-center text-violet-800 font-bold text-xs group-hover:bg-violet-700 group-hover:text-white group-hover:border-violet-700 transition-colors">
                  {new Date(a.created_at).getDate()}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{a.title}</h4>
                  <div className="flex items-center gap-1.5 mt-1">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest truncate">{a.author_name}</p>
                    <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0" />
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest shrink-0">
                      {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Latest Messages */}
        <LatestMessagesWidget messages={data?.latest_messages} onOpenChat={() => navigate('/messages')} />

        {/* System Activity */}
        <div className={`${DASH_PANEL} p-4 flex flex-col`}>
          <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">System Activity</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Audit logs summary</p>
            </div>
            <Link to="/audit-logs" className={DASH_ICON_BTN}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </Link>
          </div>
          <div className="space-y-2 flex-1 overflow-y-auto scrollbar-none">
            {data?.widgets?.recent_activity?.map(log => (
              <div key={log.id} className="flex items-start gap-3 p-2.5 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors group">
                <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 transition-transform group-hover:scale-125 ${
                  log.action === 'login'  ? 'bg-emerald-500' :
                  log.action === 'delete' ? 'bg-rose-500'    :
                  log.action === 'create' ? 'bg-blue-500'    : 'bg-amber-500'
                }`} />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 leading-snug line-clamp-2">
                    <span className="text-slate-800 font-bold">{log.user}</span>{' '}
                    <span className="text-slate-500">{log.description}</span>
                  </p>
                  <p className="text-[10px] text-slate-400 font-black mt-1 uppercase tracking-widest">
                    {new Date(log.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {!data?.widgets?.recent_activity?.length && (
              <div className="flex flex-col items-center justify-center py-8 opacity-40">
                <svg className="w-7 h-7 text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── TEACHER DASHBOARD ───────────────────────────────────────────────────────

const TeacherView = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todayAttendance, setTodayAttendance] = useState({}); // { classroomId: bool }

  useEffect(() => {
    const today = getLocalDateStr();
    Promise.all([
      api.get('/teacher/stats/'),
      api.get('/classrooms/'),
    ]).then(([statsRes, clsRes]) => {
      setData(statsRes.data);
      const cls = clsRes.data || [];
      setClassrooms(cls);
      // Check which classrooms have attendance marked today
      Promise.all(
        cls.map(c =>
          api.get(`/attendance/?classroom=${c.id}&date=${today}`)
            .then(r => ({ id: c.id, marked: Array.isArray(r.data) && r.data.length > 0 }))
            .catch(() => ({ id: c.id, marked: false }))
        )
      ).then(results => {
        const map = {};
        results.forEach(r => { map[r.id] = r.marked; });
        setTodayAttendance(map);
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const unmarkedCount = classrooms.filter(c => !todayAttendance[c.id]).length;

  const statusChips = [
    { label: 'Sections', value: data?.total_classes || 0, color: 'violet' },
    { label: 'Students', value: data?.total_students || 0, color: 'blue' },
    { label: 'Pending', value: data?.pending_grades || 0, color: 'amber' },
    { label: 'Attendance', value: `${data?.attendance_rate || 0}%`, color: 'emerald' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="space-y-3 md:space-y-4 page-bottom-safe max-w-[1600px] mx-auto px-2 py-2 md:px-6 md:py-6"
    >
      <WelcomeBanner
        user={user}
        today={todayStr}
        statusChips={statusChips}
        actions={
          <div className={DASH_ACTIONS_ROW}>
            <button type="button" onClick={() => navigate('/announcements')} className={BANNER_BTN_SECONDARY}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
              Announce
            </button>
            <button type="button" onClick={() => navigate('/grade-input')} className={BANNER_BTN_PRIMARY}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Grades
            </button>
          </div>
        }
      />
      {classrooms.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className={`${DASH_PANEL} px-3 py-2.5 md:px-4 md:py-3 flex items-center justify-between gap-3 ${
            unmarkedCount === 0
              ? 'border-emerald-300 bg-emerald-50'
              : 'border-amber-300 bg-amber-50'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className={`w-2 h-2 rounded-full shrink-0 ${unmarkedCount === 0 ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
            <div>
              <p className={`text-xs font-black uppercase tracking-widest ${unmarkedCount === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                {unmarkedCount === 0
                  ? 'All attendance marked for today'
                  : `${unmarkedCount} class${unmarkedCount > 1 ? 'es' : ''} without attendance today`}
              </p>
              {unmarkedCount > 0 && (
                <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mt-0.5">
                  {classrooms.filter(c => !todayAttendance[c.id]).map(c => c.name).join(', ')}
                </p>
              )}
            </div>
          </div>
          {unmarkedCount > 0 && (
            <button
              onClick={() => navigate('/attendance')}
              className="shrink-0 inline-flex items-center justify-center px-3 py-1.5 rounded-sm bg-violet-700 text-white text-[10px] font-bold uppercase tracking-wide hover:bg-violet-800 transition-colors active:scale-95"
            >
              Mark Now
            </button>
          )}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-5">
        {/* ── MAIN CONTENT (Left - 8 Cols) ── */}
        <div className="lg:col-span-8 space-y-3 md:space-y-5">
          
          {/* Today's Classes & Sections Combined */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className={`${DASH_PANEL} overflow-hidden flex flex-col lg:h-[420px] min-h-[300px]`}
          >
            <div className={`px-3 md:px-5 py-3 md:py-4 ${DASH_PANEL_HEADER} flex flex-col sm:flex-row sm:items-center justify-between gap-2 md:gap-3 shrink-0`}>
              <div className="flex items-center gap-2 md:gap-3.5">
                <div className="w-8 h-8 rounded-sm bg-violet-700 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-black text-slate-900 tracking-tight">Academic Overview</h3>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-0.5">Active teaching sections</p>
                </div>
              </div>
              <Link to="/my-classes" className={DASH_BTN_SECONDARY}>
                Manage Classes
              </Link>
            </div>
            
            <div className="flex-1 overflow-x-auto overflow-y-auto scrollbar-none">
              <table className="w-full text-left border-separate border-spacing-0 min-w-[480px]">
                <thead className="bg-violet-50/80 border-b border-violet-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 md:px-5 py-2 md:py-3 text-xs font-black text-slate-400 uppercase tracking-[0.15em]">Section</th>
                    <th className="px-3 md:px-5 py-2 md:py-3 text-xs font-black text-slate-400 uppercase tracking-[0.15em]">Subject</th>
                    <th className="px-3 md:px-5 py-2 md:py-3 text-xs font-black text-slate-400 uppercase tracking-[0.15em]">Today's Attendance</th>
                    <th className="px-3 md:px-5 py-2 md:py-3 text-xs font-black text-slate-400 uppercase tracking-[0.15em] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {classrooms.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-8 py-16 text-center">
                        <div className="flex flex-col items-center justify-center gap-4 opacity-40">
                          <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center">
                            <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                          </div>
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No classes assigned yet</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    classrooms.map(c => {
                      const marked = todayAttendance[c.id];
                      return (
                        <tr key={c.id} className="hover:bg-violet-50/60 transition-colors group cursor-pointer border-b border-violet-100 last:border-0">
                          <td className="px-3 md:px-5 py-2.5 md:py-3">
                            <div className="flex items-center gap-2 md:gap-4">
                              <div className="w-8 h-8 md:w-10 md:h-10 rounded-sm bg-violet-50 text-violet-800 border border-violet-200 flex items-center justify-center font-bold text-xs md:text-sm shrink-0">
                                {c.name?.match(/\d+/)?.[0] || 'C'}
                              </div>
                              <div>
                                <span className="text-xs md:text-sm font-bold text-slate-800 tracking-tight block">{c.name}</span>
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-0.5">Section</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 md:px-5 py-2.5 md:py-3">
                            <p className="text-xs md:text-sm font-semibold text-slate-700">{c.subject_name || 'General'}</p>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-0.5">{c.subject_code || 'GEN-101'}</p>
                          </td>
                          <td className="px-3 md:px-5 py-2.5 md:py-3">
                            {marked === undefined ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
                                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Checking</span>
                              </div>
                            ) : marked ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Marked</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                <span className="text-xs font-black text-amber-600 uppercase tracking-widest">Pending</span>
                              </div>
                            )}
                          </td>
                          <td className="px-3 md:px-5 py-2.5 md:py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5 md:gap-2">
                              <button onClick={() => navigate('/attendance', { state: { classroomId: c.id } })} title="Mark Attendance" className="p-1.5 md:p-2.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white rounded transition-all shadow-sm active:scale-90 border border-emerald-100"><svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8l2 2 4-4" /></svg></button>
                              <button onClick={() => navigate('/grade-input', { state: { classroomId: c.id } })} title="Input Grades" className="p-1.5 md:p-2.5 text-violet-700 bg-violet-50 hover:bg-violet-700 hover:text-white rounded-sm transition-colors active:scale-[0.98] border border-violet-200"><svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Recent Activity Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className={`${DASH_PANEL} p-3 md:p-5 flex flex-col lg:h-[520px]`}
          >
            <div className="flex items-center justify-between mb-4 md:mb-5 shrink-0 pb-3 border-b border-violet-200">
              <div className="flex items-center gap-2 md:gap-3.5">
                <div className={`w-8 h-8 shrink-0 ${DASH_ICON_BOX}`}>
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-black text-slate-900 tracking-tight">Recent Activity</h3>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-0.5">Your latest school interactions</p>
                </div>
              </div>
              <div className="px-2 py-1 border border-violet-200 bg-violet-50 text-[10px] font-bold text-violet-700 uppercase tracking-wide">
                Activity
              </div>
            </div>
            
            <div className="relative space-y-3 md:space-y-6 flex-1 overflow-y-auto pr-2 scrollbar-none">
              <div className="absolute left-[15px] md:left-[19px] top-2 bottom-2 w-0.5 bg-violet-100" />
              <AnimatePresence>
                {data?.recent_activities?.length ? data.recent_activities.map((act, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="relative flex items-center gap-3 md:gap-6 group"
                  >
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-sm bg-white border border-violet-200 shadow-sm flex items-center justify-center shrink-0 z-10 group-hover:border-violet-400 transition-colors">
                      <TeacherActivityIcon type={act.type} />
                    </div>
                    <div className="flex-1 bg-violet-50/50 border border-violet-100 p-2.5 md:p-4 group-hover:bg-white group-hover:border-violet-200 group-hover:shadow-sm transition-all">
                      <div className="flex justify-between items-start mb-0.5">
                        <p className="text-xs md:text-sm font-semibold text-slate-800 leading-snug">{act.message}</p>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2 shrink-0">{act.time}</span>
                      </div>
                    </div>
                  </motion.div>
                )) : (
                  <div className="flex flex-col items-center justify-center py-16 opacity-40">
                    <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center mb-4">
                      <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No recent activities</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* ── SIDEBAR CONTENT (Right - 4 Cols) ── */}
        <div className="lg:col-span-4 space-y-3 md:space-y-4">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="lg:h-[420px]"
          >
            <TodayScheduleWidget role="teacher" />
          </motion.div>

          <DashboardQuickActions
            title="Quick actions"
            navigate={navigate}
            items={[
              { label: 'Attendance', path: '/attendance', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
              { label: 'Grades', path: '/grade-input', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
              { label: 'Analytics', path: '/analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
              { label: 'Materials', path: '/materials', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
            ]}
          />

          {/* Messages & Status Sidebar */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="space-y-3 md:space-y-5"
          >
            <div className="lg:h-[260px]">
              <LatestMessagesWidget messages={data?.latest_messages} onOpenChat={() => navigate('/messages')} />
            </div>
            
            {/* System Status */}
            <div className={`${DASH_PANEL} p-3 md:p-4 flex items-center justify-between shrink-0`}>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-violet-600" />
                <span className="text-[10px] font-bold text-violet-800 uppercase tracking-wide">System online</span>
              </div>
              <span className="text-[10px] font-semibold text-violet-400 uppercase tracking-wide">v2.4.0</span>
            </div>
          </motion.div>

        </div>
      </div>
    </motion.div>
  );
};

const StudentView = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/grades/my_grades/').catch(() => ({ data: [] })),
      api.get('/attendance/').catch(() => ({ data: [] })),
      api.get('/student/dashboard/stats/').catch(() => ({ data: {} })),
    ]).then(([gradeRes, attRes, statsRes]) => {
      setGrades(gradeRes.data);
      setAttendance(attRes.data);
      setStats(statsRes.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const validAtt = Array.isArray(attendance) ? attendance.filter(r => !isWeekend(r.date)) : [];
  
  const presentCount = validAtt.filter(r => r.status === 'present').length;
  const lateCount = validAtt.filter(r => r.status === 'late').length;
  const absentCount = validAtt.filter(r => r.status === 'absent').length;
  const totalPresentForRate = validAtt.filter(r => ['present', 'late'].includes(r.status)).length;
  const attRate = validAtt.length > 0 ? Math.round((totalPresentForRate / validAtt.length) * 100) : 0;

  // Streak Calculation — skips weekends, stops at first absent weekday
  const { streak, hasData: hasAttData } = computeStreak(attendance);

  // Check if today's attendance is assigned (teacher has marked it)
  const todayStr = getLocalDateStr();
  const todayRecord = Array.isArray(attendance) ? attendance.find(r => r.date === todayStr) : null;
  const todayIsWeekend = isWeekend(todayStr);
  const todayAttStatus = todayIsWeekend ? 'weekend' : todayRecord ? todayRecord.status : 'unassigned';

  const finalGrades = Array.isArray(grades) ? grades.filter(g => g.grade_type === 'final_grade' && (g.transmuted_score != null || g.raw_score != null)) : [];
  const overallAvg = finalGrades.length > 0
    ? (finalGrades.reduce((s, g) => s + parseFloat(g.transmuted_score || g.raw_score || 0), 0) / finalGrades.length).toFixed(1)
    : null;

  const chartData = finalGrades.map(g => ({
    name: g.subject_name?.split(' ')[0] || 'Subj',
    grade: parseFloat(g.transmuted_score || g.raw_score || 0),
    full_name: g.subject_name
  })).slice(0, 6);

  const radialData = [
    { name: 'Attendance', value: attRate, fill: '#8b5cf6' },
    { name: 'Remaining', value: 100 - attRate, fill: '#f1f5f9' }
  ];

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const todayStatusLabel =
    todayIsWeekend ? 'Weekend' :
    !todayRecord ? 'Not Marked' :
    todayRecord.status.charAt(0).toUpperCase() + todayRecord.status.slice(1);

  const todayStatusColor =
    todayIsWeekend ? 'slate' :
    !todayRecord ? 'amber' :
    todayRecord.status === 'present' ? 'emerald' :
    todayRecord.status === 'late' ? 'yellow' :
    todayRecord.status === 'absent' ? 'rose' : 'blue';

  const statusChips = [
    { label: 'Grade Level', value: user?.profile?.grade_level || 'N/A', color: 'violet' },
    { label: 'Attendance', value: validAtt.length > 0 ? `${attRate}%` : '—', color: 'emerald' },
    { label: 'Avg Grade', value: overallAvg || '—', color: 'indigo' },
    { label: 'Today', value: todayStatusLabel, color: todayStatusColor },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="space-y-3 md:space-y-4 page-bottom-safe max-w-[1600px] mx-auto px-2 py-2 md:px-6 md:py-6"
    >
      <WelcomeBanner
        user={user}
        today={today}
        statusChips={statusChips}
        actions={
          <div className={DASH_ACTIONS_ROW}>
            <button type="button" onClick={() => navigate('/materials')} className={BANNER_BTN_SECONDARY}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              Materials
            </button>
            <button type="button" onClick={() => navigate('/student-grades')} className={BANNER_BTN_PRIMARY}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              My Grades
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-5">
        {/* ── MAIN CONTENT (Left - 8 Cols) ── */}
        <div className="lg:col-span-8 space-y-3 md:space-y-5">
          
          {/* Performance Analytics & Attendance Streak */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5">
            {/* Grade Analysis Chart */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className={`${DASH_PANEL} p-3 md:p-5 flex flex-col h-[240px] md:h-[280px]`}
            >
              <div className="flex items-center justify-between mb-3 md:mb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 md:w-8 md:h-8 ${DASH_ICON_BOX}`}>
                    <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 tracking-tight">Grade Analysis</h3>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-0.5 hidden md:block">Subject performance trend</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 w-full">
                {chartData.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-40 gap-2">
                    <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No grades yet</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 800, fill: '#94a3b8'}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 800, fill: '#94a3b8'}} domain={[70, 100]} dx={-5} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                        labelStyle={{ fontWeight: 900, color: '#1e293b', fontSize: '9px', textTransform: 'uppercase' }}
                      />
                      <Area type="monotone" dataKey="grade" stroke={CHART_STROKE} strokeWidth={2} fill={CHART_FILL} fillOpacity={0.9} animationDuration={2000} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </motion.div>

            {/* Attendance Streak Card */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className={`${DASH_PANEL} p-3 md:p-5 flex flex-col h-[240px] md:h-[280px]`}
            >
              <div className="flex items-center justify-between mb-3 md:mb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 md:w-8 md:h-8 ${DASH_ICON_BOX}`}>
                    <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 tracking-tight">Attendance</h3>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-0.5 hidden md:block">Overall streak tracker</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm md:text-lg font-black text-emerald-600 leading-none">{attRate}%</span>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-0.5">Overall</span>
                </div>
              </div>

              {/* Today's status badge */}
              <div className="mb-2 md:mb-4 shrink-0">
                {todayAttStatus === 'weekend' ? (
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 border border-slate-200">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Weekend — No class</span>
                  </div>
                ) : todayAttStatus === 'unassigned' ? (
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-amber-50 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                    <span className="text-xs font-black text-amber-600 uppercase tracking-widest">Today not marked yet</span>
                  </div>
                ) : todayAttStatus === 'present' ? (
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-50 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Present today</span>
                  </div>
                ) : todayAttStatus === 'late' ? (
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-yellow-50 border border-yellow-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0" />
                    <span className="text-xs font-black text-yellow-600 uppercase tracking-widest">Late today</span>
                  </div>
                ) : todayAttStatus === 'absent' ? (
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-red-50 border border-red-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                    <span className="text-xs font-black text-red-600 uppercase tracking-widest">Absent today</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-blue-50 border border-blue-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                    <span className="text-xs font-black text-blue-600 uppercase tracking-widest capitalize">{todayAttStatus} today</span>
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col items-center justify-center relative">
                {!hasAttData ? (
                  <div className="flex flex-col items-center justify-center gap-2 opacity-50">
                    <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest text-center">No attendance records yet</p>
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={radialData}
                          innerRadius={50}
                          outerRadius={70}
                          startAngle={90}
                          endAngle={450}
                          dataKey="value"
                          stroke="none"
                        >
                          {radialData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} cornerRadius={8} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xl md:text-4xl font-black text-slate-900">{streak}</span>
                      <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5">Day Streak</span>
                      <div className="flex gap-1 mt-2 md:mt-4">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className={`w-1 md:w-1.5 h-1 md:h-1.5 rounded-full ${i <= streak ? 'bg-emerald-500 animate-pulse' : 'bg-slate-200'}`} />
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>

          {/* Academic Records Table */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className={`${DASH_PANEL} overflow-hidden flex flex-col lg:h-[480px]`}
          >
            <div className={`px-3 md:px-5 py-3 md:py-4 ${DASH_PANEL_HEADER} flex flex-wrap items-center justify-between gap-2 shrink-0`}>
              <div className="flex items-center gap-2 md:gap-3.5">
                <div className="w-8 h-8 rounded-sm bg-violet-700 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-black text-slate-900 tracking-tight">Subject Performance</h3>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-0.5">Final grade breakdown</p>
                </div>
              </div>
              <Link to="/student-grades" className={DASH_BTN_SECONDARY}>
                View All
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-none">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead className="bg-violet-50/80 border-b border-violet-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 md:px-5 py-2 md:py-3 text-xs font-black text-slate-400 uppercase tracking-[0.15em]">Subject</th>
                    <th className="hidden sm:table-cell px-3 md:px-5 py-2 md:py-3 text-xs font-black text-slate-400 uppercase tracking-[0.15em]">Instructor</th>
                    <th className="px-3 md:px-5 py-2 md:py-3 text-xs font-black text-slate-400 uppercase tracking-[0.15em]">Grade</th>
                    <th className="px-3 md:px-5 py-2 md:py-3 text-xs font-black text-slate-400 uppercase tracking-[0.15em] text-right">Mastery</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {finalGrades.length === 0 ? (
                    <tr><td colSpan="4" className="px-8 py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-4 opacity-40">
                        <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center">
                          <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        </div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No grades posted yet</p>
                      </div>
                    </td></tr>
                  ) : finalGrades.map(g => (
                    <tr key={g.id} className="hover:bg-violet-50/60 transition-colors group cursor-pointer">
                      <td className="px-3 md:px-5 py-2.5 md:py-3">
                        <div className="flex items-center gap-2 md:gap-4">
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-sm bg-violet-50 text-violet-800 border border-violet-200 flex items-center justify-center font-bold text-xs md:text-sm shrink-0">
                            {g.subject_name?.[0] || 'S'}
                          </div>
                          <span className="text-xs md:text-sm font-bold text-slate-800 tracking-tight">{g.subject_name}</span>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-3 md:px-5 py-2.5 md:py-3">
                        <p className="text-xs md:text-sm font-semibold text-slate-600">{g.teacher_name || 'Instructor'}</p>
                      </td>
                      <td className="px-3 md:px-5 py-2.5 md:py-3">
                        <span className={`text-sm md:text-lg font-black ${(g.transmuted_score || g.raw_score) >= 90 ? 'text-emerald-600' : (g.transmuted_score || g.raw_score) >= 75 ? 'text-violet-600' : 'text-rose-600'}`}>
                          {g.transmuted_score || g.raw_score}
                        </span>
                      </td>
                      <td className="px-3 md:px-5 py-2.5 md:py-3 text-right">
                        <div className="w-16 md:w-28 ml-auto">
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${g.transmuted_score || g.raw_score}%` }}
                              transition={{ duration: 1.5, ease: "easeOut" }}
                              className={`h-full rounded-full ${(g.transmuted_score || g.raw_score) >= 90 ? 'bg-emerald-500' : (g.transmuted_score || g.raw_score) >= 75 ? 'bg-violet-500' : 'bg-rose-500'}`}
                            />
                          </div>
                          <p className="text-xs font-semibold text-slate-400 mt-1 text-right">{g.transmuted_score || g.raw_score}%</p>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        {/* ── SIDEBAR CONTENT (Right - 4 Cols) ── */}
        <div className="lg:col-span-4 space-y-3 md:space-y-4">
          
          <DashboardQuickActions
            title="Student workspace"
            navigate={navigate}
            items={[
              { label: 'My Grades', path: '/student-grades', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
              { label: 'Schedule', path: '/schedule', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
              { label: 'Materials', path: '/materials', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
              { label: 'Profile', path: '/profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
            ]}
          />

          {/* Combined Widgets */}
          <div className="space-y-3 md:space-y-5">
            <div className="lg:h-[260px]">
              <TodayScheduleWidget role="student" />
            </div>
            <div className="lg:h-[260px]">
              <LatestMessagesWidget messages={stats?.latest_messages} onOpenChat={() => navigate('/messages')} />
            </div>
            <div className={`${DASH_PANEL} p-3 md:p-4 flex items-center justify-between shrink-0`}>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-violet-600" />
                <span className="text-[10px] font-bold text-violet-800 uppercase tracking-wide">Portal connected</span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">v2.4.0</span>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
};

// ─── ROOT COMPONENT ───────────────────────────────────────────────────────────

const Dashboard = () => {
  const { user } = useAuth();
  
  if (user?.role === 'admin')   return <AdminView />;
  if (user?.role === 'teacher') return <TeacherView />;
  if (user?.role === 'parent')  return <ParentRedirect />;
  return <StudentView />;
};

// Parents are redirected by ProtectedRoute, but handle the edge case here too
const ParentRedirect = () => {
  const navigate = useNavigate();
  useEffect(() => { navigate('/parent-dashboard', { replace: true }); }, [navigate]);
  return null;
};

export default Dashboard;
