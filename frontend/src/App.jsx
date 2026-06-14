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


// ── Public website pages ──────────────────────────────────────────────────────
const Home = lazy(() => import('./pages/HomeDepEd'));
const About = lazy(() => import('./pages/About'));
const Mission = lazy(() => import('./pages/Mission'));
const Vision = lazy(() => import('./pages/Vision'));
const Faculty = lazy(() => import('./pages/Faculty'));
const Programs = lazy(() => import('./pages/Programs'));
const K12Programs = lazy(() => import('./pages/K12Programs'));
const SeniorHigh = lazy(() => import('./pages/SeniorHigh'));
const Contact = lazy(() => import('./pages/Contact'));
const Enrollment = lazy(() => import('./pages/Enrollment'));
const AnnouncementDetails = lazy(() => import('./pages/AnnouncementDetails'));
const NewsEvents = lazy(() => import('./pages/NewsEvents'));
const Calendar = lazy(() => import('./pages/Calendar'));
const LearningMaterials = lazy(() => import('./pages/LearningMaterials'));
const Portals = lazy(() => import('./pages/Portals'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const EnrollmentTracking = lazy(() => import('./pages/EnrollmentTracking'));

// ── Portal pages (lazy loaded for better initial bundle) ──────────────────────
const Attendance = lazy(() => import('./pages/Attendance'));
const Profile = lazy(() => import('./pages/Profile'));

const ClassMembers = lazy(() => import('./pages/ClassMembers'));
const PasswordReset = lazy(() => import('./pages/PasswordReset'));
const Settings = lazy(() => import('./pages/Settings'));
const Notifications = lazy(() => import('./pages/Notifications'));
const AcademicsHub = lazy(() => import('./pages/AcademicsHub'));
const EnrollmentClassesHub = lazy(() => import('./pages/EnrollmentClassesHub'));
const GradingSuite = lazy(() => import('./pages/GradingSuite'));
const PeopleDirectory = lazy(() => import('./pages/PeopleDirectory'));
const SystemAdminHub = lazy(() => import('./pages/SystemAdminHub'));
const CommunicationCenter = lazy(() => import('./pages/CommunicationCenter'));
const Announcements = lazy(() => import('./pages/Announcements'));
const ParentDashboard = lazy(() => import('./pages/ParentDashboard'));

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
              <Route path="/" element={<PublicLayout />}>
                <Route index element={<Home />} />
                <Route path="about" element={<About />} />
                <Route path="mission" element={<Mission />} />
                <Route path="vision" element={<Vision />} />
                <Route path="faculty" element={<Faculty />} />
                <Route path="programs" element={<Programs />} />
                <Route path="k12-programs" element={<K12Programs />} />
                <Route path="senior-high" element={<SeniorHigh />} />
                <Route path="news-events" element={<NewsEvents />} />
                <Route path="learning-materials" element={<LearningMaterials />} />
                <Route path="portals" element={<Portals />} />
                <Route path="contact" element={<Contact />} />
                <Route path="enroll" element={<Enrollment />} />
                <Route path="announcement" element={<AnnouncementDetails />} />
                <Route path="calendar" element={<Calendar />} />
                <Route path="privacy" element={<PrivacyPolicy />} />
                <Route path="terms" element={<TermsOfService />} />
                <Route path="track-enrollment" element={<EnrollmentTracking />} />
              </Route>

              {/* Protected Portal Routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="academics-hub" element={<AcademicsHub />} />
                <Route path="enrollment-classes" element={<EnrollmentClassesHub />} />
                <Route path="grading-suite" element={<GradingSuite />} />
                <Route path="people-directory" element={<PeopleDirectory />} />
                <Route path="system-admin" element={<SystemAdminHub />} />
                <Route path="communication-center" element={<CommunicationCenter />} />
                <Route path="announcements" element={<Announcements />} />
                <Route path="grades" element={<Navigate to="/grading-suite?tab=grade-management" replace />} />
                <Route path="attendance" element={<Attendance />} />
                <Route path="materials" element={<Navigate to="/academics-hub?tab=materials" replace />} />
                <Route path="subjects" element={<Navigate to="/academics-hub?tab=subjects" replace />} />
                <Route path="teachers" element={<Navigate to="/people-directory?tab=teachers" replace />} />
                <Route path="profile" element={<Profile />} />

                <Route path="class-members" element={<ClassMembers />} />
                <Route path="portal-calendar" element={<Calendar mode="portal" />} />
                <Route path="password-reset" element={<PasswordReset />} />
                <Route path="class-management" element={<Navigate to="/enrollment-classes?tab=classrooms" replace />} />
                <Route path="my-classes" element={<Navigate to="/academics-hub?tab=classes" replace />} />
                <Route path="subject-assignment" element={<Navigate to="/academics-hub?tab=subjects" replace />} />
                <Route path="student-enrollment" element={<Navigate to="/enrollment-classes?tab=student-enrollment" replace />} />
                <Route path="student-management" element={<Navigate to="/people-directory?tab=students" replace />} />

                <Route path="audit-logs" element={<Navigate to="/system-admin?tab=audit-logs" replace />} />
                <Route path="backups" element={<Navigate to="/system-admin?tab=backups" replace />} />
                <Route path="website-content" element={<Navigate to="/system-admin?tab=website-editor" replace />} />
                <Route path="enrollment-management" element={<Navigate to="/enrollment-classes?tab=applications" replace />} />
                <Route path="settings" element={<Settings />} />
                <Route path="grade-input" element={<Navigate to="/grading-suite?tab=grade-input" replace />} />
                <Route path="grade-management" element={<Navigate to="/grading-suite?tab=grade-management" replace />} />
                <Route path="student-grades" element={<Navigate to="/grading-suite?tab=my-grades" replace />} />
                <Route path="moderation" element={<Navigate to="/system-admin?tab=moderation" replace />} />
                <Route path="analytics" element={<Navigate to="/grading-suite?tab=grade-analytics" replace />} />
                <Route path="system-health" element={<Navigate to="/system-admin?tab=system-health" replace />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="schedule-management" element={<Navigate to="/academics-hub?tab=schedules" replace />} />
                <Route path="schedule" element={<Navigate to="/academics-hub?tab=schedule" replace />} />
                <Route path="parent-dashboard" element={<ParentDashboard />} />
                <Route path="parent-management" element={<Navigate to="/people-directory?tab=parents" replace />} />
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
