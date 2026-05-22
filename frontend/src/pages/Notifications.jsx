import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
  const navigate = useNavigate();
  const { setUnreadCount } = useNotifications();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [page, typeFilter, statusFilter]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (page !== 1) setPage(1);
      else fetchNotifications();
    }, 500);
    return () => clearTimeout(t);
  }, [search]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/notifications/', {
        params: {
          search: search,
          notification_type: typeFilter,
          is_read: statusFilter === 'all' ? undefined : (statusFilter === 'read'),
          page: page,
          page_size: 50
        }
      });
      const data = response.data;
      setNotifications(Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []));
      setTotalPages(Math.ceil((data.count || 0) / 50) || 1);
    } catch (error) {
      toast.error('Failed to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked && Array.isArray(notifications)) {
      setSelectedIds(notifications.map(n => n.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const markRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/mark_read/`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      const countRes = await api.get('/notifications/unread_count/');
      setUnreadCount(countRes.data.unread_count);
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const markAllRead = async () => {
    const result = await Swal.fire({
      title: 'Mark all as read?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, mark all read',
      confirmButtonColor: '#9333ea',
    });

    if (result.isConfirmed) {
      setProcessing(true);
      try {
        await api.post('/notifications/mark_all_read/');
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
        toast.success('All notifications marked as read');
      } catch (error) {
        toast.error('Failed to mark all as read');
      } finally {
        setProcessing(false);
      }
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}/`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Notification deleted');
      const countRes = await api.get('/notifications/unread_count/');
      setUnreadCount(countRes.data.unread_count);
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'announcement': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'grade':        return 'bg-green-100 text-green-700 border-green-200';
      case 'attendance':   return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'fee':          return 'bg-red-100 text-red-700 border-red-200';
      case 'system':       return 'bg-purple-100 text-purple-700 border-purple-200';
      default:             return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="p-1 md:p-4 space-y-1.5 md:space-y-4 max-w-full overflow-x-hidden min-h-full bg-gray-50/30">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-1.5 md:gap-4 min-w-0">
        <div className="min-w-0">
          <h1 className="text-sm md:text-2xl font-black text-gray-800 tracking-tight truncate uppercase">Notification Center</h1>
          <p className="text-gray-500 text-[7px] md:text-[10px] font-bold mt-0.5 truncate uppercase tracking-widest">Audit trail of your activities and alerts</p>
        </div>
        
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={markAllRead}
            disabled={processing || loading}
            className="flex-1 md:flex-none flex items-center justify-center gap-1 bg-white text-gray-700 hover:bg-gray-50 font-black py-1 md:py-1.5 px-2 md:px-4 rounded md:rounded-lg transition-all border border-gray-200 shadow-sm active:scale-95 disabled:opacity-50 text-[8px] md:text-xs whitespace-nowrap uppercase tracking-widest"
          >
            Mark All Read
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg md:rounded-xl shadow-sm overflow-hidden min-w-0">
        <div className="p-1 md:p-2 border-b border-gray-100 bg-gray-50/50 min-w-0">
          <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-stretch md:items-center min-w-0">
            <div className="relative flex-1 min-w-0">
              <input
                type="text"
                placeholder="Search notifications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 md:pl-10 pr-4 py-1.5 md:py-2.5 bg-white border border-gray-200 rounded md:rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-[8px] md:text-xs font-black placeholder:text-gray-300 shadow-sm transition-all uppercase tracking-widest"
              />
              <svg className="absolute left-2.5 md:left-4 top-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="flex gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-white border border-gray-200 rounded md:rounded-xl px-2 md:px-4 py-1.5 md:py-2.5 text-[8px] md:text-xs font-black focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm transition-all uppercase tracking-widest min-w-[80px]"
              >
                <option value="">All Types</option>
                <option value="announcement">Announcements</option>
                <option value="grade">Grades</option>
                <option value="attendance">Attendance</option>
                <option value="system">System</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-gray-200 rounded md:rounded-xl px-2 md:px-4 py-1.5 md:py-2.5 text-[8px] md:text-xs font-black focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm transition-all uppercase tracking-widest min-w-[80px]"
              >
                <option value="all">All Status</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">Syncing notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <svg className="w-12 h-12 mb-2 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-xs font-bold uppercase tracking-widest">No notifications found</p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200">
            <table className="w-full min-w-[600px] text-[7px] md:text-[11px] text-left table-fixed">
              <thead className="bg-[#2D1B4D] text-white uppercase text-[6px] md:text-[9px] font-black tracking-widest sticky top-0">
                <tr>
                  <th className="px-4 py-2.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={notifications.length > 0 && selectedIds.length === notifications.length}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-3 h-3 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-2.5 w-24">TYPE</th>
                  <th className="px-4 py-2.5 w-40">TITLE</th>
                  <th className="px-4 py-2.5">MESSAGE</th>
                  <th className="px-4 py-2.5 w-32">TIME</th>
                  <th className="px-4 py-2.5 w-24 text-center">STATUS</th>
                  <th className="px-4 py-2.5 w-20 text-center">OPT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {notifications.map((n) => (
                  <tr key={n.id} className={`group hover:bg-purple-50 transition-colors ${!n.is_read ? 'bg-violet-50/40 font-semibold' : ''}`}>
                    <td className="px-4 py-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(n.id)}
                        onChange={() => handleSelectOne(n.id)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-3 h-3 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full border text-[7px] md:text-[9px] font-black uppercase tracking-widest ${getTypeColor(n.notification_type)}`}>
                        {n.notification_type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 truncate font-bold text-gray-800" title={n.title}>
                      {n.title}
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="line-clamp-1 text-gray-600 group-hover:line-clamp-3 transition-all cursor-pointer" 
                         onClick={() => { if(n.link) navigate(n.link); }} title={n.message}>
                        {n.message}
                      </p>
                    </td>
                    <td className="px-4 py-2.5 text-gray-400 font-medium">
                      {new Date(n.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[7px] md:text-[8px] font-black uppercase tracking-tighter ${
                        n.is_read ? 'text-gray-400' : 'bg-violet-600 text-white'
                      }`}>
                        {n.is_read ? 'READ' : 'NEW'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!n.is_read && (
                          <button onClick={() => markRead(n.id)} className="p-1 text-violet-600 hover:bg-violet-100 rounded transition-colors" title="Mark Read">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                          </button>
                        )}
                        <button onClick={() => handleDelete(n.id)} className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors" title="Delete">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-2 md:p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 bg-white border border-gray-200 rounded text-[10px] font-black uppercase tracking-widest disabled:opacity-50 hover:bg-gray-50 transition-all"
            >
              Prev
            </button>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 bg-white border border-gray-200 rounded text-[10px] font-black uppercase tracking-widest disabled:opacity-50 hover:bg-gray-50 transition-all"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
