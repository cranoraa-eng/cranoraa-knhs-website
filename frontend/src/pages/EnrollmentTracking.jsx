import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../utils/api';

const STATUS_CONFIG = {
  pending: { color: 'bg-amber-500', light: 'bg-amber-50 border-amber-200', text: 'text-amber-700', label: 'Pending', desc: 'Your application is awaiting review', icon: '\u23F3' },
  under_review: { color: 'bg-blue-500', light: 'bg-blue-50 border-blue-200', text: 'text-blue-700', label: 'Under Review', desc: 'Your application is being evaluated', icon: '\uD83D\uDD0D' },
  pending_requirements: { color: 'bg-orange-500', light: 'bg-orange-50 border-orange-200', text: 'text-orange-700', label: 'Pending Requirements', desc: 'Additional documents requested', icon: '\uD83D\uDCCB' },
  approved: { color: 'bg-emerald-500', light: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', label: 'Approved', desc: 'Your application has been approved!', icon: '\u2705' },
  rejected: { color: 'bg-rose-500', light: 'bg-rose-50 border-rose-200', text: 'text-rose-700', label: 'Rejected', desc: 'Your application was not approved', icon: '\u274C' },
  enrolled: { color: 'bg-violet-500', light: 'bg-violet-50 border-violet-200', text: 'text-violet-700', label: 'Enrolled', desc: 'You are officially enrolled!', icon: '\uD83C\uDF93' },
};

const TIMELINE_STEPS = [
  { key: 'pending', label: 'Submitted', desc: 'Application received' },
  { key: 'under_review', label: 'Under Review', desc: 'Being evaluated by admin' },
  { key: 'pending_requirements', label: 'Requirements Verified', desc: 'Documents checked' },
  { key: 'approved', label: 'Approved', desc: 'Application approved' },
  { key: 'enrolled', label: 'Enrolled', desc: 'Officially enrolled' },
];

const EnrollmentTracking = () => {
  const [searchParams] = useSearchParams();
  const [number, setNumber] = useState(searchParams.get('number') || '');
  const [email, setEmail] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const n = searchParams.get('number');
    if (n) { setNumber(n); handleTrack(null, n); }
  }, []);

  const handleTrack = async (e, autoNumber) => {
    if (e) e.preventDefault();
    const num = autoNumber || number;
    if (!num && !email) { setError('Enter an enrollment number or email'); return; }
    setLoading(true);
    setError('');
    setData(null);
    try {
      const params = new URLSearchParams();
      if (num) params.set('number', num);
      else params.set('email', email);
      const res = await api.get(`/enrollment-applications/track/?${params}`);
      setData(res.data);
    } catch (err) {
      if (err.response?.status === 404) setError('No application found. Please check your enrollment number or email.');
      else setError('Failed to load. Please try again later.');
    } finally { setLoading(false); }
  };

  const cfg = data ? STATUS_CONFIG[data.status] : null;
  const currentIdx = data ? TIMELINE_STEPS.findIndex(s => s.key === data.status) : -1;
  const isRejected = data?.status === 'rejected';

  return (
    <div className="bg-gradient-to-br from-violet-50 via-white to-slate-50 min-h-screen py-8 md:py-12">
      <div className="max-w-lg mx-auto px-4">
        <div className="text-center mb-8">
          <Link to="/" className="text-xs font-bold text-violet-600 hover:text-violet-800 mb-3 inline-flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            Back to Home
          </Link>
          <h1 className="text-3xl font-black text-slate-900 mb-1">Track Application</h1>
          <p className="text-sm text-slate-500">Check your enrollment status in real-time</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-6 mb-6">
          <form onSubmit={handleTrack} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Enrollment Number</label>
              <input value={number} onChange={e => setNumber(e.target.value)}
                placeholder="e.g. ENR-2026-000001"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-mono" />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-slate-200" />
              <span className="text-xs text-slate-400 font-bold uppercase">or</span>
              <div className="flex-1 border-t border-slate-200" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 disabled:opacity-50 transition-all shadow-md shadow-violet-200">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Searching...
                </span>
              ) : 'Track Application'}
            </button>
          </form>
          {error && (
            <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3">
              <svg className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-sm font-medium text-rose-700">{error}</p>
            </div>
          )}
        </div>

        {data && cfg && (
          <div className="space-y-5">
            {/* Status Card */}
            <div className={`rounded-2xl border shadow-lg p-6 ${cfg.light}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enrollment Number</p>
                  <p className="text-xl font-black text-slate-900 font-mono tracking-wider">{data.enrollment_number}</p>
                </div>
                <div className={`px-4 py-2 rounded-xl text-sm font-bold ${cfg.color} text-white shadow-md`}>
                  {cfg.icon} {cfg.label}
                </div>
              </div>
              <p className={`text-sm font-medium ${cfg.text}`}>{cfg.desc}</p>
              <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Applicant</p>
                  <p className="font-semibold text-slate-800">{data.full_name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Grade Level</p>
                  <p className="font-semibold text-slate-800">Grade {data.grade_level}{data.strand ? ` \u2014 ${data.strand}` : ''}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Submitted</p>
                  <p className="font-semibold text-slate-800">{new Date(data.submitted_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                {data.assigned_classroom_name && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Section</p>
                    <p className="font-semibold text-slate-800">{data.assigned_classroom_name}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Enrollment Credentials - Only shown when enrolled */}
            {data.status === 'enrolled' && (
              <div className="rounded-2xl border-2 border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50 shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-violet-800">Your Login Credentials</p>
                    <p className="text-xs text-violet-500">Use these to log in to the student portal</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {data.enrolled_student_email && (
                    <div className="bg-white rounded-xl p-4 border border-violet-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Email</p>
                      <p className="text-lg font-black text-slate-900 font-mono">{data.enrolled_student_email}</p>
                    </div>
                  )}
                  {data.temp_password && (
                    <div className="bg-white rounded-xl p-4 border border-violet-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Password</p>
                      <p className="text-lg font-black text-violet-700 font-mono tracking-wider">{data.temp_password}</p>
                      <p className="text-[10px] text-amber-600 font-bold mt-2">
                        Save this password. You will be asked to change it on first login.
                      </p>
                    </div>
                  )}
                  {data.lrn && (
                    <div className="bg-white rounded-xl p-4 border border-violet-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">LRN</p>
                      <p className="text-lg font-black text-slate-900 font-mono">{data.lrn}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-6">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Progress Timeline</p>
              {isRejected ? (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-rose-50 border border-rose-100">
                  <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-rose-800">Application Rejected</p>
                    <p className="text-xs text-rose-600 mt-0.5">{data.remarks || 'Your application was not approved. Please contact the office for details.'}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-0">
                  {TIMELINE_STEPS.map((step, i) => {
                    const isDone = i <= currentIdx;
                    const isCurrent = i === currentIdx;
                    const isFuture = i > currentIdx;
                    return (
                      <div key={step.key} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                            isCurrent ? 'border-violet-500 bg-violet-100 ring-4 ring-violet-100' :
                            isDone ? 'border-violet-500 bg-violet-500' : 'border-slate-300 bg-white'
                          }`}>
                            {isDone && !isCurrent && (
                              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            )}
                            {isCurrent && (
                              <div className="w-2 h-2 rounded-full bg-violet-500" />
                            )}
                          </div>
                          {i < TIMELINE_STEPS.length - 1 && (
                            <div className={`w-0.5 h-10 ${isDone && i < currentIdx ? 'bg-violet-500' : 'bg-slate-200'}`} />
                          )}
                        </div>
                        <div className="pb-6">
                          <p className={`text-sm font-bold ${isDone ? 'text-slate-900' : 'text-slate-400'}`}>{step.label}</p>
                          <p className={`text-xs mt-0.5 ${isDone ? 'text-slate-500' : 'text-slate-300'}`}>{step.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Remarks */}
            {data.remarks && !isRejected && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-6">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Remarks</p>
                <p className="text-sm text-slate-700">{data.remarks}</p>
              </div>
            )}

            {/* Documents */}
            {data.documents && data.documents.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-6">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Documents</p>
                <div className="space-y-2">
                  {data.documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-sm font-medium text-slate-700">{doc.document_type_display}</span>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        doc.verification_status === 'verified' ? 'bg-emerald-100 text-emerald-700' :
                        doc.verification_status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                        doc.verification_status === 'missing' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-200 text-slate-600'
                      }`}>
                        {doc.verification_status_display}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status History */}
            {data.status_history && data.status_history.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-6">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Status History</p>
                <div className="space-y-3">
                  {data.status_history.slice().reverse().map(h => (
                    <div key={h.id} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {h.from_status_display || 'Submitted'} &rarr; {h.to_status_display}
                        </p>
                        {h.notes && <p className="text-xs text-slate-500 mt-0.5">{h.notes}</p>}
                        <p className="text-[10px] text-slate-400 mt-0.5">{new Date(h.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Link to="/enroll" className="flex-1 py-3 rounded-xl bg-violet-600 text-white text-sm font-bold text-center hover:bg-violet-700 transition-all shadow-md shadow-violet-200">
                Submit New Application
              </Link>
              <Link to="/" className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold text-center hover:bg-slate-50 transition-colors">
                Back to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnrollmentTracking;
