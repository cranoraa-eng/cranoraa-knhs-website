import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { getStoredUser } from '../utils/auth';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import api from '../utils/api';

const NavItem = ({ to, label, isActive, icon }) => (
  <Link to={to} className={`flex items-center px-4 py-3 rounded-2xl transition-all duration-200 mb-1 group ${
    isActive(to) 
      ? 'bg-white/10 text-white font-bold shadow-lg shadow-black/10' 
      : 'text-white/60 hover:bg-white/5 hover:text-white'
  }`}>
    <div className={`w-8 h-8 rounded-xl flex items-center justify-center mr-3 transition-colors ${
      isActive(to) ? 'bg-violet-500 text-white' : 'bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white/60'
    }`}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={icon} />
      </svg>
    </div>
    <span className="text-sm tracking-tight">{label}</span>
  </Link>
);

const SectionLabel = ({ label }) => (
  <div className="mt-8 mb-3 px-6">
    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{label}</p>
  </div>
);

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const user = getStoredUser();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (showNotifications && !e.target.closest('[data-notif-dropdown]')) setShowNotifications(false);
      if (showProfileMenu && !e.target.closest('[data-profile-dropdown]')) setShowProfileMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotifications, showProfileMenu]);

  const handleLogout = () => { signOut(); navigate('/login', { replace: true }); };
  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    const interval = setInterval(() => { fetchNotifications(); fetchUnreadCount(); }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const r = await api.get('/notifications/');
      setNotifications(r.data.slice(0, 8));
    } catch (err) {}
  };

  const fetchUnreadCount = async () => {
    try {
      const r = await api.get('/notifications/unread_count/');
      setUnreadCount(r.data.unread_count);
    } catch (err) {}
  };

  const markAsRead = async (id) => {
    try { await api.post(`/notifications/${id}/mark_read/`); fetchNotifications(); fetchUnreadCount(); } catch {}
  };

  const markAllAsRead = async () => {
    try { await api.post('/notifications/mark_all_read/'); fetchNotifications(); fetchUnreadCount(); } catch {}
  };

  const NOTIF_CONFIG = {
    announcement: { icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z', color: 'text-blue-500', bg: 'bg-blue-100' },
    grade:        { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', color: 'text-green-500', bg: 'bg-green-100' },
    attendance:   { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8l2 2 4-4', color: 'text-yellow-500', bg: 'bg-yellow-100' },
    default:      { icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', color: 'text-purple-500', bg: 'bg-purple-100' },
  };

  const getNotifConfig = (type) => NOTIF_CONFIG[type] || NOTIF_CONFIG.default;

  const formatTime = (dateString) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    if (m < 1440) return `${Math.floor(m / 60)}h ago`;
    if (m < 10080) return `${Math.floor(m / 1440)}d ago`;
    return new Date(dateString).toLocaleDateString();
  };

  const pageTitle = (location.pathname.split('/').pop() || 'dashboard')
    .replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ── Sidebar ── */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex h-screen w-72 transform flex-col overflow-hidden bg-[#0F172A] text-white shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] lg:sticky lg:top-0 lg:h-screen ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        
        {/* Brand Logo */}
        <div className="flex-shrink-0 px-8 py-8 flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20 rotate-3 group hover:rotate-6 transition-transform">
            <span className="text-xl font-black italic tracking-tighter">KN</span>
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight leading-none text-white">Portal</h1>
            <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mt-1">Kiwalan NHS</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-4 pb-8 scrollbar-hide">
          {/* STUDENT */}
          {user?.role === 'student' && (<>
            <SectionLabel label="Main" />
            <NavItem to="/dashboard" label="Dashboard" isActive={isActive} icon="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            <NavItem to="/profile" label="My Profile" isActive={isActive} icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            <NavItem to="/announcements" label="Announcements" isActive={isActive} icon="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            <NavItem to="/messages" label="Messages" isActive={isActive} icon="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            
            <SectionLabel label="Academics" />
            <NavItem to="/materials" label="Materials" isActive={isActive} icon="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            <NavItem to="/register-subjects" label="Subject Load" isActive={isActive} icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            <NavItem to="/student-grades" label="My Grades" isActive={isActive} icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            <NavItem to="/attendance" label="Attendance" isActive={isActive} icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8l2 2 4-4" />
            
            <SectionLabel label="Settings" />
            <NavItem to="/password-reset" label="Security" isActive={isActive} icon="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </>)}

          {/* TEACHER */}
          {user?.role === 'teacher' && (<>
            <SectionLabel label="Main" />
            <NavItem to="/dashboard" label="Dashboard" isActive={isActive} icon="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            <NavItem to="/profile" label="My Profile" isActive={isActive} icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            <NavItem to="/announcements" label="Announcements" isActive={isActive} icon="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            
            <SectionLabel label="Classroom" />
            <NavItem to="/attendance" label="Attendance" isActive={isActive} icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8l2 2 4-4" />
            <NavItem to="/materials" label="Materials" isActive={isActive} icon="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            <NavItem to="/grade-input" label="Grade Entry" isActive={isActive} icon="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </>)}

          {/* ADMIN */}
          {user?.role === 'admin' && (<>
            <SectionLabel label="Main" />
            <NavItem to="/dashboard" label="Dashboard" isActive={isActive} icon="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            
            <SectionLabel label="Management" />
            <NavItem to="/account-approvals" label="Approvals" isActive={isActive} icon="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            <NavItem to="/student-management" label="Students" isActive={isActive} icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            <NavItem to="/teachers" label="Teachers" isActive={isActive} icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            <NavItem to="/class-management" label="Classes" isActive={isActive} icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            
            <SectionLabel label="System" />
            <NavItem to="/website-content" label="Site Editor" isActive={isActive} icon="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            <NavItem to="/settings" label="Settings" isActive={isActive} icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </>)}
        </nav>

        {/* User Profile Summary (Sidebar Bottom) */}
        <div className="flex-shrink-0 p-6 border-t border-white/5 bg-black/20">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-violet-600/20">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-white">{user?.first_name} {user?.last_name}</p>
              <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col min-h-0 bg-slate-50">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/50 bg-white/80 px-4 py-4 backdrop-blur-2xl lg:px-10 transition-all duration-300">
          <div className="flex items-center gap-6">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="rounded-2xl p-2.5 text-slate-400 hover:bg-violet-50 hover:text-violet-600 lg:hidden transition-all active:scale-90">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {sidebarOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>

            {/* Title & Breadcrumbs */}
            <div className="hidden sm:block">
              <nav className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                <Link to="/dashboard" className="hover:text-violet-600 transition-colors">Portal</Link>
                <span className="mx-2 opacity-30">/</span>
                <span className="text-violet-600/60">{pageTitle}</span>
              </nav>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{pageTitle}</h1>
            </div>
          </div>

          <div className="flex items-center space-x-3 lg:space-x-6">
            {/* Notification bell */}
            <div className="relative" data-notif-dropdown>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-3 rounded-2xl transition-all duration-300 group ${showNotifications ? 'bg-violet-600 text-white shadow-lg shadow-violet-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-2.5 right-2.5 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-4 w-96 origin-top-right rounded-[2.5rem] bg-white p-2 shadow-2xl ring-1 ring-black/5 focus:outline-none animate-in fade-in zoom-in duration-200 z-50 overflow-hidden">
                  <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="text-lg font-black text-slate-900">Notifications</h3>
                    <button onClick={markAllAsRead} className="text-xs font-bold text-violet-600 hover:text-violet-700 bg-violet-50 px-3 py-1.5 rounded-full transition-colors">
                      Mark all as read
                    </button>
                  </div>
                  <div className="max-h-[480px] overflow-y-auto scrollbar-hide py-2">
                    {notifications.length === 0 ? (
                      <div className="py-12 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        </div>
                        <p className="text-slate-400 font-bold">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((n) => {
                        const config = getNotifConfig(n.type);
                        return (
                          <div 
                            key={n.id} 
                            onClick={() => markAsRead(n.id)}
                            className={`group relative flex gap-4 p-5 hover:bg-slate-50 transition-all cursor-pointer rounded-[2rem] mx-2 mb-1 ${!n.is_read ? 'bg-violet-50/50' : ''}`}
                          >
                            <div className={`flex-shrink-0 w-12 h-12 rounded-2xl ${config.bg} flex items-center justify-center ${config.color} shadow-inner transition-transform group-hover:scale-110`}>
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.icon} /></svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm leading-relaxed ${!n.is_read ? 'font-black text-slate-900' : 'text-slate-600 font-medium'}`}>{n.message}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{formatTime(n.created_at)}</p>
                            </div>
                            {!n.is_read && <div className="w-2.5 h-2.5 bg-violet-600 rounded-full mt-2 ring-4 ring-violet-100 shadow-sm" />}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative" data-profile-dropdown>
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 p-1.5 pl-4 bg-slate-50 border border-slate-200/60 rounded-2xl hover:bg-slate-100 transition-all active:scale-95 group"
              >
                <div className="hidden md:block text-right">
                  <p className="text-xs font-black text-slate-900 leading-none">{user?.first_name}</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mt-1">{user?.role}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-violet-200 group-hover:rotate-3 transition-transform">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </div>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-4 w-64 origin-top-right rounded-[2rem] bg-white p-3 shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in duration-200 z-50">
                  <div className="p-4 border-b border-slate-50 mb-2">
                    <p className="text-sm font-black text-slate-900">{user?.first_name} {user?.last_name}</p>
                    <p className="text-xs font-bold text-slate-400 mt-1 truncate">{user?.email || 'user@example.com'}</p>
                  </div>
                  <div className="space-y-1">
                    <Link to="/profile" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-violet-600 rounded-xl transition-colors">
                      <svg className="w-5 h-5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      Profile Settings
                    </Link>
                    <Link to="/" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-violet-600 rounded-xl transition-colors">
                      <svg className="w-5 h-5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                      Main Website
                    </Link>
                    <div className="h-px bg-slate-50 my-2" />
                    <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                      <svg className="w-5 h-5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-10 flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
