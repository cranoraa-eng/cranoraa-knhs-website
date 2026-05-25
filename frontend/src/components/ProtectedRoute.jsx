import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, ready } = useAuth();

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

  if (user.must_change_password && window.location.pathname !== '/force-password-change') {
    return <Navigate to="/force-password-change" replace />;
  }

  // Parents have their own dedicated dashboard
  if (
    user.role === 'parent' &&
    window.location.pathname === '/dashboard'
  ) {
    return <Navigate to="/parent-dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
