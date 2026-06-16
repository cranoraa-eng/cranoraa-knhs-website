/**
 * Centralized route configuration for the KNHS School Portal.
 * 
 * Import from here instead of hardcoding routes in App.jsx.
 * Provides a single source of truth for all routes, their components,
 * and access control rules.
 */
import { lazy } from 'react';
import { Role } from './roles';

// ── Lazy-loaded page components ──────────────────────────────────────────────
const Home = lazy(() => import('../pages/HomeDepEd'));
const About = lazy(() => import('../pages/About'));
const Mission = lazy(() => import('../pages/Mission'));
const Vision = lazy(() => import('../pages/Vision'));
const Faculty = lazy(() => import('../pages/Faculty'));
const Programs = lazy(() => import('../pages/Programs'));
const K12Programs = lazy(() => import('../pages/K12Programs'));
const SeniorHigh = lazy(() => import('../pages/SeniorHigh'));
const Contact = lazy(() => import('../pages/Contact'));
const Enrollment = lazy(() => import('../pages/Enrollment'));
const AnnouncementDetails = lazy(() => import('../pages/AnnouncementDetails'));
const NewsEvents = lazy(() => import('../pages/NewsEvents'));
const Calendar = lazy(() => import('../pages/Calendar'));
const LearningMaterials = lazy(() => import('../pages/LearningMaterials'));
const Portals = lazy(() => import('../pages/Portals'));
const PrivacyPolicy = lazy(() => import('../pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('../pages/TermsOfService'));
const EnrollmentTracking = lazy(() => import('../pages/EnrollmentTracking'));
const Attendance = lazy(() => import('../pages/Attendance'));
const Profile = lazy(() => import('../pages/Profile'));
const ClassMembers = lazy(() => import('../pages/ClassMembers'));
const PasswordReset = lazy(() => import('../pages/PasswordReset'));
const Settings = lazy(() => import('../pages/Settings'));
const Notifications = lazy(() => import('../pages/Notifications'));
const AcademicsHub = lazy(() => import('../pages/AcademicsHub'));
const EnrollmentClassesHub = lazy(() => import('../pages/EnrollmentClassesHub'));
const GradingSuite = lazy(() => import('../pages/GradingSuite'));
const PeopleDirectory = lazy(() => import('../pages/PeopleDirectory'));
const SystemAdminHub = lazy(() => import('../pages/SystemAdminHub'));
const CommunicationCenter = lazy(() => import('../pages/CommunicationCenter'));
const Announcements = lazy(() => import('../pages/Announcements'));
const ParentDashboard = lazy(() => import('../pages/ParentDashboard'));
const Grades = lazy(() => import('../pages/Grades'));
const GradeManagement = lazy(() => import('../pages/GradeManagement'));
const Materials = lazy(() => import('../pages/Materials'));
const Teachers = lazy(() => import('../pages/Teachers'));
const StudentManagement = lazy(() => import('../pages/StudentManagement'));
const AuditLogs = lazy(() => import('../pages/AuditLogs'));
const Backups = lazy(() => import('../pages/Backups'));
const WebsiteContent = lazy(() => import('../pages/WebsiteContent'));
const EnrollmentManagement = lazy(() => import('../pages/EnrollmentManagement'));
const GradeInput = lazy(() => import('../pages/GradeInput'));
const StudentGradeView = lazy(() => import('../pages/StudentGradeView'));
const Moderation = lazy(() => import('../pages/Moderation'));
const Analytics = lazy(() => import('../pages/Analytics'));
const SystemHealth = lazy(() => import('../pages/SystemHealth'));
const ScheduleManagement = lazy(() => import('../pages/ScheduleManagement'));
const MySchedule = lazy(() => import('../pages/MySchedule'));
const ClassManagement = lazy(() => import('../pages/ClassManagement'));
const ParentManagement = lazy(() => import('../pages/ParentManagement'));

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
  { path: 'dashboard', element: Attendance, roles: Role.ALL },
  { path: 'academics-hub', element: AcademicsHub, roles: [Role.ADMIN, Role.STAFF, Role.STUDENT] },
  { path: 'enrollment-classes', element: EnrollmentClassesHub, roles: [Role.ADMIN] },
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
  { path: 'class-members', element: ClassMembers, roles: [Role.ADMIN, Role.STAFF] },
  { path: 'portal-calendar', element: Calendar, props: { mode: 'portal' }, roles: Role.ALL },
  { path: 'password-reset', element: PasswordReset, roles: [Role.PARENT] },
  { path: 'attendance', element: Attendance, roles: [Role.ADMIN, Role.STAFF] },

  // Legacy redirects (old paths → new hub-based paths)
  { path: 'grades', redirect: '/grading-suite?tab=grade-management' },
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
  { path: 'grade-input', redirect: '/grading-suite?tab=grade-input' },
  { path: 'grade-management', redirect: '/grading-suite?tab=grade-management' },
  { path: 'student-grades', redirect: '/grading-suite?tab=my-grades' },
  { path: 'moderation', redirect: '/system-admin?tab=moderation' },
  { path: 'analytics', redirect: '/grading-suite?tab=grade-analytics' },
  { path: 'system-health', redirect: '/system-admin?tab=system-health' },
  { path: 'schedule-management', redirect: '/academics-hub?tab=schedules' },
  { path: 'schedule', redirect: '/academics-hub?tab=schedule' },
  { path: 'parent-management', redirect: '/people-directory?tab=parents' },
];
