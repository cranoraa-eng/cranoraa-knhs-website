import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const Moderation = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedIds, setSelectedIds] = useState([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchReports();
    setSelectedIds([]);
  }, [filter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await api.get('/chat/reports/', {
        params: { status: filter === 'all' ? undefined : filter }
      });
      const data = response.data;
      const reportList = Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);
      setReports(reportList);
    } catch (error) {
      toast.error('Failed to load reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (reportId, actionType, label) => {
    const isDestructive = actionType === 'delete-message' || actionType === 'suspend-user' || actionType === 'delete';
    
    if (actionType === 'delete') {
      const result = await Swal.fire({
        title: 'Delete Report?',
        text: 'This will permanently remove the report record.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete',
        confirmButtonColor: '#ef4444',
        customClass: { popup: 'rounded-[2rem]' }
      });
      if (!result.isConfirmed) return;
      
      try {
        setProcessing(true);
        await api.delete(`/chat/reports/${reportId}/`);
        toast.success('Report deleted');
        fetchReports();
      } catch {
        toast.error('Failed to delete report');
      } finally {
        setProcessing(false);
      }
      return;
    }

    const { value: note } = await Swal.fire({
      title: label,
      input: 'textarea',
      inputLabel: 'Moderator Note (Optional)',
      inputPlaceholder: 'Reason for this action...',
      showCancelButton: true,
      confirmButtonText: 'Confirm',
      confirmButtonColor: isDestructive ? '#ef4444' : '#6366f1',
      customClass: {
        popup: 'rounded-[2rem]',
        input: 'text-sm'
      }
    });

    if (note !== undefined) {
      try {
        setProcessing(true);
        await api.post(`/chat/reports/${reportId}/${actionType}/`, { note });
        toast.success('Action applied successfully');
        fetchReports();
      } catch (error) {
        toast.error('Failed to apply action');
      } finally {
        setProcessing(false);
      }
    }
  };

  const handleBulkDelete = async () => {
    const result = await Swal.fire({
      title: `Delete ${selectedIds.length} reports?`,
      text: "This action cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete all',
      confirmButtonColor: '#ef4444',
      customClass: { popup: 'rounded-[2rem]' }
    });

    if (result.isConfirmed) {
      try {
        setProcessing(true);
        await api.post('/chat/reports/bulk-delete/', { ids: selectedIds });
        toast.success(`${selectedIds.length} reports deleted`);
        setSelectedIds([]);
        fetchReports();
      } catch {
        toast.error('Failed to delete reports');
      } finally {
        setProcessing(false);
      }
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === reports.length) setSelectedIds([]);
    else setSelectedIds(reports.map(r => r.id));
  };

  const handleMute = async (reportId) => {
    const { value: formValues } = await Swal.fire({
      title: 'Mute User',
      html:
        '<div class="flex flex-col gap-4 p-2">' +
        '<div class="text-left"><label class="text-[10px] font-black uppercase text-slate-400">Duration (Hours)</label>' +
        '<input id="mute-hours" class="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" value="24" type="number"></div>' +
        '<div class="text-left"><label class="text-[10px] font-black uppercase text-slate-400">Moderator Note</label>' +
        '<textarea id="mute-note" class="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm min-h-[100px]" placeholder="Reason for muting..."></textarea></div>' +
        '</div>',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Mute User',
      confirmButtonColor: '#f59e0b',
      customClass: {
        popup: 'rounded-[2rem]',
      },
      preConfirm: () => {
        return {
          hours: document.getElementById('mute-hours').value,
          note: document.getElementById('mute-note').value
        }
      }
    });

    if (formValues) {
      try {
        await api.post(`/chat/reports/${reportId}/mute-user/`, formValues);
        toast.success('User muted successfully');
        fetchReports();
      } catch (error) {
        toast.error('Failed to mute user');
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in page-bottom-safe">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Message Moderation</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Review and manage reported messages</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={processing}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100 shadow-sm animate-in slide-in-from-right-4"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Delete {selectedIds.length}
            </button>
          )}
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            {['pending', 'resolved', 'all'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  filter === f ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Mobile View: Compact Card List */}
        <div className="md:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="px-6 py-12 text-center">
              <div className="w-10 h-10 rounded-full border-2 border-slate-100 border-t-violet-600 animate-spin mx-auto" />
            </div>
          ) : reports.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
              No reports found
            </div>
          ) : (
            reports.map((report) => (
              <div key={report.id} className={`p-3 space-y-2 transition-colors ${selectedIds.includes(report.id) ? 'bg-violet-50/50' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(report.id)}
                      onChange={() => toggleSelect(report.id)}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                    />
                    <span className="text-[10px] font-black text-slate-700 truncate max-w-[100px]">{report.reporter_name}</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">reported</span>
                    <span className="text-[10px] font-black text-violet-600 truncate max-w-[80px]">@{report.message_sender}</span>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest ${
                    report.status === 'pending' ? 'bg-amber-100 text-amber-600' : 
                    report.status === 'dismissed' ? 'bg-slate-100 text-slate-500' :
                    'bg-emerald-100 text-emerald-600'
                  }`}>
                    {report.status}
                  </span>
                </div>

                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <p className="text-[10px] text-slate-600 line-clamp-2 leading-relaxed italic">
                    "{report.message_content}"
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] text-slate-500 italic truncate" title={report.reason}>
                      Reason: {report.reason}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {report.status === 'pending' ? (
                      <>
                        <button onClick={() => handleAction(report.id, 'resolve', 'Resolve')} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg active:scale-95"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></button>
                        <button onClick={() => handleAction(report.id, 'delete-message', 'Delete Message')} className="p-1.5 bg-rose-50 text-rose-600 rounded-lg active:scale-95" title="Delete Message"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        <button onClick={() => handleMute(report.id)} className="p-1.5 bg-amber-50 text-amber-600 rounded-lg active:scale-95"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg></button>
                        <button onClick={() => handleAction(report.id, 'dismiss', 'Dismiss')} className="p-1.5 bg-slate-100 text-slate-500 rounded-lg active:scale-95"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
                      </>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleAction(report.id, 'delete', 'Delete Record')} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Delete Report Record"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Done by {report.resolved_by_name?.split(' ')[0] || 'Admin'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 w-10">
                  <input
                    type="checkbox"
                    checked={reports.length > 0 && selectedIds.length === reports.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                  />
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reporter</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Message Content</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sender</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="w-10 h-10 rounded-full border-2 border-slate-100 border-t-violet-600 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                    No reports found
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.includes(report.id) ? 'bg-violet-50/30' : ''}`}>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(report.id)}
                        onChange={() => toggleSelect(report.id)}
                        className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-700 block truncate max-w-[120px]" title={report.reporter_name}>{report.reporter_name}</span>
                    </td>
                    <td className="px-6 py-4 max-w-md">
                      <p className="text-xs text-slate-600 line-clamp-3 break-words whitespace-pre-wrap" title={report.message_content}>
                        {report.message_content}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700 block truncate" title={`@${report.message_sender}`}>@{report.message_sender}</span>
                        {report.sender_is_muted && (
                          <span className="inline-flex items-center gap-1 mt-1 text-[8px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100 w-fit">
                            <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse"></span>
                            Currently Muted
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="text-xs text-slate-500 italic line-clamp-3 break-words" title={report.reason}>
                        "{report.reason}"
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                        report.status === 'pending' ? 'bg-amber-100 text-amber-600' : 
                        report.status === 'dismissed' ? 'bg-slate-100 text-slate-500' :
                        'bg-emerald-100 text-emerald-600'
                      }`}>
                        {report.status}
                      </span>
                      {report.moderator_note && (
                        <p className="text-[9px] text-slate-400 mt-1 italic line-clamp-1 max-w-[100px]" title={report.moderator_note}>
                          Note: {report.moderator_note}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {report.status === 'pending' ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleAction(report.id, 'resolve', 'Resolve Report')}
                            className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Mark as Resolved"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleAction(report.id, 'delete-message', 'Delete Message')}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Message & Resolve"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleMute(report.id)}
                            className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Mute User (24h)"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleAction(report.id, 'dismiss', 'Dismiss Report')}
                            className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Dismiss (No Action)"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Resolved by</span>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-black text-slate-600 truncate max-w-[80px]" title={report.resolved_by_name}>
                                {report.resolved_by_name || 'Admin'}
                              </span>
                              <button
                                onClick={() => handleAction(report.id, 'delete', 'Delete Record')}
                                className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                                title="Delete Report Record"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Moderation;
