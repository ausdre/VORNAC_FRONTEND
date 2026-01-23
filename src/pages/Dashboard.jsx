import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState({
    activeScans: 0,
    completedScans: 0,
    totalFindings: 0,
    severityCounts: { critical: 0, high: 0, medium: 0, low: 0 },
    systemStatus: 'Checking...',
    backendLatency: null
  });

  useEffect(() => {
    const fetchStats = async () => {
      const start = Date.now();
      try {
        const token = localStorage.getItem('access_token');
        
        // 1. Check System Status (Health Check & Latency)
        // We hit the root endpoint which returns a simple message
        await axios.get('http://localhost:8000/');
        const latency = Date.now() - start;

        // 2. Fetch Jobs for operational stats
        const response = await axios.get('http://localhost:8000/api/v1/inference/', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const jobs = response.data;
        const active = jobs.filter(j => j.status === 'PENDING' || j.status === 'PROCESSING').length;
        const completed = jobs.filter(j => j.status === 'COMPLETED').length;
        
        // Calculate total findings from completed reports
        let findingsCount = 0;
        let severityAgg = { critical: 0, high: 0, medium: 0, low: 0 };

        jobs.forEach(job => {
            if (job.status === 'COMPLETED' && job.result_data?.summary) {
                findingsCount += job.result_data.summary.total_findings || 0;
                
                const breakdown = job.result_data.summary.severity_breakdown;
                if (breakdown) {
                    severityAgg.critical += breakdown.critical || 0;
                    severityAgg.high += breakdown.high || 0;
                    severityAgg.medium += breakdown.medium || 0;
                    severityAgg.low += breakdown.low || 0;
                }
            }
        });

        setStats({
          activeScans: active,
          completedScans: completed,
          totalFindings: findingsCount,
          severityCounts: severityAgg,
          systemStatus: 'OPERATIONAL',
          backendLatency: latency
        });

      } catch (error) {
        console.error("Dashboard sync failed", error);
        setStats(prev => ({ ...prev, systemStatus: 'OFFLINE', backendLatency: null }));
      }
    };

    fetchStats();
    // Refresh stats every 5 seconds
    const interval = setInterval(fetchStats, 5000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#02030a] p-8 pt-12 font-sans text-white">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 tracking-wide" style={{ fontFamily: 'Montserrat, sans-serif' }}>DASHBOARD</h1>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {/* System Status Widget */}
            <div className="bg-[#0a0b14] border border-white/10 rounded-xl p-6 shadow-lg relative overflow-hidden group">
                <div className={`absolute top-0 right-0 w-20 h-20 rounded-bl-full transition-colors ${stats.systemStatus === 'OPERATIONAL' ? 'bg-green-500/10' : 'bg-red-500/10'}`}></div>
                <h3 className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2">System Status</h3>
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full animate-pulse ${stats.systemStatus === 'OPERATIONAL' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`}></div>
                    <span className={`text-xl font-bold tracking-wide ${stats.systemStatus === 'OPERATIONAL' ? 'text-white' : 'text-red-400'}`}>{stats.systemStatus}</span>
                </div>
                {stats.backendLatency && (
                    <p className="text-white/30 text-xs mt-2 font-mono">Latency: {stats.backendLatency}ms</p>
                )}
            </div>

            {/* Active Scans */}
            <div className="bg-[#0a0b14] border border-white/10 rounded-xl p-6 shadow-lg">
                <h3 className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2">Active Operations</h3>
                <div className="text-4xl font-bold text-white">{stats.activeScans}</div>
            </div>

            {/* Completed Scans */}
            <div className="bg-[#0a0b14] border border-white/10 rounded-xl p-6 shadow-lg">
                <h3 className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2">Completed Scans</h3>
                <div className="text-4xl font-bold text-white">{stats.completedScans}</div>
            </div>

            {/* Total Findings */}
            <div className="bg-[#0a0b14] border border-white/10 rounded-xl p-6 shadow-lg">
                <h3 className="text-white/50 text-xs font-bold uppercase tracking-widest mb-4">Vulnerabilities</h3>
                <div className="flex items-end gap-2 mb-4">
                    <div className="text-4xl font-bold text-[#FFA317]">{stats.totalFindings}</div>
                    <div className="text-white/40 text-sm mb-1">Total</div>
                </div>
                <div className="space-y-2 border-t border-white/5 pt-2">
                    <div className="flex justify-between text-xs items-center">
                        <span className="text-red-500 font-bold tracking-wider">CRITICAL</span>
                        <span className="text-white bg-white/5 px-2 rounded">{stats.severityCounts.critical}</span>
                    </div>
                    <div className="flex justify-between text-xs items-center">
                        <span className="text-orange-500 font-bold tracking-wider">HIGH</span>
                        <span className="text-white bg-white/5 px-2 rounded">{stats.severityCounts.high}</span>
                    </div>
                    <div className="flex justify-between text-xs items-center">
                        <span className="text-yellow-500 font-bold tracking-wider">MEDIUM</span>
                        <span className="text-white bg-white/5 px-2 rounded">{stats.severityCounts.medium}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0a0b14] border border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-[#FFA317]/50 transition-colors group cursor-pointer relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FFA317]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-16 h-16 rounded-full bg-[#FFA317]/10 flex items-center justify-center mb-4 group-hover:bg-[#FFA317]/20 transition-colors z-10">
                    <span className="text-2xl text-[#FFA317]">+</span>
                </div>
                <h3 className="text-xl font-bold mb-2 z-10">Schedule New Pentest</h3>
                <p className="text-white/50 text-sm mb-6 max-w-xs z-10">Launch a new automated security assessment on your infrastructure.</p>
                <Link to="/schedule" className="z-10 px-6 py-2 bg-[#FFA317] text-black font-bold rounded hover:bg-white transition-colors uppercase text-sm tracking-wider">
                    Start Operation
                </Link>
            </div>

            <div className="bg-[#0a0b14] border border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-white/30 transition-colors group cursor-pointer">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors">
                    <span className="text-2xl text-white">➜</span>
                </div>
                <h3 className="text-xl font-bold mb-2">View Reports</h3>
                <p className="text-white/50 text-sm mb-6 max-w-xs">Analyze findings and download detailed PDF reports of completed scans.</p>
                <Link to="/results" className="px-6 py-2 border border-white/20 text-white font-bold rounded hover:bg-white hover:text-black transition-colors uppercase text-sm tracking-wider">
                    Go to Results
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;