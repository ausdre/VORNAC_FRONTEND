import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
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
import { login } from './api/client';
import AdminApp from './admin/AdminApp';

const API_BASE = 'http://localhost:8000/api/v1';

function Login() {
  const { login } = useAuthStore();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // MFA state
  const [loginStep, setLoginStep] = useState('credentials'); // 'credentials' | 'mfa' | 'sso'
  const [sessionToken, setSessionToken] = useState(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaEnabled, setMfaEnabled] = useState(false);

  // SSO state
  const [ssoSessionId, setSsoSessionId] = useState(null);
  const [ssoProvider, setSsoProvider] = useState(null);
  const [ssoPolling, setSsoPolling] = useState(false);
  const pollingRef = useRef(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const handleLoginSuccess = (access_token) => {
    const success = login(access_token);

    if (success) {
      localStorage.setItem('access_token', access_token);

      const { user } = useAuthStore.getState();
      if (user?.tenantId) {
        migrateLegacyData(user.tenantId);
        migrateLocalStorageToBackend(user.tenantId).catch(err => {
          console.error('Backend migration error:', err);
        });
      }
    } else {
      setError('Failed to authenticate. Invalid token.');
    }
  };

  // Step 1: Submit credentials
  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Use the standard credentials enforced by the backend script
      const data = await login('admin@companya.com', 'password123');
      const response = await axios.post(`${API_BASE}/auth/login-step1`, {
        email,
        password
      });

      const { access_token } = data;
      
      localStorage.setItem('access_token', access_token);
      setToken(access_token);
      const { session_token, mfa_enabled } = response.data;
      setSessionToken(session_token);
      setMfaEnabled(mfa_enabled);

      if (mfa_enabled) {
        setLoginStep('mfa');
      } else {
        // No MFA - proceed directly to step 2
        await handleStep2Submit(session_token);
      }
    } catch (error) {
      console.error("Login failed", error);
      let errorMessage = error.response?.data?.detail;

      if (!errorMessage) {
        errorMessage = error.code === "ERR_NETWORK"
          ? "Server unreachable. Is the backend running?"
          : `Login failed: ${error.message}`;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit MFA code (or proceed without MFA)
  const handleStep2Submit = async (token = sessionToken, code = null) => {
    setError(null);
    setLoading(true);

    try {
      const payload = {
        session_token: token,
        totp_code: code || (mfaEnabled ? mfaCode : null)
      };

      const response = await axios.post(`${API_BASE}/auth/login-step2`, payload);
      handleLoginSuccess(response.data.access_token);
    } catch (error) {
      console.error("MFA verification failed", error);
      setError(error.response?.data?.detail || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = (e) => {
    e.preventDefault();
    handleStep2Submit();
  };

  // SSO Login
  const handleSsoLogin = async () => {
    setError(null);
    setLoading(true);

    // Extract domain from email for tenant lookup
    const domain = email.split('@')[1];
    if (!domain) {
      setError('Please enter your email address first');
      setLoading(false);
      return;
    }

    try {
      // Try to initiate SSO with email domain as tenant identifier
      const response = await axios.post(`${API_BASE}/sso/auth/initiate`, null, {
        params: { tenant_identifier: domain.split('.')[0] } // Use company name from domain
      });

      const { redirect_url, session_id, provider } = response.data;
      setSsoSessionId(session_id);
      setSsoProvider(provider);
      setLoginStep('sso');

      // Open IdP login in new window
      const ssoWindow = window.open(redirect_url, 'SSO Login', 'width=600,height=700');

      // Start polling for session completion
      setSsoPolling(true);
      pollingRef.current = setInterval(async () => {
        try {
          const statusRes = await axios.get(`${API_BASE}/sso/auth/session/${session_id}`);
          if (statusRes.data.completed) {
            clearInterval(pollingRef.current);
            setSsoPolling(false);
            if (ssoWindow && !ssoWindow.closed) {
              ssoWindow.close();
            }
            handleLoginSuccess(statusRes.data.access_token);
          } else if (statusRes.data.expired) {
            clearInterval(pollingRef.current);
            setSsoPolling(false);
            setError('SSO session expired. Please try again.');
            setLoginStep('credentials');
          }
        } catch (err) {
          console.error('SSO polling error:', err);
        }
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.detail || 'SSO not available for this organization');
      setLoading(false);
    }
  };

  const handleBackToCredentials = () => {
    setLoginStep('credentials');
    setSessionToken(null);
    setMfaCode('');
    setError(null);
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    setSsoPolling(false);
  };

  return (
    <div className="flex-1 w-full bg-[#02030a] flex items-center justify-center relative overflow-hidden font-sans">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-[#FFA317] rounded-full mix-blend-screen filter blur-[120px] opacity-10 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-[#FFA317] rounded-full mix-blend-screen filter blur-[120px] opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 bg-[#02030a]/60 backdrop-blur-xl p-10 rounded-2xl border border-white/5 shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/vornac_static.svg" alt="VORNAC" className="h-16 w-auto drop-shadow-[0_0_20px_rgba(255,163,23,0.5)]" />
          </div>
          <p className="text-white/40 text-xs tracking-[0.3em] uppercase">System Access</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/50 rounded p-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Credentials Step */}
        {loginStep === 'credentials' && (
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div>
              <label className="block text-white/60 text-sm mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:border-[#FFA317] focus:outline-none"
                placeholder="you@company.com"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-white/60 text-sm mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:border-[#FFA317] focus:outline-none"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FFA317] text-black font-bold uppercase tracking-widest p-4 rounded hover:bg-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'AUTHENTICATING...' : 'LOGIN'}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-[#02030a]/60 text-white/40">OR</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSsoLogin}
              disabled={loading || !email}
              className="w-full border border-white/20 text-white font-medium p-4 rounded hover:bg-white/5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span>🔐</span> Sign in with SSO
            </button>
            <p className="text-white/30 text-xs text-center mt-2">
              Enter your email first to use organization SSO
            </p>
          </form>
        )}

        {/* MFA Step */}
        {loginStep === 'mfa' && (
          <form onSubmit={handleMfaSubmit} className="space-y-4">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">🔐</div>
              <h2 className="text-white text-lg font-bold">Two-Factor Authentication</h2>
              <p className="text-white/60 text-sm mt-1">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            <div>
              <input
                type="text"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-4 text-white text-center text-2xl tracking-[0.5em] font-mono placeholder:text-white/30 focus:border-[#FFA317] focus:outline-none"
                placeholder="000000"
                maxLength={6}
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || mfaCode.length !== 6}
              className="w-full bg-[#FFA317] text-black font-bold uppercase tracking-widest p-4 rounded hover:bg-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'VERIFYING...' : 'VERIFY'}
            </button>

            <p className="text-white/40 text-xs text-center">
              You can also use a backup code
            </p>

            <button
              type="button"
              onClick={handleBackToCredentials}
              className="w-full text-white/60 text-sm hover:text-white"
            >
              ← Back to login
            </button>
          </form>
        )}

        {/* SSO Waiting Step */}
        {loginStep === 'sso' && (
          <div className="text-center space-y-4">
            <div className="text-4xl mb-2">🔄</div>
            <h2 className="text-white text-lg font-bold">SSO Authentication</h2>
            <p className="text-white/60 text-sm">
              {ssoPolling
                ? `Complete authentication in the ${ssoProvider || 'SSO'} window...`
                : 'Redirecting to your identity provider...'}
            </p>

            {ssoPolling && (
              <div className="flex justify-center my-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFA317]"></div>
              </div>
            )}

            <button
              type="button"
              onClick={handleBackToCredentials}
              className="w-full text-white/60 text-sm hover:text-white mt-4"
            >
              ← Cancel and go back
            </button>
          </div>
        )}
      </div>
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