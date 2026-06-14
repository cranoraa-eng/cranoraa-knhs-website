export const ONBOARDING_VERSION = '2026.07';

export const getNavTourId = (path) => {
  if (!path) return undefined;
  return `nav-${path.replace(/^\//, '').replace(/\//g, '-') || 'dashboard'}`;
};

const commonTips = [
  {
    id: 'notifications-live',
    path: '/notifications',
    title: 'Your action list',
    body: 'All alerts from grades, attendance, messages, and announcements live here.',
    bullets: [
      'Filter by type or read/unread status.',
      'Tap a row to jump to the related page.',
    ],
    note: 'Unread count shows on the bell icon in the header.',
  },
  {
    id: 'profile-current',
    path: '/profile',
    title: 'Keep your profile updated',
    body: 'Teachers and staff use your profile to contact you or verify records.',
    bullets: [
      'Click Edit Profile to update name, phone, and address.',
      'Upload a clear photo so staff can recognize you.',
    ],
  },
];

const sharedHelpArticles = [
  {
    id: 'replay-guides',
    title: 'Replay a tutorial',
    category: 'Getting started',
    body: 'Restart onboarding anytime — nothing is locked.',
    bullets: [
      'Tap Need help in the header.',
      'Press Tour to restart the walkthrough.',
    ],
  },
  {
    id: 'dismissed-tips',
    title: 'Smart tips',
    category: 'Getting started',
    body: 'Page-specific tips appear once per tip unless you reset.',
    bullets: [
      'Choose Got it to hide a tip permanently.',
      'Choose Show tour to start the full walkthrough.',
    ],
  },
  {
    id: 'keyboard-tour',
    title: 'Keyboard & accessibility',
    category: 'Accessibility',
    body: 'The tour supports keyboard and screen readers.',
    bullets: [
      'Escape closes the tour, welcome screen, or help center.',
      'Tab moves between Skip, Back, and Next.',
    ],
  },
  {
    id: 'mobile-navigation',
    title: 'Phone navigation',
    category: 'Getting started',
    body: 'On mobile, sidebar links move to the bottom bar.',
    bullets: [
      'Home, News, Alerts, and Menu in the bottom bar.',
    ],
  },
];

