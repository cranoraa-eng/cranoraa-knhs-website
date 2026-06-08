import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import IntroScreen from '../components/IntroScreen';
import { loginRequest, clearSession } from '../utils/auth';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

// ── Role configurations ───────────────────────────────────────────────────────
const ROLES = {
  student: {
    label: 'Student',
    subtitle: 'Learner Portal',
    identifierLabel: 'Student ID or Email',
    identifierPlaceholder: 'Enter your Student ID or email',
    icon: 'M12 14l9-5-9-5-9 5 9 5zm0 7l-9-5 9-5 9 5-9 5z',
    features: ['Real-time grade tracking', 'Attendance monitoring', 'Learning materials', 'Announcements', 'Direct messaging'],
    theme: {
      primary: 'violet-600',
      primaryBg: 'bg-violet-600/20',
      text: 'text-violet-600',
      bg: 'bg-violet-600',
      ring: 'focus:ring-violet-600/5',
      border: 'group-focus-within:border-violet-600/20',
      accent: 'bg-violet-400',
      hover: 'hover:bg-violet-700',
      gradient: 'from-violet-400 to-blue-400'
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
      primary: 'blue-600',
      primaryBg: 'bg-blue-600/20',
      text: 'text-blue-600',
      bg: 'bg-blue-600',
      ring: 'focus:ring-blue-600/5',
      border: 'group-focus-within:border-blue-600/20',
      accent: 'bg-blue-400',
      hover: 'hover:bg-blue-700',
      gradient: 'from-blue-400 to-cyan-400'
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
      primary: 'indigo-600',
      primaryBg: 'bg-indigo-600/20',
      text: 'text-indigo-600',
      bg: 'bg-indigo-600',
      ring: 'focus:ring-indigo-600/5',
      border: 'group-focus-within:border-indigo-600/20',
      accent: 'bg-indigo-400',
      hover: 'hover:bg-indigo-700',
      gradient: 'from-indigo-400 to-slate-400'
    }
  },
};

