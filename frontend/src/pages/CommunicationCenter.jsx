import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

const Icon = ({ d, size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
);

const Icons = {
  Search: (p) => <Icon {...p} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
  Bell: (p) => <Icon {...p} d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />,
  Plus: (p) => <Icon {...p} d="M12 5v14M5 12h14" />,
  Send: (p) => <Icon {...p} d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />,
  Paperclip: (p) => <Icon {...p} d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />,
  CheckCircle: (p) => <Icon {...p} d="M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3" />,
  Clock: (p) => <Icon {...p} d="M12 2a10 10 0 100 20 10 10 0 000-20zM12 6v6l4 2" />,
  MessageSquare: (p) => <Icon {...p} d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />,
  Users: (p) => <Icon {...p} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />,
  Inbox: (p) => <Icon {...p} d="M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />,
  ArrowUpRight: (p) => <Icon {...p} d="M7 17l9.2-9.2M17 17V7H7" />,
  MoreHorizontal: (p) => <Icon {...p} d="M12 12h.01M8 12h.01M16 12h.01" />,
  FileText: (p) => <Icon {...p} d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8" />,
  Phone: (p) => <Icon {...p} d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />,
  Video: (p) => <Icon {...p} d="M23 7l-7 5 7 5V7z M1 5h14a2 2 0 012 2v10a2 2 0 01-2 2H1" />,
  Star: (p) => <Icon {...p} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
  Archive: (p) => <Icon {...p} d="M21 8v13H3V8M1 3h22v5H1zM10 12h4" />,
  Trash2: (p) => <Icon {...p} d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />,
  Reply: (p) => <Icon {...p} d="M9 17l-5-5 5-5M4 12h11a4 4 0 010 8h-1" />,
  Forward: (p) => <Icon {...p} d="M15 17l5-5-5-5M20 12H9a4 4 0 000 8h1" />,
  Download: (p) => <Icon {...p} d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />,
  Eye: (p) => <Icon {...p} d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z" />,
  GraduationCap: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5" /></svg>,
  BookOpen: (p) => <Icon {...p} d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />,
  Shield: (p) => <Icon {...p} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  UserCheck: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" /><polyline points="17 11 19 13 23 9" /></svg>,
  Loader: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${p.className || ''} animate-spin`}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>,
  AlertCircle: (p) => <Icon {...p} d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v4M12 16h.01" />,
};

// ─── Config ──────────────────────────────────────────────────────────────────

const DEPARTMENTS = [
  { id: 'registrar', name: 'Registrar', icon: 'FileText', color: 'bg-blue-500', categories: ['enrollment'] },
  { id: 'advisory', name: 'Advisory', icon: 'GraduationCap', color: 'bg-emerald-500', categories: ['attendance', 'academic'] },
  { id: 'faculty', name: 'Faculty', icon: 'BookOpen', color: 'bg-violet-500', categories: ['academic', 'collaboration'] },
  { id: 'admin', name: "Principal's Office", icon: 'Shield', color: 'bg-amber-500', categories: ['collaboration', 'facilities'] },
  { id: 'guidance', name: 'Guidance', icon: 'UserCheck', color: 'bg-rose-500', categories: ['guidance'] },
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

const AVATAR_COLORS = ['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500'];

function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name) {
  return (name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

// ─── Utility Functions ───────────────────────────────────────────────────────

function formatTimestamp(ts) {
  if (!ts) return '';
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
  if (!ts) return '';
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
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.open;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

function Avatar({ initials, size = 'md', color }) {
  const sizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
  };
  return (
    <div className={`${sizes[size]} ${color || 'bg-blue-500'} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}>
      {initials}
    </div>
  );
}

