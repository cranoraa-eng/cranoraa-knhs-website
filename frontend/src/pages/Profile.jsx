import { useState, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { getUser } from '../utils/auth';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const Field = ({ label, value }) => (
  <div className="min-w-0">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">{label}</p>
    <p className="text-[13px] font-bold text-slate-800 truncate">{value || <span className="text-slate-300 font-normal italic">Not set</span>}</p>
  </div>
);

const Input = ({ label, value, onChange, type = 'text', required }) => (
  <div className="min-w-0">
    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">
      {label}{required && <span className="text-rose-500 ml-1">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-[13px] font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 transition-all shadow-sm"
    />
  </div>
);

// ── Inline Email Verification Widget ─────────────────────────────────────────
const EmailVerificationWidget = ({ email, isVerified, onVerified }) => {
  const user = getUser();
  const isAdmin = user?.role === 'admin';
  const [step, setStep]           = useState('idle'); // idle | sending | code | verifying | done
  const [code, setCode]           = useState('');
  const [error, setError]         = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  if (isVerified) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
        Verified
      </span>
    );
  }

  if (!email) return null;

  const sendCode = async () => {
    setStep('sending');
    setError('');
    try {
      await api.post('/email-verification/request/');
      setStep('code');
      setResendCooldown(60);
      toast.success('Verification code sent to your email');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to send code';
      const errorCode = err.response?.data?.error_code || '';
      const adminMessage = err.response?.data?.admin_message || '';
      const isMailjetError =
        errorCode.startsWith('mailjet') ||
        msg.toLowerCase().includes('delivery failed') ||
        msg.toLowerCase().includes('mailjet');

      setError(
        isAdmin && adminMessage && isMailjetError
          ? adminMessage
          : isMailjetError
          ? 'Email delivery failed. The school email service may not be configured yet. Please contact your administrator.'
          : msg
      );
      setStep('idle');
    }
  };

  const verifyCode = async () => {
    if (!code.trim()) return;
    setStep('verifying');
    setError('');
    try {
      await api.post('/email-verification/confirm/', { code });
      setStep('done');
      toast.success('Email verified successfully!');
      onVerified();
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired code');
      setStep('code');
    }
  };

  if (step === 'done') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
        Verified
      </span>
    );
  }

  if (step === 'idle' || step === 'sending') {
    return (
      <div className="flex flex-col gap-1.5">
        <button
          onClick={sendCode}
          disabled={step === 'sending'}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-black text-amber-600 uppercase tracking-widest hover:bg-amber-100 transition-all disabled:opacity-50 active:scale-95"
        >
          {step === 'sending' ? (
            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          )}
          {step === 'sending' ? 'Sending…' : 'Verify Email'}
        </button>
        {error && (
          <p className="text-[10px] font-bold text-red-500 max-w-xs leading-relaxed">{error}</p>
        )}
      </div>
    );
  }

  // step === 'code' | 'verifying'
  return (
    <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3 max-w-sm">
      <p className="text-[11px] font-bold text-amber-700">
        Enter the 6-digit code sent to <span className="font-black">{email}</span>
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={e => { setCode(e.target.value.replace(/\D/g, '')); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && verifyCode()}
          placeholder="000000"
          className="flex-1 px-4 py-2.5 border border-amber-300 rounded-xl bg-white text-[15px] font-black text-slate-800 tracking-[0.3em] text-center focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all shadow-sm"
          autoFocus
        />
        <button
          onClick={verifyCode}
          disabled={code.length !== 6 || step === 'verifying'}
          className="px-4 py-2.5 bg-violet-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-violet-700 transition-all disabled:opacity-40 active:scale-95 shadow-sm"
        >
          {step === 'verifying' ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : 'Confirm'}
        </button>
      </div>
      {error && <p className="text-[11px] font-bold text-red-500">{error}</p>}
      <div className="flex items-center justify-between">
        <button
          onClick={() => { setStep('idle'); setCode(''); setError(''); }}
          className="text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={sendCode}
          disabled={resendCooldown > 0}
          className="text-[10px] font-bold text-amber-600 hover:text-amber-700 transition-colors disabled:opacity-40"
        >
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
        </button>
      </div>
    </div>
  );
};

