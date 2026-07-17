import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import {
  Card, CardHeader, CardBody, CardTitle,
  Button, Badge, EmptyState, Skeleton,
} from '../../components/ui';
import {
  SchoolHeaderBanner, StatCard,
  TodayScheduleWidget, RecentAnnouncementsWidget,
} from './shared';
import RoleManual from './RoleManual';
import QuickAccessLinks from '../../components/dashboard/QuickAccessLinks';

const getLocalDateStr = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
};

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [data, setData]               = useState(null);   // teacher/stats
  const [classrooms, setClassrooms]   = useState([]);     // /classrooms/
  const [subjects, setSubjects]       = useState([]);     // classroom-subjects by teacher
  const [todayAttMap, setTodayAttMap] = useState({});     // { classroomId: { marked, presentCount, totalCount } }
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  // Build subject-codes map: classroomId → [code, code, …]
  const classroomSubjectCodes = useMemo(() => {
    const map = {};
    subjects.forEach(s => {
      const id = s.classroom;
      if (!map[id]) map[id] = [];
      if (s.subject_code && !map[id].includes(s.subject_code)) {
        map[id].push(s.subject_code);
      }
    });
    return map;
  }, [subjects]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const today = getLocalDateStr();
    try {
      // Single Promise.all — stats, classrooms, subjects, and ONE batched attendance call
      const [statsRes, clsRes, subjectsRes, attRes] = await Promise.all([
        api.get('/teacher/stats/'),
        api.get('/classrooms/'),
        api.get(`/classroom-subjects/by_teacher/?teacher_id=${user?.id}`),
        api.get(`/attendance/?date=${today}`),   // staff scope → only their classrooms
      ]);

      const cls = clsRes.data || [];
      setData(statsRes.data);
      setClassrooms(cls);
      setSubjects(subjectsRes.data || []);

      // Group the single attendance response by classroom_id
      const rawAtt = Array.isArray(attRes.data) ? attRes.data : [];
      const attMap = {};
      rawAtt.forEach(rec => {
        const cid = rec.classroom;
        if (!attMap[cid]) attMap[cid] = { marked: false, presentCount: 0, totalCount: 0 };
        attMap[cid].marked = true;
        attMap[cid].totalCount += 1;
        if (['present', 'late'].includes(rec.status)) {
          attMap[cid].presentCount += 1;
        }
      });
      setTodayAttMap(attMap);
    } catch (err) {
      console.error('Teacher dashboard load failed:', err);
      setError('Failed to load dashboard data. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const today = useMemo(() =>
    new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }), []);

  // ── Skeleton ────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="page-bottom-safe max-w-[1600px] mx-auto bg-slate-50 px-4 py-4 md:px-6 md:py-6 space-y-5 md:space-y-6"
      aria-busy="true" aria-label="Loading dashboard…">
      <div className="rounded-lg border border-slate-200 bg-white p-4 md:p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="w-14 h-14 md:w-16 md:h-16 rounded-md shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-48 rounded" />
              <Skeleton className="h-3 w-36 rounded" />
              <Skeleton className="h-3 w-28 rounded" />
            </div>
          </div>
          <Skeleton className="h-16 w-48 rounded-md" />
        </div>
      </div>
      <Skeleton className="h-12 w-full rounded-lg" />
      <div className="space-y-3">
        <Skeleton className="h-3.5 w-24 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <Skeleton.QuickTile key={i} />)}
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-3.5 w-16 rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          {[1,2,3,4].map(i => <Skeleton.StatCard key={i} />)}
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-slate-100">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-3 w-32 rounded" />
          </div>
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
        <div className="p-4 md:p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1,2,3].map(i => <Skeleton.ClassCard key={i} />)}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        {[1,2].map(col => (
          <div key={col} className="rounded-lg border border-slate-200 bg-white">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-3 w-16 rounded" />
            </div>
            <div className="p-4 space-y-2">
              {[1,2,3].map(i => <Skeleton.ScheduleRow key={i} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Error state ─────────────────────────────────────────────────────────
  if (error && !data) return (
    <div className="page-bottom-safe max-w-[1600px] mx-auto bg-slate-50 px-4 py-6 md:px-6 flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full border-l-4 border-l-red-500">
        <CardHeader divider className="bg-red-50">
          <CardTitle subtitle="Could not load your dashboard data">Dashboard Unavailable</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <p className="text-sm text-slate-700">{error}</p>
          <Button onClick={load}>Retry</Button>
        </CardBody>
      </Card>
    </div>
  );


  // ── Derived stats ────────────────────────────────────────────────────────
  const unmarkedCount = classrooms.filter(c => !todayAttMap[c.id]?.marked).length;
  // Real attendance rate from the stats endpoint (present/late ÷ total records today)
  const realAttRate = data?.attendance_rate ?? 0;
  // Pending grades from backend (students without a grade for teacher's subjects)
  const pendingGrades = data?.pending_grades ?? 0;
  // Unread notifications if returned, fallback to announcements_sent
  const notifValue = data?.unread_notifications ?? data?.announcements_sent ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="page-bottom-safe max-w-[1600px] mx-auto min-h-0 bg-slate-50 px-4 py-4 md:px-6 md:py-6 space-y-5 md:space-y-6"
    >
      {/* School Header — uses deped-logo.png which actually exists */}
      <SchoolHeaderBanner user={user} today={today} />

      <RoleManual role="teacher" />
      <QuickAccessLinks role="teacher" variant="grid" />

      {/* ── STAT CARDS ─────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-3">Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">

          {/* Classes */}
          <StatCard
            label="My Classes" value={classrooms.length} sub="Active sections"
            icon={<svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
            color="blue" onClick={() => navigate('/my-classes')}
          />

          {/* Students */}
          <StatCard
            label="Total Students" value={data?.total_students || 0} sub="Enrolled learners"
            icon={<svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
            color="emerald"
          />

          {/* Attendance — real present/late rate from stats endpoint */}
          <StatCard
            label="Attendance Today"
            value={`${realAttRate}%`}
            sub={`${unmarkedCount > 0 ? `${unmarkedCount} class${unmarkedCount !== 1 ? 'es' : ''} unmarked` : 'All classes marked'}`}
            icon={<svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            color={realAttRate < 75 ? 'rose' : realAttRate < 85 ? 'amber' : 'emerald'}
            onClick={() => navigate('/attendance')}
            badge={unmarkedCount}
          />

          {/* Pending grades — students missing grades for current quarter */}
          <StatCard
            label="Pending Grades" value={pendingGrades}
            sub={pendingGrades > 0 ? 'Students missing grades' : 'All grades submitted'}
            icon={<svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
            color={pendingGrades > 0 ? 'rose' : 'emerald'}
            onClick={() => navigate('/grade-input')}
            badge={pendingGrades > 0 ? pendingGrades : undefined}
          />
        </div>
      </div>

      {/* ── MY CLASSES CARD ─────────────────────────────────────────────── */}
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
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {classrooms.map(c => {
                const att = todayAttMap[c.id];
                const marked = att?.marked ?? false;
                const attRate = att?.totalCount > 0
                  ? Math.round((att.presentCount / att.totalCount) * 100)
                  : null;
                // Subject codes from the classroom-subjects fetch
                const codes = classroomSubjectCodes[c.id] || [];

                return (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/my-classes?classroom=${c.id}`)}
                    className="p-4 text-left rounded-md border-2 border-slate-200 bg-white hover:border-violet-400 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-extrabold text-sm text-slate-900 truncate group-hover:text-violet-700 transition-colors">
                          {c.name}
                        </h3>
                        {/* Subject codes — accurate multi-subject display */}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {codes.length > 0
                            ? codes.slice(0, 3).map(code => (
                                <span key={code} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 uppercase tracking-wide">
                                  {code}
                                </span>
                              ))
                            : <span className="text-xs font-semibold text-slate-400">General</span>
                          }
                          {codes.length > 3 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                              +{codes.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant={marked ? 'green' : 'gold'} size="sm">
                        {marked ? '✓' : '!'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs font-semibold text-slate-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        <span>{c.student_count || 0} students</span>
                      </div>
                      {/* Real attendance rate for this class */}
                      {attRate !== null && (
                        <span className={`text-xs font-bold ${attRate >= 85 ? 'text-emerald-600' : attRate >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                          {attRate}% present
                        </span>
                      )}
                      <svg className="w-4 h-4 text-violet-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* ── SCHEDULE & ANNOUNCEMENTS ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        <TodayScheduleWidget navigate={navigate} />
        <RecentAnnouncementsWidget navigate={navigate} />
      </div>

      {/* ── PENDING REMINDERS ────────────────────────────────────────────── */}
      {(unmarkedCount > 0 || pendingGrades > 0) && (
        <div className="space-y-3">
          {unmarkedCount > 0 && (
            <Card className="border-l-4 border-l-amber-500 bg-amber-50">
              <CardBody className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-200 shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-extrabold text-slate-900">Attendance Reminder</h3>
                    <p className="text-xs text-slate-700 mt-1">
                      <span className="font-bold text-amber-700">{unmarkedCount} {unmarkedCount === 1 ? 'class' : 'classes'}</span> with unmarked attendance today.
                    </p>
                    <Button variant="primary" size="sm" onClick={() => navigate('/attendance')} className="mt-3">
                      Mark Attendance
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {pendingGrades > 0 && (
            <Card className="border-l-4 border-l-rose-500 bg-rose-50">
              <CardBody className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-md bg-rose-100 text-rose-700 flex items-center justify-center border border-rose-200 shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-extrabold text-slate-900">Grade Submission Reminder</h3>
                    <p className="text-xs text-slate-700 mt-1">
                      <span className="font-bold text-rose-700">{pendingGrades} student{pendingGrades !== 1 ? 's' : ''}</span> are still missing grades across your subjects.
                    </p>
                    <Button variant="primary" size="sm" onClick={() => navigate('/grade-input')} className="mt-3">
                      Submit Grades
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}

    </motion.div>
  );
};

export default TeacherDashboard;
