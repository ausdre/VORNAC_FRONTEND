import React, { useState } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Pentest from './pages/Pentest';
import Results from './pages/Results';
import Navbar from './Navbar';

function Login({ setToken }) {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const attemptLogin = async (username, password) => {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    return axios.post('http://localhost:8000/api/v1/auth/login', params);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // Use the standard credentials enforced by the backend script
      const response = await attemptLogin('admin@companya.com', 'password123');

      const { access_token } = response.data;
      
      localStorage.setItem('access_token', access_token);
      setToken(access_token);
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
          <h1 className="text-4xl font-bold text-white tracking-wider mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>VORNAC</h1>
          <div className="h-0.5 w-16 bg-[#FFA317] mx-auto shadow-[0_0_15px_rgba(255,163,23,0.5)]"></div>
          <p className="text-white/40 text-xs tracking-[0.3em] mt-3 uppercase">System Access</p>
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

function App() {
  const [token, setToken] = useState(localStorage.getItem('access_token'));

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
  };

  return (
    <Router>
      <div className="min-h-screen bg-[#02030a] flex flex-col">
        <Navbar token={token} onLogout={handleLogout} />
        {!token ? (
          <Login setToken={setToken} />
        ) : (
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/schedule" element={<Pentest />} />
            <Route path="/results" element={<Results />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        )}
      </div>
    </Router>
  );
}

export default App;