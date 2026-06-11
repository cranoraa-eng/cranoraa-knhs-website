import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import TeacherDashboard from './dashboards/TeacherDashboard';
import StudentDashboard from './dashboards/StudentDashboard';
import AdminDashboard from './dashboards/AdminDashboard';

/**
 * Dashboard Router Component
 * Routes users to their role-specific dashboard
 */
const Dashboard = () => {
  const { user } = useAuth();
  
  if (user?.role === 'admin')   return <AdminDashboard />;
  if (user?.role === 'teacher') return <TeacherDashboard />;
  if (user?.role === 'parent')  return <ParentRedirect />;
  return <StudentDashboard />;
};

// Parents are redirected by ProtectedRoute, but handle the edge case here too
const ParentRedirect = () => {
  const navigate = useNavigate();
  useEffect(() => { 
    navigate('/parent-dashboard', { replace: true }); 
  }, [navigate]);
  return null;
};

export default Dashboard;
