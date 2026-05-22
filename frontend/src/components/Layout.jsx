import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { getStoredUser } from '../utils/auth';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useState, useEffect } from 'react';
import api from '../utils/api';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import Maintenance from '../pages/Maintenance';

const NavItem = ({ to, label, isActive, icon }) => (
  <Link to={to} className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-150 mb-0.5 text-sm ${isActive(to) ? 'bg-[#9F7AEA] text-white font-semibold shadow-sm' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}>
    <svg className="w-4 h-4 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
    </svg>
    <span className="truncate">{label}</span>
  </Link>
);

const SectionLabel = ({ label }) => (
  <div className="mt-5 mb-1.5 px-3">
    <p className="text-[10px] font-bold text-purple-400/70 uppercase tracking-widest">{label}</p>
  </div>
);

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { notifications, setNotifications, unreadCount, setUnreadCount, realtimeConnected, isPolling } = useNotifications();
  const user = getStoredUser();
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (showNotifications && !e.target.closest('[data-notif-dropdown]')) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotifications]);

  const handleLogout = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You will be logged out of your session.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#9333ea',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, sign me out!',
      cancelButtonText: 'Stay logged in',
      background: '#ffffff',
      borderRadius: '2rem',
      customClass: {
        popup: 'rounded-[2rem]',
        confirmButton: 'rounded-xl px-6 py-3 font-bold',
        cancelButton: 'rounded-xl px-6 py-3 font-bold'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        signOut();
        navigate('/login', { replace: true });
        toast.success('Logged out successfully');
      }
    });
  };
  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    // Initial fetch of notifications
    const fetchInitial = async () => {
      try {
        const r = await api.get('/notifications/');
        setNotifications(r.data.slice(0, 20));
        
        const countRes = await api.get('/notifications/unread_count/');
        setUnreadCount(countRes.data.unread_count);
      } catch (err) {
        console.warn('Initial notifications fetch failed', err);
      }
    };
    
    fetchInitial();
  }, []);

  const markAsRead = async (id) => {
    try { 
      await api.post(`/notifications/${id}/mark_read/`); 
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllAsRead = async () => {
    try { 
      await api.post('/notifications/mark_all_read/'); 
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const NOTIF_CONFIG = {
    announcement: { icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z', color: 'text-blue-500', bg: 'bg-blue-100' },
    grade:        { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', color: 'text-green-500', bg: 'bg-green-100' },
    attendance:   { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8l2 2 4-4', color: 'text-yellow-500', bg: 'bg-yellow-100' },
    fee:          { icon: 'M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zM3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm12 7a3 3 0 11-6 0 3 3 0 016 0z', color: 'text-red-500', bg: 'bg-red-100' },
    system:       { icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-purple-500', bg: 'bg-purple-100' },
    default:      { icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', color: 'text-slate-500', bg: 'bg-slate-100' },
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
    <div className="h-screen overflow-hidden bg-gradient-to-b from-slate-100 via-slate-50 to-violet-50/40">
      <div className="flex h-full">

        {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* ── Sidebar ── */}
        <aside className={`fixed inset-y-0 left-0 z-50 flex h-screen w-72 transform flex-col overflow-hidden border-r border-white/10 bg-[#2D1B4D] text-white shadow-2xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>

          {/* Logo Section */}
          <div className="flex items-center gap-3 px-6 py-8">
            <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md p-2 flex items-center justify-center border border-white/10 shadow-xl shadow-black/20">
              <img 
                src="https://plain-apac-prod-public.komododecks.com/202605/18/u3t1lOolacFscP6v1Bq8/image.png" 
                alt="KNHS Logo" 
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tighter leading-none">KIWALAN</span>
              <span className="text-[10px] font-bold text-violet-300 uppercase tracking-[0.2em] mt-1">High School</span>
            </div>
          </div>

          {/* Profile */}
          <div className="flex-shrink-0 border-b border-white/10 p-6 pt-2">
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full border-4 border-white/20 bg-white/15">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold">{user?.first_name} {user?.last_name}</h2>
              <p className="mt-1 text-xs capitalize text-violet-200">{user?.role}</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="mt-4 flex-1 overflow-y-auto px-3 pb-4">

            {/* STUDENT */}
            {user?.role === 'student' && (<>
              <NavItem to="/dashboard"         label="Dashboard"       isActive={isActive} icon="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              <NavItem to="/notifications"     label="Notifications"   isActive={isActive} icon="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              <NavItem to="/profile"           label="My Profile"      isActive={isActive} icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              <NavItem to="/announcements"     label="Announcements"   isActive={isActive} icon="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              <NavItem to="/messages"          label="Messages"        isActive={isActive} icon="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              <SectionLabel label="Academics" />
              <NavItem to="/materials"         label="Learning Materials" isActive={isActive} icon="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              <NavItem to="/register-subjects" label="Subject Load"    isActive={isActive} icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              <NavItem to="/student-grades"    label="My Grades"       isActive={isActive} icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              <NavItem to="/attendance"        label="My Attendance"   isActive={isActive} icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8l2 2 4-4" />
              <SectionLabel label="School Life" />
              <NavItem to="/class-members"     label="My Classroom"    isActive={isActive} icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              <NavItem to="/portal-calendar"   label="Calendar"        isActive={isActive} icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              <NavItem to="/password-reset"    label="Change Password" isActive={isActive} icon="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </>)}

            {/* TEACHER */}
            {user?.role === 'teacher' && (<>
              <NavItem to="/dashboard"         label="Dashboard"       isActive={isActive} icon="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              <NavItem to="/notifications"     label="Notifications"   isActive={isActive} icon="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              <NavItem to="/profile"           label="My Profile"      isActive={isActive} icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              <NavItem to="/announcements"        label="Announcements"        isActive={isActive} icon="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              <NavItem to="/messages"             label="Messages"             isActive={isActive} icon="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              <SectionLabel label="Classroom" />
              <NavItem to="/my-classes"           label="My Classes"           isActive={isActive} icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              <NavItem to="/portal-calendar"      label="Calendar"             isActive={isActive} icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              <NavItem to="/attendance"           label="Attendance"           isActive={isActive} icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8l2 2 4-4" />
              <NavItem to="/analytics"            label="Analytics"            isActive={isActive} icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              <NavItem to="/materials"            label="Learning Materials"   isActive={isActive} icon="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              <SectionLabel label="Grading" />
              <NavItem to="/grade-input"          label="Grade Input"          isActive={isActive} icon="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              <NavItem to="/grade-management"     label="Grade Management"     isActive={isActive} icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              <SectionLabel label="System" />
              <NavItem to="/password-reset"       label="Change Password"      isActive={isActive} icon="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </>)}

            {/* ADMIN */}
            {user?.role === 'admin' && (<>
              <NavItem to="/dashboard"             label="Dashboard"          isActive={isActive} icon="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              <NavItem to="/notifications"         label="Notifications"      isActive={isActive} icon="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              <NavItem to="/announcements"         label="Announcements"      isActive={isActive} icon="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              <NavItem to="/messages"              label="Messages"           isActive={isActive} icon="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              <SectionLabel label="School Setup" />
              <NavItem to="/portal-calendar"       label="Calendar"           isActive={isActive} icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              <NavItem to="/materials"             label="Learning Materials" isActive={isActive} icon="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              <NavItem to="/class-management"      label="Class Management"   isActive={isActive} icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              <NavItem to="/subjects"              label="Subjects"           isActive={isActive} icon="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              <NavItem to="/subject-assignment"    label="Subject Assignment" isActive={isActive} icon="M4 6h16M4 10h16M4 14h16M4 18h16" />
              <NavItem to="/student-enrollment"    label="Student Enrollment" isActive={isActive} icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              <SectionLabel label="Grading" />
              <NavItem to="/grade-input"           label="Grade Input"        isActive={isActive} icon="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              <NavItem to="/grade-management"      label="Grade Management"   isActive={isActive} icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              <NavItem to="/grade-distribution"    label="Grade Analytics"    isActive={isActive} icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              <SectionLabel label="People" />
              <NavItem to="/moderation"            label="Message Moderation" isActive={isActive} icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              <NavItem to="/analytics"             label="System Analytics"   isActive={isActive} icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              <NavItem to="/teachers"              label="Teacher Management" isActive={isActive} icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              <NavItem to="/student-management"    label="Student Management" isActive={isActive} icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              <NavItem to="/enrollment-management" label="Enrollment Mgmt"    isActive={isActive} icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              <SectionLabel label="Attendance" />
              <NavItem to="/attendance"            label="Attendance"         isActive={isActive} icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8l2 2 4-4" />
              <SectionLabel label="System" />
              <NavItem to="/audit-logs"            label="Audit Logs"         isActive={isActive} icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              <NavItem to="/backups"               label="Backups"            isActive={isActive} icon="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              <NavItem to="/website-content"       label="Mini Website Editor" isActive={isActive} icon="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              <NavItem to="/settings"              label="Settings"           isActive={isActive} icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </>)}
          </nav>

          {/* Bottom actions */}
          <div className="flex-shrink-0 border-t border-white/10 p-4">
            <Link to="/" className="mb-2 flex w-full items-center justify-center rounded-lg border-2 border-white/30 px-4 py-2 text-sm font-medium text-white hover:bg-white/5 hover:border-white/50 transition-all">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Visit Website
            </Link>
            <button onClick={handleLogout} className="flex w-full items-center justify-center rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/10">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 flex flex-col min-h-0">
          {/* Top bar */}
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/60 bg-white/70 px-4 py-3 backdrop-blur-xl lg:px-8">
            <div className="flex items-center gap-4 lg:gap-8">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="rounded-xl p-2 text-slate-500 hover:bg-violet-50 hover:text-violet-600 lg:hidden transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {sidebarOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                </svg>
              </button>

              {/* Title & Breadcrumbs */}
              <div className="hidden sm:block">
                <nav className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                  <Link to="/dashboard" className="hover:text-violet-500 transition-colors">Portal</Link>
                  <svg className="w-3 h-3 mx-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                  <span className="text-slate-500">{pageTitle}</span>
                </nav>
                <h1 className="text-xl lg:text-2xl font-black text-slate-800 tracking-tight">{pageTitle}</h1>
              </div>

              {/* Mobile Title */}
              <h1 className="text-lg font-bold text-slate-800 sm:hidden">{pageTitle}</h1>
            </div>

            {/* Middle Section: Search Bar (Desktop) */}
            <div className="hidden lg:flex flex-1 max-w-md mx-8">
              <div className="relative w-full group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-violet-500 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input 
                  type="text" 
                  placeholder="Search portal..." 
                  className="w-full pl-10 pr-4 py-2 bg-slate-100/50 border border-transparent rounded-xl text-sm focus:bg-white focus:border-violet-200 focus:ring-4 focus:ring-violet-500/5 transition-all outline-none"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 lg:space-x-4">
              {/* Notification bell */}
              <div className="relative" data-notif-dropdown>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)} 
                  className={`relative rounded-xl p-2.5 transition-all duration-200 ${showNotifications ? 'bg-violet-100 text-violet-700 shadow-inner' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white"></span>
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 z-50 mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#2D1B4D] to-[#4B2D7F] text-white">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <h3 className="font-semibold text-sm">Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${realtimeConnected ? 'bg-green-400' : isPolling ? 'bg-amber-400 animate-pulse' : 'bg-red-400'}`}></div>
                          <span className="text-[10px] text-purple-200 font-bold uppercase tracking-tight">
                            {realtimeConnected ? 'Realtime' : isPolling ? 'Backup Polling' : 'Offline'}
                          </span>
                        </div>
                        {unreadCount > 0 && (
                          <button onClick={markAllAsRead}
                            className="text-xs text-purple-200 hover:text-white font-medium transition-colors">
                            Mark all read
                          </button>
                        )}
                      </div>
                    </div>

                    {/* List */}
                    <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                          <svg className="w-10 h-10 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                          <p className="text-sm">You're all caught up!</p>
                        </div>
                      ) : notifications.map(n => {
                        const cfg = getNotifConfig(n.notification_type);
                        return (
                          <div key={n.id}
                            onClick={() => { if (!n.is_read) markAsRead(n.id); if (n.link) { navigate(n.link); setShowNotifications(false); } }}
                            className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-slate-50 ${!n.is_read ? 'bg-violet-50/60' : ''}`}>
                            {/* Icon */}
                            <div className={`w-9 h-9 rounded-full ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                              <svg className={`w-4 h-4 ${cfg.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cfg.icon} />
                              </svg>
                            </div>
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm leading-tight ${!n.is_read ? 'font-semibold text-slate-800' : 'font-medium text-slate-700'}`}>
                                {n.title}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                              <p className="text-xs text-slate-400 mt-1">{formatTime(n.created_at)}</p>
                            </div>
                            {/* Unread dot */}
                            {!n.is_read && (
                              <div className="w-2 h-2 rounded-full bg-violet-600 flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate-100 px-4 py-2.5 bg-slate-50 flex items-center justify-between">
                      <Link to="/notifications" onClick={() => setShowNotifications(false)}
                        className="text-xs text-violet-600 hover:text-violet-800 font-bold uppercase tracking-widest transition-colors">
                        View All
                      </Link>
                      <button onClick={() => setShowNotifications(false)}
                        className="text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors">
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="h-6 w-px bg-slate-200 hidden sm:block mx-1"></div>

              {/* User Profile Summary */}
              <div className="flex items-center gap-3 pl-1">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-bold text-slate-800 leading-none">{user?.first_name}</span>
                  <span className="text-[10px] font-bold text-violet-500 uppercase tracking-tight mt-1">{user?.role}</span>
                </div>
                <div className="relative group cursor-pointer">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-200 group-hover:scale-105 transition-transform">
                    <span className="text-sm font-black tracking-tighter">
                      {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                    </span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 lg:p-8 relative z-10">
            <div className="portal-page mx-auto w-full max-w-[1440px]">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
