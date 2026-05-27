import { getUser } from '../utils/auth';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { getCurrentAcademicYear } from '../utils/dateHelpers';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import Spinner from '../components/Spinner';

// ─── Shared UI Components ───────────────────────────────────────────────────

const WelcomeBanner = ({ user, today, actions, subtitle, stats }) => {
  const getGreetingData = () => {
    const hours = new Date().getHours();
    if (hours < 12) return { text: 'Good Morning', icon: '☀️', color: 'emerald', message: "Ready to conquer your classes today?" };
    if (hours < 17) return { text: 'Good Afternoon', icon: '🌤️', color: 'amber', message: "Keep up the great momentum!" };
    return { text: 'Good Evening', icon: '🌙', color: 'indigo', message: "Time to review and recharge." };
  };

  const greeting = getGreetingData();
  const initials = [user?.first_name, user?.last_name]
    .filter(Boolean).map(n => n[0].toUpperCase()).join('') || '?';

  return (
    <div className="bg-slate-50/50 rounded-3xl md:rounded-[2.5rem] p-5 md:p-8 border border-slate-200/50 shadow-[0_20px_50px_rgba(0,0,0,0.04)] relative overflow-hidden group">
      {/* SaaS-style Background Accents */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-violet-500/15 via-fuchsia-500/10 to-transparent rounded-full blur-[100px] -mr-64 -mt-64 opacity-80 group-hover:opacity-100 transition-opacity duration-1000" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-[80px] opacity-60" />
      
      {/* Subtle Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.03)_0%,transparent_70%)] pointer-events-none" />

      {/* Modern Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-multiply" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 86c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm66 3c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm-46-43c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm0-46c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM94 71c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM52 24c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%234338ca' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")` }} />

      <div className="relative space-y-4 md:space-y-8">
        <div className="flex items-center justify-between gap-4 md:gap-6">
          {/* Welcome Text Section (Left) */}
          <div className="flex-1 space-y-3 md:space-y-6">
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <div className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-white/60 backdrop-blur-md border border-${greeting.color}-100/50 shadow-sm transition-all duration-500 hover:scale-105`}>
                <span className="text-xs md:text-sm transform group-hover:rotate-12 transition-transform duration-500">{greeting.icon}</span>
                <p className={`text-[8px] md:text-[10px] font-black text-${greeting.color}-600 uppercase tracking-[0.25em]`}>{greeting.text}</p>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-white/60 backdrop-blur-md border border-slate-100 shadow-sm">
                <svg className="w-3 md:w-3.5 h-3 md:h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">{today}</p>
              </div>
            </div>

            <div className="space-y-1 md:space-y-3">
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">
                Welcome back, <br className="sm:hidden" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 animate-gradient-x inline-block mt-1 md:mt-2">
                  {user?.first_name || 'User'}
                </span>
              </h1>
              <div className="flex flex-col gap-1 md:gap-2">
                <p className="text-slate-500 font-bold text-xs md:text-lg tracking-tight leading-relaxed max-w-md">
                  {greeting.message}
                </p>
                {subtitle && (
                  <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1 bg-white/40 backdrop-blur-sm border border-slate-100/50 rounded-lg md:rounded-xl w-fit">
                    <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-violet-500 animate-pulse shadow-[0_0_8px_rgba(139,92,246,0.4)]" />
                    <p className="text-[8px] md:text-xs font-black text-slate-600 uppercase tracking-widest">{subtitle}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Picture Section (Right) - Shrunk */}
          <div className="relative shrink-0 hidden sm:block">
            <div className="w-16 h-16 md:w-28 md:h-28 rounded-2xl md:rounded-[2rem] bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 p-0.5 md:p-1 shadow-2xl group-hover:rotate-3 transition-all duration-700">
              <div className="w-full h-full rounded-[0.9rem] md:rounded-[1.8rem] bg-white overflow-hidden flex items-center justify-center border-2 md:border-4 border-white/20 relative group/avatar">
                {user?.profile_picture ? (
                  <img src={user.profile_picture} alt="Profile" className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform duration-700" />
                ) : (
                  <span className="text-xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-violet-600 to-indigo-600">
                    {initials}
                  </span>
                )}
                {/* Glass Overlay on Hover */}
                <div className="absolute inset-0 bg-violet-600/10 opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300" />
              </div>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 md:w-7 md:h-7 rounded-full bg-emerald-500 border-2 md:border-4 border-white shadow-lg animate-pulse z-10" />
            
            {/* Progress Ring Decorative */}
            <div className="absolute -inset-2 md:-inset-3 border-2 border-dashed border-slate-200 rounded-2xl md:rounded-[2.5rem] animate-spin-slow opacity-20 pointer-events-none" />
          </div>
        </div>

        {/* Action Buttons Section (Bottom) */}
        <div className="flex flex-wrap gap-2 md:gap-4 shrink-0 relative z-10 pt-1 md:pt-2">
          {actions}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, sub, icon, color = 'violet', onClick, badge }) => {
  const themes = {
    violet: 'text-violet-600 bg-violet-50 border-violet-100 group-hover:bg-violet-600 group-hover:text-white group-hover:shadow-violet-200',
    blue:   'text-blue-600 bg-blue-50 border-blue-100 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-blue-200',
    emerald:'text-emerald-600 bg-emerald-50 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white group-hover:shadow-emerald-200',
    rose:   'text-rose-600 bg-rose-50 border-rose-100 group-hover:bg-rose-600 group-hover:text-white group-hover:shadow-rose-200',
    amber:  'text-amber-600 bg-amber-50 border-amber-100 group-hover:bg-amber-600 group-hover:text-white group-hover:shadow-amber-200',
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-indigo-200',
  };

  const bgGradients = {
    violet: 'from-violet-500/5 to-transparent',
    blue:   'from-blue-500/5 to-transparent',
    emerald:'from-emerald-500/5 to-transparent',
    rose:   'from-rose-500/5 to-transparent',
    amber:  'from-amber-500/5 to-transparent',
    indigo: 'from-indigo-500/5 to-transparent',
  };

  return (
    <div
      onClick={onClick}
      className={`group bg-white border border-slate-200/70 rounded-2xl md:rounded-[1.75rem] p-4 md:p-6 transition-all duration-500 hover:border-transparent hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] hover:-translate-y-1 flex flex-col justify-between min-h-[110px] md:min-h-[160px] relative overflow-hidden ${onClick ? 'cursor-pointer' : ''}`}
    >
      {/* Subtle background gradient */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${bgGradients[color]} rounded-full -mr-16 -mt-16 blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-500`} />
      
      <div className="relative z-10 flex items-start justify-between">
        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm ${themes[color]}`}>
          {icon}
        </div>
        {badge > 0 && (
          <span className="px-2 py-1 rounded-full bg-rose-100 text-rose-600 text-[8px] md:text-[9px] font-black uppercase tracking-wider animate-bounce">
            {badge} New
          </span>
        )}
      </div>
      <div className="relative z-10 mt-3 md:mt-4">
        <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 md:mb-1.5">{label}</p>
        <div className="flex items-baseline gap-1 md:gap-2">
          <h3 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight transition-colors group-hover:text-violet-600">
            {value ?? '—'}
          </h3>
        </div>
        {sub && <p className="text-[9px] md:text-[11px] font-bold text-slate-400 mt-0.5 md:mt-1 uppercase tracking-tight line-clamp-1">{sub}</p>}
      </div>
    </div>
  );
};

const LatestMessagesWidget = ({ messages, onOpenChat }) => {
  return (
    <div className="bg-white border border-slate-200/70 rounded-[2rem] p-6 shadow-sm flex flex-col h-full relative overflow-hidden group">
      {/* Decorative Gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/5 to-transparent rounded-full -mr-16 -mt-16 blur-2xl opacity-50" />
      
      <div className="flex items-center justify-between mb-6 shrink-0 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0 shadow-sm border border-violet-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Latest Messages</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Communication hub</p>
          </div>
        </div>
        <button 
          onClick={onOpenChat}
          className="p-2.5 rounded-xl bg-violet-50 text-violet-600 hover:bg-violet-600 hover:text-white transition-all active:scale-90 shadow-sm border border-violet-100/50"
          title="Open Messages"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5H19M19 5V11M19 5L5 19M5 19H11M5 19V13" /></svg>
        </button>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto pr-1 -mr-1 scrollbar-none relative z-10">
        {messages?.map(m => (
          <div key={m.id} className="flex gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:border-violet-200 hover:shadow-md transition-all cursor-pointer group/msg" onClick={onOpenChat}>
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-black text-xs shadow-sm border border-white group-hover/msg:rotate-6 transition-transform">
                {m.sender ? m.sender[0].toUpperCase() : '?'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex justify-between items-center gap-2">
                <h4 className="text-xs font-black text-slate-800 truncate group-hover/msg:text-violet-600 transition-colors">{m.sender || 'Unknown'}</h4>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter shrink-0 bg-slate-100 px-1.5 py-0.5 rounded-md">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-1 mt-1.5 font-bold tracking-tight">{m.content}</p>
            </div>
          </div>
        ))}
        {!messages?.length && (
          <div className="flex flex-col items-center justify-center py-12 opacity-40">
            <div className="w-16 h-16 rounded-[2rem] bg-slate-50 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
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
    const [time, period] = timeStr.split(' ');
    let [h, m] = time.split(':').map(Number);
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  };
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const currentIdx = schedule.findIndex(s => {
    const start = toMinutes(s.time_slot_detail?.start_time_display);
    const end   = toMinutes(s.time_slot_detail?.end_time_display);
    return nowMinutes >= start && nowMinutes < end;
  });

  return (
    <div className="bg-white border border-slate-200/70 rounded-[2rem] p-6 shadow-sm flex flex-col h-full relative overflow-hidden group">
      {/* Decorative background element */}
      <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-full -ml-12 -mt-12 blur-2xl opacity-50" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 shadow-sm border border-indigo-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">Today's Schedule</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{todayLabel}</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/schedule')}
          className="px-3 py-1.5 rounded-lg bg-indigo-50 text-[10px] font-black text-indigo-600 hover:bg-indigo-600 hover:text-white uppercase tracking-widest transition-all active:scale-95 shadow-sm"
        >
          View Full
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 relative z-10">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-16 rounded-2xl bg-slate-50 animate-pulse border border-slate-100/50" />)}
          </div>
        ) : schedule.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mb-3 shadow-sm">
              <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">No classes scheduled</p>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Enjoy your free time!</p>
          </div>
        ) : (
          <div className="space-y-2.5 h-full overflow-y-auto pr-1 -mr-1 scrollbar-none pb-2">
            {schedule.map((s, idx) => {
              const isCurrent = idx === currentIdx;
              const isPast    = currentIdx !== -1 && idx < currentIdx;
              return (
                <div key={s.id} className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all border group/item ${
                  isCurrent
                    ? 'bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-200 ring-4 ring-indigo-50'
                    : isPast
                    ? 'bg-slate-50/50 border-transparent opacity-60'
                    : 'bg-slate-50 border-slate-100 hover:bg-white hover:border-indigo-200 hover:shadow-md'
                }`}>
                  <div className="text-center min-w-[50px] shrink-0">
                    <p className={`text-xs font-black leading-none ${isCurrent ? 'text-white' : 'text-indigo-600'}`}>
                      {s.time_slot_detail?.start_time_display}
                    </p>
                    <p className={`text-[9px] font-bold mt-1.5 ${isCurrent ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {s.time_slot_detail?.end_time_display}
                    </p>
                  </div>
                  
                  <div className={`w-px h-8 shrink-0 ${isCurrent ? 'bg-indigo-400' : 'bg-slate-200'}`} />
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-black truncate tracking-tight ${isCurrent ? 'text-white' : 'text-slate-800'}`}>
                      {s.classroom_detail?.name}
                    </p>
                    <p className={`text-[10px] font-bold mt-0.5 truncate uppercase tracking-widest ${isCurrent ? 'text-indigo-100' : 'text-slate-400'}`}>
                      {s.subject_detail?.name}
                    </p>
                  </div>

                  {isCurrent && (
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm shrink-0">
                      <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                    </div>
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

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-4 md:space-y-6 page-bottom-safe">
      <WelcomeBanner
        user={user}
        today={today}
        stats={data}
        subtitle="System Administrator • Portal Management"
        actions={
          <>
            <button
              onClick={() => navigate('/announcements')}
              className="px-5 py-3 rounded-2xl border border-slate-200 bg-white text-slate-700 font-black text-[10px] uppercase tracking-[0.15em] hover:bg-slate-50 hover:border-violet-200 hover:text-violet-600 transition-all flex items-center gap-2.5 shadow-sm active:scale-95"
            >
              Post Announcement
            </button>
            {data?.pending_approvals > 0 && (
              <button
                onClick={() => navigate('/account-approvals')}
                className="px-5 py-3 rounded-2xl bg-[#1A0B2E] text-white font-black text-[10px] uppercase tracking-[0.15em] hover:bg-violet-900 shadow-lg shadow-violet-200/50 transition-all flex items-center gap-2.5 active:scale-95"
              >
                Review Approvals ({data.pending_approvals})
              </button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-5">
        <StatCard
          label="Total Students" value={data?.total_students} sub="Enrolled"
          color="blue" onClick={() => navigate('/student-management')}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
        />
        <StatCard
          label="Faculty" value={data?.total_teachers} sub="Verified"
          color="emerald" onClick={() => navigate('/teachers')}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <StatCard
          label="Classrooms" value={data?.total_classes} sub="Sections"
          color="violet" onClick={() => navigate('/class-management')}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
        />
        <StatCard
          label="Announcements" value={data?.total_announcements} sub="Live"
          color="amber" onClick={() => navigate('/announcements')}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>}
        />
        <StatCard
          label="Active Users" value={data?.active_users} sub="Realtime"
          color="indigo"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
        />
        <StatCard
          label="Attendance" value={`${data?.today_rate || 0}%`} sub="Today's Rate"
          color={data?.today_rate >= 75 ? 'emerald' : 'rose'} onClick={() => navigate('/attendance')}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 overflow-hidden">
        {/* Attendance Trends */}
        <div className="lg:col-span-8 bg-white border border-slate-200/70 rounded-3xl md:rounded-[2rem] p-4 md:p-8 shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-8 shrink-0">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Attendance Trends</h3>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Last 30 Days Presence rate</p>
            </div>
            <div className="flex gap-4">
               <span className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                 <span className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]" /> Rate (%)
               </span>
            </div>
          </div>
          <div className="flex-1 h-64 min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: 800, fill: '#94a3b8'}}
                  tickFormatter={(str) => {
                    const d = new Date(str);
                    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: 800, fill: '#94a3b8'}}
                  unit="%"
                  dx={-5}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  labelStyle={{ fontWeight: 900, color: '#1e293b', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}
                  itemStyle={{ fontWeight: 800, fontSize: '12px', color: '#8b5cf6' }}
                />
                <Area type="monotone" dataKey="rate" stroke="#8b5cf6" strokeWidth={4} fillOpacity={1} fill="url(#colorRate)" animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grade Distribution */}
        <div className="lg:col-span-4 bg-white border border-slate-200/70 rounded-3xl md:rounded-[2rem] p-4 md:p-8 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8 shrink-0">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Grade Analysis</h3>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{distView === 'general_average' ? 'General Average' : 'All Subjects'}</p>
            </div>
            <button 
              onClick={() => setDistView(distView === 'general_average' ? 'all_subjects' : 'general_average')}
              className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all active:scale-90"
              title="Toggle View"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
          </div>
          <div className="flex-1 flex flex-col justify-center gap-8 min-h-[300px]">
            {/* Chart */}
            <div className="h-48 relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gradeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={8}
                    dataKey="value"
                    animationDuration={1500}
                  >
                    {gradeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 900, fontSize: '11px', textTransform: 'uppercase' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-3xl font-black text-slate-900 leading-none">{dist?.total_count || 0}</p>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1.5">
                  {distView === 'general_average' ? 'Students' : 'Entries'}
                </p>
              </div>
            </div>

            {/* Legends */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 px-2">
              {gradeData.map((item, index) => {
                const total = gradeData.reduce((sum, d) => sum + d.value, 0);
                const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
                return (
                  <div key={item.name} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest truncate leading-none">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1.5 pl-4">
                      <span className="text-sm font-black text-slate-900 leading-none">{percentage}%</span>
                      <span className="text-[9px] font-bold text-slate-400 leading-none">({item.value})</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        {/* Recent Announcements Widget */}
        <div className="bg-white border border-slate-200/70 rounded-3xl md:rounded-[2rem] p-4 md:p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6 shrink-0">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Recent Announcements</h3>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">School-wide updates</p>
            </div>
            <Link to="/announcements" className="p-2.5 rounded-xl bg-violet-50 text-violet-600 hover:bg-violet-600 hover:text-white transition-all active:scale-90">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            </Link>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto pr-1 -mr-1 scrollbar-thin">
            {data?.recent_announcements?.map(a => (
              <div key={a.id} className="group flex gap-4 p-4 rounded-2xl bg-slate-50/50 hover:bg-white hover:shadow-md hover:shadow-violet-100 transition-all border border-transparent hover:border-violet-100 cursor-pointer">
                <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-violet-600 font-black text-sm shadow-sm group-hover:bg-violet-600 group-hover:text-white group-hover:border-violet-600 transition-all">
                  {new Date(a.created_at).getDate()}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-black text-slate-800 line-clamp-1 group-hover:text-violet-600 transition-colors leading-snug">{a.title}</h4>
                  <div className="flex items-center gap-2 mt-1.5">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{a.author_name}</p>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Latest Messages Widget */}
        <LatestMessagesWidget 
          messages={data?.latest_messages} 
          onOpenChat={() => navigate('/messages')} 
        />

        {/* Recent Activity Widget */}
        <div className="bg-white border border-slate-200/70 rounded-3xl md:rounded-[2rem] p-4 md:p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6 shrink-0">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">System Activity</h3>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Audit logs summary</p>
            </div>
            <Link to="/audit-logs" className="p-2.5 rounded-xl bg-violet-50 text-violet-600 hover:bg-violet-600 hover:text-white transition-all active:scale-90">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </Link>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto pr-1 -mr-1 scrollbar-thin">
            {data?.widgets?.recent_activity?.map(log => (
              <div key={log.id} className="flex items-start gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-all group">
                <div className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 shadow-sm transition-transform group-hover:scale-125 ${
                  log.action === 'login' ? 'bg-emerald-500' : 
                  log.action === 'delete' ? 'bg-rose-500' : 
                  log.action === 'create' ? 'bg-blue-500' : 'bg-amber-500'
                }`} />
                <div className="min-w-0">
                  <h4 className="text-[11px] font-bold text-slate-800 leading-relaxed">
                    <span className="text-violet-600 font-black">{log.user}</span> <span className="text-slate-500">{log.description}</span>
                  </h4>
                  <p className="text-[9px] text-slate-400 font-black mt-1.5 uppercase tracking-widest">
                    {new Date(log.timestamp).toLocaleString(undefined, { 
                      month: 'short', 
                      day: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            ))}
            {!data?.widgets?.recent_activity?.length && (
              <div className="flex flex-col items-center justify-center py-10 opacity-40">
                <svg className="w-8 h-8 text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── TEACHER DASHBOARD ───────────────────────────────────────────────────────

const TeacherView = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/teacher/stats/'),
      api.get('/classrooms/'),
    ]).then(([statsRes, clsRes]) => {
      setData(statsRes.data);
      setClassrooms(clsRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in page-bottom-safe">
      <WelcomeBanner
        user={user}
        today={today}
        stats={data}
        subtitle={`${user?.profile?.employee_id || 'Faculty'} • Handling ${data?.total_classes || 0} Sections`}
        actions={
          <>
            <button
              onClick={() => navigate('/announcements')}
              className="px-5 py-3 rounded-2xl border border-slate-200 bg-white text-slate-700 font-black text-[10px] uppercase tracking-[0.15em] hover:bg-slate-50 hover:border-violet-200 hover:text-violet-600 transition-all flex items-center gap-2.5 shadow-sm active:scale-95"
            >
              <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
              Post Announcement
            </button>
            <button
              onClick={() => navigate('/grade-input')}
              className="px-5 py-3 rounded-2xl bg-[#1A0B2E] text-white font-black text-[10px] uppercase tracking-[0.15em] hover:bg-violet-900 shadow-lg shadow-violet-200/50 transition-all flex items-center gap-2.5 active:scale-95"
            >
              <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Input Grades
            </button>
          </>
        }
      />

      {/* Main Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
        <StatCard
          label="Handled Classes" value={data?.total_classes || 0} sub="Active Sections"
          color="violet" onClick={() => navigate('/my-classes')}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
        />
        <StatCard
          label="Total Students" value={data?.total_students || 0} sub="Enrolled in Subjects"
          color="blue"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
        />
        <StatCard
          label="Pending Grades" value={data?.pending_grades || 0} sub="Awaiting Input"
          color="amber" onClick={() => navigate('/grade-input')}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          label="Today's Attendance" value={`${data?.attendance_rate || 0}%`} sub="Presence Rate"
          color="emerald" onClick={() => navigate('/attendance')}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8l2 2 4-4" /></svg>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6">
        {/* ── LEFT COLUMN (lg:8): Active Sessions + Activity ── */}
        <div className="lg:col-span-8 space-y-5 md:space-y-6">
          {/* Active Classroom Sessions */}
          <div className="bg-white border border-slate-200/60 rounded-[2rem] shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-violet-600 shadow-lg shadow-violet-200 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Active Classroom Sessions</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Your currently assigned sections</p>
                </div>
              </div>
              <Link to="/my-classes" className="px-4 py-2 rounded-xl bg-violet-50 text-[10px] font-black text-violet-600 hover:bg-violet-600 hover:text-white uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 shadow-sm">
                View All
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>
            
            <div className="overflow-x-auto scrollbar-none">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead className="bg-slate-50/60 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Classroom</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Subject Info</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Enrollment</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {classrooms.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center gap-4">
                          <div className="w-16 h-16 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-center shadow-inner">
                            <svg className="w-8 h-8 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-500">No classes assigned yet</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Contact administration for assignments</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    classrooms.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/50 transition-all group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 text-violet-600 flex items-center justify-center font-black text-sm shadow-sm border border-white group-hover:scale-110 group-hover:from-violet-600 group-hover:to-indigo-600 group-hover:text-white transition-all duration-500 shrink-0">
                              {c.name?.match(/\d+/)?.[0] || 'C'}
                            </div>
                            <div>
                              <span className="text-sm font-black text-slate-800 tracking-tight group-hover:text-violet-600 transition-colors block">{c.name}</span>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Section</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-slate-700 leading-none">{c.subject_name || 'General'}</p>
                          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.1em] mt-1.5">{c.subject_code || 'GEN-101'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 group-hover:bg-white group-hover:border-violet-100 transition-colors">
                            <span className="text-sm font-black text-slate-900">{c.student_count || 0}</span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Students</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => navigate('/attendance', { state: { classroomId: c.id } })}
                              className="p-2.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white rounded-xl transition-all active:scale-90 shadow-sm border border-emerald-100/50"
                              title="Take Attendance"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8l2 2 4-4" /></svg>
                            </button>
                            <button
                              onClick={() => navigate('/grade-input', { state: { classroomId: c.id } })}
                              className="p-2.5 text-violet-600 bg-violet-50 hover:bg-violet-600 hover:text-white rounded-xl transition-all active:scale-90 shadow-sm border border-violet-100/50"
                              title="Input Grades"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Activity - Wide Style */}
          <div className="bg-white border border-slate-200/60 rounded-[2rem] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-200 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Recent Activity</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Your personal audit log</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Feed
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data?.recent_activities?.length ? data.recent_activities.slice(0, 6).map((act, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:border-violet-200 hover:shadow-md transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-lg shrink-0 group-hover:scale-110 transition-transform shadow-sm">
                    {act.type === 'grade' ? '📊' : act.type === 'attendance' ? '📋' : '📢'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-700 leading-tight group-hover:text-violet-600 transition-colors line-clamp-1">{act.message}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{act.time}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{act.type}</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="col-span-full py-8 text-center opacity-50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No recent activities recorded</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (lg:4): Tools + Schedule + Messages ── */}
        <div className="lg:col-span-4 space-y-5 md:space-y-6">
          {/* Teaching Intelligence */}
          <div className="bg-[#1A0B2E] rounded-[2rem] p-6 shadow-xl border border-white/5 relative overflow-hidden group lg:h-[380px] flex flex-col justify-center">
            <div className="absolute -right-8 -top-8 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl" />
            
            <div className="relative z-10 flex items-center justify-between mb-6 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">Quick Actions</h3>
                  <p className="text-[9px] font-bold text-violet-400/60 uppercase tracking-widest mt-0.5">Teaching Intelligence</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 relative z-10 flex-1">
              {[
                { label: 'Attendance', path: '/attendance', color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
                { label: 'Grade Input', path: '/grade-input', color: 'text-violet-400', bg: 'bg-violet-400/10', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
                { label: 'Analytics', path: '/analytics', color: 'text-blue-400', bg: 'bg-blue-400/10', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                { label: 'Materials', path: '/materials', color: 'text-amber-400', bg: 'bg-amber-400/10', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
              ].map(a => (
                <button key={a.path} onClick={() => navigate(a.path)}
                  className="flex flex-col items-center justify-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-violet-500/50 hover:shadow-[0_0_20px_rgba(139,92,246,0.2)] transition-all group active:scale-95">
                  <div className={`w-10 h-10 ${a.bg} ${a.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={a.icon} /></svg>
                  </div>
                  <span className="text-[10px] font-black text-violet-200 uppercase tracking-widest">{a.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:h-[380px]">
            <TodayScheduleWidget role="teacher" />
          </div>
          
          <div className="lg:h-[380px]">
            <LatestMessagesWidget messages={data?.latest_messages} onOpenChat={() => navigate('/messages')} />
          </div>
        </div>
      </div>
    </div>
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

  const getLocalDate = () => {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
  };

  const thisMonth = getLocalDate().slice(0, 7);
  const monthAtt = Array.isArray(attendance) ? attendance.filter(r => {
    const isThisMonth = r.date?.startsWith(thisMonth);
    const day = new Date(r.date + 'T00:00:00').getDay();
    const isWeekend = day === 0 || day === 6;
    return isThisMonth && !isWeekend;
  }) : [];
  
  const presentCount = monthAtt.filter(r => r.status === 'present').length;
  const lateCount = monthAtt.filter(r => r.status === 'late').length;
  const absentCount = monthAtt.filter(r => r.status === 'absent').length;
  const totalPresentForRate = monthAtt.filter(r => ['present', 'late'].includes(r.status)).length;
  const attRate = monthAtt.length > 0 ? Math.round((totalPresentForRate / monthAtt.length) * 100) : null;

  const finalGrades = Array.isArray(grades) ? grades.filter(g => g.grade_type === 'final_grade' && (g.transmuted_score != null || g.raw_score != null)) : [];
  const overallAvg = finalGrades.length > 0
    ? (finalGrades.reduce((s, g) => s + parseFloat(g.transmuted_score || g.raw_score || 0), 0) / finalGrades.length).toFixed(2)
    : null;

  const attPieData = [
    { name: 'Present', value: presentCount, color: '#10b981' },
    { name: 'Late',    value: lateCount,    color: '#f59e0b' },
    { name: 'Absent',  value: absentCount,  color: '#f43f5e' },
  ].filter(d => d.value > 0);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in page-bottom-safe">
      <WelcomeBanner
        user={user}
        today={today}
        stats={stats}
        subtitle={`${stats?.classroom_name || user?.profile?.grade_level || 'Student'} • KNHS Learner`}
        actions={
          <>
            <button
              onClick={() => navigate('/materials')}
              className="px-5 py-3 rounded-2xl border border-slate-200 bg-white text-slate-700 font-black text-[10px] uppercase tracking-[0.15em] hover:bg-slate-50 hover:border-violet-200 hover:text-violet-600 transition-all flex items-center gap-2.5 shadow-sm active:scale-95"
            >
              <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              Materials
            </button>
            <button
              onClick={() => navigate('/student-grades')}
              className="px-5 py-3 rounded-2xl bg-[#1A0B2E] text-white font-black text-[10px] uppercase tracking-[0.15em] hover:bg-violet-900 shadow-lg shadow-violet-200/50 transition-all flex items-center gap-2.5 active:scale-95"
            >
              <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              My Grades
            </button>
          </>
        }
      />

      {/* Attendance Overview */}
      <div className="grid grid-cols-3 gap-3 md:gap-6">
        <StatCard
          label="Present" value={presentCount} sub="Days"
          color="emerald"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          label="Absent" value={absentCount} sub="Days"
          color="rose"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          label="Late" value={lateCount} sub="Days"
          color="amber"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
        <StatCard
          label="General Average" value={overallAvg || '0.00'} sub="Academic Standing"
          color="violet" onClick={() => navigate('/student-grades')}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
        />
        <StatCard
          label="Attendance Rate" value={attRate !== null ? `${attRate}%` : '0%'} sub="This Month"
          color={attRate !== null && attRate < 75 ? 'rose' : 'emerald'} onClick={() => navigate('/attendance')}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8l2 2 4-4" /></svg>}
        />
        <StatCard
          label="Total Subjects" value={finalGrades.length} sub="Current Load"
          color="blue"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
        />
        <StatCard
          label="Unread Alerts" value={stats?.unread_notifications || 0} sub="Notifications"
          color="amber" onClick={() => navigate('/notifications')}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6">
        {/* ── LEFT COLUMN (lg:8): Performance + Notifications ── */}
        <div className="lg:col-span-8 space-y-5 md:space-y-6">
          {/* Performance Visualization */}
          <div className="bg-white border border-slate-200/70 rounded-[2rem] p-6 md:p-8 shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-8 shrink-0">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Subject Performance Matrix</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Comparative view of your current grades</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Score (%)</span>
                </div>
              </div>
            </div>
            
            <div className="flex-1 h-72 min-h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={finalGrades} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="subject_code" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}}
                    domain={[70, 100]}
                    dx={-5}
                  />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                    labelStyle={{ fontWeight: 900, color: '#1e293b', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}
                    itemStyle={{ fontWeight: 800, fontSize: '12px', color: '#8b5cf6' }}
                  />
                  <Bar 
                    dataKey="raw_score" 
                    fill="#8b5cf6" 
                    radius={[6, 6, 0, 0]} 
                    barSize={40}
                    name="Final Grade"
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* System Updates - Wide Style */}
          <div className="bg-white border border-slate-200/70 rounded-[2rem] p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0 shadow-sm border border-violet-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">System Updates</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Notifications & alerts</p>
                </div>
              </div>
              <Link to="/notifications" className="p-2.5 rounded-xl bg-violet-50 text-violet-600 hover:bg-violet-600 hover:text-white transition-all active:scale-90 shadow-sm border border-violet-100/50">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats?.recent_notifications?.length ? stats.recent_notifications.slice(0, 6).map((notif, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:border-violet-200 hover:shadow-md transition-all cursor-pointer group" onClick={() => navigate('/notifications')}>
                  <div className="w-11 h-11 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-lg shadow-sm group-hover:scale-110 group-hover:bg-violet-50 transition-all">
                    {notif.type === 'grade' ? '📈' : '🔔'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-700 leading-tight line-clamp-1 group-hover:text-violet-600 transition-colors">{notif.title}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5">{notif.time}</p>
                  </div>
                </div>
              )) : (
                <div className="col-span-full flex flex-col items-center justify-center py-10 opacity-40">
                  <svg className="w-8 h-8 text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No alerts</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (lg:4): Analysis + Navigator + Schedule + Messages ── */}
        <div className="lg:col-span-4 space-y-5 md:space-y-6">
          {/* Attendance Distribution */}
          <div className="bg-white border border-slate-200/70 rounded-[2rem] p-6 md:p-8 shadow-sm flex flex-col lg:h-[380px]">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Attendance Analysis</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Monthly presence</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            </div>
            <div className="flex-1 flex flex-col justify-center gap-6 min-h-0">
              <div className="h-40 relative shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={8}
                      dataKey="value"
                      animationDuration={1500}
                    >
                      {attPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ fontWeight: 900, fontSize: '11px', textTransform: 'uppercase' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-2xl font-black text-slate-900 leading-none">{monthAtt.length}</p>
                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Days</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 px-2 shrink-0">
                {attPieData.map((item) => (
                  <div key={item.name} className="flex flex-col items-center gap-1 text-center">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">{item.name}</span>
                    </div>
                    <p className="text-xs font-black text-slate-900">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Navigator Column */}
          <div className="bg-[#1A0B2E] rounded-[2rem] p-6 shadow-xl border border-white/5 relative overflow-hidden group lg:h-[380px] flex flex-col justify-center">
            <div className="absolute -right-8 -top-8 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl group-hover:bg-violet-500/20 transition-all duration-700" />
            <div className="relative z-10 flex flex-col h-full">
              <h3 className="text-white text-sm font-black uppercase tracking-tight mb-6 shrink-0">Quick Navigator</h3>
              <div className="grid grid-cols-2 gap-3 flex-1">
                {[
                  { label: 'My Grades', path: '/student-grades', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
                  { label: 'Schedule', path: '/schedule', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
                  { label: 'Materials', path: '/materials', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
                  { label: 'Messages', path: '/messages', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg> },
                  { label: 'Attendance', path: '/attendance', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg> },
                  { label: 'Profile', path: '/profile', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
                ].map(a => (
                  <button key={a.path} onClick={() => navigate(a.path)}
                    className="flex flex-col items-center justify-center p-3 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all active:scale-95 group/btn">
                    <div className="text-violet-400 mb-2 group-hover/btn:scale-110 group-hover/btn:text-white transition-all duration-300">
                      {a.icon}
                    </div>
                    <span className="text-[9px] font-black text-violet-200 uppercase tracking-widest text-center">{a.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:h-[380px]">
            <TodayScheduleWidget role="student" />
          </div>
          
          <div className="lg:h-[380px]">
            <LatestMessagesWidget messages={stats?.latest_messages} onOpenChat={() => navigate('/messages')} />
          </div>
        </div>
      </div>
    </div>
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
