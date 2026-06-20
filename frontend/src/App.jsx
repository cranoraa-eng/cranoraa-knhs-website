import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { AcademicYearProvider } from './context/AcademicYearContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import PublicLayout from './components/PublicLayout';
import ErrorBoundary from './components/ErrorBoundary';
import { lazy, Suspense } from 'react';
import { useState, useEffect } from 'react';
import api from './utils/api';
import { getStoredUser } from './utils/auth';
import { SkeletonDashboard } from './components/Skeleton';
import { publicRoutes, protectedRoutes } from './constants/routes';

// Eagerly loaded (auth + critical path)
import Login from './pages/Login';
import ForcePasswordChange from './pages/ForcePasswordChange';
import Dashboard from './pages/Dashboard';
import Maintenance from './pages/Maintenance';
import NotFound from './pages/NotFound';

// Fallback while lazy pages load
const PageLoader = () => (
  <div className="p-4 lg:p-8">
    <SkeletonDashboard />
  </div>
);

function App() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const user = getStoredUser();

  useEffect(() => {
    checkMaintenance();
    const interval = setInterval(checkMaintenance, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const checkMaintenance = async () => {
    try {
      const r = await api.get('/system/maintenance-status/');
      if (r.data.maintenance_mode && user?.role !== 'admin') {
        setMaintenanceMode(true);
        setMaintenanceMessage(r.data.maintenance_message);
      } else {
        setMaintenanceMode(false);
      }
    } catch {
      // Silently fail — don't block the app if this endpoint is unreachable
    }
  };

  if (maintenanceMode) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<Maintenance message={maintenanceMessage} />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <AuthProvider>
      <AcademicYearProvider>
        <NotificationProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <ErrorBoundary>
            <Routes>
              {/* Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/force-password-change" element={<ForcePasswordChange />} />

              {/* Public Website Routes */}
              <Route path="/" element={<PublicLayout />}>
                {publicRoutes.map(({ path, element: Element }) => (
                  <Route key={path} path={path} element={<Element />} />
                ))}
                <Route path="*" element={<NotFound />} />
              </Route>

              {/* Protected Portal Routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                {protectedRoutes.map(({ path, element: Element, redirect, props }) => {
                  if (redirect) {
                    return (
                      <Route
                        key={path}
                        path={path}
                        element={<Navigate to={redirect} replace />}
                      />
                    );
                  }
                  return (
                    <Route
                      key={path}
                      path={path}
                      element={Element ? <Element {...props} /> : null}
                    />
                  );
                })}
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
            </ErrorBoundary>
          </Suspense>
        </BrowserRouter>
        </NotificationProvider>
      </AcademicYearProvider>
    </AuthProvider>
  );
}

export default App;
