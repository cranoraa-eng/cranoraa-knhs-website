import { useState, useMemo } from 'react';
import {
  Search, Filter, Bell, ChevronDown, ChevronRight, Send, Paperclip,
  CheckCircle2, Clock, AlertCircle, MessageSquare, Users, Building2,
  Inbox, ArrowUpRight, MoreHorizontal, FileText, Phone, Video,
  Star, Archive, Trash2, Reply, Forward, Download, Eye, Plus,
  GraduationCap, BookOpen, Briefcase, Shield, UserCheck, Mail
} from 'lucide-react';

// ─── Mock Data ───────────────────────────────────────────────────────────────

const DEPARTMENTS = [
  { id: 'registrar', name: 'Registrar', icon: FileText, color: 'bg-blue-500', members: 4 },
  { id: 'advisory', name: 'Advisory', icon: GraduationCap, color: 'bg-emerald-500', members: 12 },
  { id: 'faculty', name: 'Faculty', icon: BookOpen, color: 'bg-violet-500', members: 28 },
  { id: 'admin', name: "Principal's Office", icon: Shield, color: 'bg-amber-500', members: 3 },
  { id: 'guidance', name: 'Guidance', icon: UserCheck, color: 'bg-rose-500', members: 2 },
];

const CONVERSATIONS = [
  {
    id: 1,
    subject: 'Enrollment Inquiry for SY 2026-2027',
    category: 'Enrollment',
    sender: { name: 'Maria Santos', role: 'Parent', avatar: 'MS' },
    participants: [
      { name: 'Maria Santos', role: 'Parent' },
      { name: 'Juan Dela Cruz', role: 'Registrar Staff' },
      { name: 'Prof. Reyes', role: 'Grade 10 Adviser' },
    ],
    lastMessage: 'Thank you for the update. We will submit the requirements this week.',
    timestamp: '2026-06-13T10:30:00',
    status: 'open',
    priority: 'normal',
    unread: 2,
    messages: [
      { id: 1, sender: 'Maria Santos', role: 'Parent', content: 'Good morning. I would like to inquire about the enrollment process for my daughter who will be entering Grade 11. What documents are required?', timestamp: '2026-06-12T09:00:00', read: true },
      { id: 2, sender: 'Juan Dela Cruz', role: 'Registrar Staff', content: 'Good morning, Mrs. Santos. For Grade 11 enrollment, we require:\n\n1. Report Card (Form 138)\n2. Birth Certificate (PSA copy)\n3. Certificate of Good Moral Character\n4. 2x2 ID Photos (4 copies)\n\nPlease bring the original documents for verification.', timestamp: '2026-06-12T09:45:00', read: true },
      { id: 3, sender: 'Prof. Reyes', role: 'Grade 10 Adviser', content: "I can confirm that Maria has been an exemplary student. Her grades are well within the passing range for Senior High School enrollment.", timestamp: '2026-06-12T14:20:00', read: true },
      { id: 4, sender: 'Maria Santos', role: 'Parent', content: 'Thank you for the update. We will submit the requirements this week.', timestamp: '2026-06-13T10:30:00', read: false },
    ],
  },
  {
    id: 2,
    subject: 'Absence Notification - Juan Dela Cruz',
    category: 'Attendance',
    sender: { name: 'Pedro Dela Cruz', role: 'Parent', avatar: 'PC' },
    participants: [
      { name: 'Pedro Dela Cruz', role: 'Parent' },
      { name: 'Ms. Garcia', role: 'Grade 9 Adviser' },
    ],
    lastMessage: "Noted. Thank you for informing us. We'll mark the absence as excused.",
    timestamp: '2026-06-13T08:15:00',
    status: 'replied',
    priority: 'normal',
    unread: 0,
    messages: [
      { id: 1, sender: 'Pedro Dela Cruz', role: 'Parent', content: "Good morning. My son Juan will be absent today due to a medical appointment. He will return tomorrow.", timestamp: '2026-06-13T07:30:00', read: true },
      { id: 2, sender: 'Ms. Garcia', role: 'Grade 9 Adviser', content: "Noted. Thank you for informing us. We'll mark the absence as excused. Please submit a medical certificate upon his return.", timestamp: '2026-06-13T08:15:00', read: true },
    ],
  },
  {
    id: 3,
    subject: 'Grade Discrepancy Report',
    category: 'Academic',
    sender: { name: 'Ana Reyes', role: 'Student', avatar: 'AR' },
    participants: [
      { name: 'Ana Reyes', role: 'Student' },
      { name: 'Prof. Martinez', role: 'Math Teacher' },
      { name: 'Dr. Cruz', role: 'Academic Coordinator' },
    ],
    lastMessage: 'We have reviewed the records. The grade has been corrected. Thank you for bringing this to our attention.',
    timestamp: '2026-06-12T16:45:00',
    status: 'resolved',
    priority: 'high',
    unread: 0,
    messages: [
      { id: 1, sender: 'Ana Reyes', role: 'Student', content: "Good afternoon. I noticed that my grade in Mathematics was recorded as 78 instead of 87. Could you please check?", timestamp: '2026-06-12T14:00:00', read: true },
      { id: 2, sender: 'Prof. Martinez', role: 'Math Teacher', content: 'Thank you for reporting this, Ana. Let me verify the records in our system.', timestamp: '2026-06-12T15:30:00', read: true },
      { id: 3, sender: 'Dr. Cruz', role: 'Academic Coordinator', content: 'We have reviewed the records. The grade has been corrected to 87. Thank you for bringing this to our attention.', timestamp: '2026-06-12T16:45:00', read: true },
    ],
  },
  {
    id: 4,
    subject: 'Faculty Meeting Schedule',
    category: 'Collaboration',
    sender: { name: 'Dr. Ramos', role: 'Principal', avatar: 'DR' },
    participants: [
      { name: 'Dr. Ramos', role: 'Principal' },
      { name: 'All Faculty Members', role: 'Faculty' },
    ],
    lastMessage: 'Meeting agenda has been updated. Please review the attached document.',
    timestamp: '2026-06-12T11:00:00',
    status: 'open',
    priority: 'normal',
    unread: 1,
    messages: [
      { id: 1, sender: 'Dr. Ramos', role: 'Principal', content: "Good morning, everyone. There will be a faculty meeting this Friday at 3:00 PM in the Audio-Visual Room. We will discuss the upcoming Foundation Day activities.", timestamp: '2026-06-12T09:00:00', read: true },
      { id: 2, sender: 'Dr. Ramos', role: 'Principal', content: 'Meeting agenda has been updated. Please review the attached document.', timestamp: '2026-06-12T11:00:00', read: false },
    ],
  },
  {
    id: 5,
    subject: 'Library Book Replacement',
    category: 'Facilities',
    sender: { name: 'Carlo Mendoza', role: 'Student', avatar: 'CM' },
    participants: [
      { name: 'Carlo Mendoza', role: 'Student' },
      { name: 'Mrs. Torres', role: 'Librarian' },
    ],
    lastMessage: 'The replacement copy has been received. Please return it to the library counter.',
    timestamp: '2026-06-11T14:20:00',
    status: 'closed',
    priority: 'normal',
    unread: 0,
    messages: [
      { id: 1, sender: 'Carlo Mendoza', role: 'Student', content: "Good afternoon. I accidentally damaged a library book. How can I settle the replacement?", timestamp: '2026-06-11T10:00:00', read: true },
      { id: 2, sender: 'Mrs. Torres', role: 'Librarian', content: 'Good afternoon, Carlo. You can purchase a replacement copy of the same edition. Please bring it to the library counter once acquired.', timestamp: '2026-06-11T10:30:00', read: true },
      { id: 3, sender: 'Carlo Mendoza', role: 'Student', content: 'Understood. I have already purchased the replacement. I will return it tomorrow.', timestamp: '2026-06-11T14:00:00', read: true },
      { id: 4, sender: 'Mrs. Torres', role: 'Librarian', content: 'The replacement copy has been received. Please return it to the library counter.', timestamp: '2026-06-11T14:20:00', read: true },
    ],
  },
  {
    id: 6,
    subject: 'IT Support Request - Lab Equipment',
    category: 'IT Support',
    sender: { name: 'Prof. Lim', role: 'Teacher', avatar: 'PL' },
    participants: [
      { name: 'Prof. Lim', role: 'Teacher' },
      { name: 'Mr. Bautista', role: 'IT Staff' },
    ],
    lastMessage: 'Scheduled for maintenance tomorrow afternoon. Thank you for your patience.',
    timestamp: '2026-06-11T09:30:00',
    status: 'pending',
    priority: 'high',
    unread: 0,
    messages: [
      { id: 1, sender: 'Prof. Lim', role: 'Teacher', content: "Hello. Three computers in Computer Lab 2 are not turning on. This is affecting our ICT classes. Can someone look into this?", timestamp: '2026-06-11T08:00:00', read: true },
      { id: 2, sender: 'Mr. Bautista', role: 'IT Staff', content: 'Thank you for reporting, Prof. Lim. I will check the equipment during the break. It might be a power supply issue.', timestamp: '2026-06-11T08:30:00', read: true },
      { id: 3, sender: 'Mr. Bautista', role: 'IT Staff', content: 'Scheduled for maintenance tomorrow afternoon. Thank you for your patience.', timestamp: '2026-06-11T09:30:00', read: true },
    ],
  },
];

