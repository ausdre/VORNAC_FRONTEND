/**
 * Admin Layout Component
 * Navigation bar and page layout for admin portal
 * Distinct from regular app with orange accent
 */
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuthStore } from '../stores/adminAuthStore';

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAdminAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[#02030a]">
      {/* Navigation Bar */}
      <nav className="border-b border-orange-500/20 bg-[#0a0b14]">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Link to="/admin/dashboard" className="flex items-center">
                <img
                  src="/vornac_static.svg"
                  alt="VORNAC"
                  className="h-7 w-auto drop-shadow-[0_0_10px_rgba(255,163,23,0.5)]"
                />
              </Link>
              <span className="px-2 py-0.5 bg-orange-500 text-black text-xs font-bold rounded">
                ADMIN
              </span>
            </div>

            {/* Navigation Links */}
            <div className="flex items-center gap-6">
              <Link
                to="/admin/dashboard"
                className={`font-medium transition-colors ${
                  isActive('/admin/dashboard')
                    ? 'text-[#FFA317]'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Overview
              </Link>
              <Link
                to="/admin/tenants"
                className={`font-medium transition-colors ${
                  isActive('/admin/tenants')
                    ? 'text-[#FFA317]'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Tenants
              </Link>
              <Link
                to="/admin/users"
                className={`font-medium transition-colors ${
                  isActive('/admin/users')
                    ? 'text-[#FFA317]'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Users
              </Link>
              <Link
                to="/admin/audit-logs"
                className={`font-medium transition-colors ${
                  isActive('/admin/audit-logs')
                    ? 'text-[#FFA317]'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Audit Logs
              </Link>
              <Link
                to="/admin/sso"
                className={`font-medium transition-colors ${
                  isActive('/admin/sso')
                    ? 'text-[#FFA317]'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                SSO
              </Link>
              <Link
                to="/admin/kms"
                className={`font-medium transition-colors ${
                  isActive('/admin/kms')
                    ? 'text-[#FFA317]'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                KMS
              </Link>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/5 transition-colors"
              >
                <div className="text-right">
                  <div className="text-sm font-medium text-white">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-xs text-orange-500 font-bold">SUPER ADMIN</div>
                </div>
                <svg
                  className="w-5 h-5 text-white/60"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-[#0a0b14] border border-white/10 rounded-lg shadow-lg z-20">
                    <div className="p-3 border-b border-white/10">
                      <div className="text-sm font-medium text-white">{user?.email}</div>
                      <div className="text-xs text-white/40 mt-1">Super Administrator</div>
                    </div>
                    <Link
                      to="/admin/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="block px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors"
                    >
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/5 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main className="p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
