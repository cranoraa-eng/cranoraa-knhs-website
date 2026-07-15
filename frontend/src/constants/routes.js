/**
 * Centralized route configuration for the KNHS School Portal.
 *
 * Import from here instead of hardcoding routes in App.jsx.
 * Provides a single source of truth for all routes, their components,
 * and access control rules.
 */
import { lazy } from 'react';
import { Role } from './roles';
import { retryImport } from '../utils/lazyImport';

// ── Lazy-loaded page components with retry logic ─────────────────────────────
// All route imports are wrapped with retryImport to handle network failures
// Requirements: 1.2 (route lazy loading), 1.6 (retry on failure)

const Home = lazy(() => retryImport(() => import('../pages/HomeDepEd')));
const About = lazy(() => retryImport(() => import('../pages/About')));
const Mission = lazy(() => retryImport(() => import('../pages/Mission')));
const Vision = lazy(() => retryImport(() => import('../pages/Vision')));
const Faculty = lazy(() => retryImport(() => import('../pages/Faculty')));
const Programs = lazy(() => retryImport(() => import('../pages/Programs')));
const K12Programs = lazy(() => retryImport(() => import('../pages/K12Programs')));
const SeniorHigh = lazy(() => retryImport(() => import('../pages/SeniorHigh')));
const Contact = lazy(() => retryImport(() => import('../pages/Contact')));
const Enrollment = lazy(() => retryImport(() => import('../pages/Enrollment')));
const AnnouncementDetails = lazy(() => retryImport(() => import('../pages/AnnouncementDetails')));
const NewsEvents = lazy(() => retryImport(() => import('../pages/NewsEvents')));
const Calendar = lazy(() => retryImport(() => import('../pages/Calendar')));
const LearningMaterials = lazy(() => retryImport(() => import('../pages/LearningMaterials')));
const Portals = lazy(() => retryImport(() => import('../pages/Portals')));
const PrivacyPolicy = lazy(() => retryImport(() => import('../pages/PrivacyPolicy')));
const TermsOfService = lazy(() => retryImport(() => import('../pages/TermsOfService')));
const EnrollmentTracking = lazy(() => retryImport(() => import('../pages/EnrollmentTracking')));
const Attendance = lazy(() => retryImport(() => import('../pages/Attendance')));
const Profile = lazy(() => retryImport(() => import('../pages/Profile')));

const PasswordReset = lazy(() => retryImport(() => import('../pages/PasswordReset')));
const Settings = lazy(() => retryImport(() => import('../pages/Settings')));
const Notifications = lazy(() => retryImport(() => import('../pages/Notifications')));
const AcademicsHub = lazy(() => retryImport(() => import('../pages/AcademicsHub')));
const EnrollmentClassesHub = lazy(() => retryImport(() => import('../pages/EnrollmentClassesHub')));
const GradingSuite = lazy(() => retryImport(() => import('../pages/GradingSuite')));
const PeopleDirectory = lazy(() => retryImport(() => import('../pages/PeopleDirectory')));
const SystemAdminHub = lazy(() => retryImport(() => import('../pages/SystemAdminHub')));
const CommunicationCenter = lazy(() => retryImport(() => import('../pages/CommunicationCenter')));
const Announcements = lazy(() => retryImport(() => import('../pages/Announcements')));
const ParentDashboard = lazy(() => retryImport(() => import('../pages/ParentDashboard')));
const Dashboard = lazy(() => retryImport(() => import('../pages/Dashboard')));
const AcademicSetup = lazy(() => retryImport(() => import('../pages/AcademicSetup')));

// ── Route definitions ────────────────────────────────────────────────────────

/**
 * Public website routes (no auth required).
 */
