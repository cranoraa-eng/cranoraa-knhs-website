import { useState } from 'react';

const MANUALS = {
  student: {
    sections: [
      {
        title: 'Grades & Academics',
        items: [
          'Open Grading Suite from the sidebar to view all your subject scores organized by quarter (Q1–Q4). The general average column at the far right shows your overall standing per subject. If a score looks incorrect, message your teacher through Communication Center — do not ask them to change it on social media.',
          'Your report card average is calculated from all final grades across subjects. The Remarks column (when available) shows teacher comments about your performance. Check this page after each grading period closes to catch any missing entries early.',
          'Use the grade filters to switch between school years if you need to review previous semesters. Your current year grades are shown by default.',
        ],
      },
      {
        title: 'Attendance Tracking',
        items: [
          'Open Attendance from the sidebar to see your daily marks: Present, Late, Absent, or Excused. The monthly view shows color-coded badges for each day. Green means present, amber means late, red means absent, and violet means excused.',
          'Your attendance percentage appears on the dashboard stat card. A rate below 85% may trigger an adviser follow-up. If you were absent due to illness, bring a parent note to the school office — teachers update records only after office verification.',
          'Weekends are automatically excluded from streak calculations. The attendance streak on your dashboard counts consecutive weekdays marked Present.',
        ],
      },
      {
        title: 'Schedule & Materials',
        items: [
          'Open Academics Hub and switch to the Schedule tab to see your weekly timetable. Each cell shows the subject name, room number, and teacher. The schedule is set by your section — if you see a conflict, report it to your class adviser.',
          'Download learning materials from the Materials tab in Academics Hub. Files are organized by subject. Download PDFs before exams so you have them offline. Check upload dates — newer files usually match the current lesson.',
          'Your dashboard shows "Today\'s Schedule" as a quick preview. For the full week view, open the Schedule tab.',
        ],
      },
      {
        title: 'Communication',
        items: [
          'Open Communication Center to read announcements (Bulletin tab) and message teachers/classmates (Inbox tab). Announcements from the school and your teachers appear here — check at least once per week so you do not miss deadlines or event reminders.',
          'When messaging a teacher, include your section, subject, and the specific assignment or concern. Keep messages respectful and on-topic. For urgent matters during class hours, speak to your teacher in person instead.',
          'Pinned announcements stay at the top of the Bulletin list. These are usually important reminders about deadlines, events, or emergency notices.',
        ],
      },
      {
        title: 'Profile & Account',
        items: [
          'Open My Profile from the sidebar to review your name, grade level, contact number, and profile photo. Teachers and staff use this information to contact you or verify learner records. Keep it accurate.',
          'Upload a clear profile photo so school staff can recognize your account. This is especially important during enrollment and verification periods.',
          'Change your password regularly from Settings → Security. Use at least 8 characters with a mix of letters, numbers, and symbols.',
        ],
      },
    ],
  },

  teacher: {
    sections: [
      {
        title: 'Attendance Encoding',
        items: [
          'Open Attendance from the sidebar or click the amber dashboard warning if your class still needs attendance today. Select your section and confirm the date is today. Mark each student as Present, Late, Absent, or Excused.',
          'Encode attendance during or right after class for best accuracy. Dashboard warnings clear after you submit — parents and students see the updated marks in real time.',
          'Use "Excused" only when a parent note or documentation is on file at the school office. Transfer students should appear in your roster after enrollment is processed — if a student is missing, check People Directory to verify their classroom assignment.',
        ],
      },
      {
        title: 'Grade Input & Management',
        items: [
          'Open Grading Suite and switch to the Grade Input tab. Set your filters first: class section, subject, quarter, and grade type (quiz, exam, participation, etc.) before entering scores. Wrong filters are the most common cause of misplaced grades.',
          'Save frequently — large classes may take a moment to process. Use the Grade Management tab to review, edit, or bulk-fix submitted entries. Coordinate with your department head on quarter lock dates.',
          'The Grade Analytics tab (also in Grading Suite) shows distribution charts and identifies students who may need intervention. Use this data before faculty meetings.',
        ],
      },
      {
        title: 'Learning Materials',
        items: [
          'Open Academics Hub → Materials tab to upload files students will download from their portal. Use clear filenames: subject + topic + quarter (e.g., "Math10-Q2-Lesson4-Worksheet.pdf"). Students search on mobile — clear names save support questions.',
          'Assign visibility to the correct class or subject when prompted. Remove outdated files to reduce student confusion. Prefer PDF format for uniform mobile viewing.',
          'After uploading a major file, post a reminder in Communication Center → Announcements so the whole class knows.',
        ],
      },
      {
        title: 'Announcements & Messaging',
        items: [
          'Open Communication Center → Bulletin tab to post announcements. Choose the correct category (academic, event, emergency) and target the right audience — not always "all students." Pin critical posts until the deadline passes.',
          'Use the Inbox tab for direct messages with students and parents. Keep questions clear: subject, section, and assignment name. Avoid sharing grades in chat — students should view them in Grading Suite.',
          'For urgent class-wide instructions, post in Announcements. For sensitive or private matters (academic concerns, personal issues), use direct Messages.',
        ],
      },
      {
        title: 'Dashboard & Analytics',
        items: [
          'Your dashboard shows today\'s workload at a glance. The amber banner indicates classes that still need attendance. Quick Actions provide one-click access to Attendance, Grades, Analytics, and Materials.',
          'The academic overview table lists each section with student count, pending attendance, and recent activity. Click any row to jump directly to that section\'s tools.',
          'Use the Refresh button if data looks stale. Stats update when teachers submit attendance and grades.',
        ],
      },
    ],
  },

  admin: {
    sections: [
      {
        title: 'User Management',
        items: [
          'Open People Directory from the sidebar to manage all accounts: students, teachers, and parents. Filter by role to find specific users. Search by name or email when resolving login issues.',
          'Create new accounts for teachers and staff through People Directory. For students, use Enrollment & Classes to process enrollment applications. Parents are created through People Directory → Parents tab, then linked to students.',
          'Deactivate accounts instead of deleting when staff leave mid-year. This preserves audit trail data. Re-activate if they return.',
        ],
      },
      {
        title: 'Enrollment & Classes',
        items: [
          'Open Enrollment & Classes to process student enrollment applications. The Applications tab shows pending, approved, and rejected requests. Review documents carefully before approving.',
          'The Classrooms tab manages section assignments. Each classroom has a designated adviser and subject teachers. Assign teachers to sections before the grading period begins.',
          'Use Class Management to create new sections, assign room numbers, and set the school year. Changes here affect what teachers and students see in their dashboards.',
        ],
      },
      {
        title: 'Grading & Analytics',
        items: [
          'Open Grading Suite to view grade analytics and distribution charts across all subjects and sections. Use Grade Analytics for intervention planning — identify subjects or sections with low averages before faculty meetings.',
          'Grade Management shows all submitted grades across teachers. Use this to verify completeness before quarter locks. Export charts for leadership meetings.',
          'The grade distribution view helps identify systemic issues: if one subject has unusually low scores school-wide, it may indicate a curriculum or assessment problem.',
        ],
      },
      {
        title: 'Communication & Moderation',
        items: [
          'Open Communication Center to post school-wide announcements. Use the emergency category sparingly — parents take these seriously. Target announcements to specific groups when possible (e.g., only Grade 10, or only teachers).',
          'The Reports tab in Communication Center shows messages reported by users for inappropriate content. Read the full thread context before acting. Apply school code-of-conduct steps and record outcomes.',
          'Pin important announcements until the deadline passes. Unpin outdated posts to keep the bulletin clean.',
        ],
      },
      {
        title: 'System Administration',
        items: [
          'Open System Admin Hub for audit logs, backups, website content, and system health. Audit Logs track all important portal actions — filter by user, action type, or date range when investigating issues.',
          'Run backups before major changes (academic year rollover, bulk data operations). The backup status shows when the last backup was created.',
          'Maintenance mode blocks non-admin logins during system upgrades. Always announce maintenance windows to teachers and parents before enabling it. Turn it off immediately after deployment finishes.',
        ],
      },
      {
        title: 'Dashboard & Monitoring',
        items: [
          'Your dashboard shows school-wide stat cards: total students, teachers, classes, announcements, and attendance rate. Click any stat card to jump to the detailed view.',
          'Review attendance trend charts for sudden drops — this may indicate a data entry problem or an actual attendance issue. Check pending account approvals if your school enables self-registration.',
          'Use the Refresh button to pull the latest data. Stats update when teachers submit attendance and grades, and when new accounts are created.',
        ],
      },
    ],
  },

  parent: {
    sections: [
      {
        title: 'Monitoring Your Child',
        items: [
          'Start at the Parent Dashboard each visit. The overview shows your child\'s attendance percentage, general average, classroom section, and adviser name. If you have multiple children, tap their name chips at the top to switch between them.',
          'The Grades tab shows per-subject scores and quarter grades. Compare columns to see progress over time. The Remarks column (when available) shows teacher comments about your child\'s performance.',
          'The Attendance tab displays daily marks: Present, Late, Absent, or Excused. Review this weekly so surprises do not appear on report cards. A rate below 85% may warrant a conversation with the teacher.',
        ],
      },
      {
        title: 'Schedule & Assignments',
        items: [
          'The Schedule tab shows your child\'s weekly timetable: subjects, rooms, teachers, and time slots. Use this to plan commute times and verify your child is attending the correct classes.',
          'The Assignments tab lists upcoming and past assignments with due dates and submission status. Check this weekly to help your child stay on track.',
          'Combine schedule and assignment information with the school calendar to plan around exam weeks and project deadlines.',
        ],
      },
      {
        title: 'Announcements & Calendar',
        items: [
          'Read school announcements from Communication Center or the Announcements link. These include policy updates, event notices, and class-specific instructions from teachers. Check at least once per week.',
          'The school calendar (Calendar link in sidebar) shows holidays, exam periods, and school events in a month view. Tap event days to read details. Use the Upcoming list for a quick summary.',
          'Enable push notifications if your school configured them — you will receive alerts when grades are updated, attendance is marked, or new announcements are posted.',
        ],
      },
      {
        title: 'Profile & Account',
        items: [
          'Open My Profile from the sidebar to update your phone number, email, and address. Teachers and the school office use this information to contact you about your child. Keep it current.',
          'Change your password from Settings → Security or the Change Password link. Use at least 8 characters with a mix of letters, numbers, and symbols. School staff cannot read your password back to you.',
          'Your parent account shows only data for children linked to your account. If a child is missing, contact the school office to link them.',
        ],
      },
      {
        title: 'Communicating with the School',
        items: [
          'For urgent matters, use the school\'s official phone number or email — not social media. Reference your child\'s name, section, and the specific concern (subject, date, assignment) when reaching out.',
          'Parent accounts cannot edit grades or attendance. Requests go through teachers or advisers. Use the portal to monitor; use official channels to discuss concerns.',
          'If you notice unexpected grades, confirm the correct child is selected (if you have multiple), wait 24–48 hours after major exams for teachers to encode, then contact the subject teacher through school channels.',
        ],
      },
    ],
  },
};

const BookIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const RoleManual = ({ role = 'student' }) => {
  const [expanded, setExpanded] = useState(false);
  const manual = MANUALS[role];
  if (!manual) return null;

  return (
    <div className="rounded-2xl border border-violet-100 bg-violet-50/60 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-violet-100/60"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
          <BookIcon className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-slate-900">Portal Manual</p>
          <p className="text-[10px] font-semibold text-slate-500">Detailed guide for using every feature in this portal</p>
        </div>
        <svg
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-violet-100 px-4 pb-4 pt-3 space-y-4">
          {manual.sections.map((section, i) => (
            <div key={i}>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-600 mb-2">{section.title}</h3>
              <ul className="space-y-2">
                {section.items.map((item, j) => (
                  <li key={j} className="flex gap-2 text-xs font-medium leading-relaxed text-slate-700">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RoleManual;
