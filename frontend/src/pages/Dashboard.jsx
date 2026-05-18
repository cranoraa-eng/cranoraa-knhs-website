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
    purple: 'bg-purple-100 text-purple-600',
    blue:   'bg-blue-100 text-blue-600',
    green:  'bg-green-100 text-green-600',
    amber:  'bg-amber-100 text-amber-600',
    red:    'bg-red-100 text-red-600',
    indigo: 'bg-indigo-100 text-indigo-600',
  };
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-gray-200 rounded-xl p-4 md:p-5 shadow-sm flex items-center gap-3 md:gap-4 ${onClick ? 'cursor-pointer hover:border-purple-300 hover:shadow-md transition-all active:scale-[0.98]' : ''}`}
    >
      <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] md:text-xs font-semibold text-gray-400 uppercase tracking-wider truncate">{label}</p>
        <p className="text-xl md:text-2xl font-bold text-gray-800 mt-0.5">{value ?? '—'}</p>
        {sub && <p className="text-[10px] md:text-xs text-gray-500 mt-0.5 truncate">{sub}</p>}
      </div>
      {badge > 0 && (
        <span className="flex-shrink-0 w-5 h-5 md:w-6 md:h-6 rounded-full bg-red-500 text-white text-[10px] md:text-xs font-bold flex items-center justify-center animate-pulse">
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
    <div className="space-y-6">

      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-[#2D1B4D] to-[#4B2D7F] rounded-2xl p-5 md:p-8 text-white shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-700" />
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-purple-400/10 rounded-full blur-xl group-hover:bg-purple-400/20 transition-all duration-700" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-xl md:text-3xl font-black !text-white leading-tight">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
              <span className="!text-white">{user?.first_name || 'Admin'}</span> 👋
            </h1>
            <p className="text-purple-200 text-xs md:text-sm mt-1.5 md:mt-2 font-medium opacity-90">{today}</p>
          </div>
          <div className="grid grid-cols-2 md:flex md:flex-row gap-2.5 w-full md:w-auto">
            {data?.pending_approvals > 0 && (
              <button
                onClick={() => navigate('/account-approvals')}
                className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-[11px] md:text-sm font-bold px-3 md:px-6 py-2.5 rounded-xl transition-all shadow-md active:scale-95"
              >
                <span className="hidden sm:inline-flex w-5 h-5 rounded-full bg-white text-amber-600 text-[10px] font-black items-center justify-center">
                  {data?.pending_approvals ?? 0}
                </span>
                <span className="sm:hidden">{data?.pending_approvals}</span>
                Approvals
              </button>
            )}
            <button
              onClick={() => navigate('/announcements')}
              className="bg-white/20 hover:bg-white/30 text-white text-[11px] md:text-sm font-bold px-3 md:px-6 py-2.5 rounded-xl transition-all backdrop-blur-sm active:scale-95 border border-white/10"
            >
              + Post News
            </button>
          </div>
        </div>
      </div>

      {/* Core stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Students" value={data?.total_students} sub="Manage all accounts"
          color="blue" onClick={() => navigate('/student-management')}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
        />
        <StatCard
          label="Teachers" value={data?.total_teachers} sub="Active faculty"
          color="green" onClick={() => navigate('/teachers')}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <StatCard
          label="Classrooms" value={data?.total_classes} sub="Active classes"
          color="purple" onClick={() => navigate('/class-management')}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
        />
        <StatCard
          label="Subjects" value={data?.total_subjects} sub="In curriculum"
          color="indigo" onClick={() => navigate('/subjects')}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
        />
      </div>

      {/* Action alerts */}
      {(data?.pending_approvals > 0 || data?.pending_enrollments > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data?.pending_approvals > 0 && (
            <button onClick={() => navigate('/account-approvals')} className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-left hover:bg-amber-100 transition-colors">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <div>
                <p className="font-semibold text-amber-800 text-sm">{data?.pending_approvals ?? 0} Account{(data?.pending_approvals ?? 0) !== 1 ? 's' : ''} Pending Approval</p>
                <p className="text-xs text-amber-600">Click to review and approve</p>
              </div>
            </button>
          )}
          {data?.pending_enrollments > 0 && (
            <button onClick={() => navigate('/enrollment-management')} className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 text-left hover:bg-blue-100 transition-colors">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              </div>
              <div>
                <p className="font-semibold text-blue-800 text-sm">{data?.pending_enrollments ?? 0} Enrollment Application{(data?.pending_enrollments ?? 0) !== 1 ? 's' : ''}</p>
                <p className="text-xs text-blue-600">Click to review</p>
              </div>
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance today */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Today's Attendance</h3>
            <Link to="/attendance" className="text-xs text-purple-600 hover:text-purple-700 font-medium">Mark →</Link>
          </div>
          {data?.today_total === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm">No attendance marked today yet.</div>
          ) : (
            <>
              <div className="flex items-center justify-center mb-4">
                <div className="relative w-28 h-28">
                  <svg className="w-28 h-28 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15.9" fill="none"
                      stroke={(data?.today_rate ?? 0) >= 75 ? '#16a34a' : '#ef4444'}
                      strokeWidth="3"
                      strokeDasharray={`${data?.today_rate ?? 0} ${100 - (data?.today_rate ?? 0)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-2xl font-bold ${(data?.today_rate ?? 0) >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                      {data?.today_rate ?? 0}%
                    </span>
                    <span className="text-xs text-gray-400">rate</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center text-sm">
                <div className="bg-green-50 rounded-lg p-2">
                  <div className="font-bold text-green-700">{data?.today_present ?? 0}</div>
                  <div className="text-xs text-green-600">Present</div>
                </div>
                <div className="bg-red-50 rounded-lg p-2">
                  <div className="font-bold text-red-700">{data?.today_absent ?? 0}</div>
                  <div className="text-xs text-red-600">Absent</div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Grade distribution */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Grade Distribution</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/grade-distribution')}
                className="text-[10px] text-purple-600 hover:text-purple-700 font-bold uppercase tracking-wider flex items-center gap-1"
              >
                Stats <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
              </button>
              <div className="flex bg-gray-100 p-0.5 rounded-lg ml-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setDistView('general_average'); }}
                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${distView === 'general_average' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  GA
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setDistView('all_subjects'); }}
                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${distView === 'all_subjects' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  ALL
                </button>
              </div>
            </div>
          </div>
          {data?.total_grades === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm">No grades recorded yet.</div>
          ) : (
            <div className="space-y-4">
              {/* Average grade with visual indicator */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
                <div>
                  <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                    {distView === 'general_average' ? 'School Average (GA)' : 'Subject Average'}
                  </p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{data?.average_grade ?? '—'}</p>
                </div>
                <div className="text-right">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    (data?.average_grade ?? 0) >= 90 ? 'bg-green-100 text-green-700' :
                    (data?.average_grade ?? 0) >= 75 ? 'bg-blue-100 text-blue-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {(data?.average_grade ?? 0) >= 90 ? 'Excellent' :
                     (data?.average_grade ?? 0) >= 75 ? 'Good' : 'Needs Improvement'}
                  </div>
                </div>
              </div>

              {/* Grade breakdown bars */}
              <div className="space-y-3">
                {[
                  { label: 'Outstanding', range: '90–100', pct: dist?.outstanding_pct, color: 'bg-green-500', bgLight: 'bg-green-50', text: 'text-green-700', min: 90, max: 100 },
                  { label: 'Very Satisfactory', range: '85–89', pct: dist?.very_satisfactory_pct || 0, color: 'bg-blue-500', bgLight: 'bg-blue-50', text: 'text-blue-700', min: 85, max: 89 },
                  { label: 'Satisfactory', range: '80–84', pct: dist?.satisfactory_pct || 0, color: 'bg-cyan-500', bgLight: 'bg-cyan-50', text: 'text-cyan-700', min: 80, max: 84 },
                  { label: 'Fairly Satisfactory', range: '75–79', pct: dist?.fairly_satisfactory_pct || 0, color: 'bg-amber-500', bgLight: 'bg-amber-50', text: 'text-amber-700', min: 75, max: 79 },
                  { label: 'Did Not Meet', range: 'Below 75', pct: dist?.below_75_pct, color: 'bg-red-500', bgLight: 'bg-red-50', text: 'text-red-700', min: 0, max: 74 },
                ].map(row => (
                  <button
                    key={row.label}
                    onClick={() => navigate(`/grade-management?minGrade=${row.min}&maxGrade=${row.max}`)}
                    className="w-full text-left transition-transform hover:scale-[1.02]"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-600">{row.label}</span>
                        <span className="text-xs text-gray-400">{row.range}</span>
                      </div>
                      <span className={`text-xs font-bold ${row.text}`}>{row.pct}%</span>
                    </div>
                    <div className="relative">
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className={`h-2 rounded-full transition-all duration-500 ${row.color}`} style={{ width: `${Math.min(row.pct, 100)}%` }} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Total count */}
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-400 text-center">
                  <span className="font-semibold text-gray-600">{dist?.total_count ?? 0}</span> {distView === 'general_average' ? 'students graded' : 'total grade entries'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Grade Input',       path: '/grade-input',          icon: '✏️' },
              { label: 'Attendance',        path: '/attendance',           icon: '📋' },
              { label: 'Announcements',     path: '/announcements',        icon: '📢' },
              { label: 'Approvals',         path: '/account-approvals',    icon: '✅', badge: data?.pending_approvals ?? 0 },
              { label: 'Enrollment Mgmt',   path: '/enrollment-management',icon: '📝', badge: data?.pending_enrollments ?? 0 },
              { label: 'Class Management',  path: '/class-management',     icon: '🏫' },
              { label: 'Grade Reports',     path: '/grade-reports',        icon: '📊' },
              { label: 'Audit Logs',        path: '/audit-logs',           icon: '🔍' },
            ].map(a => (
              <button
                key={a.path}
                onClick={() => navigate(a.path)}
                className="relative flex flex-col items-center gap-1 p-3 bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-300 rounded-xl transition-all text-center"
              >
                <span className="text-xl">{a.icon}</span>
                <span className="text-xs font-medium text-gray-700 leading-tight">{a.label}</span>
                {a.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                    {a.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent announcements */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Recent Announcements</h3>
          <Link to="/announcements" className="text-xs text-purple-600 hover:text-purple-700 font-medium">View all →</Link>
        </div>
        {!data?.recent_announcements?.length ? (
          <div className="text-center py-8 text-gray-400 text-sm">No announcements yet.</div>
        ) : (
          <div className="space-y-3">
            {(data?.recent_announcements || []).slice(0, 3).map(a => (
              <div key={a.id} className={`flex gap-3 p-3 rounded-lg border-l-4 bg-gray-50 ${a.priority === 'critical' ? 'border-red-500' : 'border-purple-400'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {a.is_pinned && <span className="text-purple-500 text-xs">📌</span>}
                    <span className="font-semibold text-gray-800 text-sm">{a.title}</span>
                    {a.priority === 'critical' && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">Critical</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">{a.content}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {a.author_name} · {new Date(a.created_at).toLocaleDateString()}
                  </p>
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
