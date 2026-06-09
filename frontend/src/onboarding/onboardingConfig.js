export const ONBOARDING_VERSION = '2026.06';

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
    welcomeBody: 'Your hub for schedules, grades, materials, announcements, and messages. The tour shows you around.',
    checklist: [
      { id: 'profile', title: 'Check your profile', description: 'Confirm name, grade, and photo.', to: '/profile', autoCompleteOnPath: '/profile' },
      { id: 'schedule', title: 'View your schedule', description: 'See class times and rooms.', to: '/schedule', autoCompleteOnPath: '/schedule' },
      { id: 'announcements', title: 'Read announcements', description: 'Check school-wide updates.', to: '/announcements', autoCompleteOnPath: '/announcements' },
      { id: 'grades', title: 'Check your grades', description: 'View scores and averages.', to: '/student-grades', autoCompleteOnPath: '/student-grades' },
      { id: 'message', title: 'Open messages', description: 'Chat with teachers and classmates.', to: '/messages', autoCompleteOnPath: '/messages' },
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
            id: 'announcements',
            path: '/announcements',
            target: `[data-tour="${getNavTourId('/announcements')}"]`,
            title: 'Announcements',
            body: 'School and class updates — check weekly.',
            bullets: [
              'Search or filter by category.',
              'Pinned posts stay on top.',
            ],
          },
          {
            id: 'grades',
            path: '/student-grades',
            target: `[data-tour="${getNavTourId('/student-grades')}"]`,
            title: 'My Grades',
            body: 'Scores by subject, quarter, and general average.',
            bullets: [
              'Compare columns to find strengths.',
              'Message your teacher if a score looks off.',
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
              'Bring parent notes to the office for excused absences.',
            ],
          },
          {
            id: 'schedule',
            path: '/schedule',
            target: `[data-tour="${getNavTourId('/schedule')}"]`,
            title: 'Schedule',
            body: 'Weekly timetable with rooms and teachers.',
            bullets: [
              'Scan by day for room and time details.',
            ],
          },
          {
            id: 'materials',
            path: '/materials',
            target: `[data-tour="${getNavTourId('/materials')}"]`,
            title: 'Learning Materials',
            body: 'Teacher-uploaded files and links for study.',
            bullets: [
              'Download PDFs before exams.',
              'Check upload dates for current lessons.',
            ],
          },
          {
            id: 'messages',
            path: '/messages',
            target: `[data-tour="${getNavTourId('/messages')}"]`,
            title: 'Messages',
            body: 'Chat with teachers and classmates inside the portal.',
            bullets: [
              'Keep questions clear: subject, section, assignment.',
              'Report inappropriate content to admins.',
            ],
            note: 'New alerts also appear under Notifications.',
          },
        ],
      },
    },
    tips: [
      {
        id: 'student-grades-tip',
        path: '/student-grades',
        title: 'Reading your grades',
        body: 'Subjects in rows, quarters in columns.',
        bullets: [
          'Check remarks for teacher comments.',
          'Compare your average against passing guidelines.',
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
      {
        id: 'student-materials-tip',
        path: '/materials',
        title: 'Downloading files',
        body: 'Treat this as your subject library.',
        bullets: [
          'Download only what you need to save storage.',
          'Ask in Messages if you can\'t find a handout.',
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
          'Screenshot your weekly schedule.',
          'Read the latest three announcements.',
          'Send a test message if chat is enabled.',
        ],
      },
      {
        id: 'student-grade-help',
        title: 'Understanding grades',
        category: 'Students',
        body: 'Scores come from activities, exams, and quarter grades.',
        bullets: [
          'Per-subject grades may show raw and transmuted scores.',
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
      {
        id: 'student-messages-help',
        title: 'Messaging safely',
        category: 'Students',
        body: 'Portal messaging keeps school records.',
        bullets: [
          'Use full sentences and respectful language.',
          'For urgent matters, speak to your teacher in person.',
        ],
      },
      ...sharedHelpArticles,
    ],
  },

  teacher: {
    welcomeTitle: 'Welcome to your teacher workspace',
    welcomeBody: 'Encode attendance, enter grades, share materials, and message classes from one place.',
    checklist: [
      { id: 'classes', title: 'Review your classes', description: 'See sections, subjects, and student counts.', to: '/my-classes', autoCompleteOnPath: '/my-classes' },
      { id: 'materials', title: 'Open materials', description: 'Upload files students will download.', to: '/materials', autoCompleteOnPath: '/materials' },
      { id: 'attendance', title: 'Open attendance', description: 'Mark present, late, absent, or excused.', to: '/attendance', autoCompleteOnPath: '/attendance' },
      { id: 'grades', title: 'Open grade input', description: 'Enter scores and activities.', to: '/grade-input', autoCompleteOnPath: '/grade-input' },
      { id: 'announcement', title: 'Visit announcements', description: 'See how posts are published.', to: '/announcements', autoCompleteOnPath: '/announcements' },
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
            id: 'classes',
            path: '/my-classes',
            target: `[data-tour="${getNavTourId('/my-classes')}"]`,
            title: 'My Classes',
            body: 'Class roster hub — confirm the correct section before encoding.',
            bullets: [
              'Each card shows section, subject, and student count.',
              'Open a class for members and class tools.',
            ],
          },
          {
            id: 'attendance',
            path: '/attendance',
            target: `[data-tour="${getNavTourId('/attendance')}"]`,
            title: 'Attendance',
            body: 'Submit daily attendance so parents see accurate records.',
            bullets: [
              'Select section and today\'s date first.',
              'Save after marking all rows — dashboard warnings clear.',
            ],
            note: 'Encode during or right after class for accuracy.',
          },
          {
            id: 'grades',
            path: '/grade-input',
            target: `[data-tour="${getNavTourId('/grade-input')}"]`,
            title: 'Grade Input',
            body: 'Enter scores for activities, exams, and quarter grades.',
            bullets: [
              'Set filters (class, subject, quarter) before typing.',
              'Save frequently — large classes take a moment.',
            ],
          },
          {
            id: 'materials',
            path: '/materials',
            target: `[data-tour="${getNavTourId('/materials')}"]`,
            title: 'Materials',
            body: 'Share files and references students download.',
            bullets: [
              'Name clearly: subject + topic + quarter.',
              'Remove outdated files to reduce confusion.',
            ],
          },
          {
            id: 'messages',
            path: '/messages',
            target: `[data-tour="${getNavTourId('/messages')}"]`,
            title: 'Messages',
            body: 'Communicate with students and parents inside the portal.',
            bullets: [
              'Class channels for general instructions, DMs for sensitive topics.',
              'Avoid sharing grades in chat.',
            ],
          },
          {
            id: 'analytics',
            path: '/analytics',
            target: `[data-tour="${getNavTourId('/analytics')}"]`,
            title: 'Analytics',
            body: 'Attendance and grade charts for meetings and interventions.',
            bullets: [
              'Filter by class, subject, or date range.',
              'Export charts for faculty meetings.',
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
          'Use Excused only with documentation on file.',
        ],
      },
      {
        id: 'teacher-grading-tip',
        path: '/grade-input',
        title: 'Before saving grades',
        body: 'Wrong filters cause misplaced scores.',
        bullets: [
          'Confirm section, subject, quarter, and year.',
          'Review a sample row before bulk entry.',
        ],
      },
      {
        id: 'teacher-materials-tip',
        path: '/materials',
        title: 'Naming uploads',
        body: 'Clear names save student support questions.',
        bullets: [
          'Example: "Math10-Q2-Lesson4-Worksheet.pdf".',
          'Replace files instead of duplicating.',
        ],
      },
      ...commonTips,
      {
        id: 'messages-safe',
        path: '/messages',
        title: 'Professional messaging',
        body: 'Keep school communication in the portal for records.',
        bullets: [
          'Post deadlines in Announcements for class-wide visibility.',
          'Use Messages for back-and-forth dialogue.',
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
        body: 'Input = daily encoding. Management = review and edit.',
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
          'Announce major files in Announcements.',
        ],
      },
      {
        id: 'teacher-announcement-help',
        title: 'Posting announcements',
        category: 'Teachers',
        body: 'Announcements reach students and linked parents.',
        bullets: [
          'Choose category and priority (use emergency sparingly).',
          'Pin critical posts until the deadline passes.',
        ],
      },
      ...sharedHelpArticles,
    ],
  },

  admin: {
    welcomeTitle: 'Welcome to the administrator console',
    welcomeBody: 'Monitor analytics, manage users, moderate messages, and configure the system.',
    checklist: [
      { id: 'analytics', title: 'Open analytics', description: 'Review trends and portal activity.', to: '/analytics', autoCompleteOnPath: '/analytics' },
      { id: 'users', title: 'Review users', description: 'See student and teacher accounts.', to: '/student-management', autoCompleteOnPath: '/student-management' },
      { id: 'announcements', title: 'Open announcements', description: 'Practice creating broadcasts.', to: '/announcements', autoCompleteOnPath: '/announcements' },
      { id: 'audit', title: 'Open audit logs', description: 'Find who changed records and when.', to: '/audit-logs', autoCompleteOnPath: '/audit-logs' },
      { id: 'settings', title: 'Review settings', description: 'Locate maintenance and academic year options.', to: '/settings', autoCompleteOnPath: '/settings' },
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
            id: 'analytics',
            path: '/analytics',
            target: `[data-tour="${getNavTourId('/analytics')}"]`,
            title: 'Analytics',
            body: 'Decision-ready summaries of academics and operations.',
            bullets: [
              'Switch charts by academic year.',
              'Use grade distribution before curriculum meetings.',
            ],
          },
          {
            id: 'teachers',
            path: '/teachers',
            target: `[data-tour="${getNavTourId('/teachers')}"]`,
            title: 'Teachers',
            body: 'Create, approve, and maintain faculty accounts.',
            bullets: [
              'Search by name or email for login issues.',
              'Deactivate instead of deleting when staff leave.',
            ],
          },
          {
            id: 'students',
            path: '/student-management',
            target: `[data-tour="${getNavTourId('/student-management')}"]`,
            title: 'Students',
            body: 'Maintain learner records and classroom placement.',
            bullets: [
              'Filter by grade, section, or enrollment state.',
              'Link parents from Parent Management.',
            ],
          },
          {
            id: 'moderation',
            path: '/moderation',
            target: `[data-tour="${getNavTourId('/moderation')}"]`,
            title: 'Moderation',
            body: 'Review reported messages to keep chat safe.',
            bullets: [
              'Read full thread context before acting.',
              'Apply school code-of-conduct steps.',
            ],
          },
          {
            id: 'audit',
            path: '/audit-logs',
            target: `[data-tour="${getNavTourId('/audit-logs')}"]`,
            title: 'Audit Logs',
            body: 'History of important portal actions.',
            bullets: [
              'Filter by user, action, or date range.',
              'Use timestamps to correlate with support tickets.',
            ],
          },
          {
            id: 'settings',
            path: '/settings',
            target: `[data-tour="${getNavTourId('/settings')}"]`,
            title: 'Settings',
            body: 'System-wide controls — change carefully.',
            bullets: [
              'Maintenance mode blocks non-admin logins.',
              'Announce maintenance windows before enabling.',
            ],
          },
        ],
      },
    },
    tips: [
      {
        id: 'admin-analytics-tip',
        path: '/analytics',
        title: 'Data-driven decisions',
        body: 'Use charts to support attendance campaigns or interventions.',
        bullets: [
          'Screenshot charts for leadership meetings.',
        ],
      },
      {
        id: 'admin-audit-tip',
        path: '/audit-logs',
        title: 'Investigating with logs',
        body: 'Logs complement — not replace — conversation.',
        bullets: [
          'Search by username for "missing" grade reports.',
        ],
      },
      {
        id: 'admin-settings-tip',
        path: '/settings',
        title: 'Settings affect everyone',
        body: 'Test major changes when possible.',
        bullets: [
          'Turn off maintenance immediately after deployment.',
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
          'Glance at attendance rate and pending approvals.',
          'Scan analytics for outliers weekly.',
          'Review moderation queue and audit logs.',
        ],
      },
      {
        id: 'admin-user-help',
        title: 'User management',
        category: 'Admins',
        body: 'Accounts split by role to reduce mistakes.',
        bullets: [
          'Teachers — faculty roster and assignments.',
          'Students — enrollment and classroom membership.',
          'Parents — guardian accounts linked to students.',
        ],
      },
      {
        id: 'admin-moderation-help',
        title: 'Moderation workflow',
        category: 'Admins',
        body: 'Handle reports consistently and quickly.',
        bullets: [
          'Read full thread context, not just the flagged line.',
          'Apply school policy and record outcomes.',
        ],
      },
      {
        id: 'admin-parent-help',
        title: 'Parent account setup',
        category: 'Admins',
        body: 'Parents see only linked children\'s data.',
        bullets: [
          'Create account, use Link Children, share temp password.',
        ],
      },
      ...sharedHelpArticles,
    ],
  },

  parent: {
    welcomeTitle: 'Welcome to your parent portal',
    welcomeBody: 'Monitor your child\'s grades, attendance, schedule, and school announcements.',
    checklist: [
      { id: 'dashboard', title: 'Open child dashboard', description: 'Review grades, attendance, and alerts.', to: '/parent-dashboard', autoCompleteOnPath: '/parent-dashboard' },
      { id: 'announcements', title: 'Read announcements', description: 'School-wide news and notices.', to: '/announcements', autoCompleteOnPath: '/announcements' },
      { id: 'calendar', title: 'Open calendar', description: 'Plan around holidays and events.', to: '/portal-calendar', autoCompleteOnPath: '/portal-calendar' },
      { id: 'notifications', title: 'Check notifications', description: 'See alerts for grades and attendance.', to: '/notifications', autoCompleteOnPath: '/notifications' },
      { id: 'profile', title: 'Review your profile', description: 'Keep contact info current.', to: '/profile', autoCompleteOnPath: '/profile' },
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
              'Tap event days to read details.',
              'Check the Upcoming list for summaries.',
            ],
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
            id: 'profile',
            path: '/profile',
            target: '[data-tour="sidebar-profile"]',
            title: 'Your Profile',
            body: 'Keep contact info accurate for school communication.',
            bullets: [
              'Edit phone and address as needed.',
              'Student data is viewed on the dashboard, not here.',
            ],
          },
          {
            id: 'password',
            path: '/password-reset',
            target: `[data-tour="${getNavTourId('/password-reset')}"]`,
            title: 'Change Password',
            body: 'Update after first login or if compromised.',
            bullets: [
              'Enter current + new password twice.',
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
