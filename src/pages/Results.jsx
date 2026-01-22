import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Results = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedJob, setExpandedJob] = useState(null);

  useEffect(() => {
    fetchJobs();
    // Polling alle 5 Sekunden für Updates
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('http://localhost:8000/api/v1/inference/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJobs(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch jobs", err);
      
      // Wenn Token ungültig (401), ausloggen und neu laden
      if (err.response && err.response.status === 401) {
        localStorage.removeItem('access_token');
        window.location.reload();
        return;
      }

      // Fehler nur setzen, wenn wir noch gar keine Daten haben
      if (jobs.length === 0) {
        setError("Could not load results. Please ensure the backend is running.");
      }
      setLoading(false);
    }
  };

  const toggleExpand = (jobId) => {
    setExpandedJob(expandedJob === jobId ? null : jobId);
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'HIGH': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'MEDIUM': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'LOW': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getTrafficLightColor = (light) => {
    switch (light) {
      case 'RED': return 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]';
      case 'YELLOW': return 'bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.6)]';
      case 'GREEN': return 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-[#02030a] p-8 pt-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 tracking-wide" style={{ fontFamily: 'Montserrat, sans-serif' }}>OPERATION RESULTS</h1>

        {loading && jobs.length === 0 && <p className="text-white/50 animate-pulse">Loading operations data...</p>}
        {error && <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded mb-6">{error}</div>}

        <div className="space-y-6">
          {jobs.map((job) => {
            const isCompleted = job.status === 'COMPLETED';
            const report = job.result_data;
            const isExpanded = expandedJob === job.id;

            return (
              <div key={job.id} className="bg-[#0a0b14] border border-white/10 rounded-xl overflow-hidden transition-all duration-300 hover:border-white/20 shadow-lg">
                {/* Header Row */}
                <div 
                  className="p-6 flex items-center justify-between cursor-pointer bg-white/5 hover:bg-white/10 transition-colors"
                  onClick={() => isCompleted && toggleExpand(job.id)}
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-3 h-3 rounded-full ${isCompleted ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-blue-500 animate-pulse'}`}></div>
                    <div>
                      <h3 className="text-white font-semibold text-lg">
                        {report?.metadata?.client_name || job.input_data?.target || "Unknown Target"}
                      </h3>
                      <p className="text-white/40 text-xs font-mono uppercase tracking-wider">{job.id}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-white/40 text-xs uppercase tracking-wider">Status</p>
                      <p className={`font-medium ${isCompleted ? 'text-green-400' : 'text-blue-400'}`}>{job.status}</p>
                    </div>
                    
                    {isCompleted && report?.summary && (
                      <>
                        <div className="text-right hidden sm:block">
                          <p className="text-white/40 text-xs uppercase tracking-wider">Risk Score</p>
                          <p className="text-white font-bold text-xl">{report.summary.risk_score}</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full ${getTrafficLightColor(report.summary.traffic_light)}`}></div>
                      </>
                    )}
                    
                    <div className={`text-white/30 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                      ▼
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && isCompleted && report && (
                  <div className="p-8 border-t border-white/10 bg-[#05060a]">
                    
                    {/* Summary Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                      <div className="col-span-2">
                        <h4 className="text-[#FFA317] text-xs font-bold uppercase tracking-widest mb-4">Management Summary</h4>
                        <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">
                          {report.summary.management}
                        </p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-6 border border-white/5">
                        <h4 className="text-white/60 text-xs uppercase tracking-widest mb-4">Severity Breakdown</h4>
                        <div className="space-y-3">
                          {Object.entries(report.summary.severity_breakdown).map(([level, count]) => (
                            count > 0 && (
                              <div key={level} className="flex justify-between items-center">
                                <span className="text-white/80 capitalize text-sm">{level}</span>
                                <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getSeverityColor(level)}`}>
                                  {count}
                                </span>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Findings List */}
                    <div>
                      <h4 className="text-[#FFA317] text-xs font-bold uppercase tracking-widest mb-6">Detailed Findings</h4>
                      <div className="space-y-4">
                        {report.findings.map((finding) => (
                          <div key={finding.id} className="bg-[#0f111a] border border-white/5 rounded-lg p-6 hover:border-white/10 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide border ${getSeverityColor(finding.severity)}`}>
                                  {finding.severity}
                                </span>
                                <h5 className="text-white font-medium text-lg">{finding.title}</h5>
                              </div>
                              <span className="text-white/30 text-xs font-mono">{finding.id}</span>
                            </div>
                            <p className="text-white/60 text-sm mb-4 leading-relaxed">{finding.description}</p>
                            <div className="flex gap-6 text-xs text-white/40 font-mono border-t border-white/5 pt-3">
                              <span>CVSS: <span className="text-white/70">{finding.cvss_score}</span></span>
                              <span>Assets: <span className="text-white/70">{finding.affected_assets.length}</span></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Results;