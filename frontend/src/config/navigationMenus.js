import {
  BookOpen, Users, Calendar, FileText, MessageSquare,
  Settings, UserCheck, GraduationCap, ClipboardList,
  Award, TrendingUp, Bell, Grid, School, UserCircle,
  Shield, Home, LayoutDashboard
} from 'lucide-react';

/**
 * Navigation Menu Configurations
 * Defines sub-menus for features with sub-pages (Requirement 1.5)
 * 
 * Structure: {
 *   label: string - Menu item label
 *   items: array - Sub-menu items with {label, path, icon}
 *   roles: array - Roles that can see this menu
 * }
 */

export const NAVIGATION_MENUS = {
  // Academic Management Sub-menu - Consolidated into My Classes
  academics: {
    label: 'Academics',
    icon: BookOpen,
    roles: ['teacher', 'admin'],
    items: [
      { label: 'My Classes', path: '/academics-hub?tab=classes', icon: BookOpen },
      { label: 'Learning Materials', path: '/academics-hub?tab=materials', icon: FileText },
      { label: 'Schedule', path: '/academics-hub?tab=schedules', icon: Calendar }
    ]
  },

  // Student Management Sub-menu
  students: {
    label: 'Students',
    icon: GraduationCap,
    roles: ['teacher', 'admin'],
    items: [
      { label: 'Student Directory', path: '/students', icon: Users },
      { label: 'Enrollment Management', path: '/enrollment-management', icon: GraduationCap },
      { label: 'Parent Management', path: '/parent-management', icon: UserCircle },
      { label: 'Student Analytics', path: '/analytics', icon: TrendingUp }
    ]
  },

  // Class Management Sub-menu
  classes: {
    label: 'Classes',
    icon: Grid,
    roles: ['admin', 'teacher'],
    items: [
      { label: 'Class Management', path: '/enrollment-classes?tab=classrooms', icon: Grid },
      { label: 'Subject Management', path: '/subjects', icon: BookOpen },
      { label: 'Schedule Management', path: '/schedule-management', icon: Calendar }
    ]
  },

  // Communication Sub-menu
  communication: {
    label: 'Communication',
    icon: MessageSquare,
    roles: ['student', 'teacher', 'parent', 'admin'],
    items: [
      { label: 'Announcements', path: '/announcements', icon: Bell },
      { label: 'Messages', path: '/communication', icon: MessageSquare },
      { label: 'Notifications', path: '/notifications', icon: Bell }
    ]
  },

  // Administration Sub-menu
  administration: {
    label: 'Administration',
    icon: Shield,
    roles: ['admin'],
    items: [
      { label: 'User Management', path: '/teachers', icon: Users },
      { label: 'System Settings', path: '/settings', icon: Settings },
      { label: 'Audit Logs', path: '/audit-logs', icon: ClipboardList },
      { label: 'System Health', path: '/system-health', icon: TrendingUp },
      { label: 'Content Management', path: '/website-content', icon: FileText }
    ]
  },

  // My Portal Sub-menu (for students/parents)
  myPortal: {
    label: 'My Portal',
    icon: Home,
    roles: ['student', 'parent'],
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'My Grades', path: '/grades', icon: Award },
      { label: 'Attendance', path: '/attendance', icon: UserCheck },
      { label: 'Calendar', path: '/calendar', icon: Calendar },
      { label: 'Profile', path: '/profile', icon: UserCircle }
    ]
  },

  // School Information Sub-menu (public/all users)
  schoolInfo: {
    label: 'School Info',
    icon: School,
    roles: ['student', 'teacher', 'parent', 'admin', 'guest'],
    items: [
      { label: 'About Us', path: '/about', icon: School },
      { label: 'K-12 Programs', path: '/k12-programs', icon: BookOpen },
      { label: 'Faculty', path: '/faculty', icon: Users },
      { label: 'News & Events', path: '/news', icon: Bell },
      { label: 'Contact Us', path: '/contact', icon: MessageSquare }
    ]
  }
};

/**
 * Get navigation menus for a specific role
 * @param {string} role - User role
 * @returns {Array} Array of menu configurations
 */
export const getNavigationMenusForRole = (role) => {
  if (!role) return [];
  
  return Object.values(NAVIGATION_MENUS).filter(menu =>
    menu.roles.includes(role) || menu.roles.includes('guest')
  );
};

/**
 * Get all sub-menu paths (for active state detection)
 * @returns {Array} Array of all sub-menu paths
 */
export const getAllSubMenuPaths = () => {
  const paths = [];
  Object.values(NAVIGATION_MENUS).forEach(menu => {
    menu.items.forEach(item => {
      paths.push(item.path);
    });
  });
  return paths;
};
