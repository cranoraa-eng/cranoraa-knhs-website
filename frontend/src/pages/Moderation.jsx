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
    <div className="space-y-6 animate-fade-in">
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
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="w-[15%] px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reporter</th>
                <th className="w-[30%] px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Message Content</th>
                <th className="w-[15%] px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sender</th>
                <th className="w-[20%] px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason</th>
                <th className="w-[10%] px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="w-[10%] px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto" />
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
                    <td className="px-6 py-4 truncate">
                      <span className="text-xs font-bold text-slate-700 block truncate" title={report.reporter_name}>{report.reporter_name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-600 line-clamp-3 break-words whitespace-pre-wrap" title={report.message_content}>
                        {report.message_content}
                      </p>
                    </td>
                    <td className="px-6 py-4 truncate">
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
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-500 italic line-clamp-3 break-words" title={report.reason}>
                        "{report.reason}"
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                        report.status === 'pending' ? 'bg-amber-100 text-amber-600' : 
                        report.status === 'dismissed' ? 'bg-slate-100 text-slate-500' :
                        'bg-emerald-100 text-emerald-600'
                      }`}>
                        {report.status}
                      </span>
                      {report.moderator_note && (
                        <p className="text-[9px] text-slate-400 mt-1 italic line-clamp-1" title={report.moderator_note}>
                          Note: {report.moderator_note}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
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
                            onClick={() => handleAction(report.id, 'mute-user', 'Mute User')}
                            className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Mute User (24h)"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                            </svg>
                          </button>
                          {report.sender_is_muted && (
                            <button
                              onClick={() => handleAction(report.id, 'unmute-user', 'Unmute User')}
                              className="p-2 text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors border border-violet-100"
                              title="Unmute User"
                            >
                              <div className="flex items-center gap-1 px-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                </svg>
                                <span className="text-[9px] font-black uppercase tracking-tighter">Unmute</span>
                              </div>
                            </button>
                          )}
                          <button
                            onClick={() => handleAction(report.id, 'suspend-user', 'Suspend User')}
                            className="p-2 text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Suspend User"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          </button>
                          {report.sender_is_suspended && (
                            <button
                              onClick={() => handleAction(report.id, 'unsuspend-user', 'Unsuspend User')}
                              className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-100"
                              title="Unsuspend User"
                            >
                              <div className="flex items-center gap-1 px-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-[9px] font-black uppercase tracking-tighter">Unsuspend</span>
                              </div>
                            </button>
                          )}
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
                          {report.sender_is_muted && (
                            <button
                              onClick={() => handleAction(report.id, 'unmute-user', 'Unmute User')}
                              className="px-3 py-1 bg-violet-50 text-violet-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-violet-100 transition-colors border border-violet-100 flex items-center gap-1"
                              title="Unmute User"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                              </svg>
                              Unmute
                            </button>
                          )}
                          {report.sender_is_suspended && (
                            <button
                              onClick={() => handleAction(report.id, 'unsuspend-user', 'Unsuspend User')}
                              className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-colors border border-emerald-100 flex items-center gap-1"
                              title="Unsuspend User"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Unsuspend
                            </button>
                          )}
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
