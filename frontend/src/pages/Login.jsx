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
        // Resend logic
        Swal.fire({
          title: 'Sending...',
          text: 'Please wait while we send a new verification code.',
          allowOutsideClick: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        try {
          await api.post('/resend-otp/', { email: userEmail, type: 'signup' });
          Swal.fire({
            icon: 'success',
            title: 'Code Sent!',
            text: 'A new verification code has been sent to your email.',
            confirmButtonColor: '#9333ea',
          }).then(() => {
            navigate('/verify-otp', { state: { email: userEmail } });
          });
        } catch (resendErr) {
          Swal.fire({
            icon: 'error',
            title: 'Failed to Send',
            text: resendErr.response?.data?.error || 'Failed to resend code.',
            confirmButtonColor: '#9333ea',
          });
        }
      }
    });
  };

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Already logged in — go straight to dashboard
  useEffect(() => {
    if (user) {
      if (user.must_change_password) {
        navigate('/force-password-change', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  const validate = () => {
    const errors = {};
    if (!identifier.trim()) errors.identifier = 'Student ID or Email is required';
    if (!password) errors.password = 'Password is required';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const userData = await loginRequest(identifier, password);
      
      if (userData?.must_change_password) {
        signIn(userData);
        toast.success('Please update your password to continue.');
        navigate('/force-password-change', { replace: true });
        return;
      }

      signIn(userData);
      toast.success('Welcome back!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setLoading(false);
      const status = err.response?.status;
      const code = err.response?.data?.code;
      const message = err.response?.data?.error;

      if (status === 403 && code === 'not_verified') {
        handleUnverifiedUser(email);
      } else if (status === 403 && code === 'not_approved') {
        Swal.fire({
          icon: 'info',
          title: 'Pending Approval',
          text: 'Your account is pending admin approval. You will be notified once approved.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#9333ea',
        });

      } else if (status === 401) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid Credentials',
          text: 'The email or password you entered is incorrect.',
          confirmButtonText: 'Try Again',
          confirmButtonColor: '#9333ea',
        });

      } else if (!err.response) {
        Swal.fire({
          icon: 'error',
          title: 'Cannot Reach Server',
          text: 'Make sure the backend is running and try again.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#9333ea',
        });

      } else {
        Swal.fire({
          icon: 'error',
          title: 'Login Failed',
          text: message || 'An unexpected error occurred. Please try again.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#9333ea',
        });
      }
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-8">
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-violet-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
        </div>
      </div>

      <div className="relative w-full max-w-sm rounded-3xl border border-white/20 bg-white/95 p-6 md:p-8 shadow-2xl backdrop-blur-xl">
        {/* Back to Website Link */}
        <Link 
          to="/" 
          className="absolute -top-12 left-0 text-white/70 hover:text-white flex items-center gap-2 text-[12px] font-bold transition-colors group"
        >
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Website
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-4 shadow-sm border border-slate-100 overflow-hidden">
            <img 
              src="https://plain-apac-prod-public.komododecks.com/202605/18/u3t1lOolacFscP6v1Bq8/image.png" 
              alt="KNHS Logo" 
              className="w-12 h-12 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1 tracking-tight">Welcome Back</h1>
          <p className="text-[13px] text-slate-500 font-medium">Sign in to your KNHS Portal</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Email or ID */}
          <div>
            <label htmlFor="identifier" className="block text-slate-700 text-[12px] font-bold mb-1.5 ml-1 uppercase tracking-wider">
              Student ID or Email
            </label>
            <input
              id="identifier"
              type="text"
              autoComplete="username"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                setFieldErrors((prev) => ({ ...prev, identifier: '' }));
              }}
              placeholder="Student ID or Email"
              className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all ${
                fieldErrors.identifier ? 'border-red-500 bg-red-50' : 'border-slate-200'
              }`}
            />
            {fieldErrors.identifier && (
              <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold">{fieldErrors.identifier}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5 ml-1">
              <label htmlFor="password" className="block text-slate-700 text-[12px] font-bold uppercase tracking-wider">
                Password
              </label>
              <Link to="/forgot-password" size="sm" className="text-purple-600 hover:text-purple-700 font-bold text-[11px] hover:underline">
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, password: '' }));
                }}
                placeholder="••••••••"
                className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all ${
                  fieldErrors.password ? 'border-red-500 bg-red-50' : 'border-slate-200'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268-2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold">{fieldErrors.password}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-purple-100 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="text-center text-slate-500 font-bold mt-8 text-[12px]">
          Student without an account? Contact your administrator.
        </p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes blob {
          0%   { transform: translate(0, 0) scale(1); }
          33%  { transform: translate(30px, -50px) scale(1.1); }
          66%  { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0, 0) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      ` }} />
    </div>
  );
};

export default Login;
