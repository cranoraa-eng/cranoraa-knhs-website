import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

const Icon = ({ d: paths, size = 16, className = '', fill = 'none', ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...rest}>
    {paths.split('|').map((p, i) => <path key={i} d={p.trim()} />)}
  </svg>
);

const Icons = {
  Search: (p) => <Icon d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" {...p} />,
  Send: (p) => <Icon d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" {...p} />,
  MessageSquare: (p) => <Icon d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" {...p} />,
  Users: (p) => <Icon d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2|M9 11a4 4 0 100-8 4 4 0 000 8z|M23 21v-2a4 4 0 00-3-3.87|M16 3.13a4 4 0 010 7.75" {...p} />,
  Trash: (p) => <Icon d="M3 6h18|M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6|M3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" {...p} />,
  FileText: (p) => <Icon d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z|M14 2v6h6" {...p} />,
  Loader: (p) => <Icon d="M12 2v4|M12 18v4|M4.93 4.93l2.83 2.83|M16.24 16.24l2.83 2.83|M2 12h4|M18 12h4|M4.93 19.07l2.83-2.83|M16.24 7.76l2.83-2.83" className={`animate-spin ${p.className || ''}`} {...p} />,
  GraduationCap: (p) => <Icon d="M22 10v6|M2 10l10-5 10 5-10 5z|M6 12v5c0 2 3 3 6 3s6-1 6-3v-5" {...p} />,
  BookOpen: (p) => <Icon d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z|M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" {...p} />,
  Shield: (p) => <Icon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" {...p} />,
  UserCheck: (p) => <Icon d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2|M8.5 7a4 4 0 100-8 4 4 0 000 8z|M17 11l2 2 4-4" {...p} />,
  Settings: (p) => <Icon d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z|M12 12a3 3 0 100-6 3 3 0 000 6z" {...p} />,
  X: (p) => <Icon d="M18 6L6 18|M6 6l12 12" {...p} />,
  ChevronDown: (p) => <Icon d="M6 9l6 6 6-6" {...p} />,
  ChevronRight: (p) => <Icon d="M9 18l6-6-6-6" {...p} />,
  Circle: (p) => <Icon d="M12 12a4 4 0 100-8 4 4 0 000 8z" fill="currentColor" {...p} />,
};

// ─── Config ──────────────────────────────────────────────────────────────────

const DEPT_ICONS = {
  FileText: Icons.FileText,
  GraduationCap: Icons.GraduationCap,
  BookOpen: Icons.BookOpen,
  Shield: Icons.Shield,
  UserCheck: Icons.UserCheck,
  Settings: Icons.Settings,
  Users: Icons.Users,
};

const STATUS_COLORS = {
  open: 'bg-blue-500',
  pending: 'bg-amber-500',
  replied: 'bg-emerald-500',
  resolved: 'bg-violet-500',
  closed: 'bg-slate-400',
};

const AVATAR_COLORS = ['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500'];

function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name) {
  return (name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function formatTime(ts) {
  if (!ts) return '';
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now - date;
  if (diffMs < 0) return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHrs < 24) return `${diffHrs}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Components ──────────────────────────────────────────────────────────────

function Avatar({ name, size = 'md', online }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };
  return (
    <div className="relative flex-shrink-0" role="img" aria-label={name || 'User avatar'}>
      <div className={`${sizes[size]} ${getAvatarColor(name)} rounded-full flex items-center justify-center text-white font-semibold`}>
        {getInitials(name)}
      </div>
      {online !== undefined && (
        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${online ? 'bg-emerald-500' : 'bg-slate-300'}`} aria-label={online ? 'Online' : 'Offline'} />
      )}
    </div>
  );
}

