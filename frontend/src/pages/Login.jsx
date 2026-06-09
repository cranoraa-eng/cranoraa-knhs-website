import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginRequest, clearSession } from '../utils/auth';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const ROLES = {
  student: {
    label: 'Student',
    subtitle: 'Learner Portal',
    identifierLabel: 'Student ID or Email',
    identifierPlaceholder: 'Enter your Student ID or email',
    icon: 'M12 14l9-5-9-5-9 5 9 5zm0 7l-9-5 9-5 9 5-9 5z',
    features: ['Real-time grade tracking', 'Attendance monitoring', 'Learning materials', 'Announcements', 'Direct messaging'],
    theme: {
      text: 'text-violet-600',
      bg: 'bg-violet-600',
      border: 'border-violet-200 focus:border-violet-500',
      ring: 'focus:ring-violet-500/10',
      accent: 'bg-violet-500',
    }
  },
  teacher: {
    label: 'Teacher',
    subtitle: 'Faculty Portal',
    identifierLabel: 'Teacher Email',
    identifierPlaceholder: 'teacher@knhs.edu.ph',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    features: ['Grade input & management', 'Class attendance', 'Upload materials', 'Post announcements', 'Student communication'],
    theme: {
      text: 'text-violet-600',
      bg: 'bg-violet-600',
      border: 'border-violet-200 focus:border-violet-500',
      ring: 'focus:ring-violet-500/10',
      accent: 'bg-violet-500',
    }
  },
  admin: {
    label: 'Administrator',
    subtitle: 'System Administration',
    identifierLabel: 'Admin Email or ID',
    identifierPlaceholder: 'admin@knhs.edu.ph',
    icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
    features: ['Full system oversight', 'User management', 'Enrollment control', 'Analytics & reports', 'Security & audit logs'],
    theme: {
      text: 'text-slate-700',
      bg: 'bg-slate-800',
      border: 'border-slate-200 focus:border-slate-500',
      ring: 'focus:ring-slate-500/10',
      accent: 'bg-slate-600',
    }
  },
};

