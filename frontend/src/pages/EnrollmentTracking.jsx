import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../utils/api';

const STATUS_CONFIG = {
  pending:              { color: 'bg-amber-500',   light: 'bg-amber-50 border-amber-300',   text: 'text-amber-800',   label: 'Pending',               desc: 'Your application is awaiting review by the admissions office.',   icon: '⏳' },
  under_review:         { color: 'bg-blue-600',    light: 'bg-blue-50 border-blue-300',     text: 'text-blue-800',    label: 'Under Review',           desc: 'Your application is currently being evaluated by our staff.',      icon: '🔍' },
  pending_requirements: { color: 'bg-orange-500',  light: 'bg-orange-50 border-orange-300', text: 'text-orange-800',  label: 'Pending Requirements',   desc: 'Additional documents are required. Please check the remarks.',    icon: '📋' },
  approved:             { color: 'bg-green-600',   light: 'bg-green-50 border-green-300',   text: 'text-green-800',   label: 'Approved',               desc: 'Your application has been approved. Enrollment will proceed shortly.', icon: '✅' },
  rejected:             { color: 'bg-red-600',     light: 'bg-red-50 border-red-300',       text: 'text-red-800',     label: 'Rejected',               desc: 'Your application was not approved. See remarks for details.',     icon: '❌' },
  enrolled:             { color: 'bg-purple-700',  light: 'bg-purple-50 border-purple-300', text: 'text-purple-800',  label: 'Enrolled',               desc: 'You are officially enrolled at Kiwalan National High School!',    icon: '🎓' },
};

