import { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [stats, setStats] = useState({ size_mb: 0, max_mb: 50, count: 0 });

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await api.get('/admin/audit-logs/');
      setLogs(response.data);
    } catch (error) {
      toast.error('Failed to load audit logs');
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

  const filteredLogs = useMemo(() => {
    return logs.filter(log =>
      log.action?.toLowerCase().includes(filter.toLowerCase()) ||
      log.user_name?.toLowerCase().includes(filter.toLowerCase()) ||
      log.description?.toLowerCase().includes(filter.toLowerCase()) ||
      log.model_name?.toLowerCase().includes(filter.toLowerCase())
    );
  }, [logs, filter]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredLogs.map(log => log.id));
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
        setLogs(prev => prev.filter(log => log.id !== id));
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
        setLogs(prev => prev.filter(log => !selectedIds.includes(log.id)));
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
        setLogs([]);
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
    switch (actionType?.toLowerCase()) {
      case 'create': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'update': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'delete': return 'bg-red-100 text-red-700 border-red-200';
      case 'login': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'approve': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'reject': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 mb-4"></div>
        <p className="text-gray-500 font-medium">Loading audit logs...</p>
      </div>
    );
  }

  return (
    <div className="p-1.5 md:p-8 space-y-2 md:space-y-6 max-w-full overflow-x-hidden min-h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4 min-w-0">
        <div className="min-w-0">
          <h1 className="text-base md:text-3xl font-black text-gray-800 tracking-tight truncate uppercase">Audit Logs</h1>
          <p className="text-gray-500 text-[8px] md:text-sm font-medium mt-0.5 truncate uppercase tracking-widest">System Activities</p>
          
          <div className="mt-1 flex items-center gap-2 md:gap-4 min-w-0">
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5 min-w-0">
                <span className="text-[7px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest shrink-0">Storage</span>
                <span className={`text-[7px] md:text-[10px] font-bold px-1 py-0 rounded shrink-0 ${
                  (stats.size_mb / stats.max_mb) > 0.8 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {stats.size_mb}MB / {stats.max_mb}MB
                </span>
              </div>
              <div className="w-24 md:w-48 h-0.5 md:h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200 shrink-0">
                <div 
                  className={`h-full transition-all duration-500 ${
                    (stats.size_mb / stats.max_mb) > 0.8 ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min((stats.size_mb / stats.max_mb) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 shrink-0">
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={deleting}
              className="flex-1 md:flex-none flex items-center justify-center gap-1 bg-red-50 text-red-600 hover:bg-red-100 font-bold py-1 md:py-2.5 px-2 md:px-5 rounded-lg md:rounded-xl transition-all border border-red-100 active:scale-95 text-[9px] md:text-base whitespace-nowrap"
            >
              <svg className="w-3 h-3 md:w-3.5 md:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              DEL ({selectedIds.length})
            </button>
          )}
          
          <button
            onClick={handleClearAll}
            disabled={deleting || logs.length === 0}
            className="flex-1 md:flex-none flex items-center justify-center gap-1 bg-white text-gray-700 hover:bg-gray-50 font-bold py-1 md:py-2.5 px-2 md:px-5 rounded-lg md:rounded-xl transition-all border border-gray-200 shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-[9px] md:text-base whitespace-nowrap"
          >
            <svg className="w-3 h-3 md:w-3.5 md:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            CLEAR ALL
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg md:rounded-2xl shadow-sm overflow-hidden min-w-0">
        <div className="p-1.5 md:p-4 border-b border-gray-100 bg-gray-50/50 min-w-0">
          <div className="relative group max-w-md min-w-0">
            <svg className="absolute left-2.5 md:left-4 top-1/2 -translate-y-1/2 w-3 h-3 md:w-3.5 md:h-3.5 text-gray-400 group-focus-within:text-purple-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Filter activities..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-7 md:pl-11 pr-3 md:pr-4 py-1 md:py-2.5 bg-white border border-gray-200 rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-[9px] md:text-sm font-bold transition-all shadow-inner uppercase tracking-wider"
            />
          </div>
        </div>
        
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 md:py-20 text-gray-400">
            <svg className="w-10 h-10 md:w-16 md:h-16 mb-2 md:mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm md:text-lg font-bold">No results</p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            <table className="w-full min-w-[500px] md:min-w-full text-[8px] md:text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 uppercase text-[7px] md:text-[10px] font-black tracking-widest border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="px-2 py-1.5 md:px-6 md:py-4 w-6 md:w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredLogs.length && filteredLogs.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-2.5 h-2.5 md:w-4 md:h-4 cursor-pointer"
                    />
                  </th>
                  <th className="px-2 py-1.5 md:px-6 md:py-4">TIME</th>
                  <th className="px-2 py-1.5 md:px-6 md:py-4">USER</th>
                  <th className="px-2 py-1.5 md:px-6 md:py-4">ACTION</th>
                  <th className="px-2 py-1.5 md:px-6 md:py-4">DESC</th>
                  <th className="hidden md:table-cell px-2 py-1.5 md:px-6 md:py-4">MODEL</th>
                  <th className="hidden md:table-cell px-2 py-1.5 md:px-6 md:py-4">IP</th>
                  <th className="px-2 py-1.5 md:px-6 md:py-4 text-center">OPT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className={`group hover:bg-purple-50/50 transition-colors ${selectedIds.includes(log.id) ? 'bg-purple-50/30' : ''}`}>
                    <td className="px-2 py-1 md:px-6 md:py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(log.id)}
                        onChange={() => handleSelectLog(log.id)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-2.5 h-2.5 md:w-4 md:h-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-2 py-1 md:px-6 md:py-4 font-medium text-gray-500 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                        <span className="text-[7px] md:text-[10px] font-bold text-gray-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </td>
                    <td className="px-2 py-1 md:px-6 md:py-4">
                      <div className="flex items-center gap-1 md:gap-2">
                        <div className="w-4 h-4 md:w-7 md:h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-[7px] md:text-[10px] flex-shrink-0">
                          {log.user_name?.charAt(0).toUpperCase() || 'S'}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-gray-800 truncate text-[8px] md:text-sm uppercase tracking-tighter">{log.user_name}</span>
                          <span className="text-[7px] md:text-[10px] text-gray-400 truncate tracking-tight">{log.user_email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-1 md:px-6 md:py-4">
                      <span className={`px-1 py-0.5 md:px-2.5 md:py-1 rounded-md md:rounded-lg border text-[6px] md:text-[10px] font-black uppercase tracking-wider ${getActionColor(log.action_type || log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-2 py-1 md:px-6 md:py-4 font-medium text-gray-600 max-w-[60px] md:max-w-xs truncate text-[8px] md:text-sm" title={log.description}>
                      {log.description}
                    </td>
                    <td className="hidden md:table-cell px-2 py-1 md:px-6 md:py-4">
                      <span className="text-[6px] md:text-[10px] font-black text-gray-400 bg-gray-100 px-1 py-0.5 rounded-full uppercase tracking-widest">
                        {log.model_name || 'Sys'}
                      </span>
                    </td>
                    <td className="hidden md:table-cell px-2 py-1 md:px-6 md:py-4 font-mono text-[7px] md:text-xs text-gray-400">
                      {log.ip_address || '—'}
                    </td>
                    <td className="px-2 py-1 md:px-6 md:py-4 text-center">
                      <button
                        onClick={() => handleDelete(log.id)}
                        className="p-1 md:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all md:opacity-0 md:group-hover:opacity-100"
                        title="Delete"
                      >
                        <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {!loading && logs.length > 0 && (
        <div className="flex items-center justify-between text-[7px] md:text-xs font-bold text-gray-400 uppercase tracking-widest px-1 md:px-2">
          <span>{filteredLogs.length} of {logs.length} entries</span>
          {selectedIds.length > 0 && (
            <span className="text-purple-600">{selectedIds.length} selected</span>
          )}
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