function StatusDot({ status }) {
  return <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[status] || 'bg-slate-400'}`} aria-label={`Status: ${status || 'unknown'}`} title={status || 'unknown'} />;
}

// ─── Panel 1: Conversation List ─────────────────────────────────────────────

function ConversationList({ tickets, selectedId, onSelect, loading, searchQuery, onSearchChange }) {
  return (
    <div className="w-80 bg-white border-r border-slate-200 flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-slate-100">
        <h1 className="text-lg font-bold text-slate-900 mb-3">Messages</h1>

        {/* Search */}
        <div className="relative">
          <Icons.Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search conversations"
            className="w-full pl-9 pr-4 py-2.5 bg-slate-100 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Icons.Loader size={24} className="text-blue-500" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-400">
            <Icons.MessageSquare size={32} className="mb-2" />
            <p className="text-sm">No conversations yet</p>
            <p className="text-xs mt-1">Click a staff member to start chatting</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100" role="list" aria-label="Conversations">
            {tickets.map(ticket => (
              <button
                key={ticket.id}
                onClick={() => onSelect(ticket.id)}
                role="listitem"
                aria-current={selectedId === ticket.id ? 'true' : undefined}
                className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${
                  selectedId === ticket.id ? 'bg-blue-50 ring-2 ring-inset ring-blue-200' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <Avatar name={ticket.sender_name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-semibold text-slate-900 truncate">{ticket.sender_name}</span>
                      <span className="text-[10px] text-slate-400 flex-shrink-0 ml-2">{formatTime(ticket.updated_at)}</span>
                    </div>
                    <p className="text-xs font-medium text-slate-700 truncate mb-1">{ticket.subject}</p>
                    <p className="text-xs text-slate-400 truncate mb-1.5">{ticket.last_message}</p>
                    <div className="flex items-center gap-2">
                      <StatusDot status={ticket.status} />
                      {Number(ticket.unread_count) > 0 && (
                        <span className="ml-auto bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center" aria-label={`${ticket.unread_count} unread messages`}>
                          {ticket.unread_count}
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

// ─── Panel 2: Message Thread ────────────────────────────────────────────────

function MessageThread({ ticket, messages, onSend, sending, onDelete }) {
  const [text, setText] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const container = messagesEndRef.current?.parentElement;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
    if (isNearBottom) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (ticket?.id) inputRef.current?.focus();
  }, [ticket?.id]);

  const handleSend = () => {
    if (!text.trim() || sending) return;
    onSend(text.trim());
    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!ticket) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50">
        <Icons.MessageSquare size={48} className="text-slate-300 mb-4" />
        <p className="text-slate-400">Select a conversation</p>
        <p className="text-slate-300 text-sm mt-1">or click a staff member to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 h-full">
      {/* Conversation Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar name={ticket.sender_name} size="sm" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate leading-tight">{ticket.sender_name}</p>
            <p className="text-[10px] text-slate-500 truncate">{ticket.subject}</p>
          </div>
        </div>
        <button
          onClick={onDelete}
          aria-label="Delete conversation"
          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Icons.Trash size={14} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 text-sm py-6">
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}
        {messages.map((msg) => {
          const isOwn = msg.is_own;
          return (
            <div key={msg.id} className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`} role="group" aria-label={`Message from ${msg.sender_name}`}>
              <Avatar name={msg.sender_name} size="sm" />
              <div className={`max-w-[70%] ${isOwn ? 'items-end' : ''}`}>
                <div className={`flex items-center gap-1.5 mb-0.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                  <span className="text-[11px] font-medium text-slate-700">{msg.sender_name}</span>
                  <span className="text-[9px] text-slate-400">{formatTime(msg.created_at)}</span>
                </div>
                <div className={`px-3 py-2 rounded-2xl text-sm break-words ${
                  isOwn
                    ? 'bg-blue-600 text-white rounded-tr-md'
                    : 'bg-white border border-slate-200 rounded-tl-md'
                }`}>
                  <p className={`leading-snug whitespace-pre-wrap ${isOwn ? '' : 'text-slate-700'}`}>
                    {msg.content}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-slate-200 px-3 py-1.5">
        <div className="flex items-end gap-1.5">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              aria-label="Type your message"
              rows={1}
              className="w-full px-2.5 py-1.5 bg-slate-100 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none transition-colors"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            aria-label="Send message"
            className={`p-1.5 rounded-xl transition-all ${
              text.trim() && !sending
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            {sending ? <Icons.Loader size={15} /> : <Icons.Send size={15} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Panel 3: Department Directory ──────────────────────────────────────────

function DepartmentDirectory({ onStaffClick, openingId }) {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [dirSearch, setDirSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    const fetchDepartments = async () => {
      try {
        const response = await api.get('/tickets/staff-by-department/');
        if (cancelled) return;
        setDepartments(response.data);
        const exp = {};
        response.data.forEach(d => { exp[d.id] = true; });
        setExpanded(exp);
      } catch (err) {
        if (!cancelled) console.error('Failed to fetch departments:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchDepartments();
    return () => { cancelled = true; };
  }, []);

  const toggleDept = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredDepts = useMemo(() => departments.map(dept => ({
    ...dept,
    members: dept.members.filter(m =>
      (m.name || '').toLowerCase().includes(dirSearch.toLowerCase()) ||
      (m.username || '').toLowerCase().includes(dirSearch.toLowerCase())
    ),
  })).filter(dept => dept.members.length > 0), [departments, dirSearch]);

  return (
    <div className="w-72 bg-white border-l border-slate-200 flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-sm font-bold text-slate-900 mb-3">Staff Directory</h2>
        <div className="relative">
          <Icons.Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Find staff..."
            value={dirSearch}
            onChange={(e) => setDirSearch(e.target.value)}
            aria-label="Search staff directory"
            className="w-full pl-9 pr-4 py-2.5 bg-slate-100 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Department List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Icons.Loader size={20} className="text-blue-500" />
          </div>
        ) : filteredDepts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-400">
            <Icons.Users size={24} className="mb-2" />
            <p className="text-xs">No staff found</p>
          </div>
        ) : (
          <div className="py-2">
            {filteredDepts.map(dept => {
              const DeptIcon = DEPT_ICONS[dept.icon] || Icons.Users;
              const isExpanded = expanded[dept.id] !== false;
              return (
                <div key={dept.id} className="mb-1">
                  {/* Department Header */}
                  <button
                    onClick={() => toggleDept(dept.id)}
                    aria-expanded={isExpanded}
                    className="w-full flex items-center gap-2.5 px-5 py-2.5 hover:bg-slate-50 transition-colors"
                  >
                    <div className={`w-7 h-7 ${dept.color} rounded-lg flex items-center justify-center`}>
                      <DeptIcon size={14} className="text-white" />
                    </div>
                    <span className="flex-1 text-xs font-semibold text-slate-700 text-left">{dept.name}</span>
                    <span className="text-[10px] text-slate-400 mr-1">{dept.members.length}</span>
                    <span className={`transition-transform ${isExpanded ? '' : '-rotate-90'}`}>
                      <Icons.ChevronDown size={12} className="text-slate-400" />
                    </span>
                  </button>

                  {/* Staff Members */}
                  {isExpanded && (
                    <div className="pb-1">
                      {dept.members.map(member => (
                        <button
                          key={member.id}
                          onClick={() => onStaffClick(member.id)}
                          disabled={openingId === member.id}
                          className="w-full flex items-center gap-3 pl-14 pr-5 py-2 hover:bg-blue-50 transition-colors group disabled:opacity-50"
                        >
                          <Avatar name={member.name} size="sm" online={member.is_online} />
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-sm font-medium text-slate-700 truncate group-hover:text-blue-700 transition-colors">
                              {member.name}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {[member.title, member.staff_title?.replace(/_/g, ' ')].filter(Boolean).join(' · ')}
                            </p>
                          </div>
                          {openingId === member.id ? (
                            <Icons.Loader size={14} className="text-blue-500" />
                          ) : (
                            <Icons.MessageSquare size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function CommunicationCenter() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openingStaffId, setOpeningStaffId] = useState(null);

  // Debounce search before fetching
  const debouncedSearch = useRef(null);
  const [effectiveSearch, setEffectiveSearch] = useState('');

  useEffect(() => {
    if (debouncedSearch.current) clearTimeout(debouncedSearch.current);
    debouncedSearch.current = setTimeout(() => setEffectiveSearch(searchQuery), 300);
    return () => { if (debouncedSearch.current) clearTimeout(debouncedSearch.current); };
  }, [searchQuery]);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (effectiveSearch) params.append('search', effectiveSearch);
      const response = await api.get(`/tickets/?${params.toString()}`);
      setTickets(response.data.results || response.data);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  }, [effectiveSearch]);

  const fetchMessages = useCallback(async (ticketId) => {
    try {
      const response = await api.get(`/tickets/${ticketId}/messages/`);
      setMessages(response.data);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      setMessages([]);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const selectedTicket = useMemo(
    () => tickets.find(t => t.id === selectedId) || null,
    [tickets, selectedId]
  );

  useEffect(() => {
    if (selectedId) {
      fetchMessages(selectedId);
    } else {
      setMessages([]);
    }
  }, [selectedId, fetchMessages]);

  const handleSend = async (content) => {
    if (!selectedId || !content) return;
    try {
      setSending(true);
      const response = await api.post(`/tickets/${selectedId}/send-message/`, { content });
      setMessages(prev => [...prev, response.data]);
      fetchTickets();
    } catch (err) {
      console.error('Failed to send message:', err);
      toast.error('Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleStaffClick = async (staffUserId) => {
    try {
      setOpeningStaffId(staffUserId);
      const response = await api.post('/tickets/open-conversation/', { user_id: staffUserId });
      const ticket = response.data;
      setTickets(prev => {
        const exists = prev.some(t => t.id === ticket.id);
        return exists ? prev : [ticket, ...prev];
      });
      setSelectedId(ticket.id);
      await fetchTickets();
    } catch (err) {
      console.error('Failed to open conversation:', err);
      toast.error('Failed to open conversation.');
    } finally {
      setOpeningStaffId(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    const result = await Swal.fire({
      title: 'Delete conversation?',
      text: 'This cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/tickets/${selectedId}/delete/`);
      setSelectedId(null);
      fetchTickets();
      toast.success('Conversation deleted.');
    } catch (err) {
      console.error('Failed to delete ticket:', err);
      toast.error('Failed to delete conversation.');
    }
  };

  return (
    <div className="h-[calc(100vh-57px)] flex bg-slate-100">
      {/* Left: Conversation List */}
      <ConversationList
        tickets={tickets}
        selectedId={selectedId}
        onSelect={setSelectedId}
        loading={loading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Center: Message Thread */}
      <MessageThread
        ticket={selectedTicket}
        messages={messages}
        onSend={handleSend}
        sending={sending}
        onDelete={handleDelete}
      />

      {/* Right: Department Directory */}
      <DepartmentDirectory
        onStaffClick={handleStaffClick}
        openingId={openingStaffId}
      />
    </div>
  );
}
