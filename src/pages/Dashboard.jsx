import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getJobs, checkSystemStatus } from '../api/client';

const Dashboard = () => {
  const [stats, setStats] = useState({
    completedScans: 0,
    scheduledScans: 0,
    totalFindings: 0,
    severityCounts: { critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
    recentCompleted: []
  });
  const [activePentest, setActivePentest] = useState(null);
  const [nextScheduled, setNextScheduled] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 1. Check System Status (Health Check)
        await checkSystemStatus();

        // 2. Fetch Jobs for operational stats
        const jobs = await getJobs();

        const active = jobs.find(j => j.status === 'PENDING' || j.status === 'PROCESSING');
        const completed = jobs.filter(j => j.status === 'COMPLETED');
        // Sort by created_at descending (most recent first) and take the first 3
        const recentCompleted = completed
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 3);

        // Set active pentest
        setActivePentest(active || null);

        // Get scheduled pentests from queue
        const queue = JSON.parse(localStorage.getItem('pentest_queue') || '[]');
        const pendingQueue = queue
          .filter(s => s.status === 'pending')
          .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());
        setNextScheduled(pendingQueue[0] || null);

        // Calculate total findings from completed reports
        let findingsCount = 0;
        let severityAgg = { critical: 0, high: 0, medium: 0, low: 0, informational: 0 };

        jobs.forEach(job => {
            if (job.status === 'COMPLETED' && job.result_data?.summary) {
                findingsCount += job.result_data.summary.total_findings || 0;

                const summary = job.result_data.summary;
                if (summary.severity_breakdown) {
                    const breakdown = summary.severity_breakdown;
                    severityAgg.critical += breakdown.critical || 0;
                    severityAgg.high += breakdown.high || 0;
                    severityAgg.medium += breakdown.medium || 0;
                    severityAgg.low += breakdown.low || 0;
                    severityAgg.informational += breakdown.informational || 0;
                } else {
                    severityAgg.critical += summary.critical || 0;
                    severityAgg.high += summary.high || 0;
                    severityAgg.medium += summary.medium || 0;
                    severityAgg.low += summary.low || 0;
                }
            }
        });

        setStats({
          completedScans: completed.length,
          scheduledScans: pendingQueue.length,
          totalFindings: findingsCount,
          severityCounts: severityAgg,
          recentCompleted: recentCompleted
        });

      } catch (error) {
        console.error("Dashboard sync failed", error);
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
        <h1 className="text-3xl font-bold mb-8 tracking-wide" style={{ fontFamily: 'Montserrat, sans-serif' }}>OVERVIEW</h1>

        {/* Active/Scheduled Pentest Card */}
        <div className="bg-[#0a0b14] border border-white/10 rounded-xl p-8 mb-8 shadow-lg relative overflow-hidden">
          {activePentest ? (
            <div>
              {/* Animated Background Scan Effect */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent animate-[scan_3s_ease-in-out_infinite]"></div>
              </div>

              <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="relative">
                  <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6] animate-pulse"></div>
                  <div className="absolute inset-0 w-3 h-3 rounded-full bg-blue-500 animate-ping"></div>
                </div>
                <h2 className="text-xl font-bold text-white">Active Pentest Running</h2>
                <div className="flex gap-1 ml-2">
                  <span className="w-1 h-4 bg-blue-500 rounded-full animate-[bounce_1s_ease-in-out_infinite]"></span>
                  <span className="w-1 h-4 bg-blue-500 rounded-full animate-[bounce_1s_ease-in-out_infinite_0.2s]" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-1 h-4 bg-blue-500 rounded-full animate-[bounce_1s_ease-in-out_infinite_0.4s]" style={{ animationDelay: '0.4s' }}></span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Target</p>
                  <p className="text-white font-semibold">{activePentest.input_data?.client || 'Unknown'}</p>
                  <p className="text-white/50 text-sm font-mono">{activePentest.input_data?.target || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    <p className="text-blue-400 font-semibold">{activePentest.status}</p>
                    <span className="text-blue-400 text-xs animate-pulse">● Scanning</span>
                  </div>
                </div>
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Started</p>
                  <p className="text-white/70">{new Date(activePentest.created_at).toLocaleString()}</p>
                </div>
              </div>

              {/* Animated Progress Bar */}
              <div className="mt-6 relative z-10">
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 rounded-full animate-[progress_2s_ease-in-out_infinite] shadow-[0_0_10px_#3b82f6]"></div>
                </div>
              </div>
            </div>
          ) : nextScheduled ? (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-6 h-6 text-[#FFA317]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <h2 className="text-xl font-bold text-white">Next Scheduled Pentest</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Target</p>
                  <p className="text-white font-semibold">{nextScheduled.target?.name || 'Unknown'}</p>
                  <p className="text-white/50 text-sm font-mono">{nextScheduled.target?.url || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Scheduled For</p>
                  <p className="text-[#FFA317] font-semibold">{new Date(nextScheduled.scheduledFor).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Status</p>
                  <p className="text-white/70">Pending</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-white/50 text-lg">No active or scheduled pentest</p>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Completed Scans */}
            <div className="bg-[#0a0b14] border border-white/10 rounded-xl p-6 shadow-lg">
                <h3 className="text-white/50 text-xs font-bold uppercase tracking-widest mb-4">Scans</h3>
                <div className="space-y-4">
                    <div>
                        <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Completed</p>
                        <div className="text-4xl font-bold text-white">{stats.completedScans}</div>
                    </div>
                    <div className="border-t border-white/5 pt-4">
                        <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Scheduled</p>
                        <div className="text-4xl font-bold text-[#FFA317]">{stats.scheduledScans}</div>
                    </div>
                </div>
            </div>

            {/* Vulnerabilities */}
            <div className="bg-[#0a0b14] border border-white/10 rounded-xl p-6 shadow-lg">
                <h3 className="text-white/50 text-xs font-bold uppercase tracking-widest mb-4">Total Vulnerabilities</h3>
                <div className="text-4xl font-bold text-[#FFA317] mb-4">{stats.totalFindings}</div>
                <div className="space-y-2 border-t border-white/5 pt-3">
                    <div className="flex justify-between text-sm items-center">
                        <span className="text-red-500 font-bold tracking-wider">CRITICAL</span>
                        <span className="text-white bg-red-500/10 px-3 py-1 rounded font-bold">{stats.severityCounts.critical}</span>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                        <span className="text-orange-500 font-bold tracking-wider">HIGH</span>
                        <span className="text-white bg-orange-500/10 px-3 py-1 rounded font-bold">{stats.severityCounts.high}</span>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                        <span className="text-yellow-500 font-bold tracking-wider">MEDIUM</span>
                        <span className="text-white bg-yellow-500/10 px-3 py-1 rounded font-bold">{stats.severityCounts.medium}</span>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                        <span className="text-blue-500 font-bold tracking-wider">LOW</span>
                        <span className="text-white bg-blue-500/10 px-3 py-1 rounded font-bold">{stats.severityCounts.low}</span>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                        <span className="text-gray-400 font-bold tracking-wider">INFO</span>
                        <span className="text-white bg-gray-500/10 px-3 py-1 rounded font-bold">{stats.severityCounts.informational}</span>
                    </div>
                </div>
            </div>

            {/* Recent Pentests */}
            <div className="bg-[#0a0b14] border border-white/10 rounded-xl p-6 shadow-lg">
                <h3 className="text-white/50 text-xs font-bold uppercase tracking-widest mb-4">Recent Pentests</h3>
                {stats.recentCompleted.length > 0 ? (
                    <div className="space-y-3">
                        {stats.recentCompleted.map((pentest, idx) => (
                            <div key={idx} className="border-b border-white/5 pb-3 last:border-0 last:pb-0">
                                <p className="text-white font-semibold text-sm mb-1">{pentest.input_data?.client || 'Unknown'}</p>
                                <p className="text-white/40 text-xs font-mono">{pentest.input_data?.target || 'Unknown'}</p>
                                <p className="text-white/30 text-xs mt-1">{new Date(pentest.created_at).toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-white/30 text-sm">No completed pentests yet</p>
                    </div>
                )}
            </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0a0b14] border border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-[#FFA317]/50 transition-colors group cursor-pointer relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FFA317]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-16 h-16 rounded-full bg-[#FFA317]/10 flex items-center justify-center mb-4 group-hover:bg-[#FFA317]/20 transition-colors z-10">
                    <span className="text-2xl text-[#FFA317]">+</span>
                </div>
                <h3 className="text-xl font-bold mb-2 z-10">Manage Targets</h3>
                <p className="text-white/50 text-sm mb-6 max-w-xs z-10">Add targets and schedule automated security assessments on your infrastructure.</p>
                <Link to="/schedule" className="z-10 px-6 py-2 bg-[#FFA317] text-black font-bold rounded hover:bg-white transition-colors uppercase text-sm tracking-wider">
                    Manage
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