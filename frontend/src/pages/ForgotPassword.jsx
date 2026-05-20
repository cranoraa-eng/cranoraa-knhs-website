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
      toast.error(err.response?.data?.error || 'Failed to send reset code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-12">
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl" />
        </div>
      </div>

      <div className="relative w-full max-w-md rounded-[2.5rem] border border-white/10 bg-white/95 p-8 md:p-12 shadow-2xl backdrop-blur-xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl mb-6 shadow-inner border border-slate-100 overflow-hidden">
            <img 
              src="https://plain-apac-prod-public.komododecks.com/202605/18/u3t1lOolacFscP6v1Bq8/image.png" 
              alt="KNHS Logo" 
              className="w-14 h-14 object-contain"
            />
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Forgot Password</h1>
          <p className="text-slate-500 font-medium">Reset your account password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-slate-700 text-sm font-bold mb-2 ml-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="juan.delacruz@example.com"
              className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-purple-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
          >
            {loading ? 'Sending...' : 'Send Reset Code'}
          </button>
        </form>

        <div className="text-center mt-8">
          <Link to="/login" className="text-purple-600 font-bold hover:underline">
            Remember your password? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
