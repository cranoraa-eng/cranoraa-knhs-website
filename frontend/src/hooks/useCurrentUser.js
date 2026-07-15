import { useAuth } from '../context/AuthContext';

/**
 * Canonical hook for accessing the current user.
 * Wraps AuthContext and provides a consistent interface.
 * 
 * Usage:
 *   const { user, role, isAdmin, isStaff, isStudent, isParent } = useCurrentUser();
 * 
 * Replaces the pattern: const user = getUser() from utils/auth.js
 * which bypasses AuthContext and won't re-render on user changes.
 */
export function useCurrentUser() {
  const { user } = useAuth();

  if (!user) {
    return { user: null, role: null, isAdmin: false, isStaff: false, isStudent: false, isParent: false };
  }

  return {
    user,
    role: user.role,
    isAdmin: user.role === 'admin',
    isStaff: user.role === 'staff',
    isStudent: user.role === 'student',
    isParent: user.role === 'parent',
  };
}
