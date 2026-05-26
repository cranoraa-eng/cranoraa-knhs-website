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
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-12 bg-[#0F071E]">
      {/* SaaS-style Background Accents */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-violet-600/20 via-fuchsia-600/10 to-transparent rounded-full blur-[120px] -mr-64 -mt-64" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px]" />
      
      {/* Grid texture */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative w-full max-w-sm">
        {/* Back link */}
        <Link 
          to="/login" 
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 text-sm font-bold transition-colors group"
        >
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Login
        </Link>

        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl shadow-black/40 ring-1 ring-white/5 relative overflow-hidden">
           {/* Inner glow */}
           <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.05] to-transparent pointer-events-none" />

          {/* Header */}
          <div className="text-center mb-8 relative">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-6 shadow-[0_0_30px_rgba(139,92,246,0.3)] p-1.5 border-4 border-white/10">
              <img 
                src="/icons/school-logo-source.png" 
                alt="KNHS Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-2xl font-black text-white mb-2 tracking-tight uppercase leading-none">Recover Access</h1>
            <p className="text-[10px] text-violet-400 font-bold uppercase tracking-[0.2em]">Reset your portal password</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 relative">
            <div>
              <label className="block text-slate-400 text-[10px] font-black mb-2 ml-1 uppercase tracking-widest">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your registered email"
                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all placeholder:text-slate-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-violet-900/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <>
                  Send Reset Code
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-white/5 text-center">
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest leading-relaxed">
              Locked out? Contact <span className="text-violet-400">ICT Office</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
