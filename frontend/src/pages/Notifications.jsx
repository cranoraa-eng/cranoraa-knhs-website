import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

// ── Type config ───────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  announcement: { label: 'Announcement', badge: 'ui-badge-violet',  dot: 'bg-violet-500' },
  grade:        { label: 'Grade',        badge: 'ui-badge-green',   dot: 'bg-emerald-500' },
  attendance:   { label: 'Attendance',   badge: 'ui-badge-amber',   dot: 'bg-amber-500' },
  fee:          { label: 'Fee',          badge: 'ui-badge-red',     dot: 'bg-red-500' },
  system:       { label: 'System',       badge: 'ui-badge-indigo',  dot: 'bg-indigo-500' },
  message:      { label: 'Message',      badge: 'ui-badge-blue',    dot: 'bg-blue-500' },
};

const getTypeConfig = (type) => TYPE_CONFIG[type] || { label: type, badge: 'ui-badge-slate', dot: 'bg-slate-400' };

// ── Notification row icon ─────────────────────────────────────────────────────
const NotifIcon = ({ type }) => {
  const icons = {
    grade:        'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    attendance:   'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8l2 2 4-4',
    announcement: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z',
    message:      'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z',
    fee:          'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    system:       'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  };
  const bgMap = {
    grade: 'bg-emerald-50 text-emerald-600', attendance: 'bg-amber-50 text-amber-600',
    announcement: 'bg-violet-50 text-violet-600', message: 'bg-blue-50 text-blue-600',
    fee: 'bg-red-50 text-red-600', system: 'bg-indigo-50 text-indigo-600',
  };
  const path = icons[type] || 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
  const bg   = bgMap[type] || 'bg-slate-50 text-slate-500';
  return (
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
      </svg>
    </div>
  );
};

