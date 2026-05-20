import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import PublicLayout from './components/PublicLayout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyOTP from './pages/VerifyOTP';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPasswordConfirm from './pages/ResetPasswordConfirm';
import Dashboard from './pages/Dashboard';
import Announcements from './pages/Announcements';
import Grades from './pages/Grades';
import Attendance from './pages/Attendance';
import Materials from './pages/Materials';
import Subjects from './pages/Subjects';
import Teachers from './pages/Teachers';
import Profile from './pages/Profile';
import RegisterSubjects from './pages/RegisterSubjects';
import ClassMembers from './pages/ClassMembers';
import Calendar from './pages/Calendar';
import PasswordReset from './pages/PasswordReset';
import ClassManagement from './pages/ClassManagement';
import SubjectAssignment from './pages/SubjectAssignment';
import StudentEnrollment from './pages/StudentEnrollment';
import StudentManagement from './pages/StudentManagement';
import AuditLogs from './pages/AuditLogs';
import Backups from './pages/Backups';
import Home from './pages/Home';
import About from './pages/About';
import Programs from './pages/Programs';
import Contact from './pages/Contact';
import Enrollment from './pages/Enrollment';
import WebsiteContentManagement from './pages/WebsiteContentManagement';
import AnnouncementDetails from './pages/AnnouncementDetails';
import EnrollmentManagement from './pages/EnrollmentManagement';
import AccountApprovals from './pages/AccountApprovals';
import Settings from './pages/Settings';
import GradeInput from './pages/GradeInput';
import GradeManagement from './pages/GradeManagement';
import GradeDistribution from './pages/GradeDistribution';
import StudentGradeView from './pages/StudentGradeView';
import GradeReports from './pages/GradeReports';

import Messages from './pages/Messages';
import Maintenance from './pages/Maintenance';
import { useState, useEffect } from 'react';
import api from './utils/api';
import { getStoredUser } from './utils/auth';

function App() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const user = getStoredUser();

  useEffect(() => {
    checkMaintenance();
    const interval = setInterval(checkMaintenance, 60000);
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
      // Silently fail
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
          <Routes>
        {/* Auth Routes - Moved up for higher priority */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPasswordConfirm />} />

        {/* Public Website Routes */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="programs" element={<Programs />} />
          <Route path="contact" element={<Contact />} />
          <Route path="enroll" element={<Enrollment />} />
          <Route path="announcement" element={<AnnouncementDetails />} />
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
          <Route path="announcements" element={<Announcements />} />
          <Route path="grades" element={<Grades />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="materials" element={<Materials />} />
          <Route path="messages" element={<Messages />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="teachers" element={<Teachers />} />
          <Route path="profile" element={<Profile />} />
          <Route path="register-subjects" element={<RegisterSubjects />} />
          <Route path="class-members" element={<ClassMembers />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="password-reset" element={<PasswordReset />} />
          <Route path="class-management" element={<ClassManagement />} />
          <Route path="subject-assignment" element={<SubjectAssignment />} />
          <Route path="student-enrollment" element={<StudentEnrollment />} />
          <Route path="student-management" element={<StudentManagement />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="backups" element={<Backups />} />
          <Route path="website-content" element={<WebsiteContentManagement />} />
          <Route path="enrollment-management" element={<EnrollmentManagement />} />
          <Route path="account-approvals" element={<AccountApprovals />} />
          <Route path="settings" element={<Settings />} />
          <Route path="grade-input" element={<GradeInput />} />
          <Route path="grade-management" element={<GradeManagement />} />
          <Route path="grade-distribution" element={<GradeDistribution />} />
          <Route path="student-grades" element={<StudentGradeView />} />
          <Route path="grade-reports" element={<GradeReports />} />
        </Route>
      </Routes>
      </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