const TIMELINE_STEPS = [
  { key: 'pending',      label: 'Application Submitted', desc: 'Received by admissions office' },
  { key: 'under_review', label: 'Under Review',          desc: 'Documents being evaluated' },
  { key: 'approved',     label: 'Application Approved',  desc: 'Application accepted' },
  { key: 'enrolled',     label: 'Officially Enrolled',   desc: 'Student account created' },
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
    if (!num && !email) { setError('Please enter an enrollment number or email address.'); return; }
    setLoading(true); setError(''); setData(null);
    try {
      const params = new URLSearchParams();
      if (num) params.set('number', num);
      else params.set('email', email);
      const res = await api.get(`/enrollment-applications/track/?${params}`);
      setData(res.data);
    } catch (err) {
      if (err.response?.status === 404) setError('No application found. Please verify your enrollment number or email address.');
      else setError('Unable to retrieve application. Please try again later or contact the admissions office.');
    } finally { setLoading(false); }
  };

  const cfg = data ? STATUS_CONFIG[data.status] : null;
  const currentIdx = data ? TIMELINE_STEPS.findIndex(s => s.key === data.status) : -1;
  const isRejected = data?.status === 'rejected';

  return (
    <div className="bg-gray-100 min-h-screen py-8 md:py-12">
      <div className="max-w-lg mx-auto px-4">

        {/* Official Header */}
        <div className="bg-[#5e2a84] text-white text-center py-4 px-6 border-b-4 border-yellow-400 shadow-lg">
          <p className="text-[9px] font-bold uppercase tracking-widest text-purple-200">Republic of the Philippines • Department of Education</p>
          <h1 className="text-base font-black uppercase tracking-tight mt-0.5">Kiwalan National High School</h1>
          <p className="text-[9px] text-purple-200 uppercase">Iligan City, Lanao del Norte</p>
          <div className="mt-2 pt-2 border-t border-white/20">
            <p className="text-xs font-black uppercase tracking-widest">Enrollment Application Status</p>
          </div>
        </div>

        {/* Search Form */}
        <div className="bg-white border border-t-0 border-gray-300 shadow-md p-6">
          <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest border-b-2 border-purple-600 pb-2 mb-4">Track Your Application</p>
          <form onSubmit={handleTrack} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase tracking-wider mb-1.5">Enrollment Reference Number</label>
              <input value={number} onChange={e => setNumber(e.target.value)}
                placeholder="e.g. ENR-2026-000001"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 font-mono placeholder:text-gray-400" />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-gray-300" />
              <span className="text-[10px] text-gray-400 font-black uppercase">OR</span>
              <div className="flex-1 border-t border-gray-300" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase tracking-wider mb-1.5">Email Address Used in Application</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 placeholder:text-gray-400" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-[#5e2a84] text-white text-xs font-black uppercase tracking-widest hover:bg-purple-700 disabled:opacity-50 transition-all rounded-sm">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Searching...
                </span>
              ) : 'Track My Application'}
            </button>
          </form>
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-300 flex items-start gap-3">
              <svg className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          )}
        </div>

        {data && cfg && (
          <div>
            {/* Status Banner */}
            <div className={`p-5 border border-t-0 border-gray-300 ${cfg.light}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Reference Number</p>
                  <p className="text-xl font-black text-gray-900 font-mono">{data.enrollment_number}</p>
                </div>
                <span className={`px-3 py-2 text-xs font-black uppercase tracking-wide text-white ${cfg.color}`}>
                  {cfg.icon} {cfg.label}
                </span>
              </div>
              <p className={`text-sm font-semibold ${cfg.text}`}>{cfg.desc}</p>
              <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-gray-200 text-sm">
                <div><p className="text-[9px] font-black text-gray-500 uppercase">Applicant</p><p className="font-black text-gray-900">{data.full_name}</p></div>
                <div><p className="text-[9px] font-black text-gray-500 uppercase">Grade / Strand</p><p className="font-black text-gray-900">Grade {data.grade_level}{data.strand ? ` — ${data.strand}` : ''}</p></div>
                <div><p className="text-[9px] font-black text-gray-500 uppercase">Date Submitted</p><p className="font-semibold text-gray-800">{new Date(data.submitted_at).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</p></div>
                {data.assigned_classroom_name && <div><p className="text-[9px] font-black text-gray-500 uppercase">Assigned Section</p><p className="font-black text-purple-700">{data.assigned_classroom_name}</p></div>}
              </div>
            </div>

            {/* Credentials (enrolled only) */}
            {data.status === 'enrolled' && (
              <div className="bg-purple-50 border border-t-0 border-purple-300 p-5">
                <p className="text-[10px] font-black text-purple-700 uppercase tracking-widest border-b border-purple-200 pb-2 mb-4">Student Portal Login Credentials</p>
                <div className="space-y-3">
                  {data.enrolled_student_email && (
                    <div className="bg-white border border-purple-200 p-3">
                      <p className="text-[9px] font-black text-gray-500 uppercase mb-0.5">Email / Username</p>
                      <p className="text-base font-black text-gray-900 font-mono">{data.enrolled_student_email}</p>
                    </div>
                  )}
                  {data.temp_password && (
                    <div className="bg-white border border-purple-200 p-3">
                      <p className="text-[9px] font-black text-gray-500 uppercase mb-0.5">Temporary Password</p>
                      <p className="text-base font-black text-purple-800 font-mono tracking-wider">{data.temp_password}</p>
                      <p className="text-[10px] text-amber-700 font-bold mt-1.5">⚠ Save this password. You will be required to change it upon first login.</p>
                    </div>
                  )}
                  {data.lrn && (
                    <div className="bg-white border border-purple-200 p-3">
                      <p className="text-[9px] font-black text-gray-500 uppercase mb-0.5">Learner Reference Number (LRN)</p>
                      <p className="text-base font-black text-gray-900 font-mono">{data.lrn}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-white border border-t-0 border-gray-300 p-5">
              <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest border-b border-gray-200 pb-2 mb-5">Application Progress</p>
              {isRejected ? (
                <div className="flex items-start gap-4 p-4 bg-red-50 border border-red-300">
                  <div className="w-10 h-10 bg-red-600 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
                  </div>
                  <div>
                    <p className="text-sm font-black text-red-800 uppercase">Application Rejected</p>
                    <p className="text-xs text-red-700 mt-1">{data.remarks || 'Your application was not approved. Please contact the Admissions Office for more details.'}</p>
                  </div>
                </div>
              ) : (
                <div>
                  {TIMELINE_STEPS.map((tStep, i) => {
                    const isDone = i <= currentIdx;
                    const isCurrent = i === currentIdx;
                    return (
                      <div key={tStep.key} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-7 h-7 border-2 flex items-center justify-center flex-shrink-0 ${isCurrent ? 'border-purple-600 bg-purple-50' : isDone ? 'border-purple-700 bg-[#5e2a84]' : 'border-gray-300 bg-white'}`}>
                            {isDone && !isCurrent && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                            {isCurrent && <div className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse"/>}
                          </div>
                          {i < TIMELINE_STEPS.length - 1 && <div className={`w-0.5 h-10 ${isDone && i < currentIdx ? 'bg-[#5e2a84]' : 'bg-gray-200'}`}/>}
                        </div>
                        <div className="pb-5">
                          <p className={`text-sm font-black uppercase ${isDone ? 'text-gray-900' : 'text-gray-400'}`}>{tStep.label}</p>
                          <p className={`text-xs mt-0.5 ${isDone ? 'text-gray-600' : 'text-gray-300'}`}>{tStep.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Remarks */}
            {data.remarks && !isRejected && (
              <div className="bg-white border border-t-0 border-gray-300 p-5">
                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest border-b border-gray-200 pb-2 mb-3">Remarks from Admissions Office</p>
                <p className="text-sm text-gray-700">{data.remarks}</p>
              </div>
            )}

            {/* Documents */}
            {data.documents && data.documents.length > 0 && (
              <div className="bg-white border border-t-0 border-gray-300 p-5">
                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest border-b border-gray-200 pb-2 mb-3">Submitted Documents</p>
                <div className="space-y-1.5">
                  {data.documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 border border-gray-200">
                      <span className="text-sm text-gray-700 font-medium">{doc.document_type_display}</span>
                      <span className={`text-[9px] font-black px-2 py-1 uppercase tracking-wide border ${
                        doc.verification_status==='verified'?'bg-green-50 text-green-700 border-green-300':
                        doc.verification_status==='rejected'?'bg-red-50 text-red-700 border-red-300':
                        doc.verification_status==='missing'?'bg-amber-50 text-amber-700 border-amber-300':
                        'bg-gray-100 text-gray-600 border-gray-300'}`}>
                        {doc.verification_status_display}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status History */}
            {data.status_history && data.status_history.length > 0 && (
              <div className="bg-white border border-t-0 border-gray-300 p-5">
                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest border-b border-gray-200 pb-2 mb-3">Status History</p>
                <div className="space-y-1">
                  {data.status_history.slice().reverse().map(h => (
                    <div key={h.id} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                      <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shrink-0"/>
                      <div>
                        <p className="text-sm font-black text-gray-800">{h.from_status_display || 'Submitted'} → {h.to_status_display}</p>
                        {h.notes && <p className="text-xs text-gray-500 mt-0.5">{h.notes}</p>}
                        <p className="text-[10px] text-gray-400 mt-0.5">{new Date(h.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-gray-50 border border-t-0 border-gray-300 p-4 flex gap-3">
              <Link to="/enroll" className="flex-1 py-2.5 bg-[#5e2a84] text-white text-xs font-black text-center hover:bg-purple-700 uppercase tracking-widest rounded-sm">New Application</Link>
              <Link to="/" className="flex-1 py-2.5 border border-gray-300 bg-white text-gray-700 text-xs font-black text-center hover:bg-gray-50 uppercase tracking-widest rounded-sm">Return to Home</Link>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-[#5e2a84] text-center py-3">
          <p className="text-[10px] text-purple-200 uppercase tracking-widest">
            © {new Date().getFullYear()} Kiwalan National High School — Department of Education
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnrollmentTracking;