// ── Format relative time ──────────────────────────────────────────────────────
const formatTime = (dateStr) => {
  const d = new Date(dateStr);
  const diff = (Date.now() - d) / 1000;
  if (diff < 60)    return 'Just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ─────────────────────────────────────────────────────────────────────────────

const Notifications = () => {
  const navigate = useNavigate();
  const { setUnreadCount } = useNotifications();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [typeFilter, setTypeFilter]       = useState('');
  const [statusFilter, setStatusFilter]   = useState('all');
  const [page, setPage]                   = useState(1);
  const [totalPages, setTotalPages]       = useState(1);
  const [totalCount, setTotalCount]       = useState(0);
  const [selectedIds, setSelectedIds]     = useState([]);
  const [processing, setProcessing]       = useState(false);

  const PAGE_SIZE = 20;

  useEffect(() => { fetchNotifications(); }, [page, typeFilter, statusFilter]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (page !== 1) setPage(1);
      else fetchNotifications();
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const r = await api.get('/notifications/', {
        params: {
          search,
          notification_type: typeFilter || undefined,
          is_read: statusFilter === 'all' ? undefined : statusFilter === 'read',
          page,
          page_size: PAGE_SIZE,
        },
      });
      const data = r.data;
      setNotifications(Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []));
      const count = data.count || 0;
      setTotalCount(count);
      setTotalPages(Math.ceil(count / PAGE_SIZE) || 1);
    } catch {
      toast.error('Failed to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e) => {
    setSelectedIds(e.target.checked ? notifications.map(n => n.id) : []);
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const markRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/mark-read/`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      const r = await api.get('/notifications/unread-count/');
      setUnreadCount(r.data.unread_count);
    } catch { toast.error('Failed to mark as read'); }
  };

  const markAllRead = async () => {
    const result = await Swal.fire({
      title: 'Mark all as read?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, mark all read',
      confirmButtonColor: '#7c3aed',
      customClass: { popup: 'rounded-2xl' },
    });
    if (!result.isConfirmed) return;
    setProcessing(true);
    try {
      await api.post('/notifications/mark-all-read/');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch { toast.error('Failed to mark all as read'); }
    finally { setProcessing(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}/`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Notification deleted');
      const r = await api.get('/notifications/unread-count/');
      setUnreadCount(r.data.unread_count);
    } catch { toast.error('Failed to delete notification'); }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    const result = await Swal.fire({
      title: `Delete ${selectedIds.length} notification${selectedIds.length > 1 ? 's' : ''}?`,
      text: 'This cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#ef4444',
      customClass: { popup: 'rounded-2xl' },
    });
    if (!result.isConfirmed) return;
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/notifications/${id}/`)));
      setNotifications(prev => prev.filter(n => !selectedIds.includes(n.id)));
      setSelectedIds([]);
      toast.success('Deleted successfully');
    } catch { toast.error('Failed to delete some notifications'); }
  };

  const unreadInView = notifications.filter(n => !n.is_read).length;
  const allSelected  = notifications.length > 0 && selectedIds.length === notifications.length;

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {totalCount > 0 ? `${totalCount} total` : 'Your activity feed'}
            {unreadInView > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-black uppercase tracking-wider">
                {unreadInView} unread
              </span>
            )}
          </p>
        </div>
        <button
          onClick={markAllRead}
          disabled={processing || loading || unreadInView === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
        >
          <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Mark all read
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search notifications…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 focus:bg-white transition-all"
            />
          </div>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all"
          >
            <option value="">All Types</option>
            <option value="announcement">Announcements</option>
            <option value="grade">Grades</option>
            <option value="attendance">Attendance</option>
            <option value="message">Messages</option>
            <option value="fee">Fees</option>
            <option value="system">System</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all"
          >
            <option value="all">All Status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
        </div>

        {/* Bulk actions bar */}
        {selectedIds.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between animate-fade-in">
            <span className="text-xs font-bold text-slate-600">
              {selectedIds.length} selected
            </span>
            <button
              onClick={handleBulkDelete}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete selected
            </button>
          </div>
        )}
      </div>

      {/* ── Notification List ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

        {/* Table header (desktop) */}
        <div className="hidden md:flex items-center gap-4 px-5 py-3 bg-slate-50 border-b border-slate-200">
          <label className="flex items-center gap-2 cursor-pointer no-min">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={handleSelectAll}
              className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
            />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {allSelected ? 'Deselect all' : 'Select all'}
            </span>
          </label>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 px-5 py-4 animate-pulse">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-slate-100 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-700 mb-1">All caught up</h3>
            <p className="text-sm text-slate-400">No notifications match your current filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((n) => {
              const cfg       = getTypeConfig(n.notification_type);
              const isSelected = selectedIds.includes(n.id);

              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-4 px-5 py-4 transition-colors group
                    ${!n.is_read ? 'bg-violet-50/30' : 'hover:bg-slate-50'}
                    ${isSelected ? 'bg-violet-50' : ''}`}
                >
                  {/* Checkbox */}
                  <label className="flex-shrink-0 mt-0.5 cursor-pointer no-min">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectOne(n.id)}
                      className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                    />
                  </label>

                  {/* Icon */}
                  <NotifIcon type={n.notification_type} />

                  {/* Content */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => { if (n.link) navigate(n.link); if (!n.is_read) markRead(n.id); }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`ui-badge ${cfg.badge}`}>{cfg.label}</span>
                        {!n.is_read && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-600 text-white text-[9px] font-black uppercase tracking-wider">
                            New
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 flex-shrink-0 uppercase tracking-wider">
                        {formatTime(n.created_at)}
                      </span>
                    </div>
                    <p className={`text-sm leading-snug mb-0.5 ${!n.is_read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-500 line-clamp-2">{n.message}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!n.is_read && (
                      <button
                        onClick={() => markRead(n.id)}
                        title="Mark as read"
                        className="p-2 rounded-lg text-violet-500 hover:bg-violet-50 transition-all no-min"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(n.id)}
                      title="Delete"
                      className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all no-min"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/50">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
