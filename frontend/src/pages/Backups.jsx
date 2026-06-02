import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { LoadingSpinner, Button } from '../components/ui';

const Backups = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchBackups(); }, []);

  const fetchBackups = async () => {
    try {
      const r = await api.get('/admin/backups/');
      setBackups(r.data);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  };

  const handleCreateBackup = async () => {
    const result = await Swal.fire({
      title: 'Create new backup?',
      text: 'This may take a few minutes.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, create it',
      confirmButtonColor: '#7c3aed',
      customClass: { popup: 'rounded-2xl' },
    });
    if (!result.isConfirmed) return;
    setCreating(true);
    try {
      await api.post('/admin/backups/');
      toast.success('Backup created successfully');
      fetchBackups();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create backup');
    } finally { setCreating(false); }
  };

  const handleRestore = async (id) => {
    const result = await Swal.fire({
      title: 'Restore this backup?',
      text: 'This will overwrite all current data. This cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, restore',
      confirmButtonColor: '#ef4444',
      customClass: { popup: 'rounded-2xl' },
    });
    if (!result.isConfirmed) return;
    try {
      await api.post(`/admin/backups/${id}/restore/`);
      toast.success('Backup restored. Reloading…');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to restore backup');
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete this backup?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#ef4444',
      customClass: { popup: 'rounded-2xl' },
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/admin/backups/${id}/`);
      setBackups(prev => prev.filter(b => b.id !== id));
      toast.success('Backup deleted');
    } catch { toast.error('Failed to delete backup'); }
  };

  const handleDownload = async (id, filename) => {
    try {
      const r = await api.get(`/admin/backups/${id}/download/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a');
      a.href = url;
      a.setAttribute('download', filename);
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to download backup');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <LoadingSpinner />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading backups…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in page-bottom-safe">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Database Backups</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage and restore database snapshots.</p>
        </div>
        <Button
          onClick={handleCreateBackup}
          loading={creating}
          variant="primary"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Create Backup
        </Button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
        <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <p className="text-sm font-bold text-amber-800">Important</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Backups are SQL dumps of the entire database. Create backups before major changes.
            Restoring will overwrite all current data — this cannot be undone.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {backups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-700 mb-1">No backups yet</h3>
            <p className="text-sm text-slate-400">Create your first backup to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Filename</th>
                  <th className="px-5 py-3.5 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] whitespace-nowrap">Created At</th>
                  <th className="px-5 py-3.5 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Size</th>
                  <th className="px-5 py-3.5 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {backups.map((backup) => (
                  <tr key={backup.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                        </div>
                        <span className="text-sm font-bold text-slate-800 font-mono">{backup.filename}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600 whitespace-nowrap">
                      {new Date(backup.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {backup.size}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleDownload(backup.id, backup.filename)}
                          title="Download"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100 transition-all no-min"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download
                        </button>
                        <button
                          onClick={() => handleRestore(backup.id)}
                          title="Restore"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-bold hover:bg-emerald-100 transition-all no-min"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Restore
                        </button>
                        <button
                          onClick={() => handleDelete(backup.id)}
                          title="Delete"
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 no-min"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Backups;
