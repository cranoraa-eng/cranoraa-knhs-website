import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyOtp, resendOtp, isAuthenticated } from '../utils/auth';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const VerifyOTP = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (isAuthenticated()) { navigate('/dashboard'); return; }
    if (!email) { navigate('/login'); return; }

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

    setLoading(true);
    try {
      await verifyOtp(email, code);
      await Swal.fire({
        icon: 'success',
        title: 'Email Verified!',
        text: 'Your account is now pending admin approval. You will be notified once approved.',
        confirmButtonText: 'Back to Login',
        confirmButtonColor: '#9333ea',
      });
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid or expired code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || resending) return;
    setResending(true);
    try {
      await resendOtp(email);
      toast.success('New verification code sent');
      setTimer(60);
      setOtp(['', '', '', '', '', '']);
    } catch {
      toast.error('Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const isComplete = otp.every(d => d !== '');

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-10">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-violet-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
        </div>
      </div>

      <div className="relative w-full max-w-md rounded-2xl border border-violet-100 bg-white p-10 shadow-2xl shadow-violet-900/20 text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">Verify Your Email</h1>
        <p className="text-gray-500 text-sm mb-4">
          Enter the 6-digit code sent to{' '}
          <span className="font-semibold text-gray-700">{email}</span>
        </p>
        <p className="mb-6 text-xs text-amber-600 font-semibold bg-amber-50 py-1.5 px-3 rounded-full inline-block">
          ⚠️ Don't see it? Check your <b>Spam folder</b>
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* OTP inputs */}
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
                className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl focus:outline-none transition-all ${
                  digit
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-300 text-gray-800 focus:border-purple-400'
                }`}
              />
            ))}
          </div>

          {/* Timer */}
          <div className="flex items-center justify-center gap-1">
            <div className={`w-2 h-2 rounded-full ${timer > 0 ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`} />
            <span className="text-xs text-gray-400">
              {timer > 0 ? `Code expires in ${timer}s` : 'Code expired'}
            </span>
          </div>

          <button
            type="submit"
            disabled={loading || !isComplete}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Verifying...
              </>
            ) : 'Verify Email'}
          </button>

          <p className="text-sm text-gray-500">
            Didn't receive the code?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={timer > 0 || resending}
              className={`font-semibold transition-colors ${
                timer > 0 || resending
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-purple-600 hover:text-purple-700'
              }`}
            >
              {resending ? 'Sending...' : timer > 0 ? `Resend in ${timer}s` : 'Resend Code'}
            </button>
          </p>
        </form>

        <button
          onClick={() => navigate('/login')}
          className="mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Back to login
        </button>
      </div>

      <style>{`
        @keyframes blob {
          0%   { transform: translate(0, 0) scale(1); }
          33%  { transform: translate(30px, -50px) scale(1.1); }
          66%  { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0, 0) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
};

export default VerifyOTP;
