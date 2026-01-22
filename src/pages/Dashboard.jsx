import React from 'react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-[#02030a] text-white font-sans selection:bg-[#FFA317] selection:text-black">

       <main className="max-w-7xl mx-auto px-6 py-12">
          {/* Welcome Section */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>COMMAND CENTER</h1>
            <p className="text-white/40 tracking-wider text-sm">SYSTEM STATUS: NOMINAL // AUTHORIZED PERSONNEL ONLY</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
             {/* Card 1 */}
             <div className="bg-white/5 border border-white/10 p-6 rounded-lg hover:border-[#FFA317]/50 transition-colors group">
                <h3 className="text-[#FFA317] text-xs font-bold tracking-widest mb-4 uppercase">Active Operations</h3>
                <div className="text-5xl font-bold mb-2 group-hover:text-[#FFA317] transition-colors" style={{ fontFamily: 'Montserrat, sans-serif' }}>0</div>
                <p className="text-white/40 text-xs">NO ACTIVE SCANS</p>
             </div>
             {/* Card 2 */}
             <div className="bg-white/5 border border-white/10 p-6 rounded-lg hover:border-[#FFA317]/50 transition-colors group">
                <h3 className="text-[#FFA317] text-xs font-bold tracking-widest mb-4 uppercase">Vulnerabilities</h3>
                <div className="text-5xl font-bold mb-2 group-hover:text-[#FFA317] transition-colors" style={{ fontFamily: 'Montserrat, sans-serif' }}>12</div>
                <p className="text-white/40 text-xs">DETECTED IN LAST CYCLE</p>
             </div>
             {/* Card 3 */}
             <div className="bg-white/5 border border-white/10 p-6 rounded-lg hover:border-[#FFA317]/50 transition-colors group">
                <h3 className="text-[#FFA317] text-xs font-bold tracking-widest mb-4 uppercase">System Health</h3>
                <div className="text-5xl font-bold mb-2 text-emerald-500" style={{ fontFamily: 'Montserrat, sans-serif' }}>98%</div>
                <p className="text-white/40 text-xs">OPTIMAL PERFORMANCE</p>
             </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-xl p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z"/></svg>
                </div>
                <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>INITIATE NEW SCAN</h2>
                <p className="text-white/60 mb-8 max-w-md">Deploy automated penetration testing protocols against target infrastructure. Configure parameters and launch immediate or scheduled assessments.</p>
                <Link to="/pentest" className="inline-flex items-center gap-2 bg-[#FFA317] text-black font-bold px-6 py-3 rounded hover:bg-white transition-colors uppercase tracking-wider text-sm">
                    <span>Launch Interface</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </Link>
             </div>
             
             <div className="bg-white/5 border border-white/10 rounded-xl p-8 flex flex-col justify-center items-center text-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-white/40">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                </div>
                <h3 className="text-lg font-bold mb-2">Recent Reports</h3>
                <p className="text-white/40 text-sm mb-6">Access detailed analysis from previous operations.</p>
                <button className="text-[#FFA317] text-sm font-bold tracking-widest hover:text-white transition-colors uppercase border-b border-[#FFA317] pb-1">View Archive</button>
             </div>
          </div>
       </main>
    </div>
  );
};

export default Dashboard;