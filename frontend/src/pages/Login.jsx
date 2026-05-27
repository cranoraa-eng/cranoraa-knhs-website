import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginRequest, clearSession } from '../utils/auth';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const BinaryBackground = ({ isAdmin }) => {
  if (!isAdmin) return null;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 select-none">
      <div className="flex justify-around w-full h-full text-[10px] font-mono text-emerald-500/30 whitespace-nowrap overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div 
            key={i} 
            className="flex flex-col animate-matrix-rain"
            style={{ 
              animationDuration: `${15 + Math.random() * 20}s`,
              animationDelay: `${-Math.random() * 20}s` 
            }}
          >
            {[...Array(50)].map((_, j) => (
              <span key={j} className="my-1">
                {Math.round(Math.random()).toString()}
              </span>
            ))}
          </div>
        ))}
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes matrix-rain {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.03; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.05; transform: translate(-50%, -50%) scale(1.05); }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.1); }
          50% { box-shadow: 0 0 40px rgba(16, 185, 129, 0.2); }
        }
        .animate-matrix-rain {
          animation: matrix-rain linear infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
        .admin-glass-glow {
          animation: glow-pulse 4s ease-in-out infinite;
        }
      `}} />
    </div>
  );
};

const SystemMonitor = ({ isAdmin, uptime, serverLoad, securityEvents }) => {
  if (!isAdmin) return null;
  return (
    <div className="space-y-6 mt-8 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl backdrop-blur-sm animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Live Monitor</span>
        </div>
        <span className="text-[10px] font-mono text-emerald-500/50 uppercase">Kiwalan-Net v4.0</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">Uptime</p>
          <p className="text-sm font-mono text-emerald-400 font-bold">{uptime}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">Server Load</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-emerald-900/30 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${serverLoad}%` }} />
            </div>
            <span className="text-[10px] font-mono text-emerald-400">{serverLoad}%</span>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-emerald-500/10 space-y-2">
        <p className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">Security Log</p>
        <div className="space-y-1">
          {securityEvents.map((event, i) => (
            <div key={i} className="flex items-center gap-2 text-[10px] font-mono text-emerald-500/60">
              <span className="text-emerald-500 opacity-50 text-[8px] tracking-tighter">[{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}]</span>
              <span className="truncate">{event}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Login = () => {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState('student');
  
  // Real-time states for Admin UI
  const [uptime, setUptime] = useState('00:00:00');
  const [serverLoad, setServerLoad] = useState(0);
  const [securityEvents, setSecurityEvents] = useState([]);

  const isAdmin = loginType === 'admin';

  // Admin Real-time simulation
  useEffect(() => {
    if (!isAdmin) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const diff = Date.now() - startTime;
      const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setUptime(`${h}:${m}:${s}`);
      setServerLoad(Math.floor(Math.random() * 15) + 5);
    }, 1000);

    const events = [
      'Encrypted tunnel established',
      'Database node 01 synced',
      'Security firewall active',
      'Intrusion detection online',
      'Port 443 handshake complete'
    ];
    setSecurityEvents(events.sort(() => Math.random() - 0.5).slice(0, 3));

    return () => clearInterval(interval);
  }, [isAdmin]);

  const roleConfig = {
    student: {
      color: 'violet',
      accent: 'indigo',
      title: 'Your academic journey, all in one place.',
      desc: 'Access grades, attendance, announcements, messages, and more — all from your personalized portal.',
      features: ['Real-time grade tracking', 'Attendance monitoring', 'Direct teacher messaging', 'Instant announcements', 'Learning materials access'],
      stats: [{ val: '1,200+', label: 'Students' }, { val: '80+', label: 'Faculty' }, { val: '5,000+', label: 'Graduates' }, { val: '20+', label: 'Years' }],
      identifierLabel: 'Student ID or Email',
      identifierPlaceholder: 'Student ID or email address',
      loadingTitle: 'Preparing Portal',
      loadingDesc: 'Fetching your academic records...',
      loadingIcon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
    },
    teacher: {
      color: 'emerald',
      accent: 'teal',
      title: 'Empowering educators, inspiring students.',
      desc: 'Manage classes, record grades, track attendance, and communicate with parents and students seamlessly.',
      features: ['Class management tools', 'Automated grading system', 'Parent-teacher communication', 'Curriculum planning', 'Resource sharing'],
      stats: [{ val: '45+', label: 'Sections' }, { val: '98%', label: 'Efficiency' }, { val: '24/7', label: 'Support' }, { val: 'Top', label: 'Ranked' }],
      identifierLabel: 'Teacher Email',
      identifierPlaceholder: 'teacher@knhs.edu.ph',
      loadingTitle: 'Initializing Classes',
      loadingDesc: 'Loading classroom management tools...',
      loadingIcon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'
    },
    parent: {
      color: 'blue',
      accent: 'sky',
      title: 'Partnering in your child\'s success.',
      desc: 'Stay informed about your child\'s academic progress, attendance, and school activities in real-time.',
      features: ['Grade notifications', 'Attendance alerts', 'Direct teacher contact', 'School event calendar', 'Performance analytics'],
      stats: [{ val: '2,000+', label: 'Parents' }, { val: '100%', label: 'Visibility' }, { val: 'Secure', label: 'Access' }, { val: 'Global', label: 'Standard' }],
      identifierLabel: 'Parent Email',
      identifierPlaceholder: 'parent@email.com',
      loadingTitle: 'Connecting Home',
      loadingDesc: 'Syncing child progress data...',
      loadingIcon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
    },
    admin: {
      color: 'emerald',
      accent: 'green',
      title: 'System Administration Control Panel',
      desc: 'High-level management of school infrastructure, user accounts, and security protocols.',
      features: ['Full system oversight', 'Advanced security logs', 'Database management', 'Administrative reports', 'User permission control'],
      stats: [{ val: 'V3.2', label: 'Version' }, { val: 'Active', label: 'Status' }, { val: 'Secure', label: 'Layer' }, { val: '24/7', label: 'Uptime' }],
      identifierLabel: 'Admin Email or ID',
      identifierPlaceholder: 'admin@knhs.edu.ph',
      loadingTitle: 'Initializing Core',
      loadingDesc: 'Verifying administrative clearance...',
      loadingIcon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
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
      
      // Strict role verification: Ensure the account's actual role matches the selected login UI
      // This prevents e.g. an admin from logging in through the student portal UI
      if (userData.role && userData.role !== loginType) {
         setLoading(false);
         // Clear the session since it was saved by loginRequest
         clearSession();
         
         Swal.fire({
          icon: 'error',
          title: 'Unauthorized Portal',
          text: `This account is registered as a ${userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}. Please use the correct portal to sign in.`,
          confirmButtonColor: isAdmin ? '#10b981' : '#9333ea',
        });
        return;
      }

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
    <div className={`min-h-screen flex relative transition-colors duration-1000 ${isAdmin ? 'bg-[#020617]' : 'bg-slate-50'}`}>
      <BinaryBackground isAdmin={isAdmin} />
      {/* Branding Panel Academic Identity (Admin Only) */}
      {isAdmin && (
        <div className="absolute left-1/4 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none select-none animate-pulse-slow">
          <img src="/icons/school-logo-source.png" alt="" className="w-[500px] h-[500px] object-contain grayscale invert" />
        </div>
      )}

      {/* Secret Admin Trigger */}
      <button 
        onClick={() => setLoginType(isAdmin ? 'student' : 'admin')}
        className={`fixed top-2 right-2 z-50 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 opacity-10 hover:opacity-100 ${isAdmin ? 'text-emerald-500 rotate-180' : 'text-slate-200 hover:text-slate-400'}`}
        title={isAdmin ? "Back to Student Portal" : "Admin Portal"}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </button>

      {/* Loading Overlay */}
      {loading && (
        <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center backdrop-blur-md transition-all duration-500 ${isAdmin ? 'bg-black/90' : 'bg-[#0F071E]/80'}`}>
          <div className="relative mb-8">
            <div className={`absolute -inset-4 bg-${currentRole.color}-600 rounded-full blur-xl opacity-40 animate-pulse`} />
            <div className={`relative w-24 h-24 rounded-full flex items-center justify-center p-1 shadow-2xl transition-all duration-500 ${isAdmin ? 'bg-slate-900 border border-emerald-500/30' : 'bg-white'}`}>
              <div className={`absolute inset-0 rounded-full border-4 ${isAdmin ? 'border-emerald-900/30 border-t-emerald-500' : `border-${currentRole.color}-100 border-t-${currentRole.color}-600`} animate-spin`} />
              <div className={`relative w-full h-full rounded-full flex items-center justify-center ${isAdmin ? 'bg-emerald-500/10' : `bg-${currentRole.color}-50`}`}>
                <svg className={`w-10 h-10 transition-colors duration-500 ${isAdmin ? 'text-emerald-500' : `text-${currentRole.color}-600`}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={currentRole.loadingIcon} />
                </svg>
              </div>
            </div>
          </div>
          <div className="text-center space-y-2 max-w-xs px-6">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter animate-pulse">{currentRole.loadingTitle}</h3>
            <p className={`text-[10px] font-bold text-${currentRole.color}-400 uppercase tracking-[0.3em] leading-relaxed`}>
              {currentRole.loadingDesc}
            </p>
            {isAdmin && (
              <div className="mt-4 flex flex-col items-center gap-1">
                <div className="w-32 h-1 bg-emerald-900/30 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 animate-progress" style={{ width: '0%' }} />
                </div>
                <span className="text-[8px] font-mono text-emerald-500/50 uppercase tracking-[0.2em]">Executing System Handshake</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Left panel (branding) — hidden on mobile ── */}
      <div className={`hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden transition-all duration-1000 ${isAdmin ? 'bg-black border-r border-emerald-500/10' : 'bg-[#0f0720]'}`}>
        <BinaryBackground isAdmin={isAdmin} />
        {/* Grid texture */}
        <div className={`absolute inset-0 ${isAdmin ? 'opacity-[0.08]' : 'opacity-[0.04]'}`} 
          style={{ 
            backgroundImage: isAdmin 
              ? 'radial-gradient(#10b981 0.5px, transparent 0.5px)' 
              : 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', 
            backgroundSize: isAdmin ? '30px 30px' : '50px 50px' 
          }} 
        />
        
        {/* Glow accents */}
        <div className={`absolute top-0 right-0 w-80 h-80 bg-${currentRole.color}-600/15 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none transition-all duration-1000 ${isAdmin ? 'opacity-30' : ''}`} />
        <div className={`absolute bottom-0 left-0 w-64 h-64 bg-${currentRole.accent}-600/10 rounded-full -translate-x-1/2 translate-y-1/2 blur-3xl pointer-events-none transition-all duration-1000`} />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className={`h-10 w-10 rounded-full overflow-hidden border p-1 flex items-center justify-center transition-all duration-500 ${isAdmin ? 'border-emerald-500/50 bg-slate-900 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'border-white/10 bg-white'}`}>
            <img src="/icons/school-logo-source.png" alt="KNHS" className="h-full w-full object-contain" />
          </div>
          <div>
            <p className="text-sm font-black text-white leading-none tracking-tight">KIWALAN NHS</p>
            <p className={`text-[10px] text-${currentRole.color}-400 font-bold mt-0.5 uppercase tracking-widest transition-colors duration-500`}>
              {isAdmin ? 'System Core' : `${loginType} Portal`}
            </p>
          </div>
        </div>

        {/* Center content */}
        <div className="relative space-y-8 max-w-lg">
          <div className="animate-fade-in" key={loginType}>
            <div className="flex items-center gap-3 mb-4">
              <p className={`text-xs font-bold text-${currentRole.color}-400 uppercase tracking-widest transition-colors duration-500`}>
                {isAdmin ? 'Root Authorization' : 'Welcome Back'}
              </p>
              {isAdmin && (
                <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[8px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">
                  Level 5 Access
                </div>
              )}
            </div>
            <h2 className={`text-4xl font-black leading-tight mb-4 whitespace-pre-line transition-colors duration-500 ${isAdmin ? 'text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'text-white'}`}>
              {currentRole.title}
            </h2>
            <p className="text-slate-400 leading-relaxed text-sm">
              {currentRole.desc}
            </p>
          </div>

          {isAdmin ? (
            <SystemMonitor 
              isAdmin={isAdmin} 
              uptime={uptime} 
              serverLoad={serverLoad} 
              securityEvents={securityEvents} 
            />
          ) : (
            <>
              {/* Feature list */}
              <div className="space-y-3" key={`features-${loginType}`}>
                {currentRole.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className={`w-5 h-5 rounded-full bg-${currentRole.color}-500/20 border border-${currentRole.color}-500/30 flex items-center justify-center flex-shrink-0 transition-colors duration-500`}>
                      <svg className={`w-3 h-3 text-${currentRole.color}-400 transition-colors duration-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className={`text-sm transition-colors duration-500 ${isAdmin ? 'text-emerald-500/70' : 'text-slate-400'}`}>{f}</span>
                  </div>
                ))}
              </div>
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 pt-2" key={`stats-${loginType}`}>
                {currentRole.stats.map((s, i) => (
                  <div key={i} className={`border rounded-xl p-3 animate-fade-in transition-all duration-500 ${isAdmin ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/5 border-white/10'}`} style={{ animationDelay: `${(i + 5) * 100}ms` }}>
                    <p className={`text-lg font-black transition-colors duration-500 ${isAdmin ? 'text-emerald-500' : 'text-white'}`}>{s.val}</p>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Bottom link */}
        <div className="relative">
          <button onClick={() => { window.location.href = '/'; }} className={`inline-flex items-center gap-2 text-sm transition-colors font-medium ${isAdmin ? 'text-emerald-500/50 hover:text-emerald-400' : 'text-slate-500 hover:text-white'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Terminal Logout
          </button>
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className={`flex-1 flex flex-col items-center justify-center px-4 py-12 sm:px-8 transition-colors duration-1000 ${isAdmin ? 'bg-[#020617]' : 'bg-slate-50'}`}>
        <BinaryBackground isAdmin={isAdmin} />
        {/* Mobile back link */}
        <div className="w-full max-w-sm mb-6 lg:hidden">
          <button
            onClick={() => { window.location.href = '/'; }}
            className={`inline-flex items-center gap-1.5 text-sm transition-colors font-medium ${isAdmin ? 'text-emerald-500/50 hover:text-emerald-400' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Website
          </button>
        </div>

        <div className={`w-full max-w-sm p-8 rounded-[2rem] transition-all duration-1000 relative group ${
          isAdmin 
            ? 'bg-slate-900/40 backdrop-blur-2xl border border-emerald-500/20 shadow-[0_0_80px_-15px_rgba(16,185,129,0.15)] ring-1 ring-white/5 admin-glass-glow' 
            : 'bg-transparent'
        }`}>
          {/* Form inner shadow/glow for Admin */}
          {isAdmin && (
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-emerald-500/[0.05] to-transparent pointer-events-none" />
          )}

          {/* Header */}
          <div className="mb-8 relative">
            <div className="flex items-center gap-3 mb-6 lg:hidden">
              <div className={`h-9 w-9 rounded-full overflow-hidden border flex items-center justify-center shadow-sm p-1 transition-all duration-500 ${isAdmin ? 'border-emerald-500/50 bg-slate-900 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'border-slate-200 bg-white'}`}>
                <img src="/icons/school-logo-source.png" alt="KNHS" className="h-full w-full object-contain" />
              </div>
              <div>
                <p className={`text-sm font-black leading-none transition-colors duration-500 ${isAdmin ? 'text-white' : 'text-slate-900'}`}>KIWALAN NHS</p>
                <p className={`text-[10px] font-bold mt-0.5 uppercase tracking-widest transition-colors duration-500 ${isAdmin ? 'text-emerald-500' : `text-${currentRole.color}-600`}`}>
                  {isAdmin ? 'System Core' : `${loginType} Portal`}
                </p>
              </div>
            </div>
            <h1 className={`text-2xl font-black mb-1 transition-colors duration-500 ${isAdmin ? 'text-white tracking-tight' : 'text-slate-900'}`}>
              {isAdmin ? 'System Authorization' : 'Sign in'}
            </h1>
            <p className={`text-sm transition-colors duration-500 ${isAdmin ? 'text-slate-400 font-medium' : 'text-slate-500'}`}>
              {isAdmin ? 'Secure access to administrative tools' : `Access your KNHS ${loginType} account`}
            </p>
          </div>

          {/* Login type toggle */}
          {!isAdmin && (
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
          )}

          {isAdmin && (
            <div className="mb-6 flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Secured Terminal Active</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Identifier */}
            <div>
              <label htmlFor="identifier" className={`block text-xs font-bold mb-1.5 uppercase tracking-wider transition-colors duration-500 ${isAdmin ? 'text-emerald-500/70' : 'text-slate-600'}`}>
                {currentRole.identifierLabel}
              </label>
              <input
                id="identifier"
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={e => { setIdentifier(e.target.value); setFieldErrors(p => ({ ...p, identifier: '' })); }}
                placeholder={currentRole.identifierPlaceholder}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                  isAdmin 
                    ? 'bg-slate-900 border-emerald-500/20 text-white placeholder:text-slate-600 focus:ring-emerald-500/20 focus:border-emerald-500' 
                    : `bg-white border-slate-200 text-slate-900 focus:ring-${currentRole.color}-500/20 focus:border-${currentRole.color}-500`
                } ${fieldErrors.identifier ? 'border-red-400 bg-red-50' : ''}`}
              />
              {fieldErrors.identifier && <p className="text-red-500 text-[11px] mt-1 font-medium">{fieldErrors.identifier}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className={`text-xs font-bold uppercase tracking-wider transition-colors duration-500 ${isAdmin ? 'text-emerald-500/70' : 'text-slate-600'}`}>Password</label>
                {!isAdmin && <Link to="/forgot-password" className={`text-xs font-semibold text-${currentRole.color}-600 hover:text-${currentRole.color}-700 transition-colors`}>Forgot password?</Link>}
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: '' })); }}
                  placeholder="••••••••"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                    isAdmin 
                      ? 'bg-slate-900 border-emerald-500/20 text-white placeholder:text-slate-600 focus:ring-emerald-500/20 focus:border-emerald-500 pr-10' 
                      : `bg-white border-slate-200 text-slate-900 focus:ring-${currentRole.color}-500/20 focus:border-${currentRole.color}-500 pr-10`
                  } ${fieldErrors.password ? 'border-red-400 bg-red-50' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${isAdmin ? 'text-emerald-500/30 hover:text-emerald-500' : 'text-slate-400 hover:text-slate-600'}`}
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
              className={`w-full py-3 px-4 rounded-xl text-sm font-bold shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 ${
                isAdmin 
                  ? 'bg-emerald-600 text-white shadow-emerald-900/40 hover:bg-emerald-500' 
                  : `bg-${currentRole.color}-600 text-white shadow-${currentRole.color}-900/20 hover:bg-${currentRole.color}-700`
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {isAdmin ? 'Executing...' : 'Signing in...'}
                </>
              ) : (
                <>
                  {isAdmin ? 'Override & Authorize' : `Sign in as ${loginType.charAt(0).toUpperCase() + loginType.slice(1)}`}
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
