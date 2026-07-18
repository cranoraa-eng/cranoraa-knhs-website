import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateStoredUser, updateTokens } from '../utils/auth';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Input, Button } from '../components/ui';

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
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-sm bg-white rounded-xl border border-slate-200 shadow-sm p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-violet-100 rounded-full mb-4">
            <img src="/icons/school-logo-source.png" alt="KNHS Logo" className="w-10 h-10 object-contain" loading="lazy" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Security Policy</h1>
          <p className="text-xs text-slate-500 mt-1">Mandatory Password Update</p>
        </div>
        <div className="p-3 bg-violet-50 border border-violet-200 rounded-lg mb-6">
          <p className="text-xs text-violet-700 leading-relaxed">
            To keep your account secure, please set a new password.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="New Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter new password" required />
          <Input label="Confirm Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" required />
          <Button type="submit" variant="primary" disabled={loading} loading={loading} className="w-full">
            Update Password
          </Button>
        </form>
        <p className="text-center text-[11px] text-slate-400 mt-6">Kiwalan National High School</p>
      </div>
    </div>
  );
};

export default ForcePasswordChange;
