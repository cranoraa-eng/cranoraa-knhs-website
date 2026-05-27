import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const Moderation = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await api.get('/chat/reports/', {
        params: { status: filter === 'all' ? undefined : filter }
      });
      const data = response.data;
      // Handle both DRF paginated and non-paginated responses
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
    const isDestructive = actionType === 'delete-message' || actionType === 'suspend-user';
    
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
        await api.post(`/chat/reports/${reportId}/${actionType}/`, { note });
        toast.success('Action applied successfully');
        fetchReports();
      } catch (error) {
        toast.error('Failed to apply action');
      }
    }
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

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Mobile View: Card List */}
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
              <div key={report.id} className="p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Reporter</span>
                    <span className="text-xs font-bold text-slate-700">{report.reporter_name}</span>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                      report.status === 'pending' ? 'bg-amber-100 text-amber-600' : 
                      report.status === 'dismissed' ? 'bg-slate-100 text-slate-500' :
                      'bg-emerald-100 text-emerald-600'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Message Content</span>
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap">
                    {report.message_content}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Sender</span>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-700">@{report.message_sender}</span>
                      {report.sender_is_muted && (
                        <span className="inline-flex items-center gap-1 mt-1 text-[7px] font-black text-amber-600 uppercase tracking-widest">
                          Muted
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Reason</span>
                    <p className="text-xs text-slate-500 italic">"{report.reason}"</p>
                  </div>
                </div>

                {report.moderator_note && (
                  <div className="bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                    <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest block mb-0.5">Moderator Note</span>
                    <p className="text-[10px] text-blue-600 italic">"{report.moderator_note}"</p>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-50">
                  {report.status === 'pending' ? (
                    <>
                      <button onClick={() => handleAction(report.id, 'resolve', 'Resolve Report')} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl transition-all active:scale-95"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg></button>
                      <button onClick={() => handleAction(report.id, 'delete-message', 'Delete Message')} className="p-2.5 bg-red-50 text-red-600 rounded-xl transition-all active:scale-95"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      <button onClick={() => handleMute(report.id)} className="p-2.5 bg-amber-50 text-amber-600 rounded-xl transition-all active:scale-95"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg></button>
                      <button onClick={() => handleAction(report.id, 'dismiss', 'Dismiss Report')} className="p-2.5 bg-slate-100 text-slate-500 rounded-xl transition-all active:scale-95"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Handled by {report.resolved_by_name || 'Admin'}</span>
                    </div>
                  )}
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
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="w-10 h-10 rounded-full border-2 border-slate-100 border-t-violet-600 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                    No reports found
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50 transition-colors">
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
                            <span className="text-[10px] font-black text-slate-600 truncate max-w-[80px]" title={report.resolved_by_name}>
                              {report.resolved_by_name || 'Admin'}
                            </span>
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
