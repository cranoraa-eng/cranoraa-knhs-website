import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const SITE_URL = 'https://cranoraa-eng-cranoraa-knhs-website.vercel.app';

const PublicLayout = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAboutDropdown, setShowAboutDropdown] = useState(false);
  const [showAcademicsDropdown, setShowAcademicsDropdown] = useState(false);
  const [showResourcesDropdown, setShowResourcesDropdown] = useState(false);

  useEffect(() => {
    setShowProfileMenu(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleLogout = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* OFFICIAL DEPED HEADER */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <header className="bg-white border-b-4 border-purple-600 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="grid grid-cols-3 items-center">
            {/* Left: DepEd Logo */}
            <div className="flex justify-start">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center border-2 border-purple-600">
                <svg className="w-12 h-12 text-purple-700" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
            </div>

            {/* Center: Official Text */}
            <div className="text-center">
              <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">REPUBLIKA NG PILIPINAS</p>
              <p className="text-xs font-bold text-gray-800 uppercase tracking-wide mt-0.5">KAGAWARAN NG EDUKASYON</p>
              <h1 className="text-lg font-black text-purple-800 uppercase tracking-tight mt-1">KIWALAN NATIONAL HIGH SCHOOL</h1>
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mt-0.5">ILIGAN CITY</p>
            </div>

            {/* Right: School Logo */}
            <div className="flex justify-end">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center border-2 border-purple-600">
                <span className="text-2xl font-black text-purple-700">KNHS</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* NAVIGATION BAR */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <nav className="bg-[#5e2a84] text-white sticky top-[136px] z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center space-x-1">
              {/* HOME */}
              <Link to="/" className={`px-4 py-3 text-sm font-bold transition-colors ${isActive('/') ? 'bg-purple-700' : 'hover:bg-purple-700'}`}>HOME</Link>

              {/* ABOUT US with Dropdown */}
              <div className="relative" onMouseEnter={() => setShowAboutDropdown(true)} onMouseLeave={() => setShowAboutDropdown(false)}>
                <button className={`px-4 py-3 text-sm font-bold transition-colors flex items-center gap-1 ${isActive('/about') ? 'bg-purple-700' : 'hover:bg-purple-700'}`}>
                  ABOUT US
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {showAboutDropdown && (
                  <div className="absolute top-full left-0 bg-white text-gray-800 shadow-xl rounded-b-lg overflow-hidden w-48">
                    <Link to="/about" className="block px-4 py-2 text-sm hover:bg-purple-100 font-semibold">Mission</Link>
                    <Link to="/about" className="block px-4 py-2 text-sm hover:bg-purple-100 font-semibold">Vision</Link>
                    <Link to="/about" className="block px-4 py-2 text-sm hover:bg-purple-100 font-semibold">Faculty</Link>
                  </div>
                )}
              </div>

              {/* ACADEMICS with Dropdown */}
              <div className="relative" onMouseEnter={() => setShowAcademicsDropdown(true)} onMouseLeave={() => setShowAcademicsDropdown(false)}>
                <button className={`px-4 py-3 text-sm font-bold transition-colors flex items-center gap-1 ${isActive('/programs') ? 'bg-purple-700' : 'hover:bg-purple-700'}`}>
                  ACADEMICS
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {showAcademicsDropdown && (
                  <div className="absolute top-full left-0 bg-white text-gray-800 shadow-xl rounded-b-lg overflow-hidden w-48">
                    <Link to="/programs" className="block px-4 py-2 text-sm hover:bg-purple-100 font-semibold">K to 12 Programs</Link>
                    <Link to="/programs" className="block px-4 py-2 text-sm hover:bg-purple-100 font-semibold">Senior High</Link>
                  </div>
                )}
              </div>

              {/* RESOURCES with Dropdown */}
              <div className="relative" onMouseEnter={() => setShowResourcesDropdown(true)} onMouseLeave={() => setShowResourcesDropdown(false)}>
                <button className="px-4 py-3 text-sm font-bold hover:bg-purple-700 transition-colors flex items-center gap-1">
                  RESOURCES
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {showResourcesDropdown && (
                  <div className="absolute top-full left-0 bg-white text-gray-800 shadow-xl rounded-b-lg overflow-hidden w-48">
                    <Link to="/login" className="block px-4 py-2 text-sm hover:bg-purple-100 font-semibold">Learning Materials</Link>
                    <Link to="/login" className="block px-4 py-2 text-sm hover:bg-purple-100 font-semibold">Portals</Link>
                  </div>
                )}
              </div>

              <Link to="/calendar" className={`px-4 py-3 text-sm font-bold transition-colors ${isActive('/calendar') ? 'bg-purple-700' : 'hover:bg-purple-700'}`}>NEWS & EVENTS</Link>
              <Link to="/enroll" className={`px-4 py-3 text-sm font-bold transition-colors ${isActive('/enroll') ? 'bg-purple-700' : 'hover:bg-purple-700'}`}>ADMISSIONS</Link>
              <Link to="/contact" className={`px-4 py-3 text-sm font-bold transition-colors ${isActive('/contact') ? 'bg-purple-700' : 'hover:bg-purple-700'}`}>CONTACT</Link>
            </div>

            {/* Right Side: Search + Login/Profile */}
            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <div className="flex items-center bg-white rounded-full overflow-hidden">
                <input type="text" placeholder="Search..." className="px-3 py-1 text-sm text-gray-800 outline-none w-32" />
                <button className="bg-purple-600 px-3 py-1.5 hover:bg-purple-700 transition-colors">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </button>
              </div>

              {/* User Menu or Login */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-700 text-white text-sm font-semibold hover:bg-purple-600 transition-colors"
                  >
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black">
                      {(user.first_name || user.username || '?').charAt(0).toUpperCase()}
                    </div>
                    <span>{user.first_name || user.username}</span>
                    <svg className={`w-3 h-3 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-48 rounded-xl border border-purple-200 bg-white shadow-2xl overflow-hidden z-50">
                      <div className="px-4 py-3 bg-purple-50 border-b border-purple-100">
                        <p className="text-[10px] text-purple-600 font-bold uppercase">Signed in as</p>
                        <p className="text-sm font-bold text-gray-800 truncate">{user.email}</p>
                      </div>
                      <Link to="/dashboard" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 font-semibold">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                        Portal Dashboard
                      </Link>
                      <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-semibold">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1m0-11V7" /></svg>
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="px-4 py-2 rounded-lg bg-purple-700 text-white text-sm font-bold hover:bg-purple-600 transition-colors">
                  Portal Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Page content ── */}
      <main className="flex-grow overflow-hidden">
        <Outlet />
      </main>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* FOOTER */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <footer className="bg-[#5e2a84] text-white py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
            <div>
              <h3 className="font-bold mb-3 uppercase text-sm">Contact Us</h3>
              <p className="text-xs">Kiwalan, Iligan City</p>
              <p className="text-xs">Lanao del Norte, Philippines</p>
              <p className="text-xs mt-2">info@kiwalan-nhs.edu.ph</p>
              <p className="text-xs">(123) 456-7890</p>
            </div>
            <div>
              <h3 className="font-bold mb-3 uppercase text-sm">Quick Links</h3>
              <ul className="text-xs space-y-1">
                <li><Link to="/" className="hover:underline">Home</Link></li>
                <li><Link to="/about" className="hover:underline">About Us</Link></li>
                <li><Link to="/programs" className="hover:underline">Programs</Link></li>
                <li><Link to="/enroll" className="hover:underline">Admissions</Link></li>
                <li><Link to="/contact" className="hover:underline">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-3 uppercase text-sm">Follow Us</h3>
              <div className="flex gap-3 mb-4">
                <a href="#" className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors">
                  <span className="text-xs font-bold">f</span>
                </a>
                <a href="#" className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors">
                  <span className="text-xs font-bold">t</span>
                </a>
                <a href="#" className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors">
                  <span className="text-xs font-bold">in</span>
                </a>
              </div>
              <Link to="/privacy" className="text-xs hover:underline block">Privacy Policy</Link>
              <Link to="/terms" className="text-xs hover:underline block mt-1">Terms of Service</Link>
            </div>
          </div>
          <div className="border-t border-white/20 pt-4 text-center text-xs">
            © {new Date().getFullYear()} Kiwalan National High School. All Rights Reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
