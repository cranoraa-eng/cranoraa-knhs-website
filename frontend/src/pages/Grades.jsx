// This page is kept for routing compatibility.
// The actual grade view is in StudentGradeView (students) and GradeManagement (teachers/admins).
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';

const Grades = () => {
  const navigate = useNavigate();
  const { user } = useCurrentUser();

  useEffect(() => {
    if (user?.role === 'student') {
      navigate('/student-grades', { replace: true });
    } else {
      navigate('/grade-management', { replace: true });
    }
  }, [navigate, user]);

  return null;
};

export default Grades;
