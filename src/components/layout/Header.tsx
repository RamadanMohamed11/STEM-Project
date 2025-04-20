import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Bell, ChevronDown, User } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

export const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleProfile = () => setIsProfileOpen(!isProfileOpen);
  const closeMenus = () => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
      closeMenus();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Only show Home link when logged in
  const navLinks = user ? [
    { path: '/dashboard', label: 'Home' },
  ] : [];

  return (
    <header className="bg-white shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Main Navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <div className="flex items-center text-2xl font-bold cursor-default">
                <span className="text-blue-600">SMART</span>
                <span className="text-purple-600">Cap</span>
              </div>
            </div>

            {/* Desktop Navigation - Only shown when logged in */}
            {user && (
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                      location.pathname === link.path
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-slate-700 hover:text-blue-600'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right side menu */}
          <div className="flex items-center">
            {user ? (
              <>
                {/* Notifications */}
                <button className="p-2 rounded-full text-slate-600 hover:text-blue-600 hover:bg-slate-100">
                  <Bell size={20} />
                </button>

                {/* Profile Dropdown */}
                <div className="ml-3 relative">
                  <div>
                    <button
                      onClick={toggleProfile}
                      className="flex items-center max-w-xs text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {user.user_metadata?.avatar_url ? (
                        <img
                          className="h-8 w-8 rounded-full"
                          src={user.user_metadata.avatar_url}
                          alt="User avatar"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <User size={20} className="text-blue-600" />
                        </div>
                      )}
                      <ChevronDown size={16} className="ml-1 text-slate-600" />
                    </button>
                  </div>

                  {/* Profile Dropdown Menu */}
                  {isProfileOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                      <div className="py-1">
                        <Link
                          to="/profile"
                          onClick={closeMenus}
                          className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                        >
                          Your Profile
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="space-x-4">
                <Link to="/login">
                  <Button variant="outline">Sign in</Button>
                </Link>
                <Link to="/signup">
                  <Button>Sign up</Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button - Only shown when logged in */}
            {user && (
              <div className="-mr-2 flex items-center sm:hidden">
                <button
                  onClick={toggleMenu}
                  className="inline-flex items-center justify-center p-2 rounded-md text-slate-600 hover:text-blue-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                >
                  {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation - Only shown when logged in */}
        {isMenuOpen && user && (
          <div className="sm:hidden absolute top-16 inset-x-0 p-2 transition transform origin-top-right bg-white shadow-lg rounded-b-lg">
            <div className="pt-2 pb-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={closeMenus}
                  className={`block pl-3 pr-4 py-2 text-base font-medium rounded-md ${location.pathname === link.path
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-slate-700 hover:bg-slate-100'
                    }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};