const Profile = () => {
  const user = getUser();
  const { refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get('student_id');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  const [uploading, setUploading] = useState(false);
  // Track local verification state so the badge updates immediately after verify
  const [isVerified, setIsVerified] = useState(user?.is_verified ?? false);
  const [form, setForm] = useState({
    title: '', first_name: '', middle_name: '', last_name: '', email: '',
    sex: '', date_of_birth: '', nationality: '', state: '',
    father_name: '', mother_name: '', contact_information: '',
    phone_number: '', address: '', registration_number: '', grade_level: '',
  });

  // Redirect admin users as profile page is not necessary for them,
  // unless they are viewing a student profile
  if (user?.role === 'admin' && !studentId) {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => { fetchProfile(); }, [studentId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const url = studentId ? `/student/profile/?student_id=${studentId}` : '/student/profile/';
      const r = await api.get(url);
      setProfile(r.data);
      setProfilePic(r.data.profile?.profile_picture);
      // Sync verification state from server
      if (!studentId) setIsVerified(!!r.data.is_verified);
      setForm({
        title:               r.data.profile?.title || '',
        first_name:          r.data.first_name || '',
        middle_name:         r.data.profile?.middle_name || '',
        last_name:           r.data.last_name || '',
        email:               r.data.email || '',
        sex:                 r.data.profile?.sex || '',
        date_of_birth:       r.data.profile?.date_of_birth || '',
        nationality:         r.data.profile?.nationality || '',
        state:               r.data.profile?.state || '',
        father_name:         r.data.profile?.father_name || '',
        mother_name:         r.data.profile?.mother_name || '',
        contact_information: r.data.profile?.contact_information || '',
        phone_number:        r.data.profile?.phone_number || '',
        address:             r.data.profile?.address || '',
        registration_number: r.data.profile?.registration_number || '',
        grade_level:         r.data.profile?.grade_level || '',
      });
    } catch { toast.error('Failed to load profile'); }
    finally { setLoading(false); }
  };

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profile_picture', file);

    setUploading(true);
    try {
      const url = studentId ? `/student/profile/?student_id=${studentId}` : '/student/profile/';
      const response = await api.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfilePic(response.data.profile_picture);
      toast.success('Profile picture updated');
      if (!studentId) refreshUser();
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Failed to upload picture';
      toast.error(msg);
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (studentId) return;
    if (!form.first_name.trim() || !form.last_name.trim())
      return toast.error('First name and last name are required');
    setSaving(true);
    try {
      await api.put('/student/profile/', form);
      toast.success('Profile updated');
      setEditing(false);
      refreshUser();
      fetchProfile();
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.details || 'Failed to update profile';
      toast.error(msg);
    } finally { setSaving(false); }
  };

  const set = (field) => (val) => setForm(f => ({ ...f, [field]: val }));

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-2 border-slate-100" />
        <div className="absolute inset-0 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
      </div>
    </div>
  );

  const fullName = [profile?.first_name, profile?.profile?.middle_name, profile?.last_name]
    .filter(Boolean).join(' ') || 'No name set';

  const initials = [profile?.first_name, profile?.last_name]
    .filter(Boolean).map(n => n[0].toUpperCase()).join('') || '?';

  const age = profile?.profile?.date_of_birth
    ? Math.floor((Date.now() - new Date(profile.profile.date_of_birth)) / (365.25 * 24 * 3600 * 1000))
    : null;

  return (
    <div className="space-y-6 animate-fade-in p-1 sm:p-0 page-bottom-safe">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight truncate">
            {studentId ? 'Student Profile' : 'My Profile'}
          </h1>
          <p className="text-[13px] font-medium text-slate-500 mt-1 line-clamp-1">
            {studentId ? 'Viewing student information' : 'View and update your personal information'}
          </p>
        </div>
        {!editing && !studentId && (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-violet-600 text-white text-[13px] font-black uppercase tracking-widest hover:bg-violet-700 active:scale-95 transition-all shadow-md shadow-violet-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Profile
          </button>
        )}
      </div>

      {/* ── Profile card ── */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">

        {/* Banner + avatar */}
        <div className="h-32 bg-[#1A0B2E] px-6 sm:px-8 flex items-end pb-4 relative">
          {/* Background Decorations */}
          <div className="absolute inset-0 overflow-hidden rounded-t-[2rem]">
            <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/20 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl pointer-events-none" />
          </div>
          
          <div className="relative flex items-end gap-5 w-full">
            <div className="relative group/avatar flex-shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[2rem] bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-black border-4 border-white/20 shadow-2xl mb-[-3.5rem] overflow-hidden">
                {profilePic ? (
                  <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : initials}
                {!studentId && (
                  <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer z-10">
                    <input type="file" className="hidden" accept="image/*" onChange={handleProfilePicUpload} />
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </label>
                )}
              </div>
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-[2rem] mb-[-3.5rem]">
                  <div className="w-7 h-7 border-3 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div className="pb-2 min-w-0">
              <h2 className="text-xl sm:text-2xl font-black text-white truncate leading-tight">{fullName}</h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-300 bg-violet-500/20 px-2 py-0.5 rounded-md">{user?.role}</span>
                <span className="text-[11px] font-bold text-violet-300/80 truncate">{profile?.email}</span>
                {profile?.email && (
                  isVerified
                    ? <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-[9px] font-black text-emerald-300 uppercase tracking-widest">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        Verified
                      </span>
                    : <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-[9px] font-black text-amber-300 uppercase tracking-widest">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01" /></svg>
                        Unverified
                      </span>
                )}
                {profile?.profile?.registration_number && (
                  <span className="text-[11px] font-black uppercase tracking-widest text-violet-300/60 hidden xs:inline">LRN: {profile.profile.registration_number}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 sm:px-8 pb-8 pt-20 sm:pt-24">

          {editing ? (
            /* ── Edit form ── */
            <div className="space-y-10">
              {/* Name */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">Name Details</h3>
                  <div className="h-px w-full bg-slate-100"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
                  {user?.role === 'teacher' && (
                    <div className="sm:col-span-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Title</label>
                      <select value={form.title} onChange={e => set('title')(e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-[13px] font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 transition-all shadow-sm">
                        <option value="">Select</option>
                        <option value="Mr.">Mr.</option>
                        <option value="Ms.">Ms.</option>
                        <option value="Mrs.">Mrs.</option>
                        <option value="Dr.">Dr.</option>
                        <option value="Prof.">Prof.</option>
                      </select>
                    </div>
                  )}
                  <div className={user?.role === 'teacher' ? 'sm:col-span-1' : 'sm:col-span-1'}>
                    <Input label="First Name" value={form.first_name} onChange={set('first_name')} required />
                  </div>
                  <Input label="Middle Name" value={form.middle_name} onChange={set('middle_name')} />
                  <Input label="Last Name" value={form.last_name} onChange={set('last_name')} required />
                </div>
              </div>

              {/* Personal */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">Personal Information</h3>
                  <div className="h-px w-full bg-slate-100"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="min-w-0">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Sex</label>
                    <select value={form.sex} onChange={e => set('sex')(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-[13px] font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 transition-all shadow-sm">
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <Input label="Date of Birth" value={form.date_of_birth} onChange={set('date_of_birth')} type="date" />
                  <Input label="Nationality" value={form.nationality} onChange={set('nationality')} />
                  <Input label="Province / State" value={form.state} onChange={set('state')} />
                </div>
              </div>

              {/* Family */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">Family Details</h3>
                  <div className="h-px w-full bg-slate-100"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input label="Father's Name" value={form.father_name} onChange={set('father_name')} />
                  <Input label="Mother's Name" value={form.mother_name} onChange={set('mother_name')} />
                </div>
              </div>

              {/* School */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">Academic Record</h3>
                  <div className="h-px w-full bg-slate-100"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input label="LRN (Learner Reference Number)" value={form.registration_number} onChange={set('registration_number')} />
                  <Input label="Grade Level" value={form.grade_level} onChange={set('grade_level')} />
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">Contact Information</h3>
                  <div className="h-px w-full bg-slate-100"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input label="Email Address (Optional)" value={form.email} onChange={set('email')} type="email" />
                  <Input label="Phone Number" value={form.phone_number} onChange={set('phone_number')} />
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Address</label>
                    <textarea value={form.address} onChange={e => set('address')(e.target.value)} rows={2}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-[13px] font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 transition-all resize-none shadow-sm" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Emergency Contact</label>
                    <textarea value={form.contact_information} onChange={e => set('contact_information')(e.target.value)} rows={2}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-[13px] font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 transition-all resize-none shadow-sm"
                      placeholder="Name, relationship, phone number…" />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col xs:flex-row gap-3 pt-4">
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-violet-600 text-white text-[13px] font-black uppercase tracking-widest hover:bg-violet-700 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-violet-200">
                  {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
                <button onClick={() => setEditing(false)}
                  className="flex-1 px-8 py-3.5 rounded-xl bg-slate-100 text-slate-700 text-[13px] font-black uppercase tracking-widest hover:bg-slate-200 active:scale-95 transition-all">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* ── View mode ── */
            <div className="space-y-12">
              {/* Personal */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">Personal Information</h3>
                  <div className="h-px w-full bg-slate-100"></div>
                </div>
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-6">
                  {user?.role === 'teacher' && <Field label="Title" value={profile?.profile?.title} />}
                  <Field label="First Name"   value={profile?.first_name} />
                  <Field label="Middle Name"  value={profile?.profile?.middle_name} />
                  <Field label="Last Name"    value={profile?.last_name} />
                  <Field label="Sex"          value={profile?.profile?.sex ? profile.profile.sex.charAt(0).toUpperCase() + profile.profile.sex.slice(1) : null} />
                  <Field label="Date of Birth" value={profile?.profile?.date_of_birth
                    ? new Date(profile.profile.date_of_birth + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                    : null} />
                  <Field label="Age"          value={age !== null ? `${age} years old` : null} />
                  <Field label="Nationality"  value={profile?.profile?.nationality} />
                  <Field label="Province / State" value={profile?.profile?.state} />
                </div>
              </div>

              {/* Family */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">Family Details</h3>
                  <div className="h-px w-full bg-slate-100"></div>
                </div>
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-x-8 gap-y-6">
                  <Field label="Father's Name" value={profile?.profile?.father_name} />
                  <Field label="Mother's Name" value={profile?.profile?.mother_name} />
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">Contact Information</h3>
                  <div className="h-px w-full bg-slate-100"></div>
                </div>
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-x-8 gap-y-6">
                  {/* Email with inline verification widget */}
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">Email Address</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[13px] font-bold text-slate-800 truncate">
                        {profile?.email || <span className="text-slate-300 font-normal italic">Not set</span>}
                      </p>
                      {/* Only show widget for own profile (not when viewing a student) */}
                      {!studentId && (
                        <EmailVerificationWidget
                          email={profile?.email}
                          isVerified={isVerified}
                          onVerified={() => {
                            setIsVerified(true);
                            refreshUser();
                          }}
                        />
                      )}
                    </div>
                    {/* Hint when email is not set */}
                    {!studentId && !profile?.email && (
                      <p className="text-[10px] text-slate-400 mt-1.5 italic">
                        Add an email address and save your profile to enable verification.
                      </p>
                    )}
                  </div>
                  <Field label="Phone Number" value={profile?.profile?.phone_number} />
                  <div className="xs:col-span-2">
                    <Field label="Address"    value={profile?.profile?.address} />
                  </div>
                  <div className="xs:col-span-2">
                    <Field label="Emergency Contact" value={profile?.profile?.contact_information} />
                  </div>
                </div>
              </div>

              {(profile?.profile?.registration_number || profile?.profile?.grade_level) && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">Academic Record</h3>
                    <div className="h-px w-full bg-slate-100"></div>
                  </div>
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-x-8 gap-y-6">
                    <Field label="LRN" value={profile?.profile?.registration_number} />
                    <Field label="Grade Level" value={profile?.profile?.grade_level} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
