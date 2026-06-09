import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import { getCurrentAcademicYear } from '../../utils/dateHelpers';
import { Card, CardHeader, CardBody, CardTitle, Button, LoadingSpinner, EmptyState, Badge } from '../../components/ui';
import { SchoolHeaderBanner, StatCard, RecentAnnouncementsWidget } from './shared';
import RoleManual from './RoleManual';

/**
 * Admin Dashboard - Enhanced DepEd Government Education Style
 * Comprehensive administrative overview with real-time metrics and system health
 */

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const academicYear = localStorage.getItem('knhs_academic_year') || getCurrentAcademicYear();
      const r = await api.get(`/admin/stats/?academic_year=${academicYear}`);
      setData(r.data);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const today = useMemo(() => 
    new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }), []
  );

  // Calculate critical metrics
  const criticalAlerts = useMemo(() => {
    if (!data) return [];
    const alerts = [];
    
    if ((data.pending_approvals || 0) > 0) {
      alerts.push({
        type: 'warning',
        title: 'Pending Approvals',
        message: `${data.pending_approvals} account${data.pending_approvals > 1 ? 's' : ''} awaiting approval`,
        action: () => navigate('/moderation'),
        actionLabel: 'Review Now'
      });
    }
    
    if ((data.pending_enrollments || 0) > 0) {
      alerts.push({
        type: 'info',
        title: 'New Enrollments',
        message: `${data.pending_enrollments} enrollment application${data.pending_enrollments > 1 ? 's' : ''}`,
        action: () => navigate('/enrollment-management'),
        actionLabel: 'View Applications'
      });
    }
    
    // Low attendance alert (if attendance rate < 85%)
    if (data.today_attendance_rate && data.today_attendance_rate < 85) {
      alerts.push({
        type: 'warning',
        title: 'Low Attendance',
        message: `Today's attendance is ${data.today_attendance_rate}% (below 85% threshold)`,
        action: () => navigate('/attendance'),
        actionLabel: 'View Details'
      });
    }
    
    return alerts;
  }, [data, navigate]);

  if (loading || !data) return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner />
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="page-bottom-safe max-w-[1800px] mx-auto min-h-0 bg-slate-50 px-4 py-4 md:px-6 md:py-6 space-y-5 md:space-y-6"
    >
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* OFFICIAL SCHOOL HEADER */}
      {/* ══════════════════════════════════════════════════════════════ */}
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-violet-700 uppercase tracking-wide mb-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Administrative Control</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-xs text-slate-600 mt-1 font-semibold">
            {today}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
        </div>
      </div>

      <RoleManual role="admin" />

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* CRITICAL ALERTS */}
      {/* ══════════════════════════════════════════════════════════════ */}

      {criticalAlerts.length > 0 && (
        <div className="space-y-3">
          {criticalAlerts.map((alert, idx) => (
            <Card 
              key={idx} 
              className={`border-l-4 ${
                alert.type === 'warning' ? 'border-l-amber-500 bg-amber-50' : 
                alert.type === 'error' ? 'border-l-red-500 bg-red-50' : 
                'border-l-violet-500 bg-violet-50'
              }`}
            >
              <CardBody className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 ${
                      alert.type === 'warning' ? 'bg-amber-100 text-amber-700' :
                      alert.type === 'error' ? 'bg-red-100 text-red-700' :
                      'bg-violet-100 text-violet-700'
                    }`}>
                      {alert.type === 'warning' ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      ) : alert.type === 'error' ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-extrabold mb-1 ${
                        alert.type === 'warning' ? 'text-amber-900' :
                        alert.type === 'error' ? 'text-red-900' :
                        'text-violet-900'
                      }`}>
                        {alert.title}
                      </p>
                      <p className={`text-xs ${
                        alert.type === 'warning' ? 'text-amber-700' :
                        alert.type === 'error' ? 'text-red-700' :
                        'text-violet-700'
                      }`}>
                        {alert.message}
                      </p>
                    </div>
                  </div>
                  {alert.action && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={alert.action}
                      className="flex-shrink-0"
                    >
                      {alert.actionLabel}
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* SCHOOL OVERVIEW METRICS */}
      {/* ══════════════════════════════════════════════════════════════ */}

      <div>
        <h2 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-3">School Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
          <StatCard 
            label="Total Students" 
            value={data?.total_students} 
            sub="Enrolled"
            icon={
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
            color="blue"
            onClick={() => navigate('/student-management')}
          />
          <StatCard 
            label="Faculty" 
            value={data?.total_teachers} 
            sub="Verified"
            icon={
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            color="emerald"
            onClick={() => navigate('/teachers')}
          />
          <StatCard 
            label="Classrooms" 
            value={data?.total_classes} 
            sub="Sections"
            icon={
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
            color="sky"
            onClick={() => navigate('/class-management')}
          />
          <StatCard 
            label="Announcements" 
            value={data?.total_announcements} 
            sub="Live"
            icon={
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            }
            color="amber"
            onClick={() => navigate('/announcements')}
          />
          <StatCard 
            label="Pending Approvals" 
            value={data?.pending_approvals || 0} 
            sub="Requires action"
            icon={
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
            color="rose"
            onClick={() => navigate('/moderation')}
            badge={data?.pending_approvals}
          />
          <StatCard 
            label="Enrollments" 
            value={data?.pending_enrollments || 0} 
            sub="Applications"
            icon={
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            color="slate"
            onClick={() => navigate('/enrollment-management')}
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* MAIN CONTENT GRID */}
      {/* ══════════════════════════════════════════════════════════════ */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
        {/* LEFT COLUMN - 2/3 width */}
        <div className="lg:col-span-2 space-y-5 md:space-y-6">
          
          {/* Quick Actions */}
          <Card>
            <CardHeader divider className="bg-slate-50">
              <CardTitle subtitle="Frequently used admin tools">Quick Actions</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={() => navigate('/student-management')}
                  className="h-auto flex flex-col items-center gap-3 py-5 px-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-violet-300 rounded-md transition-all group"
                >
                  <div className="w-12 h-12 rounded-md bg-violet-100 group-hover:bg-violet-200 text-violet-700 flex items-center justify-center transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-slate-900 text-center">Manage Students</span>
                </button>
                
                <button
                  onClick={() => navigate('/teachers')}
                  className="h-auto flex flex-col items-center gap-3 py-5 px-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-emerald-300 rounded-md transition-all group"
                >
                  <div className="w-12 h-12 rounded-md bg-emerald-100 group-hover:bg-emerald-200 text-emerald-700 flex items-center justify-center transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-slate-900 text-center">Manage Teachers</span>
                </button>

                <button
                  onClick={() => navigate('/class-management')}
                  className="h-auto flex flex-col items-center gap-3 py-5 px-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-sky-300 rounded-md transition-all group"
                >
                  <div className="w-12 h-12 rounded-md bg-sky-100 group-hover:bg-sky-200 text-sky-700 flex items-center justify-center transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-slate-900 text-center">Manage Classes</span>
                </button>

                <button
                  onClick={() => navigate('/analytics')}
                  className="h-auto flex flex-col items-center gap-3 py-5 px-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-300 rounded-md transition-all group"
                >
                  <div className="w-12 h-12 rounded-md bg-indigo-100 group-hover:bg-indigo-200 text-indigo-700 flex items-center justify-center transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-slate-900 text-center">View Analytics</span>
                </button>
              </div>
            </CardBody>
          </Card>

          {/* Academic Performance Summary */}
          <Card>
            <CardHeader divider className="bg-slate-50">
              <div className="flex items-center justify-between">
                <CardTitle subtitle="School-wide metrics">Academic Performance</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/analytics')}>
                  Full Report
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-md bg-violet-50 border border-violet-200">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Average Grade</p>
                  <p className="text-4xl font-extrabold text-violet-700">
                    {data?.average_grade != null ? data.average_grade.toFixed(1) : '—'}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">Across all subjects</p>
                </div>

                <div className="p-5 rounded-md bg-emerald-50 border border-emerald-200">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Attendance Rate</p>
                  <p className="text-4xl font-extrabold text-emerald-700">
                    {data?.today_rate != null ? `${data.today_rate}%` : '—'}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">Today's school-wide rate</p>
                </div>

                <div className="p-5 rounded-md bg-sky-50 border border-sky-200">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Passing Rate</p>
                  <p className="text-4xl font-extrabold text-sky-700">
                    {data?.all_subjects?.total_count > 0
                      ? `${100 - (data?.all_subjects?.below_75_pct ?? 0)}%`
                      : '—'}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">Students at or above 75</p>
                </div>
              </div>

              <div className="mt-5 pt-5 border-t border-slate-200">
                <div className="flex items-center justify-between text-xs mb-4">
                  <span className="font-bold text-slate-600">Grade Distribution</span>
                  <span className="text-slate-500">
                    {data?.all_subjects?.total_count
                      ? `${data.all_subjects.total_count.toLocaleString()} grade records`
                      : 'No grade data yet'}
                  </span>
                </div>
                {data?.all_subjects?.total_count > 0 ? (
                  <div className="space-y-3">
                    {[
                      { label: 'Outstanding (90-100)',        pct: data?.all_subjects?.outstanding_pct ?? 0,         color: 'bg-emerald-500' },
                      { label: 'Very Satisfactory (85-89)',   pct: data?.all_subjects?.very_satisfactory_pct ?? 0,    color: 'bg-violet-500'    },
                      { label: 'Satisfactory (80-84)',        pct: data?.all_subjects?.satisfactory_pct ?? 0,         color: 'bg-sky-500'     },
                      { label: 'Fairly Satisfactory (75-79)', pct: data?.all_subjects?.fairly_satisfactory_pct ?? 0,  color: 'bg-amber-500'   },
                      { label: 'Did Not Meet (Below 75)',     pct: data?.all_subjects?.below_75_pct ?? 0,             color: 'bg-rose-500'    },
                    ].map((item, idx) => (
                      <div key={idx}>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-slate-700 font-semibold">{item.label}</span>
                          <span className="font-bold text-slate-900">{item.pct}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color} transition-all`} style={{ width: `${item.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400">
                    <svg className="w-8 h-8 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-xs font-bold uppercase tracking-widest">No grade data available</p>
                    <p className="text-[10px] mt-1">Grades will appear here once teachers submit records.</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* RIGHT COLUMN - 1/3 width */}
        <div className="space-y-5 md:space-y-6">
          {/* System Health */}
          <Card>
            <CardHeader divider className="bg-slate-50">
              <CardTitle subtitle="System status">Portal Health</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-md bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900">Database</p>
                      <p className="text-[10px] text-slate-600">Operational</p>
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                </div>

                <div className="flex items-center justify-between p-3 rounded-md bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900">API Services</p>
                      <p className="text-[10px] text-slate-600">All systems online</p>
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                </div>

                <div className="flex items-center justify-between p-3 rounded-md bg-violet-50 border border-violet-200">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-md bg-violet-100 text-violet-700 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900">Supabase DB</p>
                      <p className="text-[10px] text-slate-600">PostgreSQL · Connected</p>
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse" />
                </div>

                <Button 
                  variant="secondary" 
                  onClick={() => navigate('/audit-logs')}
                  className="w-full justify-center mt-3"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  View System Logs
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Recent Announcements */}
          <RecentAnnouncementsWidget navigate={navigate} />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* QUICK MANAGEMENT LINKS */}
      {/* ══════════════════════════════════════════════════════════════ */}

      <Card>
        <CardHeader divider className="bg-slate-50">
          <CardTitle subtitle="Additional admin tools">Management Tools</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <Button variant="secondary" size="sm" onClick={() => navigate('/subjects')} className="justify-start">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332-.477-4.5-1.253" />
              </svg>
              Subjects
            </Button>

            <Button variant="secondary" size="sm" onClick={() => navigate('/schedule-management')} className="justify-start">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Schedules
            </Button>

            <Button variant="secondary" size="sm" onClick={() => navigate('/grade-management')} className="justify-start">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Grades
            </Button>

            <Button variant="secondary" size="sm" onClick={() => navigate('/parent-management')} className="justify-start">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Parents
            </Button>

            <Button variant="secondary" size="sm" onClick={() => navigate('/website-content')} className="justify-start">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Website
            </Button>

            <Button variant="secondary" size="sm" onClick={() => navigate('/backups')} className="justify-start">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Backups
            </Button>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
};

export default AdminDashboard;
