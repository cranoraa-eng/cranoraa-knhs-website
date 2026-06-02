import { useAuth } from '../context/AuthContext';
import React, { useState, useEffect, useMemo, memo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { getCurrentAcademicYear } from '../utils/dateHelpers';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import StudentDashboardView from '../components/dashboard/StudentDashboardView';
import { Card, CardHeader, CardBody, CardTitle, Badge, Button, EmptyState, LoadingSpinner } from '../components/ui';
import { cn } from '../styles/designSystem';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getLocalDateStr = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
};

// Formal dashboard surface tokens — purple theme (admin / teacher / student only)
const DASH_PAGE = 'page-bottom-safe max-w-[1600px] mx-auto min-h-0 bg-violet-50/40 px-3 py-3 md:px-6 md:py-6 space-y-4 md:space-y-5';
const DASH_PANEL = 'bg-white border border-violet-200/90 shadow-[0_1px_2px_rgba(91,33,182,0.07),0_3px_10px_rgba(91,33,182,0.05)] rounded-sm transition-shadow';
const DASH_PANEL_HEADER = 'border-b border-violet-200 bg-violet-50/80';
const DASH_SECTION_LABEL = 'text-[10px] font-bold text-violet-700 uppercase tracking-wide px-0.5';
const DASH_TABLE_TH = 'px-3 md:px-5 py-2.5 text-[10px] font-bold text-violet-800/80 uppercase tracking-wide';
const DASH_LINK_BTN = 'inline-flex items-center justify-center px-2.5 py-1.5 rounded-sm border border-violet-300 bg-white text-[10px] font-bold text-violet-800 uppercase tracking-wide hover:bg-violet-700 hover:text-white hover:border-violet-700 transition-colors active:scale-[0.98]';
const DASH_LIST_ITEM = 'rounded-sm border border-violet-100 bg-violet-50/40 hover:bg-white hover:border-violet-200 hover:shadow-sm transition-all';
const DASH_BTN_PRIMARY = 'inline-flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-sm bg-violet-700 text-white text-[10px] md:text-xs font-bold uppercase tracking-wide border border-violet-800 hover:bg-violet-800 transition-colors active:scale-[0.98]';
const DASH_BTN_SECONDARY = 'inline-flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-sm bg-white text-violet-900 text-[10px] md:text-xs font-bold uppercase tracking-wide border border-violet-300 hover:bg-violet-50 hover:border-violet-400 transition-colors active:scale-[0.98]';
const DASH_ICON_BOX = 'rounded-sm bg-violet-50 text-violet-700 flex items-center justify-center border border-violet-200';
const DASH_ICON_BTN = 'inline-flex items-center justify-center p-2 rounded-sm border border-violet-200 bg-white text-violet-700 hover:bg-violet-700 hover:text-white hover:border-violet-700 transition-colors active:scale-95';
const DASH_ACTIONS_ROW = 'flex flex-wrap items-center justify-center gap-2';
const BANNER_BTN_PRIMARY = 'inline-flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-sm bg-white text-violet-900 text-[10px] md:text-xs font-bold uppercase tracking-wide border border-white shadow-sm hover:bg-violet-50 transition-colors active:scale-[0.98]';
const BANNER_BTN_SECONDARY = 'inline-flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-sm bg-violet-600/50 text-white text-[10px] md:text-xs font-bold uppercase tracking-wide border border-violet-400/70 hover:bg-violet-600/80 hover:border-violet-300 transition-colors active:scale-[0.98]';
const CHART_STROKE = '#7c3aed';
const CHART_FILL = '#ede9fe';

/** Admin grade distribution — one color per performance band */
const GRADE_CATEGORY_COLORS = {
  Outstanding: '#059669',
  'Very Satisfactory': '#2563eb',
  Satisfactory: '#7c3aed',
  'Fairly Satisfactory': '#d97706',
  'Did Not Meet': '#e11d48',
};
const GRADE_CATEGORY_FALLBACK = ['#059669', '#2563eb', '#7c3aed', '#d97706', '#e11d48'];
const GRADE_CATEGORY_LEGEND = {
  Outstanding: 'border-emerald-200 bg-emerald-50/80',
  'Very Satisfactory': 'border-blue-200 bg-blue-50/80',
  Satisfactory: 'border-violet-200 bg-violet-50/80',
  'Fairly Satisfactory': 'border-amber-200 bg-amber-50/80',
  'Did Not Meet': 'border-rose-200 bg-rose-50/80',
};