function RoleBadge({ role, staffTitle }) {
  const colors = {
    'parent': 'bg-sky-50 text-sky-700',
    'student': 'bg-emerald-50 text-emerald-700',
    'staff': 'bg-violet-50 text-violet-700',
    'admin': 'bg-amber-50 text-amber-700',
  };
  
  let label = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User';
  if (role === 'staff' && staffTitle) {
    const titleLabels = {
      'teacher': 'Teacher',
      'registrar': 'Registrar',
      'advisory': 'Advisory',
      'principal': 'Principal',
      'guidance_counselor': 'Guidance Counselor',
      'it_staff': 'IT Staff',
      'librarian': 'Librarian',
      'cashier': 'Cashier',
      'other': 'Staff',
    };
    label = titleLabels[staffTitle] || 'Staff';
  }
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[role] || 'bg-slate-50 text-slate-600'}`}>
      {label}
    </span>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({ activeSection, onSectionChange, stats, departmentFilter, onDepartmentChange, departmentCounts }) {
  const sections = [
    { id: 'all', label: 'All Conversations', icon: Icons.Inbox, count: stats.total },
    { id: 'open', label: 'Open Tickets', icon: Icons.MessageSquare, count: stats.open },
    { id: 'pending', label: 'Pending Action', icon: Icons.Clock, count: stats.pending },
    { id: 'resolved', label: 'Resolved', icon: Icons.CheckCircle, count: stats.resolved },
  ];

  return (
    <div className="w-72 bg-white border-r border-slate-200 flex flex-col h-full">
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Icons.MessageSquare size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">Communication</h1>
            <p className="text-xs text-slate-500">Center</p>
          </div>
        </div>
      </div>

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
              <section.icon size={16} />
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

      <div className="px-3 py-3 border-t border-slate-100">
        <p className="px-2 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Departments</p>
        <div className="space-y-0.5">
          {DEPARTMENTS.map(dept => {
            const DeptIcon = Icons[dept.icon];
            const count = departmentCounts[dept.id] || 0;
            return (
              <button
                key={dept.id}
                onClick={() => onDepartmentChange(departmentFilter === dept.id ? null : dept.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  departmentFilter === dept.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className={`w-7 h-7 ${dept.color} rounded-lg flex items-center justify-center`}>
                  <DeptIcon size={14} className="text-white" />
                </div>
                <span className="flex-1 text-left">{dept.name}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  departmentFilter === dept.id ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Conversation List ───────────────────────────────────────────────────────

function ConversationList({ conversations, selectedId, onSelect, searchQuery, onSearchChange, categoryFilter, onCategoryChange, loading, onCreateNew }) {
  return (
    <div className="w-96 bg-white border-r border-slate-200 flex flex-col h-full">
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900">Conversations</h2>
          <div className="flex items-center gap-2">
            <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
              <Icons.Bell size={16} />
            </button>
            <button
              onClick={onCreateNew}
              className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
            >
              <Icons.Plus size={16} />
            </button>
          </div>
        </div>

        <div className="relative">
          <Icons.Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

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

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <Icons.Loader size={32} className="mb-2" />
            <p className="text-sm font-medium">Loading...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <Icons.Inbox size={40} className="mb-2" />
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
                  <Avatar
                    initials={getInitials(conv.sender_name)}
                    color={getAvatarColor(conv.sender_name)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-semibold text-slate-900 truncate">{conv.sender_name}</span>
                      <span className="text-[10px] text-slate-400 flex-shrink-0 ml-2">
                        {formatTimestamp(conv.updated_at)}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-700 truncate mb-1">{conv.subject}</p>
                    <p className="text-xs text-slate-500 truncate mb-2">{conv.last_message}</p>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={conv.status} />
                      <span className={`text-[10px] font-medium ${PRIORITY_CONFIG[conv.priority]?.color || ''}`}>
                        {conv.priority !== 'normal' && PRIORITY_CONFIG[conv.priority]?.label}
                      </span>
                      {conv.unread_count > 0 && (
                        <span className="ml-auto bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {conv.unread_count}
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

function MessageThread({ conversation, messages, onSendMessage, sending }) {
  const [replyText, setReplyText] = useState('');
  const [showParticipants, setShowParticipants] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!replyText.trim() || sending) return;
    onSendMessage(replyText.trim());
    setReplyText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
          <Icons.MessageSquare size={32} className="text-slate-300" />
        </div>
        <h3 className="text-lg font-semibold text-slate-600 mb-1">Select a Conversation</h3>
        <p className="text-sm text-slate-400">Choose a conversation from the list to view details</p>
      </div>
    );
  }

  const conv = conversation;

  return (
    <div className="flex-1 flex flex-col bg-slate-50 h-full">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-lg font-bold text-slate-900">{conv.subject}</h2>
              <StatusBadge status={conv.status} />
              {conv.priority !== 'normal' && (
                <span className={`text-xs font-semibold ${PRIORITY_CONFIG[conv.priority]?.color || ''}`}>
                  {PRIORITY_CONFIG[conv.priority]?.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Icons.FileText size={14} />
                {conv.category}
              </span>
              <span className="flex items-center gap-1.5">
                <Icons.Clock size={14} />
                Created {formatFullTimestamp(conv.created_at)}
              </span>
              <span className="font-mono text-slate-400">{conv.ticket_id}</span>
            </div>
          </div>
        </div>

        {conv.participants && conv.participants.length > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Participants:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {conv.participants.slice(0, showParticipants ? conv.participants.length : 3).map((p, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-600"
                >
                  <span className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-[9px] text-white font-bold">
                    {getInitials(p.user_name || p.name)}
                  </span>
                  {p.user_name || p.name}
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
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg) => {
          const isOwnMessage = msg.is_own;
          const senderName = msg.sender_name || 'Unknown';
          const senderRole = msg.sender_role || 'user';

          return (
            <div key={msg.id} className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
              <Avatar
                initials={getInitials(senderName)}
                size="md"
                color={isOwnMessage ? 'bg-blue-600' : getAvatarColor(senderName)}
              />
              <div className={`max-w-lg ${isOwnMessage ? 'text-right' : ''}`}>
                <div className="flex items-center gap-2 mb-1" style={{ flexDirection: isOwnMessage ? 'row-reverse' : 'row' }}>
                  <span className="text-sm font-semibold text-slate-900">{senderName}</span>
                  <RoleBadge role={senderRole} />
                  <span className="text-[10px] text-slate-400">{formatTimestamp(msg.created_at)}</span>
                </div>
                <div className={`p-4 rounded-2xl ${
                  isOwnMessage
                    ? 'bg-blue-600 text-white rounded-tr-md'
                    : 'bg-white border border-slate-200 rounded-tl-md'
                }`}>
                  <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isOwnMessage ? 'text-white' : 'text-slate-700'}`}>
                    {msg.content}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t border-slate-200 px-6 py-4">
        <div className="flex items-end gap-3">
          <button className="p-2.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors flex-shrink-0">
            <Icons.Paperclip size={20} />
          </button>
          <div className="flex-1 relative">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your reply..."
              rows={1}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!replyText.trim() || sending}
            className={`p-2.5 rounded-xl flex-shrink-0 transition-colors ${
              replyText.trim() && !sending
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            {sending ? <Icons.Loader size={20} /> : <Icons.Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Right Panel ─────────────────────────────────────────────────────────────

function RightPanel({ conversation, onStatusChange, onPriorityChange, onArchive, onAddParticipant }) {
  if (!conversation) return null;

  const conv = conversation;

  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full overflow-y-auto">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Ticket Details</h3>
        <div className="space-y-3">
          <div>
            <p className="text-[10px] text-slate-400 mb-1">Ticket ID</p>
            <p className="text-sm font-mono font-semibold text-slate-700">{conv.ticket_id}</p>
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
            <select
              value={conv.priority}
              onChange={(e) => onPriorityChange(e.target.value)}
              className="text-sm font-medium text-slate-700 bg-transparent border border-slate-200 rounded px-2 py-1"
            >
              <option value="normal">Normal</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 mb-1">Created</p>
            <p className="text-sm font-medium text-slate-700">{formatFullTimestamp(conv.created_at)}</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Update Status</h3>
        <div className="grid grid-cols-2 gap-2">
          {['open', 'pending', 'replied', 'resolved', 'closed'].map(status => (
            <button
              key={status}
              onClick={() => onStatusChange(status)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                conv.status === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {STATUS_CONFIG[status].label}
            </button>
          ))}
        </div>
      </div>

      {conv.participants && conv.participants.length > 0 && (
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Participants</h3>
          <div className="space-y-2.5">
            {conv.participants.map((p, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                <Avatar
                  initials={getInitials(p.user_name || p.name)}
                  size="sm"
                  color={getAvatarColor(p.user_name || p.name)}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{p.user_name || p.name}</p>
                  <RoleBadge role={p.role} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-5 py-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Actions</h3>
        <div className="space-y-2">
          <button
            onClick={onArchive}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Icons.Archive size={16} className="text-slate-400" />
            Archive Conversation
          </button>
          <button
            onClick={onAddParticipant}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Icons.Users size={16} className="text-slate-400" />
            Add Participant
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── New Ticket Modal ────────────────────────────────────────────────────────

function NewTicketModal({ onClose, onSubmit }) {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('enrollment');
  const [priority, setPriority] = useState('normal');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !content.trim()) return;
    setSubmitting(true);
    await onSubmit({ subject: subject.trim(), category, priority, content: content.trim() });
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">New Ticket</h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
              <Icons.Trash2 size={16} />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief description of your issue"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.filter(c => c !== 'All').map(cat => (
                  <option key={cat} value={cat.toLowerCase()}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe your issue in detail..."
              rows={4}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !subject.trim() || !content.trim()}
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Add Participant Modal ───────────────────────────────────────────────────

function AddParticipantModal({ onClose, onSubmit, existingParticipants }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [role, setRole] = useState('collaborator');
  const [submitting, setSubmitting] = useState(false);

  const searchUsers = useCallback(async () => {
    if (!searchQuery.trim()) {
      setUsers([]);
      return;
    }
    try {
      setLoading(true);
      const response = await api.get(`/accounts/users/?search=${encodeURIComponent(searchQuery)}`);
      const results = response.data.results || response.data;
      const existingIds = existingParticipants?.map(p => p.user || p.user_id) || [];
      setUsers(results.filter(u => !existingIds.includes(u.id)));
    } catch (err) {
      console.error('Failed to search users:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, existingParticipants]);

  useEffect(() => {
    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [searchUsers]);

  const handleSubmit = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    await onSubmit({ user_id: selectedUser.id, role });
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Add Participant</h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
              <Icons.Trash2 size={16} />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Search Users</label>
            <div className="relative">
              <Icons.Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-4">
              <Icons.Loader size={24} className="text-blue-500" />
            </div>
          )}

          {!loading && users.length > 0 && (
            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
              {users.map(user => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    selectedUser?.id === user.id ? 'bg-blue-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <Avatar
                    initials={getInitials(user.first_name + ' ' + user.last_name)}
                    size="sm"
                    color={getAvatarColor(user.first_name + ' ' + user.last_name)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  </div>
                  <RoleBadge role={user.role} />
                </button>
              ))}
            </div>
          )}

          {!loading && searchQuery && users.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">No users found</p>
          )}

          {selectedUser && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Participant Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="collaborator">Collaborator</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedUser || submitting}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Adding...' : 'Add Participant'}
          </button>
        </div>
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
  const [departmentFilter, setDepartmentFilter] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [stats, setStats] = useState({ total: 0, open: 0, pending: 0, resolved: 0 });
  const [departmentCounts, setDepartmentCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [showAddParticipant, setShowAddParticipant] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (activeSection !== 'all') params.append('status', activeSection);
      
      // Handle category filter - either from category filter or department filter
      let effectiveCategory = categoryFilter;
      if (departmentFilter) {
        const dept = DEPARTMENTS.find(d => d.id === departmentFilter);
        if (dept && dept.categories.length === 1) {
          effectiveCategory = dept.categories[0];
        }
      }
      if (effectiveCategory !== 'All') params.append('category', effectiveCategory);
      
      if (searchQuery) params.append('search', searchQuery);

      const response = await api.get(`/tickets/?${params.toString()}`);
      let results = response.data.results || response.data;
      
      // If department has multiple categories, filter client-side
      if (departmentFilter) {
        const dept = DEPARTMENTS.find(d => d.id === departmentFilter);
        if (dept && dept.categories.length > 1) {
          results = results.filter(t => dept.categories.includes(t.category));
        }
      }
      
      setConversations(results);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
      setError('Failed to load conversations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [activeSection, categoryFilter, departmentFilter, searchQuery]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/tickets/stats/');
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  const fetchDepartmentCounts = useCallback(async () => {
    try {
      const counts = {};
      for (const dept of DEPARTMENTS) {
        const params = new URLSearchParams();
        if (dept.categories.length === 1) {
          params.append('category', dept.categories[0]);
        }
        const response = await api.get(`/tickets/?${params.toString()}`);
        const results = response.data.results || response.data;
        if (dept.categories.length > 1) {
          counts[dept.id] = results.filter(t => dept.categories.includes(t.category)).length;
        } else {
          counts[dept.id] = results.length;
        }
      }
      setDepartmentCounts(counts);
    } catch (err) {
      console.error('Failed to fetch department counts:', err);
    }
  }, []);

  const fetchMessages = useCallback(async (ticketId) => {
    try {
      setMessagesLoading(true);
      const response = await api.get(`/tickets/${ticketId}/messages/`);
      setMessages(response.data);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    fetchStats();
    fetchDepartmentCounts();
  }, [fetchConversations, fetchStats, fetchDepartmentCounts]);

  useEffect(() => {
    if (selectedId) {
      const conv = conversations.find(c => c.id === selectedId);
      setSelectedConversation(conv || null);
      fetchMessages(selectedId);
    } else {
      setSelectedConversation(null);
      setMessages([]);
    }
  }, [selectedId, conversations, fetchMessages]);

  const handleSendMessage = async (content) => {
    if (!selectedId || !content) return;
    try {
      setSending(true);
      const response = await api.post(`/tickets/${selectedId}/send-message/`, { content });
      setMessages(prev => [...prev, response.data]);
      fetchConversations();
      fetchStats();
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedId) return;
    try {
      await api.post(`/tickets/${selectedId}/update-status/`, { status: newStatus });
      setSelectedConversation(prev => prev ? { ...prev, status: newStatus } : null);
      fetchConversations();
      fetchStats();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handlePriorityChange = async (newPriority) => {
    if (!selectedId) return;
    try {
      await api.post(`/tickets/${selectedId}/update-priority/`, { priority: newPriority });
      setSelectedConversation(prev => prev ? { ...prev, priority: newPriority } : null);
      fetchConversations();
    } catch (err) {
      console.error('Failed to update priority:', err);
    }
  };

  const handleArchive = async () => {
    if (!selectedId) return;
    try {
      await api.post(`/tickets/${selectedId}/archive/`);
      setSelectedId(null);
      fetchConversations();
      fetchStats();
    } catch (err) {
      console.error('Failed to archive ticket:', err);
    }
  };

  const handleCreateTicket = async ({ subject, category, priority, content }) => {
    try {
      const response = await api.post('/tickets/', { subject, category, priority, content });
      setShowNewTicket(false);
      fetchConversations();
      fetchStats();
      fetchDepartmentCounts();
      setSelectedId(response.data.id);
    } catch (err) {
      console.error('Failed to create ticket:', err);
      alert('Failed to create ticket. Please try again.');
    }
  };

  const handleAddParticipant = async ({ user_id, role }) => {
    if (!selectedId) return;
    try {
      await api.post(`/tickets/${selectedId}/add-participant/`, { user_id, role });
      setShowAddParticipant(false);
      // Refresh messages to get updated participants
      fetchMessages(selectedId);
    } catch (err) {
      console.error('Failed to add participant:', err);
      alert('Failed to add participant. Please try again.');
    }
  };

  const handleDepartmentChange = (deptId) => {
    setDepartmentFilter(deptId);
    // Clear category filter when selecting a department
    if (deptId) {
      setCategoryFilter('All');
    }
  };

  return (
    <div className="h-screen flex bg-slate-100">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        stats={stats}
        departmentFilter={departmentFilter}
        onDepartmentChange={handleDepartmentChange}
        departmentCounts={departmentCounts}
      />
      <ConversationList
        conversations={conversations}
        selectedId={selectedId}
        onSelect={setSelectedId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        loading={loading}
        onCreateNew={() => setShowNewTicket(true)}
      />
      <MessageThread
        conversation={selectedConversation}
        messages={messages}
        onSendMessage={handleSendMessage}
        sending={sending}
      />
      <RightPanel
        conversation={selectedConversation}
        onStatusChange={handleStatusChange}
        onPriorityChange={handlePriorityChange}
        onArchive={handleArchive}
        onAddParticipant={() => setShowAddParticipant(true)}
      />
      {showNewTicket && (
        <NewTicketModal
          onClose={() => setShowNewTicket(false)}
          onSubmit={handleCreateTicket}
        />
      )}
      {showAddParticipant && selectedConversation && (
        <AddParticipantModal
          onClose={() => setShowAddParticipant(false)}
          onSubmit={handleAddParticipant}
          existingParticipants={selectedConversation.participants}
        />
      )}
    </div>
  );
}
