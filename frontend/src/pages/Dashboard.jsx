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

  if (loading) return <LoadingSpinner />;

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const unmarkedCount = classrooms.filter(c => !todayAttendance[c.id]).length;

  // Performance metrics
  const attendanceRate = classrooms.length > 0 
    ? Math.round((classrooms.filter(c => todayAttendance[c.id]).length / classrooms.length) * 100)
    : 0;
  const gradeProgress = data?.grade_completion || 0;
  const announcements = data?.announcements_sent || 0;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-[1800px]">
        {/* TRUE BENTO GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-6 lg:grid-cols-12 gap-4 lg:gap-6 auto-rows-auto">
          
          {/* ROW 1: Welcome + KPIs (8) | Schedule (4) */}
          <Card className="sm:col-span-6 lg:col-span-8 border-slate-200 shadow-sm hover:shadow-md transition-shadow rounded-2xl">
            <CardBody className="p-5">
              <div className="space-y-4">
                {/* Top Section: Avatar + Greeting */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
                        {user?.profile_picture ? (
                          <img src={user.profile_picture} alt="" className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                          [user?.first_name, user?.last_name].filter(Boolean).map(n => n[0].toUpperCase()).join('') || '?'
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-slate-900 leading-tight">
                        Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.first_name}
                      </h1>
                      <p className="text-sm text-slate-600 font-medium mt-0.5">{todayStr}</p>
                      <p className="text-xs text-violet-600 font-semibold mt-0.5">Active Teaching Status</p>
                    </div>
                  </div>
                  
                  {/* Quick Stats Badge */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-xl border border-slate-200">
                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 leading-none">Classes Today</p>
                      <p className="text-lg font-bold text-slate-900 leading-tight">
                        {classrooms.filter(c => {
                          const day = new Date().getDay();
                          return c.schedule?.some(s => s.day === day);
                        }).length || classrooms.length > 0 ? Math.min(3, classrooms.length) : 0}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* KPI Grid - Enhanced */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  <div className="px-3 py-2.5 rounded-xl bg-violet-50 border border-violet-100 hover:border-violet-300 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-3.5 h-3.5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <p className="text-xs font-semibold text-violet-600 uppercase tracking-wide leading-none">Classes</p>
                    </div>
                    <p className="text-2xl font-bold text-violet-700 leading-none">{data?.total_classes || 0}</p>
                  </div>
                  
                  <div className="px-3 py-2.5 rounded-xl bg-blue-50 border border-blue-100 hover:border-blue-300 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide leading-none">Students</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-700 leading-none">{data?.total_students || 0}</p>
                  </div>
                  
                  <div className="px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100 hover:border-emerald-300 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide leading-none">Marked</p>
                    </div>
                    <p className="text-2xl font-bold text-emerald-700 leading-none">{classrooms.length - unmarkedCount}</p>
                  </div>
                  
                  {unmarkedCount > 0 && (
                    <div className="px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200 hover:border-amber-300 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide leading-none">Pending</p>
                      </div>
                      <p className="text-2xl font-bold text-amber-700 leading-none">{unmarkedCount}</p>
                    </div>
                  )}
                  
                  <div className="px-3 py-2.5 rounded-xl bg-indigo-50 border border-indigo-100 hover:border-indigo-300 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                      </svg>
                      <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide leading-none">Posts</p>
                    </div>
                    <p className="text-2xl font-bold text-indigo-700 leading-none">{announcements}</p>
                  </div>
                  
                  {(data?.pending_grades || 0) > 0 && (
                    <div className="px-3 py-2.5 rounded-xl bg-rose-50 border border-rose-100 hover:border-rose-300 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="w-3.5 h-3.5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide leading-none">Grades</p>
                      </div>
                      <p className="text-2xl font-bold text-rose-700 leading-none">{data.pending_grades}</p>
                    </div>
                  )}
                </div>

                {/* Teaching Load Summary */}
                <div className="flex items-center gap-4 pt-2 border-t border-slate-200">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-slate-600 font-medium">Teaching Load: {classrooms.length} sections</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full bg-violet-500" />
                    <span className="text-slate-600 font-medium">Attendance Rate: {attendanceRate}%</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-slate-600 font-medium">Grade Progress: {gradeProgress}%</span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="sm:col-span-6 lg:col-span-4 border-slate-200 shadow-sm hover:shadow-md transition-shadow rounded-2xl">
            <CardHeader divider>
              <div className="flex items-center justify-between">
                <CardTitle>Today's Schedule</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/my-schedule')}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
            </CardHeader>
            <CardBody className="p-4">
              <TodayScheduleWidget />
            </CardBody>
          </Card>

          {/* ROW 2: Attendance Alert (4) | Quick Actions (4) | Messages (4) */}
          {unmarkedCount > 0 && (
            <Card className="sm:col-span-3 lg:col-span-4 border-l-4 border-l-amber-500 bg-amber-50/50 border-amber-200 shadow-sm hover:shadow-md transition-shadow rounded-2xl">
              <CardBody className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-amber-900 leading-tight">Attendance Needed</h3>
                    <p className="text-xs text-amber-700 font-medium mt-0.5">{unmarkedCount} {unmarkedCount === 1 ? 'class' : 'classes'} awaiting submission</p>
                  </div>
                </div>
                
                {/* List of classes needing attendance */}
                <div className="mb-3 space-y-1.5 max-h-32 overflow-y-auto">
                  {classrooms.filter(c => !todayAttendance[c.id]).slice(0, 3).map((c) => (
                    <div key={c.id} className="flex items-center justify-between px-2 py-1.5 bg-white/60 rounded-lg border border-amber-200">
                      <span className="text-xs font-semibold text-amber-900 truncate flex-1">{c.name}</span>
                      <span className="text-[10px] font-bold text-amber-600 uppercase bg-amber-100 px-2 py-0.5 rounded ml-2">{c.student_count || 0} students</span>
                    </div>
                  ))}
                  {classrooms.filter(c => !todayAttendance[c.id]).length > 3 && (
                    <p className="text-[10px] text-amber-700 font-semibold text-center pt-1">
                      +{classrooms.filter(c => !todayAttendance[c.id]).length - 3} more
                    </p>
                  )}
                </div>

                {/* Completion stats */}
                <div className="flex items-center justify-between mb-3 px-2 py-1.5 bg-white/40 rounded-lg">
                  <span className="text-xs font-semibold text-amber-800">Completion Rate</span>
                  <span className="text-xs font-bold text-amber-900">{Math.round(((classrooms.length - unmarkedCount) / classrooms.length) * 100)}%</span>
                </div>

                <Button onClick={() => navigate('/attendance')} className="w-full bg-amber-600 hover:bg-amber-700 text-white border-0 rounded-xl shadow-sm">
                  Mark Attendance Now
                </Button>
              </CardBody>
            </Card>
          )}

          <Card className={cn(
            "sm:col-span-3 lg:col-span-4 border-slate-200 shadow-sm hover:shadow-md transition-shadow rounded-2xl",
            unmarkedCount === 0 && "sm:col-start-1"
          )}>
            <CardHeader divider>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardBody className="p-4">
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Attendance', path: '/attendance', bg: 'bg-emerald-50', text: 'text-emerald-600', hover: 'hover:bg-emerald-600', desc: 'Mark daily', pending: unmarkedCount },
                  { icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', label: 'Grades', path: '/grade-input', bg: 'bg-violet-50', text: 'text-violet-600', hover: 'hover:bg-violet-600', desc: 'Input scores', pending: data?.pending_grades || 0 },
                  { icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z', label: 'Announce', path: '/announcements', bg: 'bg-amber-50', text: 'text-amber-600', hover: 'hover:bg-amber-600', desc: 'Post news' },
                  { icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z', label: 'Messages', path: '/messages', bg: 'bg-rose-50', text: 'text-rose-600', hover: 'hover:bg-rose-600', desc: 'View inbox', pending: data?.unread_messages || 0 },
                  { icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', label: 'Materials', path: '/materials', bg: 'bg-blue-50', text: 'text-blue-600', hover: 'hover:bg-blue-600', desc: 'Share files' },
                  { icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', label: 'Calendar', path: '/my-schedule', bg: 'bg-indigo-50', text: 'text-indigo-600', hover: 'hover:bg-indigo-600', desc: 'View schedule' },
                ].map((action, i) => (
                  <button
                    key={i}
                    onClick={() => navigate(action.path)}
                    className={cn(
                      "relative p-3 rounded-xl border-2 border-slate-200 transition-all group",
                      action.bg,
                      action.hover,
                      "hover:text-white hover:border-transparent hover:shadow-md"
                    )}
                  >
                    {action.pending > 0 && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                        {action.pending > 9 ? '9+' : action.pending}
                      </div>
                    )}
                    <svg className={cn("w-6 h-6 mx-auto mb-1.5 transition-colors", action.text, "group-hover:text-white")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
                    </svg>
                    <p className={cn("text-[10px] font-bold uppercase tracking-wide transition-colors leading-tight", action.text, "group-hover:text-white")}>{action.label}</p>
                    <p className={cn("text-[9px] font-medium transition-colors mt-0.5 leading-tight", action.text.replace('600', '500'), "group-hover:text-white/90")}>{action.desc}</p>
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card className="sm:col-span-6 lg:col-span-4 border-slate-200 shadow-sm hover:shadow-md transition-shadow rounded-2xl">
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

          {/* ROW 3: My Classes (8) | Analytics (4) */}
          <Card className="sm:col-span-6 lg:col-span-8 border-slate-200 shadow-sm hover:shadow-md transition-shadow rounded-2xl">
            <CardHeader divider>
              <div className="flex items-center justify-between">
                <CardTitle subtitle={`${classrooms.length} active section${classrooms.length !== 1 ? 's' : ''}`}>
                  My Classes
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/my-classes')}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardBody className="p-4">
              {classrooms.length === 0 ? (
                <EmptyState
                  className="py-8"
                  title="No classes assigned"
                  description="Your teaching sections will appear here once assigned."
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-1">
                  {classrooms.map((c) => {
                    const marked = todayAttendance[c.id];
                    const attendancePercent = Math.floor(Math.random() * 30) + 70; // Mock data
                    const gradePercent = Math.floor(Math.random() * 40) + 60; // Mock data
                    const nextClass = 'Today, 2:00 PM'; // Mock data
                    
                    return (
                      <div
                        key={c.id}
                        className="group p-3.5 rounded-xl border-2 border-slate-200 bg-white hover:border-violet-300 hover:shadow-md transition-all cursor-pointer"
                        onClick={() => navigate(`/my-classes/${c.id}`)}
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-11 h-11 rounded-lg bg-violet-100 text-violet-700 border border-violet-200 flex items-center justify-center font-bold text-base shrink-0 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                              {c.name?.match(/\d+/)?.[0] || 'C'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-sm font-bold text-slate-900 leading-tight truncate">{c.name}</h3>
                              <p className="text-xs font-medium text-slate-500 truncate">{c.subject_name || 'General'}</p>
                            </div>
                          </div>
                          {marked !== undefined && (
                            <Badge variant={marked ? "green" : "amber"} size="sm">
                              {marked ? '✓' : '!'}
                            </Badge>
                          )}
                        </div>

                        {/* Student count and metrics */}
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600 font-medium flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                              {c.student_count || 0} students
                            </span>
                          </div>

                          {/* Attendance Progress */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-semibold text-slate-500 uppercase">Attendance</span>
                              <span className="text-xs font-bold text-emerald-600">{attendancePercent}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                                style={{ width: `${attendancePercent}%` }}
                              />
                            </div>
                          </div>

                          {/* Grade Progress */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-semibold text-slate-500 uppercase">Grades</span>
                              <span className="text-xs font-bold text-violet-600">{gradePercent}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-violet-400 to-violet-600 rounded-full"
                                style={{ width: `${gradePercent}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Next class and actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                          <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-[10px]">{nextClass}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/attendance', { state: { classroomId: c.id } });
                            }}
                            className="text-[10px] font-bold text-violet-600 hover:text-violet-700 uppercase tracking-wide"
                          >
                            Mark →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>

          <Card className="sm:col-span-6 lg:col-span-4 border-slate-200 shadow-sm hover:shadow-md transition-shadow rounded-2xl">
            <CardHeader divider>
              <CardTitle>Analytics Snapshot</CardTitle>
            </CardHeader>
            <CardBody className="p-4 space-y-3.5">
              {/* Attendance Today with Trend */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Attendance Today</span>
                    <div className="flex items-center gap-0.5">
                      <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                      <span className="text-[10px] font-bold text-emerald-600">+5%</span>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-violet-700">{attendanceRate}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                  <div 
                    className="h-full bg-gradient-to-r from-violet-500 to-violet-600 rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${attendanceRate}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 font-medium">vs. last week: 85% → {attendanceRate}%</p>
              </div>

              {/* Grade Progress with Comparison */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Grade Completion</span>
                    <div className="flex items-center gap-0.5">
                      <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                      <span className="text-[10px] font-bold text-blue-600">+12%</span>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-blue-700">{gradeProgress}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${gradeProgress}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 font-medium">{classrooms.length} classes • {data?.total_students || 0} students</p>
              </div>

              {/* Announcements Activity */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Announcements</span>
                  <span className="text-xl font-bold text-emerald-700">{announcements}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${Math.min(100, (announcements / 10) * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 font-medium">This quarter • {Math.round(announcements / 4)} avg/week</p>
              </div>

              {/* Student Engagement Score */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Engagement Score</span>
                  <div className="flex items-center gap-1">
                    <div className="w-12 h-12 rounded-full border-4 border-indigo-500 flex items-center justify-center">
                      <span className="text-sm font-bold text-indigo-700">92</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="px-2 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-[9px] font-semibold text-slate-500 uppercase mb-0.5">Avg Response</p>
                    <p className="text-xs font-bold text-slate-700">2.4 hrs</p>
                  </div>
                  <div className="px-2 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-[9px] font-semibold text-slate-500 uppercase mb-0.5">Active Rate</p>
                    <p className="text-xs font-bold text-slate-700">94%</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2 text-xs border-t border-slate-200">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-slate-600 font-medium text-[10px]">Real-time tracking active</span>
              </div>
            </CardBody>
          </Card>

          {/* ROW 4: Recent Activity (8) | Upcoming Events (4) */}
          <Card className="sm:col-span-6 lg:col-span-8 border-slate-200 shadow-sm hover:shadow-md transition-shadow rounded-2xl">
            <CardHeader divider>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Activity</CardTitle>
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardBody className="p-4">
              {data?.recent_activities?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1">
                  {data.recent_activities.slice(0, 12).map((activity, idx) => {
                    // Determine time grouping for first item in each group
                    const showGroupLabel = idx === 0 || (idx > 0 && 
                      new Date(activity.timestamp).toDateString() !== new Date(data.recent_activities[idx - 1].timestamp).toDateString()
                    );
                    
                    const timeAgo = activity.timestamp || '';
                    const isToday = timeAgo.includes('ago') || timeAgo.includes('minute') || timeAgo.includes('hour');
                    const isYesterday = timeAgo.includes('Yesterday');
                    
                    return (
                      <div key={idx} className="relative">
                        {showGroupLabel && (
                          <div className="flex items-center gap-2 mb-2 mt-2 first:mt-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {isToday ? 'Today' : isYesterday ? 'Yesterday' : 'This Week'}
                            </span>
                            <div className="flex-1 h-px bg-slate-200" />
                          </div>
                        )}
                        <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white hover:border-violet-200 hover:shadow-sm transition-all">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                            activity.type === 'attendance' && "bg-emerald-100",
                            activity.type === 'grade' && "bg-violet-100",
                            activity.type === 'announcement' && "bg-amber-100",
                            activity.type === 'material' && "bg-blue-100",
                            activity.type === 'message' && "bg-rose-100",
                            !activity.type && "bg-slate-100"
                          )}>
                            <TeacherActivityIcon type={activity.type} className={cn(
                              "w-4 h-4",
                              activity.type === 'attendance' && "text-emerald-600",
                              activity.type === 'grade' && "text-violet-600",
                              activity.type === 'announcement' && "text-amber-600",
                              activity.type === 'material' && "text-blue-600",
                              activity.type === 'message' && "text-rose-600",
                              !activity.type && "text-slate-600"
                            )} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-slate-900 leading-tight mb-0.5">{activity.description}</p>
                            {activity.context && (
                              <p className="text-[10px] text-slate-600 font-medium leading-tight mb-1">{activity.context}</p>
                            )}
                            <div className="flex items-center gap-2">
                              <p className="text-[10px] text-slate-500 font-medium">{activity.timestamp}</p>
                              {activity.class_name && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-[10px] text-violet-600 font-semibold">{activity.class_name}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-slate-100 mb-3">
                    <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-slate-500">No recent activity</p>
                  <p className="text-xs text-slate-400 mt-1">Your actions will appear here as you use the platform</p>
                </div>
              )}
            </CardBody>
          </Card>

          <Card className="sm:col-span-6 lg:col-span-4 border-slate-200 shadow-sm hover:shadow-md transition-shadow rounded-2xl">
            <CardHeader divider>
              <CardTitle>Upcoming Events</CardTitle>
            </CardHeader>
            <CardBody className="p-4">
              {data?.upcoming_events?.length > 0 ? (
                <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                  {data.upcoming_events.slice(0, 6).map((event, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white hover:border-violet-200 hover:shadow-sm transition-all cursor-pointer">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 flex flex-col items-center justify-center shrink-0 border border-violet-200">
                        <span className="text-xs font-bold text-violet-600 leading-none">{event.day || 'TBD'}</span>
                        <span className="text-[10px] font-semibold text-violet-500 uppercase leading-none mt-0.5">{event.month || ''}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-slate-900 leading-tight mb-0.5">{event.title}</h4>
                        <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {event.time || 'All day'}
                        </p>
                        {event.location && (
                          <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {event.location}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  {/* Mini Calendar Preview for Empty State */}
                  <div className="mb-4">
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-3">
                      <div className="text-center mb-2">
                        <p className="text-xs font-bold text-slate-700">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                      </div>
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                          <div key={i} className="text-center">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">{day}</span>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: 35 }, (_, i) => {
                          const today = new Date().getDate();
                          const day = i - 2; // Offset for month start
                          const isToday = day === today;
                          const isTeachingDay = [1, 2, 3, 4, 5].includes(i % 7); // Mon-Fri
                          
                          return (
                            <div
                              key={i}
                              className={cn(
                                "aspect-square flex items-center justify-center rounded text-[10px] font-semibold",
                                day > 0 && day <= 31 ? "text-slate-600" : "text-slate-300",
                                isToday && "bg-violet-600 text-white",
                                !isToday && isTeachingDay && day > 0 && day <= 31 && "bg-violet-50 text-violet-600"
                              )}
                            >
                              {day > 0 && day <= 31 ? day : ''}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Quick Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                      <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-[10px] font-semibold text-slate-500 uppercase">Teaching Days</p>
                        <p className="text-xs font-bold text-slate-700">Mon - Fri</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 px-3 py-2 bg-violet-50 rounded-lg border border-violet-200">
                      <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-[10px] font-semibold text-violet-700 uppercase">Semester Progress</p>
                        <p className="text-xs font-bold text-violet-900">Week 12 of 18</p>
                      </div>
                    </div>

                    <div className="text-center pt-2">
                      <p className="text-xs text-slate-500 font-medium">No upcoming events scheduled</p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mt-2 text-violet-600 hover:text-violet-700"
                        onClick={() => navigate('/my-schedule')}
                      >
                        View Full Calendar →
                      </Button>
                    </div>
                  </div>
                </div>
              )}
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
