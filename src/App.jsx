import React, { useState } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { migrateLegacyData } from './services/storage';
import { migrateLocalStorageToBackend } from './utils/migrateToBackend';
import Dashboard from './pages/Dashboard';
import NewPentest from './pages/NewPentest';
import Results from './pages/Results';
import Queue from './pages/Queue';
import Settings from './pages/Settings';
import Navbar from './Navbar';
import AdminApp from './admin/AdminApp';

function Login() {
  const { login } = useAuthStore();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.append('username', 'admin@companya.com');
      params.append('password', 'password123');

      const response = await axios.post('http://localhost:8000/api/v1/auth/login', params);
      const { access_token } = response.data;

      // Zustand login
      const success = login(access_token);

      if (success) {
        // Legacy localStorage cleanup + Migration
        localStorage.setItem('access_token', access_token); // Für Axios interceptor (backward compatibility)

        const { user } = useAuthStore.getState();
        if (user?.tenantId) {
          // Phase 1: Migrate legacy keys to tenant-scoped localStorage
          migrateLegacyData(user.tenantId);

          // Phase 2: Migrate tenant-scoped localStorage to backend (async, non-blocking)
          migrateLocalStorageToBackend(user.tenantId).then(result => {
            if (result.success && !result.alreadyMigrated) {
              console.log('Backend migration successful:', result);
            }
          }).catch(err => {
            console.error('Backend migration error:', err);
          });
        }
      } else {
        setError('Failed to authenticate. Invalid token.');
      }
    } catch (error) {
      console.error("Login failed", error);
      let errorMessage = error.response?.data?.detail;

      if (!errorMessage) {
        errorMessage = error.code === "ERR_NETWORK"
          ? "Server unreachable (Network Error). Is Docker running?"
          : `Login failed: ${error.message}`;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full bg-[#02030a] flex items-center justify-center relative overflow-hidden font-sans">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-[#FFA317] rounded-full mix-blend-screen filter blur-[120px] opacity-10 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-[#FFA317] rounded-full mix-blend-screen filter blur-[120px] opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <form onSubmit={handleSubmit} className="relative z-10 bg-[#02030a]/60 backdrop-blur-xl p-10 rounded-2xl border border-white/5 shadow-2xl w-full max-w-md">
        <div className="text-center mb-10">
          {/* VORNAC Logo */}
          <div className="flex justify-center mb-4">
            <img src="/vornac_static.svg" alt="VORNAC" className="h-16 w-auto drop-shadow-[0_0_20px_rgba(255,163,23,0.5)]" />
          </div>
          <p className="text-white/40 text-xs tracking-[0.3em] uppercase">System Access</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/50 rounded p-3 text-red-400 text-xs font-mono">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <button 
            disabled={loading}
            className={`w-full bg-[#FFA317] text-black font-bold uppercase tracking-widest p-4 rounded hover:bg-white hover:text-black hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all duration-300 mt-4 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'AUTHENTICATING...' : 'INITIALIZE'}
          </button>
        </div>
      </form>
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const { isAuthenticated, logout } = useAuthStore();

  // Route to Admin App for /admin/* paths
  if (location.pathname.startsWith('/admin')) {
    return <AdminApp />;
  }

  // Regular app routes
  return (
    <div className="min-h-screen bg-[#02030a] flex flex-col">
      <Navbar onLogout={logout} />
      {!isAuthenticated ? (
        <Login />
      ) : (
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/schedule" element={<NewPentest />} />
          <Route path="/queue" element={<Queue />} />
          <Route path="/results" element={<Results />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;