// ── Login component ───────────────────────────────────────────────────────────
const Login = () => {
  const { user, signIn, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [loginType, setLoginType] = useState('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [introUser, setIntroUser] = useState(null);
  const introDestinationRef = useRef('/dashboard');
  const preventAutoRedirectRef = useRef(false);

  const role = ROLES[loginType];

  useEffect(() => {
    if (user) {
      if (preventAutoRedirectRef.current || showIntro) return;
      if (user.must_change_password) navigate('/force-password-change', { replace: true });
      else if (user.role === 'parent') navigate('/parent-dashboard', { replace: true });
      else navigate('/dashboard', { replace: true });
    }
  }, [user, navigate, showIntro]);

  // Reset fields when switching role
  useEffect(() => { setIdentifier(''); setPassword(''); setFieldErrors({}); }, [loginType]);

  const handleForgotClick = () => {
    Swal.fire({
      icon: 'info',
      title: 'Password Reset',
      text: 'Please contact the ICT coordinator for password reset.',
      confirmButtonColor: '#0f172a', // Matching the dark theme of the login button
      customClass: {
        popup: 'rounded-lg', // Matching the new "less roundy" UI
        confirmButton: 'rounded-md uppercase text-xs font-black tracking-widest px-6 py-3'
      }
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
      preventAutoRedirectRef.current = true;
      introDestinationRef.current = userData.role === 'parent' ? '/parent-dashboard' : '/dashboard';
      signIn(userData);
      await refreshUser();
      setLoading(false);
      setIntroUser(userData);
      setShowIntro(true);
    } catch (err) {
      preventAutoRedirectRef.current = false;
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
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <IntroScreen open={showIntro} user={introUser} duration={900}
        onComplete={() => { preventAutoRedirectRef.current = false; setShowIntro(false); navigate(introDestinationRef.current, { replace: true }); }} />

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left Side: Branding & Info */}
        <div className="hidden lg:flex lg:w-1/2 bg-[#0f172a] relative overflow-hidden flex-col justify-between p-12">
          {/* Background Elements */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
            <div className={`absolute top-[-10%] right-[-10%] w-[500px] h-[500px] ${role.theme.primaryBg} rounded-full blur-[120px] transition-colors duration-500`} />
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-12">
              <img src="/icons/school-logo-source.png" alt="KNHS Logo" className="w-16 h-16 object-contain drop-shadow-2xl" />
              <div>
                <h1 className="text-xl font-black text-white uppercase tracking-tight leading-none">Kiwalan</h1>
                <p className={`text-xs font-bold ${role.theme.text} uppercase tracking-widest mt-1 transition-colors duration-500`}>National High School</p>
              </div>
            </div>

            <div className="max-w-md">
              <h2 className="text-5xl font-black text-white mb-6 leading-[1.1]">
                Digital Campus <span className={`text-transparent bg-clip-text bg-gradient-to-r ${role.theme.gradient} transition-all duration-500`}>Portal</span>
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed mb-10">
                Official management system for students, faculty, and administration of Kiwalan National High School.
              </p>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-lg">
                  <p className="text-2xl font-black text-white">100%</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Digital Access</p>
                </div>
                <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-lg">
                  <p className={`text-2xl font-black ${role.theme.text} transition-colors duration-500`}>Secure</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Authentication</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between pt-8 border-t border-white/10">
            <div className="flex items-center gap-3">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Seal_of_the_Department_of_Education_of_the_Philippines.png/960px-Seal_of_the_Department_of_Education_of_the_Philippines.png"
                alt="DepEd"
                className="w-8 h-8 object-contain"
              />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Department of Education</span>
            </div>
            <p className="text-[10px] font-medium text-slate-600 uppercase tracking-widest">© 2026 KNHS Portal</p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Mobile Header */}
          <div className="lg:hidden p-6 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-3">
              <img src="/icons/school-logo-source.png" alt="KNHS" className="w-10 h-10 object-contain" />
              <h1 className="text-sm font-black text-slate-900 uppercase">KNHS Portal</h1>
            </div>
            <button onClick={() => navigate('/')} className="text-slate-500 text-xs font-bold uppercase tracking-widest">Back</button>
          </div>

          <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full px-6 py-12 lg:py-0">
            <div className="mb-10 text-center lg:text-left">
              <button 
                onClick={() => navigate('/')} 
                className={`hidden lg:inline-flex items-center gap-2 text-slate-400 hover:${role.theme.text} text-xs font-bold uppercase tracking-widest mb-8 transition-colors group`}
              >
                <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                Return to Home
              </button>
              
              <h3 className="text-3xl font-black text-slate-900 mb-2">Portal Access</h3>
              <p className="text-slate-500 text-sm font-medium">Select your role to continue to the system.</p>
            </div>

            {/* Role Selector */}
            <div className="flex p-1 bg-slate-100 rounded-lg mb-8">
              {Object.entries(ROLES).map(([key, r]) => (
                <button
                  key={key}
                  onClick={() => setLoginType(key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${
                    loginType === key
                      ? `bg-white ${r.theme.text} shadow-sm ring-1 ring-slate-200`
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={r.icon} />
                  </svg>
                  {r.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{role.identifierLabel}</label>
                <div className="relative group">
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:${role.theme.text} transition-colors`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder={role.identifierPlaceholder}
                    className={`w-full bg-slate-50 border-2 ${fieldErrors.identifier ? 'border-red-200' : 'border-slate-100'} ${role.theme.border} group-focus-within:bg-white rounded-lg py-4 pl-12 pr-4 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 ${role.theme.ring} transition-all`}
                  />
                </div>
                {fieldErrors.identifier && <p className="text-[10px] font-bold text-red-500 ml-1">{fieldErrors.identifier}</p>}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Password</label>
                  <button 
                    type="button" 
                    onClick={handleForgotClick}
                    className={`text-[10px] font-black ${role.theme.text} uppercase tracking-widest hover:underline`}
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative group">
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:${role.theme.text} transition-colors`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full bg-slate-50 border-2 ${fieldErrors.password ? 'border-red-200' : 'border-slate-100'} ${role.theme.border} group-focus-within:bg-white rounded-lg py-4 pl-12 pr-12 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 ${role.theme.ring} transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.05 10.05 0 014.13-4.13m4.13-4.13A10.05 10.05 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.05 10.05 0 01-1.127 2.127m-4.13-4.13A3 3 0 1112 12c.164 0 .324-.013.48-.039" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg>
                    )}
                  </button>
                </div>
                {fieldErrors.password && <p className="text-[10px] font-bold text-red-500 ml-1">{fieldErrors.password}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full ${role.theme.bg} ${role.theme.hover} text-white font-black uppercase tracking-[0.2em] py-5 rounded-lg text-xs shadow-xl shadow-slate-900/10 hover:shadow-slate-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed`}
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <>
                    Sign In to Portal
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 pt-8 border-t border-slate-100">
              <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Portal Access Features</p>
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
                {role.features.slice(0, 3).map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${role.theme.accent}`} />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
