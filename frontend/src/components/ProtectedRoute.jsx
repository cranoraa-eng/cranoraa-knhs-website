import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role, ROLE_HOME, ROUTE_ACCESS } from '../constants/roles';

function getRouteKey(pathname) {
  return pathname.replace(/^\/+/, '').replace(/\/+$/, '').split('?')[0].split('/')[0];
}

const ProtectedRoute = ({ children }) => {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect parent from /dashboard to /parent-dashboard
  if (user.role === Role.PARENT && location.pathname === '/dashboard') {
    return <Navigate to="/parent-dashboard" replace />;
  }

  // Check route access
  const routeKey = getRouteKey(location.pathname);
  const allowedRoles = ROUTE_ACCESS[routeKey];

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role] || '/dashboard'} replace />;
  }

  return children;
};

export default ProtectedRoute;
