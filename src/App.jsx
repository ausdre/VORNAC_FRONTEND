import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Pentest from './pages/Pentest';
import Results from './pages/Results';
import Navbar from './Navbar';

function Login({ setToken }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Bypass login for now (Development Mode)
    // Akzeptiert jeden Input, um Zugriff zu gewähren
    const dummyToken = 'vornac-bypass-token';
    localStorage.setItem('access_token', dummyToken);
    setToken(dummyToken);
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

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-[#FFA317] uppercase tracking-widest mb-2">Identity</label>
            <input 
              className="w-full bg-black/40 border border-white/10 rounded p-3 text-white focus:outline-none focus:border-[#FFA317] focus:shadow-[0_0_20px_rgba(255,163,23,0.15)] transition-all duration-300 placeholder-white/10 font-mono text-sm" 
              placeholder="ENTER ID" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#FFA317] uppercase tracking-widest mb-2">Key</label>
            <input 
              className="w-full bg-black/40 border border-white/10 rounded p-3 text-white focus:outline-none focus:border-[#FFA317] focus:shadow-[0_0_20px_rgba(255,163,23,0.15)] transition-all duration-300 placeholder-white/10 font-mono text-sm" 
              type="password" 
              placeholder="ENTER KEY" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
            />
          </div>
          <button className="w-full bg-[#FFA317] text-black font-bold uppercase tracking-widest p-4 rounded hover:bg-white hover:text-black hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all duration-300 mt-4">
            Initialize
          </button>
        </div>
      </form>
    </div>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('access_token'));

  return (
    <Router>
      <div className="min-h-screen bg-[#02030a] flex flex-col">
        <Navbar />
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