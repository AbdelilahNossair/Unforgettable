import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Camera, Calendar, Users, LogOut, Settings, Home, Menu, X, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../store';
import { signOut } from '../lib/auth';

export const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isDarkMode, toggleDarkMode } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard', roles: ['admin', 'photographer', 'attendee'] },
    { path: '/events', icon: Calendar, label: 'Events', roles: ['admin', 'photographer'] },
    { path: '/photos', icon: Camera, label: 'Photos', roles: ['photographer'] },
    { path: '/users', icon: Users, label: 'Users', roles: ['admin'] },
    { path: '/settings', icon: Settings, label: 'Settings', roles: ['admin', 'photographer', 'attendee'] },
  ];

  const handleThemeToggle = () => {
    toggleDarkMode();
    localStorage.setItem('theme-preference', (!isDarkMode).toString());
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg z-50 border-b border-gray-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 sm:h-20">
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center">
                <img src="/logo_1.png" alt="Logo" className="h-8 w-auto" />
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button
                onClick={handleThemeToggle}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors mr-4"
                aria-label="Toggle theme"
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-700" />
                )}
              </button>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6 text-gray-900 dark:text-white" />
                ) : (
                  <Menu className="h-6 w-6 text-gray-900 dark:text-white" />
                )}
              </button>
            </div>

            {/* Desktop navigation */}
            <div className="hidden sm:flex items-center space-x-8">
              {menuItems.map((item) => (
                item.roles.includes(user?.role || '') && (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`${
                      isActive(item.path)
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    } flex items-center text-sm font-light tracking-wider transition-colors`}
                  >
                    <item.icon className="h-5 w-5 mr-2" />
                    {item.label}
                  </Link>
                )
              ))}
              <button
                onClick={handleThemeToggle}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle theme"
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-700" />
                )}
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center text-sm font-light tracking-wider text-white bg-gray-900 dark:text-black dark:bg-white hover:bg-gray-800 dark:hover:bg-white/90 px-6 py-2 transition-colors"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Sign Out
              </button>
            </div>
          </div>

          {/* Mobile navigation menu */}
          <div className={`sm:hidden ${isMenuOpen ? 'block' : 'hidden'} py-4`}>
            <div className="flex flex-col space-y-4">
              {menuItems.map((item) => (
                item.roles.includes(user?.role || '') && (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`${
                      isActive(item.path)
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    } flex items-center text-sm font-light tracking-wider transition-colors`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <item.icon className="h-5 w-5 mr-2" />
                    {item.label}
                  </Link>
                )
              ))}
              <button
                onClick={() => {
                  handleSignOut();
                  setIsMenuOpen(false);
                }}
                className="flex items-center text-sm font-light tracking-wider text-white bg-gray-900 dark:text-black dark:bg-white hover:bg-gray-800 dark:hover:bg-white/90 px-6 py-2 transition-colors w-full"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-16 sm:pt-20 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};