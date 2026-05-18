import { getUser } from '../utils/auth';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

// ─── Shared UI Components ───────────────────────────────────────────────────

const Spinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="relative">
      <div className="w-12 h-12 rounded-full border-4 border-slate-100" />
      <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-violet-600 border-t-transparent animate-spin" />
    </div>
  </div>
);

const WelcomeBanner = ({ user, today, actions }) => {
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good Morning';
    if (hours < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 md:p-12 shadow-2xl shadow-slate-200/50">
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-violet-600 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 -right-24 w-80 h-80 bg-indigo-600 rounded-full blur-[80px]" />
        <div className="absolute -bottom-24 left-1/4 w-72 h-72 bg-fuchsia-600 rounded-full blur-[90px]" />
      </div>

      <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-violet-200 text-xs font-black uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            System Online
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none">
            {getGreeting()}, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-200 to-indigo-200">
              {user?.first_name || 'User'}
            </span> 👋
          </h1>
          <p className="text-slate-400 font-bold text-lg">{today}</p>
        </div>
        <div className="flex flex-wrap gap-4">
          {actions}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, sub, icon, color = 'violet', onClick, badge }) => {
  const themes = {
    violet: 'from-violet-500/10 to-violet-600/5 text-violet-600 icon-bg-violet-100',
    blue:   'from-blue-500/10 to-blue-600/5 text-blue-600 icon-bg-blue-100',
    emerald:'from-emerald-500/10 to-emerald-600/5 text-emerald-600 icon-bg-emerald-100',
    rose:   'from-rose-500/10 to-rose-600/5 text-rose-600 icon-bg-rose-100',
    amber:  'from-amber-500/10 to-amber-600/5 text-amber-600 icon-bg-amber-100',
    indigo: 'from-indigo-500/10 to-indigo-600/5 text-indigo-600 icon-bg-indigo-100',
  };

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden bg-white border border-slate-100 rounded-[2rem] p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-1 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${themes[color].split(' ').slice(0, 2).join(' ')}`} />
      
      <div className="relative flex items-start justify-between">
        <div className="space-y-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${themes[color].split(' ').pop().replace('icon-bg-', 'bg-')}`}>
            {icon}
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value ?? '—'}</h3>
            {sub && <p className="text-xs font-bold text-slate-500 mt-1">{sub}</p>}
          </div>
        </div>
        {badge > 0 && (
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-rose-500 text-white text-[10px] font-black shadow-lg shadow-rose-200">
            {badge}
          </span>
        )}
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
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-8 pb-12">
      <WelcomeBanner
        user={user}
        today={today}
        actions={
          <>
            <button
              onClick={() => navigate('/announcements')}
              className="px-8 py-4 rounded-2xl bg-white text-slate-900 font-black text-sm shadow-xl hover:bg-slate-50 transition-all active:scale-95"
            >
              + Announcement
            </button>
            {data?.pending_approvals > 0 && (
              <button
                onClick={() => navigate('/account-approvals')}
                className="px-8 py-4 rounded-2xl bg-amber-500 text-white font-black text-sm shadow-xl shadow-amber-200 hover:bg-amber-600 transition-all active:scale-95 flex items-center gap-2"
              >
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                  {data.pending_approvals}
                </span>
                Review Approvals
              </button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Students" value={data?.total_students} sub="Enrolled & Active"
          color="blue" onClick={() => navigate('/student-management')}
          icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
        />
        <StatCard
          label="Faculty Members" value={data?.total_teachers} sub="Verified Teachers"
          color="emerald" onClick={() => navigate('/teachers')}
          icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <StatCard
          label="Classrooms" value={data?.total_classes} sub="Current Sections"
          color="violet" onClick={() => navigate('/class-management')}
          icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
        />
        <StatCard
          label="Subject List" value={data?.total_subjects} sub="Active Curriculum"
          color="indigo" onClick={() => navigate('/subjects')}
          icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Academic Performance */}
        <div className="lg:col-span-8 bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Academic Performance</h3>
              <p className="text-slate-400 font-bold text-sm mt-1">School-wide distribution & metrics</p>
            </div>
            <div className="flex bg-slate-100 p-1.5 rounded-[1.25rem]">
              <button
                onClick={() => setDistView('general_average')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${distView === 'general_average' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                GA
              </button>
              <button
                onClick={() => setDistView('all_subjects')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${distView === 'all_subjects' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
            <div className="md:col-span-5 space-y-6">
              <div className="relative p-8 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-[2rem] text-white shadow-2xl shadow-violet-200 overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-200/80">
                  {distView === 'general_average' ? 'School Average (GA)' : 'Subject Average'}
                </p>
                <div className="flex items-end gap-3 mt-4">
                  <span className="text-6xl font-black leading-none">{data?.average_grade ?? '—'}</span>
                  <div className="mb-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black uppercase tracking-widest">
                    {(data?.average_grade ?? 0) >= 90 ? 'Outstanding' : (data?.average_grade ?? 0) >= 75 ? 'Passing' : 'Needs Focus'}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:bg-white hover:border-violet-100 transition-all duration-300">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Entries</p>
                  <p className="text-2xl font-black text-slate-900">{data?.total_grades || 0}</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:bg-white hover:border-violet-100 transition-all duration-300">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Students Graded</p>
                  <p className="text-2xl font-black text-slate-900">{data?.total_students || 0}</p>
                </div>
              </div>
            </div>

            <div className="md:col-span-7 space-y-5">
              {[
                { label: 'Outstanding', range: '90–100', pct: dist?.outstanding_pct, color: 'bg-emerald-500 shadow-emerald-100', min: 90, max: 100 },
                { label: 'Very Satisfactory', range: '85–89', pct: dist?.very_satisfactory_pct || 0, color: 'bg-blue-500 shadow-blue-100', min: 85, max: 89 },
                { label: 'Satisfactory', range: '80–84', pct: dist?.satisfactory_pct || 0, color: 'bg-violet-500 shadow-violet-100', min: 80, max: 84 },
                { label: 'Fairly Satisfactory', range: '75–79', pct: dist?.fairly_satisfactory_pct || 0, color: 'bg-amber-500 shadow-amber-100', min: 75, max: 79 },
                { label: 'Did Not Meet', range: 'Below 75', pct: dist?.below_75_pct, color: 'bg-rose-500 shadow-rose-100', min: 0, max: 74 },
              ].map(row => (
                <div key={row.label} className="group cursor-pointer" onClick={() => navigate(`/grade-management?minGrade=${row.min}&maxGrade=${row.max}`)}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{row.label}</span>
                      <span className="text-[10px] font-bold text-slate-400">{row.range}</span>
                    </div>
                    <span className="text-xs font-black text-slate-900">{row.pct}%</span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                    <div
                      className={`h-full transition-all duration-1000 rounded-full ${row.color} group-hover:brightness-110`}
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Side Section: Attendance & Quick Actions */}
        <div className="lg:col-span-4 space-y-8">
          {/* Today's Attendance */}
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Today's Attendance</h3>
              <Link to="/attendance" className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-violet-600 hover:bg-violet-600 hover:text-white transition-all duration-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
            </div>
            
            {data?.today_total === 0 ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8l2 2 4-4" /></svg>
                </div>
                <p className="text-slate-400 font-bold text-sm tracking-tight">No records yet today</p>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex items-center justify-center">
                  <div className="relative w-36 h-36">
                    <svg className="w-36 h-36 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="15.9" fill="none"
                        stroke={(data?.today_rate ?? 0) >= 75 ? '#10b981' : '#f43f5e'}
                        strokeWidth="3"
                        strokeDasharray={`${data?.today_rate ?? 0} ${100 - (data?.today_rate ?? 0)}`}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-4xl font-black ${(data?.today_rate ?? 0) >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {data?.today_rate ?? 0}%
                      </span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Presence</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100/50">
                    <div className="text-2xl font-black text-emerald-700">{data?.today_present ?? 0}</div>
                    <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">Present</div>
                  </div>
                  <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100/50">
                    <div className="text-2xl font-black text-rose-700">{data?.today_absent ?? 0}</div>
                    <div className="text-[10px] font-black text-rose-600 uppercase tracking-widest mt-1">Absent</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions Grid */}
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 tracking-tight mb-6">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Grade Input',       path: '/grade-input',          icon: '✏️' },
                { label: 'Attendance',        path: '/attendance',           icon: '📋' },
                { label: 'Announcements',     path: '/announcements',        icon: '📢' },
                { label: 'Enrollment',        path: '/enrollment-management',icon: '📝' },
                { label: 'Classes',           path: '/class-management',     icon: '🏫' },
                { label: 'Reports',           path: '/grade-reports',        icon: '📊' },
              ].map(a => (
                <button
                  key={a.path}
                  onClick={() => navigate(a.path)}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-violet-50 hover:border-violet-100 hover:scale-[1.02] transition-all duration-300 text-center"
                >
                  <span className="text-2xl mb-2 block">{a.icon}</span>
                  <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Announcements */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Recent Announcements</h3>
            <p className="text-slate-400 font-bold text-sm mt-1">Stay updated with the latest news</p>
          </div>
          <Link to="/announcements" className="px-6 py-2 rounded-xl bg-slate-50 text-slate-600 text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all">
            View All
          </Link>
        </div>
        {!data?.recent_announcements?.length ? (
          <div className="text-center py-20 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
            <p className="text-slate-400 font-bold">No recent announcements to display</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(data?.recent_announcements || []).slice(0, 3).map(a => (
              <div key={a.id} className="relative group p-6 rounded-[2rem] bg-slate-50 border border-slate-100 hover:bg-white hover:border-violet-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
                <div className={`absolute top-6 right-6 w-2 h-2 rounded-full ${a.priority === 'critical' ? 'bg-rose-500 animate-pulse' : 'bg-violet-400'}`} />
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      {a.is_pinned && <span className="text-sm">📌</span>}
                      <span className="text-[10px] font-black text-violet-600 uppercase tracking-widest">{new Date(a.created_at).toLocaleDateString()}</span>
                    </div>
                    <h4 className="text-lg font-black text-slate-900 mb-2 line-clamp-1">{a.title}</h4>
                    <p className="text-sm font-bold text-slate-500 line-clamp-2 leading-relaxed">{a.content}</p>
                  </div>
                  <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{a.author_name}</span>
                    {a.priority === 'critical' && (
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-full bg-rose-100 text-rose-600">Critical</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/teacher/stats/'),
      api.get('/classrooms/'),
      api.get('/announcements/'),
    ]).then(([statsRes, clsRes, annRes]) => {
      setStats(statsRes.data);
      setClassrooms(clsRes.data);
      setAnnouncements(annRes.data.slice(0, 3));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-8 pb-12">
      <WelcomeBanner
        user={user}
        today={today}
        actions={
          <>
            <button
              onClick={() => navigate('/attendance')}
              className="px-8 py-4 rounded-2xl bg-white text-slate-900 font-black text-sm shadow-xl hover:bg-slate-50 transition-all active:scale-95"
            >
              Mark Attendance
            </button>
            <button
              onClick={() => navigate('/grade-input')}
              className="px-8 py-4 rounded-2xl bg-violet-600 text-white font-black text-sm shadow-xl shadow-violet-200 hover:bg-violet-700 transition-all active:scale-95"
            >
              Input Grades
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="My Classrooms" value={stats?.total_classes || 0} sub="Assigned Sections"
          color="violet" onClick={() => navigate('/grade-management')}
          icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
        />
        <StatCard
          label="Active Students" value={stats?.total_students || 0} sub="Total across classes"
          color="blue"
          icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
        />
        <StatCard
          label="Grade Entries" value={stats?.total_grades || 0} sub="Recorded this term"
          color="emerald" onClick={() => navigate('/grade-management')}
          icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Classrooms List */}
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Assigned Classes</h3>
            <Link to="/grade-management" className="px-6 py-2 rounded-xl bg-slate-50 text-slate-600 text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all">
              Manage All
            </Link>
          </div>
          {classrooms.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
              <p className="text-slate-400 font-bold">No classrooms assigned to you yet</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {classrooms.map(c => (
                <div key={c.id} className="group flex items-center justify-between p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 hover:bg-white hover:border-violet-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-violet-100 group-hover:scale-110 transition-transform duration-300">
                      {c.name.match(/\d+/)?.[0] || c.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-900">{c.name}</h4>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{c.student_count || 0} Students enrolled</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => navigate('/attendance')}
                      className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-violet-600 hover:text-white hover:border-violet-600 transition-all"
                    >
                      Attendance
                    </button>
                    <button
                      onClick={() => navigate('/grade-input')}
                      className="p-2.5 rounded-xl bg-violet-50 text-violet-600 hover:bg-violet-600 hover:text-white transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions & Tools */}
        <div className="space-y-8">
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-8">Quick Tools</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Mark Attendance',    path: '/attendance',        icon: '📋', color: 'bg-emerald-50 text-emerald-600' },
                { label: 'Input Grades',       path: '/grade-input',       icon: '✏️', color: 'bg-violet-50 text-violet-600' },
                { label: 'Manage Grades',      path: '/grade-management',  icon: '📊', color: 'bg-blue-50 text-blue-600' },
                { label: 'Announcements',      path: '/announcements',     icon: '📢', color: 'bg-amber-50 text-amber-600' },
                { label: 'Materials',          path: '/materials',         icon: '📁', color: 'bg-indigo-50 text-indigo-600' },
                { label: 'Profile',            path: '/profile',           icon: '👤', color: 'bg-slate-50 text-slate-600' },
              ].map(a => (
                <button
                  key={a.path}
                  onClick={() => navigate(a.path)}
                  className="flex flex-col items-center gap-3 p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 hover:bg-white hover:border-violet-100 hover:scale-[1.02] transition-all duration-300 group"
                >
                  <span className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-transform duration-300 group-hover:scale-110 ${a.color}`}>
                    {a.icon}
                  </span>
                  <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{a.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Recent Activity</h3>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Updates</span>
            </div>
            {announcements.length === 0 ? (
              <p className="text-center py-6 text-slate-400 font-bold text-sm">No recent activity</p>
            ) : (
              <div className="space-y-4">
                {announcements.map(a => (
                  <div key={a.id} className="flex gap-4 group">
                    <div className={`w-1 h-10 rounded-full flex-shrink-0 ${a.priority === 'critical' ? 'bg-rose-500 shadow-lg shadow-rose-100' : 'bg-violet-400'}`} />
                    <div className="flex-1">
                      <h5 className="text-sm font-black text-slate-800 line-clamp-1 group-hover:text-violet-600 transition-colors">{a.title}</h5>
                      <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{new Date(a.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
  const [profile, setProfile] = useState(null);
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/student/profile/').catch(() => ({ data: null })),
      api.get('/grades/my_grades/').catch(() => ({ data: [] })),
      api.get('/attendance/').catch(() => ({ data: [] })),
      api.get('/announcements/').catch(() => ({ data: [] })),
    ]).then(([profRes, gradeRes, attRes, annRes]) => {
      setProfile(profRes.data);
      setGrades(gradeRes.data);
      setAttendance(attRes.data);
      setAnnouncements(annRes.data.slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthAtt = attendance.filter(r => r.date?.startsWith(thisMonth));
  const presentCount = monthAtt.filter(r => ['present', 'late'].includes(r.status)).length;
  const absentCount  = monthAtt.filter(r => r.status === 'absent').length;
  const attRate = monthAtt.length > 0 ? Math.round((presentCount / monthAtt.length) * 100) : null;

  const finalGrades = grades.filter(g => g.grade_type === 'final_grade' && g.raw_score != null);
  const overallAvg = finalGrades.length > 0
    ? (finalGrades.reduce((s, g) => s + parseFloat(g.raw_score), 0) / finalGrades.length).toFixed(2)
    : null;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-8 pb-12">
      <WelcomeBanner
        user={user}
        today={today}
        actions={
          <>
            <button
              onClick={() => navigate('/student-grades')}
              className="px-8 py-4 rounded-2xl bg-white text-slate-900 font-black text-sm shadow-xl hover:bg-slate-50 transition-all active:scale-95"
            >
              My Grades
            </button>
            <button
              onClick={() => navigate('/attendance')}
              className="px-8 py-4 rounded-2xl bg-violet-600 text-white font-black text-sm shadow-xl shadow-violet-200 hover:bg-violet-700 transition-all active:scale-95"
            >
              Attendance
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="General Average" value={overallAvg} sub={`${finalGrades.length} Subjects Graded`}
          color="violet" onClick={() => navigate('/student-grades')}
          icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
        />
        <StatCard
          label="Attendance Rate" value={attRate !== null ? `${attRate}%` : '—'} sub="Monthly Presence"
          color={attRate !== null && attRate < 75 ? 'rose' : 'emerald'} onClick={() => navigate('/attendance')}
          icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8l2 2 4-4" /></svg>}
        />
        <StatCard
          label="Total Absences" value={absentCount} sub="This Month"
          color={absentCount > 3 ? 'rose' : 'amber'}
          icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Academic Performance List */}
        <div className="lg:col-span-7 bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Recent Performance</h3>
            <Link to="/student-grades" className="px-6 py-2 rounded-xl bg-slate-50 text-slate-600 text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all">
              View Report
            </Link>
          </div>
          {finalGrades.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
              <p className="text-slate-400 font-bold">No academic records yet</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {finalGrades.slice(0, 8).map(g => {
                const score = parseFloat(g.raw_score);
                const colors = score >= 90 ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  : score >= 85 ? 'bg-blue-50 text-blue-700 border-blue-100'
                  : score >= 75 ? 'bg-amber-50 text-amber-700 border-amber-100'
                  : 'bg-rose-50 text-rose-700 border-rose-100';
                return (
                  <div key={g.id} className="group flex items-center justify-between p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 hover:bg-white hover:border-violet-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-sm transition-transform duration-300 group-hover:scale-110 ${colors}`}>
                        {score}
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-slate-900 line-clamp-1">{g.subject_name}</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Q{g.quarter} · {g.subject_code}</p>
                      </div>
                    </div>
                    <div className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest ${colors}`}>
                      {score >= 90 ? 'Outstanding' : score >= 85 ? 'Satisfactory' : score >= 75 ? 'Passing' : 'Critical'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar: Announcements & Quick Links */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 tracking-tight mb-6">Recent Announcements</h3>
            {announcements.length === 0 ? (
              <p className="text-center py-6 text-slate-400 font-bold text-sm">No new updates</p>
            ) : (
              <div className="space-y-4">
                {announcements.map(a => (
                  <div key={a.id} className="group relative p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:border-violet-100 transition-all duration-300">
                    <div className="flex items-center gap-2 mb-2">
                      {a.is_pinned && <span className="text-xs">📌</span>}
                      <span className="text-[9px] font-black text-violet-600 uppercase tracking-widest">{new Date(a.created_at).toLocaleDateString()}</span>
                    </div>
                    <h5 className="text-sm font-black text-slate-900 group-hover:text-violet-600 transition-colors line-clamp-1">{a.title}</h5>
                    {a.priority === 'critical' && (
                      <span className="absolute top-4 right-4 text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-rose-100 text-rose-600">Critical</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 tracking-tight mb-6">Quick Portal</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'My Grades',    path: '/student-grades',   icon: '📊' },
                { label: 'Attendance',   path: '/attendance',       icon: '📋' },
                { label: 'Subjects',     path: '/register-subjects',icon: '📚' },
                { label: 'Classroom',    path: '/class-members',    icon: '🏫' },
                { label: 'Materials',    path: '/materials',        icon: '📁' },
                { label: 'Profile',      path: '/profile',          icon: '👤' },
              ].map(a => (
                <button
                  key={a.path}
                  onClick={() => navigate(a.path)}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-violet-50 hover:border-violet-100 hover:scale-[1.02] transition-all duration-300 text-center group"
                >
                  <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform">{a.icon}</span>
                  <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── ROOT COMPONENT ───────────────────────────────────────────────────────────

const Dashboard = () => {
  const user = getUser();
  
  // Custom scrollbar styles
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .custom-scrollbar::-webkit-scrollbar { width: 4px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  if (user?.role === 'admin')   return <AdminView />;
  if (user?.role === 'teacher') return <TeacherView />;
  return <StudentView />;
};

export default Dashboard;
