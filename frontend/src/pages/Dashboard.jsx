import { getUser } from '../utils/auth';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  PieChart, Pie, Cell, BarChart, Bar, Legend 
} from 'recharts';
import Spinner from '../components/Spinner';

// ─── Shared UI Components ───────────────────────────────────────────────────

const WelcomeBanner = ({ user, today, actions }) => {
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good Morning';
    if (hours < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
      {/* Very subtle background accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-violet-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-60" />
      
      <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <p className="text-xs font-bold text-violet-600 uppercase tracking-widest">{getGreeting()}</p>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Welcome back, <span className="text-violet-600">{user?.first_name || 'User'}</span>
          </h1>
          <p className="text-slate-500 font-medium flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            {today}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {actions}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, sub, icon, color = 'violet', onClick, badge }) => {
  const themes = {
    violet: 'text-violet-600 bg-violet-50 border-violet-100 group-hover:bg-violet-600 group-hover:text-white',
    blue:   'text-blue-600 bg-blue-50 border-blue-100 group-hover:bg-blue-600 group-hover:text-white',
    emerald:'text-emerald-600 bg-emerald-50 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white',
    rose:   'text-rose-600 bg-rose-50 border-rose-100 group-hover:bg-rose-600 group-hover:text-white',
    amber:  'text-amber-600 bg-amber-50 border-amber-100 group-hover:bg-amber-600 group-hover:text-white',
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white',
  };

  return (
    <div
      onClick={onClick}
      className={`group bg-white border border-slate-200 rounded-2xl p-6 transition-all duration-300 hover:border-transparent hover:shadow-xl hover:shadow-slate-200/50 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-4 w-full">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${themes[color]}`}>
            {icon}
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">{label}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-900 tracking-tight group-hover:text-violet-600 transition-colors">{value ?? '—'}</h3>
              {badge > 0 && (
                <span className="px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-600 text-[10px] font-black">
                  {badge} New
                </span>
              )}
            </div>
            {sub && <p className="text-xs font-bold text-slate-400 mt-1">{sub}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────

const AdminView = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [distView, setDistView] = useState('general_average');

  useEffect(() => {
    api.get('/admin/stats/')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) return <Spinner />;

  const dist = distView === 'general_average' ? data?.general_average : data?.all_subjects;
  const gradeData = data?.charts?.grade_distribution || [];
  const attendanceTrends = data?.charts?.attendance_trends || data?.attendance_trends || [];
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6 pb-12">
      <WelcomeBanner
        user={user}
        today={today}
        actions={
          <>
            <button
              onClick={() => navigate('/announcements')}
              className="px-6 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all"
            >
              + Announcement
            </button>
            {data?.pending_approvals > 0 && (
              <button
                onClick={() => navigate('/account-approvals')}
                className="px-6 py-3 rounded-xl bg-violet-600 text-white font-bold text-sm hover:bg-violet-700 shadow-sm transition-all flex items-center gap-2"
              >
                Review Approvals ({data.pending_approvals})
              </button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          label="Total Students" value={data?.total_students} sub="Enrolled"
          color="blue" onClick={() => navigate('/student-management')}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
        />
        <StatCard
          label="Faculty" value={data?.total_teachers} sub="Verified"
          color="emerald" onClick={() => navigate('/teachers')}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <StatCard
          label="Classrooms" value={data?.total_classes} sub="Sections"
          color="violet" onClick={() => navigate('/class-management')}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
        />
        <StatCard
          label="Announcements" value={data?.total_announcements} sub="Live"
          color="amber" onClick={() => navigate('/announcements')}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>}
        />
        <StatCard
          label="Active Users" value={data?.active_users} sub="Realtime"
          color="indigo"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
        />
        <StatCard
          label="Attendance" value={`${data?.today_rate || 0}%`} sub="Today's Rate"
          color={data?.today_rate >= 75 ? 'emerald' : 'rose'} onClick={() => navigate('/attendance')}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Attendance Trends */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Attendance Trends</h3>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Last 7 Days</p>
            </div>
            <div className="flex gap-2">
               <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                 <span className="w-2 h-2 rounded-full bg-violet-500" /> Presence Rate
               </span>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceTrends}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 8, fontWeight: 900, fill: '#64748b'}}
                  tickFormatter={(str) => {
                    const d = new Date(str);
                    return d.toLocaleDateString('en-US', { weekday: 'short' });
                  }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 8, fontWeight: 900, fill: '#64748b'}}
                  unit="%"
                />
                <Tooltip content={<DashboardTooltip unit="%" />} />
                <Area type="monotone" dataKey="rate" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorRate)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grade Distribution */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Achievement Matrix</h3>
              <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{distView === 'general_average' ? 'General Average' : 'Cumulative Grades'}</p>
            </div>
            <button 
              onClick={() => setDistView(distView === 'general_average' ? 'all_subjects' : 'general_average')}
              className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-violet-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gradeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {gradeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip content={<DashboardPieTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  align="center"
                  iconType="rect"
                  iconSize={6}
                  formatter={(value) => <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Announcements Widget */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-md font-bold text-slate-900">Recent Announcements</h3>
            <Link to="/announcements" className="text-[10px] font-black text-violet-600 uppercase tracking-widest hover:underline">View All</Link>
          </div>
          <div className="space-y-4">
            {data?.recent_announcements?.map(a => (
              <div key={a.id} className="group flex gap-4 p-3 rounded-xl hover:bg-slate-50 transition-all">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600 font-bold text-xs">
                  {new Date(a.created_at).getDate()}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-violet-600 transition-colors">{a.title}</h4>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">{a.author_name} · {new Date(a.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Latest Messages Widget */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-md font-bold text-slate-900">Latest Messages</h3>
            <Link to="/messages" className="text-[10px] font-black text-violet-600 uppercase tracking-widest hover:underline">Open Chat</Link>
          </div>
          <div className="space-y-4">
            {data?.latest_messages?.map(m => (
              <div key={m.id} className="flex gap-4 p-3 rounded-xl hover:bg-slate-50 transition-all cursor-pointer" onClick={() => navigate('/messages')}>
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs">
                  {m.sender ? m.sender[0].toUpperCase() : '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-800 truncate">{m.sender || 'Unknown'}</h4>
                    <span className="text-[8px] font-bold text-slate-400 shrink-0">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{m.content}</p>
                </div>
              </div>
            ))}
            {!data?.latest_messages?.length && <p className="text-center py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">No messages yet</p>}
          </div>
        </div>

        {/* Recent Activity Widget */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-md font-bold text-slate-900">Recent Activity</h3>
            <Link to="/audit-logs" className="text-[10px] font-black text-violet-600 uppercase tracking-widest hover:underline">Audit Logs</Link>
          </div>
          <div className="space-y-4">
            {data?.widgets?.recent_activity?.map(log => (
              <div key={log.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-all">
                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                  log.action === 'login' ? 'bg-emerald-500' : 
                  log.action === 'delete' ? 'bg-rose-500' : 
                  log.action === 'create' ? 'bg-blue-500' : 'bg-amber-500'
                }`} />
                <div className="min-w-0">
                  <h4 className="text-[11px] font-bold text-slate-800 leading-tight">
                    <span className="text-violet-600">{log.user}</span> {log.description}
                  </h4>
                  <p className="text-[9px] text-slate-400 font-medium mt-1 uppercase tracking-tighter">
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
              <p className="text-center py-10 text-[10px] font-bold text-slate-400 uppercase tracking-widest">No activity recorded</p>
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
  const user = getUser();
  const [stats, setStats] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/teacher/stats/'),
      api.get('/classrooms/'),
    ]).then(([statsRes, clsRes]) => {
      setStats(statsRes.data);
      setClassrooms(clsRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-6 pb-12">
      <WelcomeBanner
        user={user}
        today={today}
        actions={
          <>
            <button
              onClick={() => navigate('/attendance')}
              className="px-6 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all"
            >
              Mark Attendance
            </button>
            <button
              onClick={() => navigate('/grade-input')}
              className="px-6 py-3 rounded-xl bg-violet-600 text-white font-bold text-sm hover:bg-violet-700 shadow-sm transition-all"
            >
              Input Grades
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="My Classrooms" value={stats?.total_classes || 0}
          color="violet" onClick={() => navigate('/grade-management')}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
        />
        <StatCard
          label="Active Students" value={stats?.total_students || 0}
          color="blue"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
        />
        <StatCard
          label="Grade Entries" value={stats?.total_grades || 0}
          color="emerald" onClick={() => navigate('/grade-management')}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Assigned Classes</h3>
            <Link to="/my-classes" className="text-[10px] font-black text-violet-600 uppercase tracking-widest hover:underline">View All</Link>
          </div>
          {classrooms.length === 0 ? (
            <p className="text-center py-10 text-slate-400 italic text-sm">No classes assigned</p>
          ) : (
            <div className="space-y-3">
              {classrooms.map(c => (
                <div key={c.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <h4 className="font-bold text-slate-900">{c.name}</h4>
                    <p className="text-xs font-medium text-slate-400">{c.student_count || 0} Students</p>
                  </div>
                  <button
                    onClick={() => navigate('/grade-input')}
                    className="p-2 text-violet-600 hover:bg-violet-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Teaching Tools</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Mark Attendance',    path: '/attendance',        icon: '📋' },
              { label: 'Input Grades',       path: '/grade-input',       icon: '✏️' },
              { label: 'Manage Grades',      path: '/grade-management',  icon: '📊' },
              { label: 'Announcements',      path: '/announcements',     icon: '📢' },
            ].map(a => (
              <button
                key={a.path}
                onClick={() => navigate(a.path)}
                className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-violet-50 hover:border-violet-200 transition-all"
              >
                <span className="text-xl">{a.icon}</span>
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── STUDENT DASHBOARD ────────────────────────────────────────────────────────

const StudentView = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/grades/my_grades/').catch(() => ({ data: [] })),
      api.get('/attendance/').catch(() => ({ data: [] })),
    ]).then(([gradeRes, attRes]) => {
      setGrades(gradeRes.data);
      setAttendance(attRes.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthAtt = Array.isArray(attendance) ? attendance.filter(r => r.date?.startsWith(thisMonth)) : [];
  const presentCount = monthAtt.filter(r => ['present', 'late'].includes(r.status)).length;
  const attRate = monthAtt.length > 0 ? Math.round((presentCount / monthAtt.length) * 100) : null;

  const finalGrades = Array.isArray(grades) ? grades.filter(g => g.grade_type === 'final_grade' && (g.transmuted_score != null || g.raw_score != null)) : [];
  const overallAvg = finalGrades.length > 0
    ? (finalGrades.reduce((s, g) => s + parseFloat(g.transmuted_score || g.raw_score || 0), 0) / finalGrades.length).toFixed(2)
    : null;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-6 pb-12">
      <WelcomeBanner
        user={user}
        today={today}
        actions={
          <>
            <button
              onClick={() => navigate('/student-grades')}
              className="px-6 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all"
            >
              My Grades
            </button>
            <button
              onClick={() => navigate('/attendance')}
              className="px-6 py-3 rounded-xl bg-violet-600 text-white font-bold text-sm hover:bg-violet-700 shadow-sm transition-all"
            >
              Attendance
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="General Average" value={overallAvg}
          color="violet" onClick={() => navigate('/student-grades')}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
        />
        <StatCard
          label="Attendance Rate" value={attRate !== null ? `${attRate}%` : '—'}
          color={attRate !== null && attRate < 75 ? 'rose' : 'emerald'} onClick={() => navigate('/attendance')}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8l2 2 4-4" /></svg>}
        />
        <StatCard
          label="Active Subjects" value={finalGrades.length}
          color="blue"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Performance</h3>
        {finalGrades.length === 0 ? (
          <p className="text-center py-10 text-slate-400 italic text-sm">No grades recorded yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {finalGrades.slice(0, 6).map(g => (
              <div key={g.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 line-clamp-1 text-sm">{g.subject_name}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Q{g.quarter} · {g.subject_code}</p>
                </div>
                <div className="text-lg font-bold text-violet-600">{g.raw_score}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── ROOT COMPONENT ───────────────────────────────────────────────────────────

const Dashboard = () => {
  const user = getUser();
  
  if (user?.role === 'admin')   return <AdminView />;
  if (user?.role === 'teacher') return <TeacherView />;
  return <StudentView />;
};

const DashboardTooltip = ({ active, payload, label, unit = '' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg shadow-2xl backdrop-blur-md bg-opacity-95">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">{label}</p>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{entry.name}</span>
              </div>
              <span className="text-[10px] font-black text-white">{entry.value}{unit}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const DashboardPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg shadow-2xl backdrop-blur-md bg-opacity-95">
        <p className="text-xs font-black text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].payload.fill }} />
          {payload[0].value}
          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest ml-1">{payload[0].name}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default Dashboard;
