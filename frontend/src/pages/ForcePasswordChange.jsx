import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateStoredUser, updateTokens } from '../utils/auth';
import api from '../utils/api';
import toast from 'react-hot-toast';

const ForcePasswordChange = () => {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/force-password-change/', { password });

      // Update local storage with new access token (refresh token is in httpOnly cookie)
      if (response.data.access) {
        updateTokens(response.data.access);
      }

      // Update user state and localStorage (must_change_password is now false)
      const updatedUser = updateStoredUser({ ...user, must_change_password: false });
      signIn(updatedUser);

      toast.success('Password updated successfully!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update password');
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
            <h1 className="text-2xl font-black text-white mb-2 tracking-tight uppercase leading-none text-center">Security Policy</h1>
            <p className="text-[10px] text-violet-400 font-bold uppercase tracking-[0.2em] text-center">Mandatory Password Update</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 relative">
            <div className="p-4 bg-violet-500/10 border border-violet-500/20 rounded-2xl mb-6">
              <p className="text-[11px] text-violet-200 leading-relaxed font-medium">
                To keep your student portal account secure, our policy requires a unique password. Please set one now.
              </p>
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] font-black mb-2 ml-1 uppercase tracking-widest">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all placeholder:text-slate-600"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] font-black mb-2 ml-1 uppercase tracking-widest">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all placeholder:text-slate-600"
                required
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
                  Secure Account
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-600 font-bold text-[9px] uppercase tracking-[0.2em]">
              Kiwalan National High School • Data Privacy Protected
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForcePasswordChange;
