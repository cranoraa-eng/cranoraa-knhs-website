import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { getStoredUser } from '../utils/auth';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useState, useEffect } from 'react';
import api from '../utils/api';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

const NavItem = ({ to, label, isActive, icon, onClick }) => (
  <Link 
    to={to}
    onClick={onClick}
    className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-150 mb-0.5 text-sm group ${
      isActive(to) 
        ? 'bg-violet-600 text-white font-semibold shadow-md shadow-violet-200' 
        : 'text-gray-300 hover:bg-white/10 hover:text-white'
    }`}
  >
    <svg 
      className={`w-4 h-4 mr-3 flex-shrink-0 transition-transform duration-150 group-hover:scale-110 ${isActive(to) ? 'text-white' : 'text-violet-300/70'}`} 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
    </svg>
    <span className="truncate">{label}</span>
  </Link>
);

const SectionLabel = ({ label }) => (
  <div className="mt-6 mb-2 px-3">
    <p className="text-[10px] font-black text-violet-400/60 uppercase tracking-[0.2em]">{label}</p>
  </div>
);

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { notifications, setNotifications, unreadCount, setUnreadCount, realtimeConnected, isPolling } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isOnline } = useNetworkStatus();

  const isActive = (path) => location.pathname === path;

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You will be logged out of your account",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#9F7AEA',
      cancelButtonColor: '#f43f5e',
      confirmButtonText: 'Yes, logout!',
      background: '#ffffff',
      customClass: {
        popup: 'rounded-2xl border border-slate-100 shadow-2xl',
        confirmButton: 'rounded-xl font-bold uppercase tracking-widest text-xs px-6 py-3',
        cancelButton: 'rounded-xl font-bold uppercase tracking-widest text-xs px-6 py-3'
      }
    });

    if (result.isConfirmed) {
      signOut();
      navigate('/login');
      toast.success('Logged out successfully');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-read/');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error(err);
      toast.error('Failed to mark all as read');
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/mark-read/`);
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const getNotifConfig = (type) => {
    switch (type) {
      case 'grade': return { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10', bg: 'bg-green-100', color: 'text-green-600' };
      case 'attendance': return { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8l2 2 4-4', bg: 'bg-amber-100', color: 'text-amber-600' };
      case 'announcement': return { icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z', bg: 'bg-violet-100', color: 'text-violet-600' };
      case 'message': return { icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z', bg: 'bg-blue-100', color: 'text-blue-600' };
      default: return { icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', bg: 'bg-slate-100', color: 'text-slate-600' };
    }
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  };

  const pageTitle = (() => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/notifications') return 'Notifications';
    if (path === '/announcements') return 'Announcements';
    if (path === '/messages') return 'Messages';
    if (path === '/portal-calendar') return 'Calendar';
    if (path === '/analytics') return 'Portal Analytics';
    if (path === '/subjects') return 'Subjects';
    if (path === '/subject-assignment') return 'Subject Assignment';
    if (path === '/class-management') return 'Class Management';
    if (path === '/materials') return 'Learning Materials';
    if (path === '/grade-input') return 'Grade Input';
    if (path === '/grade-management') return 'Grade Management';
    if (path === '/attendance') return 'Attendance';
    if (path === '/teachers') return 'Teacher Management';
    if (path === '/student-management') return 'Student Management';
    if (path === '/moderation') return 'Message Moderation';
    if (path === '/enrollment-management') return 'Enrollment Management';
    if (path === '/audit-logs') return 'Audit Logs';
    if (path === '/backups') return 'Backups';
    if (path === '/website-content') return 'Mini Website Editor';
    if (path === '/settings') return 'Settings';
    if (path === '/profile') return 'My Profile';
    if (path === '/password-reset') return 'Change Password';
    return 'Portal';
  })();

  const NAV_STRUCTURE = {
    student: [
      {
        header: 'General',
        items: [
          { to: '/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
          { to: '/notifications', label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
          { to: '/announcements', label: 'Announcements', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
          { to: '/messages', label: 'Messages', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
          { to: '/portal-calendar', label: 'Calendar', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
        ]
      },
      {
        header: 'Academics',
        items: [
          { to: '/materials', label: 'Learning Materials', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
          { to: '/register-subjects', label: 'Subject Load', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
          { to: '/student-grades', label: 'My Grades', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
          { to: '/attendance', label: 'My Attendance', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8l2 2 4-4' },
        ]
      },
      {
        header: 'Profile',
        items: [
          { to: '/profile', label: 'My Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
          { to: '/class-members', label: 'My Classroom', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
          { to: '/password-reset', label: 'Change Password', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
        ]
      }
    ],
    teacher: [
      {
        header: 'General',
        items: [
          { to: '/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
          { to: '/notifications', label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
          { to: '/announcements', label: 'Announcements', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
          { to: '/messages', label: 'Messages', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
          { to: '/portal-calendar', label: 'Calendar', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
        ]
      },
      {
        header: 'School Setup',
        items: [
          { to: '/my-classes', label: 'My Classes', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
          { to: '/materials', label: 'Learning Materials', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
        ]
      },
      {
        header: 'Academics',
        items: [
          { to: '/grade-input', label: 'Grade Input', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
          { to: '/grade-management', label: 'Grade Management', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
          { to: '/attendance', label: 'Attendance', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8l2 2 4-4' },
        ]
      },
      {
        header: 'Users & Moderation',
        items: [
          ...(user?.is_adviser ? [{ to: '/student-management', label: 'Advisory Class', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' }] : []),
        ]
      },
      {
        header: 'System Admin',
        items: [
          { to: '/analytics', label: 'Portal Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
          { to: '/profile', label: 'My Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
          { to: '/password-reset', label: 'Change Password', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
        ]
      }
    ],
    admin: [
      {
        header: 'General',
        items: [
          { to: '/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
          { to: '/notifications', label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
          { to: '/announcements', label: 'Announcements', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
          { to: '/messages', label: 'Messages', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
          { to: '/portal-calendar', label: 'Calendar', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
        ]
      },
      {
        header: 'School Setup',
        items: [
          { to: '/subjects', label: 'Subjects', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
          { to: '/subject-assignment', label: 'Subject Assignment', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
          { to: '/class-management', label: 'Class Management', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
          { to: '/materials', label: 'Learning Materials', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
        ]
      },
      {
        header: 'Academics',
        items: [
          { to: '/grade-input', label: 'Grade Input', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
          { to: '/grade-management', label: 'Grade Management', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
          { to: '/attendance', label: 'Attendance', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8l2 2 4-4' },
        ]
      },
      {
        header: 'Users & Moderation',
        items: [
          { to: '/teachers', label: 'Teacher Management', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
          { to: '/student-management', label: 'Student Management', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
          { to: '/moderation', label: 'Message Moderation', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
        ]
      },
      {
        header: 'Admissions',
        items: [
          { to: '/enrollment-management', label: 'Enrollment Management', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
        ]
      },
      {
        header: 'System Admin',
        items: [
          { to: '/analytics', label: 'Portal Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
          { to: '/audit-logs', label: 'Audit Logs', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
          { to: '/backups', label: 'Backups', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
          { to: '/website-content', label: 'Mini Website Editor', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
          { to: '/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
        ]
      }
    ]
  };

  const currentNav = NAV_STRUCTURE[user?.role] || [];

  return (
    <div className="h-screen overflow-hidden bg-slate-50 font-sans antialiased">
      <div className="flex h-full">

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300" 
            onClick={() => setSidebarOpen(false)} 
          />
        )}

        {/* ── Sidebar ── */}
        <aside className={`fixed inset-y-0 left-0 z-50 flex h-screen w-72 transform flex-col overflow-hidden border-r border-white/10 bg-[#1A0B2E] text-white shadow-2xl transition-all duration-300 ease-in-out lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>

          {/* Logo Section */}
          <div className="flex items-center gap-3 px-6 py-8">
            <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md p-2 flex items-center justify-center border border-white/10 shadow-xl shadow-black/20 group hover:bg-white/20 transition-all cursor-pointer">
              <img 
                src="https://plain-apac-prod-public.komododecks.com/202605/18/u3t1lOolacFscP6v1Bq8/image.png" 
                alt="KNHS Logo" 
                className="h-full w-full object-contain group-hover:scale-110 transition-transform"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tighter leading-none text-white uppercase">Kiwalan</span>
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-[0.3em] mt-1">High School</span>
            </div>
          </div>

          {/* Profile Summary */}
          <div className="flex-shrink-0 px-6 mb-4">
            <div 
              onClick={() => navigate('/profile')}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group"
            >
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg group-hover:scale-105 transition-transform uppercase overflow-hidden border border-white/10">
                {user?.profile_picture ? (
                  <img src={user.profile_picture} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}</span>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold truncate">{user?.first_name} {user?.last_name}</span>
                <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">{user?.role}</span>
              </div>
            </div>
          </div>

          {/* Nav Container */}
          <nav className="flex-1 overflow-y-auto px-4 pb-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {currentNav.map((section, idx) => (
              <div key={idx} className="mb-4 last:mb-0">
                <SectionLabel label={section.header} />
                <div className="space-y-1">
                  {section.items.map((item, i) => (
                    <NavItem 
                      key={i} 
                      to={item.to} 
                      label={item.label} 
                      isActive={isActive} 
                      icon={item.icon}
                      onClick={() => setSidebarOpen(false)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Bottom actions */}
          <div className="flex-shrink-0 border-t border-white/5 p-4 space-y-2 bg-[#140824]/50">
            <button
              onClick={() => {
                window.open('https://cranoraa-eng-cranoraa-knhs-website.vercel.app/', '_blank', 'noopener,noreferrer');
              }}
              className="flex w-full items-center justify-center rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-all active:scale-95"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Visit Website
            </button>
            <button 
              onClick={handleLogout} 
              className="flex w-full items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-rose-400 hover:bg-rose-500 hover:text-white transition-all active:scale-95"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 flex flex-col min-h-0 bg-[#F8FAFC]">
          {/* Top bar */}
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/60 bg-white/80 px-4 py-3 backdrop-blur-xl lg:px-8 shadow-sm">
            <div className="flex items-center gap-4 lg:gap-8">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)} 
                className="rounded-xl p-2 text-slate-500 hover:bg-violet-50 hover:text-violet-600 lg:hidden transition-all active:scale-90"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {sidebarOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                </svg>
              </button>

              {/* Title & Breadcrumbs */}
              <div className="hidden sm:block">
                <nav className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                  <Link to="/dashboard" className="hover:text-violet-600 transition-colors">Portal</Link>
                  <svg className="w-3 h-3 mx-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                  <span className="text-violet-600/70">{pageTitle}</span>
                </nav>
                <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">{pageTitle}</h1>
              </div>

              {/* Mobile Title */}
              <h1 className="text-lg font-black text-slate-900 sm:hidden tracking-tight">{pageTitle}</h1>
            </div>

            <div className="flex items-center space-x-2 lg:space-x-4">
              {/* Notification bell */}
              <div className="relative" data-notif-dropdown>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)} 
                  className={`relative rounded-xl p-2.5 transition-all duration-200 ${showNotifications ? 'bg-violet-100 text-violet-700 shadow-inner scale-95' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-2.5 right-2.5 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white"></span>
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 z-50 mt-3 w-96 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#1A0B2E] to-[#2D1452] text-white">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm tracking-tight">Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">{unreadCount} New</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${realtimeConnected ? 'bg-green-400' : isPolling ? 'bg-amber-400 animate-pulse' : 'bg-rose-400'}`}></div>
                          <span className="text-[10px] text-purple-200 font-black uppercase tracking-widest">
                            {realtimeConnected ? 'Live' : isPolling ? 'Polling' : 'Offline'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* List */}
                    <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-50 scrollbar-thin">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                          <svg className="w-12 h-12 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                          <p className="text-xs font-bold uppercase tracking-widest">All caught up!</p>
                        </div>
                      ) : (
                        notifications.map(n => {
                          const cfg = getNotifConfig(n.notification_type);
                          return (
                            <div 
                              key={n.id}
                              onClick={() => { 
                                if (!n.is_read) markAsRead(n.id); 
                                if (n.link) { navigate(n.link); setShowNotifications(false); } 
                              }}
                              className={`flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors hover:bg-slate-50 group ${!n.is_read ? 'bg-violet-50/40' : ''}`}
                            >
                              <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm group-hover:scale-110 transition-transform`}>
                                <svg className={`w-5 h-5 ${cfg.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cfg.icon} />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm leading-tight mb-1 ${!n.is_read ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>
                                  {n.title}
                                </p>
                                <p className="text-xs text-slate-500 line-clamp-2 mb-2">{n.message}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatTime(n.created_at)}</p>
                              </div>
                              {!n.is_read && (
                                <div className="w-2.5 h-2.5 rounded-full bg-violet-600 flex-shrink-0 mt-1.5 shadow-sm shadow-violet-200" />
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate-100 px-5 py-3 bg-slate-50 flex items-center justify-between">
                      <button 
                        onClick={markAllAsRead}
                        className="text-[10px] font-black text-violet-600 hover:text-violet-800 uppercase tracking-widest transition-colors"
                      >
                        Mark all as read
                      </button>
                      <Link 
                        to="/notifications" 
                        onClick={() => setShowNotifications(false)}
                        className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
                      >
                        View all
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="h-6 w-px bg-slate-200 hidden sm:block mx-1"></div>

              {/* User Profile Summary (Desktop) */}
              <div className="hidden md:flex items-center gap-3 pl-1">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-bold text-slate-900 leading-none">{user?.first_name}</span>
                  <span className="text-[10px] font-bold text-violet-600 uppercase tracking-widest mt-1">{user?.role}</span>
                </div>
                <div className="relative group cursor-pointer" onClick={() => navigate('/profile')}>
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-lg group-hover:rotate-3 transition-all overflow-hidden border border-slate-200">
                    {user?.profile_picture ? (
                      <img src={user.profile_picture} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-black uppercase tracking-tighter">
                        {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Viewport */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-8 relative z-10 scroll-smooth pb-20 lg:pb-8">
            <div className="mx-auto w-full max-w-[1440px]">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      {/* ── Mobile Bottom Navigation Bar ── */}
      {/* Only shown on small screens as a quick-access nav */}
      <nav
        aria-label="Mobile navigation"
        className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-2xl shadow-slate-900/10"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-around px-2 py-1">
          {/* Dashboard */}
          <Link
            to="/dashboard"
            className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all active:scale-90 min-w-[56px] ${
              isActive('/dashboard') ? 'text-violet-600' : 'text-slate-400'
            }`}
          >
            <svg className="w-5 h-5" fill={isActive('/dashboard') ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive('/dashboard') ? 0 : 2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className={`text-[9px] font-bold uppercase tracking-wide ${isActive('/dashboard') ? 'text-violet-600' : 'text-slate-400'}`}>Home</span>
          </Link>

          {/* Announcements */}
          <Link
            to="/announcements"
            className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all active:scale-90 min-w-[56px] ${
              isActive('/announcements') ? 'text-violet-600' : 'text-slate-400'
            }`}
          >
            <svg className="w-5 h-5" fill={isActive('/announcements') ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive('/announcements') ? 0 : 2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            <span className={`text-[9px] font-bold uppercase tracking-wide ${isActive('/announcements') ? 'text-violet-600' : 'text-slate-400'}`}>News</span>
          </Link>

          {/* Messages */}
          <Link
            to="/messages"
            className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all active:scale-90 min-w-[56px] ${
              isActive('/messages') ? 'text-violet-600' : 'text-slate-400'
            }`}
          >
            <svg className="w-5 h-5" fill={isActive('/messages') ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive('/messages') ? 0 : 2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span className={`text-[9px] font-bold uppercase tracking-wide ${isActive('/messages') ? 'text-violet-600' : 'text-slate-400'}`}>Chat</span>
          </Link>

          {/* Notifications */}
          <Link
            to="/notifications"
            className={`relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all active:scale-90 min-w-[56px] ${
              isActive('/notifications') ? 'text-violet-600' : 'text-slate-400'
            }`}
          >
            <div className="relative">
              <svg className="w-5 h-5" fill={isActive('/notifications') ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive('/notifications') ? 0 : 2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white border border-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-wide ${isActive('/notifications') ? 'text-violet-600' : 'text-slate-400'}`}>Alerts</span>
          </Link>

          {/* Menu (opens sidebar) */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all active:scale-90 text-slate-400 min-w-[56px]"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="text-[9px] font-bold uppercase tracking-wide">Menu</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Layout;
