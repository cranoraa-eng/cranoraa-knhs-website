export const ONBOARDING_VERSION = '2026.05';

export const getNavTourId = (path) => {
  if (!path) return undefined;
  return `nav-${path.replace(/^\//, '').replace(/\//g, '-') || 'dashboard'}`;
};

const commonTips = [
  {
    id: 'notifications-live',
    path: '/notifications',
    title: 'Keep alerts clear',
    body: 'Use notifications as your action list for new grades, announcements, messages, and system updates.',
  },
  {
    id: 'messages-safe',
    path: '/messages',
    title: 'Use portal messaging for school matters',
    body: 'Messages stay inside the school portal, making classroom and parent communication easier to review.',
  },
  {
    id: 'profile-current',
    path: '/profile',
    title: 'Keep your profile updated',
    body: 'Accurate contact and profile details help the school reach the right person when records need attention.',
  },
];

const sharedHelpArticles = [
  {
    id: 'replay-guides',
    title: 'Replay a tutorial',
    category: 'Getting started',
    body: 'Open Need help, choose the Guided tour card, and start the role guide again whenever you need a refresher.',
  },
  {
    id: 'dismissed-tips',
    title: 'Dismissed tips',
    category: 'Getting started',
    body: 'Tips only appear when they match your current page. Dismissing a tip hides it for your account across devices.',
  },
  {
    id: 'keyboard-tour',
    title: 'Keyboard controls',
    category: 'Accessibility',
    body: 'During a tour, press Escape to close it. The tour dialog keeps focus on its navigation buttons for easier keyboard use.',
  },
  {
    id: 'video-support',
    title: 'Video tutorial support',
    category: 'Tutorials',
    body: 'This help center is ready for video links. Add a videoUrl field to any guide article to show a tutorial link.',
  },
];

