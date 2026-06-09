import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import { Card, CardHeader, CardBody, CardTitle, Button, Badge, EmptyState, LoadingSpinner } from '../../components/ui';
import { SchoolHeaderBanner, StatCard, TodayScheduleWidget, RecentAnnouncementsWidget } from './shared';
import RoleManual from './RoleManual';

const getLocalDateStr = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
};

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todayAttendance, setTodayAttendance] = useState({});

  useEffect(() => {
    const today = getLocalDateStr();
    Promise.all([
      api.get('/teacher/stats/'),
      api.get('/classrooms/'),
    ]).then(([statsRes, clsRes]) => {
      setData(statsRes.data);
      const cls = clsRes.data || [];
      setClassrooms(cls);
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

  const today = useMemo(() => 
    new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }), []
  );

  if (loading || !data) return <LoadingSpinner />;

  const unmarkedCount = classrooms.filter(c => !todayAttendance[c.id]).length;
  const markedCount = classrooms.length - unmarkedCount;
  const attendanceRate = classrooms.length > 0 ? Math.round((markedCount / classrooms.length) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="page-bottom-safe max-w-[1600px] mx-auto min-h-0 bg-slate-50 px-4 py-4 md:px-6 md:py-6 space-y-5 md:space-y-6"
    >
      {/* Official School Header */}
      <SchoolHeaderBanner user={user} today={today} />

      <RoleManual role="teacher" />

      {/* Quick Stats */}
      <div>
        <h2 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-3">Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          <StatCard 
            label="My Classes" 
            value={classrooms.length} 
            sub="Active sections"
            icon={
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
            color="blue"
            onClick={() => navigate('/my-classes')}
          />
          <StatCard 
            label="Total Students" 
            value={data?.total_students || 0} 
            sub="Enrolled learners"
            icon={
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
            color="emerald"
          />
          <StatCard 
            label="Attendance Today" 
            value={`${attendanceRate}%`} 
            sub={`${markedCount}/${classrooms.length} marked`}
            icon={
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color={unmarkedCount > 0 ? 'amber' : 'emerald'}
            onClick={() => navigate('/attendance')}
            badge={unmarkedCount}
          />
          <StatCard 
            label="Announcements" 
            value={data?.announcements_sent || 0} 
            sub="Posted this term"
            icon={
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            }
            color="sky"
            onClick={() => navigate('/announcements')}
          />
        </div>
      </div>

      {/* My Classes */}
      <Card>
        <CardHeader divider>
          <div className="flex items-center justify-between">
            <CardTitle subtitle="Teaching sections">My Classes</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/my-classes')}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          {classrooms.length === 0 ? (
            <EmptyState
              title="No classes assigned"
              description="Your teaching sections will appear here"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {classrooms.map(c => {
                const marked = todayAttendance[c.id];
                return (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/my-classes/${c.id}`)}
                    className="p-4 text-left rounded-md border-2 border-slate-200 bg-white hover:border-violet-400 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-extrabold text-sm text-slate-900 truncate group-hover:text-violet-700 transition-colors">
                          {c.name}
                        </h3>
                        <p className="text-xs font-semibold text-slate-600 truncate uppercase tracking-wide mt-0.5">
                          {c.subject_name || 'General'}
                        </p>
                      </div>
                      {marked !== undefined && (
                        <Badge variant={marked ? 'green' : 'gold'} size="sm">
                          {marked ? '✓' : '!'}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs font-semibold text-slate-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span>{c.student_count || 0} students</span>
                      </div>
                      <svg className="w-4 h-4 text-violet-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Today's Schedule & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        <TodayScheduleWidget navigate={navigate} />
        <RecentAnnouncementsWidget navigate={navigate} />
      </div>

      {/* Pending Tasks Reminder */}
      {unmarkedCount > 0 && (
        <Card className="border-l-4 border-l-amber-500 bg-amber-50">
          <CardBody className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-200 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-extrabold text-slate-900">Attendance Reminder</h3>
                <p className="text-xs text-slate-700 mt-1">
                  You have <span className="font-bold text-amber-700">{unmarkedCount} {unmarkedCount === 1 ? 'class' : 'classes'}</span> with unmarked attendance today.
                </p>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => navigate('/attendance')}
                  className="mt-3"
                >
                  Mark Attendance
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </motion.div>
  );
};

export default TeacherDashboard;
