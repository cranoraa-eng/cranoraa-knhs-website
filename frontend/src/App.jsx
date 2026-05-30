import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import PublicLayout from './components/PublicLayout';
import ErrorBoundary from './components/ErrorBoundary';
import { lazy, Suspense } from 'react';
import { useState, useEffect } from 'react';
import api from './utils/api';
import { getStoredUser } from './utils/auth';
import { SkeletonDashboard } from './components/Skeleton';

// ── Eagerly loaded (auth + critical path) ────────────────────────────────────
import Login from './pages/Login';
import ForcePasswordChange from './pages/ForcePasswordChange';
import Dashboard from './pages/Dashboard';
import Maintenance from './pages/Maintenance';

// Detect if running as installed PWA (standalone mode).
// Called once at module level — safe because display-mode doesn't change at runtime.
const isPWA = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

// On first PWA launch (cold start), redirect / to /login.
// Once the user navigates inside the app, allow / to render normally
// so "Visit Website" / "Back to Website" buttons work.
const isFirstLaunch = () => {
  if (!isPWA()) return false;
  // If we already set the flag this session, not a cold start
  if (sessionStorage.getItem('pwa_launched')) return false;
  sessionStorage.setItem('pwa_launched', '1');
  return true;
};

const redirectToLogin = isFirstLaunch();

// ── Public website pages ──────────────────────────────────────────────────────
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Programs = lazy(() => import('./pages/Programs'));
const Contact = lazy(() => import('./pages/Contact'));
const Enrollment = lazy(() => import('./pages/Enrollment'));
const AnnouncementDetails = lazy(() => import('./pages/AnnouncementDetails'));
const Calendar = lazy(() => import('./pages/Calendar'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const EnrollmentTracking = lazy(() => import('./pages/EnrollmentTracking'));

// ── Portal pages (lazy loaded for better initial bundle) ──────────────────────
const Announcements = lazy(() => import('./pages/Announcements'));
const Attendance = lazy(() => import('./pages/Attendance'));
const Materials = lazy(() => import('./pages/Materials'));
const Subjects = lazy(() => import('./pages/Subjects'));
const Teachers = lazy(() => import('./pages/Teachers'));
const Profile = lazy(() => import('./pages/Profile'));

const ClassMembers = lazy(() => import('./pages/ClassMembers'));
const PasswordReset = lazy(() => import('./pages/PasswordReset'));
const ClassManagement = lazy(() => import('./pages/ClassManagement'));
const MyClasses = lazy(() => import('./pages/MyClasses'));
const SubjectAssignment = lazy(() => import('./pages/SubjectAssignment'));
const StudentEnrollment = lazy(() => import('./pages/StudentEnrollment'));
const StudentManagement = lazy(() => import('./pages/StudentManagement'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const Backups = lazy(() => import('./pages/Backups'));
const WebsiteContentManagement = lazy(() => import('./pages/WebsiteContentManagement'));
const EnrollmentManagement = lazy(() => import('./pages/EnrollmentManagement'));
const Settings = lazy(() => import('./pages/Settings'));
const GradeInput = lazy(() => import('./pages/GradeInput'));
const GradeManagement = lazy(() => import('./pages/GradeManagement'));
const StudentGradeView = lazy(() => import('./pages/StudentGradeView'));
const Moderation = lazy(() => import('./pages/Moderation'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Messages = lazy(() => import('./pages/Messages'));
const ScheduleManagement = lazy(() => import('./pages/ScheduleManagement'));
const MySchedule = lazy(() => import('./pages/MySchedule'));
const ParentDashboard = lazy(() => import('./pages/ParentDashboard'));
const ParentManagement = lazy(() => import('./pages/ParentManagement'));

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
    // OPTIMIZATION: check every 5 minutes instead of every 60s.
    // Maintenance mode changes are rare admin actions — 5min lag is acceptable
    // and saves ~4 API calls/min per active user.
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
      <NotificationProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <ErrorBoundary>
            <Routes>
              {/* Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/force-password-change" element={<ForcePasswordChange />} />

              {/* Public Website Routes */}
              {redirectToLogin ? (
                // Cold PWA launch: redirect / to /login
                <>
                  <Route path="/" element={<Navigate to="/login" replace />} />
                  <Route path="/about" element={<Navigate to="/login" replace />} />
                  <Route path="/programs" element={<Navigate to="/login" replace />} />
                  <Route path="/contact" element={<Navigate to="/login" replace />} />
                  <Route path="/enroll" element={<Navigate to="/login" replace />} />
                  <Route path="/announcement" element={<Navigate to="/login" replace />} />
                  <Route path="/calendar" element={<Navigate to="/login" replace />} />
                  <Route path="/privacy" element={<Navigate to="/login" replace />} />
                  <Route path="/terms" element={<Navigate to="/login" replace />} />
                  <Route path="/track-enrollment" element={<Navigate to="/login" replace />} />
                </>
              ) : (
                <Route path="/" element={<PublicLayout />}>
                  <Route index element={<Home />} />
                  <Route path="about" element={<About />} />
                  <Route path="programs" element={<Programs />} />
                  <Route path="contact" element={<Contact />} />
                  <Route path="enroll" element={<Enrollment />} />
                  <Route path="announcement" element={<AnnouncementDetails />} />
                  <Route path="calendar" element={<Calendar />} />
                  <Route path="privacy" element={<PrivacyPolicy />} />
                  <Route path="terms" element={<TermsOfService />} />
                  <Route path="track-enrollment" element={<EnrollmentTracking />} />
                </Route>
              )}

              {/* Protected Portal Routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="announcements" element={<Announcements />} />
                <Route path="grades" element={<Navigate to="/grade-management" replace />} />
                <Route path="attendance" element={<Attendance />} />
                <Route path="materials" element={<Materials />} />
                <Route path="messages" element={<Messages />} />
                <Route path="subjects" element={<Subjects />} />
                <Route path="teachers" element={<Teachers />} />
                <Route path="profile" element={<Profile />} />

                <Route path="class-members" element={<ClassMembers />} />
                <Route path="portal-calendar" element={<Calendar mode="portal" />} />
                <Route path="password-reset" element={<PasswordReset />} />
                <Route path="class-management" element={<ClassManagement />} />
                <Route path="my-classes" element={<MyClasses />} />
                <Route path="subject-assignment" element={<SubjectAssignment />} />
                <Route path="student-enrollment" element={<StudentEnrollment />} />
                <Route path="student-management" element={<StudentManagement />} />

                <Route path="audit-logs" element={<AuditLogs />} />
                <Route path="backups" element={<Backups />} />
                <Route path="website-content" element={<WebsiteContentManagement />} />
                <Route path="enrollment-management" element={<EnrollmentManagement />} />
                <Route path="settings" element={<Settings />} />
                <Route path="grade-input" element={<GradeInput />} />
                <Route path="grade-management" element={<GradeManagement />} />
                <Route path="student-grades" element={<StudentGradeView />} />
                <Route path="moderation" element={<Moderation />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="schedule-management" element={<ScheduleManagement />} />
                <Route path="schedule" element={<MySchedule />} />
                <Route path="parent-dashboard" element={<ParentDashboard />} />
                <Route path="parent-management" element={<ParentManagement />} />
              </Route>
            </Routes>
            </ErrorBoundary>
          </Suspense>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
