import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await api.post('/password-reset/', { email });
      toast.success('Reset code sent! Please check your inbox and SPAM folder.');
      navigate('/reset-password', { state: { email } });
    } catch (err) {
      console.error('Password reset error:', err);
      const errorMsg = err.response?.data?.detail || err.response?.data?.error || 'Failed to send reset code.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-8">
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-violet-500 rounded-full mix-blend-multiply filter blur-3xl" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl" />
        </div>
      </div>

      <div className="relative w-full max-w-sm rounded-3xl border border-white/20 bg-white/95 p-6 md:p-8 shadow-2xl backdrop-blur-xl">
        {/* Back to Login Link */}
        <Link 
          to="/login" 
          className="absolute -top-12 left-0 text-white/70 hover:text-white flex items-center gap-2 text-[12px] font-bold transition-colors group"
        >
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Login
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
          <h1 className="text-2xl font-bold text-slate-900 mb-1 tracking-tight uppercase">Reset Password</h1>
          <p className="text-[11px] text-slate-500 font-black uppercase tracking-widest">Enter your email to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-700 text-[10px] font-black mb-1.5 ml-1 uppercase tracking-[0.2em]">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="juan.delacruz@example.com"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all placeholder:text-slate-300"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-purple-100 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.2em]"
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              'Send Reset Code'
            )}
          </button>
        </form>

        <p className="text-center text-slate-400 font-bold mt-8 text-[10px] uppercase tracking-widest leading-relaxed">
          Need help? Contact the <span className="text-indigo-500">ICT Office</span> or your teacher.
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
