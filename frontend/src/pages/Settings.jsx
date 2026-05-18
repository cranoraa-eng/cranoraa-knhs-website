import { useState, useEffect } from 'react';
import api from '../utils/api';
import { getUser } from '../utils/auth';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const Settings = () => {
  const user = getUser();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [loadingSystem, setLoadingSystem] = useState(true);

  // Profile State
  const [profileData, setProfileData] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
  });

  // Security State
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Admin System State
  const [systemSettings, setSystemSettings] = useState({
    current_quarter: '1',
    academic_year: '2025-2026',
    enrollment_open: true,
    maintenance_mode: false,
    maintenance_message: 'The portal is currently undergoing maintenance. Please check back later.'
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchSystemSettings();
    }
  }, [user]);

  const fetchSystemSettings = async () => {
    try {
      const r = await api.get('/system/settings/');
      setSystemSettings(r.data);
    } catch {
      toast.error('Failed to load system settings');
    } finally {
      setLoadingSystem(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch('/users/me/', {
        first_name: profileData.firstName,
        last_name: profileData.lastName,
      });
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSystemSave = async (updatedSettings = null) => {
    const dataToSave = updatedSettings || systemSettings;
    setLoading(true);
    try {
      await api.patch('/system/settings/', dataToSave);
      if (!updatedSettings) toast.success('System settings saved');
    } catch (err) {
      console.error('System settings save error:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to save system settings';
      toast.error(msg);
      // Revert local state on failure
      if (updatedSettings) fetchSystemSettings();
    } finally {
      setLoading(false);
    }
  };

  const toggleMaintenance = async (val) => {
    const updated = { ...systemSettings, maintenance_mode: val };
    setSystemSettings(updated);
    // Auto-save toggle immediately
    await handleSystemSave(updated);
    toast.success(`Maintenance mode ${val ? 'enabled' : 'disabled'}`);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (securityData.newPassword !== securityData.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    setLoading(true);
    try {
      await api.post('/users/change_password/', {
        current_password: securityData.currentPassword,
        new_password: securityData.newPassword,
      });
      setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile Information', icon: '👤' },
    { id: 'security', label: 'Security & Password', icon: '🔒' },
    ...(user?.role === 'admin' ? [{ id: 'system', label: 'Academic System', icon: '🏫' }] : []),
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Account Settings</h1>
          <p className="text-slate-500 font-medium">Manage your profile, security, and portal preferences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-4 space-y-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${
                activeTab === tab.id
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-200'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
          <div className="p-8">
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileSave} className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 rounded-3xl bg-violet-100 flex items-center justify-center text-violet-600 text-3xl font-black">
                    {user?.first_name?.[0]}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{user?.full_name}</h3>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{user?.role} Account</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={e => setProfileData({...profileData, firstName: e.target.value})}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-violet-500/5 outline-none font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={e => setProfileData({...profileData, lastName: e.target.value})}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-violet-500/5 outline-none font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={profileData.email}
                    className="w-full px-5 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed font-medium"
                  />
                  <p className="text-[10px] text-slate-400 font-bold italic mt-1">Contact administration to change your email.</p>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full md:w-auto px-10 py-4 bg-violet-600 text-white font-black text-sm rounded-2xl hover:bg-violet-700 shadow-xl shadow-violet-100 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {loading ? 'Saving Changes...' : 'Save Profile Updates'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'security' && (
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl mb-6">
                  <div className="flex gap-3">
                    <span className="text-xl">🛡️</span>
                    <div>
                      <h4 className="text-sm font-bold text-amber-900">Security Recommendation</h4>
                      <p className="text-xs text-amber-700 font-medium mt-1">Use a unique password with at least 8 characters including numbers and symbols to keep your school records safe.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Password</label>
                    <input
                      type="password"
                      required
                      value={securityData.currentPassword}
                      onChange={e => setSecurityData({...securityData, currentPassword: e.target.value})}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-violet-500/5 outline-none font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                    <input
                      type="password"
                      required
                      value={securityData.newPassword}
                      onChange={e => setSecurityData({...securityData, newPassword: e.target.value})}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-violet-500/5 outline-none font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={securityData.confirmPassword}
                      onChange={e => setSecurityData({...securityData, confirmPassword: e.target.value})}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-violet-500/5 outline-none font-medium"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full md:w-auto px-10 py-4 bg-slate-900 text-white font-black text-sm rounded-2xl hover:bg-black shadow-xl shadow-slate-200 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'system' && user?.role === 'admin' && (
              <div className="space-y-8">
                {loadingSystem ? (
                  <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Quarter</label>
                        <select
                          value={systemSettings.current_quarter}
                          onChange={e => setSystemSettings({...systemSettings, current_quarter: e.target.value})}
                          className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700"
                        >
                          <option value="1">1st Quarter</option>
                          <option value="2">2nd Quarter</option>
                          <option value="3">3rd Quarter</option>
                          <option value="4">4th Quarter</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Academic Year</label>
                        <input
                          type="text"
                          value={systemSettings.academic_year}
                          onChange={e => setSystemSettings({...systemSettings, academic_year: e.target.value})}
                          className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">Online Enrollment</h4>
                          <p className="text-xs text-slate-500 font-medium">Allow students to register for subjects</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={systemSettings.enrollment_open} onChange={e => setSystemSettings({...systemSettings, enrollment_open: e.target.checked})} className="sr-only peer" />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                        </label>
                      </div>

                      <div className="space-y-4 p-5 bg-rose-50 rounded-2xl border border-rose-100 relative overflow-hidden">
                        {loading && (
                          <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-bold text-rose-900">Maintenance Mode</h4>
                            <p className="text-xs text-rose-700 font-medium">Temporarily disable portal access for users</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={systemSettings.maintenance_mode}
                              onChange={e => toggleMaintenance(e.target.checked)}
                              className="sr-only peer"
                              disabled={loading}
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                          </label>
                        </div>
                        {systemSettings.maintenance_mode && (
                          <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                            <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">Maintenance Message</label>
                            <textarea
                              value={systemSettings.maintenance_message}
                              onChange={e => setSystemSettings({...systemSettings, maintenance_message: e.target.value})}
                              rows={2}
                              className="w-full px-4 py-2 bg-white/50 border border-rose-200 rounded-xl outline-none text-sm font-medium text-rose-900"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={() => handleSystemSave()}
                        disabled={loading}
                        className="w-full md:w-auto px-10 py-4 bg-violet-600 text-white font-black text-sm rounded-2xl hover:bg-violet-700 shadow-xl shadow-violet-100 transition-all active:scale-95"
                      >
                        {loading ? 'Saving...' : 'Save System Config'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl mb-6">
                  <div className="flex gap-3">
                    <span className="text-xl">📢</span>
                    <div>
                      <h4 className="text-sm font-bold text-blue-900">Notification Channels</h4>
                      <p className="text-xs text-blue-700 font-medium mt-1">Choose how you want to be alerted about new grades, announcements, and messages.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { id: 'n1', label: 'Email Alerts', desc: 'New grades and official announcements' },
                    { id: 'n2', label: 'In-Portal Messages', desc: 'Chat notifications and friend requests' },
                    { id: 'n3', label: 'Browser Notifications', desc: 'Real-time alerts when the portal is open' },
                  ].map(n => (
                    <div key={n.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:border-violet-100 transition-all">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">{n.label}</h4>
                        <p className="text-xs text-slate-500 font-medium">{n.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
