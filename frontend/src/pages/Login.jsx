import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginRequest } from '../utils/auth';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const Login = () => {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState('student');

  const roleConfig = {
    student: {
      color: 'violet',
      accent: 'indigo',
      title: 'Your academic journey, all in one place.',
      desc: 'Access grades, attendance, announcements, messages, and more — all from your personalized portal.',
      features: ['Real-time grade tracking', 'Attendance monitoring', 'Direct teacher messaging', 'Instant announcements', 'Learning materials access'],
      stats: [{ val: '1,200+', label: 'Students' }, { val: '80+', label: 'Faculty' }, { val: '5,000+', label: 'Graduates' }, { val: '20+', label: 'Years' }],
      identifierLabel: 'Student ID or Email',
      identifierPlaceholder: 'Student ID or email address'
    },
    teacher: {
      color: 'emerald',
      accent: 'teal',
      title: 'Empowering educators, inspiring students.',
      desc: 'Manage classes, record grades, track attendance, and communicate with parents and students seamlessly.',
      features: ['Class management tools', 'Automated grading system', 'Parent-teacher communication', 'Curriculum planning', 'Resource sharing'],
      stats: [{ val: '45+', label: 'Sections' }, { val: '98%', label: 'Efficiency' }, { val: '24/7', label: 'Support' }, { val: 'Top', label: 'Ranked' }],
      identifierLabel: 'Teacher Email',
      identifierPlaceholder: 'teacher@knhs.edu.ph'
    },
    parent: {
      color: 'blue',
      accent: 'sky',
      title: 'Partnering in your child\'s success.',
      desc: 'Stay informed about your child\'s academic progress, attendance, and school activities in real-time.',
      features: ['Grade notifications', 'Attendance alerts', 'Direct teacher contact', 'School event calendar', 'Performance analytics'],
      stats: [{ val: '2,000+', label: 'Parents' }, { val: '100%', label: 'Visibility' }, { val: 'Secure', label: 'Access' }, { val: 'Global', label: 'Standard' }],
      identifierLabel: 'Parent Email',
      identifierPlaceholder: 'parent@email.com'
    },
    admin: {
      color: 'slate',
      accent: 'zinc',
      title: 'System Administration Control Panel',
      desc: 'High-level management of school infrastructure, user accounts, and security protocols.',
      features: ['Full system oversight', 'Advanced security logs', 'Database management', 'Administrative reports', 'User permission control'],
      stats: [{ val: 'V3.2', label: 'Version' }, { val: 'Active', label: 'Status' }, { val: 'Secure', label: 'Layer' }, { val: '24/7', label: 'Uptime' }],
      identifierLabel: 'Admin Email or ID',
      identifierPlaceholder: 'admin@knhs.edu.ph'
    }
  };

  const currentRole = roleConfig[loginType];

  // Already logged in — redirect
  useEffect(() => {
    if (user) {
      if (user.must_change_password) {
        navigate('/force-password-change', { replace: true });
      } else if (user.role === 'parent') {
        navigate('/parent-dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  const handleUnverifiedUser = (userEmail) => {
    Swal.fire({
      icon: 'warning',
      title: 'Email Not Verified',
      text: 'Please verify your email before logging in. Would you like to enter your verification code or request a new one?',
      showCancelButton: true,
      confirmButtonText: 'Enter Code',
      cancelButtonText: 'Resend Code',
      confirmButtonColor: '#9333ea',
    }).then(async (result) => {
      if (result.isConfirmed) {
        navigate('/verify-otp', { state: { email: userEmail } });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire({ title: 'Sending...', allowOutsideClick: false, showConfirmButton: false, didOpen: () => Swal.showLoading() });
        try {
          await api.post('/resend-otp/', { email: userEmail, type: 'signup' });
          Swal.fire({ icon: 'success', title: 'Code Sent!', text: 'A new verification code has been sent to your email.', confirmButtonColor: '#9333ea' })
            .then(() => navigate('/verify-otp', { state: { email: userEmail } }));
        } catch (resendErr) {
          Swal.fire({ icon: 'error', title: 'Failed to Send', text: resendErr.response?.data?.error || 'Failed to resend code.', confirmButtonColor: '#9333ea' });
        }
      }
    });
  };

  const validate = () => {
    const errors = {};
    if (!identifier.trim()) errors.identifier = loginType === 'student' ? 'Student ID or Email is required' : 'Email is required';
    if (!password) errors.password = 'Password is required';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    const errors = validate();
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }

    setLoading(true);
    try {
      const userData = await loginRequest(identifier, password, loginType);
      if (userData?.must_change_password) {
        signIn(userData);
        toast.success('Please update your password to continue.');
        navigate('/force-password-change', { replace: true });
        return;
      }
      signIn(userData);
      toast.success('Welcome back!');
      if (userData.role === 'parent') {
        navigate('/parent-dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setLoading(false);
      const status = err.response?.status;
      const code = err.response?.data?.code;
      const message = err.response?.data?.error;

      if (status === 403 && code === 'not_verified') {
        handleUnverifiedUser(identifier);
      } else if (status === 403 && code === 'not_approved') {
        Swal.fire({ icon: 'info', title: 'Pending Approval', text: 'Your account is pending admin approval. You will be notified once approved.', confirmButtonColor: '#9333ea' });
      } else if (status === 403 && message?.toLowerCase().includes('suspended')) {
        Swal.fire({ icon: 'error', title: 'Account Suspended', text: message || 'This account has been suspended. Please contact the administrator.', confirmButtonColor: '#ef4444' });
      } else if (status === 401) {
        Swal.fire({ icon: 'error', title: 'Invalid Credentials', text: 'The email or password you entered is incorrect.', confirmButtonText: 'Try Again', confirmButtonColor: '#9333ea' });
      } else if (!err.response) {
        Swal.fire({ icon: 'error', title: 'Cannot Reach Server', text: 'Make sure the backend is running and try again.', confirmButtonColor: '#9333ea' });
      } else {
        Swal.fire({ icon: 'error', title: 'Login Failed', text: message || 'An unexpected error occurred. Please try again.', confirmButtonColor: '#9333ea' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex relative">
      {/* Secret Admin Trigger */}
      <button 
        onClick={() => setLoginType('admin')}
        className="fixed top-2 right-2 z-50 w-8 h-8 rounded-full flex items-center justify-center text-slate-200 hover:text-slate-400 transition-colors opacity-10 hover:opacity-100"
        title="Admin Portal"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </button>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0F071E]/80 backdrop-blur-md transition-all duration-500">
          <div className="relative mb-8">
            <div className={`absolute -inset-4 bg-${currentRole.color}-600 rounded-full blur-xl opacity-40 animate-pulse`} />
            <div className="relative w-20 h-20 bg-white rounded-full flex items-center justify-center p-1 shadow-2xl">
              <div className={`w-full h-full rounded-full border-4 border-${currentRole.color}-100 border-t-${currentRole.color}-600 animate-spin`} />
              <img src="/icons/school-logo-source.png" alt="KNHS" className="absolute w-10 h-10 object-contain" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Authenticating</h3>
            <p className={`text-[10px] font-bold text-${currentRole.color}-400 uppercase tracking-[0.3em] animate-pulse`}>Syncing with school database...</p>
          </div>
        </div>
      )}

      {/* ── Left panel (branding) — hidden on mobile ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0f0720] flex-col justify-between p-12 relative overflow-hidden transition-colors duration-700">
        {/* Grid texture */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        {/* Glow accents */}
        <div className={`absolute top-0 right-0 w-80 h-80 bg-${currentRole.color}-600/15 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none transition-all duration-1000`} />
        <div className={`absolute bottom-0 left-0 w-64 h-64 bg-${currentRole.accent}-600/10 rounded-full -translate-x-1/2 translate-y-1/2 blur-3xl pointer-events-none transition-all duration-1000`} />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="h-10 w-10 rounded-full overflow-hidden border border-white/10 bg-white p-1 flex items-center justify-center">
            <img src="/icons/school-logo-source.png" alt="KNHS" className="h-full w-full object-contain" />
          </div>
          <div>
            <p className="text-sm font-black text-white leading-none tracking-tight">KIWALAN NHS</p>
            <p className={`text-[10px] text-${currentRole.color}-400 font-bold mt-0.5 uppercase tracking-widest transition-colors duration-500`}>{loginType} Portal</p>
          </div>
        </div>

        {/* Center content */}
        <div className="relative space-y-8">
          <div className="animate-fade-in" key={loginType}>
            <p className={`text-xs font-bold text-${currentRole.color}-400 uppercase tracking-widest mb-4 transition-colors duration-500`}>Welcome Back</p>
            <h2 className="text-4xl font-black text-white leading-tight mb-4 whitespace-pre-line">
              {currentRole.title}
            </h2>
            <p className="text-slate-400 leading-relaxed text-sm">
              {currentRole.desc}
            </p>
          </div>
          {/* Feature list */}
          <div className="space-y-3" key={`features-${loginType}`}>
            {currentRole.features.map((f, i) => (
              <div key={i} className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                <div className={`w-5 h-5 rounded-full bg-${currentRole.color}-500/20 border border-${currentRole.color}-500/30 flex items-center justify-center flex-shrink-0 transition-colors duration-500`}>
                  <svg className={`w-3 h-3 text-${currentRole.color}-400 transition-colors duration-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                </div>
                <span className="text-sm text-slate-400">{f}</span>
              </div>
            ))}
          </div>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 pt-2" key={`stats-${loginType}`}>
            {currentRole.stats.map((s, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3 animate-fade-in" style={{ animationDelay: `${(i + 5) * 100}ms` }}>
                <p className="text-lg font-black text-white">{s.val}</p>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom link */}
        <div className="relative">
          <button onClick={() => { window.location.href = '/'; }} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Website
          </button>
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:px-8 bg-slate-50">

        {/* Mobile back link */}
        <div className="w-full max-w-sm mb-6 lg:hidden">
          <button
            onClick={() => { window.location.href = '/'; }}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Website
          </button>
        </div>

        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6 lg:hidden">
              <div className="h-9 w-9 rounded-full overflow-hidden border border-slate-200 bg-white flex items-center justify-center shadow-sm p-1">
                <img src="/icons/school-logo-source.png" alt="KNHS" className="h-full w-full object-contain" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900 leading-none">KIWALAN NHS</p>
                <p className={`text-[10px] text-${currentRole.color}-600 font-bold mt-0.5 uppercase tracking-widest transition-colors duration-500`}>{loginType} Portal</p>
              </div>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-1">Sign in</h1>
            <p className="text-sm text-slate-500">Access your KNHS {loginType} account</p>
          </div>

          {/* Login type toggle */}
          <div className="flex p-1 bg-slate-100 rounded-xl mb-6 border border-slate-200">
            {['student', 'teacher', 'parent'].map(type => (
              <button
                key={type}
                onClick={() => { setLoginType(type); setIdentifier(''); setFieldErrors({}); }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                  loginType === type
                    ? `bg-white text-${roleConfig[type].color}-700 shadow-sm border border-slate-200`
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {type === 'student' ? 'Student' : type === 'teacher' ? 'Teacher' : 'Parent'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Identifier */}
            <div>
              <label htmlFor="identifier" className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                {currentRole.identifierLabel}
              </label>
              <input
                id="identifier"
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={e => { setIdentifier(e.target.value); setFieldErrors(p => ({ ...p, identifier: '' })); }}
                placeholder={currentRole.identifierPlaceholder}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-${currentRole.color}-500/20 focus:border-${currentRole.color}-500 ${
                  fieldErrors.identifier ? 'border-red-400 bg-red-50' : 'border-slate-200'
                }`}
              />
              {fieldErrors.identifier && <p className="text-red-500 text-[11px] mt-1 font-medium">{fieldErrors.identifier}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="text-xs font-bold text-slate-600 uppercase tracking-wider">Password</label>
                <Link to="/forgot-password" className={`text-xs font-semibold text-${currentRole.color}-600 hover:text-${currentRole.color}-700 transition-colors`}>Forgot password?</Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: '' })); }}
                  placeholder="••••••••"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-${currentRole.color}-500/20 focus:border-${currentRole.color}-500 pr-10 ${
                    fieldErrors.password ? 'border-red-400 bg-red-50' : 'border-slate-200'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && <p className="text-red-500 text-[11px] mt-1 font-medium">{fieldErrors.password}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl bg-${currentRole.color}-600 text-white text-sm font-bold shadow-lg shadow-${currentRole.color}-900/20 hover:bg-${currentRole.color}-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  Sign in as {loginType.charAt(0).toUpperCase() + loginType.slice(1)}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