export const publicRoutes = [
  { path: '/', element: Home },
  { path: 'about', element: About },
  { path: 'mission', element: Mission },
  { path: 'vision', element: Vision },
  { path: 'faculty', element: Faculty },
  { path: 'programs', element: Programs },
  { path: 'k12-programs', element: K12Programs },
  { path: 'senior-high', element: SeniorHigh },
  { path: 'news-events', element: NewsEvents },
  { path: 'learning-materials', element: LearningMaterials },
  { path: 'portals', element: Portals },
  { path: 'contact', element: Contact },
  { path: 'enroll', element: Enrollment },
  { path: 'announcement', element: AnnouncementDetails },
  { path: 'calendar', element: Calendar },
  { path: 'privacy', element: PrivacyPolicy },
  { path: 'terms', element: TermsOfService },
  { path: 'track-enrollment', element: EnrollmentTracking },
];

/**
 * Protected portal routes (auth required).
 * `roles` defaults to Role.ALL if not specified.
 */
export const protectedRoutes = [
  // Hub routes (primary navigation)
  { path: 'dashboard', element: Dashboard, roles: Role.ALL },
  { path: 'academics-hub', element: AcademicsHub, roles: [Role.ADMIN, Role.STAFF, Role.STUDENT] },
  { path: 'enrollment-classes', element: EnrollmentClassesHub, roles: [Role.ADMIN, Role.STAFF] },
  { path: 'academic-setup', element: AcademicSetup, roles: [Role.ADMIN] },
  { path: 'grading-suite', element: GradingSuite, roles: [Role.ADMIN, Role.STAFF, Role.STUDENT] },
  { path: 'people-directory', element: PeopleDirectory, roles: [Role.ADMIN, Role.STAFF] },
  { path: 'system-admin', element: SystemAdminHub, roles: [Role.ADMIN] },
  { path: 'communication-center', element: CommunicationCenter, roles: Role.ALL },
  { path: 'announcements', element: Announcements, roles: Role.ALL },
  { path: 'notifications', element: Notifications, roles: Role.ALL },
  { path: 'profile', element: Profile, roles: Role.ALL },
  { path: 'settings', element: Settings, roles: [Role.ADMIN, Role.STAFF, Role.STUDENT] },
  { path: 'parent-dashboard', element: ParentDashboard, roles: [Role.PARENT] },

  // Standalone routes
  { path: 'portal-calendar', element: Calendar, props: { mode: 'portal' }, roles: Role.ALL },
  { path: 'password-reset', element: PasswordReset, roles: [Role.PARENT] },
  { path: 'attendance', element: Attendance, roles: [Role.ADMIN, Role.STAFF] },

  // Legacy redirects (old paths → new hub-based paths)
  { path: 'grades', redirect: '/academics-hub?tab=classes' },
  { path: 'materials', redirect: '/academics-hub?tab=materials' },
  { path: 'subjects', redirect: '/academics-hub?tab=subjects' },
  { path: 'teachers', redirect: '/people-directory?tab=teachers' },
  { path: 'class-management', redirect: '/enrollment-classes?tab=classrooms' },
  { path: 'my-classes', redirect: '/academics-hub?tab=classes' },
  { path: 'subject-assignment', redirect: '/academics-hub?tab=subjects' },
  { path: 'student-enrollment', redirect: '/enrollment-classes?tab=student-enrollment' },
  { path: 'student-management', redirect: '/people-directory?tab=students' },
  { path: 'audit-logs', redirect: '/system-admin?tab=audit-logs' },
  { path: 'backups', redirect: '/system-admin?tab=backups' },
  { path: 'website-content', redirect: '/system-admin?tab=website-editor' },
  { path: 'enrollment-management', redirect: '/enrollment-classes?tab=applications' },
  { path: 'grade-input', redirect: '/academics-hub?tab=classes' },
  { path: 'grade-management', redirect: '/academics-hub?tab=classes' },
  { path: 'student-grades', redirect: '/academics-hub?tab=classes' },
  { path: 'moderation', redirect: '/system-admin?tab=moderation' },
  { path: 'analytics', redirect: '/academics-hub?tab=classes' },
  { path: 'system-health', redirect: '/system-admin?tab=system-health' },
  { path: 'schedule-management', redirect: '/academics-hub?tab=schedules' },
  { path: 'schedule', redirect: '/academics-hub?tab=schedule' },
  { path: 'parent-management', redirect: '/people-directory?tab=parents' },
];
