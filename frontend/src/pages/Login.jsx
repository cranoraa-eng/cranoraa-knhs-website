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
    panelTitle: 'Student Portal',
    panelDesc: 'Access your academic records, track your attendance, download learning materials, and stay updated with school announcements.',
    panelFeatures: [
      { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Grade Tracking' },
      { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', label: 'Attendance' },
      { icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', label: 'Learning Materials' },
      { icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', label: 'Messaging' },
    ],
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
    panelTitle: 'Faculty Portal',
    panelDesc: 'Manage your classes, input grades, take attendance, upload learning materials, and communicate with students and parents.',
    panelFeatures: [
      { icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', label: 'Grade Management' },
      { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', label: 'Attendance' },
      { icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12', label: 'Upload Materials' },
      { icon: 'M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z', label: 'Communication' },
    ],
    theme: {
      text: 'text-purple-800',
      bg: 'bg-purple-900',
      hover: 'hover:bg-purple-800',
      border: 'border-purple-300 focus:border-purple-600',
      ring: 'focus:ring-purple-500/20',
      accent: 'bg-purple-600',
    }
  },
  parent: {
    label: 'Parent',
    subtitle: 'Parent Portal',
    identifierLabel: 'Parent Email or ID',
    identifierPlaceholder: 'Enter your email or ID',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    features: ['Monitor child progress', 'View grades & attendance', 'School announcements', 'Direct messaging'],
    panelTitle: 'Parent Portal',
    panelDesc: "Stay connected with your child's academic journey. Monitor grades, track attendance, and communicate with teachers.",
    panelFeatures: [
      { icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z', label: 'Monitor Progress' },
      { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'View Grades' },
      { icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', label: 'Announcements' },
      { icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', label: 'Message Teachers' },
    ],
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
    label: 'Admin',
    subtitle: 'System Administration',
    identifierLabel: 'Admin Email or ID',
    identifierPlaceholder: 'admin@knhs.edu.ph',
    icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
    features: ['Full system oversight', 'User management', 'Enrollment control', 'Analytics & reports'],
    panelTitle: 'Administration',
    panelDesc: 'Full system oversight. Manage users, control enrollment, view analytics, and maintain system security.',
    panelFeatures: [
      { icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', label: 'System Settings' },
      { icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', label: 'User Management' },
      { icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label: 'Enrollment Control' },
      { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Analytics & Reports' },
    ],
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
      <div className="hidden lg:flex lg:w-[48%] bg-slate-900 relative overflow-hidden">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="relative z-10 flex flex-col justify-between w-full p-12">
          {/* Header with logo */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center">
              <img src="/icons/school-logo-source.png" alt="KNHS" className="w-10 h-10 object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">Kiwalan National</h1>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">High School</p>
            </div>
          </div>

          {/* Main content - Role specific */}
          <div className="flex-1 flex flex-col justify-center max-w-lg">
            <div className="mb-4">
              <span className="text-purple-400 text-xs font-semibold uppercase tracking-widest">{role.panelTitle}</span>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
              {role.label === 'Student' && 'Your Academic\nJourney Starts Here'}
              {role.label === 'Teacher' && 'Empowering\nEducators'}
              {role.label === 'Parent' && 'Stay Connected\nWith Your Child'}
              {role.label === 'Admin' && 'Complete System\nControl'}
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-10">
              {role.panelDesc}
            </p>

            {/* Role specific features */}
            <div className="space-y-3">
              {role.panelFeatures.map((f, i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-white/5 border border-white/5">
                  <div className="w-10 h-10 bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={f.icon} />
                    </svg>
                  </div>
                  <span className="text-white text-sm font-medium">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-8 border-t border-white/10">
            <div className="flex items-center gap-3">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Seal_of_the_Department_of_Education_of_the_Philippines.png/960px-Seal_of_the_Department_of_Education_of_the_Philippines.png"
                alt="DepEd"
                className="w-7 h-7 object-contain opacity-50"
              />
              <div>
                <p className="text-slate-400 text-xs font-medium">Department of Education</p>
                <p className="text-slate-500 text-[10px]">Republic of the Philippines</p>
              </div>
            </div>
            <p className="text-slate-500 text-xs">&copy; 2026 KNHS Portal</p>
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

        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full px-6 py-10 lg:px-12">
          {/* Back link */}
          <button
            onClick={() => navigate('/')}
            className="hidden lg:inline-flex items-center gap-2 text-gray-400 hover:text-purple-900 text-xs font-medium mb-6 transition-colors group"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </button>

          {/* Header */}
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-1">Sign In</h3>
            <p className="text-gray-500 text-sm">Access your {role.subtitle.toLowerCase()}</p>
          </div>

          {/* Role Tabs */}
          <div className="grid grid-cols-4 bg-gray-100 rounded-xl p-1 mb-6">
            {Object.entries(ROLES).map(([key, r]) => (
              <button
                key={key}
                onClick={() => setLoginType(key)}
                className={`flex flex-col items-center justify-center py-2.5 px-1 text-xs font-semibold rounded-lg transition-all ${
                  loginType === key
                    ? 'bg-white text-purple-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <svg className="w-4 h-4 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={r.icon} />
                </svg>
                {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Identifier */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{role.identifierLabel}</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder={role.identifierPlaceholder}
                  className={`w-full bg-gray-50 border ${fieldErrors.identifier ? 'border-red-300 bg-red-50' : 'border-gray-200'} ${role.theme.border} rounded-lg py-3 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${role.theme.ring} transition-all`}
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
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={`w-full bg-gray-50 border ${fieldErrors.password ? 'border-red-300 bg-red-50' : 'border-gray-200'} ${role.theme.border} rounded-lg py-3 pl-10 pr-11 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${role.theme.ring} transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.05 10.05 0 014.13-4.13m4.13-4.13A10.05 10.05 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.05 10.05 0 01-1.127 2.127m-4.13-4.13A3 3 0 1112 12c.164 0 .324-.013.48-.039" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && <p className="mt-2 text-sm text-red-600">{fieldErrors.password}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full ${role.theme.bg} ${role.theme.hover} text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-900/20 hover:shadow-xl hover:shadow-purple-900/30 text-sm`}
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
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Portal Features</p>
            <div className="grid grid-cols-2 gap-2">
              {role.features.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="w-1 h-1 bg-purple-500 rounded-full" />
                  <span className="text-xs text-gray-600">{f}</span>
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