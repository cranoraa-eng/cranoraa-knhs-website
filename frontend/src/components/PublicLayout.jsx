import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { getUser, clearSession } from '../utils/auth';
import { useState, useEffect } from 'react';

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

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
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
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-violet-100 selection:text-violet-700">
      {/* Navigation Header */}
      <nav 
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled 
            ? 'bg-white/80 backdrop-blur-lg shadow-lg py-2' 
            : 'bg-white py-4'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-lg border border-slate-100 p-1 group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                <img 
                  src="https://plain-apac-prod-public.komododecks.com/202605/18/u3t1lOolacFscP6v1Bq8/image.png" 
                  alt="KNHS Logo" 
                  className="h-10 w-10 object-contain"
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-black text-slate-900 leading-tight tracking-tighter">KIWALAN NHS</h1>
                <p className="text-[10px] font-bold text-violet-600 uppercase tracking-widest leading-none">Excellence in Education</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative px-4 py-2 text-sm font-bold transition-all duration-200 rounded-xl ${
                    isActive(link.path) 
                      ? 'text-violet-700 bg-violet-50' 
                      : 'text-slate-600 hover:text-violet-600 hover:bg-slate-50'
                  }`}
                >
                  {link.name}
                  {isActive(link.path) && (
                    <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-violet-600 rounded-full"></span>
                  )}
                </Link>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <Link
                to="/enroll"
                className="hidden lg:flex items-center px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-all shadow-md active:scale-95"
              >
                Enroll Now
              </Link>
              
              {user ? (
                <div className="relative group">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center space-x-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-200 hover:bg-violet-700 transition-all active:scale-95"
                  >
                    <span>{user.first_name || user.username}</span>
                    <svg className={`w-4 h-4 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showProfileMenu && (
                    <div className="absolute right-0 z-50 mt-3 w-56 rounded-2xl border border-slate-100 bg-white p-2 shadow-2xl animate-slideDown">
                      <div className="p-3 mb-2 bg-slate-50 rounded-xl">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mb-1">Signed in as</p>
                        <p className="text-sm font-bold text-slate-800 truncate">{user.email}</p>
                      </div>
                      <Link to="/dashboard" className="flex items-center space-x-3 px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-violet-50 hover:text-violet-700 rounded-xl transition-all">
                        <svg className="w-5 h-5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                        <span>Portal Dashboard</span>
                      </Link>
                      <button onClick={handleLogout} className="flex items-center space-x-3 w-full px-3 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all">
                        <svg className="w-5 h-5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1m0-11V7" /></svg>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-200 hover:bg-violet-700 transition-all active:scale-95"
                >
                  Portal Login
                </Link>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="rounded-xl p-2.5 text-slate-600 hover:bg-slate-100 md:hidden transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white animate-fadeIn">
            <div className="px-4 py-6 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block px-4 py-3 rounded-xl text-base font-bold transition-all ${
                    isActive(link.path) 
                      ? 'bg-violet-50 text-violet-700' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <Link
                to="/enroll"
                className="block px-4 py-3 rounded-xl bg-slate-900 text-white text-center font-bold mt-4"
                onClick={() => setMobileMenuOpen(false)}
              >
                Enroll Now
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
            <div className="space-y-6">
              <Link to="/" className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h1 className="text-xl font-black">Kiwalan NHS</h1>
              </Link>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs font-medium">
                Dedicated to providing quality education and shaping the future leaders of our community through excellence, integrity, and innovation.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-violet-400 mb-6">Quick Links</h3>
              <ul className="space-y-4">
                {navLinks.map(link => (
                  <li key={link.path}>
                    <Link to={link.path} className="text-slate-400 hover:text-white transition-colors text-sm font-bold flex items-center">
                      <span className="w-1 h-1 bg-violet-500 rounded-full mr-2"></span>
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-violet-400 mb-6">Resources</h3>
              <ul className="space-y-4">
                <li><Link to="/enroll" className="text-slate-400 hover:text-white transition-colors text-sm font-bold flex items-center"><span className="w-1 h-1 bg-violet-500 rounded-full mr-2"></span>Online Enrollment</Link></li>
                <li><Link to="/login" className="text-slate-400 hover:text-white transition-colors text-sm font-bold flex items-center"><span className="w-1 h-1 bg-violet-500 rounded-full mr-2"></span>Student Portal</Link></li>
                <li><Link to="/contact" className="text-slate-400 hover:text-white transition-colors text-sm font-bold flex items-center"><span className="w-1 h-1 bg-violet-500 rounded-full mr-2"></span>Help Center</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-violet-400 mb-6">Contact Us</h3>
              <ul className="space-y-4 text-sm font-bold text-slate-400">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-violet-500 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span>Kiwalan, Philippines</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-violet-500 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  <span>info@kiwalan-nhs.edu.ph</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-20 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
              © {new Date().getFullYear()} Kiwalan National High School. All rights reserved.
            </p>
            <div className="flex space-x-6 text-slate-500 text-xs font-bold uppercase tracking-widest">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
