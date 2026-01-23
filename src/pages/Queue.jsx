import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Queue = () => {
  const [activePentest, setActivePentest] = useState(null);
  const [scheduledQueue, setScheduledQueue] = useState([]);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchQueue = async () => {
    try {
      const token = localStorage.getItem('access_token');

      // Fetch active pentests from API
      const response = await axios.get('http://localhost:8000/api/v1/inference/', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const jobs = response.data;
      const active = jobs.find(j => j.status === 'PENDING' || j.status === 'PROCESSING');
      setActivePentest(active || null);

      // Fetch scheduled pentests from localStorage
      const queue = JSON.parse(localStorage.getItem('pentest_queue') || '[]');
      const pending = queue
        .filter(s => s.status === 'pending')
        .sort((a, b) => {
          // Sort by priority first (immediate = 0), then by scheduled time
          const aPriority = a.priority || 999;
          const bPriority = b.priority || 999;
          if (aPriority !== bPriority) {
            return aPriority - bPriority;
          }
          return new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime();
        })
        .slice(0, 50); // Limit to next 50 tests

      setScheduledQueue(pending);
    } catch (error) {
      console.error('Failed to fetch queue:', error);
    }
  };

  const handleDeleteScheduled = (scheduledId) => {
    const queue = JSON.parse(localStorage.getItem('pentest_queue') || '[]');
    const updated = queue.filter(s => s.id !== scheduledId);
    localStorage.setItem('pentest_queue', JSON.stringify(updated));
    fetchQueue();
  };

  const formatTimeRemaining = (scheduledFor) => {
    const now = new Date();
    const scheduled = new Date(scheduledFor);
    const diff = scheduled - now;

    if (diff < 0) return 'Starting soon...';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-[#02030a] p-8 pt-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 tracking-wide" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          QUEUE
        </h1>

        {/* Active Pentest Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Active Pentest
          </h2>

          {activePentest ? (
            <div className="bg-[#0a0b14] border border-white/10 rounded-xl p-6 shadow-lg relative overflow-hidden">
              {/* Animated Background Scan Effect */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent animate-[scan_3s_ease-in-out_infinite]"></div>
              </div>

              <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="relative">
                  <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6] animate-pulse"></div>
                  <div className="absolute inset-0 w-3 h-3 rounded-full bg-blue-500 animate-ping"></div>
                </div>
                <h3 className="text-lg font-bold text-white">Running</h3>
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
          ) : (
            <div className="bg-[#0a0b14] border border-white/10 rounded-xl p-8 text-center shadow-lg">
              <p className="text-white/50">No active pentest running</p>
            </div>
          )}
        </div>

        {/* Scheduled Pentests Section */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#FFA317]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" strokeLinecap="round"/>
              <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" strokeLinecap="round"/>
              <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Scheduled Pentests ({scheduledQueue.length})
          </h2>

          {scheduledQueue.length === 0 ? (
            <div className="bg-[#0a0b14] border border-white/10 rounded-xl p-8 text-center shadow-lg">
              <p className="text-white/50">No scheduled pentests in queue</p>
            </div>
          ) : (
            <div className="space-y-4">
              {scheduledQueue.map((scheduled, index) => (
                <div
                  key={scheduled.id}
                  className="bg-[#0a0b14] border border-white/10 rounded-xl p-6 shadow-lg hover:border-white/20 transition-all duration-300 relative group"
                >
                  {/* Queue Position Badge */}
                  <div className="absolute top-4 left-4 w-10 h-10 rounded-lg bg-[#FFA317]/20 border border-[#FFA317]/40 flex items-center justify-center">
                    <span className="text-[#FFA317] font-bold text-lg">#{index + 1}</span>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteScheduled(scheduled.id)}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 transition-all duration-200 opacity-0 group-hover:opacity-100"
                    title="Remove from queue"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>

                  <div className="ml-14">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      {/* Target Info */}
                      <div className="md:col-span-2">
                        <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Target</p>
                        <p className="text-white font-semibold text-lg">{scheduled.target?.name || 'Unknown'}</p>
                        <p className="text-white/50 text-sm font-mono mt-1">{scheduled.target?.url || 'Unknown'}</p>
                      </div>

                      {/* Scheduled Date/Time */}
                      <div>
                        <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Scheduled For</p>
                        <p className="text-[#FFA317] font-bold text-lg">
                          {new Date(scheduled.scheduledFor).toLocaleDateString()}
                        </p>
                        <p className="text-[#FFA317] text-sm">
                          {new Date(scheduled.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      {/* Time Remaining */}
                      <div>
                        <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Starting In</p>
                        <p className="text-white font-semibold text-lg">{formatTimeRemaining(scheduled.scheduledFor)}</p>
                        {scheduled.priority === 0 && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-[#FFA317]/20 border border-[#FFA317]/40 text-[#FFA317] text-xs font-bold rounded">
                            IMMEDIATE
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Queue;
