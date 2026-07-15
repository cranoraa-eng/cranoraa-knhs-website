/**
 * Centralized RBAC constants for the KNHS School Portal frontend.
 *
 * Import from here instead of hardcoding role strings:
 *   import { Role, ROLE_HOME, ROUTE_ACCESS, hasRole } from '@/constants/roles';
 */

export const Role = Object.freeze({
  ADMIN: 'admin',
  STAFF: 'staff',
  STUDENT: 'student',
  PARENT: 'parent',
  ALL: ['admin', 'staff', 'student', 'parent'],
});

export const RoleLabel = Object.freeze({
  [Role.ADMIN]: 'Admin',
  [Role.STAFF]: 'Faculty',
  [Role.STUDENT]: 'Student',
  [Role.PARENT]: 'Parent',
});

export const ROLE_HOME = Object.freeze({
  [Role.ADMIN]: '/dashboard',
  [Role.STAFF]: '/dashboard',
  [Role.STUDENT]: '/dashboard',
  [Role.PARENT]: '/parent-dashboard',
});

export const ROUTE_ACCESS = Object.freeze({
  'academics-hub': [Role.ADMIN, Role.STAFF, Role.STUDENT],
  'enrollment-classes': [Role.ADMIN],
  'grading-suite': [Role.ADMIN, Role.STAFF, Role.STUDENT],
  'people-directory': [Role.ADMIN, Role.STAFF],
  'system-admin': [Role.ADMIN],
  'communication-center': Role.ALL,
  dashboard: Role.ALL,
  announcements: Role.ALL,
  'attendance': [Role.ADMIN, Role.STAFF],
  'materials': [Role.ADMIN, Role.STAFF, Role.STUDENT],
  'messages': Role.ALL,
  'subjects': [Role.ADMIN],
  'teachers': [Role.ADMIN],
  'profile': Role.ALL,
  // Legacy redirects — kept for reference only
  'portal-calendar': Role.ALL,
  'password-reset': [Role.PARENT],

  'student-enrollment': [Role.ADMIN],
  'student-management': [Role.ADMIN, Role.STAFF],
  'audit-logs': [Role.ADMIN],
  'backups': [Role.ADMIN],
  'website-content': [Role.ADMIN],
  'enrollment-management': [Role.ADMIN],
  'settings': [Role.ADMIN, Role.STAFF, Role.STUDENT],
  'grade-input': [Role.ADMIN, Role.STAFF],
  'grades': [Role.ADMIN],
  'grade-management': [Role.ADMIN],
  'student-grades': [Role.STUDENT],
  'moderation': [Role.ADMIN],
  'analytics': [Role.ADMIN, Role.STAFF],
  'system-health': [Role.ADMIN],
  'notifications': Role.ALL,
  'schedule-management': [Role.ADMIN],
  'schedule': [Role.STAFF, Role.STUDENT],
  'parent-dashboard': [Role.PARENT],
  'parent-management': [Role.ADMIN],
});

/**
 * Check if a user has one of the specified roles.
 * @param {Object} user - The user object (must have a `role` property)
  * @param {...string} roles - Allowed roles
 * @returns {boolean}
 */
export function hasRole(user, ...roles) {
  return user && roles.includes(user.role);
}

/**
 * Check if user is admin.
 */
export function isAdmin(user) {
  return user?.role === Role.ADMIN;
}

/**
 * Check if user is staff/teacher.
 */
export function isStaff(user) {
  return user?.role === Role.STAFF;
}

/**
 * Check if user is a student.
 */
export function isStudent(user) {
  return user?.role === Role.STUDENT;
}

/**
 * Check if user is a parent.
 */
export function isParent(user) {
  return user?.role === Role.PARENT;
}

/**
 * Check if user is admin or staff.
 */
export function isAdminOrStaff(user) {
  return user?.role === Role.ADMIN || user?.role === Role.STAFF;
}

/**
 * Get the display label for a role.
 */
export function roleLabel(role) {
  return RoleLabel[role] || role;
}