const Login = () => {
  const { user, signIn, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [loginType, setLoginType] = useState('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const role = ROLES[loginType];

  useEffect(() => {
    if (user) {
      if (user.must_change_password) navigate('/force-password-change', { replace: true });
      else if (user.role === 'parent') navigate('/parent-dashboard', { replace: true });
      else navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => { setIdentifier(''); setPassword(''); setFieldErrors({}); }, [loginType]);

  const handleForgotClick = () => {
    Swal.fire({
      icon: 'info',
      title: 'Password Reset',
      text: 'Please contact the ICT coordinator for password reset.',
      confirmButtonColor: '#0f172a',
      customClass: { popup: 'rounded-none', confirmButton: 'rounded-none uppercase text-xs font-black tracking-widest px-6 py-3' }
    });
  };

  const validate = () => {
    const errors = {};
    if (!identifier.trim()) errors.identifier = `${role.identifierLabel} is required`;
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
      if (userData.role && userData.role !== loginType) {
        setLoading(false);
        clearSession();
        Swal.fire({ icon: 'error', title: 'Wrong Portal', text: `This account is registered as a ${userData.role}. Please use the correct portal.`, confirmButtonColor: '#7c3aed' });
        return;
      }
      if (userData?.must_change_password) {
        signIn(userData); setLoading(false);
        toast.success('Please update your password to continue.');
        navigate('/force-password-change', { replace: true });
        return;
      }
      signIn(userData);
      await refreshUser();
      setLoading(false);
      const dest = userData.role === 'parent' ? '/parent-dashboard' : '/dashboard';
      navigate(dest, { replace: true });
    } catch (err) {
      setLoading(false);
      const status = err.response?.status;
      const code = err.response?.data?.code;
      const message = err.response?.data?.error;
      if (status === 403 && code === 'not_approved') {
        Swal.fire({ icon: 'info', title: 'Pending Approval', text: 'Your account is pending admin approval.', confirmButtonColor: '#7c3aed' });
      } else if (status === 403) {
        Swal.fire({ icon: 'error', title: 'Account Suspended', text: message || 'Contact the administrator.', confirmButtonColor: '#ef4444' });
      } else if (status === 401) {
        Swal.fire({ icon: 'error', title: 'Invalid Credentials', text: 'The ID or password you entered is incorrect.', confirmButtonText: 'Try Again', confirmButtonColor: '#7c3aed' });
      } else if (status === 429) {
        Swal.fire({ icon: 'warning', title: 'Too Many Attempts', text: err.response?.data?.detail || 'Please wait before trying again.', confirmButtonColor: '#7c3aed' });
      } else if (!err.response) {
        Swal.fire({ icon: 'error', title: 'Cannot Reach Server', text: 'Make sure the backend is running and try again.', confirmButtonColor: '#7c3aed' });
      } else {
        Swal.fire({ icon: 'error', title: 'Login Failed', text: message || 'An unexpected error occurred.', confirmButtonColor: '#7c3aed' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-white flex font-sans">
      {/* Left Side: Branding */}
      <div className="hidden lg:flex lg:w-[45%] bg-slate-900 relative overflow-hidden flex-col justify-between">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="relative z-10 p-12 flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-4 mb-16">
            <div className="w-14 h-14 bg-white flex items-center justify-center border border-slate-200">
              <img src="/icons/school-logo-source.png" alt="KNHS" className="w-10 h-10 object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white uppercase tracking-wider leading-none">Kiwalan</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">National High School</p>
            </div>
          </div>

          {/* Main heading */}
          <div className="flex-1 flex flex-col justify-center max-w-md">
            <h2 className="text-4xl font-black text-white mb-4 leading-tight tracking-tight">
              Digital Campus
              <br />
              <span className="text-slate-500">Management Portal</span>
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-10">
              Official management system for students, faculty, and administration of Kiwalan National High School.
            </p>

            {/* Stats */}
            <div className="flex gap-8">
              <div className="border-l-2 border-violet-500 pl-4">
                <p className="text-2xl font-black text-white">100%</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-0.5">Digital Access</p>
              </div>
              <div className="border-l-2 border-slate-600 pl-4">
                <p className="text-2xl font-black text-white">Secure</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-0.5">Authentication</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-8 border-t border-white/10">
            <div className="flex items-center gap-3">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Seal_of_the_Department_of_Education_of_the_Philippines.png/960px-Seal_of_the_Department_of_Education_of_the_Philippines.png"
                alt="DepEd"
                className="w-6 h-6 object-contain opacity-60"
              />
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Department of Education</span>
            </div>
            <p className="text-[9px] font-medium text-slate-600 uppercase tracking-widest">&copy; 2026 KNHS</p>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Mobile Header */}
        <div className="lg:hidden px-6 py-4 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 flex items-center justify-center">
              <img src="/icons/school-logo-source.png" alt="KNHS" className="w-5 h-5 object-contain" />
            </div>
            <h1 className="text-xs font-black text-slate-900 uppercase tracking-wider">KNHS Portal</h1>
          </div>
          <button onClick={() => navigate('/')} className="text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:text-slate-600 transition-colors">Back</button>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full px-6 py-12 lg:px-12">
          {/* Back link */}
          <button
            onClick={() => navigate('/')}
            className="hidden lg:inline-flex items-center gap-2 text-slate-400 hover:text-slate-700 text-[10px] font-bold uppercase tracking-widest mb-10 transition-colors group"
          >
            <svg className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Home
          </button>

          {/* Header */}
          <div className="mb-8">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Sign In</h3>
            <p className="text-slate-500 text-sm">{role.subtitle}</p>
          </div>

          {/* Role Tabs */}
          <div className="flex border border-slate-200 mb-8">
            {Object.entries(ROLES).map(([key, r]) => (
              <button
                key={key}
                onClick={() => setLoginType(key)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 text-[10px] font-black uppercase tracking-wider transition-all border-b-2 ${
                  loginType === key
                    ? `${r.theme.text} border-current bg-slate-50`
                    : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50/50'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d={r.icon} />
                </svg>
                {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Identifier */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-0.5">{role.identifierLabel}</label>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-700 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder={role.identifierPlaceholder}
                  className={`w-full bg-white border ${fieldErrors.identifier ? 'border-red-300' : 'border-slate-200'} ${role.theme.border} py-3.5 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${role.theme.ring} transition-all`}
                />
              </div>
              {fieldErrors.identifier && <p className="text-[10px] font-bold text-red-500 ml-0.5">{fieldErrors.identifier}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-0.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Password</label>
                <button
                  type="button"
                  onClick={handleForgotClick}
                  className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-700 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={`w-full bg-white border ${fieldErrors.password ? 'border-red-300' : 'border-slate-200'} ${role.theme.border} py-3.5 pl-10 pr-11 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${role.theme.ring} transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.05 10.05 0 014.13-4.13m4.13-4.13A10.05 10.05 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.05 10.05 0 01-1.127 2.127m-4.13-4.13A3 3 0 1112 12c.164 0 .324-.013.48-.039" /><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M3 3l18 18" /></svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && <p className="text-[10px] font-bold text-red-500 ml-0.5">{fieldErrors.password}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full ${role.theme.bg} text-white font-black uppercase tracking-[0.2em] py-4 text-xs flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 transition-opacity mt-2`}
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  Sign In
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </>
              )}
            </button>
          </form>

          {/* Features */}
          <div className="mt-10 pt-6 border-t border-slate-100">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Portal Features</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {role.features.slice(0, 3).map((f, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="w-1 h-1 bg-slate-300" />
                  <span className="text-[10px] font-semibold text-slate-500">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
