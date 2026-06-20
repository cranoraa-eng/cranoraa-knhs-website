import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import api, { WS_ROOT } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getAccessToken } from '../utils/auth';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { playSound } from '../utils/sounds';

const FileIcon = (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const SearchIcon = (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const SendIcon = (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const XIcon = (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const ClockIcon = (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const UserIcon = (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const BuildingIcon = (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="6" x2="9" y2="6.01"/><line x1="15" y1="6" x2="15" y2="6.01"/><line x1="9" y1="10" x2="9" y2="10.01"/><line x1="15" y1="10" x2="15" y2="10.01"/><line x1="9" y1="14" x2="9" y2="14.01"/><line x1="15" y1="14" x2="15" y2="14.01"/><line x1="9" y1="18" x2="15" y2="18"/></svg>;
const DownloadIcon = (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const PaperclipIcon = (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>;
const PlusIcon = (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const ChevronDownIcon = (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><polyline points="6 9 12 15 18 9"/></svg>;
const CheckIcon = (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><polyline points="20 6 9 17 4 12"/></svg>;
const CheckCheckIcon = (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M18 7l-8 8-4-4"/><polyline points="22 7 14 17 11 14"/></svg>;
const UsersIcon = (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;
const MoreIcon = (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>;
const PinIcon = (p) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M12 17v5"/><path d="M9 11l-4 4h14l-4-4"/><path d="M15 3.5L9.5 9 15 11l-2.5 2.5"/></svg>;
const TrashIcon = (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>;
const ChatIcon = (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>;
const TicketIcon = (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥'];

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

function formatChatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const today = now.toDateString() === d.toDateString();
  if (today) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (yesterday.toDateString() === d.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getRoomDisplayName(room, userId) {
  if (room.name) return room.name;
  if (!room.is_group && room.participants_details) {
    const other = room.participants_details.find(p => p.id !== userId);
    return other ? `${other.first_name || other.username}` : 'Chat';
  }
  if (room.participants_details) {
    return room.participants_details.map(p => p.first_name || p.username).join(', ');
  }
  return 'Chat';
}

function getRoomAvatar(room, userId) {
  if (room.is_group) return null;
  const other = (room.participants_details || []).find(p => p.id !== userId);
  return other?.profile?.profile_picture || null;
}

function getRoomSubtitle(room) {
  if (room.last_action_type === 'message' && room.last_action_sender_name) {
    const content = room.last_action_content || '';
    return `${room.last_action_sender_name}: ${content.slice(0, 50)}${content.length > 50 ? '…' : ''}`;
  }
  if (room.last_action_type === 'unsend') return 'Message unsent';
  if (room.last_action_type === 'edit') return `${room.last_action_sender_name || 'Someone'} edited a message`;
  return '';
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
  const isPending = msg._optimistic;

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
        } ${isPending ? 'opacity-75' : ''}`}>
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
        {isPending && isOwn && (
          <div className="flex items-center gap-1 mt-1 justify-end">
            <div className="flex gap-0.5">
              <span className="w-1 h-1 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-1 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-1 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-[9px] text-slate-400 italic">Sending</span>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailsPanel({ ticket, messages, onClose, onStatusChange, onPriorityChange, userRole }) {
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

  const canManage = userRole === 'staff' || userRole === 'admin';
  const statusOptions = ['open', 'pending', 'replied', 'resolved', 'closed'];
  const priorityOptions = ['normal', 'high', 'urgent'];

  return (
    <div className="absolute inset-0 z-20 bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Details</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors">
          <XIcon size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          <h4 className="text-sm font-semibold text-slate-900 leading-snug">{ticket.subject || 'No Subject'}</h4>
          <div className="flex items-center gap-2">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <code className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">#{ticket.ticket_id || ticket.id}</code>
          </div>

          {/* Info Card */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Information</p>
            </div>
            <div className="divide-y divide-slate-100">
              <div className="px-3 py-2.5 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-medium">Status</span>
                {canManage ? (
                  <div className="relative">
                    <select
                      value={ticket.status}
                      onChange={(e) => onStatusChange(ticket.id, e.target.value)}
                      className="appearance-none bg-transparent text-xs font-medium text-slate-700 pr-5 cursor-pointer focus:outline-none"
                    >
                      {statusOptions.map(s => (
                        <option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>
                      ))}
                    </select>
                    <ChevronDownIcon size={12} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                ) : (
                  <StatusBadge status={ticket.status} />
                )}
              </div>
              <div className="px-3 py-2.5 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-medium">Priority</span>
                {canManage ? (
                  <div className="relative">
                    <select
                      value={ticket.priority}
                      onChange={(e) => onPriorityChange(ticket.id, e.target.value)}
                      className="appearance-none bg-transparent text-xs font-medium text-slate-700 pr-5 cursor-pointer focus:outline-none"
                    >
                      {priorityOptions.map(p => (
                        <option key={p} value={p}>{PRIORITY_CONFIG[p]?.label || p}</option>
                      ))}
                    </select>
                    <ChevronDownIcon size={12} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                ) : (
                  <PriorityBadge priority={ticket.priority} />
                )}
              </div>
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

const ROLE_GROUPS = [
  { key: 'admin', label: 'Administration', roles: ['admin'] },
  { key: 'staff', label: 'Faculty & Staff', roles: ['staff'] },
  { key: 'student', label: 'Students', roles: ['student'] },
  { key: 'parent', label: 'Parents', roles: ['parent'] },
];

function PeopleDirectory({ onSelectPerson, currentUserId }) {
  const [groups, setGroups] = useState({});
  const [loading, setLoading] = useState(true);
  const [peopleSearch, setPeopleSearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState({ admin: true, staff: true, student: true, parent: true });

  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [adminRes, staffRes, studentRes, parentRes] = await Promise.all([
          api.get('/users/?role=admin').catch(() => ({ data: [] })),
          api.get('/users/?role=staff').catch(() => ({ data: [] })),
          api.get('/users/?role=student').catch(() => ({ data: [] })),
          api.get('/users/?role=parent').catch(() => ({ data: [] })),
        ]);
        if (!cancelled) {
          setGroups({
            admin: adminRes.data.results || adminRes.data || [],
            staff: staffRes.data.results || staffRes.data || [],
            student: studentRes.data.results || studentRes.data || [],
            parent: parentRes.data.results || parentRes.data || [],
          });
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchAll();
    return () => { cancelled = true; };
  }, []);

  const toggleGroup = (key) => {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filtered = useMemo(() => {
    if (!peopleSearch.trim()) return groups;
    const q = peopleSearch.toLowerCase();
    const result = {};
    for (const [role, list] of Object.entries(groups)) {
      result[role] = (list || []).filter(p => {
        const name = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase();
        const email = (p.email || '').toLowerCase();
        return name.includes(q) || email.includes(q);
      });
    }
    return result;
  }, [groups, peopleSearch]);

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-4 sm:px-5 py-4 border-b border-slate-100">
        <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-tight mb-3">Directory</h2>
        <div className="relative">
          <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search people..."
            value={peopleSearch}
            onChange={e => setPeopleSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* People List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-24">
            <div className="w-5 h-5 border-2 border-slate-200 border-t-violet-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="py-2">
            {ROLE_GROUPS.map(group => {
              const list = filtered[group.key] || [];
              if (list.length === 0) return null;
              const isExpanded = expandedGroups[group.key];
              return (
                <div key={group.key} className="mb-1">
                  <button
                    onClick={() => toggleGroup(group.key)}
                    className="w-full flex items-center justify-between px-5 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:bg-slate-50 transition-colors"
                  >
                    <span>{group.label}</span>
                    <span className="text-slate-300">{list.length}</span>
                  </button>
                  {isExpanded && (
                    <div className="divide-y divide-slate-50">
                      {list.map(person => (
                        <button
                          key={person.id}
                          onClick={() => onSelectPerson(person)}
                          className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-violet-50/30 transition-colors text-left"
                        >
                          <div className="relative flex-shrink-0">
                            <Avatar name={`${person.first_name || ''} ${person.last_name || ''}`} size="sm" />
                            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                              person.is_online ? 'bg-emerald-400' : 'bg-slate-300'
                            }`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-slate-800 truncate">
                              {person.first_name} {person.last_name}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {person.role === 'staff'
                                ? (person.staff_title || 'Staff')
                                : person.role === 'parent'
                                  ? 'Parent'
                                  : (person.profile?.classroom_name || 'Student')}
                            </p>
                          </div>
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

export default function CommunicationCenter() {
  const { user } = useAuth();
  const userId = user?.id;
  const [activeTab, setActiveTab] = useState('messages');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showDetails, setShowDetails] = useState(false);
  const [text, setText] = useState('');
  const [mobileView, setMobileView] = useState('list');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const debouncedSearch = useRef(null);
  const [effectiveSearch, setEffectiveSearch] = useState('');

  // ── WebSocket state (tickets) ─────────────────────────────────────────────
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const typingThrottleRef = useRef(0);
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimeoutRef = useRef({});
  const typingNamesRef = useRef({});
  const [wsConnected, setWsConnected] = useState(false);

  // ── New ticket modal ────────────────────────────────────────────────────
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', category: 'other', priority: 'normal', message: '' });
  const [creatingTicket, setCreatingTicket] = useState(false);

  // ── Chat state (Messages tab) ───────────────────────────────────────────
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(true);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [chatTypingUsers, setChatTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [friends, setFriends] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const [showRoomMenu, setShowRoomMenu] = useState(null);
  const [showPinned, setShowPinned] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [chatUploading, setChatUploading] = useState(false);
  const chatSocketRef = useRef(null);
  const chatReconnectTimerRef = useRef(null);
  const chatReconnectAttemptsRef = useRef(0);
  const chatTypingTimerRef = useRef(null);
  const chatLastTypingSentRef = useRef(0);
  const chatFileInputRef = useRef(null);
  const wsConnectedRef = useRef(false);

  const CHAT_BASE_DELAY = 2000;
  const CHAT_MAX_DELAY = 30000;

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
    setText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
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

  // ── WebSocket connect/disconnect per selected ticket ────────────────────
  const fetchTicketsRef = useRef(fetchTickets);
  fetchTicketsRef.current = fetchTickets;

  const connectWs = useCallback((ticketId) => {
    if (!ticketId) return;
    const token = getAccessToken();
    if (!token) return;

    if (wsRef.current && wsRef.current.readyState <= WebSocket.OPEN) return;

    const ws = new WebSocket(`${WS_ROOT}/ws/ticket/${ticketId}/`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'auth', token }));
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);

        if (data.type === 'auth_success') {
          if (data.user_id) {
            setWsConnected(true);
            reconnectAttemptsRef.current = 0;
            if (reconnectTimerRef.current) {
              clearTimeout(reconnectTimerRef.current);
              reconnectTimerRef.current = null;
            }
          }
          return;
        }

        if (data.type === 'auth_failed') {
          toast.error(data.message || 'Authentication failed');
          return;
        }

        if (data.type === 'message') {
          setMessages(prev => {
            // Check for exact ID match (dedup real messages)
            if (prev.some(m => m.id === data.id)) return prev;
            // Replace optimistic placeholder with real message
            const withoutOptimistic = prev.filter(m => !m._optimistic || m.sender !== data.sender || m.content !== data.content);
            return [...withoutOptimistic, data];
          });

        } else if (data.type === 'ticket_list_update' && data.ticket) {
          setTickets(prev => {
            const idx = prev.findIndex(t => t.id === data.ticket.id);
            if (idx === -1) return prev;
            const updated = [...prev];
            updated[idx] = { ...updated[idx], ...data.ticket };
            return updated;
          });

        } else if (data.type === 'typing') {
          const uid = data.sender_id;
          if (data.is_typing) {
            typingNamesRef.current[uid] = data.sender_name || 'Someone';
            setTypingUsers(prev => {
              if (prev.includes(uid)) return prev;
              return [...prev, uid];
            });
            if (typingTimeoutRef.current[uid]) clearTimeout(typingTimeoutRef.current[uid]);
            typingTimeoutRef.current[uid] = setTimeout(() => {
              setTypingUsers(prev => prev.filter(id => id !== uid));
              delete typingNamesRef.current[uid];
            }, 4000);
          } else {
            setTypingUsers(prev => prev.filter(id => id !== uid));
            delete typingNamesRef.current[uid];
            if (typingTimeoutRef.current[uid]) clearTimeout(typingTimeoutRef.current[uid]);
          }

        } else if (data.type === 'status_update') {
          setTickets(prev => prev.map(t =>
            t.id === data.ticket_id ? { ...t, status: data.status } : t
          ));

        } else if (data.type === 'priority_update') {
          setTickets(prev => prev.map(t =>
            t.id === data.ticket_id ? { ...t, priority: data.priority } : t
          ));

        } else if (data.type === 'assignment_update') {
          setTickets(prev => prev.map(t =>
            t.id === data.ticket_id ? { ...t, assigned_to_name: data.assigned_to_name } : t
          ));

        } else if (data.type === 'new_message_notify') {
          // Ticket not currently open — refresh list for that ticket
          fetchTicketsRef.current();

        } else if (data.type === 'error') {
          toast.error(data.message);
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = (e) => {
      setWsConnected(false);
      wsRef.current = null;
      if (e.code !== 1000 && e.code !== 1001) {
        const attempts = reconnectAttemptsRef.current;
        const delay = Math.min(3000 * Math.pow(2, attempts), 30000);
        reconnectAttemptsRef.current = attempts + 1;
        reconnectTimerRef.current = setTimeout(() => connectWs(ticketId), delay);
      }
    };

    ws.onerror = () => {
      setWsConnected(false);
    };
  }, []);

  const disconnectWs = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close(1000, 'Ticket deselected');
      wsRef.current = null;
    }
    setWsConnected(false);
    setTypingUsers([]);
  }, []);

  // Connect WS when selected ticket changes
  useEffect(() => {
    if (selectedId) {
      connectWs(selectedId);
    } else {
      disconnectWs();
    }
    return () => disconnectWs();
  }, [selectedId, connectWs, disconnectWs]);

  // Cleanup typing timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(typingTimeoutRef.current).forEach(clearTimeout);
      typingNamesRef.current = {};
    };
  }, []);

  // ── Chat: WebSocket connect/disconnect per selected room ──────────────────
  const connectChatWs = useCallback((roomId) => {
    if (!roomId || !userId) return;
    const token = getAccessToken();
    if (!token) return;
    if (chatSocketRef.current && chatSocketRef.current.readyState <= WebSocket.OPEN) return;

    const ws = new WebSocket(`${WS_ROOT}/ws/chat/${roomId}/`);
    chatSocketRef.current = ws;
    wsConnectedRef.current = false;

    ws.onopen = () => { ws.send(JSON.stringify({ type: 'auth', token })); };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'auth_success') { wsConnectedRef.current = true; chatReconnectAttemptsRef.current = 0; return; }
        if (data.type === 'auth_failed') { ws.close(); return; }
        if (data.type === 'message') {
          setChatMessages(prev => { if (prev.some(m => m.id === data.id)) return prev; return [...prev, data]; });
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
          return;
        }
        if (data.type === 'typing') {
          setChatTypingUsers(prev => { const next = { ...prev }; if (data.is_typing) next[data.sender_id] = data.sender_name; else delete next[data.sender_id]; return next; });
          return;
        }
        if (data.type === 'read') { setChatMessages(prev => prev.map(m => m.id <= data.message_id ? { ...m, is_read: true } : m)); return; }
        if (data.type === 'delivered') { setChatMessages(prev => prev.map(m => m.id === data.message_id ? { ...m, is_delivered: true } : m)); return; }
        if (data.type === 'message_deleted') { setChatMessages(prev => prev.filter(m => m.id !== data.message_id)); return; }
        if (data.type === 'message_edited') { setChatMessages(prev => prev.map(m => m.id === data.message_id ? { ...m, content: data.content, is_edited: true } : m)); return; }
        if (data.type === 'message_reaction') { setChatMessages(prev => prev.map(m => m.id === data.message_id ? { ...m, reactions: data.reactions } : m)); return; }
        if (data.type === 'peer_online') { setOnlineUsers(prev => new Set([...prev, data.user_id])); return; }
        if (data.type === 'peer_presence') { setOnlineUsers(prev => { const next = new Set(prev); if (data.is_online) next.add(data.user_id); else next.delete(data.user_id); return next; }); return; }
        if (data.type === 'room_update') {
          if (data.event === 'group_deleted') { setChatRooms(prev => prev.filter(r => r.id !== data.room_id)); if (selectedRoom?.id === data.room_id) setSelectedRoom(null); }
          else if (data.room) { setChatRooms(prev => { const idx = prev.findIndex(r => r.id === data.room.id); if (idx >= 0) { const next = [...prev]; next[idx] = data.room; return next; } return [data.room, ...prev]; }); }
          return;
        }
        if (data.type === 'forced_logout') { toast.error(data.message || 'Your account has been suspended.'); return; }
      } catch { /* ignore */ }
    };

    ws.onclose = (e) => {
      wsConnectedRef.current = false;
      chatSocketRef.current = null;
      if (e.code !== 1000 && e.code !== 1001 && userId) {
        if (chatReconnectTimerRef.current) clearTimeout(chatReconnectTimerRef.current);
        const attempts = chatReconnectAttemptsRef.current;
        const delay = Math.min(CHAT_BASE_DELAY * Math.pow(2, attempts), CHAT_MAX_DELAY);
        chatReconnectAttemptsRef.current = attempts + 1;
        chatReconnectTimerRef.current = setTimeout(() => connectChatWs(roomId), delay);
      }
    };
    ws.onerror = () => {};
  }, [userId, selectedRoom?.id]);

  const disconnectChatWs = useCallback(() => {
    if (chatReconnectTimerRef.current) { clearTimeout(chatReconnectTimerRef.current); chatReconnectTimerRef.current = null; }
    chatReconnectAttemptsRef.current = 0;
    if (chatSocketRef.current) { chatSocketRef.current.close(1000, 'Room changed'); chatSocketRef.current = null; }
    wsConnectedRef.current = false;
    setChatTypingUsers({});
  }, []);

  const sendChatWs = useCallback((payload) => {
    if (chatSocketRef.current && chatSocketRef.current.readyState === WebSocket.OPEN) {
      chatSocketRef.current.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }, []);

  const loadChatRooms = useCallback(async () => {
    try { const r = await api.get('/chat/rooms/'); setChatRooms(r.data.results || r.data); } catch { /* ignore */ }
  }, []);

  const loadChatMessages = useCallback(async (roomId) => {
    if (!roomId) return;
    try { const r = await api.get(`/chat/messages/?room_id=${roomId}`); setChatMessages(r.data.results || r.data); setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100); } catch { /* ignore */ }
  }, []);

  const loadFriends = useCallback(async () => {
    try { const r = await api.get('/friendships/my_friends/'); setFriends(r.data); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (activeTab === 'messages') {
      setChatLoading(true);
      Promise.all([loadChatRooms(), loadFriends()]).then(() => setChatLoading(false));
    }
  }, [activeTab, loadChatRooms, loadFriends]);

  useEffect(() => {
    if (selectedRoom && activeTab === 'messages') {
      disconnectChatWs();
      setChatMessages([]);
      loadChatMessages(selectedRoom.id).then(() => connectChatWs(selectedRoom.id));
    }
  }, [selectedRoom?.id, activeTab, connectChatWs, disconnectChatWs, loadChatMessages]);

  useEffect(() => { return () => disconnectChatWs(); }, [disconnectChatWs]);

  const handleSelectRoom = useCallback((room) => {
    setSelectedRoom(room);
    setShowRoomMenu(null);
    setChatSearchQuery('');
    setReplyTo(null);
    setMobileView('thread');
  }, []);

  const handleSendChatMessage = useCallback(() => {
    if (!chatMessages || !selectedRoom || sending) return;
    const content = (document.querySelector('[data-chat-input]')?.value || '').trim();
    if (!content) return;
    setSending(true);
    setReplyTo(null);
    if (!sendChatWs({ type: 'message', message: content })) {
      toast.error('Connection lost. Reconnecting...');
      connectChatWs(selectedRoom.id);
    }
    setSending(false);
  }, [selectedRoom, sending, sendChatWs, connectChatWs]);

  const handleChatKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const input = e.target;
      const content = input.value.trim();
      if (!content || !selectedRoom) return;
      setReplyTo(null);
      if (!sendChatWs({ type: 'message', message: content })) {
        toast.error('Connection lost. Reconnecting...');
        connectChatWs(selectedRoom.id);
      }
      input.value = '';
    }
  }, [selectedRoom, sendChatWs, connectChatWs]);

  const handleChatTyping = useCallback(() => {
    const now = Date.now();
    if (now - chatLastTypingSentRef.current > 3000) {
      chatLastTypingSentRef.current = now;
      sendChatWs({ type: 'typing', is_typing: true });
    }
    if (chatTypingTimerRef.current) clearTimeout(chatTypingTimerRef.current);
    chatTypingTimerRef.current = setTimeout(() => { sendChatWs({ type: 'typing', is_typing: false }); }, 3000);
  }, [sendChatWs]);

  const handleChatReaction = useCallback((messageId, emoji) => {
    sendChatWs({ type: 'reaction', message_id: messageId, emoji });
    setShowEmojiPicker(null);
  }, [sendChatWs]);

  const handleChatMarkRead = useCallback(() => {
    if (!selectedRoom || !chatMessages?.length) return;
    const lastMsg = chatMessages[chatMessages.length - 1];
    if (lastMsg && lastMsg.sender !== userId) {
      sendChatWs({ type: 'read', message_id: lastMsg.id });
    }
  }, [selectedRoom, chatMessages, userId, sendChatWs]);

  useEffect(() => { if (selectedRoom && activeTab === 'messages') handleChatMarkRead(); }, [chatMessages, selectedRoom, activeTab, handleChatMarkRead]);

  const handleCreatePrivateChat = useCallback(async (friendId) => {
    try {
      const r = await api.post('/chat/rooms/get_or_create_private_chat/', { user_id: friendId });
      await loadChatRooms();
      setSelectedRoom(r.data);
      setShowNewChatModal(false);
    } catch { toast.error('Failed to create chat'); }
  }, [loadChatRooms]);

  const handleCreateGroupChat = useCallback(async (name, participantIds) => {
    try {
      const r = await api.post('/chat/rooms/', { name, is_group: true, participants: participantIds });
      await loadChatRooms();
      setSelectedRoom(r.data);
      setShowNewChatModal(false);
    } catch { toast.error('Failed to create group'); }
  }, [loadChatRooms]);

  const handlePinRoom = useCallback(async (roomId) => {
    try {
      const room = chatRooms.find(r => r.id === roomId);
      if (room?.is_pinned) await api.post(`/chat/rooms/${roomId}/unpin/`);
      else await api.post(`/chat/rooms/${roomId}/pin/`);
      await loadChatRooms();
      setShowRoomMenu(null);
    } catch { toast.error('Failed to update pin'); }
  }, [chatRooms, loadChatRooms]);

  const handleDeleteConversation = useCallback(async (roomId) => {
    const result = await Swal.fire({ title: 'Delete conversation?', text: 'This will remove all messages for you.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#9F7AEA', cancelButtonColor: '#f43f5e', confirmButtonText: 'Delete' });
    if (result.isConfirmed) {
      try { await api.delete(`/chat/rooms/${roomId}/delete_conversation/`); await loadChatRooms(); if (selectedRoom?.id === roomId) setSelectedRoom(null); toast.success('Conversation deleted'); } catch { toast.error('Failed to delete'); }
    }
    setShowRoomMenu(null);
  }, [selectedRoom, loadChatRooms]);

  const handleDeleteChatMessage = useCallback(async (messageId) => {
    const result = await Swal.fire({ title: 'Delete message?', text: 'This cannot be undone.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#9F7AEA', confirmButtonText: 'Delete' });
    if (result.isConfirmed) { try { await api.delete(`/chat/messages/${messageId}/`); } catch { toast.error('Failed to delete message'); } }
  }, []);

  const handleEditChatMessage = useCallback(async (messageId) => {
    const { value } = await Swal.fire({ title: 'Edit message', input: 'text', inputValue: chatMessages?.find(m => m.id === messageId)?.content || '', showCancelButton: true, confirmButtonColor: '#9F7AEA' });
    if (value !== undefined && value.trim()) { try { await api.patch(`/chat/messages/${messageId}/edit/`, { content: value.trim() }); setChatMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: value.trim(), is_edited: true } : m)); } catch { toast.error('Failed to edit'); } }
  }, [chatMessages]);

  const handleChatUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedRoom) return;
    setChatUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('room_id', selectedRoom.id);
      if (replyTo) formData.append('parent_id', replyTo.id);
      const r = await api.post('/chat/messages/send_media/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setChatMessages(prev => [...prev, r.data]);
      setReplyTo(null);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch { toast.error('Upload failed'); }
    setChatUploading(false);
    if (chatFileInputRef.current) chatFileInputRef.current.value = '';
  }, [selectedRoom, replyTo]);

  const filteredChatRooms = useMemo(() => {
    let list = [...chatRooms];
    if (showPinned) list = list.filter(r => r.is_pinned);
    if (chatSearchQuery) { const q = chatSearchQuery.toLowerCase(); list = list.filter(r => getRoomDisplayName(r, userId).toLowerCase().includes(q)); }
    const pinned = list.filter(r => r.is_pinned);
    const unpinned = list.filter(r => !r.is_pinned);
    return [...pinned, ...unpinned];
  }, [chatRooms, showPinned, chatSearchQuery, userId]);

  const handleSend = async () => {
    if (!selectedId) return;
    const content = text.trim();
    if (!content) return;
    setText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setTypingUsers(prev => prev.filter(id => id !== user?.id));

    // Optimistically add the message to the UI immediately
    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      sender: user?.id,
      sender_name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username : 'You',
      content,
      created_at: new Date().toISOString(),
      is_read: false,
      _optimistic: true,
    };
    setMessages(prev => [...prev, optimisticMsg]);

    // Send via WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'message', content }));
      return;
    }

    // WS not connected — try reconnecting then sending
    toast.error('Connection lost. Reconnecting...');
    connectWs(selectedId);
  };

  // ── Typing indicator ───────────────────────────────────────────────────
  const handleTextChange = (e) => {
    handleTextareaInput(e);
    // Send typing indicator (throttled to every 3s)
    const now = Date.now();
    if (now - typingThrottleRef.current > 3000 && wsRef.current?.readyState === WebSocket.OPEN) {
      typingThrottleRef.current = now;
      wsRef.current.send(JSON.stringify({ type: 'typing', is_typing: true }));
    }
  };

  // Send typing stopped when user clears input
  useEffect(() => {
    if (!text.trim() && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'typing', is_typing: false }));
    }
  }, [text]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Send typing stopped before sending message
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'typing', is_typing: false }));
      }
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

  const handleSelectPerson = async (person) => {
    try {
      const res = await api.post('/tickets/open-conversation/', { user_id: person.id });
      const ticket = res.data;
      const alreadyExists = tickets.find(t => t.id === ticket.id);
      if (!alreadyExists) {
        setTickets(prev => [ticket, ...prev]);
      }
      setSelectedId(ticket.id);
      setMobileView('thread');
    } catch (err) {
      toast.error(err.response?.data?.detail || err.response?.data?.error || 'Failed to start conversation');
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'update_status', status: newStatus }));
    } else {
      toast.error('Connection lost. Cannot update status.');
    }
  };

  const handlePriorityChange = async (ticketId, newPriority) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'update_priority', priority: newPriority }));
    } else {
      toast.error('Connection lost. Cannot update priority.');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedId) return;
    if (file.size > 25 * 1024 * 1024) {
      toast.error('File size exceeds 25 MB limit');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('content', file.name);
    try {
      setSending(true);
      await api.post(`/tickets/${selectedId}/send-message/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchMessages(selectedId);
      fetchTickets();
    } catch {
      toast.error('Failed to upload file');
    } finally {
      setSending(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicket.subject.trim()) {
      toast.error('Subject is required');
      return;
    }
    setCreatingTicket(true);
    try {
      const res = await api.post('/tickets/', {
        subject: newTicket.subject.trim(),
        category: newTicket.category,
        priority: newTicket.priority,
      });
      if (newTicket.message.trim()) {
        await api.post(`/tickets/${res.data.id}/send-message/`, { content: newTicket.message.trim() });
      }
      toast.success('Ticket created');
      setShowNewTicket(false);
      setNewTicket({ subject: '', category: 'other', priority: 'normal', message: '' });
      await fetchTickets();
      setSelectedId(res.data.id);
      setMobileView('thread');
    } catch (err) {
      toast.error(err.response?.data?.detail || err.response?.data?.error || 'Failed to create ticket');
    } finally {
      setCreatingTicket(false);
    }
  };

  const handleTextareaInput = (e) => {
    setText(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const unreadCount = tickets.filter(t => Number(t.unread_count) > 0).length;

  return (
    <div className="h-[calc(100dvh-160px)] lg:h-[calc(100vh-100px)] min-h-0 flex bg-slate-100 overflow-hidden" style={{ height: 'calc(var(--vh, 1vh) * 100 - 160px)' }}>
      {/* Left Panel — Ticket List / Chat Rooms */}
      <div className={`
        w-full lg:w-[340px] min-w-0 bg-white lg:border-r border-slate-200 flex flex-col h-full
        ${mobileView === 'list' ? 'flex' : 'hidden lg:flex'}
      `}>
        {/* Tab Bar */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-colors ${
              activeTab === 'messages' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <ChatIcon size={14} />
            Messages
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-colors ${
              activeTab === 'support' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <TicketIcon size={14} />
            Support
          </button>
        </div>

        {activeTab === 'support' ? (
          <>
            {/* Support Header */}
            <div className="px-4 sm:px-5 py-4 border-b border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h1 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">Support Center</h1>
                  <p className="text-[10px] text-slate-500 mt-0.5">Manage support requests</p>
                </div>
                <button onClick={() => setShowNewTicket(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white text-[11px] font-bold rounded-lg hover:bg-violet-700 transition-colors shadow-sm">
                  <PlusIcon size={12} />
                  New
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
          </>
        ) : (
          <>
            {/* Messages Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div className="relative flex-1 mr-2">
                <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={chatSearchQuery}
                  onChange={(e) => setChatSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:bg-white transition-colors"
                />
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowPinned(!showPinned)}
                  className={`p-2 rounded-lg transition-colors ${showPinned ? 'bg-violet-100 text-violet-600' : 'text-slate-400 hover:bg-slate-100'}`}
                  title="Pinned chats"
                >
                  <PinIcon size={14} />
                </button>
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
                  title="New chat"
                >
                  <PlusIcon size={16} />
                </button>
              </div>
            </div>

            {/* Chat Room List */}
            <div className="flex-1 overflow-y-auto">
              {chatLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-5 h-5 border-2 border-slate-200 border-t-violet-600 rounded-full animate-spin" />
                </div>
              ) : filteredChatRooms.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ChatIcon size={20} className="text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-500">No conversations yet</p>
                  <p className="text-xs text-slate-400 mt-1">Start a new chat to begin messaging</p>
                </div>
              ) : (
                filteredChatRooms.map(room => {
                  const displayName = getRoomDisplayName(room, userId);
                  const avatar = getRoomAvatar(room, userId);
                  const subtitle = getRoomSubtitle(room);
                  const isActive = selectedRoom?.id === room.id;
                  const hasUnread = room.unread_count > 0;

                  return (
                    <button
                      key={room.id}
                      onClick={() => handleSelectRoom(room)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors relative ${
                        isActive ? 'bg-violet-50 border-r-2 border-violet-600' : 'hover:bg-slate-50 border-r-2 border-transparent'
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        {avatar ? (
                          <img src={avatar} alt="" className="w-11 h-11 rounded-full object-cover" />
                        ) : room.is_group ? (
                          <div className="w-11 h-11 rounded-full bg-violet-100 flex items-center justify-center">
                            <UsersIcon size={20} className="text-violet-600" />
                          </div>
                        ) : (
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm ${getAvatarColor(displayName)}`}>
                            {getInitials(displayName)}
                          </div>
                        )}
                        {!room.is_group && room.participants_details?.find(p => p.id !== userId) && onlineUsers.has(room.participants_details.find(p => p.id !== userId)?.id) && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm truncate ${hasUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                            {displayName}
                          </span>
                          <span className="text-[11px] text-slate-400 flex-shrink-0 ml-2">
                            {formatChatTime(room.updated_at)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className={`text-xs truncate ${hasUnread ? 'font-semibold text-slate-700' : 'text-slate-500'}`}>
                            {subtitle || 'No messages yet'}
                          </span>
                          {hasUnread && (
                            <span className="ml-2 flex-shrink-0 w-5 h-5 bg-violet-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                              {room.unread_count > 99 ? '99+' : room.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {/* Center Panel — Message Thread */}
      <div className={`
        flex-1 flex flex-col min-w-0 bg-slate-50 h-full relative
        ${mobileView === 'thread' ? 'flex' : 'hidden lg:flex'}
      `}>
        {activeTab === 'messages' ? (
          selectedRoom ? (
            <>
              {/* Chat Thread Header */}
              <div className="flex items-center justify-between px-3 sm:px-5 py-3 bg-white border-b border-slate-200 min-h-[57px]">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <button onClick={() => { setSelectedRoom(null); setMobileView('list'); }}
                    className="p-1.5 -ml-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors lg:hidden flex-shrink-0">
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                  </button>
                  {getRoomAvatar(selectedRoom, userId) ? (
                    <img src={getRoomAvatar(selectedRoom, userId)} alt="" className="w-9 h-9 rounded-full object-cover" />
                  ) : selectedRoom.is_group ? (
                    <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center"><UsersIcon size={18} className="text-violet-600" /></div>
                  ) : (
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs ${getAvatarColor(getRoomDisplayName(selectedRoom, userId))}`}>
                      {getInitials(getRoomDisplayName(selectedRoom, userId))}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 truncate">{getRoomDisplayName(selectedRoom, userId)}</h3>
                    <p className="text-xs text-slate-500">
                      {selectedRoom.is_group ? `${(selectedRoom.participants_details || []).length} members` :
                        (selectedRoom.participants_details || []).find(p => p.id !== userId) && onlineUsers.has(selectedRoom.participants_details.find(p => p.id !== userId)?.id) ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
                <div className="relative">
                  <button onClick={() => setShowRoomMenu(showRoomMenu === selectedRoom.id ? null : selectedRoom.id)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
                    <MoreIcon size={18} />
                  </button>
                  {showRoomMenu === selectedRoom.id && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1">
                      <button onClick={() => handlePinRoom(selectedRoom.id)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                        <PinIcon size={14} />{selectedRoom.is_pinned ? 'Unpin chat' : 'Pin chat'}
                      </button>
                      <button onClick={() => handleDeleteConversation(selectedRoom.id)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                        <TrashIcon size={14} />Delete conversation
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1" onClick={() => setShowRoomMenu(null)}>
                {(!chatMessages || chatMessages.length === 0) ? (
                  <div className="flex items-center justify-center h-full"><p className="text-sm text-slate-400">No messages yet. Say hello!</p></div>
                ) : (
                  chatMessages.map((msg, i) => {
                    const isOwn = msg.sender === userId;
                    const showAvatar = !isOwn && (i === 0 || chatMessages[i - 1]?.sender !== msg.sender);
                    const isLast = i === chatMessages.length - 1 || chatMessages[i + 1]?.sender !== msg.sender;
                    return (
                      <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${!isLast ? 'mb-0.5' : 'mb-2'}`}>
                        {!isOwn && <div className="w-8 flex-shrink-0">{showAvatar && <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${getAvatarColor(msg.sender_name)}`}>{getInitials(msg.sender_name)}</div>}</div>}
                        <div className={`max-w-[70%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                          {showAvatar && !isOwn && <span className="text-[11px] font-semibold text-slate-500 mb-0.5 ml-1">{msg.sender_name}</span>}
                          {msg.parent_message_details && (
                            <div className={`text-[11px] px-2.5 py-1 mb-0.5 rounded-t-lg border-l-2 ${isOwn ? 'bg-violet-50 border-violet-400 text-violet-700' : 'bg-slate-50 border-slate-300 text-slate-600'}`}>
                              <span className="font-semibold">{msg.parent_message_details.sender_name}</span>: {msg.parent_message_details.content?.slice(0, 60)}
                            </div>
                          )}
                          <div className="relative group">
                            {msg.message_type === 'image' && msg.attachment_url ? (
                              <a href={msg.attachment_url} target="_blank" rel="noreferrer" className="block">
                                <img src={msg.attachment_url} alt={msg.attachment_filename} className="max-w-[280px] max-h-[200px] rounded-xl object-cover" />
                                {msg.content && <p className="text-sm mt-1 px-1">{msg.content}</p>}
                              </a>
                            ) : msg.message_type === 'file' && msg.attachment_url ? (
                              <a href={msg.attachment_url} target="_blank" rel="noreferrer" className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${isOwn ? 'bg-violet-50 border-violet-200' : 'bg-white border-slate-200'}`}>
                                <PaperclipIcon size={16} className={isOwn ? 'text-violet-500' : 'text-slate-500'} />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-slate-700 truncate">{msg.attachment_filename || 'File'}</p>
                                  <p className="text-[10px] text-slate-400">{formatFileSize(msg.file_size_bytes)}</p>
                                </div>
                                <DownloadIcon size={14} className="text-slate-400 flex-shrink-0" />
                              </a>
                            ) : (
                              <div className={`px-3 py-2 rounded-2xl ${isOwn ? 'bg-violet-600 text-white rounded-br-md' : 'bg-white text-slate-800 border border-slate-200 shadow-sm rounded-bl-md'}`}>
                                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                              </div>
                            )}
                            <div className={`absolute ${isOwn ? 'right-0' : 'left-0'} -top-8 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center gap-0.5 bg-white border border-slate-200 rounded-lg shadow-lg px-1 py-0.5`}>
                              <button onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)} className="p-1 hover:bg-slate-100 rounded text-xs" title="React">😊</button>
                              {!isOwn && <button onClick={() => setReplyTo(msg)} className="p-1 hover:bg-slate-100 rounded text-xs" title="Reply">↩</button>}
                              {isOwn && <>
                                <button onClick={() => handleEditChatMessage(msg.id)} className="p-1 hover:bg-slate-100 rounded text-xs" title="Edit">✏️</button>
                                <button onClick={() => handleDeleteChatMessage(msg.id)} className="p-1 hover:bg-red-50 rounded text-xs text-red-500" title="Delete">🗑</button>
                              </>}
                            </div>
                            {showEmojiPicker === msg.id && (
                              <div className={`absolute ${isOwn ? 'right-0' : 'left-0'} -top-12 bg-white border border-slate-200 rounded-xl shadow-lg px-2 py-1 flex items-center gap-1 z-20`}>
                                {EMOJI_LIST.map(emoji => (<button key={emoji} onClick={() => handleChatReaction(msg.id, emoji)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded text-lg">{emoji}</button>))}
                              </div>
                            )}
                          </div>
                          {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-0.5 ml-1">
                              {Object.entries(msg.reactions).map(([emoji, users]) => (
                                <button key={emoji} onClick={() => handleChatReaction(msg.id, emoji)} className="flex items-center gap-0.5 px-1.5 py-0.5 bg-white border border-slate-200 rounded-full text-xs hover:bg-slate-50">
                                  <span>{emoji}</span><span className="text-slate-500">{users.length}</span>
                                </button>
                              ))}
                            </div>
                          )}
                          {isLast && (
                            <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                              <span className="text-[10px] text-slate-400">{formatChatTime(msg.timestamp)}</span>
                              {isOwn && (msg.is_read ? <CheckCheckIcon size={12} className="text-violet-500" /> : msg.is_delivered ? <CheckCheckIcon size={12} className="text-slate-400" /> : <CheckIcon size={12} className="text-slate-400" />)}
                              {msg.is_edited && <span className="text-[10px] text-slate-400">(edited)</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                {Object.keys(chatTypingUsers).length > 0 && (
                  <div className="flex items-center gap-2 px-1">
                    <div className="flex gap-0.5">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs text-slate-400">{Object.values(chatTypingUsers).join(', ')} {Object.keys(chatTypingUsers).length === 1 ? 'is' : 'are'} typing...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply preview */}
              {replyTo && (
                <div className="flex items-center gap-2 px-4 py-2 bg-violet-50 border-t border-violet-200">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-violet-600">Replying to {replyTo.sender_name}</p>
                    <p className="text-xs text-slate-600 truncate">{replyTo.content}</p>
                  </div>
                  <button onClick={() => setReplyTo(null)} className="text-violet-400 hover:text-violet-600"><XIcon size={14} /></button>
                </div>
              )}

              {/* Chat Input */}
              <div className="px-4 py-3 border-t border-slate-200 bg-white">
                <div className="flex items-end gap-2">
                  <input type="file" ref={chatFileInputRef} onChange={handleChatUpload} className="hidden" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip" />
                  <button onClick={() => chatFileInputRef.current?.click()} disabled={chatUploading} className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors disabled:opacity-50" title="Attach file">
                    <PaperclipIcon size={18} />
                  </button>
                  <div className="flex-1 relative">
                    <input
                      data-chat-input
                      type="text"
                      placeholder="Type a message..."
                      onKeyDown={handleChatKeyDown}
                      onChange={handleChatTyping}
                      className="w-full px-4 py-2.5 text-sm bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-50">
              <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChatIcon size={32} className="text-violet-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-700">Select a conversation</h3>
              <p className="text-sm text-slate-500 mt-1">Choose from existing chats or start a new one</p>
            </div>
          )
        ) : (
          selectedTicket ? (
          <>
            {/* Details Overlay */}
            {showDetails && (
              <DetailsPanel ticket={selectedTicket} messages={messages} onClose={() => setShowDetails(false)}
                onStatusChange={handleStatusChange} onPriorityChange={handlePriorityChange} userRole={user?.role} />
            )}

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
              {typingUsers.length > 0 && (
                <div className="px-1 pb-2">
                  <p className="text-[11px] text-slate-400 italic flex items-center gap-1.5">
                    <span className="flex gap-0.5">
                      <span className="w-1 h-1 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1 h-1 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1 h-1 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                    {typingUsers.length === 1
                      ? <>{typingNamesRef.current[typingUsers[0]] || 'Someone'} is typing</>
                      : <>{typingUsers.length} people are typing</>}
                  </p>
                </div>
              )}
              <div className="flex items-end gap-2">
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload}
                  accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip" />
                <button onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors flex-shrink-0"
                  title="Attach file" aria-label="Attach file">
                  <PaperclipIcon size={16} />
                </button>
                <div className="flex-1 relative">
                  <textarea ref={(el) => { inputRef.current = el; textareaRef.current = el; }} value={text} onChange={handleTextChange}
                    onKeyDown={handleKeyDown} placeholder="Type your message..." rows={1}
                    aria-label="Type your message"
                    className="w-full px-4 py-2.5 bg-slate-100 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:bg-white resize-none transition-colors max-h-[120px] overflow-y-auto" />
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
            <p className="text-sm text-slate-300 text-center max-w-[240px]">Choose a conversation from the list or select someone from the directory</p>
          </div>
        ))}
      </div>

      {/* Right Panel — People Directory */}
      <div className="hidden lg:flex w-[300px] min-w-0 border-l border-slate-200 h-full">
        <PeopleDirectory onSelectPerson={handleSelectPerson} currentUserId={user?.id} />
      </div>

      {/* New Ticket Modal */}
      {showNewTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowNewTicket(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">New Support Request</h3>
              <button onClick={() => setShowNewTicket(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors">
                <XIcon size={14} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Subject</label>
                <input type="text" value={newTicket.subject} onChange={e => setNewTicket(p => ({ ...p, subject: e.target.value }))}
                  placeholder="Brief description of your issue"
                  className="w-full px-3 py-2 bg-slate-100 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:bg-white transition-colors" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Category</label>
                  <div className="relative">
                    <select value={newTicket.category} onChange={e => setNewTicket(p => ({ ...p, category: e.target.value }))}
                      className="w-full appearance-none px-3 py-2 bg-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:bg-white transition-colors pr-8">
                      <option value="enrollment">Enrollment</option>
                      <option value="attendance">Attendance</option>
                      <option value="academic">Academic</option>
                      <option value="guidance">Guidance</option>
                      <option value="it_support">IT Support</option>
                      <option value="finance">Finance</option>
                      <option value="facilities">Facilities</option>
                      <option value="collaboration">Collaboration</option>
                      <option value="other">Other</option>
                    </select>
                    <ChevronDownIcon size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="w-28">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Priority</label>
                  <div className="relative">
                    <select value={newTicket.priority} onChange={e => setNewTicket(p => ({ ...p, priority: e.target.value }))}
                      className="w-full appearance-none px-3 py-2 bg-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:bg-white transition-colors pr-8">
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                    <ChevronDownIcon size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Message (optional)</label>
                <textarea value={newTicket.message} onChange={e => setNewTicket(p => ({ ...p, message: e.target.value }))}
                  placeholder="Describe your issue in detail..." rows={3}
                  className="w-full px-3 py-2 bg-slate-100 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:bg-white transition-colors resize-none" />
              </div>
            </div>
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button onClick={() => setShowNewTicket(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={handleCreateTicket} disabled={creatingTicket || !newTicket.subject.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                {creatingTicket ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <PlusIcon size={12} />}
                Create Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowNewChatModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-800">New Conversation</h3>
              <button onClick={() => setShowNewChatModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><XIcon size={18} /></button>
            </div>
            <div className="flex border-b border-slate-200">
              <button onClick={() => {}} className="flex-1 py-2.5 text-sm font-semibold text-violet-600 border-b-2 border-violet-600">Friends</button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {friends.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-500">No friends yet</p>
                  <p className="text-xs text-slate-400 mt-1">Add friends to start chatting</p>
                </div>
              ) : (
                friends.map(friend => (
                  <button key={friend.id} onClick={() => handleCreatePrivateChat(friend.id)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                    {friend.profile?.profile_picture ? (
                      <img src={friend.profile.profile_picture} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${getAvatarColor(friend.first_name || friend.username)}`}>
                        {getInitials(friend.first_name || friend.username)}
                      </div>
                    )}
                    <div className="text-left">
                      <p className="text-sm font-semibold text-slate-800">{friend.first_name || friend.username}</p>
                      <p className="text-xs text-slate-500">{friend.role}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}