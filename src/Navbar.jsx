import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  const [isScrolled, setIsScrolled] = useState(false);

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

  // Helper für statische Items (Reports, Settings)
  const NavItem = ({ label }) => (
    <span className="group relative inline-block cursor-pointer py-2 text-sm font-medium tracking-wide text-white/60 transition-colors duration-180 hover:text-white">
      {label}
      <span className="absolute left-0 -bottom-[2px] h-[1px] w-full origin-left scale-x-0 transform bg-gradient-to-br from-[#FFA317] to-[#FF8C00] transition-transform duration-180 ease-out group-hover:scale-x-100"></span>
    </span>
  );

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
        </div>

        {/* Navigation Links */}
        <nav className="hidden items-center gap-8 md:flex">
          <NavLink to="/" label="DASHBOARD" />
          <NavLink to="/schedule" label="SCHEDULE" />
          <NavLink to="/results" label="RESULTS" />
          <NavItem label="SETTINGS" />
          
          {/* Language Switcher (.lang-switch) */}
          <div className="ml-4 border-l border-white/10 pl-8">
            <button className="text-sm text-white/50 transition-all duration-200 hover:text-[#FFA317] hover:drop-shadow-[0_0_8px_rgba(245,201,106,0.6)]" style={{ fontFamily: 'Montserrat, sans-serif' }}>DE</button>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;