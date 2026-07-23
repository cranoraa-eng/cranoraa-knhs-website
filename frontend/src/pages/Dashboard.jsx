import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import TeacherDashboard from './dashboards/TeacherDashboard';
import StudentDashboard from './dashboards/StudentDashboard';

/**
 * Dashboard Router Component
 * Routes users to their role-specific dashboard
 */
const Dashboard = () => {
  const { user } = useAuth();
  
  if (user?.role === 'admin')   return <AdminRedirect />;
  if (user?.role === 'staff') return <TeacherDashboard />;
  if (user?.role === 'parent')  return <ParentRedirect />;
  return <StudentDashboard />;
};

const AdminRedirect = () => {
  const navigate = useNavigate();
  useEffect(() => { 
    navigate('/system-admin', { replace: true }); 
  }, [navigate]);
  return null;
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