const STATUS_CONFIG = {
  open: { label: 'Open', color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  replied: { label: 'Replied', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  resolved: { label: 'Resolved', color: 'bg-violet-100 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
  closed: { label: 'Closed', color: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
};

const PRIORITY_CONFIG = {
  normal: { label: 'Normal', color: 'text-slate-500' },
  high: { label: 'High Priority', color: 'text-red-600' },
  urgent: { label: 'Urgent', color: 'text-red-700 font-semibold' },
};

const CATEGORIES = ['All', 'Enrollment', 'Attendance', 'Academic', 'Collaboration', 'Facilities', 'IT Support', 'Finance', 'Guidance'];

// ─── Utility Functions ───────────────────────────────────────────────────────

function formatTimestamp(ts) {
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatFullTimestamp(ts) {
  const date = new Date(ts);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// ─── Components ──────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

function Avatar({ initials, size = 'md', color = 'bg-blue-500' }) {
  const sizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
  };
  return (
    <div className={`${sizes[size]} ${color} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}>
      {initials}
    </div>
  );
}

function RoleBadge({ role }) {
  const colors = {
    'Parent': 'bg-sky-50 text-sky-700',
    'Student': 'bg-emerald-50 text-emerald-700',
    'Teacher': 'bg-violet-50 text-violet-700',
    'Grade Adviser': 'bg-violet-50 text-violet-700',
    'Registrar Staff': 'bg-blue-50 text-blue-700',
    "Principal's Office": 'bg-amber-50 text-amber-700',
    'Admin': 'bg-amber-50 text-amber-700',
    'IT Staff': 'bg-orange-50 text-orange-700',
    'Librarian': 'bg-teal-50 text-teal-700',
    'Math Teacher': 'bg-violet-50 text-violet-700',
    'Academic Coordinator': 'bg-indigo-50 text-indigo-700',
    'Faculty': 'bg-violet-50 text-violet-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[role] || 'bg-slate-50 text-slate-600'}`}>
      {role}
    </span>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({ activeSection, onSectionChange, conversations }) {
  const stats = useMemo(() => ({
    total: conversations.length,
    open: conversations.filter(c => c.status === 'open').length,
    pending: conversations.filter(c => c.status === 'pending').length,
    resolved: conversations.filter(c => c.status === 'resolved' || c.status === 'closed').length,
  }), [conversations]);

  const sections = [
    { id: 'all', label: 'All Conversations', icon: Inbox, count: stats.total },
    { id: 'open', label: 'Open Tickets', icon: MessageSquare, count: stats.open },
    { id: 'pending', label: 'Pending Action', icon: Clock, count: stats.pending },
    { id: 'resolved', label: 'Resolved', icon: CheckCircle2, count: stats.resolved },
  ];

  return (
    <div className="w-72 bg-white border-r border-slate-200 flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">Communication</h1>
            <p className="text-xs text-slate-500">Center</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <p className="text-lg font-bold text-blue-600">{stats.open}</p>
            <p className="text-[10px] text-blue-600 font-medium">Open</p>
          </div>
          <div className="text-center p-2 bg-amber-50 rounded-lg">
            <p className="text-lg font-bold text-amber-600">{stats.pending}</p>
            <p className="text-[10px] text-amber-600 font-medium">Pending</p>
          </div>
          <div className="text-center p-2 bg-emerald-50 rounded-lg">
            <p className="text-lg font-bold text-emerald-600">{stats.resolved}</p>
            <p className="text-[10px] text-emerald-600 font-medium">Done</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-3 py-3">
        <p className="px-2 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Navigation</p>
        <div className="space-y-0.5">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeSection === section.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <section.icon className="w-4 h-4" />
              <span className="flex-1 text-left">{section.label}</span>
              {section.count > 0 && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  activeSection === section.id ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {section.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Departments */}
      <div className="px-3 py-3 border-t border-slate-100">
        <p className="px-2 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Departments</p>
        <div className="space-y-0.5">
          {DEPARTMENTS.map(dept => (
            <button
              key={dept.id}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <div className={`w-7 h-7 ${dept.color} rounded-lg flex items-center justify-center`}>
                <dept.icon className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="flex-1 text-left">{dept.name}</span>
              <span className="text-xs text-slate-400">{dept.members}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Conversations */}
      <div className="px-3 py-3 border-t border-slate-100 flex-1 overflow-y-auto">
        <p className="px-2 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Recent</p>
        <div className="space-y-1">
          {conversations.slice(0, 3).map(conv => (
            <button
              key={conv.id}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
            >
              <Avatar initials={conv.sender.avatar} size="sm" color="bg-blue-500" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-700 truncate">{conv.sender.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{conv.subject}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Conversation List ───────────────────────────────────────────────────────

function ConversationList({ conversations, selectedId, onSelect, searchQuery, onSearchChange, categoryFilter, onCategoryChange }) {
  return (
    <div className="w-96 bg-white border-r border-slate-200 flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900">Conversations</h2>
          <div className="flex items-center gap-2">
            <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
              <Bell className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                categoryFilter === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <Inbox className="w-10 h-10 mb-2" />
            <p className="text-sm font-medium">No conversations found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`w-full text-left px-4 py-3.5 hover:bg-slate-50 transition-colors ${
                  selectedId === conv.id ? 'bg-blue-50 border-l-2 border-blue-600' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <Avatar initials={conv.sender.avatar} color="bg-blue-500" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-semibold text-slate-900 truncate">{conv.sender.name}</span>
                      <span className="text-[10px] text-slate-400 flex-shrink-0 ml-2">
                        {formatTimestamp(conv.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-700 truncate mb-1">{conv.subject}</p>
                    <p className="text-xs text-slate-500 truncate mb-2">{conv.lastMessage}</p>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={conv.status} />
                      <span className={`text-[10px] font-medium ${PRIORITY_CONFIG[conv.priority].color}`}>
                        {conv.priority !== 'normal' && PRIORITY_CONFIG[conv.priority].label}
                      </span>
                      {conv.unread > 0 && (
                        <span className="ml-auto bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Message Thread ──────────────────────────────────────────────────────────

function MessageThread({ conversation }) {
  const [replyText, setReplyText] = useState('');
  const [showParticipants, setShowParticipants] = useState(false);

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
          <MessageSquare className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-lg font-semibold text-slate-600 mb-1">Select a Conversation</h3>
        <p className="text-sm text-slate-400">Choose a conversation from the list to view details</p>
      </div>
    );
  }

  const conv = conversation;

  return (
    <div className="flex-1 flex flex-col bg-slate-50 h-full">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-lg font-bold text-slate-900">{conv.subject}</h2>
              <StatusBadge status={conv.status} />
              {conv.priority !== 'normal' && (
                <span className={`text-xs font-semibold ${PRIORITY_CONFIG[conv.priority].color}`}>
                  {PRIORITY_CONFIG[conv.priority].label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                {conv.category}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Created {formatFullTimestamp(conv.messages[0].timestamp)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
              <Phone className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
              <Video className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
              <Star className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Participants */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Participants:</span>
          <div className="flex items-center gap-1.5">
            {conv.participants.slice(0, showParticipants ? conv.participants.length : 3).map((p, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-600"
              >
                <span className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-[9px] text-white font-bold">
                  {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </span>
                {p.name}
                <RoleBadge role={p.role} />
              </span>
            ))}
            {conv.participants.length > 3 && !showParticipants && (
              <button
                onClick={() => setShowParticipants(true)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                +{conv.participants.length - 3} more
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {conv.messages.map((msg, idx) => {
          const isParent = msg.role === 'Parent';
          const isStudent = msg.role === 'Student';
          const isStaff = !isParent && !isStudent;

          return (
            <div key={msg.id} className={`flex gap-3 ${isStaff ? 'flex-row' : 'flex-row-reverse'}`}>
              <Avatar
                initials={msg.sender.split(' ').map(n => n[0]).join('').slice(0, 2)}
                size="md"
                color={isStaff ? 'bg-blue-600' : isParent ? 'bg-emerald-600' : 'bg-violet-600'}
              />
              <div className={`max-w-lg ${isStaff ? '' : 'text-right'}`}>
                <div className="flex items-center gap-2 mb-1" style={{ flexDirection: isStaff ? 'row' : 'row-reverse' }}>
                  <span className="text-sm font-semibold text-slate-900">{msg.sender}</span>
                  <RoleBadge role={msg.role} />
                  <span className="text-[10px] text-slate-400">{formatTimestamp(msg.timestamp)}</span>
                </div>
                <div className={`p-4 rounded-2xl ${
                  isStaff
                    ? 'bg-white border border-slate-200 rounded-tl-md'
                    : 'bg-blue-600 text-white rounded-tr-md'
                }`}>
                  <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isStaff ? 'text-slate-700' : 'text-white'}`}>
                    {msg.content}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 mt-1" style={{ flexDirection: isStaff ? 'row' : 'row-reverse' }}>
                  {msg.read ? (
                    <CheckCircle2 className="w-3 h-3 text-blue-500" />
                  ) : (
                    <Eye className="w-3 h-3 text-slate-300" />
                  )}
                  <span className="text-[10px] text-slate-400">{msg.read ? 'Read' : 'Sent'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply Area */}
      <div className="bg-white border-t border-slate-200 px-6 py-4">
        <div className="flex items-end gap-3">
          <button className="p-2.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors flex-shrink-0">
            <Paperclip className="w-5 h-5" />
          </button>
          <div className="flex-1 relative">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply..."
              rows={1}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
          <button
            className={`p-2.5 rounded-xl flex-shrink-0 transition-colors ${
              replyText.trim()
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <Reply className="w-3 h-3" />
            Reply
          </span>
          <span className="flex items-center gap-1">
            <Forward className="w-3 h-3" />
            Forward
          </span>
          <span className="flex items-center gap-1">
            <Archive className="w-3 h-3" />
            Archive
          </span>
          <span className="flex items-center gap-1">
            <Trash2 className="w-3 h-3" />
            Delete
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Right Panel ─────────────────────────────────────────────────────────────

function RightPanel({ conversation }) {
  if (!conversation) return null;

  const conv = conversation;

  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full overflow-y-auto">
      {/* Ticket Info */}
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Ticket Details</h3>
        <div className="space-y-3">
          <div>
            <p className="text-[10px] text-slate-400 mb-1">Ticket ID</p>
            <p className="text-sm font-mono font-semibold text-slate-700">TKT-{String(conv.id).padStart(4, '0')}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 mb-1">Category</p>
            <p className="text-sm font-medium text-slate-700">{conv.category}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 mb-1">Status</p>
            <StatusBadge status={conv.status} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 mb-1">Priority</p>
            <p className={`text-sm font-medium ${PRIORITY_CONFIG[conv.priority].color}`}>
              {PRIORITY_CONFIG[conv.priority].label}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 mb-1">Messages</p>
            <p className="text-sm font-medium text-slate-700">{conv.messages.length} messages</p>
          </div>
        </div>
      </div>

      {/* Participants */}
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Participants</h3>
        <div className="space-y-2.5">
          {conv.participants.map((p, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
              <Avatar
                initials={p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                size="sm"
                color="bg-blue-500"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{p.name}</p>
                <RoleBadge role={p.role} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Actions</h3>
        <div className="space-y-2">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <Archive className="w-4 h-4 text-slate-400" />
            Archive Conversation
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <ArrowUpRight className="w-4 h-4 text-slate-400" />
            Escalate to Principal
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <Users className="w-4 h-4 text-slate-400" />
            Add Participant
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Attachments */}
      <div className="px-5 py-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Attachments</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-700 truncate">enrollment_requirements.pdf</p>
              <p className="text-[10px] text-slate-400">245 KB</p>
            </div>
            <button className="p-1 rounded hover:bg-slate-200 text-slate-400">
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg">
            <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-700 truncate">report_card_form138.jpg</p>
              <p className="text-[10px] text-slate-400">1.2 MB</p>
            </div>
            <button className="p-1 rounded hover:bg-slate-200 text-slate-400">
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <button className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors">
          <Plus className="w-3.5 h-3.5" />
          Upload File
        </button>
      </div>
    </div>
  );
}

// ─── Main CommunicationCenter ────────────────────────────────────────────────

export default function CommunicationCenter() {
  const [activeSection, setActiveSection] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const filteredConversations = useMemo(() => {
    let filtered = CONVERSATIONS;

    // Filter by section
    if (activeSection === 'open') {
      filtered = filtered.filter(c => c.status === 'open');
    } else if (activeSection === 'pending') {
      filtered = filtered.filter(c => c.status === 'pending');
    } else if (activeSection === 'resolved') {
      filtered = filtered.filter(c => c.status === 'resolved' || c.status === 'closed');
    }

    // Filter by category
    if (categoryFilter !== 'All') {
      filtered = filtered.filter(c => c.category === categoryFilter);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.subject.toLowerCase().includes(query) ||
        c.sender.name.toLowerCase().includes(query) ||
        c.lastMessage.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [activeSection, searchQuery, categoryFilter]);

  const selectedConversation = useMemo(() => {
    return CONVERSATIONS.find(c => c.id === selectedId) || null;
  }, [selectedId]);

  return (
    <div className="h-screen flex bg-slate-100">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        conversations={CONVERSATIONS}
      />
      <ConversationList
        conversations={filteredConversations}
        selectedId={selectedId}
        onSelect={setSelectedId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
      />
      <MessageThread conversation={selectedConversation} />
      <RightPanel conversation={selectedConversation} />
    </div>
  );
}
