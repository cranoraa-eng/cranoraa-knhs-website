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
    features: ['Real-time grade tracking', 'Attendance monitoring', 'Learning materials', 'Announcements'],
    theme: {
      text: 'text-purple-800',
      bg: 'bg-purple-900',
      hover: 'hover:bg-purple-800',
      border: 'border-purple-300 focus:border-purple-600',
      ring: 'focus:ring-purple-500/20',
      accent: 'bg-purple-600',
    }
  },
  teacher: {
    label: 'Teacher',
    subtitle: 'Faculty Portal',
    identifierLabel: 'Teacher Email',
    identifierPlaceholder: 'teacher@knhs.edu.ph',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    features: ['Grade input & management', 'Class attendance', 'Upload materials', 'Student communication'],
    theme: {
      text: 'text-purple-800',
      bg: 'bg-purple-900',
      hover: 'hover:bg-purple-800',
      border: 'border-purple-300 focus:border-purple-600',
      ring: 'focus:ring-purple-500/20',
      accent: 'bg-purple-600',
    }
  },
  admin: {
    label: 'Administrator',
    subtitle: 'System Administration',
    identifierLabel: 'Admin Email or ID',
    identifierPlaceholder: 'admin@knhs.edu.ph',
    icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
    features: ['Full system oversight', 'User management', 'Enrollment control', 'Analytics & reports'],
    theme: {
      text: 'text-purple-800',
      bg: 'bg-purple-900',
      hover: 'hover:bg-purple-800',
      border: 'border-purple-300 focus:border-purple-600',
      ring: 'focus:ring-purple-500/20',
      accent: 'bg-purple-600',
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
      confirmButtonColor: '#581c87',
      customClass: { popup: 'rounded-lg', confirmButton: 'rounded-lg uppercase text-xs font-bold tracking-widest px-6 py-3' }
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
        Swal.fire({ icon: 'error', title: 'Wrong Portal', text: `This account is registered as a ${userData.role}. Please use the correct portal.`, confirmButtonColor: '#581c87' });
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
        Swal.fire({ icon: 'info', title: 'Pending Approval', text: 'Your account is pending admin approval.', confirmButtonColor: '#581c87' });
      } else if (status === 403) {
        Swal.fire({ icon: 'error', title: 'Account Suspended', text: message || 'Contact the administrator.', confirmButtonColor: '#dc2626' });
      } else if (status === 401) {
        Swal.fire({ icon: 'error', title: 'Invalid Credentials', text: 'The ID or password you entered is incorrect.', confirmButtonText: 'Try Again', confirmButtonColor: '#581c87' });
      } else if (status === 429) {
        Swal.fire({ icon: 'warning', title: 'Too Many Attempts', text: err.response?.data?.detail || 'Please wait before trying again.', confirmButtonColor: '#581c87' });
      } else if (!err.response) {
        Swal.fire({ icon: 'error', title: 'Cannot Reach Server', text: 'Make sure the backend is running and try again.', confirmButtonColor: '#581c87' });
      } else {
        Swal.fire({ icon: 'error', title: 'Login Failed', text: message || 'An unexpected error occurred.', confirmButtonColor: '#581c87' });
      }
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-gray-50">
      {/* Left Side: School Branding */}
      <div className="hidden lg:flex lg:w-[48%] bg-gradient-to-br from-purple-900 via-purple-800 to-slate-900 relative overflow-hidden">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col justify-between w-full p-12">
          {/* Header with logo */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <img src="/icons/school-logo-source.png" alt="KNHS" className="w-12 h-12 object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Kiwalan National</h1>
              <p className="text-purple-200 text-sm font-medium">High School</p>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col justify-center max-w-lg">
            <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
              Welcome to your
              <span className="block text-purple-200">Digital Campus</span>
            </h2>
            <p className="text-purple-200/80 text-lg leading-relaxed mb-12">
              Access your grades, attendance, materials, and communicate with your school community — all in one secure portal.
            </p>

            {/* Feature cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm border border-white/10 p-5 rounded-xl">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-white font-semibold text-sm mb-1">Secure Access</h3>
                <p className="text-purple-200/60 text-xs">Protected authentication system</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/10 p-5 rounded-xl">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-white font-semibold text-sm mb-1">Real-time Updates</h3>
                <p className="text-purple-200/60 text-xs">Instant notifications & grades</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-8 border-t border-white/10">
            <div className="flex items-center gap-3">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Seal_of_the_Department_of_Education_of_the_Philippines.png/960px-Seal_of_the_Department_of_Education_of_the_Philippines.png"
                alt="DepEd"
                className="w-8 h-8 object-contain opacity-70"
              />
              <div>
                <p className="text-white/80 text-xs font-medium">Department of Education</p>
                <p className="text-purple-200/50 text-[10px]">Republic of the Philippines</p>
              </div>
            </div>
            <p className="text-purple-200/40 text-xs">&copy; 2026 KNHS Portal</p>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Mobile Header */}
        <div className="lg:hidden px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-900 rounded-lg flex items-center justify-center">
              <img src="/icons/school-logo-source.png" alt="KNHS" className="w-7 h-7 object-contain" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900">KNHS Portal</h1>
              <p className="text-gray-500 text-xs">Digital Campus</p>
            </div>
          </div>
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full px-6 py-12 lg:px-16">
          {/* Back link */}
          <button
            onClick={() => navigate('/')}
            className="hidden lg:inline-flex items-center gap-2 text-gray-400 hover:text-purple-900 text-sm font-medium mb-10 transition-colors group"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </button>

          {/* Header */}
          <div className="mb-8">
            <h3 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h3>
            <p className="text-gray-500">Access your {role.subtitle.toLowerCase()}</p>
          </div>

          {/* Role Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-8">
            {Object.entries(ROLES).map(([key, r]) => (
              <button
                key={key}
                onClick={() => setLoginType(key)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 text-sm font-semibold rounded-lg transition-all ${
                  loginType === key
                    ? 'bg-white text-purple-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={r.icon} />
                </svg>
                {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Identifier */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{role.identifierLabel}</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder={role.identifierPlaceholder}
                  className={`w-full bg-gray-50 border ${fieldErrors.identifier ? 'border-red-300 bg-red-50' : 'border-gray-200'} ${role.theme.border} rounded-xl py-4 pl-12 pr-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${role.theme.ring} transition-all`}
                />
              </div>
              {fieldErrors.identifier && <p className="mt-2 text-sm text-red-600">{fieldErrors.identifier}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">Password</label>
                <button
                  type="button"
                  onClick={handleForgotClick}
                  className="text-sm text-purple-700 hover:text-purple-900 font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={`w-full bg-gray-50 border ${fieldErrors.password ? 'border-red-300 bg-red-50' : 'border-gray-200'} ${role.theme.border} rounded-xl py-4 pl-12 pr-12 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${role.theme.ring} transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.05 10.05 0 014.13-4.13m4.13-4.13A10.05 10.05 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.05 10.05 0 01-1.127 2.127m-4.13-4.13A3 3 0 1112 12c.164 0 .324-.013.48-.039" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && <p className="mt-2 text-sm text-red-600">{fieldErrors.password}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full ${role.theme.bg} ${role.theme.hover} text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-900/20 hover:shadow-xl hover:shadow-purple-900/30`}
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  Sign In
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </>
              )}
            </button>
          </form>

          {/* Features */}
          <div className="mt-10 pt-8 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Portal Features</p>
            <div className="grid grid-cols-2 gap-3">
              {role.features.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                  <span className="text-sm text-gray-600">{f}</span>
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