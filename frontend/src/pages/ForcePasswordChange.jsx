import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateStoredUser, updateTokens } from '../utils/auth';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

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
      
      // Update local storage with new tokens if returned
      if (response.data.access) {
        updateTokens(response.data.access, response.data.refresh);
      }
      
      // Update user state and localStorage (must_change_password is now false)
      const updatedUser = updateStoredUser({ ...user, must_change_password: false });
      signIn(updatedUser);
      
      toast.success('Password updated successfully!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setLoading(false);
      toast.error(err.response?.data?.error || 'Failed to update password');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        </div>
      </div>

      <div className="relative w-full max-w-sm rounded-3xl border border-white/20 bg-white/95 p-6 md:p-8 shadow-2xl backdrop-blur-xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1 tracking-tight">Security Update</h1>
          <p className="text-[13px] text-slate-500 font-medium">Please set a new password for your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-700 text-[12px] font-bold mb-1.5 ml-1 uppercase tracking-wider">
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 text-[12px] font-bold mb-1.5 ml-1 uppercase tracking-wider">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-purple-100 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForcePasswordChange;
