import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const PublicLayout = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAboutDropdown, setShowAboutDropdown] = useState(false);
  const [showAcademicsDropdown, setShowAcademicsDropdown] = useState(false);
  const [showResourcesDropdown, setShowResourcesDropdown] = useState(false);
  const [showAdmissionsDropdown, setShowAdmissionsDropdown] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState('');

  useEffect(() => {
    setShowProfileMenu(false);
    setMobileOpen(false);
    setMobileExpanded('');
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Close mobile menu on outside click
  const navRef = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (navRef.current && !navRef.current.contains(e.target)) setMobileOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => { await signOut(); navigate('/', { replace: true }); };
  const isActive = (path) => location.pathname === path;
  const toggleMobileSection = (key) => setMobileExpanded(prev => prev === key ? '' : key);

  const navLinks = [
    { key: 'home', label: 'Home', to: '/' },
    {
      key: 'about', label: 'About Us',
      children: [
        { label: 'Mission', to: '/mission' },
        { label: 'Vision', to: '/vision' },
        { label: 'Faculty', to: '/faculty' },
      ]
    },
    {
      key: 'academics', label: 'Academics',
      children: [
        { label: 'K to 12 Programs', to: '/k12-programs' },
        { label: 'Senior High', to: '/senior-high' },
      ]
    },
    {
      key: 'resources', label: 'Resources',
      children: [
        { label: 'Learning Materials', to: '/learning-materials' },
        { label: 'Portals', to: '/portals' },
      ]
    },
    { key: 'news', label: 'News & Events', to: '/news-events' },
    {
      key: 'admissions', label: 'Admissions',
      children: [
        { label: 'Apply for Enrollment', to: '/enroll' },
        { label: 'Track Application', to: '/track-enrollment' },
      ]
    },
    { key: 'contact', label: 'Contact', to: '/contact' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">

      {/* ═══════════════════ OFFICIAL DEPED HEADER ═══════════════════ */}
      <header className="bg-white border-b-4 border-purple-600 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4">
          <div className="grid grid-cols-3 items-center">
            {/* Left: DepEd Logo */}
            <div className="flex justify-start">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Seal_of_the_Department_of_Education_of_the_Philippines.png/960px-Seal_of_the_Department_of_Education_of_the_Philippines.png"
                alt="DepEd Logo"
                className="w-14 h-14 md:w-20 md:h-20 object-contain"
                onError={e => { e.target.onerror = null; e.target.src = '/icons/school-logo-source.png'; }}
              />
            </div>
            {/* Center: Official Text */}
            <div className="text-center">
              <p className="text-[8px] md:text-[10px] font-bold text-gray-700 uppercase tracking-wider">REPUBLIKA NG PILIPINAS</p>
              <p className="text-[8px] md:text-xs font-bold text-gray-800 uppercase tracking-wide mt-0.5">KAGAWARAN NG EDUKASYON</p>
              <h1 className="text-sm md:text-lg font-black text-purple-800 uppercase tracking-tight mt-0.5 md:mt-1">KIWALAN NATIONAL HIGH SCHOOL</h1>
              <p className="text-[8px] md:text-[10px] font-semibold text-gray-600 uppercase tracking-wider mt-0.5">ILIGAN CITY</p>
            </div>
            {/* Right: School Logo */}
            <div className="flex justify-end">
              <img src="/icons/school-logo-source.png" alt="KNHS Logo" className="w-14 h-14 md:w-20 md:h-20 object-contain" />
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════════ NAVIGATION BAR ═══════════════════ */}
      <nav ref={navRef} className="bg-[#5e2a84] text-white sticky top-[84px] md:top-[136px] z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-12">

            {/* ── Left side (Home icon for mobile, nav links for desktop) ── */}
            <div className="flex items-center">
              <Link to="/" className="lg:hidden p-2 -ml-1 text-white hover:bg-purple-700 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </Link>

              {/* Desktop nav links (hidden on mobile) */}
              <div className="hidden lg:flex items-center space-x-1">
                <Link to="/" className={`px-3 xl:px-4 py-3 text-xs xl:text-sm font-bold transition-colors ${isActive('/') ? 'bg-purple-700' : 'hover:bg-purple-700'}`}>HOME</Link>

                {/* About */}
                <div className="relative" onMouseEnter={() => setShowAboutDropdown(true)} onMouseLeave={() => setShowAboutDropdown(false)}>
                  <button className={`px-3 xl:px-4 py-3 text-xs xl:text-sm font-bold transition-colors flex items-center gap-1 ${isActive('/mission') || isActive('/vision') || isActive('/faculty') ? 'bg-purple-700' : 'hover:bg-purple-700'}`}>
                    ABOUT US <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {showAboutDropdown && (
                    <div className="absolute top-full left-0 bg-white text-gray-800 shadow-xl rounded-b-lg overflow-hidden w-48 z-50">
                      <Link to="/mission" className="block px-4 py-2.5 text-sm hover:bg-purple-100 font-semibold">Mission</Link>
                      <Link to="/vision" className="block px-4 py-2.5 text-sm hover:bg-purple-100 font-semibold">Vision</Link>
                      <Link to="/faculty" className="block px-4 py-2.5 text-sm hover:bg-purple-100 font-semibold">Faculty</Link>
                    </div>
                  )}
                </div>

                {/* Academics */}
                <div className="relative" onMouseEnter={() => setShowAcademicsDropdown(true)} onMouseLeave={() => setShowAcademicsDropdown(false)}>
                  <button className={`px-3 xl:px-4 py-3 text-xs xl:text-sm font-bold transition-colors flex items-center gap-1 ${isActive('/k12-programs') || isActive('/senior-high') ? 'bg-purple-700' : 'hover:bg-purple-700'}`}>
                    ACADEMICS <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {showAcademicsDropdown && (
                    <div className="absolute top-full left-0 bg-white text-gray-800 shadow-xl rounded-b-lg overflow-hidden w-48 z-50">
                      <Link to="/k12-programs" className="block px-4 py-2.5 text-sm hover:bg-purple-100 font-semibold">K to 12 Programs</Link>
                      <Link to="/senior-high" className="block px-4 py-2.5 text-sm hover:bg-purple-100 font-semibold">Senior High</Link>
                    </div>
                  )}
                </div>

                {/* Resources */}
                <div className="relative" onMouseEnter={() => setShowResourcesDropdown(true)} onMouseLeave={() => setShowResourcesDropdown(false)}>
                  <button className={`px-3 xl:px-4 py-3 text-xs xl:text-sm font-bold transition-colors flex items-center gap-1 ${isActive('/learning-materials') || isActive('/portals') ? 'bg-purple-700' : 'hover:bg-purple-700'}`}>
                    RESOURCES <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {showResourcesDropdown && (
                    <div className="absolute top-full left-0 bg-white text-gray-800 shadow-xl rounded-b-lg overflow-hidden w-48 z-50">
                      <Link to="/learning-materials" className="block px-4 py-2.5 text-sm hover:bg-purple-100 font-semibold">Learning Materials</Link>
                      <Link to="/portals" className="block px-4 py-2.5 text-sm hover:bg-purple-100 font-semibold">Portals</Link>
                    </div>
                  )}
                </div>

                <Link to="/news-events" className={`px-3 xl:px-4 py-3 text-xs xl:text-sm font-bold transition-colors whitespace-nowrap ${isActive('/news-events') ? 'bg-purple-700' : 'hover:bg-purple-700'}`}>NEWS & EVENTS</Link>

                {/* Admissions */}
                <div className="relative" onMouseEnter={() => setShowAdmissionsDropdown(true)} onMouseLeave={() => setShowAdmissionsDropdown(false)}>
                  <button className={`px-3 xl:px-4 py-3 text-xs xl:text-sm font-bold transition-colors flex items-center gap-1 ${isActive('/enroll') || isActive('/track-enrollment') ? 'bg-purple-700' : 'hover:bg-purple-700'}`}>
                    ADMISSIONS <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {showAdmissionsDropdown && (
                    <div className="absolute top-full left-0 bg-white text-gray-800 shadow-xl rounded-b-lg overflow-hidden w-52 z-50">
                      <Link to="/enroll" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-purple-100 font-semibold">
                        <svg className="w-4 h-4 text-purple-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        Apply for Enrollment
                      </Link>
                      <Link to="/track-enrollment" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-purple-100 font-semibold">
                        <svg className="w-4 h-4 text-purple-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                        Track Application
                      </Link>
                    </div>
                  )}
                </div>

                <Link to="/contact" className={`px-3 xl:px-4 py-3 text-xs xl:text-sm font-bold transition-colors ${isActive('/contact') ? 'bg-purple-700' : 'hover:bg-purple-700'}`}>CONTACT</Link>
              </div>
            </div>

            {/* ── Middle: Search (Mobile only, centered) ── */}
            <div className="lg:hidden flex-1 flex justify-center px-4">
              <div className="relative w-full max-w-[160px] xs:max-w-[200px]">
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="w-full bg-white/10 text-white text-[11px] py-1.5 pl-8 pr-2 rounded-full border border-white/20 focus:bg-white focus:text-gray-900 focus:outline-none transition-all placeholder:text-purple-200"
                />
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* ── Right: Search(desktop) + Login + Hamburger ── */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Search (desktop only) */}
              <div className="hidden lg:flex items-center bg-white rounded-full overflow-hidden">
                <input type="text" placeholder="Search..." className="px-3 py-1 text-sm text-gray-800 outline-none w-28 xl:w-32" />
                <button className="bg-purple-600 px-2.5 py-1.5 hover:bg-purple-700 transition-colors">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </button>
              </div>

              {/* Login/Profile (always visible) */}
              {user ? (
                <div className="relative">
                  <button onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-1.5 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-purple-700 text-white text-[10px] sm:text-xs font-semibold hover:bg-purple-600 transition-colors">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white/20 flex items-center justify-center text-[8px] sm:text-[10px] font-black flex-shrink-0">
                      {(user.first_name || user.username || '?').charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:block max-w-[80px] truncate">{user.first_name || user.username}</span>
                    <svg className={`w-3 h-3 flex-shrink-0 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-48 rounded-xl border border-purple-200 bg-white shadow-2xl overflow-hidden z-50">
                      <div className="px-4 py-3 bg-purple-50 border-b border-purple-100">
                        <p className="text-[10px] text-purple-600 font-bold uppercase">Signed in as</p>
                        <p className="text-sm font-bold text-gray-800 truncate">{user.email}</p>
                      </div>
                      <Link to="/dashboard" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 font-semibold">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                        Portal Dashboard
                      </Link>
                      <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-semibold">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1m0-11V7" /></svg>
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-purple-700 text-white text-[10px] sm:text-xs font-bold hover:bg-purple-600 transition-colors whitespace-nowrap">
                  Portal Login
                </Link>
              )}

              {/* Hamburger (mobile only) */}
              <button
                onClick={() => setMobileOpen(v => !v)}
                className="lg:hidden p-1.5 sm:p-2 rounded-lg hover:bg-purple-700 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileOpen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile Dropdown Menu ── */}
        {mobileOpen && (
          <div className="lg:hidden bg-[#4a1f6e] border-t border-purple-700 overflow-y-auto max-h-[70vh]">
            {navLinks.map(item => (
              <div key={item.key}>
                {item.to ? (
                  <Link to={item.to}
                    className={`flex items-center px-5 py-3.5 text-sm font-bold uppercase tracking-wide border-b border-purple-700/50 ${isActive(item.to) ? 'bg-purple-700 text-white' : 'text-purple-100 hover:bg-purple-700/60'}`}>
                    {item.label}
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() => toggleMobileSection(item.key)}
                      className={`w-full flex items-center justify-between px-5 py-3.5 text-sm font-bold uppercase tracking-wide border-b border-purple-700/50 ${mobileExpanded === item.key ? 'bg-purple-700' : 'text-purple-100 hover:bg-purple-700/60'}`}
                    >
                      <span>{item.label}</span>
                      <svg className={`w-4 h-4 transition-transform ${mobileExpanded === item.key ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {mobileExpanded === item.key && (
                      <div className="bg-[#3d1a5e]">
                        {item.children.map(child => (
                          <Link key={child.to} to={child.to}
                            className={`flex items-center gap-2 px-8 py-3 text-sm font-semibold border-b border-purple-800/40 ${isActive(child.to) ? 'text-yellow-300' : 'text-purple-200 hover:text-white hover:bg-purple-700/40'}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </nav>

      {/* ── Page content ── */}
      <main className="flex-grow overflow-hidden">
        <Outlet />
      </main>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
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
                <li><Link to="/mission" className="hover:underline">Mission & Vision</Link></li>
                <li><Link to="/faculty" className="hover:underline">Faculty</Link></li>
                <li><Link to="/k12-programs" className="hover:underline">K-12 Programs</Link></li>
                <li><Link to="/senior-high" className="hover:underline">Senior High</Link></li>
                <li><Link to="/news-events" className="hover:underline">News & Events</Link></li>
                <li><Link to="/enroll" className="hover:underline">Apply for Enrollment</Link></li>
                <li><Link to="/track-enrollment" className="hover:underline">Track Application</Link></li>
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
