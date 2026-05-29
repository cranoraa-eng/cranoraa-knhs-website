export const ONBOARDING_VERSION = '2026.06';

export const getNavTourId = (path) => {
  if (!path) return undefined;
  return `nav-${path.replace(/^\//, '').replace(/\//g, '-') || 'dashboard'}`;
};

const commonTips = [
  {
    id: 'notifications-live',
    path: '/notifications',
    title: 'Use notifications as your action list',
    body: 'The Notifications page collects alerts from grades, attendance, announcements, messages, and system updates in one timeline.',
    bullets: [
      'Filter by type (grade, attendance, message, etc.) or by read/unread status.',
      'Click a row to open the related page when a link is available.',
      'Use Mark all read after you have reviewed everything important.',
    ],
    note: 'Unread count also appears on the bell icon in the top header.',
  },
  {
    id: 'profile-current',
    path: '/profile',
    title: 'Keep your profile accurate',
    body: 'Teachers and administrators use your profile when they need to contact you or verify learner records.',
    bullets: [
      'Open My Profile from the sidebar or your avatar in the header.',
      'Click Edit Profile to update name, contact number, and address.',
      'Upload a clear profile photo so staff can recognize your account.',
    ],
  },
];

const sharedHelpArticles = [
  {
    id: 'replay-guides',
    title: 'How to replay a tutorial',
    category: 'Getting started',
    body: 'You can restart onboarding whenever you need a refresher—nothing is locked after the first visit.',
    bullets: [
      'Tap Need help in the header (top bar).',
      'Press Tour to launch the full guided walkthrough for your role.',
      'Use Reset in the help panel to clear checklist progress and see the welcome screen again.',
    ],
  },
  {
    id: 'dismissed-tips',
    title: 'About smart tips',
    category: 'Getting started',
    body: 'Smart tips only appear on pages where they are useful, and only once per tip unless you reset onboarding.',
    bullets: [
      'Each tip explains what to do on the current screen.',
      'Choose Got it to hide that tip on all devices for your account.',
      'Choose Show tour to jump into the full menu walkthrough instead.',
    ],
  },
  {
    id: 'keyboard-tour',
    title: 'Keyboard and accessibility',
    category: 'Accessibility',
    body: 'The tour and help panels are built for keyboard and screen-reader use.',
    bullets: [
      'Press Escape to close the tour, welcome screen, or help center.',
      'Tab moves between Skip, Back, and Next during a tour step.',
      'On mobile, use the bottom navigation bar for Home, News, Alerts, and Menu.',
    ],
  },
  {
    id: 'mobile-navigation',
    title: 'Navigating on a phone',
    category: 'Getting started',
    body: 'The portal is responsive: sidebar links move to the bottom bar and Menu on small screens.',
    bullets: [
      'Home — returns to your role dashboard.',
      'News — school announcements.',
      'Alerts or Cal — notifications; parents also get Calendar in the bottom bar.',
      'Menu — opens the full sidebar with every page for your role.',
    ],
  },
];

