import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_HOME = {
  admin: '/dashboard',
  staff: '/dashboard',
  student: '/dashboard',
  parent: '/parent-dashboard',
};

const ALL_ROLES = ['admin', 'staff', 'student', 'parent'];

const ROUTE_ACCESS = {
  'academics-hub': ['admin', 'staff', 'student'],
  'enrollment-classes': ['admin'],
  'grading-suite': ['admin', 'staff', 'student'],
  'people-directory': ['admin', 'staff'],
  'system-admin': ['admin'],
  'communication-center': ALL_ROLES,
  dashboard: ['admin', 'staff', 'student'],
  announcements: ALL_ROLES,
  attendance: ['admin', 'staff'],
  materials: ['admin', 'staff', 'student'],
  messages: ALL_ROLES,
  subjects: ['admin'],
  teachers: ['admin'],
  profile: ALL_ROLES,
  'class-members': ['admin', 'staff'],
  'portal-calendar': ALL_ROLES,
  'password-reset': ['parent'],
  'class-management': ['admin'],
  'my-classes': ['staff'],
  'student-enrollment': ['admin'],
  'student-management': ['admin', 'staff'],
  'audit-logs': ['admin'],
  backups: ['admin'],
  'website-content': ['admin'],
  'enrollment-management': ['admin'],
  settings: ['admin', 'staff', 'student'],
  'grade-input': ['admin', 'staff'],
  grades: ['admin'],
  'grade-management': ['admin'],
  'student-grades': ['student'],
  moderation: ['admin'],
  analytics: ['admin', 'staff'],
  'system-health': ['admin'],
  notifications: ALL_ROLES,
  'schedule-management': ['admin'],
  schedule: ['staff', 'student'],
  'parent-dashboard': ['parent'],
  'parent-management': ['admin'],
};

function getRouteKey(pathname) {
  return pathname.replace(/^\/+/, '').replace(/\/+$/, '').split('/')[0];
}

const ProtectedRoute = ({ children }) => {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1A0B2E]">
        <div className="flex flex-col items-center gap-4">
          {/* Logo */}
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center mb-2">
            <img
              src="https://plain-apac-prod-public.komododecks.com/202605/18/u3t1lOolacFscP6v1Bq8/image.png"
              alt="KNHS"
              className="w-9 h-9 object-contain"
            />
          </div>
          {/* Spinner */}
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 rounded-full border-2 border-white/10" />
            <div className="absolute inset-0 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
          </div>
          <p className="text-white/50 text-xs font-bold uppercase tracking-widest">Loading portal…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.must_change_password && location.pathname !== '/force-password-change') {
    return <Navigate to="/force-password-change" replace />;
  }

  // Parents have their own dedicated dashboard
  if (
    user.role === 'parent' &&
    location.pathname === '/dashboard'
  ) {
    return <Navigate to="/parent-dashboard" replace />;
  }

  const routeKey = getRouteKey(location.pathname);
  const allowedRoles = ROUTE_ACCESS[routeKey];
  const isTeacherAdvisoryRoute =
    user.role === 'staff' &&
    (routeKey === 'student-management' || routeKey === 'people-directory');

  if (
    allowedRoles &&
    (!allowedRoles.includes(user.role) || (isTeacherAdvisoryRoute && !user.is_adviser))
  ) {
    return <Navigate to={ROLE_HOME[user.role] || '/dashboard'} replace />;
  }

  return children;
};

export default ProtectedRoute;
