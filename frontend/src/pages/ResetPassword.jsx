import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const ResetPassword = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [showPassword, setShowPassword] = useState(false);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
      return;
    }

    const interval = setInterval(() => {
      setTimer(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [email, navigate]);

  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        const next = [...otp];
        next[index] = '';
        setOtp(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    
    if (code.length !== 6) return toast.error('Please enter the complete 6-digit code');
    if (password.length < 8) return toast.error('Password must be at least 8 characters long');
    if (password !== confirmPassword) return toast.error('Passwords do not match');

    setLoading(true);
    try {
      await api.post('/password-reset-confirm/', { 
        email, 
        code, 
        password 
      });
      
      await Swal.fire({
        icon: 'success',
        title: 'Password Reset Successful!',
        text: 'Your password has been updated. You can now log in with your new password.',
        confirmButtonText: 'Go to Login',
        confirmButtonColor: '#9333ea',
      });
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || resending) return;
    setResending(true);
    try {
      await api.post('/password-reset/', { email });
      toast.success('New reset code sent');
      setTimer(60);
      setOtp(['', '', '', '', '', '']);
    } catch {
      toast.error('Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const isComplete = otp.every(d => d !== '') && password && confirmPassword;

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-10">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animation-delay-2000" />
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-violet-500 rounded-full mix-blend-multiply filter blur-3xl animation-delay-4000" />
        </div>
      </div>

      <div className="relative w-full max-w-md rounded-2xl border border-violet-100 bg-white p-8 shadow-2xl shadow-violet-900/20">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Reset Password</h1>
          <p className="text-gray-500 text-sm mt-1">
            Enter the code sent to <span className="font-semibold text-gray-700">{email}</span> and your new password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* OTP inputs */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Verification Code</label>
            <div className="flex justify-center gap-2" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  value={digit}
                  onChange={e => handleChange(e.target.value, index)}
                  onKeyDown={e => handleKeyDown(e, index)}
                  className={`w-11 h-12 text-center text-xl font-bold border-2 rounded-xl focus:outline-none transition-all ${
                    digit
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 text-gray-800 focus:border-purple-400'
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center justify-between mt-2 px-1">
              <div className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${timer > 0 ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`} />
                <span className="text-[10px] text-gray-400">
                  {timer > 0 ? `Expires in ${timer}s` : 'Code expired'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleResend}
                disabled={timer > 0 || resending}
                className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  timer > 0 || resending
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-purple-600 hover:text-purple-700'
                }`}
              >
                {resending ? 'Sending...' : 'Resend Code'}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-purple-500 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-1 ml-1 font-medium">Password must be at least 8 characters long</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-purple-500 transition-all text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !isComplete}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-purple-200 flex items-center justify-center gap-2"
          >
            {loading ? 'Updating Password...' : 'Reset Password'}
          </button>
        </form>

        <Link
          to="/login"
          className="block text-center mt-6 text-sm font-bold text-gray-400 hover:text-purple-600 transition-colors"
        >
          ← Back to login
        </Link>
      </div>
    </div>
  );
};

export default ResetPassword;