const roleConfigs = {
  student: {
    welcomeTitle: 'Welcome to your student portal',
    welcomeBody: 'Your hub for academics, grades, messages, and school life. The tour shows you around.',
    checklist: [
      { id: 'profile', title: 'Check your profile', description: 'Confirm name, grade, and photo.', to: '/profile', autoCompleteOnPath: '/profile' },
      { id: 'academics', title: 'Open Academics Hub', description: 'View schedule, materials, and subjects.', to: '/academics-hub', autoCompleteOnPath: '/academics-hub' },
      { id: 'grades', title: 'Open Grading Suite', description: 'Check your scores and averages.', to: '/grading-suite', autoCompleteOnPath: '/grading-suite' },
      { id: 'comms', title: 'Open Communication Center', description: 'Read announcements and messages.', to: '/communication-center', autoCompleteOnPath: '/communication-center' },
      { id: 'attendance', title: 'Check attendance', description: 'See your daily attendance records.', to: '/attendance', autoCompleteOnPath: '/attendance' },
    ],
    tours: {
      primary: {
        id: 'student-get-started',
        label: 'Student portal tour',
        steps: [
          {
            id: 'home',
            path: '/dashboard',
            target: '[data-tour="nav-dashboard"]',
            title: 'Dashboard',
            body: 'Your home screen — greeting, stats, schedule preview, and recent messages.',
            bullets: [
              'Tap stat cards to jump to grades or attendance.',
              'Scroll for charts and today\'s class list.',
            ],
            note: 'Bottom Home icon returns here anytime.',
          },
          {
            id: 'academics',
            path: '/academics-hub',
            target: `[data-tour="${getNavTourId('/academics-hub')}"]`,
            title: 'Academics Hub',
            body: 'All your academic tools in one place: schedule, materials, subjects, and classmates.',
            bullets: [
              'Switch between tabs for different views.',
              'Schedule shows your weekly timetable.',
            ],
          },
          {
            id: 'grading',
            path: '/grading-suite',
            target: `[data-tour="${getNavTourId('/grading-suite')}"]`,
            title: 'Grading Suite',
            body: 'View your scores by subject, quarter, and general average.',
            bullets: [
              'Use tabs to switch between grade views.',
              'Message your teacher if a score looks off.',
            ],
          },
          {
            id: 'comms',
            path: '/communication-center',
            target: `[data-tour="${getNavTourId('/communication-center')}"]`,
            title: 'Communication Center',
            body: 'Announcements, messages, and class chats in one place.',
            bullets: [
              'Tab between Bulletins and Inbox.',
              'Pin important announcements for quick access.',
            ],
          },
          {
            id: 'attendance',
            path: '/attendance',
            target: `[data-tour="${getNavTourId('/attendance')}"]`,
            title: 'Attendance',
            body: 'Daily marks: present, late, absent, or excused.',
            bullets: [
              'Review monthly for patterns.',
            ],
          },
          {
            id: 'calendar',
            path: '/portal-calendar',
            target: `[data-tour="${getNavTourId('/portal-calendar')}"]`,
            title: 'Calendar',
            body: 'Month view of school events, holidays, and deadlines.',
            bullets: [
              'Tap event days to see details.',
            ],
          },
        ],
      },
    },
    tips: [
      {
        id: 'student-grades-tip',
        path: '/grading-suite',
        title: 'Reading your grades',
        body: 'Subjects in rows, quarters in columns.',
        bullets: [
          'Check remarks for teacher comments.',
        ],
      },
      {
        id: 'student-attendance-tip',
        path: '/attendance',
        title: 'Attendance matters',
        body: 'Repeated absences may trigger adviser follow-up.',
        bullets: [
          'Check weekly so surprises don\'t appear on report cards.',
        ],
      },
      ...commonTips.filter((t) => t.id !== 'messages-safe'),
    ],
    helpArticles: [
      {
        id: 'student-first-week',
        title: 'First-week checklist',
        category: 'Students',
        body: 'Get ready for classes in your first week.',
        bullets: [
          'Update profile photo and contact number.',
          'Screenshot your schedule from Academics Hub.',
          'Read the latest announcements in Communication Center.',
          'Send a test message if chat is enabled.',
        ],
      },
      {
        id: 'student-grade-help',
        title: 'Understanding grades',
        category: 'Students',
        body: 'Scores come from activities, exams, and quarter grades.',
        bullets: [
          'Per-subject grades show your scores for each quarter.',
          'Dispute a grade with your teacher first.',
        ],
      },
      {
        id: 'student-attendance-help',
        title: 'Attendance statuses',
        category: 'Students',
        body: 'Each day gets one mark per class.',
        bullets: [
          'Present — on time. Late — arrived after the window.',
          'Excused — approved with documentation. Absent — needs follow-up.',
        ],
      },
      ...sharedHelpArticles,
    ],
  },

  teacher: {
    welcomeTitle: 'Welcome to your teacher workspace',
    welcomeBody: 'Encode attendance, enter grades, share materials, and message classes from one place.',
    checklist: [
      { id: 'classes', title: 'Open Academics Hub', description: 'See your classes, subjects, and materials.', to: '/academics-hub', autoCompleteOnPath: '/academics-hub' },
      { id: 'grading', title: 'Open Grading Suite', description: 'Enter and manage student scores.', to: '/grading-suite', autoCompleteOnPath: '/grading-suite' },
      { id: 'attendance', title: 'Open Attendance', description: 'Mark present, late, absent, or excused.', to: '/attendance', autoCompleteOnPath: '/attendance' },
      { id: 'comms', title: 'Open Communication Center', description: 'Post announcements and message classes.', to: '/communication-center', autoCompleteOnPath: '/communication-center' },
      { id: 'dashboard', title: 'Review Dashboard', description: 'See today\'s workload and pending tasks.', to: '/dashboard', autoCompleteOnPath: '/dashboard' },
    ],
    tours: {
      primary: {
        id: 'teacher-get-started',
        label: 'Teacher portal tour',
        steps: [
          {
            id: 'dashboard',
            path: '/dashboard',
            target: '[data-tour="nav-dashboard"]',
            title: 'Dashboard',
            body: 'Today\'s workload: sections, attendance status, and recent activity.',
            bullets: [
              'Amber banner = classes still need attendance.',
              'Quick Actions for Attendance, Grades, Analytics.',
            ],
          },
          {
            id: 'academics',
            path: '/academics-hub',
            target: `[data-tour="${getNavTourId('/academics-hub')}"]`,
            title: 'Academics Hub',
            body: 'Manage classes, subjects, materials, and schedules.',
            bullets: [
              'Tab between Classes, Materials, Subjects, Schedule.',
              'Open a class for the student roster.',
            ],
          },
          {
            id: 'grading',
            path: '/grading-suite',
            target: `[data-tour="${getNavTourId('/grading-suite')}"]`,
            title: 'Grading Suite',
            body: 'Enter scores, review grade analytics, and manage submissions.',
            bullets: [
              'Set filters before entering scores.',
              'Use Grade Analytics for intervention data.',
            ],
            note: 'Save frequently — large classes take a moment.',
          },
          {
            id: 'attendance',
            path: '/attendance',
            target: `[data-tour="${getNavTourId('/attendance')}"]`,
            title: 'Attendance',
            body: 'Submit daily attendance so parents see accurate records.',
            bullets: [
              'Select section and today\'s date first.',
              'Save after marking all rows.',
            ],
            note: 'Encode during or right after class for accuracy.',
          },
          {
            id: 'comms',
            path: '/communication-center',
            target: `[data-tour="${getNavTourId('/communication-center')}"]`,
            title: 'Communication Center',
            body: 'Post announcements and message students and parents.',
            bullets: [
              'Announcements for class-wide updates.',
              'Inbox for direct messages.',
            ],
          },
          {
            id: 'settings',
            path: '/settings',
            target: `[data-tour="${getNavTourId('/settings')}"]`,
            title: 'Settings',
            body: 'Profile, password, and notification preferences.',
            bullets: [
              'Update your profile so students recognize you.',
            ],
          },
        ],
      },
    },
    tips: [
      {
        id: 'teacher-attendance-tip',
        path: '/attendance',
        title: 'Daily attendance habit',
        body: 'Consistent encoding builds parent trust.',
        bullets: [
          'Open from the dashboard warning when classes are pending.',
        ],
      },
      {
        id: 'teacher-grading-tip',
        path: '/grading-suite',
        title: 'Before saving grades',
        body: 'Wrong filters cause misplaced scores.',
        bullets: [
          'Confirm section, subject, quarter, and year.',
        ],
      },
      ...commonTips,
      {
        id: 'comms-tip',
        path: '/communication-center',
        title: 'Professional messaging',
        body: 'Keep school communication in the portal for records.',
        bullets: [
          'Post deadlines in Announcements for class-wide visibility.',
          'Use Inbox for back-and-forth dialogue.',
        ],
      },
    ],
    helpArticles: [
      {
        id: 'teacher-attendance-help',
        title: 'Attendance workflow',
        category: 'Teachers',
        body: 'Follow this each class day.',
        bullets: [
          'Open Attendance from sidebar or dashboard alert.',
          'Choose section, confirm date, mark all students, save.',
        ],
      },
      {
        id: 'teacher-grade-help',
        title: 'Grade input vs management',
        category: 'Teachers',
        body: 'Grade Input = daily encoding. Grade Management = review and edit.',
        bullets: [
          'Coordinate with department head on quarter lock dates.',
        ],
      },
      {
        id: 'teacher-material-help',
        title: 'Publishing materials',
        category: 'Teachers',
        body: 'Students see materials immediately after upload.',
        bullets: [
          'Prefer PDF for mobile viewing.',
          'Announce major files in Communication Center.',
        ],
      },
      ...sharedHelpArticles,
    ],
  },

  admin: {
    welcomeTitle: 'Welcome to the administrator console',
    welcomeBody: 'Monitor analytics, manage users, moderate messages, and configure the system.',
    checklist: [
      { id: 'people', title: 'Open People Directory', description: 'Manage students, teachers, and parents.', to: '/people-directory', autoCompleteOnPath: '/people-directory' },
      { id: 'comms', title: 'Open Communication Center', description: 'Post announcements and moderate messages.', to: '/communication-center', autoCompleteOnPath: '/communication-center' },
      { id: 'enrollment', title: 'Open Enrollment & Classes', description: 'Handle enrollments and class assignments.', to: '/enrollment-classes', autoCompleteOnPath: '/enrollment-classes' },
      { id: 'system', title: 'Open System Admin Hub', description: 'Audit logs, backups, and system settings.', to: '/system-admin', autoCompleteOnPath: '/system-admin' },
      { id: 'grading', title: 'Open Grading Suite', description: 'View grade analytics and distributions.', to: '/grading-suite', autoCompleteOnPath: '/grading-suite' },
    ],
    tours: {
      primary: {
        id: 'admin-get-started',
        label: 'Admin console tour',
        steps: [
          {
            id: 'dashboard',
            path: '/dashboard',
            target: '[data-tour="nav-dashboard"]',
            title: 'Dashboard',
            body: 'High-level counts and charts for quick overview.',
            bullets: [
              'Stat cards link to students, teachers, and classes.',
              'Review attendance trends for sudden drops.',
            ],
          },
          {
            id: 'comms',
            path: '/communication-center',
            target: `[data-tour="${getNavTourId('/communication-center')}"]`,
            title: 'Communication Center',
            body: 'Post announcements and moderate reported messages.',
            bullets: [
              'Announcements tab for school-wide broadcasts.',
              'Reports tab for message moderation.',
            ],
          },
          {
            id: 'academics',
            path: '/academics-hub',
            target: `[data-tour="${getNavTourId('/academics-hub')}"]`,
            title: 'Academics Hub',
            body: 'Manage subjects, materials, and class schedules.',
            bullets: [
              'Tab between Subjects, Materials, Schedules.',
            ],
          },
          {
            id: 'enrollment',
            path: '/enrollment-classes',
            target: `[data-tour="${getNavTourId('/enrollment-classes')}"]`,
            title: 'Enrollment & Classes',
            body: 'Process enrollments and manage classroom assignments.',
            bullets: [
              'Applications tab for enrollment requests.',
              'Classrooms tab for section management.',
            ],
          },
          {
            id: 'grading',
            path: '/grading-suite',
            target: `[data-tour="${getNavTourId('/grading-suite')}"]`,
            title: 'Grading Suite',
            body: 'View grade analytics and distribution charts.',
            bullets: [
              'Grade Analytics for intervention planning.',
              'Grade Management for reviewing submissions.',
            ],
          },
          {
            id: 'people',
            path: '/people-directory',
            target: `[data-tour="${getNavTourId('/people-directory')}"]`,
            title: 'People Directory',
            body: 'Manage all user accounts: students, teachers, and parents.',
            bullets: [
              'Filter by role to find specific accounts.',
              'Open a profile to edit or link parent accounts.',
            ],
          },
          {
            id: 'system',
            path: '/system-admin',
            target: `[data-tour="${getNavTourId('/system-admin')}"]`,
            title: 'System Admin Hub',
            body: 'Audit logs, backups, website editor, and system health.',
            bullets: [
              'Audit Logs for tracking changes.',
              'Backups for data protection.',
            ],
            note: 'Announce maintenance windows before enabling maintenance mode.',
          },
        ],
      },
    },
    tips: [
      {
        id: 'admin-analytics-tip',
        path: '/grading-suite',
        title: 'Data-driven decisions',
        body: 'Use charts to support attendance campaigns or interventions.',
        bullets: [
          'Screenshot charts for leadership meetings.',
        ],
      },
      {
        id: 'admin-system-tip',
        path: '/system-admin',
        title: 'System admin overview',
        body: 'Everything system-level lives in this hub.',
        bullets: [
          'Check audit logs after any reported data issue.',
          'Run backups before major changes.',
        ],
      },
      ...commonTips,
    ],
    helpArticles: [
      {
        id: 'admin-monitoring-help',
        title: 'Daily monitoring',
        category: 'Admins',
        body: 'A short routine reduces surprises.',
        bullets: [
          'Glance at dashboard attendance rate and pending approvals.',
          'Scan analytics for outliers weekly.',
          'Review moderation queue and audit logs.',
        ],
      },
      {
        id: 'admin-user-help',
        title: 'User management',
        category: 'Admins',
        body: 'All accounts are in People Directory.',
        bullets: [
          'Students — enrollment and classroom membership.',
          'Teachers — faculty roster and assignments.',
          'Parents — guardian accounts linked to students.',
        ],
      },
      {
        id: 'admin-parent-help',
        title: 'Parent account setup',
        category: 'Admins',
        body: 'Parents see only linked children\'s data.',
        bullets: [
          'Create account in People Directory, use Link Children.',
          'Share temp password and login URL.',
        ],
      },
      ...sharedHelpArticles,
    ],
  },

  parent: {
    welcomeTitle: 'Welcome to your parent portal',
    welcomeBody: 'Monitor your child\'s grades, attendance, schedule, and school announcements.',
    checklist: [
      { id: 'dashboard', title: 'Open Dashboard', description: 'Review grades, attendance, and alerts.', to: '/parent-dashboard', autoCompleteOnPath: '/parent-dashboard' },
      { id: 'announcements', title: 'Read Announcements', description: 'School-wide news and notices.', to: '/announcements', autoCompleteOnPath: '/announcements' },
      { id: 'calendar', title: 'Open Calendar', description: 'Plan around holidays and events.', to: '/portal-calendar', autoCompleteOnPath: '/portal-calendar' },
      { id: 'notifications', title: 'Check Notifications', description: 'See alerts for grades and attendance.', to: '/notifications', autoCompleteOnPath: '/notifications' },
      { id: 'profile', title: 'Review Profile', description: 'Keep contact info current.', to: '/profile', autoCompleteOnPath: '/profile' },
    ],
    tours: {
      primary: {
        id: 'parent-get-started',
        label: 'Parent portal tour',
        steps: [
          {
            id: 'dashboard',
            path: '/parent-dashboard',
            target: `[data-tour="${getNavTourId('/parent-dashboard')}"]`,
            title: 'Dashboard',
            body: 'Summary for each linked student with detail tabs.',
            bullets: [
              'Tap name chips to switch between children.',
              'Tabs: Overview, Grades, Attendance, Schedule.',
            ],
            note: 'No child? Contact the school office to link your account.',
          },
          {
            id: 'notifications',
            path: '/notifications',
            target: '[data-tour="notifications"]',
            title: 'Notifications',
            body: 'Alerts for new grades, attendance, and announcements.',
            bullets: [
              'Filter by type. Mark read after reviewing.',
            ],
          },
          {
            id: 'announcements',
            path: '/announcements',
            target: `[data-tour="${getNavTourId('/announcements')}"]`,
            title: 'Announcements',
            body: 'Official updates from administration and teachers.',
            bullets: [
              'Open posts for details and attachments.',
              'Read critical posts the same day.',
            ],
          },
          {
            id: 'calendar',
            path: '/portal-calendar',
            target: `[data-tour="${getNavTourId('/portal-calendar')}"]`,
            title: 'Calendar',
            body: 'Month view of events, holidays, and dates.',
            bullets: [
              'Tap event days to see details.',
            ],
          },
          {
            id: 'profile',
            path: '/profile',
            target: '[data-tour="sidebar-profile"]',
            title: 'Your Profile',
            body: 'Keep contact info accurate for school communication.',
            bullets: [
              'Edit phone and address as needed.',
            ],
          },
          {
            id: 'password',
            path: '/password-reset',
            target: `[data-tour="${getNavTourId('/password-reset')}"]`,
            title: 'Change Password',
            body: 'Update after first login or if compromised.',
            bullets: [
              'Use 8+ characters with letters, numbers, symbols.',
            ],
          },
        ],
      },
    },
    tips: [
      {
        id: 'parent-dashboard-tip',
        path: '/parent-dashboard',
        title: 'Using the dashboard',
        body: 'Start here each visit.',
        bullets: [
          'Overview for today. Grades/Attendance for history.',
        ],
      },
      {
        id: 'parent-calendar-tip',
        path: '/portal-calendar',
        title: 'Planning ahead',
        body: 'Combine calendar with announcements for full context.',
        bullets: [
          'Note exam weeks and holidays early.',
        ],
      },
      {
        id: 'parent-grades-tip',
        path: '/parent-dashboard',
        title: 'Unexpected grades?',
        body: 'Portal grades reflect what teachers have published.',
        bullets: [
          'Confirm the correct child is selected.',
          'Wait 24–48h after exams for encoding.',
        ],
      },
      ...commonTips.filter((t) => t.id !== 'messages-safe'),
    ],
    helpArticles: [
      {
        id: 'parent-monitor-help',
        title: 'Monitoring progress',
        category: 'Parents',
        body: 'Use the portal weekly for a clear picture.',
        bullets: [
          'Check attendance % and recent absences.',
          'Review grades each grading period.',
        ],
      },
      {
        id: 'parent-communication-help',
        title: 'Talking with the school',
        category: 'Parents',
        body: 'The portal shows data; conversations solve concerns.',
        bullets: [
          'Use official phone/email for urgent matters.',
          'Reference subject and date when asking about grades.',
        ],
      },
      {
        id: 'parent-announcement-help',
        title: 'Announcements vs calendar',
        category: 'Parents',
        body: 'Both tools work together.',
        bullets: [
          'Announcements = explanations and policies.',
          'Calendar = fixed dates for events.',
        ],
      },
      {
        id: 'parent-login-help',
        title: 'Logging in',
        category: 'Parents',
        body: 'First-time access is set up by the school.',
        bullets: [
          'Go to login page, choose Parent tab.',
          'Use temp password from the office, then change it.',
        ],
      },
      ...sharedHelpArticles,
    ],
  },
};

export const getOnboardingConfig = (role) => roleConfigs[role] || roleConfigs.student;
