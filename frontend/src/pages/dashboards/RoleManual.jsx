import { useCallback, useEffect, useRef, useState } from 'react';

const MANUALS = {
  student: {
    sections: [
      {
        title: 'Grades & Academics',
        icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
        color: 'text-violet-600 bg-violet-100',
        items: [
          'Open Grading Suite from the sidebar to view all your subject scores organized by quarter (Q1–Q4). The general average column at the far right shows your overall standing per subject. If a score looks incorrect, message your teacher through Communication Center — do not ask them to change it on social media.',
          'Your report card average is calculated from all final grades across subjects. The Remarks column (when available) shows teacher comments about your performance. Check this page after each grading period closes to catch any missing entries early.',
          'Use the grade filters to switch between school years if you need to review previous semesters. Your current year grades are shown by default.',
        ],
      },
      {
        title: 'Attendance Tracking',
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
        color: 'text-emerald-600 bg-emerald-100',
        items: [
          'Open Attendance from the sidebar to see your daily marks: Present, Late, Absent, or Excused. The monthly view shows color-coded badges for each day. Green means present, amber means late, red means absent, and violet means excused.',
          'Your attendance percentage appears on the dashboard stat card. A rate below 85% may trigger an adviser follow-up. If you were absent due to illness, bring a parent note to the school office — teachers update records only after office verification.',
          'Weekends are automatically excluded from streak calculations. The attendance streak on your dashboard counts consecutive weekdays marked Present.',
        ],
      },
      {
        title: 'Schedule & Materials',
        icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
        color: 'text-amber-600 bg-amber-100',
        items: [
          'Open Academics Hub and switch to the Schedule tab to see your weekly timetable. Each cell shows the subject name, room number, and teacher. The schedule is set by your section — if you see a conflict, report it to your class adviser.',
          'Download learning materials from the Materials tab in Academics Hub. Files are organized by subject. Download PDFs before exams so you have them offline. Check upload dates — newer files usually match the current lesson.',
          'Your dashboard shows "Today\'s Schedule" as a quick preview. For the full week view, open the Schedule tab.',
        ],
      },
      {
        title: 'Communication',
        icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
        color: 'text-blue-600 bg-blue-100',
        items: [
          'Open Communication Center to read announcements (Bulletin tab) and message teachers/classmates (Inbox tab). Announcements from the school and your teachers appear here — check at least once per week so you do not miss deadlines or event reminders.',
          'When messaging a teacher, include your section, subject, and the specific assignment or concern. Keep messages respectful and on-topic. For urgent matters during class hours, speak to your teacher in person instead.',
          'Pinned announcements stay at the top of the Bulletin list. These are usually important reminders about deadlines, events, or emergency notices.',
        ],
      },
      {
        title: 'Profile & Account',
        icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
        color: 'text-rose-600 bg-rose-100',
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
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
        color: 'text-emerald-600 bg-emerald-100',
        items: [
          'Open Attendance from the sidebar or click the amber dashboard warning if your class still needs attendance today. Select your section and confirm the date is today. Mark each student as Present, Late, Absent, or Excused.',
          'Encode attendance during or right after class for best accuracy. Dashboard warnings clear after you submit — parents and students see the updated marks in real time.',
          'Use "Excused" only when a parent note or documentation is on file at the school office. Transfer students should appear in your roster after enrollment is processed — if a student is missing, check People Directory to verify their classroom assignment.',
        ],
      },
      {
        title: 'Grade Input & Management',
        icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
        color: 'text-violet-600 bg-violet-100',
        items: [
          'Open Grading Suite and switch to the Grade Input tab. Set your filters first: class section, subject, quarter, and grade type (quiz, exam, participation, etc.) before entering scores. Wrong filters are the most common cause of misplaced grades.',
          'Save frequently — large classes may take a moment to process. Use the Grade Management tab to review, edit, or bulk-fix submitted entries. Coordinate with your department head on quarter lock dates.',
          'The Grade Analytics tab (also in Grading Suite) shows distribution charts and identifies students who may need intervention. Use this data before faculty meetings.',
        ],
      },
      {
        title: 'Learning Materials',
        icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
        color: 'text-amber-600 bg-amber-100',
        items: [
          'Open Academics Hub → Materials tab to upload files students will download from their portal. Use clear filenames: subject + topic + quarter (e.g., "Math10-Q2-Lesson4-Worksheet.pdf"). Students search on mobile — clear names save support questions.',
          'Assign visibility to the correct class or subject when prompted. Remove outdated files to reduce student confusion. Prefer PDF format for uniform mobile viewing.',
          'After uploading a major file, post a reminder in Communication Center → Announcements so the whole class knows.',
        ],
      },
      {
        title: 'Announcements & Messaging',
        icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z',
        color: 'text-blue-600 bg-blue-100',
        items: [
          'Open Communication Center → Bulletin tab to post announcements. Choose the correct category (academic, event, emergency) and target the right audience — not always "all students." Pin critical posts until the deadline passes.',
          'Use the Inbox tab for direct messages with students and parents. Keep questions clear: subject, section, and assignment name. Avoid sharing grades in chat — students should view them in Grading Suite.',
          'For urgent class-wide instructions, post in Announcements. For sensitive or private matters (academic concerns, personal issues), use direct Messages.',
        ],
      },
      {
        title: 'Dashboard & Analytics',
        icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
        color: 'text-cyan-600 bg-cyan-100',
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
        icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
        color: 'text-violet-600 bg-violet-100',
        items: [
          'Open People Directory from the sidebar to manage all accounts: students, teachers, and parents. Filter by role to find specific users. Search by name or email when resolving login issues.',
          'Create new accounts for teachers and staff through People Directory. For students, use Enrollment & Classes to process enrollment applications. Parents are created through People Directory → Parents tab, then linked to students.',
          'Deactivate accounts instead of deleting when staff leave mid-year. This preserves audit trail data. Re-activate if they return.',
        ],
      },
      {
        title: 'Enrollment & Classes',
        icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
        color: 'text-amber-600 bg-amber-100',
        items: [
          'Open Enrollment & Classes to process student enrollment applications. The Applications tab shows pending, approved, and rejected requests. Review documents carefully before approving.',
          'The Classrooms tab manages section assignments. Each classroom has a designated adviser and subject teachers. Assign teachers to sections before the grading period begins.',
          'Use Class Management to create new sections, assign room numbers, and set the school year. Changes here affect what teachers and students see in their dashboards.',
        ],
      },
      {
        title: 'Grading & Analytics',
        icon: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
        color: 'text-emerald-600 bg-emerald-100',
        items: [
          'Open Grading Suite to view grade analytics and distribution charts across all subjects and sections. Use Grade Analytics for intervention planning — identify subjects or sections with low averages before faculty meetings.',
          'Grade Management shows all submitted grades across teachers. Use this to verify completeness before quarter locks. Export charts for leadership meetings.',
          'The grade distribution view helps identify systemic issues: if one subject has unusually low scores school-wide, it may indicate a curriculum or assessment problem.',
        ],
      },
      {
        title: 'Communication & Moderation',
        icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
        color: 'text-blue-600 bg-blue-100',
        items: [
          'Open Communication Center to post school-wide announcements. Use the emergency category sparingly — parents take these seriously. Target announcements to specific groups when possible (e.g., only Grade 10, or only teachers).',
          'The Reports tab in Communication Center shows messages reported by users for inappropriate content. Read the full thread context before acting. Apply school code-of-conduct steps and record outcomes.',
          'Pin important announcements until the deadline passes. Unpin outdated posts to keep the bulletin clean.',
        ],
      },
      {
        title: 'System Administration',
        icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
        color: 'text-slate-600 bg-slate-100',
        items: [
          'Open System Admin Hub for audit logs, backups, website content, and system health. Audit Logs track all important portal actions — filter by user, action type, or date range when investigating issues.',
          'Run backups before major changes (academic year rollover, bulk data operations). The backup status shows when the last backup was created.',
          'Maintenance mode blocks non-admin logins during system upgrades. Always announce maintenance windows to teachers and parents before enabling it. Turn it off immediately after deployment finishes.',
        ],
      },
      {
        title: 'Dashboard & Monitoring',
        icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
        color: 'text-rose-600 bg-rose-100',
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
        icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
        color: 'text-violet-600 bg-violet-100',
        items: [
          'Start at the Parent Dashboard each visit. The overview shows your child\'s attendance percentage, general average, classroom section, and adviser name. If you have multiple children, tap their name chips at the top to switch between them.',
          'The Grades tab shows per-subject scores and quarter grades. Compare columns to see progress over time. The Remarks column (when available) shows teacher comments about your child\'s performance.',
          'The Attendance tab displays daily marks: Present, Late, Absent, or Excused. Review this weekly so surprises do not appear on report cards. A rate below 85% may warrant a conversation with the teacher.',
        ],
      },
      {
        title: 'Schedule & Assignments',
        icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
        color: 'text-amber-600 bg-amber-100',
        items: [
          'The Schedule tab shows your child\'s weekly timetable: subjects, rooms, teachers, and time slots. Use this to plan commute times and verify your child is attending the correct classes.',
          'The Assignments tab lists upcoming and past assignments with due dates and submission status. Check this weekly to help your child stay on track.',
          'Combine schedule and assignment information with the school calendar to plan around exam weeks and project deadlines.',
        ],
      },
      {
        title: 'Announcements & Calendar',
        icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z',
        color: 'text-blue-600 bg-blue-100',
        items: [
          'Read school announcements from Communication Center or the Announcements link. These include policy updates, event notices, and class-specific instructions from teachers. Check at least once per week.',
          'The school calendar (Calendar link in sidebar) shows holidays, exam periods, and school events in a month view. Tap event days to read details. Use the Upcoming list for a quick summary.',
          'Enable push notifications if your school configured them — you will receive alerts when grades are updated, attendance is marked, or new announcements are posted.',
        ],
      },
      {
        title: 'Profile & Account',
        icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
        color: 'text-rose-600 bg-rose-100',
        items: [
          'Open My Profile from the sidebar to update your phone number, email, and address. Teachers and the school office use this information to contact you about your child. Keep it current.',
          'Change your password from Settings → Security or the Change Password link. Use at least 8 characters with a mix of letters, numbers, and symbols. School staff cannot read your password back to you.',
          'Your parent account shows only data for children linked to your account. If a child is missing, contact the school office to link them.',
        ],
      },
      {
        title: 'Communicating with the School',
        icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
        color: 'text-emerald-600 bg-emerald-100',
        items: [
          'For urgent matters, use the school\'s official phone number or email — not social media. Reference your child\'s name, section, and the specific concern (subject, date, assignment) when reaching out.',
          'Parent accounts cannot edit grades or attendance. Requests go through teachers or advisers. Use the portal to monitor; use official channels to discuss concerns.',
          'If you notice unexpected grades, confirm the correct child is selected (if you have multiple), wait 24–48 hours after major exams for teachers to encode, then contact the subject teacher through school channels.',
        ],
      },
    ],
  },
};

