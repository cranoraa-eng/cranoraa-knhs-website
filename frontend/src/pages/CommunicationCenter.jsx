import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

const Icon = ({ d, size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
);

const Icons = {
  Search: (p) => <Icon {...p} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
  Plus: (p) => <Icon {...p} d="M12 5v14M5 12h14" />,
  Send: (p) => <Icon {...p} d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />,
  Paperclip: (p) => <Icon {...p} d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />,
  CheckCircle: (p) => <Icon {...p} d="M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3" />,
  Clock: (p) => <Icon {...p} d="M12 2a10 10 0 100 20 10 10 0 000-20zM12 6v6l4 2" />,
  MessageSquare: (p) => <Icon {...p} d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />,
  Users: (p) => <Icon {...p} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />,
  ArrowLeft: (p) => <Icon {...p} d="M19 12H5M12 19l-7-7 7-7" />,
  MoreVertical: (p) => <Icon {...p} d="M12 12h.01M12 8h.01M12 16h.01" />,
  FileText: (p) => <Icon {...p} d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6" />,
  Loader: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${p.className || ''} animate-spin`}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>,
  Inbox: (p) => <Icon {...p} d="M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />,
  Trash: (p) => <Icon {...p} d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />,
  Archive: (p) => <Icon {...p} d="M21 8v13H3V8M1 3h22v5H1z" />,
};

// ─── Config ──────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'enrollment', label: 'Enrollment', color: 'bg-blue-100 text-blue-700' },
  { id: 'attendance', label: 'Attendance', color: 'bg-amber-100 text-amber-700' },
  { id: 'academic', label: 'Academic', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'collaboration', label: 'Collaboration', color: 'bg-violet-100 text-violet-700' },
  { id: 'facilities', label: 'Facilities', color: 'bg-rose-100 text-rose-700' },
  { id: 'guidance', label: 'Guidance', color: 'bg-indigo-100 text-indigo-700' },
  { id: 'other', label: 'Other', color: 'bg-slate-100 text-slate-700' },
];

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
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHrs < 24) return `${diffHrs}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
  });
}

// ─── Components ──────────────────────────────────────────────────────────────

function Avatar({ name, size = 'md' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };
  return (
    <div className={`${sizes[size]} ${getAvatarColor(name)} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}>
      {getInitials(name)}
    </div>
  );
}

function CategoryBadge({ category }) {
  const cat = CATEGORIES.find(c => c.id === category) || CATEGORIES.find(c => c.id === 'other');
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${cat.color}`}>
      {cat.label}
    </span>
  );
}