const roleConfigs = {
  student: {
    welcomeTitle: 'Welcome to your student portal',
    welcomeBody: 'Track classes, grades, attendance, schedules, announcements, and messages from one calm workspace.',
    checklist: [
      { id: 'profile', title: 'Review your profile', description: 'Check your contact and learner details.', to: '/profile', autoCompleteOnPath: '/profile' },
      { id: 'schedule', title: 'Open your schedule', description: 'Know where and when each class meets.', to: '/schedule', autoCompleteOnPath: '/schedule' },
      { id: 'announcements', title: 'Read announcements', description: 'Stay updated on school and class posts.', to: '/announcements', autoCompleteOnPath: '/announcements' },
      { id: 'grades', title: 'Check your grades', description: 'Review academic performance by subject.', to: '/student-grades', autoCompleteOnPath: '/student-grades' },
      { id: 'message', title: 'Visit messages', description: 'Find teacher and classroom conversations.', to: '/messages', autoCompleteOnPath: '/messages' },
    ],
    tours: {
      primary: {
        id: 'student-get-started',
        label: 'Student portal tour',
        steps: [
          { id: 'home', path: '/dashboard', target: '[data-tour="nav-dashboard"]', title: 'Start at your dashboard', body: 'Your dashboard summarizes the school items that matter most today.' },
          { id: 'announcements', path: '/announcements', target: `[data-tour="${getNavTourId('/announcements')}"]`, title: 'Read announcements', body: 'Open announcements for school-wide posts, classroom reminders, and event details.' },
          { id: 'grades', path: '/student-grades', target: `[data-tour="${getNavTourId('/student-grades')}"]`, title: 'Track grades', body: 'Use My Grades to review your academic standing and identify subjects that need attention.' },
          { id: 'attendance', path: '/attendance', target: `[data-tour="${getNavTourId('/attendance')}"]`, title: 'Check attendance', body: 'Attendance shows presence, late, excused, and absence records entered by your teachers.' },
          { id: 'schedule', path: '/schedule', target: `[data-tour="${getNavTourId('/schedule')}"]`, title: 'Review your schedule', body: 'Your schedule helps you plan classes, rooms, and daily routines.' },
          { id: 'materials', path: '/materials', target: `[data-tour="${getNavTourId('/materials')}"]`, title: 'Find learning materials', body: 'Teachers can upload files and references here so you can study after class.' },
          { id: 'messages', path: '/messages', target: `[data-tour="${getNavTourId('/messages')}"]`, title: 'Message teachers', body: 'Use Messages for classroom questions and school communication.' },
        ],
      },
    },
    tips: [
      { id: 'student-grades-tip', path: '/student-grades', title: 'Read grades by quarter', body: 'Check quarter columns first, then review the general average to understand your current standing.' },
      { id: 'student-attendance-tip', path: '/attendance', title: 'Attendance patterns matter', body: 'Repeated late or absent marks can affect class follow-up, so review records regularly.' },
      { id: 'student-materials-tip', path: '/materials', title: 'Download only what you need', body: 'Use learning materials as your subject library and keep important references available offline.' },
      ...commonTips,
    ],
    helpArticles: [
      { id: 'student-first-week', title: 'Student first-week checklist', category: 'Students', body: 'Start with your profile, schedule, announcements, grades, attendance, and messages.' },
      { id: 'student-grade-help', title: 'Understanding grades', category: 'Students', body: 'Grades are organized by subject and quarter. Contact your teacher through Messages when you need clarification.' },
      { id: 'student-attendance-help', title: 'Understanding attendance', category: 'Students', body: 'Present, late, excused, and absent marks are based on submitted attendance records.' },
      ...sharedHelpArticles,
    ],
  },
  teacher: {
    welcomeTitle: 'Welcome to your teacher workspace',
    welcomeBody: 'Manage attendance, grades, classes, materials, announcements, messages, and analytics from the portal.',
    checklist: [
      { id: 'classes', title: 'Review your classes', description: 'Confirm adviser and assigned class sections.', to: '/my-classes', autoCompleteOnPath: '/my-classes' },
      { id: 'materials', title: 'Open learning materials', description: 'Prepare uploads and class references.', to: '/materials', autoCompleteOnPath: '/materials' },
      { id: 'attendance', title: 'Open attendance', description: 'Submit or review class attendance.', to: '/attendance', autoCompleteOnPath: '/attendance' },
      { id: 'grades', title: 'Open grade input', description: 'Learn where grades are encoded.', to: '/grade-input', autoCompleteOnPath: '/grade-input' },
      { id: 'announcement', title: 'Visit announcements', description: 'Know where school posts are managed.', to: '/announcements', autoCompleteOnPath: '/announcements' },
    ],
    tours: {
      primary: {
        id: 'teacher-get-started',
        label: 'Teacher portal tour',
        steps: [
          { id: 'dashboard', path: '/dashboard', target: '[data-tour="nav-dashboard"]', title: 'Teacher dashboard', body: 'Start here to review current school activity and your teaching workload.' },
          { id: 'classes', path: '/my-classes', target: `[data-tour="${getNavTourId('/my-classes')}"]`, title: 'Class and section management', body: 'My Classes shows adviser sections and class context for attendance and grading.' },
          { id: 'attendance', path: '/attendance', target: `[data-tour="${getNavTourId('/attendance')}"]`, title: 'Submit attendance', body: 'Attendance is where daily presence, late, absent, and excused records are managed.' },
          { id: 'grades', path: '/grade-input', target: `[data-tour="${getNavTourId('/grade-input')}"]`, title: 'Enter grades', body: 'Grade Input is the main workspace for encoding academic records.' },
          { id: 'materials', path: '/materials', target: `[data-tour="${getNavTourId('/materials')}"]`, title: 'Upload materials', body: 'Share files and references with students through Learning Materials.' },
          { id: 'messages', path: '/messages', target: `[data-tour="${getNavTourId('/messages')}"]`, title: 'Classroom messaging', body: 'Messages keep student and parent communication inside the school portal.' },
          { id: 'analytics', path: '/analytics', target: `[data-tour="${getNavTourId('/analytics')}"]`, title: 'Review analytics', body: 'Analytics helps you interpret attendance and academic trends across classes.' },
        ],
      },
    },
    tips: [
      { id: 'teacher-attendance-tip', path: '/attendance', title: 'Submit attendance consistently', body: 'Daily attendance is most useful when encoded close to class time.' },
      { id: 'teacher-grading-tip', path: '/grade-input', title: 'Check filters before encoding', body: 'Confirm class, subject, quarter, and activity filters before saving grades.' },
      { id: 'teacher-materials-tip', path: '/materials', title: 'Use clear file names', body: 'Students find uploads faster when material names include subject, topic, and quarter.' },
      ...commonTips,
    ],
    helpArticles: [
      { id: 'teacher-attendance-help', title: 'Attendance workflow', category: 'Teachers', body: 'Open Attendance, select the class context, mark statuses, and submit once records are complete.' },
      { id: 'teacher-grade-help', title: 'Grade workflow', category: 'Teachers', body: 'Use Grade Input for encoding and Grade Management for reviewing or correcting submitted records.' },
      { id: 'teacher-material-help', title: 'Materials and uploads', category: 'Teachers', body: 'Upload teaching references in Learning Materials and keep file names easy for students to scan.' },
      ...sharedHelpArticles,
    ],
  },
  admin: {
    welcomeTitle: 'Welcome to the administrator console',
    welcomeBody: 'Monitor analytics, users, moderation, announcements, audit logs, settings, and realtime system health.',
    checklist: [
      { id: 'analytics', title: 'Open analytics', description: 'Review portal health and school trends.', to: '/analytics', autoCompleteOnPath: '/analytics' },
      { id: 'users', title: 'Review user management', description: 'Check teacher, student, and parent tools.', to: '/student-management', autoCompleteOnPath: '/student-management' },
      { id: 'announcements', title: 'Open announcements', description: 'Understand school broadcast tools.', to: '/announcements', autoCompleteOnPath: '/announcements' },
      { id: 'audit', title: 'Open audit logs', description: 'Find system activity history.', to: '/audit-logs', autoCompleteOnPath: '/audit-logs' },
      { id: 'settings', title: 'Review system settings', description: 'Know where institutional settings live.', to: '/settings', autoCompleteOnPath: '/settings' },
    ],
    tours: {
      primary: {
        id: 'admin-get-started',
        label: 'Admin console tour',
        steps: [
          { id: 'dashboard', path: '/dashboard', target: '[data-tour="nav-dashboard"]', title: 'Admin dashboard', body: 'Use the dashboard as a quick operational summary before opening deeper tools.' },
          { id: 'analytics', path: '/analytics', target: `[data-tour="${getNavTourId('/analytics')}"]`, title: 'Analytics dashboard', body: 'Analytics is where attendance, grades, and system activity become decision-ready summaries.' },
          { id: 'teachers', path: '/teachers', target: `[data-tour="${getNavTourId('/teachers')}"]`, title: 'Teacher management', body: 'Manage faculty records, approvals, and assignments from Teacher Management.' },
          { id: 'students', path: '/student-management', target: `[data-tour="${getNavTourId('/student-management')}"]`, title: 'Student management', body: 'Student Management helps administrators and advisers review learner records.' },
          { id: 'moderation', path: '/moderation', target: `[data-tour="${getNavTourId('/moderation')}"]`, title: 'Moderation tools', body: 'Use moderation tools to review reported messages and maintain safe communication.' },
          { id: 'audit', path: '/audit-logs', target: `[data-tour="${getNavTourId('/audit-logs')}"]`, title: 'Audit logs', body: 'Audit Logs provide accountability for important user and system activity.' },
          { id: 'settings', path: '/settings', target: `[data-tour="${getNavTourId('/settings')}"]`, title: 'System settings', body: 'Settings centralize operational controls such as maintenance mode and school configuration.' },
        ],
      },
    },
    tips: [
      { id: 'admin-analytics-tip', path: '/analytics', title: 'Use analytics before acting', body: 'Check trends before making user, attendance, or academic decisions.' },
      { id: 'admin-audit-tip', path: '/audit-logs', title: 'Audit logs are your history', body: 'Use filters and timestamps to investigate system activity without disrupting active users.' },
      { id: 'admin-settings-tip', path: '/settings', title: 'Settings affect everyone', body: 'Review changes carefully because system settings can affect all roles.' },
      ...commonTips,
    ],
    helpArticles: [
      { id: 'admin-monitoring-help', title: 'Realtime monitoring', category: 'Admins', body: 'Use notifications, analytics, audit logs, and maintenance tools together for operational awareness.' },
      { id: 'admin-user-help', title: 'User management basics', category: 'Admins', body: 'Teacher, student, and parent management tools are separated so records stay easier to review.' },
      { id: 'admin-moderation-help', title: 'Moderation workflow', category: 'Admins', body: 'Open Message Moderation, review reported content, then resolve or dismiss with notes when needed.' },
      ...sharedHelpArticles,
    ],
  },
  parent: {
    welcomeTitle: 'Welcome to your parent portal',
    welcomeBody: 'Monitor your child, read announcements, check school events, and communicate with the school from one place.',
    checklist: [
      { id: 'dashboard', title: 'Open child dashboard', description: 'Review linked student summaries.', to: '/parent-dashboard', autoCompleteOnPath: '/parent-dashboard' },
      { id: 'announcements', title: 'Read announcements', description: 'Stay informed about school updates.', to: '/announcements', autoCompleteOnPath: '/announcements' },
      { id: 'calendar', title: 'Open calendar', description: 'Check school dates and events.', to: '/portal-calendar', autoCompleteOnPath: '/portal-calendar' },
      { id: 'messages', title: 'Find messages', description: 'Know where communication happens.', to: '/messages', autoCompleteOnPath: '/messages' },
      { id: 'profile', title: 'Review your profile', description: 'Keep parent contact details current.', to: '/profile', autoCompleteOnPath: '/profile' },
    ],
    tours: {
      primary: {
        id: 'parent-get-started',
        label: 'Parent portal tour',
        steps: [
          { id: 'dashboard', path: '/parent-dashboard', target: `[data-tour="${getNavTourId('/parent-dashboard')}"]`, title: 'Child monitoring dashboard', body: 'Your parent dashboard summarizes linked student information in one place.' },
          { id: 'announcements', path: '/announcements', target: `[data-tour="${getNavTourId('/announcements')}"]`, title: 'Read school announcements', body: 'Announcements help you keep up with school updates, reminders, and events.' },
          { id: 'calendar', path: '/portal-calendar', target: `[data-tour="${getNavTourId('/portal-calendar')}"]`, title: 'Use the school calendar', body: 'The calendar shows important dates so you can plan ahead.' },
          { id: 'notifications', path: '/notifications', target: '[data-tour="notifications"]', title: 'Watch notifications', body: 'Notifications alert you when new school updates need attention.' },
          { id: 'messages', path: '/messages', target: `[data-tour="${getNavTourId('/messages')}"]`, title: 'Contact teachers or school staff', body: 'Messages keep communication organized inside the portal.' },
          { id: 'profile', path: '/profile', target: '[data-tour="user-profile"]', title: 'Keep contact details updated', body: 'Accurate parent information helps teachers and administrators reach you.' },
        ],
      },
    },
    tips: [
      { id: 'parent-dashboard-tip', path: '/parent-dashboard', title: 'Start with the child summary', body: 'Use the dashboard to quickly review linked student activity before opening details.' },
      { id: 'parent-calendar-tip', path: '/portal-calendar', title: 'Check upcoming dates', body: 'The calendar is useful for school events, deadlines, and important schedule changes.' },
      ...commonTips,
    ],
    helpArticles: [
      { id: 'parent-monitor-help', title: 'Monitoring your child', category: 'Parents', body: 'Use the parent dashboard as your home base for linked student information.' },
      { id: 'parent-communication-help', title: 'Teacher communication', category: 'Parents', body: 'Use Messages for school-related communication so records stay organized.' },
      { id: 'parent-announcement-help', title: 'Announcements and calendar', category: 'Parents', body: 'Announcements explain school updates, while the calendar helps you plan around important dates.' },
      ...sharedHelpArticles,
    ],
  },
};

export const getOnboardingConfig = (role) => roleConfigs[role] || roleConfigs.student;