const ROLE_LABELS = {
  student: 'Student Portal',
  teacher: 'Teacher Workspace',
  admin: 'Admin Console',
  parent: 'Parent Portal',
};

const BookIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const SectionIcon = ({ d, className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
  </svg>
);

const RoleManual = ({ role = 'student' }) => {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const manual = MANUALS[role];

  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    panelRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') closeModal(); };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, [open, closeModal]);

  if (!manual) return null;

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="w-full flex items-center gap-3 rounded-2xl border border-violet-100 bg-violet-50/60 px-4 py-3 text-left transition-colors hover:bg-violet-100/60"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
          <BookIcon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-slate-900">Portal Manual</p>
          <p className="text-[11px] font-semibold text-slate-500">Detailed guide for using every feature in this portal</p>
        </div>
        <svg className="h-4 w-4 shrink-0 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-3 sm:p-6">
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={closeModal} />

          <div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="manual-title"
            className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl outline-none"
          >
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-slate-100 bg-gradient-to-r from-violet-600 to-violet-700 p-5 sm:p-6 text-white">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20">
                <BookIcon className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p id="manual-title" className="text-lg sm:text-xl font-black">{ROLE_LABELS[role] || 'Portal'} Manual</p>
                <p className="text-xs font-medium text-violet-200">Step-by-step guide for every feature</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close manual"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {manual.sections.map((section, i) => (
                <div key={i} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 sm:p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${section.color}`}>
                      <SectionIcon d={section.icon} className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-black text-slate-900">{section.title}</h3>
                  </div>
                  <ul className="space-y-2.5 ml-12">
                    {section.items.map((item, j) => (
                      <li key={j} className="text-xs font-medium leading-relaxed text-slate-600">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 sm:px-6 flex items-center justify-between">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {manual.sections.length} sections
              </p>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white transition-colors hover:bg-violet-700"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RoleManual;