function StatusDot({ status }) {
  return <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[status] || 'bg-slate-400'}`} />;
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ onCreateNew }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
        <Icons.Inbox size={40} className="text-blue-500" />
      </div>
      <h2 className="text-xl font-bold text-slate-800 mb-2">Welcome to Communication Center</h2>
      <p className="text-sm text-slate-500 text-center max-w-sm mb-6">
        Send messages to teachers, staff, or administrators. Create a ticket to get started.
      </p>
      <button
        onClick={onCreateNew}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
      >
        <Icons.Plus size={18} />
        New Message
      </button>
    </div>
  );
}

// ─── Ticket List ─────────────────────────────────────────────────────────────

function TicketList({ tickets, selectedId, onSelect, loading, searchQuery, onSearchChange, statusFilter, onStatusFilter, onCreateNew }) {
  return (
    <div className="w-full md:w-96 bg-white border-r border-slate-200 flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-slate-900">Messages</h1>
          <button
            onClick={onCreateNew}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Icons.Plus size={14} />
            New
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Icons.Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-100 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-1 mt-3 bg-slate-100 p-1 rounded-lg">
          {['all', 'open', 'pending', 'resolved'].map(status => (
            <button
              key={status}
              onClick={() => onStatusFilter(status)}
              className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Icons.Loader size={24} className="text-blue-500" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-400">
            <Icons.MessageSquare size={32} className="mb-2" />
            <p className="text-sm">No messages found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tickets.map(ticket => (
              <button
                key={ticket.id}
                onClick={() => onSelect(ticket.id)}
                className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${
                  selectedId === ticket.id ? 'bg-blue-50 border-l-3 border-blue-600' : ''
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
                      <CategoryBadge category={ticket.category} />
                      {ticket.unread_count > 0 && (
                        <span className="ml-auto bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
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

// ─── Message Thread ──────────────────────────────────────────────────────────

function MessageThread({ ticket, messages, onSend, onBack, sending }) {
  const [text, setText] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (ticket) inputRef.current?.focus();
  }, [ticket]);

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
      <div className="flex-1 hidden md:flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <Icons.MessageSquare size={48} className="text-slate-300 mb-4" />
        <p className="text-slate-400">Select a conversation to start messaging</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 h-full">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="md:hidden p-2 hover:bg-slate-100 rounded-lg">
            <Icons.ArrowLeft size={18} />
          </button>
          <Avatar name={ticket.sender_name} />
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-slate-900 truncate">{ticket.subject}</h2>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{ticket.sender_name}</span>
              <span className="text-slate-300">·</span>
              <span className="font-mono text-slate-400">{ticket.ticket_id}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <StatusDot status={ticket.status} />
            <span className="text-xs text-slate-500 capitalize">{ticket.status}</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 text-sm py-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}
        {messages.map((msg) => {
          const isOwn = msg.is_own;
          return (
            <div key={msg.id} className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
              <Avatar name={msg.sender_name} size="sm" />
              <div className={`max-w-[75%] ${isOwn ? 'items-end' : ''}`}>
                <div className="flex items-center gap-2 mb-1" style={{ flexDirection: isOwn ? 'row-reverse' : 'row' }}>
                  <span className="text-xs font-medium text-slate-700">{msg.sender_name}</span>
                  <span className="text-[10px] text-slate-400">{formatTime(msg.created_at)}</span>
                </div>
                <div className={`px-4 py-2.5 rounded-2xl ${
                  isOwn
                    ? 'bg-blue-600 text-white rounded-tr-md'
                    : 'bg-white border border-slate-200 rounded-tl-md'
                }`}>
                  <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isOwn ? '' : 'text-slate-700'}`}>
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
      <div className="bg-white border-t border-slate-200 px-4 py-3">
        <div className="flex items-end gap-2">
          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <Icons.Paperclip size={18} />
          </button>
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="w-full px-4 py-2.5 bg-slate-100 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none transition-colors"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className={`p-2.5 rounded-xl transition-all ${
              text.trim() && !sending
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            {sending ? <Icons.Loader size={18} /> : <Icons.Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── New Ticket Modal ────────────────────────────────────────────────────────

function NewTicketModal({ onClose, onSubmit, user }) {
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">New Message</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
              <Icons.Trash size={16} />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What is this about?"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
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
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Message</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe your question or concern..."
              rows={4}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !subject.trim() || !content.trim()}
              className="px-6 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </form>
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
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await api.get(`/tickets/?${params.toString()}`);
      setTickets(response.data.results || response.data);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  // Fetch messages for selected ticket
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

  // Load tickets on mount and filter changes
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Load messages when ticket selected
  useEffect(() => {
    if (selectedId) {
      const ticket = tickets.find(t => t.id === selectedId);
      setSelectedTicket(ticket || null);
      fetchMessages(selectedId);
    } else {
      setSelectedTicket(null);
      setMessages([]);
    }
  }, [selectedId, tickets, fetchMessages]);

  // Send message
  const handleSend = async (content) => {
    if (!selectedId || !content) return;
    try {
      setSending(true);
      const response = await api.post(`/tickets/${selectedId}/send-message/`, { content });
      setMessages(prev => [...prev, response.data]);
      fetchTickets(); // Refresh list to update last message
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Create ticket
  const handleCreateTicket = async ({ subject, category, priority, content }) => {
    try {
      const response = await api.post('/tickets/', { subject, category, priority, content });
      setShowNewTicket(false);
      fetchTickets();
      setSelectedId(response.data.id);
    } catch (err) {
      console.error('Failed to create ticket:', err);
      alert('Failed to create message. Please try again.');
    }
  };

  return (
    <div className="h-screen flex bg-slate-100">
      {/* Ticket List - Hidden on mobile when ticket is selected */}
      <div className={`${selectedId ? 'hidden md:flex' : 'flex'} w-full md:w-96 flex-col`}>
        <TicketList
          tickets={tickets}
          selectedId={selectedId}
          onSelect={setSelectedId}
          loading={loading}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilter={setStatusFilter}
          onCreateNew={() => setShowNewTicket(true)}
        />
      </div>

      {/* Message Thread - Hidden on mobile when no ticket is selected */}
      <div className={`${selectedId ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
        <MessageThread
          ticket={selectedTicket}
          messages={messages}
          onSend={handleSend}
          onBack={() => setSelectedId(null)}
          sending={sending}
        />
      </div>

      {/* New Ticket Modal */}
      {showNewTicket && (
        <NewTicketModal
          onClose={() => setShowNewTicket(false)}
          onSubmit={handleCreateTicket}
          user={user}
        />
      )}
    </div>
  );
}
