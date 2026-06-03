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
  },
  teacher: {
    label: 'Teacher',
    subtitle: 'Faculty Portal',
    identifierLabel: 'Teacher Email',
    identifierPlaceholder: 'teacher@knhs.edu.ph',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    features: ['Grade input & management', 'Class attendance', 'Upload materials', 'Post announcements', 'Student communication'],
  },
  admin: {
    label: 'Administrator',
    subtitle: 'System Administration',
    identifierLabel: 'Admin Email or ID',
    identifierPlaceholder: 'admin@knhs.edu.ph',
    icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
    features: ['Full system oversight', 'User management', 'Enrollment control', 'Analytics & reports', 'Security & audit logs'],
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
    <div className="min-h-screen bg-purple-50 flex flex-col">
      <IntroScreen open={showIntro} user={introUser} duration={900}
        onComplete={() => { preventAutoRedirectRef.current = false; setShowIntro(false); navigate(introDestinationRef.current, { replace: true }); }} />

      {/* ── Official DepEd Header ── */}
      <div className="bg-white border-b-4 border-purple-600 py-4">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-3 items-center">
            {/* Left: DepEd Seal */}
            <div className="flex justify-start">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Seal_of_the_Department_of_Education_of_the_Philippines.png/960px-Seal_of_the_Department_of_Education_of_the_Philippines.png"
                alt="DepEd Seal"
                className="w-16 h-16 object-contain"
                onError={e => { e.target.onerror = null; e.target.src = '/icons/school-logo-source.png'; }}
              />
            </div>
            {/* Center: School Name */}
            <div className="text-center">
              <p className="text-[9px] font-bold text-gray-600 uppercase tracking-wider">REPUBLIKA NG PILIPINAS</p>
              <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wide mt-0.5">KAGAWARAN NG EDUKASYON</p>
              <h1 className="text-base font-black text-purple-800 uppercase tracking-tight mt-0.5">KIWALAN NATIONAL HIGH SCHOOL</h1>
              <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">ILIGAN CITY</p>
            </div>
            {/* Right: School Logo */}
            <div className="flex justify-end">
              <img src="/icons/school-logo-source.png" alt="KNHS Logo" className="w-16 h-16 object-contain" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Purple nav strip ── */}
      <div className="bg-[#5e2a84] py-2 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <p className="text-white text-xs font-bold uppercase tracking-widest">KNHS Portal — Official Access</p>
          <button onClick={() => navigate('/')} className="text-purple-200 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Website
          </button>
        </div>
      </div>

      {/* ── Role selector tabs ── */}
      <div className="bg-white border-b-2 border-purple-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex">
            {Object.entries(ROLES).map(([key, r]) => (
              <button key={key} onClick={() => setLoginType(key)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-black uppercase tracking-wide border-b-4 transition-all ${
                  loginType === key
                    ? 'border-purple-600 text-purple-700 bg-purple-50'
                    : 'border-transparent text-gray-500 hover:text-purple-600 hover:border-purple-300'
                }`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={r.icon} />
                </svg>
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 flex items-center justify-center py-10 px-4">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-2xl overflow-hidden shadow-2xl border-2 border-purple-300">

          {/* Left panel — info */}
          <div className="bg-[#5e2a84] p-10 flex flex-col justify-between relative overflow-hidden">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 pointer-events-none opacity-5" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            <div className="relative">
              {/* Role badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full mb-8">
                <svg className="w-4 h-4 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={role.icon} />
                </svg>
                <span className="text-purple-100 text-xs font-black uppercase tracking-widest">{role.subtitle}</span>
              </div>

              <h2 className="text-3xl font-black text-white mb-2 uppercase leading-tight">
                Welcome to<br />KNHS Portal
              </h2>
              <p className="text-purple-200 text-sm mb-8 leading-relaxed">
                Kiwalan National High School's official {role.label.toLowerCase()} portal. Sign in with your credentials to access your account.
              </p>

              {/* Features */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-purple-300 uppercase tracking-widest mb-4">Portal Features</p>
                {role.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-white/20 border border-white/30 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm text-purple-100">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom logos */}
            <div className="relative flex items-center gap-4 mt-10 pt-6 border-t border-white/20">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Seal_of_the_Department_of_Education_of_the_Philippines.png/960px-Seal_of_the_Department_of_Education_of_the_Philippines.png"
                alt="DepEd"
                className="w-10 h-10 object-contain opacity-80"
                onError={e => { e.target.onerror = null; e.target.src = '/icons/school-logo-source.png'; }}
              />
              <div>
                <p className="text-[9px] text-purple-300 font-bold uppercase tracking-wider">Department of Education</p>
                <p className="text-[9px] text-purple-400 uppercase tracking-wider">Republika ng Pilipinas</p>
              </div>
            </div>
          </div>

          {/* Right panel — form */}
          <div className="bg-white p-10 flex flex-col justify-center">
            {/* Form header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 border-2 border-purple-200 flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={role.icon} />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-black text-purple-800 uppercase">{role.label} Sign In</h2>
                  <p className="text-xs text-gray-500">{role.subtitle}</p>
                </div>
              </div>
              <div className="h-1 bg-purple-600 rounded-full" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Identifier field */}
              <div>
                <label className="block text-[11px] font-black text-purple-700 uppercase tracking-widest mb-1.5">
                  {role.identifierLabel}
                </label>
                <input
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={e => { setIdentifier(e.target.value); setFieldErrors(p => ({ ...p, identifier: '' })); }}
                  placeholder={role.identifierPlaceholder}
                  className={`w-full px-4 py-3 rounded-xl border-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all placeholder:text-gray-400 ${fieldErrors.identifier ? 'border-red-400 bg-red-50' : 'border-purple-200 bg-purple-50/30 hover:border-purple-300'}`}
                />
                {fieldErrors.identifier && <p className="text-red-500 text-[11px] mt-1 font-medium">{fieldErrors.identifier}</p>}
              </div>

              {/* Password field */}
              <div>
                <label className="block text-[11px] font-black text-purple-700 uppercase tracking-widest mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: '' })); }}
                    placeholder="Enter your password"
                    className={`w-full px-4 py-3 rounded-xl border-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all pr-11 placeholder:text-gray-400 ${fieldErrors.password ? 'border-red-400 bg-red-50' : 'border-purple-200 bg-purple-50/30 hover:border-purple-300'}`}
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-600 transition-colors">
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
                {fieldErrors.password && <p className="text-red-500 text-[11px] mt-1 font-medium">{fieldErrors.password}</p>}
                <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Forgot password? Contact the school administrator.
                </p>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-sm uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-200 flex items-center justify-center gap-2 mt-2">
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In as {role.label}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </>
                )}
              </button>
            </form>

            {/* Footer note */}
            <div className="mt-8 pt-6 border-t-2 border-purple-100">
              <p className="text-[10px] text-gray-500 text-center leading-relaxed">
                This is an official portal of <span className="font-bold text-purple-700">Kiwalan National High School</span>.<br />
                Unauthorized access is strictly prohibited.
              </p>
            </div>
          </div>
        </div>

        {/* Enrollment CTA below card */}
        <div className="absolute bottom-6 left-0 right-0 hidden md:flex justify-center">
          <p className="text-xs text-gray-500">
            Not yet enrolled?{' '}
            <a href="/enroll" className="text-purple-600 font-bold hover:text-purple-700 underline">Apply for enrollment here</a>
          </p>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="bg-[#5e2a84] py-3 px-4 text-center">
        <p className="text-purple-200 text-[10px] uppercase tracking-widest">
          © {new Date().getFullYear()} Kiwalan National High School — Department of Education — Republic of the Philippines
        </p>
      </div>
    </div>
  );
};

export default Login;
