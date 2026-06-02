import { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { LoadingSpinner, EmptyState } from '../components/ui';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [stats, setStats] = useState({ size_mb: 0, max_mb: 50, count: 0 });

  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [page, actionFilter]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      if (page !== 1) setPage(1);
      else fetchLogs();
    }, 500);
    return () => clearTimeout(t);
  }, [search]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/audit-logs/', {
        params: {
          search: search,
          action: actionFilter,
          page: page,
          page_size: 50
        }
      });
      const data = response.data;
      setLogs(Array.isArray(data.results) ? data.results : []);
      setTotalCount(data.count || 0);
      setTotalPages(Math.ceil((data.count || 0) / 50) || 1);
    } catch (error) {
      toast.error('Failed to load audit logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/audit-logs/stats/');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch audit stats');
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked && Array.isArray(logs)) {
      setSelectedIds(logs.map(log => log.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectLog = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/admin/audit-logs/${id}/`);
        toast.success('Log entry deleted');
        fetchLogs();
        setSelectedIds(prev => prev.filter(i => i !== id));
        fetchStats();
      } catch (error) {
        toast.error('Failed to delete log entry');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    const result = await Swal.fire({
      title: `Delete ${selectedIds.length} entries?`,
      text: "This action cannot be undone!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete them!'
    });

    if (result.isConfirmed) {
      setDeleting(true);
      try {
        await api.post('/admin/audit-logs/bulk_delete/', { ids: selectedIds });
        toast.success(`${selectedIds.length} log entries deleted`);
        fetchLogs();
        setSelectedIds([]);
        fetchStats();
      } catch (error) {
        toast.error('Failed to delete log entries');
      } finally {
        setDeleting(false);
      }
    }
  };

  const handleClearAll = async () => {
    const result = await Swal.fire({
      title: 'Clear all logs?',
      text: "This will permanently delete ALL audit log entries!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, clear all!'
    });

    if (result.isConfirmed) {
      setDeleting(true);
      try {
        await api.post('/admin/audit-logs/clear_all/');
        toast.success('All audit logs cleared');
        fetchLogs();
        setSelectedIds([]);
        fetchStats();
      } catch (error) {
        toast.error('Failed to clear logs');
      } finally {
        setDeleting(false);
      }
    }
  };

  const getActionColor = (actionType) => {
    const type = actionType?.toLowerCase() || '';
    if (type.includes('create') || type.includes('mark')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (type.includes('update') || type.includes('edit')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (type.includes('delete') || type.includes('clear')) return 'bg-red-100 text-red-700 border-red-200';
    if (type.includes('login') || type.includes('auth')) return 'bg-violet-100 text-violet-700 border-violet-200';
    if (type.includes('approve')) return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    if (type.includes('reject') || type.includes('suspend') || type.includes('mute')) return 'bg-orange-100 text-orange-700 border-orange-200';
    if (type.includes('export') || type.includes('import')) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <LoadingSpinner />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading audit logs…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in page-bottom-safe">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Audit Logs</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <p className="text-sm text-slate-500">{totalCount} total entries</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              (stats.size_mb / stats.max_mb) > 0.8 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
            }`}>{stats.size_mb}MB / {stats.max_mb}MB</span>
            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${
                (stats.size_mb / stats.max_mb) > 0.8 ? 'bg-red-500' : 'bg-blue-500'
              }`} style={{ width: `${Math.min((stats.size_mb / stats.max_mb) * 100, 100)}%` }} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {selectedIds.length > 0 && (
            <button onClick={handleBulkDelete} disabled={deleting}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200 text-sm font-bold hover:bg-red-100 transition-all disabled:opacity-50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete ({selectedIds.length})
            </button>
          )}
          <button onClick={handleClearAll} disabled={deleting || !logs || logs.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-40 shadow-sm">
            Clear all
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Search by user, model, or description…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 focus:bg-white transition-all" />
          </div>
          <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all">
            <option value="">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="login">Login</option>
            <option value="grade_create">Grade Create</option>
            <option value="attendance_mark">Attendance Mark</option>
          </select>
        </div>
      </div>
        
      {/* ── Table / Card List ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-700 mb-1">No log entries</h3>
            <p className="text-sm text-slate-400">System activity will appear here.</p>
          </div>
        ) : (
          <>
            {/* ── Mobile card list (< md) ── */}
            <div className="md:hidden divide-y divide-slate-100">
              {/* Select-all bar */}
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer no-min">
                  <input type="checkbox"
                    checked={logs.length > 0 && selectedIds.length === logs.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    {selectedIds.length > 0 ? `${selectedIds.length} selected` : 'Select all'}
                  </span>
                </label>
              </div>

              {logs.map((log) => (
                <div key={log.id}
                  className={`px-4 py-3.5 transition-colors ${selectedIds.includes(log.id) ? 'bg-violet-50/40' : ''}`}>
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <label className="flex-shrink-0 mt-0.5 cursor-pointer no-min">
                      <input type="checkbox"
                        checked={selectedIds.includes(log.id)}
                        onChange={() => handleSelectLog(log.id)}
                        className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer" />
                    </label>

                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-violet-700 font-black text-xs flex-shrink-0">
                      {log.user_name?.charAt(0).toUpperCase() || 'S'}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Top row: user + time */}
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-sm font-bold text-slate-800 truncate">{log.user_name}</p>
                        <p className="text-[10px] font-bold text-slate-400 flex-shrink-0">
                          {new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          {' · '}
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      {/* Action badge + model */}
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getActionColor(log.action_type || log.action)}`}>
                          {log.action}
                        </span>
                        {log.model_name && (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 uppercase tracking-wider">
                            {log.model_name}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{log.description}</p>
                    </div>

                    {/* Delete button */}
                    <button onClick={() => handleDelete(log.id)}
                      className="flex-shrink-0 p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all no-min" title="Delete">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Desktop table (md+) ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-5 py-3.5 w-10">
                      <input type="checkbox" checked={logs?.length > 0 && selectedIds.length === logs.length}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer" />
                    </th>
                    <th className="px-5 py-3.5 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] whitespace-nowrap">Time</th>
                    <th className="px-5 py-3.5 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] whitespace-nowrap">User</th>
                    <th className="px-5 py-3.5 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] whitespace-nowrap">Action</th>
                    <th className="px-5 py-3.5 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Description</th>
                    <th className="px-5 py-3.5 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] whitespace-nowrap">Model</th>
                    <th className="px-5 py-3.5 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <tr key={log.id} className={`group hover:bg-violet-50/40 transition-colors ${selectedIds.includes(log.id) ? 'bg-violet-50/30' : ''}`}>
                      <td className="px-5 py-3.5">
                        <input type="checkbox" checked={selectedIds.includes(log.id)}
                          onChange={() => handleSelectLog(log.id)}
                          className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer" />
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <p className="text-xs font-bold text-slate-700">{new Date(log.timestamp).toLocaleDateString()}</p>
                        <p className="text-[10px] font-bold text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center text-violet-700 font-black text-[10px] flex-shrink-0">
                            {log.user_name?.charAt(0).toUpperCase() || 'S'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{log.user_name}</p>
                            <p className="text-[10px] text-slate-400 truncate">{log.user_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getActionColor(log.action_type || log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-600 max-w-xs truncate" title={log.description}>
                        {log.description}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200 uppercase tracking-wider">
                          {log.model_name || 'System'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button onClick={() => handleDelete(log.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 no-min" title="Delete">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination */}
        {!loading && logs.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3.5 border-t border-slate-100 bg-slate-50/50 gap-3 flex-wrap">
            <span className="text-xs font-bold text-slate-500">
              Page {page} of {totalPages}
              <span className="hidden sm:inline"> · {totalCount} entries</span>
              {selectedIds.length > 0 && <span className="ml-2 text-violet-600">{selectedIds.length} selected</span>}
            </span>
            <div className="flex items-center gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                <span className="hidden sm:inline">Previous</span>
              </button>
              <span className="text-xs font-bold text-slate-500 px-1">{page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                <span className="hidden sm:inline">Next</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
