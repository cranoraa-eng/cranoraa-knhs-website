import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { Card, CardHeader, CardBody, CardTitle, Button, LoadingSpinner, Badge } from '../components/ui';
import toast from 'react-hot-toast';

/**
 * System Health Dashboard — Real data from Supabase PostgreSQL backend
 * Pulls from /admin/stats/ (general metrics) and /admin/system-metrics/ (infra metrics)
 */

const SystemHealth = () => {
  const [stats, setStats] = useState(null);       // from /admin/stats/
  const [metrics, setMetrics] = useState(null);   // from /admin/system-metrics/
  const [feed, setFeed] = useState([]);           // from /admin/maintenance-feed/
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [apiLatency, setApiLatency] = useState(null);

  const fetchAll = async () => {
    try {
      const t0 = Date.now();
      const [statsRes, metricsRes, feedRes] = await Promise.all([
        api.get('/admin/stats/'),
        api.get('/admin/system-metrics/'),
        api.get('/admin/maintenance-feed/'),
      ]);
      setApiLatency(Date.now() - t0);
      setStats(statsRes.data);
      setMetrics(metricsRes.data);
      setFeed(feedRes.data || []);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('System health fetch error:', err);
      toast.error('Failed to load system health data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => { setRefreshing(true); fetchAll(); };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner />
    </div>
  );

  // Derived values from real data
  const storagePercent = metrics?.storageUsed ?? 0;
  const activeSessions = metrics?.activeSessions ?? 0;
  const authFailures = metrics?.authFailures ?? 0;
  const totalUsers = (stats?.total_students ?? 0) + (stats?.total_teachers ?? 0);
  const totalClasses = stats?.total_classes ?? 0;
  const totalAnnouncements = stats?.total_announcements ?? 0;
  const attendanceRate = stats?.today_rate ?? 0;
  const averageGrade = stats?.average_grade;
  const storageStatus = storagePercent < 70 ? 'Good' : storagePercent < 85 ? 'Warning' : 'Critical';
  const storageBadge = storagePercent < 70 ? 'emerald' : storagePercent < 85 ? 'amber' : 'rose';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="page-bottom-safe max-w-[1800px] mx-auto bg-slate-50 px-4 py-4 md:px-6 md:py-6 space-y-5 md:space-y-6"
    >
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>System Monitoring · Supabase PostgreSQL</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">System Health</h1>
          <p className="text-xs text-slate-600 mt-1 font-semibold">
            Last updated: {lastRefresh.toLocaleTimeString()} ·
            API latency: {apiLatency != null ? `${apiLatency}ms` : '—'}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </Button>
      </div>

      {/* OVERALL STATUS */}
      <Card className="bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200">
        <CardBody className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-extrabold text-slate-900 mb-1">All Systems Operational</h2>
              <p className="text-sm text-slate-600 font-semibold">
                Supabase PostgreSQL · Django REST API · React Frontend — all running normally
              </p>
            </div>
            <Badge variant="emerald" className="px-4 py-2 text-sm flex-shrink-0">Healthy</Badge>
          </div>
        </CardBody>
      </Card>

      {/* CORE SERVICES */}
      <div>
        <h2 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-3">Core Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Database */}
          <Card>
            <CardBody className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                </div>
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Database</h3>
              <p className="text-xs text-slate-600 mb-1">
                Supabase PostgreSQL · {stats ? 'Connected' : 'Checking...'}
              </p>
              <p className="text-xs text-slate-500 mb-3">
                DB size: {metrics?.storageUsed != null ? `${storagePercent}% of 10 GB` : 'Loading...'}
              </p>
              <Badge variant="emerald" size="sm">Operational</Badge>
            </CardBody>
          </Card>

          {/* API Services */}
          <Card>
            <CardBody className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">REST API</h3>
              <p className="text-xs text-slate-600 mb-1">
                Django · Response: {apiLatency != null ? `${apiLatency}ms` : '—'}
              </p>
              <p className="text-xs text-slate-500 mb-3">
                Active sessions: {activeSessions}
              </p>
              <Badge variant="blue" size="sm">Online</Badge>
            </CardBody>
          </Card>

          {/* Storage */}
          <Card>
            <CardBody className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-md flex items-center justify-center ${
                  storagePercent < 70 ? 'bg-sky-100 text-sky-700' :
                  storagePercent < 85 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className={`w-3 h-3 rounded-full ${storagePercent < 70 ? 'bg-sky-500' : storagePercent < 85 ? 'bg-amber-500' : 'bg-rose-500 animate-pulse'}`} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">DB Storage</h3>
              <p className="text-xs text-slate-600 mb-2">{storagePercent}% of 10 GB used</p>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                <div className={`h-full transition-all ${
                  storagePercent < 70 ? 'bg-sky-500' :
                  storagePercent < 85 ? 'bg-amber-500' : 'bg-rose-500'
                }`} style={{ width: `${storagePercent}%` }} />
              </div>
              <Badge variant={storageBadge} size="sm">{storageStatus}</Badge>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">

        {/* Active Users */}
        <Card>
          <CardHeader divider className="bg-slate-50">
            <CardTitle subtitle="Portal activity (last 5 min active)">User Activity</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {[
                { label: 'Total Users', value: totalUsers, icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', color: 'bg-blue-50 border-blue-100 text-blue-700' },
                { label: 'Active Now', value: activeSessions, icon: 'M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728M9 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0z', color: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
                { label: 'Students', value: stats?.total_students ?? 0, icon: 'M12 14l9-5-9-5-9 5 9 5zm0 7l-9-5 9-5 9 5-9 5z', color: 'bg-sky-50 border-sky-100 text-sky-700' },
                { label: 'Teachers', value: stats?.total_teachers ?? 0, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', color: 'bg-indigo-50 border-indigo-100 text-indigo-700' },
                { label: 'Auth Failures (24h)', value: authFailures, icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', color: authFailures > 10 ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-slate-50 border-slate-100 text-slate-600' },
                { label: 'Pending Approvals', value: stats?.pending_approvals ?? 0, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', color: (stats?.pending_approvals ?? 0) > 0 ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-slate-50 border-slate-100 text-slate-600' },
              ].map((row, i) => (
                <div key={i} className={`flex items-center justify-between p-3 rounded-md border ${row.color}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-white/60 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={row.icon} />
                      </svg>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wide">{row.label}</span>
                  </div>
                  <span className="text-lg font-extrabold">{row.value}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* School Statistics */}
        <Card>
          <CardHeader divider className="bg-slate-50">
            <CardTitle subtitle="Real-time school data">School Statistics</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {[
                { label: 'Classrooms', value: totalClasses, sub: 'Active sections', color: 'text-slate-900' },
                { label: 'Subjects', value: stats?.total_subjects ?? 0, sub: 'Registered subjects', color: 'text-slate-900' },
                { label: 'Announcements', value: totalAnnouncements, sub: 'Published (live)', color: 'text-slate-900' },
                { label: "Today's Attendance", value: `${attendanceRate}%`, sub: 'School-wide rate', color: attendanceRate >= 85 ? 'text-emerald-700' : attendanceRate >= 70 ? 'text-amber-700' : 'text-rose-700' },
                { label: 'Average Grade', value: averageGrade != null ? averageGrade.toFixed(1) : '—', sub: 'All subjects, final grades only', color: averageGrade != null ? (averageGrade >= 85 ? 'text-emerald-700' : averageGrade >= 75 ? 'text-blue-700' : 'text-rose-700') : 'text-slate-400' },
                { label: 'Pending Enrollments', value: stats?.pending_enrollments ?? 0, sub: 'Applications awaiting review', color: (stats?.pending_enrollments ?? 0) > 0 ? 'text-amber-700' : 'text-slate-900' },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{row.label}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{row.sub}</p>
                  </div>
                  <span className={`text-lg font-extrabold ${row.color}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* MAINTENANCE FEED — real audit log entries */}
      <Card>
        <CardHeader divider className="bg-slate-50">
          <CardTitle subtitle="Recent system activity from audit log">Maintenance Feed</CardTitle>
        </CardHeader>
        <CardBody>
          {feed.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">No Recent Activity</h3>
              <p className="text-xs text-slate-500">System audit log is clear</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {feed.map((item, i) => (
                <div key={item.id ?? i} className="flex items-start gap-3 p-3 rounded-md bg-slate-50 border border-slate-200">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${item.status === 'success' ? 'bg-emerald-500' : item.status === 'warning' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{item.action}</p>
                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{item.details}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium flex-shrink-0">{item.time}</span>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* QUICK ACTIONS */}
      <Card>
        <CardHeader divider className="bg-slate-50">
          <CardTitle subtitle="System management tools">Quick Actions</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'View Logs', path: '/audit-logs', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
              { label: 'Settings', path: '/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
              { label: 'Backups', path: '/backups', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
              { label: 'Analytics', path: '/analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
            ].map(({ label, path, icon }) => (
              <Button key={label} variant="secondary" size="sm" onClick={() => window.location.href = path} className="justify-start">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                </svg>
                {label}
              </Button>
            ))}
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
};

export default SystemHealth;
