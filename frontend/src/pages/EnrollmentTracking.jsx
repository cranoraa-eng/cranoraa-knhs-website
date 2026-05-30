import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../utils/api';

const STATUS_CONFIG = {
  pending: { icon: '\u23F3', color: 'bg-amber-500', label: 'Pending', desc: 'Your application is awaiting review' },
  under_review: { icon: '\uD83D\uDD0D', color: 'bg-blue-500', label: 'Under Review', desc: 'Your application is being evaluated' },
  pending_requirements: { icon: '\uD83D\uDCCB', color: 'bg-orange-500', label: 'Pending Requirements', desc: 'Additional documents requested' },
  approved: { icon: '\u2705', color: 'bg-emerald-500', label: 'Approved', desc: 'Your application has been approved' },
  rejected: { icon: '\u274C', color: 'bg-rose-500', label: 'Rejected', desc: 'Your application was not approved' },
  enrolled: { icon: '\uD83C\uDF93', color: 'bg-violet-500', label: 'Enrolled', desc: 'You are officially enrolled!' },
};

const TIMELINE_STEPS = [
  { key: 'pending', label: 'Submitted' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'pending_requirements', label: 'Requirements Verified' },
  { key: 'approved', label: 'Approved' },
  { key: 'enrolled', label: 'Enrolled' },
];

const stepIndex = (status) => {
  if (status === 'rejected') return -1;
  const idx = TIMELINE_STEPS.findIndex(s => s.key === status);
  return idx >= 0 ? idx : 0;
};

const EnrollmentTracking = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [number, setNumber] = useState(searchParams.get('number') || '');
  const [email, setEmail] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!number && !email) { setError('Enter an enrollment number or email'); return; }
    setLoading(true);
    setError('');
    setData(null);
    try {
      const params = new URLSearchParams();
      if (number) params.set('number', number);
      else params.set('email', email);
      const res = await api.get(`/enrollment-applications/track/?${params}`);
      setData(res.data);
    } catch (err) {
      if (err.response?.status === 404) setError('No application found. Check your enrollment number or email.');
      else setError('Failed to load. Try again later.');
    } finally { setLoading(false); }
  };

  const cfg = data ? STATUS_CONFIG[data.status] : null;
  const currentIdx = data ? stepIndex(data.status) : -1;

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-lg mx-auto px-4">
        <div className="text-center mb-8">
          <Link to="/" className="text-xs font-bold text-violet-600 hover:text-violet-800 mb-3 inline-block">
            &larr; Back to Home
          </Link>
          <h1 className="text-3xl font-black text-slate-900 mb-1">Track Application</h1>
          <p className="text-sm text-slate-500">Check your enrollment status</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
          <form onSubmit={handleTrack} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Enrollment Number</label>
              <input value={number} onChange={e => setNumber(e.target.value)}
                placeholder="e.g. ENR-2026-000001"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500" />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-slate-200" />
              <span className="text-xs text-slate-400 font-bold uppercase">or</span>
              <div className="flex-1 border-t border-slate-200" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 disabled:opacity-50 transition-colors">
              {loading ? 'Searching...' : 'Track Application'}
            </button>
          </form>
          {error && (
            <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-100">
              <p className="text-sm font-medium text-rose-700">{error}</p>
            </div>
          )}
        </div>

        {data && cfg && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enrollment Number</p>
                  <p className="text-lg font-black text-slate-900">{data.enrollment_number}</p>
                </div>
                <div className={`px-3 py-1.5 rounded-xl text-xs font-bold ${cfg.color} text-white`}>
                  {cfg.label}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Applicant</p>
                  <p className="font-semibold text-slate-800">{data.full_name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Grade Level</p>
                  <p className="font-semibold text-slate-800">Grade {data.grade_level}{data.strand ? ` - ${data.strand}` : ''}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Submitted</p>
                  <p className="font-semibold text-slate-800">{new Date(data.submitted_at).toLocaleDateString()}</p>
                </div>
                {data.assigned_classroom && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Section</p>
                    <p className="font-semibold text-slate-800">{data.assigned_classroom}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-5">Progress Timeline</p>
              {data.status === 'rejected' ? (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 border border-rose-100">
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-rose-800">Application Rejected</p>
                    <p className="text-xs text-rose-600">{data.remarks || 'Your application was not approved.'}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-0">
                  {TIMELINE_STEPS.map((step, i) => {
                    const isDone = i <= currentIdx;
                    const isCurrent = i === currentIdx;
                    return (
                      <div key={step.key} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            isCurrent ? 'border-violet-500 bg-violet-100 ring-4 ring-violet-100' :
                            isDone ? 'border-violet-500 bg-violet-500' : 'border-slate-300 bg-white'
                          }`}>
                            {isDone && !isCurrent && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            )}
                          </div>
                          {i < TIMELINE_STEPS.length - 1 && (
                            <div className={`w-0.5 h-8 ${isDone && i < currentIdx ? 'bg-violet-500' : 'bg-slate-200'}`} />
                          )}
                        </div>
                        <div className="pb-6">
                          <p className={`text-sm font-bold ${isDone ? 'text-slate-900' : 'text-slate-400'}`}>{step.label}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {data.remarks && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Remarks</p>
                <p className="text-sm text-slate-700">{data.remarks}</p>
              </div>
            )}

            {data.documents && data.documents.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Documents</p>
                <div className="space-y-2">
                  {data.documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <span className="text-sm font-medium text-slate-700">{doc.document_type_display}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        doc.verification_status === 'verified' ? 'bg-emerald-100 text-emerald-700' :
                        doc.verification_status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                        doc.verification_status === 'missing' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {doc.verification_status_display}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.status_history && data.status_history.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Status History</p>
                <div className="space-y-3">
                  {data.status_history.slice().reverse().map(h => (
                    <div key={h.id} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {h.from_status_display || 'New'} &rarr; {h.to_status_display}
                        </p>
                        {h.notes && <p className="text-xs text-slate-500 mt-0.5">{h.notes}</p>}
                        <p className="text-[10px] text-slate-400 mt-0.5">{new Date(h.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnrollmentTracking;