const roleConfigs = {
  student: {
    welcomeTitle: 'Welcome to your student portal',
    welcomeBody: 'This portal is your daily hub for schedules, grades, attendance, learning materials, announcements, and teacher messages. The guided tour shows exactly which menu item to open and what to do on each page.',
    checklist: [
      {
        id: 'profile',
        title: 'Review your profile',
        description: 'Confirm your name, grade level, contact number, and photo match school records.',
        to: '/profile',
        autoCompleteOnPath: '/profile',
      },
      {
        id: 'schedule',
        title: 'Open your schedule',
        description: 'See class times, rooms, and subjects for each day of the week.',
        to: '/schedule',
        autoCompleteOnPath: '/schedule',
      },
      {
        id: 'announcements',
        title: 'Read announcements',
        description: 'Check school-wide and class posts so you do not miss deadlines or events.',
        to: '/announcements',
        autoCompleteOnPath: '/announcements',
      },
      {
        id: 'grades',
        title: 'Check your grades',
        description: 'Open My Grades to view per-subject scores and your general average.',
        to: '/student-grades',
        autoCompleteOnPath: '/student-grades',
      },
      {
        id: 'message',
        title: 'Visit messages',
        description: 'Find class chats and direct conversations with teachers.',
        to: '/messages',
        autoCompleteOnPath: '/messages',
      },
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
            title: 'Your dashboard (home)',
            body: 'The dashboard summarizes what matters today: greeting, quick stats, schedule preview, and recent messages.',
            bullets: [
              'Read the welcome banner for your name and today’s date.',
              'Tap stat cards to jump to grades, attendance, or materials.',
              'Use action buttons such as Materials and My Grades for frequent tasks.',
              'Scroll down for charts, attendance streak, and today’s class list.',
            ],
            note: 'On mobile, use the bottom Home icon anytime to return here.',
          },
          {
            id: 'announcements',
            path: '/announcements',
            target: `[data-tour="${getNavTourId('/announcements')}"]`,
            title: 'Announcements',
            body: 'Official school and class updates are posted here—check this page at least once per week.',
            bullets: [
              'Use the search box to find a topic or title.',
              'Filter by category (academic, events, emergency, etc.).',
              'Click a card to read the full post and any attachments.',
              'Pinned posts stay at the top for important reminders.',
            ],
          },
          {
            id: 'grades',
            path: '/student-grades',
            target: `[data-tour="${getNavTourId('/student-grades')}"]`,
            title: 'My Grades',
            body: 'View your academic standing by subject, quarter, and general average.',
            bullets: [
              'Select the school year or quarter if filters are shown.',
              'Compare subject columns to see strengths and subjects needing support.',
              'Use the general average summary for report-card style overview.',
              'Message your teacher through Messages if a score looks incorrect.',
            ],
          },
          {
            id: 'attendance',
            path: '/attendance',
            target: `[data-tour="${getNavTourId('/attendance')}"]`,
            title: 'Attendance records',
            body: 'See how teachers marked you each day: present, late, absent, or excused.',
            bullets: [
              'Review the monthly or list view for patterns (many lates, etc.).',
              'Today’s status may show “Not marked” until your teacher submits attendance.',
              'Weekends are skipped in streak calculations on the dashboard.',
            ],
            note: 'Bring a parent note to the office for excused absences—teachers update records after verification.',
          },
          {
            id: 'schedule',
            path: '/schedule',
            target: `[data-tour="${getNavTourId('/schedule')}"]`,
            title: 'Class schedule',
            body: 'Your weekly timetable shows when and where each subject meets.',
            bullets: [
              'Scan by day (Monday–Saturday) for room and teacher names.',
              'Compare with the dashboard “Today’s schedule” widget for the current day only.',
              'Plan materials and commute using start and end times shown per slot.',
            ],
          },
          {
            id: 'materials',
            path: '/materials',
            target: `[data-tour="${getNavTourId('/materials')}"]`,
            title: 'Learning materials',
            body: 'Teachers upload files, links, and references here for independent study.',
            bullets: [
              'Browse by subject or search by filename/topic.',
              'Download PDFs or documents you need offline before exams.',
              'Check upload dates—newer files usually match current lessons.',
            ],
          },
          {
            id: 'messages',
            path: '/messages',
            target: `[data-tour="${getNavTourId('/messages')}"]`,
            title: 'Messages',
            body: 'Stay in touch with teachers and classmates inside the school portal (not personal social media).',
            bullets: [
              'Pick a conversation from the left list (desktop) or conversation screen (mobile).',
              'Keep questions clear: subject, section, and assignment name.',
              'Report inappropriate content using school procedures—admins can moderate.',
            ],
            note: 'New message alerts also appear under Notifications.',
          },
        ],
      },
    },
    tips: [
      {
        id: 'student-grades-tip',
        path: '/student-grades',
        title: 'How to read your grade sheet',
        body: 'Grades are organized by subject rows and quarter columns.',
        bullets: [
          'Start with Q1–Q4 columns for the current school year.',
          'Read the remarks column for teacher comments when available.',
          'Compare your general average against school passing guidelines.',
        ],
      },
      {
        id: 'student-attendance-tip',
        path: '/attendance',
        title: 'Attendance affects more than one number',
        body: 'Repeated late or absent marks may trigger adviser follow-up.',
        bullets: [
          'Present and late usually count toward a positive attendance rate.',
          'Absent without excuse may require a parent letter at the office.',
          'Check this page weekly so surprises do not appear on report cards.',
        ],
      },
      {
        id: 'student-materials-tip',
        path: '/materials',
        title: 'Downloading class files',
        body: 'Treat Learning Materials as your subject library.',
        bullets: [
          'Download only what you need to save phone storage.',
          'Rename files on your device if your teacher uses generic titles.',
          'Ask in Messages if you cannot find a topic’s handout.',
        ],
      },
      ...commonTips.filter((t) => t.id !== 'messages-safe'),
    ],
    helpArticles: [
      {
        id: 'student-first-week',
        title: 'Student first-week checklist',
        category: 'Students',
        body: 'Complete these steps in your first week so you are ready for classes.',
        bullets: [
          'Update profile photo and contact number.',
          'Screenshot or write down your weekly schedule.',
          'Read the latest three announcements.',
          'Open My Grades even if empty—know where scores will appear.',
          'Send a polite test message to a class group if your teacher enabled chat.',
        ],
      },
      {
        id: 'student-grade-help',
        title: 'Understanding grades and averages',
        category: 'Students',
        body: 'Scores come from activities, exams, and quarter grades entered by teachers.',
        bullets: [
          'Per-subject grades may show raw score and transmuted grade.',
          'General average combines final grades across subjects.',
          'Dispute a grade with your teacher first; advisers help if unresolved.',
        ],
      },
      {
        id: 'student-attendance-help',
        title: 'Attendance statuses explained',
        category: 'Students',
        body: 'Each school day receives one mark per class or homeroom, depending on school setup.',
        bullets: [
          'Present — attended on time.',
          'Late — arrived after the allowed window.',
          'Excused — absence approved with documentation.',
          'Absent — not present; may need follow-up.',
        ],
      },
      {
        id: 'student-messages-help',
        title: 'Messaging teachers safely',
        category: 'Students',
        body: 'Portal messaging keeps a school record of academic communication.',
        bullets: [
          'Use full sentences and respectful language.',
          'Do not share passwords or personal social accounts.',
          'For urgent matters during class, speak to your teacher in person.',
        ],
      },
      ...sharedHelpArticles,
    ],
  },

  teacher: {
    welcomeTitle: 'Welcome to your teacher workspace',
    welcomeBody: 'Encode attendance, enter grades, share materials, post announcements, message classes, and review analytics from one workspace. The tour walks through each menu in the order most teachers use daily.',
    checklist: [
      {
        id: 'classes',
        title: 'Review your classes',
        description: 'Open My Classes to see adviser sections, subjects, and student counts.',
        to: '/my-classes',
        autoCompleteOnPath: '/my-classes',
      },
      {
        id: 'materials',
        title: 'Open learning materials',
        description: 'Upload or organize files students will download from the portal.',
        to: '/materials',
        autoCompleteOnPath: '/materials',
      },
      {
        id: 'attendance',
        title: 'Open attendance',
        description: 'Learn where to mark present, late, absent, and excused per class.',
        to: '/attendance',
        autoCompleteOnPath: '/attendance',
      },
      {
        id: 'grades',
        title: 'Open grade input',
        description: 'Find the workspace for encoding scores and activities.',
        to: '/grade-input',
        autoCompleteOnPath: '/grade-input',
      },
      {
        id: 'announcement',
        title: 'Visit announcements',
        description: 'See how school-wide and class posts are published.',
        to: '/announcements',
        autoCompleteOnPath: '/announcements',
      },
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
            title: 'Teacher dashboard',
            body: 'Your dashboard highlights today’s workload: sections, attendance status, and recent activity.',
            bullets: [
              'Check the amber banner if any class still needs attendance today.',
              'Use Quick Actions for Attendance, Grades, Analytics, and Materials.',
              'Review the academic overview table for one-click attendance and grade entry per section.',
            ],
          },
          {
            id: 'classes',
            path: '/my-classes',
            target: `[data-tour="${getNavTourId('/my-classes')}"]`,
            title: 'My Classes',
            body: 'This is your class roster hub—confirm you are viewing the correct section before encoding.',
            bullets: [
              'Each card or row shows section name, subject, and student count.',
              'Open a class to see members, schedules, or class-specific tools.',
              'Cross-check adviser vs subject assignments if you teach multiple sections.',
            ],
          },
          {
            id: 'attendance',
            path: '/attendance',
            target: `[data-tour="${getNavTourId('/attendance')}"]`,
            title: 'Attendance encoding',
            body: 'Submit daily attendance so students and parents see accurate records.',
            bullets: [
              'Select the class/section and today’s date first.',
              'Mark each student: Present, Late, Absent, or Excused.',
              'Save/submit once all rows are complete—dashboard warnings clear after submission.',
            ],
            note: 'Encode attendance during or right after class for best accuracy.',
          },
          {
            id: 'grades',
            path: '/grade-input',
            target: `[data-tour="${getNavTourId('/grade-input')}"]`,
            title: 'Grade input',
            body: 'Enter scores for activities, exams, and quarter grades from this workspace.',
            bullets: [
              'Set filters: class, subject, quarter, and grade type before typing scores.',
              'Save frequently; large classes may take a moment to process.',
              'Use Grade Management later to review or correct submitted entries.',
            ],
          },
          {
            id: 'materials',
            path: '/materials',
            target: `[data-tour="${getNavTourId('/materials')}"]`,
            title: 'Learning materials',
            body: 'Share files and references students access from their portal.',
            bullets: [
              'Upload PDFs, slides, or links with clear titles (subject + topic + quarter).',
              'Assign visibility to the correct class or subject when prompted.',
              'Remove outdated files to reduce student confusion.',
            ],
          },
          {
            id: 'messages',
            path: '/messages',
            target: `[data-tour="${getNavTourId('/messages')}"]`,
            title: 'Classroom messaging',
            body: 'Communicate with students and parents inside the portal for accountability.',
            bullets: [
              'Use class channels for general instructions; direct messages for sensitive topics.',
              'Avoid sharing grades in chat—students should view them in the grade module.',
              'Admins can moderate reported messages.',
            ],
          },
          {
            id: 'analytics',
            path: '/analytics',
            target: `[data-tour="${getNavTourId('/analytics')}"]`,
            title: 'Analytics',
            body: 'Turn attendance and grade data into charts for adviser meetings and interventions.',
            bullets: [
              'Filter by class, subject, or date range when available.',
              'Export or screenshot charts for faculty meetings if your school allows.',
              'Pair analytics with attendance warnings on the dashboard.',
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
        body: 'Consistent attendance encoding helps parents and admins trust portal data.',
        bullets: [
          'Open Attendance from the dashboard warning link when classes are pending.',
          'Double-check transfer students appear in the correct roster.',
          'Use Excused only when documentation is on file at the office.',
        ],
      },
      {
        id: 'teacher-grading-tip',
        path: '/grade-input',
        title: 'Before you save grades',
        body: 'Wrong filters are the most common cause of misplaced scores.',
        bullets: [
          'Confirm section, subject, quarter, and school year.',
          'Verify grade type (quiz, exam, final grade, etc.).',
          'Review a sample row before bulk entry.',
        ],
      },
      {
        id: 'teacher-materials-tip',
        path: '/materials',
        title: 'Naming uploads clearly',
        body: 'Students search materials on mobile—clear names save support questions.',
        bullets: [
          'Example: "Math10-Q2-Lesson4-Worksheet.pdf".',
          'Add a short description when the upload form allows it.',
          'Replace files instead of duplicating when updating a handout.',
        ],
      },
      ...commonTips,
      {
        id: 'messages-safe',
        path: '/messages',
        title: 'Professional portal messaging',
        body: 'Keep school communication inside the portal for moderation and records.',
        bullets: [
          'Post deadlines and reminders in Announcements for class-wide visibility.',
          'Use Messages for questions that need back-and-forth dialogue.',
        ],
      },
    ],
    helpArticles: [
      {
        id: 'teacher-attendance-help',
        title: 'Attendance workflow (step by step)',
        category: 'Teachers',
        body: 'Follow this sequence each class day.',
        bullets: [
          'Open Attendance from the sidebar or dashboard alert.',
          'Choose your section and confirm the date is today.',
          'Mark every student, then submit/save.',
          'Verify the dashboard no longer lists that section as pending.',
        ],
      },
      {
        id: 'teacher-grade-help',
        title: 'Grade workflow (input vs management)',
        category: 'Teachers',
        body: 'Input and management serve different purposes.',
        bullets: [
          'Grade Input — daily encoding of scores and activities.',
          'Grade Management — review, edit, or bulk-fix submitted records.',
          'Coordinate with your department head on quarter lock dates.',
        ],
      },
      {
        id: 'teacher-material-help',
        title: 'Publishing learning materials',
        category: 'Teachers',
        body: 'Students see materials immediately after a successful upload.',
        bullets: [
          'Prefer PDF for uniform mobile viewing.',
          'Test download on a student account if file size is large.',
          'Tell the class in Announcements when a major file is posted.',
        ],
      },
      {
        id: 'teacher-announcement-help',
        title: 'Posting class announcements',
        category: 'Teachers',
        body: 'Announcements reach students and linked parents when targeted correctly.',
        bullets: [
          'Choose category and priority (use emergency sparingly).',
          'Target the right classroom audience—not always "all".',
          'Pin critical posts until the deadline passes.',
        ],
      },
      ...sharedHelpArticles,
    ],
  },

  admin: {
    welcomeTitle: 'Welcome to the administrator console',
    welcomeBody: 'Monitor school-wide analytics, manage users, moderate messages, publish announcements, review audit logs, and configure system settings. The tour explains each admin menu and when to use it.',
    checklist: [
      {
        id: 'analytics',
        title: 'Open analytics',
        description: 'Review attendance trends, grade distribution, and portal activity.',
        to: '/analytics',
        autoCompleteOnPath: '/analytics',
      },
      {
        id: 'users',
        title: 'Review user management',
        description: 'Open student management to see how learner accounts are maintained.',
        to: '/student-management',
        autoCompleteOnPath: '/student-management',
      },
      {
        id: 'announcements',
        title: 'Open announcements',
        description: 'Practice how school-wide broadcasts are created and targeted.',
        to: '/announcements',
        autoCompleteOnPath: '/announcements',
      },
      {
        id: 'audit',
        title: 'Open audit logs',
        description: 'Find who changed records and when for accountability.',
        to: '/audit-logs',
        autoCompleteOnPath: '/audit-logs',
      },
      {
        id: 'settings',
        title: 'Review system settings',
        description: 'Locate maintenance mode, academic year, and institutional options.',
        to: '/settings',
        autoCompleteOnPath: '/settings',
      },
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
            title: 'Admin dashboard',
            body: 'High-level counts and charts before you open detailed management pages.',
            bullets: [
              'Stat cards link to students, teachers, classes, announcements, and attendance.',
              'Review attendance trend charts for sudden drops.',
              'Check pending account approvals if your school enables self-registration.',
            ],
          },
          {
            id: 'analytics',
            path: '/analytics',
            target: `[data-tour="${getNavTourId('/analytics')}"]`,
            title: 'Portal analytics',
            body: 'Decision-ready summaries of academics and operations.',
            bullets: [
              'Switch charts by academic year when the filter is available.',
              'Use grade distribution views before curriculum meetings.',
              'Compare attendance trends across months for intervention planning.',
            ],
          },
          {
            id: 'teachers',
            path: '/teachers',
            target: `[data-tour="${getNavTourId('/teachers')}"]`,
            title: 'Teacher management',
            body: 'Create, approve, and maintain faculty portal accounts.',
            bullets: [
              'Search by name or email when resolving login issues.',
              'Assign subjects and sections after creating a teacher profile.',
              'Deactivate accounts instead of deleting when staff leave mid-year.',
            ],
          },
          {
            id: 'students',
            path: '/student-management',
            target: `[data-tour="${getNavTourId('/student-management')}"]`,
            title: 'Student management',
            body: 'Maintain learner records, enrollment status, and classroom placement.',
            bullets: [
              'Use filters for grade level, section, or enrollment state.',
              'Open a student profile to edit demographics and guardian info.',
              'Link parents from Parent Management after student records exist.',
            ],
          },
          {
            id: 'moderation',
            path: '/moderation',
            target: `[data-tour="${getNavTourId('/moderation')}"]`,
            title: 'Message moderation',
            body: 'Review reported chats to keep communication safe.',
            bullets: [
              'Read the reported message in context before acting.',
              'Resolve, dismiss, or escalate per school policy.',
              'Document repeated issues via audit notes if your process requires it.',
            ],
          },
          {
            id: 'audit',
            path: '/audit-logs',
            target: `[data-tour="${getNavTourId('/audit-logs')}"]`,
            title: 'Audit logs',
            body: 'Immutable-style history of important portal actions.',
            bullets: [
              'Filter by user, action type, or date range.',
              'Use timestamps to correlate with support tickets.',
              'Avoid sharing log exports outside school data policies.',
            ],
          },
          {
            id: 'settings',
            path: '/settings',
            target: `[data-tour="${getNavTourId('/settings')}"]`,
            title: 'System settings',
            body: 'Controls that affect all roles—change carefully.',
            bullets: [
              'Maintenance mode blocks non-admin logins during upgrades.',
              'Academic year settings may affect grade and enrollment views.',
              'Review notification and integration options with IT before toggling.',
            ],
            note: 'Announce maintenance windows to teachers and parents before enabling maintenance mode.',
          },
        ],
      },
    },
    tips: [
      {
        id: 'admin-analytics-tip',
        path: '/analytics',
        title: 'Analytics before policy changes',
        body: 'Use data to support decisions about attendance campaigns or academic support.',
        bullets: [
          'Screenshot charts for leadership meetings.',
          'Drill into grade bands (e.g., below 75) before calling interventions.',
        ],
      },
      {
        id: 'admin-audit-tip',
        path: '/audit-logs',
        title: 'Investigating with audit logs',
        body: 'Logs complement—not replace—conversation with users.',
        bullets: [
          'Search by username when a teacher reports “missing” grades.',
          'Check login entries for password-reset complaints.',
        ],
      },
      {
        id: 'admin-settings-tip',
        path: '/settings',
        title: 'Settings impact everyone',
        body: 'Test major changes on a staging environment when possible.',
        bullets: [
          'Document who approved each institutional toggle.',
          'Turn off maintenance mode immediately after deployments finish.',
        ],
      },
      ...commonTips,
    ],
    helpArticles: [
      {
        id: 'admin-monitoring-help',
        title: 'Daily monitoring routine',
        category: 'Admins',
        body: 'A short routine reduces surprises during the school week.',
        bullets: [
          'Glance at dashboard attendance rate and pending approvals.',
          'Scan analytics for outliers once per week.',
          'Review moderation queue and critical announcements.',
          'Check audit logs after any reported data issue.',
        ],
      },
      {
        id: 'admin-user-help',
        title: 'User management overview',
        category: 'Admins',
        body: 'Accounts are split by role to reduce mistakes.',
        bullets: [
          'Teachers — faculty roster and assignments.',
          'Students — enrollment and classroom membership.',
          'Parents — guardian accounts linked to one or more students.',
        ],
      },
      {
        id: 'admin-moderation-help',
        title: 'Moderation workflow',
        category: 'Admins',
        body: 'Handle reports consistently and quickly.',
        bullets: [
          'Open Message Moderation from the sidebar.',
          'Read full thread context, not only the flagged line.',
          'Apply school code-of-conduct steps and record outcomes.',
        ],
      },
      {
        id: 'admin-parent-help',
        title: 'Parent account setup',
        category: 'Admins',
        body: 'Parents only see data for linked children.',
        bullets: [
          'Create the parent account in Parent Management.',
          'Use Link Children to attach each student.',
          'Share the temporary password and login URL (/login → Parent tab).',
        ],
      },
      ...sharedHelpArticles,
    ],
  },

  parent: {
    welcomeTitle: 'Welcome to your parent portal',
    welcomeBody: 'Monitor your child’s grades, attendance, schedule, and assignments; read school announcements; and check the calendar. The tour explains the parent dashboard tabs and where school-wide updates appear.',
    checklist: [
      {
        id: 'dashboard',
        title: 'Open child dashboard',
        description: 'Review attendance %, grades, classroom, and alerts for each linked child.',
        to: '/parent-dashboard',
        autoCompleteOnPath: '/parent-dashboard',
      },
      {
        id: 'announcements',
        title: 'Read announcements',
        description: 'School-wide news, events, and urgent notices appear here.',
        to: '/announcements',
        autoCompleteOnPath: '/announcements',
      },
      {
        id: 'calendar',
        title: 'Open calendar',
        description: 'Plan around holidays, exams, and school events.',
        to: '/portal-calendar',
        autoCompleteOnPath: '/portal-calendar',
      },
      {
        id: 'notifications',
        title: 'Check notifications',
        description: 'See alerts when grades or attendance are updated.',
        to: '/notifications',
        autoCompleteOnPath: '/notifications',
      },
      {
        id: 'profile',
        title: 'Review your profile',
        description: 'Keep your phone number and email current for school contact.',
        to: '/profile',
        autoCompleteOnPath: '/profile',
      },
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
            title: 'Parent dashboard',
            body: 'Your home page for each linked student’s summary and detail tabs.',
            bullets: [
              'If you have multiple children, tap their name chips at the top to switch.',
              'Stat cards show attendance %, general average, classroom/adviser, and alert count.',
              'Use tabs: Overview, Grades, Attendance, Schedule, and Assignments for depth.',
              'Scroll to School Announcements at the bottom for recent posts.',
            ],
            note: 'If no child appears, contact the school office to link your account to your student.',
          },
          {
            id: 'announcements',
            path: '/announcements',
            target: `[data-tour="${getNavTourId('/announcements')}"]`,
            title: 'School announcements',
            body: 'Official updates from administration and teachers.',
            bullets: [
              'Search or filter by category when many posts are listed.',
              'Open a post to read details and attachments (PDFs, images).',
              'Critical posts may be highlighted—read them the same day when possible.',
            ],
          },
          {
            id: 'calendar',
            path: '/portal-calendar',
            target: `[data-tour="${getNavTourId('/portal-calendar')}"]`,
            title: 'School calendar',
            body: 'Month view of events, holidays, and important dates.',
            bullets: [
              'Use arrows to change months; today is ring-highlighted.',
              'Tap days with events to read titles in the grid.',
              'Check the Upcoming list on the right (or below on mobile) for details.',
            ],
          },
          {
            id: 'notifications',
            path: '/notifications',
            target: '[data-tour="notifications"]',
            title: 'Notifications',
            body: 'Alerts when new grades, attendance marks, or announcements need attention.',
            bullets: [
              'Filter by type if you only want grade or attendance alerts.',
              'Mark items read after reviewing to clear the bell badge.',
              'Open linked pages from a notification when available.',
            ],
          },
          {
            id: 'profile',
            path: '/profile',
            target: '[data-tour="sidebar-profile"]',
            title: 'Your parent profile',
            body: 'Keep contact information accurate so teachers and the office can reach you.',
            bullets: [
              'Click Edit Profile to update phone and address.',
              'Upload a photo if you attend in-person meetings that verify identity.',
              'Student data is viewed on the parent dashboard—not edited here.',
            ],
          },
          {
            id: 'password',
            path: '/password-reset',
            target: `[data-tour="${getNavTourId('/password-reset')}"]`,
            title: 'Change password',
            body: 'Update your password after first login or if you suspect it was shared.',
            bullets: [
              'Enter current password, then new password twice.',
              'Use at least 8 characters with letters, numbers, and symbols.',
              'Store the new password securely—school staff cannot read it back to you.',
            ],
          },
        ],
      },
    },
    tips: [
      {
        id: 'parent-dashboard-tip',
        path: '/parent-dashboard',
        title: 'Using the child dashboard',
        body: 'Start here each visit before opening other menus.',
        bullets: [
          'Overview — today’s classes, recent grades, attendance, and alerts.',
          'Grades / Attendance — full tables with history.',
          'Schedule — weekly timetable; Assignments — due dates and status.',
        ],
      },
      {
        id: 'parent-calendar-tip',
        path: '/portal-calendar',
        title: 'Planning with the calendar',
        body: 'Combine calendar dates with announcements for full context.',
        bullets: [
          'Note exam weeks and holidays early.',
          'Ask your child about assignments due on event-heavy weeks.',
        ],
      },
      {
        id: 'parent-grades-tip',
        path: '/parent-dashboard',
        title: 'When grades look unexpected',
        body: 'Portal grades reflect what teachers have published.',
        bullets: [
          'Confirm the correct child is selected if you have more than one.',
          'Wait 24–48 hours after major exams for teachers to encode.',
          'Contact the subject teacher through school channels—not social media.',
        ],
      },
      ...commonTips.filter((t) => t.id !== 'messages-safe'),
    ],
    helpArticles: [
      {
        id: 'parent-monitor-help',
        title: 'Monitoring your child’s progress',
        category: 'Parents',
        body: 'Use the portal weekly for a clear picture without waiting for report cards.',
        bullets: [
          'Check attendance % and recent absences on the dashboard.',
          'Review general average and subject grades each grading period.',
          'Read Assignments for upcoming due dates.',
        ],
      },
      {
        id: 'parent-communication-help',
        title: 'Talking with the school',
        category: 'Parents',
        body: 'The portal shows data; conversations solve specific concerns.',
        bullets: [
          'Use official school phone/email for urgent matters.',
          'Reference subject and date when asking about a grade or absence.',
          'Parent accounts cannot edit grades—requests go through teachers/advisers.',
        ],
      },
      {
        id: 'parent-announcement-help',
        title: 'Announcements vs calendar',
        category: 'Parents',
        body: 'Both tools work together.',
        bullets: [
          'Announcements — explanations, policies, and class instructions.',
          'Calendar — fixed dates for events and holidays.',
          'Enable push notifications if your school configured them for faster alerts.',
        ],
      },
      {
        id: 'parent-login-help',
        title: 'Logging in as a parent',
        category: 'Parents',
        body: 'First-time access is usually set up by the school.',
        bullets: [
          'Go to the school website login page and choose the Parent tab.',
          'Sign in with the email and temporary password from the office.',
          'Change your password under Account → Change Password immediately.',
        ],
      },
      ...sharedHelpArticles,
    ],
  },
};

export const getOnboardingConfig = (role) => roleConfigs[role] || roleConfigs.student;