const getGradeCategoryColor = (name, index) =>
  GRADE_CATEGORY_COLORS[name] || GRADE_CATEGORY_FALLBACK[index % GRADE_CATEGORY_FALLBACK.length];

const getGradeCategoryLegendClass = (name) =>
  GRADE_CATEGORY_LEGEND[name] || 'border-slate-200 bg-slate-50/80';

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

const PanelHeader = memo(({ title, subtitle, icon, action, className = '', bordered = false, iconClassName }) => (
  <div
    className={`flex items-start justify-between gap-2 shrink-0 ${
      bordered ? `${DASH_PANEL_HEADER} px-3 md:px-5 py-3 md:py-3.5 -mx-3 md:-mx-5 -mt-3 md:-mt-5 mb-3 md:mb-4` : 'mb-3'
    } ${className}`}
  >
    <div className="flex items-center gap-2.5 min-w-0">
      {icon && <div className={`w-8 h-8 shrink-0 flex items-center justify-center ${iconClassName || DASH_ICON_BOX}`}>{icon}</div>}
      <div className="min-w-0">
        <h3 className="text-xs md:text-sm font-bold text-slate-900 tracking-tight">{title}</h3>
        {subtitle && (
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
    </div>
    {action && <div className="shrink-0 flex items-center">{action}</div>}
  </div>
));

PanelHeader.displayName = 'PanelHeader';

const DashEmptyState = memo(({ icon, title, description = '', className = '' }) => (
  <div className={`flex flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-violet-200 bg-violet-50/50 px-4 py-8 text-center ${className}`}>
    <div className={`w-11 h-11 ${DASH_ICON_BOX}`}>{icon}</div>
    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">{title}</p>
    {description && <p className="text-[10px] text-slate-500 max-w-[200px]">{description}</p>}
  </div>
));

DashEmptyState.displayName = 'DashEmptyState';

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
    <Card className={cn(
      "relative overflow-hidden border-none shadow-xl",
      theme.shell
    )}>
      {/* Decorative orbs */}
      <div className={cn("pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full", theme.orbA)} aria-hidden="true" />
      <div className={cn("pointer-events-none absolute -bottom-14 -left-8 h-44 w-44 rounded-full", theme.orbB)} aria-hidden="true" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1 bg-white/20" aria-hidden="true" />

      <CardBody className="relative z-10 p-4 md:p-6">
        <div className="flex flex-row items-start justify-between gap-4 md:gap-6">
          <div className="flex-1 space-y-2.5 md:space-y-3.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={cn("border", theme.chip)}>
                <GreetingIcon period={greeting.period} className={cn("w-3.5 h-3.5", theme.chipIcon)} />
                <span>{greeting.text}</span>
              </Badge>
              <Badge className={cn("hidden sm:inline-flex border", theme.chip)}>
                <svg className={cn("w-3 h-3", theme.chipIcon)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{today}</span>
              </Badge>
            </div>

            <div className="space-y-1 md:space-y-1.5">
              <h1 className="text-lg md:text-2xl font-black text-white tracking-tight leading-tight">
                Welcome back,{' '}
                <span className="text-white">{user?.first_name || 'User'}</span>
              </h1>
              {subtitle && (
                <p className={cn("text-xs font-bold uppercase tracking-wide text-white/90", theme.subtitle)}>{subtitle}</p>
              )}
              <p className={cn("text-sm max-w-lg leading-relaxed hidden sm:block text-white/80", theme.message)}>
                {greeting.message}
              </p>
            </div>

            {statusChips?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 md:gap-2 pt-0.5">
                {statusChips.map((chip, idx) => (
                  <div key={idx} className="flex items-center gap-2 border border-white/20 bg-white/10 px-2.5 py-1.5 md:px-3 md:py-2 backdrop-blur-[2px] rounded-lg">
                    <div className={cn("w-1.5 h-1.5 shrink-0 rounded-full", CHIP_DOT[chip.color] || 'bg-white')} />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs md:text-sm font-bold text-white leading-none">{chip.value}</span>
                      <span className="text-[10px] font-semibold text-violet-200 uppercase tracking-wide mt-0.5 hidden sm:block">{chip.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2 md:hidden pt-1">
              {actions}
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end gap-2.5 md:gap-3 shrink-0">
            <div className="relative">
              <div className="w-14 h-14 md:w-20 md:h-20 rounded-xl border-2 border-white/40 bg-white/15 overflow-hidden shadow-lg flex items-center justify-center backdrop-blur-sm">
                {user?.profile_picture ? (
                  <img src={user.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-base md:text-2xl font-bold text-white">{initials}</span>
                )}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 md:w-4 md:h-4 bg-emerald-400 rounded-full border-2 border-violet-900 shadow-sm" />
            </div>
            <div className="hidden md:flex flex-wrap gap-2">
              {actions}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

const StatCard = memo(({ label, value, sub, icon, color = 'violet', onClick, badge }) => {
  const iconThemes = {
    violet: 'bg-purple-100 text-purple-600 border-purple-200',
    blue:   'bg-blue-100 text-blue-600 border-blue-200',
    emerald:'bg-emerald-100 text-emerald-600 border-emerald-200',
    rose:   'bg-rose-100 text-rose-600 border-rose-200',
    amber:  'bg-amber-100 text-amber-600 border-amber-200',
    indigo: 'bg-indigo-100 text-indigo-600 border-indigo-200',
  };

  return (
    <Card
      interactive={!!onClick}
      onClick={onClick}
      className={cn(
        "border-l-4 border-l-purple-400 hover:border-l-purple-600 transition-all",
        onClick && "cursor-pointer"
      )}
    >
      <CardBody className="p-3 md:p-4 flex flex-col justify-between min-h-[100px] md:min-h-[120px]">
        <div className="flex items-start justify-between">
          <div className={cn(
            "w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center border",
            iconThemes[color]
          )}>
            {React.cloneElement(icon, { className: 'w-4 h-4 md:w-5 md:h-5' })}
          </div>
          {badge > 0 && (
            <Badge variant="red" size="sm">{badge}</Badge>
          )}
        </div>
        <div className="mt-3 md:mt-4">
          <p className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide truncate">
            {label}
          </p>
          <h3 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-none truncate">
            {value ?? '—'}
          </h3>
          {sub && (
            <p className="text-xs text-slate-500 mt-1 truncate">{sub}</p>
          )}
        </div>
      </CardBody>
    </Card>
  );
});

StatCard.displayName = 'StatCard';

const LatestMessagesWidget = memo(({ messages, onOpenChat }) => {
  return (
    <Card>
      <CardHeader divider>
        <div className="flex items-center justify-between">
          <CardTitle subtitle="Communication hub">Latest Messages</CardTitle>
          <Button variant="ghost" size="sm" onClick={onOpenChat}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5H19M19 5V11M19 5L5 19M5 19H11M5 19V13" />
            </svg>
          </Button>
        </div>
      </CardHeader>
      <CardBody className="space-y-2 max-h-[300px] overflow-y-auto">
        {messages?.length > 0 ? (
          messages.map(m => (
            <div 
              key={m.id} 
              className="flex gap-3 p-2.5 cursor-pointer group rounded-lg border border-slate-100 bg-slate-50/40 hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all"
              onClick={onOpenChat}
            >
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-slate-600 font-bold text-xs border border-slate-200 overflow-hidden">
                  {m.sender_profile_picture
                    ? <img src={m.sender_profile_picture} alt="" className="w-full h-full object-cover" />
                    : m.sender ? m.sender[0].toUpperCase() : '?'}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-purple-700 transition-colors">
                    {m.sender || 'Unknown'}
                  </h4>
                  <Badge variant="slate" size="sm">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 line-clamp-1 mt-1 font-medium">{m.content}</p>
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            }
            title="No recent messages"
            className="py-8"
          />
        )}
      </CardBody>
    </Card>
  );
});

LatestMessagesWidget.displayName = 'LatestMessagesWidget';

// ─── TODAY'S SCHEDULE WIDGET ─────────────────────────────────────────────────

const TodayScheduleWidget = memo(() => {
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

  const nextClass = schedule.find(() => {
    const start = toMinutes(schedule.time_slot_detail?.start_time_display);
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
    <Card className="flex flex-col h-full">
      <CardHeader divider>
        <div className="flex items-center justify-between">
          <CardTitle subtitle={todayLabel}>Today's Schedule</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/schedule')}>
            View Full
          </Button>
        </div>
      </CardHeader>

      <CardBody className="flex-1 min-h-0">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-16 rounded-lg bg-slate-50 animate-pulse border border-slate-100/50" />)}
          </div>
        ) : schedule.length === 0 ? (
          <EmptyState
            className="h-full min-h-[140px]"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="No classes scheduled"
            description="Enjoy your free time."
          />
        ) : (
          <div className="space-y-2.5 h-full overflow-y-auto pr-1 -mr-1 scrollbar-none pb-2">
            {schedule.map((s, idx) => {
              const isCurrent = idx === currentIdx;
              const isPast    = currentIdx !== -1 && idx < currentIdx;
              return (
                <div key={s.id} className={cn(
                  "flex items-center gap-4 px-3 py-3 border rounded-lg transition-colors group/item",
                  isCurrent && 'bg-violet-700 border-violet-700 text-white',
                  isPast && 'bg-violet-50/40 border-violet-100 opacity-60',
                  !isCurrent && !isPast && 'bg-white border-violet-200 hover:border-violet-300 hover:shadow-sm'
                )}>
                  <div className="text-center min-w-[50px] shrink-0">
                    <p className={cn("text-xs font-bold leading-none", isCurrent ? 'text-white' : 'text-slate-700')}>
                      {s.time_slot_detail?.start_time_display}
                    </p>
                    <p className={cn("text-xs font-medium mt-1", isCurrent ? 'text-slate-300' : 'text-slate-500')}>
                      {s.time_slot_detail?.end_time_display}
                    </p>
                  </div>
                  
                  <div className={cn("w-px h-8 shrink-0", isCurrent ? 'bg-violet-400' : 'bg-violet-200')} />
                  
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-xs font-bold truncate", isCurrent ? 'text-white' : 'text-slate-800')}>
                      {s.classroom_detail?.name}
                    </p>
                    <p className={cn("text-[10px] font-medium mt-0.5 truncate uppercase tracking-wide", isCurrent ? 'text-slate-300' : 'text-slate-500')}>
                      {s.subject_detail?.name}
                    </p>
                  </div>

                  {isCurrent ? (
                    <Badge variant="green" size="sm">Live</Badge>
                  ) : (
                    !isPast && s === nextClass && (
                      <Badge variant="purple" size="sm">
                        In {getCountdown(s.time_slot_detail?.start_time_display)}
                      </Badge>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
});

TodayScheduleWidget.displayName = 'TodayScheduleWidget';

const DashboardQuickActions = memo(({ title, items, navigate }) => (
  <Card>
    <CardHeader divider>
      <CardTitle subtitle="Shortcuts">{title}</CardTitle>
    </CardHeader>
    <CardBody>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {items.map((a) => (
          <Button
            key={a.path}
            variant="ghost"
            onClick={() => navigate(a.path)}
            className="flex flex-col items-center justify-center gap-1.5 p-2.5 min-h-[76px] h-auto"
          >
            <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={a.icon} />
            </svg>
            <span className="text-[9px] font-bold text-violet-700 uppercase tracking-wide text-center leading-tight">{a.label}</span>
          </Button>
        ))}
      </div>
    </CardBody>
  </Card>
));

DashboardQuickActions.displayName = 'DashboardQuickActions';

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

  const today = useMemo(() => new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), []);

  if (loading || !data) return <LoadingSpinner />;

  const dist = distView === 'general_average' ? data?.general_average : data?.all_subjects;
  const gradeData = dist?.counts || [];
  const attendanceTrends = data?.dashboard?.charts?.attendance_trends || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={DASH_PAGE}
    >
      <WelcomeBanner
        user={user}
        today={today}
        stats={data}
        subtitle="System Administrator • Portal Management"
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => navigate('/announcements')}
            >
              Post Announcement
            </Button>
            {data?.pending_approvals > 0 && (
              <Button
                variant="primary"
                onClick={() => navigate('/account-approvals')}
              >
                Approvals ({data.pending_approvals})
              </Button>
            )}
          </>
        }
      />

      <div className="space-y-2">
        <p className={DASH_SECTION_LABEL}>School overview</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2 md:gap-3">
        <StatCard label="Total Students" value={data?.total_students} sub="Enrolled" color="blue" onClick={() => navigate('/student-management')} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} />
        <StatCard label="Faculty" value={data?.total_teachers} sub="Verified" color="emerald" onClick={() => navigate('/teachers')} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
        <StatCard label="Classrooms" value={data?.total_classes} sub="Sections" color="violet" onClick={() => navigate('/class-management')} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} />
        <StatCard label="Announcements" value={data?.total_announcements} sub="Live" color="amber" onClick={() => navigate('/announcements')} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>} />
        <StatCard label="Active Users" value={data?.active_users} sub="Realtime" color="indigo" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} />
        <StatCard label="Attendance" value={`${data?.today_rate || 0}%`} sub="Today's Rate" color={data?.today_rate >= 75 ? 'emerald' : 'rose'} onClick={() => navigate('/attendance')} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        </div>
      </div>

      <div className="space-y-2">
        <p className={DASH_SECTION_LABEL}>Analytics</p>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4 overflow-hidden">
        {/* Attendance Trends */}
        <Card className="lg:col-span-8 overflow-hidden flex flex-col min-h-[220px] md:min-h-0">
          <CardHeader divider>
            <div className="flex items-center justify-between">
              <CardTitle subtitle="Last 30 days · presence rate">Attendance Trends</CardTitle>
              <Badge variant="purple" size="sm">
                <span className="w-2 h-2 rounded-full bg-violet-600" />
                Rate %
              </Badge>
            </div>
          </CardHeader>
          <CardBody className="flex-1 min-h-[180px] sm:min-h-[200px]">
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
          </CardBody>
        </Card>

        {/* Grade Distribution */}
        <Card className="lg:col-span-4 flex flex-col min-h-[280px] md:min-h-0">
          <CardHeader divider>
            <div className="flex items-center justify-between">
              <CardTitle subtitle={distView === 'general_average' ? 'General average' : 'All subjects'}>Grade Analysis</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDistView(distView === 'general_average' ? 'all_subjects' : 'general_average')}
                title={distView === 'general_average' ? 'Switch to all subjects' : 'Switch to general average'}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </Button>
            </div>
          </CardHeader>
          <CardBody className="flex-1 flex flex-col justify-between min-h-[200px]">
          <div className="flex-1 flex flex-col justify-between min-h-[200px]">
            <div className="h-36 relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={gradeData} cx="50%" cy="50%" innerRadius={45} outerRadius={65}
                    paddingAngle={4} dataKey="value" animationDuration={1200}>
                    {gradeData.map((item, index) => (
                      <Cell key={`cell-${item.name}`} fill={getGradeCategoryColor(item.name, index)} stroke="#fff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 800, fontSize: '10px', textTransform: 'uppercase' }}
                    formatter={(value, _name, props) => [value, props.payload.name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none rounded-full bg-white/90 border border-violet-100 w-16 h-16 shadow-sm">
                <p className="text-base font-black text-slate-900 leading-none">{dist?.total_count || 0}</p>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                  {distView === 'general_average' ? 'Students' : 'Entries'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 px-0.5 mt-1">
              {gradeData.map((item, index) => {
                const total = gradeData.reduce((sum, d) => sum + d.value, 0);
                const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
                const sliceColor = getGradeCategoryColor(item.name, index);
                return (
                  <div
                    key={item.name}
                    className={`flex items-center justify-between gap-2 rounded-sm border px-2 py-1.5 ${getGradeCategoryLegendClass(item.name)}`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: sliceColor }} />
                      <span className="text-[9px] font-bold text-slate-700 uppercase tracking-wide truncate leading-tight">{item.name}</span>
                    </div>
                    <div className="flex items-baseline gap-1 shrink-0">
                      <span className="text-[10px] font-black text-slate-900 leading-none">{percentage}%</span>
                      <span className="text-[9px] font-semibold text-slate-500 leading-none">({item.value})</span>
                    </div>
                  </div>
                );
              })}
            </div>
            </div>
          </CardBody>
        </Card>
      </div>
      </div>

      <div className="space-y-2">
        <p className={DASH_SECTION_LABEL}>Updates & activity</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {/* Recent Announcements */}
        <Card className="flex flex-col min-h-[200px]">
          <CardHeader divider>
            <div className="flex items-center justify-between">
              <CardTitle subtitle="School-wide updates">Recent Announcements</CardTitle>
              <Link to="/announcements">
                <Button variant="ghost" size="sm" aria-label="View announcements">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardBody className="space-y-2 flex-1 overflow-y-auto scrollbar-none min-h-0">
            {data?.recent_announcements?.length > 0 ? (
              data.recent_announcements.map(a => (
                <div key={a.id} className="group flex gap-3 p-2.5 cursor-pointer rounded-lg border border-slate-100 bg-slate-50/40 hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all">
                  <div className="shrink-0 w-9 h-9 rounded-lg bg-white border border-violet-200 flex items-center justify-center text-violet-800 font-bold text-xs group-hover:bg-violet-700 group-hover:text-white group-hover:border-violet-700 transition-colors">
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
              ))
            ) : (
              <EmptyState
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                }
                title="No announcements"
                className="py-8"
              />
            )}
          </CardBody>
        </Card>

        {/* Latest Messages */}
        <LatestMessagesWidget messages={data?.latest_messages} onOpenChat={() => navigate('/messages')} />

        {/* System Activity */}
        <Card className="flex flex-col min-h-[200px]">
          <CardHeader divider>
            <div className="flex items-center justify-between">
              <CardTitle subtitle="Audit logs summary">System Activity</CardTitle>
              <Link to="/audit-logs">
                <Button variant="ghost" size="sm" aria-label="View audit logs">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardBody className="space-y-2 flex-1 overflow-y-auto scrollbar-none min-h-0">
            {data?.widgets?.recent_activity?.length > 0 ? (
              data.widgets.recent_activity.map(log => (
                <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-100 bg-slate-50/40 hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all">
                  <div className={cn(
                    "mt-1.5 w-2 h-2 rounded-full shrink-0 transition-transform group-hover:scale-125",
                    log.action === 'login' && 'bg-emerald-500',
                    log.action === 'delete' && 'bg-rose-500',
                    log.action === 'create' && 'bg-blue-500',
                    log.action !== 'login' && log.action !== 'delete' && log.action !== 'create' && 'bg-amber-500'
                  )} />
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
              ))
            ) : (
              <EmptyState
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
                title="No activity"
                className="py-8"
              />
            )}
          </CardBody>
        </Card>
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
  const [todayAttendance, setTodayAttendance] = useState({});

  useEffect(() => {
    const today = getLocalDateStr();
    Promise.all([
      api.get('/teacher/stats/'),
      api.get('/classrooms/'),
    ]).then(([statsRes, clsRes]) => {
      setData(statsRes.data);
      const cls = clsRes.data || [];
      setClassrooms(cls);
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

  if (loading) return <LoadingSpinner />;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const unmarkedCount = classrooms.filter(c => !todayAttendance[c.id]).length;
  const markedCount = classrooms.length - unmarkedCount;
  const attendanceRate = classrooms.length > 0 ? Math.round((markedCount / classrooms.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Bento Grid: 12 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-6 lg:grid-cols-12 gap-4 auto-rows-auto">
          
          {/* Academic Overview - spans 8 cols */}
          <div className="sm:col-span-6 lg:col-span-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-3xl p-6 shadow-xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">{greeting}, {user?.first_name}!</h1>
                <p className="text-violet-100 text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                {user?.profile_picture ? (
                  <img src={user.profile_picture} alt="" className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <span className="text-white font-bold text-xl">
                    {[user?.first_name, user?.last_name].filter(Boolean).map(n => n[0].toUpperCase()).join('') || '?'}
                  </span>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="text-white/70 text-xs font-semibold mb-1">Total Classes</div>
                <div className="text-white text-3xl font-bold">{classrooms.length}</div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="text-white/70 text-xs font-semibold mb-1">Students</div>
                <div className="text-white text-3xl font-bold">{data?.total_students || 0}</div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="text-white/70 text-xs font-semibold mb-1">Attendance</div>
                <div className="text-white text-3xl font-bold">{attendanceRate}%</div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="text-white/70 text-xs font-semibold mb-1">Posts</div>
                <div className="text-white text-3xl font-bold">{data?.announcements_sent || 0}</div>
              </div>
            </div>
          </div>

          {/* Today's Tasks - spans 4 cols */}
          <Card className="sm:col-span-6 lg:col-span-4 border-slate-200 shadow-sm rounded-3xl">
            <CardHeader divider className="bg-gradient-to-r from-violet-50 to-indigo-50">
              <CardTitle className="text-violet-900">Today's Tasks</CardTitle>
            </CardHeader>
            <CardBody className="p-4 space-y-3">
              {unmarkedCount > 0 ? (
                <button
                  onClick={() => navigate('/attendance')}
                  className="w-full text-left p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 hover:border-amber-400 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-amber-900 text-sm">Mark Attendance</h3>
                      <p className="text-xs text-amber-700">{unmarkedCount} {unmarkedCount === 1 ? 'class' : 'classes'} pending</p>
                    </div>
                    <Badge variant="amber" size="sm">{unmarkedCount}</Badge>
                  </div>
                </button>
              ) : (
                <div className="text-center py-4 text-emerald-600">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-semibold text-sm">All caught up!</p>
                </div>
              )}
              
              <Button variant="primary" onClick={() => navigate('/my-schedule')} className="w-full">
                View Schedule
              </Button>
            </CardBody>
          </Card>

          {/* Quick Actions - spans 12 cols */}
          <div className="sm:col-span-6 lg:col-span-12 grid grid-cols-2 md:grid-cols-6 gap-3">
            {[
              { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Attendance', path: '/attendance', color: 'emerald' },
              { icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', label: 'Grades', path: '/grade-input', color: 'violet' },
              { icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z', label: 'Announce', path: '/announcements', color: 'amber' },
              { icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z', label: 'Messages', path: '/messages', color: 'rose' },
              { icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', label: 'Materials', path: '/materials', color: 'blue' },
              { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Analytics', path: '/analytics', color: 'indigo' },
            ].map((action, i) => (
              <button
                key={i}
                onClick={() => navigate(action.path)}
                className={`p-4 rounded-2xl border-2 transition-all hover:scale-105 hover:shadow-lg bg-${action.color}-50 border-${action.color}-200 hover:bg-${action.color}-100`}
              >
                <svg className={`w-6 h-6 mx-auto mb-2 text-${action.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
                </svg>
                <p className={`text-xs font-bold text-${action.color}-900`}>{action.label}</p>
              </button>
            ))}
          </div>

          {/* My Classes - spans 8 cols */}
          <Card className="sm:col-span-6 lg:col-span-8 border-slate-200 shadow-sm rounded-3xl">
            <CardHeader divider>
              <CardTitle>My Classes ({classrooms.length})</CardTitle>
            </CardHeader>
            <CardBody className="p-4">
              {classrooms.length === 0 ? (
                <EmptyState
                  title="No classes assigned"
                  description="Your teaching sections will appear here"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
                  {classrooms.map(c => {
                    const marked = todayAttendance[c.id];
                    return (
                      <button
                        key={c.id}
                        onClick={() => navigate(`/my-classes/${c.id}`)}
                        className="p-4 text-left rounded-2xl border-2 border-slate-200 bg-white hover:border-violet-400 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-sm text-slate-900 truncate">{c.name}</h3>
                            <p className="text-xs text-slate-500 truncate">{c.subject_name || 'General'}</p>
                          </div>
                          {marked !== undefined && (
                            <Badge variant={marked ? 'green' : 'amber'} size="sm">
                              {marked ? '✓' : '!'}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-600">
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            {c.student_count || 0}
                          </span>
                          <span className="text-violet-600 font-semibold">→</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Messages - spans 4 cols */}
          <Card className="sm:col-span-6 lg:col-span-4 border-slate-200 shadow-sm rounded-3xl">
            <CardHeader divider>
              <div className="flex items-center justify-between">
                <CardTitle>Messages</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/messages')}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
            </CardHeader>
            <CardBody className="p-4">
              <LatestMessagesWidget messages={data?.latest_messages} onOpenChat={() => navigate('/messages')} />
            </CardBody>
          </Card>

        </div>
      </div>
    </div>
  );
};

const StudentView = () => <StudentDashboardView />;

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
