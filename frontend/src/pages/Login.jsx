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
    <div className="min-h-screen bg-slate-50 flex">

      {/* ── Left panel (branding) — hidden on mobile ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0f0720] flex-col justify-between p-12 relative overflow-hidden">
        {/* Grid texture */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        {/* Glow accents */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/15 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/10 rounded-full -translate-x-1/2 translate-y-1/2 blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center">
            <img src="/icons/school-logo-source.png" alt="KNHS" className="h-8 w-8 object-contain" />
          </div>
          <div>
            <p className="text-sm font-black text-white leading-none tracking-tight">KIWALAN NHS</p>
            <p className="text-[10px] text-violet-400 font-bold mt-0.5 uppercase tracking-widest">Student Portal</p>
          </div>
        </div>

        {/* Center content */}
        <div className="relative space-y-8">
          <div>
            <p className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-4">Welcome Back</p>
            <h2 className="text-4xl font-black text-white leading-tight mb-4">
              Your academic<br />journey, all in<br />one place.
            </h2>
            <p className="text-slate-400 leading-relaxed text-sm">
              Access grades, attendance, announcements, messages, and more — all from your personalized portal.
            </p>
          </div>
          {/* Feature list */}
          <div className="space-y-3">
            {['Real-time grade tracking', 'Attendance monitoring', 'Direct teacher messaging', 'Instant announcements', 'Learning materials access'].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                </div>
                <span className="text-sm text-slate-400">{f}</span>
              </div>
            ))}
          </div>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {[{ val: '1,200+', label: 'Students' }, { val: '80+', label: 'Faculty' }, { val: '5,000+', label: 'Graduates' }, { val: '20+', label: 'Years' }].map((s, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3">
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
              <div className="h-9 w-9 rounded-xl overflow-hidden border border-slate-200 bg-white flex items-center justify-center shadow-sm">
                <img src="https://plain-apac-prod-public.komododecks.com/202605/18/u3t1lOolacFscP6v1Bq8/image.png" alt="KNHS" className="h-7 w-7 object-contain" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900 leading-none">KIWALAN NHS</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5 uppercase tracking-widest">Student Portal</p>
              </div>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-1">Sign in</h1>
            <p className="text-sm text-slate-500">Access your KNHS Portal account</p>
          </div>

          {/* Login type toggle */}
          <div className="flex p-1 bg-slate-100 rounded-xl mb-6 border border-slate-200">
            {['student', 'teacher', 'parent'].map(type => (
              <button
                key={type}
                onClick={() => { setLoginType(type); setIdentifier(''); setFieldErrors({}); }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                  loginType === type
                    ? 'bg-white text-violet-700 shadow-sm border border-slate-200'
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
                {loginType === 'student' ? 'Student ID or Email' : loginType === 'parent' ? 'Email Address' : 'Teacher Email'}
              </label>
              <input
                id="identifier"
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={e => { setIdentifier(e.target.value); setFieldErrors(p => ({ ...p, identifier: '' })); }}
                placeholder={loginType === 'student' ? 'Student ID or email address' : loginType === 'parent' ? 'parent@email.com' : 'teacher@knhs.edu.ph'}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 ${
                  fieldErrors.identifier ? 'border-red-400 bg-red-50' : 'border-slate-200'
                }`}
              />
              {fieldErrors.identifier && <p className="text-red-500 text-[11px] mt-1 font-medium">{fieldErrors.identifier}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="text-xs font-bold text-slate-600 uppercase tracking-wider">Password</label>
                <Link to="/forgot-password" className="text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors">Forgot password?</Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: '' })); }}
                  placeholder="••••••••"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 pr-10 ${
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
              className="w-full py-3 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-6">
            {loginType === 'student'
              ? 'No account? Contact your school administrator.'
              : loginType === 'parent'
              ? 'No account? Contact the school office to register.'
              : 'No account? Contact the ICT coordinator.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
