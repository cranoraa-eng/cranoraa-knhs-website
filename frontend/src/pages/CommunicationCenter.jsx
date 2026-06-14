import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const FileIcon = (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const SearchIcon = (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const PlusIcon = (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const SendIcon = (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const XIcon = (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const ClockIcon = (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const UserIcon = (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const BuildingIcon = (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="6" x2="9" y2="6.01"/><line x1="15" y1="6" x2="15" y2="6.01"/><line x1="9" y1="10" x2="9" y2="10.01"/><line x1="15" y1="10" x2="15" y2="10.01"/><line x1="9" y1="14" x2="9" y2="14.01"/><line x1="15" y1="14" x2="15" y2="14.01"/><line x1="9" y1="18" x2="15" y2="18"/></svg>;
const DownloadIcon = (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;

const DEPT_META = {
  faculty:    { label: 'Faculty',    color: 'bg-blue-500',  icon: 'graduation' },
  registrar:  { label: 'Registrar',  color: 'bg-emerald-500', icon: 'book' },
  guidance:   { label: 'Guidance',   color: 'bg-amber-500', icon: 'shield' },
  ict:        { label: 'ICT',        color: 'bg-violet-500', icon: 'settings' },
  admin:      { label: 'Administration', color: 'bg-rose-500', icon: 'building' },
};

const STATUS_CONFIG = {
  open:               { label: 'Open',             color: 'bg-blue-100 text-blue-700 border-blue-200' },
  pending:            { label: 'Awaiting Response', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  replied:            { label: 'In Progress',       color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  resolved:           { label: 'Closed',            color: 'bg-violet-100 text-violet-700 border-violet-200' },
  closed:             { label: 'Closed',            color: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const PRIORITY_CONFIG = {
  critical: { label: 'Critical', color: 'text-red-600 bg-red-50 border-red-200' },
  high:     { label: 'High',     color: 'text-amber-600 bg-amber-50 border-amber-200' },
  medium:   { label: 'Medium',   color: 'text-blue-600 bg-blue-50 border-blue-200' },
  low:      { label: 'Low',      color: 'text-slate-500 bg-slate-50 border-slate-200' },
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

function formatDate(ts, short) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const today = now.toDateString() === d.toDateString();
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  const isYesterday = yesterday.toDateString() === d.toDateString();
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  if (today) return short ? time : `Today at ${time}`;
  if (isYesterday) return short ? `Yesterday ${time}` : `Yesterday at ${time}`;
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (short) return `${date}`;
  return `${date} at ${time}`;
}

function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function getDeptIcon(deptKey, size) {
  const s = size || 16;
  switch (deptKey) {
    case 'faculty': return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>;
    case 'registrar': return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>;
    case 'guidance': return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
    case 'ict': return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>;
    case 'admin': return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="6" x2="9" y2="6.01"/><line x1="15" y1="6" x2="15" y2="6.01"/><line x1="9" y1="10" x2="9" y2="10.01"/><line x1="15" y1="10" x2="15" y2="10.01"/></svg>;
    default: return <BuildingIcon size={s} />;
  }
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.closed;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'open' ? 'bg-blue-500' : status === 'pending' ? 'bg-amber-500' : status === 'replied' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
      {cfg.label}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.low;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function Avatar({ name, size = 'md' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };
  return (
    <div className={`${sizes[size]} ${getAvatarColor(name)} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`} title={name}>
      {getInitials(name)}
    </div>
  );
}

function DeptBadge({ dept }) {
  const meta = DEPT_META[dept?.toLowerCase()];
  if (!meta) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold text-white ${meta.color}`}>
      {getDeptIcon(dept, 12)}
      {meta.label}
    </span>
  );
}

function formatRelativeTime(ts) {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function TicketCard({ ticket, selected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(ticket.id)}
      className={`w-full text-left px-5 py-4 border-b border-slate-100 transition-all hover:bg-violet-50/30 ${
        selected ? 'bg-violet-50 border-l-2 border-l-violet-600 shadow-sm' : 'border-l-2 border-l-transparent'
      }`}
    >
      <div className="flex items-start justify-between mb-1.5">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-sm font-semibold text-slate-900 truncate">{ticket.subject || 'No Subject'}</span>
        </div>
        <StatusBadge status={ticket.status} />
      </div>
      <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
        <span className="flex items-center gap-1">
          <UserIcon size={12} />
          {ticket.assigned_name || ticket.assigned_to_name || ticket.staff_name || 'Unassigned'}
        </span>
        {ticket.department_name && (
          <span className="flex items-center gap-1">
            <BuildingIcon size={12} />
            {ticket.department_name}
          </span>
        )}
      </div>
      {ticket.last_message && (
        <p className="text-xs text-slate-400 truncate mb-2">{ticket.last_message}</p>
      )}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-400 flex items-center gap-1">
          <ClockIcon size={10} />
          {formatRelativeTime(ticket.updated_at)}
        </span>
        {Number(ticket.unread_count) > 0 && (
          <span className="bg-violet-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[18px] text-center">
            {ticket.unread_count}
          </span>
        )}
      </div>
    </button>
  );
}

function MessageCard({ msg, isOwn, onDownload }) {
  const isImage = msg.message_type === 'image' || msg.attachment_is_image;
  const isFile = msg.message_type === 'file' && msg.attachment_url;

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className="max-w-[75%] min-w-0">
        <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[11px] font-medium text-slate-600">{isOwn ? 'You' : msg.sender_name}</span>
          <span className="text-[9px] text-slate-400">{formatDate(msg.created_at, true)}</span>
        </div>
        <div className={`rounded-lg border px-4 py-2.5 ${
          isOwn
            ? 'bg-violet-600 text-white border-violet-700'
            : 'bg-white text-slate-700 border-slate-200 shadow-sm'
        }`}>
          {isImage && msg.attachment_url && (
            <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="block mb-2" onClick={e => e.stopPropagation()}>
              <img src={msg.attachment_url} alt={msg.attachment_filename || 'Image'} className="max-w-full max-h-64 rounded object-contain" loading="lazy" />
            </a>
          )}
          {isFile && (
            <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" download={msg.attachment_filename}
              className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${
                isOwn ? 'bg-violet-700/30 border-violet-400/30 hover:bg-violet-700/40' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
              onClick={e => e.stopPropagation()}
            >
              <FileIcon size={20} className={isOwn ? 'text-white' : 'text-violet-600'} />
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-semibold truncate ${isOwn ? 'text-white' : 'text-slate-800'}`}>{msg.attachment_filename || 'File'}</p>
                {msg.file_size_bytes && <p className={`text-[10px] ${isOwn ? 'text-violet-200' : 'text-slate-400'}`}>{formatFileSize(msg.file_size_bytes)}</p>}
              </div>
              <DownloadIcon size={14} className={isOwn ? 'text-violet-200' : 'text-slate-400'} />
            </a>
          )}
          {msg.content && <p className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${msg.attachment_url ? 'mt-1' : ''}`}>{msg.content}</p>}
        </div>
      </div>
    </div>
  );
}

function DetailsPanel({ ticket, messages, onBack }) {
  if (!ticket) return null;

  const participants = [];
  if (ticket.created_by_name) {
    participants.push({ name: ticket.created_by_name, role: 'Creator' });
  }
  if (ticket.assigned_name || ticket.assigned_to_name) {
    participants.push({ name: ticket.assigned_name || ticket.assigned_to_name, role: 'Assignee' });
  }
  (messages || []).forEach(m => {
    if (m.sender_name && !participants.find(p => p.name === m.sender_name)) {
      participants.push({ name: m.sender_name, role: 'Participant' });
    }
  });

  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Details</h3>
          <button onClick={onBack} className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors lg:hidden">
            <XIcon size={14} />
          </button>
        </div>
        <h4 className="text-sm font-semibold text-slate-900 leading-snug">{ticket.subject || 'No Subject'}</h4>
        <div className="flex items-center gap-2 mt-2">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
          <code className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">#{ticket.ticket_id || ticket.id}</code>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {/* Info Card */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Information</p>
            </div>
            <div className="divide-y divide-slate-100">
              <div className="px-3 py-2.5 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-medium">Department</span>
                {(() => {
                  const deptName = ticket.department_name || ticket.department;
                  if (!deptName) return <span className="text-xs text-slate-400">—</span>;
                  const meta = DEPT_META[deptName.toLowerCase()];
                  if (meta) return <DeptBadge dept={deptName} />;
                  return <span className="text-xs font-medium text-slate-700 capitalize">{deptName.replace(/_/g, ' ')}</span>;
                })()}
              </div>
              {ticket.category && (
                <div className="px-3 py-2.5 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-medium">Category</span>
                  <span className="text-xs font-medium text-slate-700 capitalize">{ticket.category.replace(/_/g, ' ')}</span>
                </div>
              )}
              <div className="px-3 py-2.5 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-medium">Messages</span>
                <span className="text-xs font-medium text-slate-700">{ticket.message_count || messages?.length || 0}</span>
              </div>
              <div className="px-3 py-2.5 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-medium">Created</span>
                <span className="text-xs text-slate-600">{formatDate(ticket.created_at, true)}</span>
              </div>
              <div className="px-3 py-2.5 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-medium">Updated</span>
                <span className="text-xs text-slate-600">{formatDate(ticket.updated_at, true)}</span>
              </div>
            </div>
          </div>

          {/* Participants Card */}
          {participants.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Participants</p>
              </div>
              <div className="p-3 space-y-2">
                {participants.map((p, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <Avatar name={p.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-800 truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-400">{p.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const DEPT_TO_CATEGORY = {
  registrar: 'enrollment',
  advisory: 'attendance',
  faculty: 'academic',
  admin: 'other',
  guidance: 'guidance',
  it: 'it_support',
  library: 'other',
  finance: 'finance',
};

const PRIORITY_OPTIONS = [
  { value: 'normal', label: 'Normal', color: 'border-slate-300 text-slate-600', activeColor: 'bg-slate-700 text-white border-slate-700' },
  { value: 'high', label: 'High', color: 'border-amber-300 text-amber-600', activeColor: 'bg-amber-500 text-white border-amber-500' },
  { value: 'urgent', label: 'Urgent', color: 'border-red-300 text-red-600', activeColor: 'bg-red-500 text-white border-red-500' },
];

function NewConversationModal({ open, onClose }) {
  const [departments, setDepartments] = useState([]);
  const [deptLoading, setDeptLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState('');
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('normal');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const fetchDepts = async () => {
      try {
        setDeptLoading(true);
        const res = await api.get('/tickets/staff-by-department/');
        if (!cancelled) setDepartments(res.data);
      } catch {
        if (!cancelled) toast.error('Failed to load departments');
      } finally {
        if (!cancelled) setDeptLoading(false);
      }
    };
    fetchDepts();
    return () => { cancelled = true; };
  }, [open]);

  useEffect(() => {
    setSelectedStaff('');
    if (!selectedDept) { setStaffList([]); return; }
    const dept = departments.find(d => String(d.id) === String(selectedDept));
    setStaffList(dept?.members || []);
  }, [selectedDept, departments]);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Subject and message are required');
      return;
    }
    setSubmitting(true);
    try {
      if (!selectedStaff) {
        toast.error('Please select a staff member');
        setSubmitting(false);
        return;
      }
      const res = await api.post('/tickets/', {
        subject: subject.trim(),
        category: DEPT_TO_CATEGORY[selectedDept] || 'other',
        priority,
        assigned_to: parseInt(selectedStaff),
        department: selectedDept,
      });
      const ticketId = res.data.id;
      await api.post(`/tickets/${ticketId}/send-message/`, {
        content: message.trim(),
      });
      toast.success(res.status === 200 ? 'Existing conversation found — message added' : 'Support request submitted');
      onClose(true, ticketId);
    } catch (err) {
      toast.error(err.response?.data?.detail || err.response?.data?.error || err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setSelectedDept('');
      setSelectedStaff('');
      setSubject('');
      setMessage('');
      setPriority('normal');
    }
  }, [open]);

  if (!open) return null;

  const canSubmit = subject.trim() && message.trim() && selectedStaff && !submitting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => onClose(false)} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-[fadeIn_0.2s_ease-out] mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-bold text-slate-900">New Support Request</h2>
            <p className="text-xs text-slate-500 mt-0.5">Choose a department and describe your concern</p>
          </div>
          <button onClick={() => onClose(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <XIcon size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 sm:px-6 py-5 overflow-y-auto max-h-[calc(90vh-130px)] space-y-5">
          {deptLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-5 h-5 border-2 border-slate-200 border-t-violet-600 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Step 1: Department */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  1. Department
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {departments.map(d => (
                    <button key={d.id} onClick={() => setSelectedDept(d.id)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
                        selectedDept === d.id
                          ? 'border-violet-500 bg-violet-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        selectedDept === d.id ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {getDeptIcon(d.id, 16)}
                      </div>
                      <span className={`text-[11px] font-semibold leading-tight ${
                        selectedDept === d.id ? 'text-violet-700' : 'text-slate-600'
                      }`}>{d.name}</span>
                      <span className="text-[9px] text-slate-400">{d.members?.length || 0} staff</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Staff Member */}
              {selectedDept && (
                <div className="animate-[fadeIn_0.15s_ease-out]">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    2. Assign To
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-1">
                    {staffList.map(m => (
                      <button key={m.id} onClick={() => setSelectedStaff(String(m.id))}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                          selectedStaff === String(m.id)
                            ? 'border-violet-500 bg-violet-50 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}>
                        <div className="relative flex-shrink-0">
                          <Avatar name={m.name} size="sm" />
                          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                            m.is_online ? 'bg-emerald-400' : 'bg-slate-300'
                          }`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-semibold truncate ${
                            selectedStaff === String(m.id) ? 'text-violet-700' : 'text-slate-800'
                          }`}>{m.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{m.title || m.staff_title || 'Staff'}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Priority */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  3. Priority
                </label>
                <div className="flex gap-2">
                  {PRIORITY_OPTIONS.map(p => (
                    <button key={p.value} onClick={() => setPriority(p.value)}
                      className={`flex-1 py-2 px-3 rounded-xl border-2 text-xs font-bold transition-all ${
                        priority === p.value ? p.activeColor : p.color
                      }`}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 4: Details */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  4. Details
                </label>
                <div className="space-y-3">
                  <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
                    placeholder="Subject — brief title for your request"
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors" />
                  <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4}
                    placeholder="Describe your concern in detail..."
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors resize-none" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-slate-200 bg-slate-50">
          <div className="text-[10px] text-slate-400">
            {selectedDept && <span>Dept: <b>{departments.find(d => d.id === selectedDept)?.name}</b></span>}
            {selectedStaff && <span className="ml-2">| To: <b>{staffList.find(m => String(m.id) === selectedStaff)?.name}</b></span>}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => onClose(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={!canSubmit}
              className="px-5 py-2 text-sm font-bold text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              {submitting ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
              ) : (
                <><SendIcon size={14} /> Submit Request</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CommunicationCenter() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [text, setText] = useState('');
  const [mobileView, setMobileView] = useState('list');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const debouncedSearch = useRef(null);
  const [effectiveSearch, setEffectiveSearch] = useState('');

  const statusParam = activeFilter === 'closed' ? 'resolved' : activeFilter;
  const hasServerStatus = activeFilter !== 'all' && activeFilter !== 'unread';

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
      if (hasServerStatus) params.append('status', statusParam);
      const response = await api.get(`/tickets/?${params.toString()}`);
      setTickets(response.data.results || response.data);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [effectiveSearch, hasServerStatus, statusParam]);

  const fetchMessages = useCallback(async (ticketId) => {
    try {
      const response = await api.get(`/tickets/${ticketId}/messages/`);
      setMessages(response.data);
    } catch {
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
      setShowDetails(false);
    } else {
      setMessages([]);
    }
  }, [selectedId, fetchMessages]);

  useEffect(() => {
    const container = messagesEndRef.current?.parentElement;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (selectedTicket?.id) inputRef.current?.focus();
  }, [selectedTicket?.id]);

  const handleSelectTicket = (id) => {
    setSelectedId(id);
    setMobileView('thread');
  };

  const handleBackToList = () => {
    setMobileView('list');
  };

  const filteredTickets = useMemo(() => {
    if (activeFilter === 'unread') {
      return tickets.filter(t => Number(t.unread_count) > 0);
    }
    return tickets;
  }, [tickets, activeFilter]);

  const handleSend = async () => {
    if (!selectedId) return;
    const content = text.trim();
    if (!content) return;
    try {
      setSending(true);
      await api.post(`/tickets/${selectedId}/send-message/`, { content });
      setText('');
      fetchMessages(selectedId);
      fetchTickets();
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    const result = await Swal.fire({
      title: 'Delete conversation?',
      text: 'This action cannot be undone.',
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
      toast.success('Conversation deleted');
    } catch {
      toast.error('Failed to delete conversation');
    }
  };

  const handleNewModalClose = (created, ticketId) => {
    setShowNewModal(false);
    if (created) {
      fetchTickets();
      if (ticketId) {
        setSelectedId(ticketId);
        setMobileView('thread');
      }
    }
  };

  const unreadCount = tickets.filter(t => Number(t.unread_count) > 0).length;

  return (
    <div className="h-[calc(100dvh-160px)] lg:h-[calc(100vh-100px)] min-h-0 flex bg-slate-100 overflow-hidden" style={{ height: 'calc(var(--vh, 1vh) * 100 - 160px)' }}>
      {/* Left Panel — Ticket List */}
      <div className={`
        w-full lg:w-[340px] min-w-0 bg-white lg:border-r border-slate-200 flex flex-col h-full
        ${mobileView === 'list' ? 'flex' : 'hidden lg:flex'}
      `}>
        {/* Header */}
        <div className="px-4 sm:px-5 py-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">Support Center</h1>
              <p className="text-[10px] text-slate-500 mt-0.5">Manage support requests</p>
            </div>
            <button onClick={() => setShowNewModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 text-white text-xs font-bold rounded-lg hover:bg-violet-700 transition-colors shadow-sm">
              <PlusIcon size={14} />
              <span className="hidden sm:inline">New</span>
              <span className="sm:hidden">+</span>
            </button>
          </div>
          <div className="relative">
            <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input type="text" placeholder="Search requests..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              aria-label="Search support requests"
              className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:bg-white transition-colors" />
          </div>
        </div>

        {/* Filter Segmented Control */}
        <div className="px-3 sm:px-4 py-3 border-b border-slate-100">
          <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0 overflow-x-auto">
            {[
              { id: 'all', label: 'All' },
              { id: 'unread', label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
              { id: 'open', label: 'Open' },
              { id: 'pending', label: 'Await' },
              { id: 'replied', label: 'Active' },
              { id: 'closed', label: 'Closed' },
            ].map(f => (
              <button key={f.id} onClick={() => setActiveFilter(f.id)}
                className={`flex-1 min-w-0 px-1.5 sm:px-1 py-1.5 text-[10px] font-bold rounded-md whitespace-nowrap transition-all ${
                  activeFilter === f.id
                    ? 'bg-white text-violet-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ticket List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-24">
              <div className="w-5 h-5 border-2 border-slate-200 border-t-violet-600 rounded-full animate-spin" />
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 px-6">
              <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 text-slate-300"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              <p className="text-sm font-medium">No requests found</p>
              <p className="text-xs mt-1 text-center">{activeFilter !== 'all' ? 'Try a different filter' : 'Click "+ New" to submit a request'}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filteredTickets.map(ticket => (
                <TicketCard key={ticket.id} ticket={ticket} selected={selectedId === ticket.id} onSelect={handleSelectTicket} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center Panel — Message Thread */}
      <div className={`
        flex-1 flex flex-col min-w-0 bg-slate-50 h-full
        ${mobileView === 'thread' ? 'flex' : 'hidden lg:flex'}
      `}>
        {selectedTicket ? (
          <>
            {/* Thread Header */}
            <div className="flex items-center justify-between px-3 sm:px-5 py-3 bg-white border-b border-slate-200 min-h-[57px]">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {/* Mobile back button */}
                <button onClick={handleBackToList}
                  className="p-1.5 -ml-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors lg:hidden flex-shrink-0"
                  aria-label="Back to list">
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-semibold text-slate-900 truncate">{selectedTicket.subject || 'No Subject'}</span>
                  <span className="hidden sm:inline"><StatusBadge status={selectedTicket.status} /></span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="sm:hidden"><StatusBadge status={selectedTicket.status} /></span>
                <button onClick={() => setShowDetails(v => !v)}
                  className={`p-2 rounded-lg transition-colors text-xs font-medium ${
                    showDetails ? 'bg-violet-100 text-violet-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                  }`} title="View details">
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                </button>
                <button onClick={handleDelete} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete conversation">
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-2 text-slate-300"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                  <p className="text-sm font-medium">No messages yet</p>
                  <p className="text-xs mt-1">Type a message to start the conversation</p>
                </div>
              )}
              {messages.map((msg) => (
                <MessageCard key={msg.id} msg={msg} isOwn={msg.sender === user?.id} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="bg-white border-t border-slate-200 px-3 sm:px-4 py-3">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea ref={inputRef} value={text} onChange={e => setText(e.target.value)}
                    onKeyDown={handleKeyDown} placeholder="Type your message..." rows={1}
                    aria-label="Type your message"
                    className="w-full px-4 py-2.5 bg-slate-100 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:bg-white resize-none transition-colors" />
                </div>
                <button onClick={handleSend} disabled={!text.trim() || sending}
                  aria-label="Send message"
                  className="p-2.5 rounded-lg transition-all flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed bg-violet-600 text-white hover:bg-violet-700 shadow-sm">
                  {sending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <SendIcon size={16} />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50">
            <svg width={56} height={56} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 mb-4"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            <h3 className="text-base font-bold text-slate-400 mb-1">Select a Request</h3>
            <p className="text-sm text-slate-300">Choose a conversation from the list or create a new one</p>
            <button onClick={() => setShowNewModal(true)}
              className="mt-4 px-5 py-2 bg-violet-600 text-white text-sm font-bold rounded-lg hover:bg-violet-700 transition-colors shadow-sm flex items-center gap-2">
              <PlusIcon size={14} /> New Support Request
            </button>
          </div>
        )}
      </div>

      {/* Right Panel — Details (desktop: always visible when selected, mobile: toggle) */}
      <div className={`${showDetails ? 'flex' : 'hidden'} lg:flex`}>
        <DetailsPanel ticket={selectedTicket} messages={messages} onBack={() => setShowDetails(false)} />
      </div>

      {/* New Conversation Modal */}
      <NewConversationModal open={showNewModal} onClose={handleNewModalClose} />
    </div>
  );
}