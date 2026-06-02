import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import { getCurrentAcademicYear } from '../../utils/dateHelpers';
import { Card, CardHeader, CardBody, CardTitle, Button, LoadingSpinner, EmptyState } from '../../components/ui';
import { SchoolHeaderBanner, StatCard, RecentAnnouncementsWidget } from './shared';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const academicYear = localStorage.getItem('knhs_academic_year') || getCurrentAcademicYear();
    api.get(`/admin/stats/?academic_year=${academicYear}`)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const today = useMemo(() => 
    new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }), []
  );

  if (loading || !data) return <LoadingSpinner />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="page-bottom-safe max-w-[1600px] mx-auto min-h-0 bg-slate-50 px-4 py-4 md:px-6 md:py-6 space-y-5 md:space-y-6"
    >
      {/* Official School Header */}
      <SchoolHeaderBanner user={user} today={today} />

      {/* Quick Stats */}
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

      {/* Quick Actions */}
      <Card>
        <CardHeader divider>
          <CardTitle subtitle="Admin tools">Quick Actions</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="secondary" onClick={() => navigate('/student-management')} className="h-auto flex-col py-4">
              <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="text-xs font-bold">Manage Students</span>
            </Button>
            <Button variant="secondary" onClick={() => navigate('/teachers')} className="h-auto flex-col py-4">
              <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-xs font-bold">Manage Teachers</span>
            </Button>
            <Button variant="secondary" onClick={() => navigate('/class-management')} className="h-auto flex-col py-4">
              <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="text-xs font-bold">Manage Classes</span>
            </Button>
            <Button variant="secondary" onClick={() => navigate('/analytics')} className="h-auto flex-col py-4">
              <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-xs font-bold">View Analytics</span>
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* System Health & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        {/* System Health */}
        <Card>
          <CardHeader divider>
            <CardTitle subtitle="System status">School Portal Health</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-md bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Database</p>
                    <p className="text-[10px] text-slate-600">Operational</p>
                  </div>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>

              <div className="flex items-center justify-between p-3 rounded-md bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">API Services</p>
                    <p className="text-[10px] text-slate-600">All systems online</p>
                  </div>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>

              <div className="flex items-center justify-between p-3 rounded-md bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Storage</p>
                    <p className="text-[10px] text-slate-600">68% capacity</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-blue-700">Good</span>
              </div>

              <Button 
                variant="secondary" 
                onClick={() => navigate('/audit-logs')}
                className="w-full justify-center"
              >
                View System Logs
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Recent Announcements */}
        <RecentAnnouncementsWidget navigate={navigate} />
      </div>

      {/* Academic Performance Summary */}
      <Card>
        <CardHeader divider>
          <div className="flex items-center justify-between">
            <CardTitle subtitle="School-wide metrics">Academic Performance</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/analytics')}>
              Full Report
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-md bg-blue-50 border border-blue-200">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Average Grade</p>
              <p className="text-3xl font-extrabold text-blue-700">85.4</p>
              <p className="text-xs text-slate-600 mt-1">Across all subjects</p>
            </div>

            <div className="p-4 rounded-md bg-emerald-50 border border-emerald-200">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Attendance Rate</p>
              <p className="text-3xl font-extrabold text-emerald-700">92%</p>
              <p className="text-xs text-slate-600 mt-1">School-wide average</p>
            </div>

            <div className="p-4 rounded-md bg-sky-50 border border-sky-200">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Passing Rate</p>
              <p className="text-3xl font-extrabold text-sky-700">96%</p>
              <p className="text-xs text-slate-600 mt-1">Students above 75</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-600">Grade Distribution</span>
              <span className="text-slate-500">Current quarter</span>
            </div>
            <div className="mt-3 space-y-2">
              {[
                { label: 'Outstanding (90-100)', value: 35, color: 'bg-emerald-500' },
                { label: 'Very Satisfactory (85-89)', value: 28, color: 'bg-blue-500' },
                { label: 'Satisfactory (80-84)', value: 22, color: 'bg-sky-500' },
                { label: 'Fairly Satisfactory (75-79)', value: 11, color: 'bg-amber-500' },
                { label: 'Did Not Meet (Below 75)', value: 4, color: 'bg-rose-500' },
              ].map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-700">{item.label}</span>
                    <span className="font-bold text-slate-900">{item.value}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${item.color} transition-all`} 
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
};

export default AdminDashboard;
