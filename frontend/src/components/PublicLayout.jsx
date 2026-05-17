import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { getUser, clearSession } from '../utils/auth';
import { useState, useEffect } from 'react';

const PublicLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setUser(getUser());
    setShowProfileMenu(false);
    setMobileMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    clearSession();
    setUser(null);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-violet-50/40">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 rounded-lg px-1 py-1 hover:bg-violet-50">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 shadow-md shadow-violet-700/30">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">Kiwalan NHS</h1>
                <p className="text-xs text-slate-500">National High School</p>
              </div>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-2">
              <Link
                to="/"
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive('/') ? 'bg-violet-100 text-violet-700' : 'text-slate-600 hover:bg-violet-50 hover:text-violet-700'
                }`}
              >
                Home
              </Link>
              <Link
                to="/about"
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive('/about') ? 'bg-violet-100 text-violet-700' : 'text-slate-600 hover:bg-violet-50 hover:text-violet-700'
                }`}
              >
                About
              </Link>
              <Link
                to="/programs"
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive('/programs') ? 'bg-violet-100 text-violet-700' : 'text-slate-600 hover:bg-violet-50 hover:text-violet-700'
                }`}
              >
                Programs
              </Link>
              <Link
                to="/contact"
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive('/contact') ? 'bg-violet-100 text-violet-700' : 'text-slate-600 hover:bg-violet-50 hover:text-violet-700'
                }`}
              >
                Contact
              </Link>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Link
                to="/enroll"
                className="hidden sm:block rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 hover:border-violet-300 hover:bg-violet-100"
              >
                Enroll Now
              </Link>
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="rounded-lg p-2 text-slate-600 hover:bg-violet-50 hover:text-violet-700 md:hidden"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center space-x-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-md shadow-violet-700/30 hover:from-violet-700 hover:to-indigo-700 sm:px-4"
                  >
                    <span className="hidden sm:inline">{user.first_name || user.username}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showProfileMenu && (
                    <div className="absolute right-0 z-50 mt-2 w-48 rounded-lg border border-slate-200 bg-white shadow-lg">
                      <div className="py-1">
                        <Link
                          to="/dashboard"
                          className="block px-4 py-2 text-sm text-slate-700 hover:bg-violet-50"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          Go to Portal
                        </Link>
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-sm text-slate-700 hover:bg-violet-50"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          My Profile
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-md shadow-violet-700/30 hover:from-violet-700 hover:to-indigo-700 sm:px-4"
                >
                  <span className="hidden sm:inline">Login to Portal</span>
                  <span className="sm:hidden">Login</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white md:hidden">
            <div className="px-4 py-3 space-y-2">
              <Link
                to="/"
                className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive('/') ? 'bg-violet-100 text-violet-700' : 'text-slate-600 hover:bg-violet-50'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/about"
                className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive('/about') ? 'bg-violet-100 text-violet-700' : 'text-slate-600 hover:bg-violet-50'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link
                to="/programs"
                className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive('/programs') ? 'bg-violet-100 text-violet-700' : 'text-slate-600 hover:bg-violet-50'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Programs
              </Link>
              <Link
                to="/contact"
                className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive('/contact') ? 'bg-violet-100 text-violet-700' : 'text-slate-600 hover:bg-violet-50'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </Link>
              <Link
                to="/enroll"
                className="block rounded-lg bg-violet-100 px-3 py-2 text-sm font-medium text-violet-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                Enroll Now
              </Link>
              {user ? (
                <>
                  <div className="mt-2 border-t border-slate-200 pt-2">
                    <p className="mb-2 px-3 text-xs text-slate-500">Logged in as {user.first_name || user.username}</p>
                    <Link
                      to="/dashboard"
                      className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-violet-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Go to Portal
                    </Link>
                    <Link
                      to="/profile"
                      className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-violet-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      My Profile
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <Link
                  to="/login"
                  className="block rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-2 text-center text-sm font-medium text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login to Portal
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="public-page">
        <Outlet />
      </main>
    </div>
  );
};

export default PublicLayout;
