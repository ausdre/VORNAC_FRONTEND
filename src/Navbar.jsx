import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

const Navbar = ({ onLogout }) => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    const handleScroll = () => {
      // Die Animation wird ausgelöst, wenn der User mehr als 10px scrollt.
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);

    // Event-Listener beim Verlassen der Komponente entfernen
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []); // Leeres Array sorgt dafür, dass der Effekt nur einmal ausgeführt wird.

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper Component für Links mit dem exakten CSS-Hover-Effekt
  const NavLink = ({ to, label }) => {
    const active = isActive(to);
    return (
      <Link
        to={to}
        className={`group relative inline-block py-2 text-sm font-medium tracking-wide transition-colors duration-180 ${
          active ? 'text-[#FFA317]' : 'text-white/60 hover:text-white'
        }`}
      >
        {label}
        {/* Gradient Underline Animation (.nav-link::after) */}
        <span className={`absolute left-0 -bottom-[2px] h-[1px] w-full origin-left transform bg-gradient-to-br from-[#FFA317] to-[#FF8C00] transition-transform duration-180 ease-out ${
          active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
        }`}></span>
      </Link>
    );
  };

  return (
    <header
      id="site-header"
      className={`sticky top-0 z-50 border-b bg-[#02030a]/80 backdrop-blur-md transition-all duration-180 ${
        isScrolled
          ? 'border-white/10 shadow-[0_12px_34px_rgba(0,0,0,0.45)]'
          : 'border-transparent'
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        {/* Logo Section */}
        <div className="flex items-center gap-4">
          <Link to="/" className="group flex items-center">
            {/* Die Animation des Logos ist jetzt an den Scroll-Zustand gekoppelt, genau wie auf der Website. */}
            <img src="/V.svg" alt="VORNAC Logo" className={`w-auto drop-shadow-[0_0_10px_rgba(255,163,23,0.5)] transition-all duration-180 ${isScrolled ? 'h-8 scale-[.92]' : 'h-10 scale-100'}`} />
          </Link>

          {/* Tenant Badge */}
          {isAuthenticated && user?.tenantName && (
            <div className="ml-4 flex items-center gap-2 px-3 py-1.5 bg-[#FFA317]/10 border border-[#FFA317]/20 rounded-full">
              <svg className="w-3.5 h-3.5 text-[#FFA317]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="text-xs font-medium text-white/80">{user.tenantName}</span>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="hidden items-center gap-8 md:flex">
          {isAuthenticated && (
            <>
              <NavLink to="/" label="OVERVIEW" />
              <NavLink to="/schedule" label="MANAGE" />
              <NavLink to="/queue" label="QUEUE" />
              <NavLink to="/results" label="RESULTS" />
              <NavLink to="/settings" label="SETTINGS" />

              {/* User Menu Dropdown */}
              <div className="ml-4 border-l border-white/10 pl-8 relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="group flex items-center gap-2 py-2 text-sm font-medium tracking-wide text-white/60 transition-colors duration-180 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>{user?.email || 'USER'}</span>
                  <svg className={`w-4 h-4 transition-transform duration-180 ${isUserMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-[#0a0b14] border border-white/10 rounded-lg shadow-2xl py-2">
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Signed in as</p>
                      <p className="text-sm text-white font-medium">{user?.email}</p>
                      <p className="text-xs text-white/60 mt-1">{user?.role}</p>
                    </div>

                    <Link
                      to="/settings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Settings
                    </Link>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
