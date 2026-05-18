import { getUser } from '../utils/auth';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

// ─── Shared helpers ───────────────────────────────────────────────────────────

const Spinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
  </div>
);

const StatCard = ({ label, value, sub, icon, color = 'purple', onClick, badge }) => {
  const colors = {
    purple: 'bg-violet-50 text-violet-600 border-violet-100 shadow-violet-100/50',
    blue:   'bg-blue-50 text-blue-600 border-blue-100 shadow-blue-100/50',
    green:  'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-100/50',
    amber:  'bg-amber-50 text-amber-600 border-amber-100 shadow-amber-100/50',
    red:    'bg-rose-50 text-red-600 border-rose-100 shadow-rose-100/50',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100 shadow-indigo-100/50',
  };
  return (
    <div
      onClick={onClick}
      className={`group bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex items-center gap-5 transition-all duration-300 ${onClick ? 'cursor-pointer hover:border-violet-300 hover:shadow-xl hover:shadow-violet-500/5 hover:-translate-y-1' : ''}`}
    >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 group-hover:rotate-3 ${colors[color]}`}>
        <div className="w-6 h-6">{icon}</div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-3xl font-black text-slate-900 mt-1 tabular-nums tracking-tight">{value ?? '—'}</p>
        {sub && <p className="text-xs text-slate-500 mt-1 font-medium truncate">{sub}</p>}
      </div>
      {badge > 0 && (
        <span className="flex-shrink-0 w-7 h-7 rounded-xl bg-rose-500 text-white text-xs font-black flex items-center justify-center shadow-lg shadow-rose-500/20">
          {badge}
        </span>
      )}
    </div>
  );
};

const ProgressBar = ({ value, color = 'bg-purple-500' }) => (
  <div className="w-full bg-gray-100 rounded-full h-2">
    <div className={`h-2 rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
  </div>
);

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────

const AdminView = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [distView, setDistView] = useState('general_average'); // Default to General Average

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
    <div className="space-y-10 pb-12">

      {/* Welcome banner */}
      <div className="bg-slate-900 rounded-[3rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-violet-600/20 rounded-full blur-[100px] group-hover:bg-violet-600/30 transition-all duration-1000" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-indigo-600/20 rounded-full blur-[80px] group-hover:bg-indigo-600/30 transition-all duration-1000" />
        
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-black leading-[1.1] tracking-tight">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
                {user?.first_name || 'Admin'}
              </span> 👋
            </h1>
            <p className="text-slate-400 text-lg mt-6 font-medium max-w-md leading-relaxed">
              Welcome back to the portal. Here's a quick look at what's happening in Kiwalan NHS today.
            </p>
            <div className="flex items-center gap-2 mt-8 py-2 px-4 bg-white/5 border border-white/10 rounded-2xl w-fit backdrop-blur-md">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
              <p className="text-xs font-black text-slate-300 uppercase tracking-widest">{today}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 shrink-0">
            {data?.pending_approvals > 0 && (
              <button
                onClick={() => navigate('/account-approvals')}
                className="flex items-center justify-center gap-3 bg-amber-500 hover:bg-amber-600 text-white text-sm font-black px-8 py-4 rounded-2xl transition-all shadow-xl shadow-amber-500/20 active:scale-95"
              >
                <span className="w-6 h-6 rounded-lg bg-white/20 text-white text-xs font-black flex items-center justify-center backdrop-blur-md">
                  {data?.pending_approvals ?? 0}
                </span>
                Review Approvals
              </button>
            )}
            <button
              onClick={() => navigate('/announcements')}
              className="bg-white text-slate-900 hover:bg-slate-100 text-sm font-black px-8 py-4 rounded-2xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              New Post
            </button>
          </div>
        </div>
      </div>

      {/* Core stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Students" value={data?.total_students} sub="Active enrollments"
          color="blue" onClick={() => navigate('/student-management')}
          icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
        />
        <StatCard
          label="Active Faculty" value={data?.total_teachers} sub="Assigned teachers"
          color="green" onClick={() => navigate('/teachers')}
          icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <StatCard
          label="Classrooms" value={data?.total_classes} sub="Current sections"
          color="purple" onClick={() => navigate('/class-management')}
          icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
        />
        <StatCard
          label="Subjects" value={data?.total_subjects} sub="Academic courses"
          color="indigo" onClick={() => navigate('/subjects')}
          icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
        />
      </div>

      {/* Action alerts */}
      {(data?.pending_approvals > 0 || data?.pending_enrollments > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data?.pending_approvals > 0 && (
            <button onClick={() => navigate('/account-approvals')} className="flex items-center gap-5 bg-amber-50 border-2 border-amber-100 rounded-[2rem] p-6 text-left hover:bg-amber-100 transition-all group active:scale-[0.98]">
              <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/20 group-hover:rotate-6 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <div>
                <p className="font-black text-amber-900 text-lg leading-tight">{data?.pending_approvals ?? 0} Accounts Pending</p>
                <p className="text-amber-700 font-medium mt-1">New user registration requests need review</p>
              </div>
            </button>
          )}
          {data?.pending_enrollments > 0 && (
            <button onClick={() => navigate('/enrollment-management')} className="flex items-center gap-5 bg-blue-50 border-2 border-blue-100 rounded-[2rem] p-6 text-left hover:bg-blue-100 transition-all group active:scale-[0.98]">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-600/20 group-hover:rotate-6 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              </div>
              <div>
                <p className="font-black text-blue-900 text-lg leading-tight">{data?.pending_enrollments ?? 0} Enrollments</p>
                <p className="text-blue-700 font-medium mt-1">New student applications waiting for processing</p>
              </div>
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Attendance today */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm p-8 transition-all hover:shadow-xl hover:shadow-slate-200/50">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Today's Attendance</h3>
            <Link to="/attendance" className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-violet-600 hover:bg-violet-600 hover:text-white transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
          </div>
          {data?.today_total === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8l2 2 4-4" /></svg>
              </div>
              <p className="text-slate-400 font-bold">No records yet</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center mb-8">
                <div className="relative w-40 h-40">
                  <svg className="w-40 h-40 -rotate-90" viewBox="0 0 36 36">
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
            </>
          )}
        </div>

        {/* Grade distribution */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm p-8 transition-all hover:shadow-xl hover:shadow-slate-200/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Academic Performance</h3>
            <div className="flex items-center gap-3">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={(e) => { e.stopPropagation(); setDistView('general_average'); }}
                  className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${distView === 'general_average' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Gen. Avg
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setDistView('all_subjects'); }}
                  className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${distView === 'all_subjects' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  All Subjects
                </button>
              </div>
              <button
                onClick={() => navigate('/grade-distribution')}
                className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-violet-50 hover:text-violet-600 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </button>
            </div>
          </div>
          
          {data?.total_grades === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <p className="text-slate-400 font-bold">No grades recorded yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Left Side: Large Stats */}
              <div className="md:col-span-5 space-y-6">
                <div className="p-8 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-[2rem] text-white shadow-xl shadow-violet-200">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-200 opacity-80">
                    {distView === 'general_average' ? 'School Average' : 'Subject Average'}
                  </p>
                  <div className="flex items-end gap-3 mt-4">
                    <span className="text-6xl font-black leading-none">{data?.average_grade ?? '—'}</span>
                    <div className={`mb-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/20 backdrop-blur-md`}>
                      {(data?.average_grade ?? 0) >= 90 ? 'Outstanding' : (data?.average_grade ?? 0) >= 75 ? 'Passing' : 'Critical'}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recorded</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">{data?.total_grades}</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Evaluated</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">{data?.total_students}</p>
                  </div>
                </div>
              </div>

              {/* Right Side: Distribution Bars */}
              <div className="md:col-span-7 space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Grade Distribution</p>
                {dist && Object.entries(dist).reverse().map(([range, count]) => {
                  const percentage = data.total_grades > 0 ? (count / data.total_grades) * 100 : 0;
                  const rangeColors = {
                    '90-100': 'bg-emerald-500 shadow-emerald-100',
                    '85-89':  'bg-blue-500 shadow-blue-100',
                    '80-84':  'bg-violet-500 shadow-violet-100',
                    '75-79':  'bg-amber-500 shadow-amber-100',
                    'Below 75': 'bg-rose-500 shadow-rose-100'
                  };
                  return (
                    <div key={range} className="space-y-2">
                      <div className="flex justify-between text-xs font-black text-slate-600 uppercase tracking-tighter">
                        <span>{range}</span>
                        <span className="text-slate-400">{count} students ({Math.round(percentage)}%)</span>
                      </div>
                      <div className="h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                        <div
                          className={`h-full transition-all duration-1000 rounded-full ${rangeColors[range] || 'bg-slate-300'}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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
  const [announcements, setAnnouncements] = useState([]);
  const [recentGrades, setRecentGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/teacher/stats/'),
      api.get('/classrooms/'),
      api.get('/announcements/'),
      api.get('/grades/'),
    ]).then(([statsRes, clsRes, annRes, gradeRes]) => {
      setStats(statsRes.data);
      setClassrooms(clsRes.data);
      setAnnouncements(annRes.data.slice(0, 3));
      setRecentGrades(gradeRes.data.slice(0, 5));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-[#2D1B4D] to-[#4B2D7F] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-700" />
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-purple-400/10 rounded-full blur-xl group-hover:bg-purple-400/20 transition-all duration-700" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-black !text-white leading-tight">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
              <span className="!text-white">
                {user?.profile?.title ? `${user.profile.title} ` : ''}
                {user?.first_name || 'Teacher'}
              </span> 👋
            </h1>
            <p className="text-purple-200 text-sm md:text-base mt-2 font-medium opacity-90">{today}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button onClick={() => navigate('/attendance')} className="bg-white/20 hover:bg-white/30 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-all backdrop-blur-sm active:scale-95 border border-white/10">
              Mark Attendance
            </button>
            <button onClick={() => navigate('/grade-input')} className="bg-white/20 hover:bg-white/30 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-all backdrop-blur-sm active:scale-95 border border-white/10">
              Input Grades
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard label="My Classes" value={stats?.total_classes || 0} sub="Assigned classrooms" color="purple"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
          onClick={() => navigate('/grade-management')}
        />
        <StatCard label="Students" value={stats?.total_students || 0} sub="Across all classes" color="blue"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
        />
        <StatCard label="Grade Entries" value={stats?.total_grades || 0} sub="Recorded grades" color="green"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
          onClick={() => navigate('/grade-management')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My classrooms */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">My Classrooms</h3>
            <Link to="/grade-management" className="text-xs text-purple-600 hover:text-purple-700 font-medium">View all →</Link>
          </div>
          {classrooms.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No classrooms assigned yet.</div>
          ) : (
            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200">
              {classrooms.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-purple-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                      {c.name.match(/\d+/)?.[0] || c.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800 text-sm">{c.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">{c.student_count || 0} students</span>
                    <button onClick={() => navigate('/attendance')} className="text-xs text-purple-600 hover:text-purple-700 font-medium">Attend</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Mark Attendance',    path: '/attendance',        icon: '📋' },
                  { label: 'Input Grades',       path: '/grade-input',       icon: '✏️' },
                  { label: 'Grade Management',   path: '/grade-management',  icon: '📊' },
                  { label: 'Announcements',      path: '/announcements',     icon: '📢' },
                  { label: 'Learning Materials', path: '/materials',         icon: '📁' },
                  { label: 'My Profile',         path: '/profile',           icon: '👤' },
                ].map(a => (
              <button key={a.path} onClick={() => navigate(a.path)}
                className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-300 rounded-xl transition-all text-left">
                <span className="text-lg">{a.icon}</span>
                <span className="text-xs font-medium text-gray-700">{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Announcements */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Announcements</h3>
          <Link to="/announcements" className="text-xs text-purple-600 hover:text-purple-700 font-medium">View all →</Link>
        </div>
        {announcements.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-sm">No announcements.</div>
        ) : (
          <div className="space-y-3">
            {announcements.map(a => (
              <div key={a.id} className={`p-3 rounded-lg border-l-4 bg-gray-50 ${a.priority === 'critical' ? 'border-red-500' : 'border-purple-400'}`}>
                <div className="flex items-center gap-2">
                  {a.is_pinned && <span className="text-xs">📌</span>}
                  <span className="font-semibold text-gray-800 text-sm">{a.title}</span>
                  {a.priority === 'critical' && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Critical</span>}
                </div>
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{a.content}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(a.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
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
      setAnnouncements(annRes.data.slice(0, 10)); // Increased limit to allow scrolling
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  // Attendance this month
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthAtt = attendance.filter(r => r.date?.startsWith(thisMonth));
  const presentCount = monthAtt.filter(r => ['present', 'late'].includes(r.status)).length;
  const absentCount  = monthAtt.filter(r => r.status === 'absent').length;
  const attRate = monthAtt.length > 0 ? Math.round((presentCount / monthAtt.length) * 100) : null;

  // Latest final grades — use raw_score (no transmutation)
  const finalGrades = grades.filter(g => g.grade_type === 'final_grade' && g.raw_score != null);
  const overallAvg = finalGrades.length > 0
    ? (finalGrades.reduce((s, g) => s + parseFloat(g.raw_score), 0) / finalGrades.length).toFixed(2)
    : null;

  const name = user?.first_name && user?.last_name
    ? `${user.profile?.title ? user.profile.title + ' ' : ''}${user.first_name} ${user.last_name}`.trim()
    : user?.username;

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-[#2D1B4D] to-[#4B2D7F] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-700" />
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-purple-400/10 rounded-full blur-xl group-hover:bg-purple-400/20 transition-all duration-700" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-black !text-white leading-tight">
              Welcome back, <span className="!text-white">
                {user?.profile?.title ? `${user.profile.title} ` : ''}
                {user?.first_name || 'Student'}
              </span> 👋
            </h1>
            <p className="text-purple-200 text-sm md:text-base mt-2 font-medium opacity-90">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button onClick={() => navigate('/student-grades')}
              className="bg-white/20 hover:bg-white/30 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-all backdrop-blur-sm active:scale-95 border border-white/10">
              My Grades
            </button>
            <button onClick={() => navigate('/attendance')}
              className="bg-white/20 hover:bg-white/30 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-all backdrop-blur-sm active:scale-95 border border-white/10">
              Attendance
            </button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex items-center gap-4 cursor-pointer hover:border-purple-300 transition-all"
          onClick={() => navigate('/student-grades')}>
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">General Average</p>
            <p className="text-2xl font-bold text-gray-800 mt-0.5">{overallAvg ?? '—'}</p>
            <p className="text-xs text-gray-500 mt-0.5">{finalGrades.length} subject{finalGrades.length !== 1 ? 's' : ''} graded</p>
          </div>
        </div>

        <div className={`bg-white border rounded-xl shadow-sm p-5 flex items-center gap-4 cursor-pointer hover:border-purple-300 transition-all ${attRate !== null && attRate < 75 ? 'border-red-200' : 'border-gray-200'}`}
          onClick={() => navigate('/attendance')}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${attRate !== null && attRate < 75 ? 'bg-red-100' : 'bg-green-100'}`}>
            <svg className={`w-6 h-6 ${attRate !== null && attRate < 75 ? 'text-red-600' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8l2 2 4-4" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Attendance Rate</p>
            <p className={`text-2xl font-bold mt-0.5 ${attRate !== null && attRate < 75 ? 'text-red-600' : 'text-gray-800'}`}>
              {attRate !== null ? `${attRate}%` : '—'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{presentCount} present · {absentCount} absent this month</p>
          </div>
        </div>

        <div className={`bg-white border rounded-xl shadow-sm p-5 flex items-center gap-4 ${absentCount > 3 ? 'border-red-200' : 'border-gray-200'}`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${absentCount > 3 ? 'bg-red-100' : 'bg-amber-100'}`}>
            <svg className={`w-6 h-6 ${absentCount > 3 ? 'text-red-600' : 'text-amber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Absences</p>
            <p className={`text-2xl font-bold mt-0.5 ${absentCount > 3 ? 'text-red-600' : 'text-gray-800'}`}>{absentCount}</p>
            <p className="text-xs text-gray-500 mt-0.5">This month</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent final grades */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Recent Final Grades</h3>
            <Link to="/student-grades" className="text-xs text-purple-600 hover:text-purple-700 font-medium">View all →</Link>
          </div>
          {finalGrades.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No grades recorded yet.</div>
          ) : (
            <div className="space-y-2">
              {finalGrades.slice(0, 6).map(g => {
                const score = parseFloat(g.raw_score);
                const color = score >= 90 ? 'text-green-700 bg-green-50 border-green-200'
                  : score >= 85 ? 'text-blue-700 bg-blue-50 border-blue-200'
                  : score >= 80 ? 'text-yellow-700 bg-yellow-50 border-yellow-200'
                  : score >= 75 ? 'text-orange-700 bg-orange-50 border-orange-200'
                  : 'text-red-700 bg-red-50 border-red-200';
                return (
                  <div key={g.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-purple-50 transition-colors">
                    <div>
                      <div className="font-semibold text-gray-800 text-sm">{g.subject_name}</div>
                      <div className="text-xs text-gray-400">Q{g.quarter} · {g.subject_code}</div>
                    </div>
                    <span className={`px-3 py-1 rounded-lg border text-sm font-bold ${color}`}>{score}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Announcements + quick links */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">Announcements</h3>
              <Link to="/announcements" className="text-xs text-purple-600 hover:text-purple-700 font-medium">All →</Link>
            </div>
            {announcements.length === 0 ? (
              <div className="text-center py-4 text-gray-400 text-sm">No announcements.</div>
            ) : (
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200">
                {announcements.map(a => (
                  <div key={a.id} className={`p-3 rounded-lg border-l-4 bg-gray-50 ${a.priority === 'critical' ? 'border-red-500' : 'border-purple-400'}`}>
                    <div className="flex items-center gap-1.5">
                      {a.is_pinned && <span className="text-xs">📌</span>}
                      <span className="font-semibold text-gray-800 text-sm">{a.title}</span>
                      {a.priority === 'critical' && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">Critical</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(a.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Quick Links</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'My Grades',    path: '/student-grades',   icon: '📊' },
                { label: 'Attendance',   path: '/attendance',       icon: '📋' },
                { label: 'My Subjects',  path: '/register-subjects',icon: '📚' },
                { label: 'Grade Report', path: '/grade-reports',    icon: '📄' },
                { label: 'My Classroom', path: '/class-members',    icon: '🏫' },
                { label: 'Calendar',     path: '/calendar',         icon: '📅' },
              ].map(a => (
                <button key={a.path} onClick={() => navigate(a.path)}
                  className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-300 rounded-xl transition-all text-left">
                  <span className="text-lg">{a.icon}</span>
                  <span className="text-xs font-medium text-gray-700">{a.label}</span>
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
  if (user?.role === 'admin')   return <AdminView />;
  if (user?.role === 'teacher') return <TeacherView />;
  return <StudentView />;
};

export default Dashboard;
