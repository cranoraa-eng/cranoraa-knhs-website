import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { getUser, clearSession } from '../utils/auth';
import { useState, useEffect } from 'react';

const SITE_URL = 'https://cranoraa-eng-cranoraa-knhs-website.vercel.app';

const PublicLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setUser(getUser());
    setShowProfileMenu(false);
    setMobileMenuOpen(false);
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location]);

  const handleLogout = () => {
    clearSession();
    setUser(null);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Programs', path: '/programs' },
    { name: 'Contact', path: '/contact' },
    { name: 'Calendar', path: '/calendar' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white selection:bg-violet-100 selection:text-violet-800">

      {/* ── Navbar ── */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0f0720]/98 backdrop-blur-xl border-b border-white/8 shadow-lg shadow-black/20'
          : 'bg-[#0f0720]/85 backdrop-blur-xl border-b border-white/5'
      }`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[68px]">

            {/* ── Logo ── */}
            <Link to="/" className="flex items-center gap-3 flex-shrink-0 group">
              {/* Logo circle — matches the circular PWA icon style */}
              <div className="h-10 w-10 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 transition-all duration-300 ring-2 ring-white/10 bg-white/10">
                <img
                  src="https://plain-apac-prod-public.komododecks.com/202605/18/u3t1lOolacFscP6v1Bq8/image.png"
                  alt="KNHS"
                  className="h-8 w-8 object-contain group-hover:scale-110 transition-transform duration-200"
                />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-[13px] font-black leading-none tracking-tight text-white">
                  KIWALAN NHS
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] leading-none mt-1 text-violet-400">
                  Excellence in Education
                </span>
              </div>
            </Link>

            {/* ── Desktop Nav ── */}
            <div className="hidden md:flex items-center">
              {/* Divider left */}
              <div className="w-px h-5 mr-6 bg-white/10" />

              <div className="flex items-center gap-0.5">
                {navLinks.map((link) => {
                  const active = isActive(link.path);
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`relative px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                        active
                          ? 'text-white'
                          : 'text-white/60 hover:text-white hover:bg-white/8'
                      }`}
                    >
                      {link.name}
                      {active && (
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-white" />
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Divider right */}
              <div className="w-px h-5 ml-6 bg-white/10" />
            </div>

            {/* ── Right actions ── */}
            <div className="flex items-center gap-2.5">
              {/* Enroll button */}
              <Link
                to="/enroll"
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-white/15 text-white/80 text-sm font-semibold hover:border-white/30 hover:text-white hover:bg-white/8 transition-all duration-200"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Enroll
              </Link>

              {/* Portal Login / User menu */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-500 transition-colors shadow-sm shadow-violet-900/20"
                  >
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black">
                      {(user.first_name || user.username || '?').charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:inline">{user.first_name || user.username}</span>
                    <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-100 bg-white shadow-2xl shadow-slate-900/10 overflow-hidden z-50">
                      <div className="px-4 py-3.5 bg-slate-50 border-b border-slate-100">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Signed in as</p>
                        <p className="text-sm font-bold text-slate-800 truncate mt-0.5">{user.email}</p>
                      </div>
                      <div className="p-1.5">
                        <Link to="/dashboard" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-violet-50 hover:text-violet-700 rounded-xl transition-colors">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                          <span className="font-semibold">Portal Dashboard</span>
                        </Link>
                        <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1m0-11V7" /></svg>
                          <span className="font-semibold">Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-500 transition-colors shadow-sm shadow-violet-900/20"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Portal Login
                </Link>
              )}

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-white/70 hover:bg-white/10 transition-colors"
                aria-label="Toggle menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile drawer ── */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="bg-[#0f0720] border-t border-white/8">
            {/* Nav links */}
            <div className="px-4 pt-3 pb-2 space-y-0.5">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    isActive(link.path)
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 hover:bg-white/8 hover:text-white'
                  }`}
                >
                  {link.name}
                  {isActive(link.path) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                  )}
                </Link>
              ))}
            </div>
            {/* CTA row */}
            <div className="px-4 pb-5 pt-2 border-t border-white/8 flex gap-2">
              <Link
                to="/enroll"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white/80 border border-white/15 text-center hover:bg-white/8 hover:text-white transition-colors"
              >
                Enroll Now
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-violet-600 text-center hover:bg-violet-500 transition-colors"
              >
                Portal Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Page content ── */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

            {/* Brand */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center">
                  <img src="https://plain-apac-prod-public.komododecks.com/202605/18/u3t1lOolacFscP6v1Bq8/image.png" alt="KNHS" className="h-8 w-8 object-contain" />
                </div>
                <div>
                  <p className="text-sm font-black text-white leading-none">KIWALAN NATIONAL HIGH SCHOOL</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Kiwalan, Philippines</p>
                </div>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
                Dedicated to providing quality education and shaping the future leaders of our community through excellence, integrity, and innovation.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Quick Links</p>
              <ul className="space-y-2.5">
                {navLinks.map(link => (
                  <li key={link.path}>
                    <Link to={link.path} className="text-sm text-slate-400 hover:text-white transition-colors">{link.name}</Link>
                  </li>
                ))}
                <li><Link to="/enroll" className="text-sm text-slate-400 hover:text-white transition-colors">Online Enrollment</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Contact</p>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Kiwalan, Philippines
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-violet-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  info@kiwalan-nhs.edu.ph
                </li>
                <li className="pt-2">
                  <Link to="/login" className="inline-flex items-center gap-1.5 text-violet-400 hover:text-violet-300 font-semibold transition-colors text-xs">
                    Student Portal Login
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4 4H3" /></svg>
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">© {new Date().getFullYear()} Kiwalan National High School. All rights reserved.</p>
            <div className="flex gap-5 text-xs text-slate-500">
              <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
