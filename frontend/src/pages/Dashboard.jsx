import { getUser } from '../utils/auth';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

// ─── Shared UI Components ───────────────────────────────────────────────────

const Spinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="relative">
      <div className="w-10 h-10 rounded-full border-4 border-slate-100" />
      <div className="absolute top-0 left-0 w-10 h-10 rounded-full border-4 border-violet-600 border-t-transparent animate-spin" />
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
    <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-violet-600 uppercase tracking-wider">{getGreeting()}</p>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Welcome back, {user?.first_name || 'User'}
          </h1>
          <p className="text-slate-500 font-medium">{today}</p>
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
    violet: 'text-violet-600 bg-violet-50 border-violet-100',
    blue:   'text-blue-600 bg-blue-50 border-blue-100',
    emerald:'text-emerald-600 bg-emerald-50 border-emerald-100',
    rose:   'text-rose-600 bg-rose-50 border-rose-100',
    amber:  'text-amber-600 bg-amber-50 border-amber-100',
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
  };

  return (
    <div
      onClick={onClick}
      className={`group bg-white border border-slate-200 rounded-2xl p-6 transition-all duration-200 hover:border-violet-300 hover:shadow-md ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${themes[color]}`}>
            {icon}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
            <h3 className="text-2xl font-bold text-slate-900">{value ?? '—'}</h3>
            {sub && <p className="text-xs font-medium text-slate-400 mt-1">{sub}</p>}
          </div>
        </div>
        {badge > 0 && (
          <span className="px-2 py-1 rounded-lg bg-rose-500 text-white text-[10px] font-bold">
            {badge}
          }
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Students" value={data?.total_students} sub="Enrolled"
          color="blue" onClick={() => navigate('/student-management')}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
        />
        <StatCard
          label="Faculty Members" value={data?.total_teachers} sub="Verified"
          color="emerald" onClick={() => navigate('/teachers')}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <StatCard
          label="Classrooms" value={data?.total_classes} sub="Active Sections"
          color="violet" onClick={() => navigate('/class-management')}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
        />
        <StatCard
          label="Subject List" value={data?.total_subjects} sub="Curriculum"
          color="indigo" onClick={() => navigate('/subjects')}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Academic Performance */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Academic Performance</h3>
              <p className="text-slate-500 font-medium text-sm">School-wide metrics</p>
            </div>
            <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
              <button
                onClick={() => setDistView('general_average')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${distView === 'general_average' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                GA
              </button>
              <button
                onClick={() => setDistView('all_subjects')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${distView === 'all_subjects' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-4 space-y-4">
              <div className="p-6 bg-violet-600 rounded-2xl text-white">
                <p className="text-xs font-semibold text-violet-100 uppercase tracking-wider mb-2">Average Grade</p>
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-bold leading-none">{data?.average_grade ?? '—'}</span>
                  <span className="text-xs font-medium bg-white/20 px-2 py-0.5 rounded">
                    {(data?.average_grade ?? 0) >= 75 ? 'Passing' : 'Critical'}
                  </span>
                </div>
              </div>
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Entries</p>
                <p className="text-xl font-bold text-slate-800">{data?.total_grades || 0}</p>
              </div>
            </div>

            <div className="md:col-span-8 space-y-4">
              {[
                { label: 'Outstanding', range: '90–100', pct: dist?.outstanding_pct, color: 'bg-emerald-500' },
                { label: 'Very Satisfactory', range: '85–89', pct: dist?.very_satisfactory_pct || 0, color: 'bg-blue-500' },
                { label: 'Satisfactory', range: '80–84', pct: dist?.satisfactory_pct || 0, color: 'bg-violet-500' },
                { label: 'Fairly Satisfactory', range: '75–79', pct: dist?.fairly_satisfactory_pct || 0, color: 'bg-amber-500' },
                { label: 'Did Not Meet', range: 'Below 75', pct: dist?.below_75_pct, color: 'bg-rose-500' },
              ].map(row => (
                <div key={row.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-700 uppercase">{row.label} <span className="text-slate-400 normal-case ml-1">({row.range})</span></span>
                    <span className="font-bold text-slate-900">{row.pct}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-700 rounded-full ${row.color}`}
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Side Section: Attendance */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Today's Attendance</h3>
            
            {data?.today_total === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <p className="text-sm font-medium">No records today</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-center py-4">
                  <div className="text-center">
                    <span className={`text-5xl font-bold ${(data?.today_rate ?? 0) >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {data?.today_rate ?? 0}%
                    </span>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-2">Presence Rate</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                    <div className="text-xl font-bold text-emerald-700">{data?.today_present ?? 0}</div>
                    <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Present</div>
                  </div>
                  <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
                    <div className="text-xl font-bold text-rose-700">{data?.today_absent ?? 0}</div>
                    <div className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mt-1">Absent</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Quick Portal</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Grade Input',       path: '/grade-input' },
                { label: 'Attendance',        path: '/attendance' },
                { label: 'Announcements',     path: '/announcements' },
                { label: 'Classes',           path: '/class-management' },
              ].map(a => (
                <button
                  key={a.path}
                  onClick={() => navigate(a.path)}
                  className="p-3 text-left bg-slate-50 rounded-xl border border-slate-100 hover:bg-violet-50 hover:border-violet-200 transition-all"
                >
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Announcements */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Announcements</h3>
            <p className="text-slate-500 font-medium text-sm">Latest updates and news</p>
          </div>
          <Link to="/announcements" className="text-sm font-bold text-violet-600 hover:text-violet-700">View All</Link>
        </div>
        {!data?.recent_announcements?.length ? (
          <p className="text-center py-10 text-slate-400 font-medium italic">No recent announcements</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.recent_announcements.slice(0, 3).map(a => (
              <div key={a.id} className="p-6 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-violet-200 transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold text-violet-600 uppercase tracking-widest">{new Date(a.created_at).toLocaleDateString()}</span>
                  {a.priority === 'critical' && <span className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-rose-100 text-rose-600">Critical</span>}
                </div>
                <h4 className="font-bold text-slate-900 mb-2 line-clamp-1">{a.title}</h4>
                <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{a.content}</p>
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
          <h3 className="text-lg font-bold text-slate-900 mb-6">Assigned Classes</h3>
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
  const monthAtt = attendance.filter(r => r.date?.startsWith(thisMonth));
  const presentCount = monthAtt.filter(r => ['present', 'late'].includes(r.status)).length;
  const attRate = monthAtt.length > 0 ? Math.round((presentCount / monthAtt.length) * 100) : null;

  const finalGrades = grades.filter(g => g.grade_type === 'final_grade' && g.raw_score != null);
  const overallAvg = finalGrades.length > 0
    ? (finalGrades.reduce((s, g) => s + parseFloat(g.raw_score), 0) / finalGrades.length).toFixed(2)
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

export default Dashboard;
