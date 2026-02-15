import React, { useEffect, useState } from 'react';
import { getJobs, deleteJob, downloadPentestReport, finalizePentest } from '../api/client';

const Results = () => {
  const [jobs, setJobs] = useState([]);
  const [targets, setTargets] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedPentest, setExpandedPentest] = useState(null);
  const [deletePentestConfirm, setDeletePentestConfirm] = useState(null); // { id, name }
  const [finalizeConfirm, setFinalizeConfirm] = useState(null); // { id, name }
  const [searchQuery, setSearchQuery] = useState('');
  const [errorModal, setErrorModal] = useState(null); // { message }

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchJobs = async () => {
    try {
      const data = await getJobs();
      setJobs(data);

      // Group pentests by target URL
      const grouped = groupPentestsByTarget(data);
      setTargets(grouped);

      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch jobs", err);

      if (err.response && err.response.status === 401) {
        localStorage.removeItem('access_token');
        window.location.reload();
        return;
      }

      if (jobs.length === 0) {
        setError("Could not load results. Please ensure the backend is running.");
      }
      setLoading(false);
    }
  };

  const groupPentestsByTarget = (pentests) => {
    const targetMap = {};

    // First, load all targets from localStorage
    const savedTargets = JSON.parse(localStorage.getItem('pentest_targets') || '[]');
    savedTargets.forEach(target => {
      targetMap[target.url] = {
        id: target.url,
        name: target.name,
        url: target.url,
        description: target.description,
        pentests: [],
        pentest_count: 0,
        findings: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          informational: 0,
          total: 0
        }
      };
    });

    // Then, add pentests to targets
    pentests.forEach(job => {
      const targetUrl = job.input_data?.target || 'Unknown Target';
      const targetName = job.result_data?.metadata?.client_name || job.input_data?.client || targetUrl;

      if (!targetMap[targetUrl]) {
        targetMap[targetUrl] = {
          id: targetUrl,
          name: targetName,
          url: targetUrl,
          pentests: [],
          pentest_count: 0,
          findings: {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            informational: 0,
            total: 0
          }
        };
      }

      targetMap[targetUrl].pentests.push(job);
      targetMap[targetUrl].pentest_count += 1;

      // Aggregate findings from completed pentests
      if (job.status === 'COMPLETED' && job.result_data?.summary?.severity_breakdown) {
        const breakdown = job.result_data.summary.severity_breakdown;
        // Handle both old format (numbers) and new format (objects with open/mitigated)
        const getSeverityCount = (value) => {
          if (typeof value === 'number') return value;
          if (typeof value === 'object' && value !== null) return (value.open || 0) + (value.mitigated || 0);
          return 0;
        };

        targetMap[targetUrl].findings.critical += getSeverityCount(breakdown.critical);
        targetMap[targetUrl].findings.high += getSeverityCount(breakdown.high);
        targetMap[targetUrl].findings.medium += getSeverityCount(breakdown.medium);
        targetMap[targetUrl].findings.low += getSeverityCount(breakdown.low);
        targetMap[targetUrl].findings.informational += getSeverityCount(breakdown.informational);
        targetMap[targetUrl].findings.total += job.result_data.summary.total_findings || 0;
      }
    });

    return Object.values(targetMap);
  };

  const handleTargetClick = (target) => {
    setSelectedTarget(target);
    setExpandedPentest(null);
  };

  const handleBackToTargets = () => {
    setSelectedTarget(null);
    setExpandedPentest(null);
  };

  const toggleExpandPentest = (pentestId) => {
    setExpandedPentest(expandedPentest === pentestId ? null : pentestId);
  };

  const handleDeletePentest = (pentest) => {
    const pentestName = pentest.result_data?.metadata?.report_id || `Pentest ${pentest.id}`;
    setDeletePentestConfirm({ id: pentest.id, name: pentestName });
  };

  const confirmDeletePentest = async () => {
    try {
      await deleteJob(deletePentestConfirm.id);
      setDeletePentestConfirm(null);
      // Refresh the jobs list
      await fetchJobs();
    } catch (error) {
      console.error('Failed to delete pentest:', error);
      setDeletePentestConfirm(null);
      setErrorModal({ message: 'Failed to delete pentest. Please try again.' });
    }
  };

  const cancelDeletePentest = () => {
    setDeletePentestConfirm(null);
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

  const handleDownloadReport = async (job) => {
    try {
      // Call API to generate and download PDF
      const blob = await downloadPentestReport(job.id);

      // Create a download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Generate filename
      const targetName = job.result_data?.metadata?.client_name || job.input_data?.client || 'pentest';
      const safeName = targetName.replace(/[^a-zA-Z0-9\s\-_]/g, '_');
      link.download = `VORNAC_Report_${safeName}_${job.id.substring(0, 8)}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the URL object
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download report:', error);
      setErrorModal({
        message: `Failed to download report: ${error.response?.data?.detail || error.message}`
      });
    }
  };

  const handleFinalizePentest = (pentest) => {
    const pentestName = pentest.result_data?.metadata?.report_id || `Pentest ${pentest.id}`;
    const isFinal = pentest.result_data?.metadata?.is_final || false;
    const severityBreakdown = pentest.result_data?.summary?.severity_breakdown || {};

    // Handle both old format (numbers) and new format (objects with open/mitigated)
    const getOpenCount = (value) => {
      if (typeof value === 'number') return value;
      if (typeof value === 'object' && value !== null) return value.open || 0;
      return 0;
    };

    const critical = getOpenCount(severityBreakdown.critical);
    const high = getOpenCount(severityBreakdown.high);
    const medium = getOpenCount(severityBreakdown.medium);

    // Check if already finalized
    if (isFinal) {
      setErrorModal({
        message: 'This pentest is already finalized.'
      });
      return;
    }

    // Check if there are blocking findings
    if (critical > 0 || high > 0 || medium > 0) {
      const issues = [];
      if (critical > 0) issues.push(`${critical} CRITICAL`);
      if (high > 0) issues.push(`${high} HIGH`);
      if (medium > 0) issues.push(`${medium} MEDIUM`);

      setErrorModal({
        message: `You have ${issues.join(', ')} severity finding(s). Please address these issues before finalizing the pentest.`
      });
      return;
    }

    // All checks passed, show confirmation modal
    setFinalizeConfirm({ id: pentest.id, name: pentestName });
  };

  const confirmFinalizePentest = async () => {
    try {
      await finalizePentest(finalizeConfirm.id);
      setFinalizeConfirm(null);
      // Refresh the jobs list to show updated status
      await fetchJobs();
    } catch (error) {
      console.error('Failed to finalize pentest:', error);
      setFinalizeConfirm(null);
      setErrorModal({
        message: error.response?.data?.detail || 'Failed to finalize pentest. Please try again.'
      });
    }
  };

  const cancelFinalizePentest = () => {
    setFinalizeConfirm(null);
  };

  // Target List View
  if (!selectedTarget) {
    return (
      <div className="min-h-screen bg-[#02030a] p-8 pt-12">
        {/* Delete Single Pentest Modal */}
        {deletePentestConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={cancelDeletePentest}>
            <div className="bg-[#0a0b14] border border-white/20 rounded-xl p-8 max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                  <span className="text-3xl">⚠️</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Delete Pentest?</h2>
                <p className="text-white/60">
                  Are you sure you want to delete <span className="text-white font-semibold">"{deletePentestConfirm.name}"</span>?
                </p>
                <p className="text-white/40 text-sm mt-2">This action cannot be undone.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={cancelDeletePentest}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-3 px-4 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeletePentest}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}


        {/* Error Modal */}
        {errorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setErrorModal(null)}>
            <div className="bg-[#0a0b14] border border-white/20 rounded-xl p-8 max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
                <p className="text-white/60">{errorModal.message}</p>
              </div>
              <button
                onClick={() => setErrorModal(null)}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all duration-200"
              >
                OK
              </button>
            </div>
          </div>
        )}

        {/* Finalize Pentest Modal */}
        {finalizeConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={cancelFinalizePentest}>
            <div className="bg-[#0a0b14] border border-white/20 rounded-xl p-8 max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Finalize Pentest?</h2>
                <p className="text-white/60">
                  Are you sure you want to finalize <span className="text-white font-semibold">"{finalizeConfirm.name}"</span>?
                </p>
                <p className="text-white/40 text-sm mt-2">Once finalized, the next pentest for this target will start at version 0.8.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={cancelFinalizePentest}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-3 px-4 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmFinalizePentest}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all duration-200"
                >
                  Finalize
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8 tracking-wide" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            TARGETS
          </h1>

          {/* Search Field */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search targets by name, URL, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0b14] border border-white/10 rounded-lg py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:border-[#FFA317] focus:ring-1 focus:ring-[#FFA317] transition-colors"
            />
          </div>

          {loading && targets.length === 0 && <p className="text-white/50 animate-pulse">Loading targets...</p>}
          {error && <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded mb-6">{error}</div>}

          {targets.length === 0 && !loading && (
            <div className="bg-[#0a0b14] border border-white/10 rounded-xl p-8 text-center">
              <p className="text-white/50 mb-4">No targets found. Create a pentest to get started.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {targets.filter(target => {
              if (!searchQuery) return true;
              const query = searchQuery.toLowerCase();
              return (
                target.name.toLowerCase().includes(query) ||
                target.url.toLowerCase().includes(query) ||
                (target.description && target.description.toLowerCase().includes(query))
              );
            }).map((target) => (
              <div
                key={target.id}
                onClick={() => handleTargetClick(target)}
                className="bg-[#0a0b14] border border-white/10 rounded-xl p-6 cursor-pointer hover:border-[#FFA317] transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(255,163,23,0.3)] group flex flex-col"
              >
                {/* Header */}
                <div className="mb-4">
                  <h3 className="text-white font-bold text-xl mb-2 group-hover:text-[#FFA317] transition-colors">{target.name}</h3>
                  <p className="text-white/50 text-sm font-mono break-all">{target.url}</p>
                </div>

                {/* Findings Breakdown */}
                <div className="mb-4 flex-grow">
                  <div className="grid grid-cols-5 gap-2">
                    {target.findings.critical > 0 && (
                      <div className="text-center">
                        <div className="bg-red-500/20 text-red-500 rounded-lg py-2 px-1 font-bold text-sm border border-red-500/30">
                          {target.findings.critical}
                        </div>
                        <span className="text-red-500/70 text-[10px] uppercase mt-1 block font-medium">Crit</span>
                      </div>
                    )}
                    {target.findings.high > 0 && (
                      <div className="text-center">
                        <div className="bg-orange-500/20 text-orange-500 rounded-lg py-2 px-1 font-bold text-sm border border-orange-500/30">
                          {target.findings.high}
                        </div>
                        <span className="text-orange-500/70 text-[10px] uppercase mt-1 block font-medium">High</span>
                      </div>
                    )}
                    {target.findings.medium > 0 && (
                      <div className="text-center">
                        <div className="bg-yellow-500/20 text-yellow-500 rounded-lg py-2 px-1 font-bold text-sm border border-yellow-500/30">
                          {target.findings.medium}
                        </div>
                        <span className="text-yellow-500/70 text-[10px] uppercase mt-1 block font-medium">Med</span>
                      </div>
                    )}
                    {target.findings.low > 0 && (
                      <div className="text-center">
                        <div className="bg-blue-500/20 text-blue-500 rounded-lg py-2 px-1 font-bold text-sm border border-blue-500/30">
                          {target.findings.low}
                        </div>
                        <span className="text-blue-500/70 text-[10px] uppercase mt-1 block font-medium">Low</span>
                      </div>
                    )}
                    {target.findings.informational > 0 && (
                      <div className="text-center">
                        <div className="bg-gray-500/20 text-gray-400 rounded-lg py-2 px-1 font-bold text-sm border border-gray-500/30">
                          {target.findings.informational}
                        </div>
                        <span className="text-gray-400/70 text-[10px] uppercase mt-1 block font-medium">Info</span>
                      </div>
                    )}
                  </div>
                  {target.findings.total === 0 && (
                    <p className="text-white/30 text-xs text-center py-2">No findings yet</p>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#FFA317]/20 text-[#FFA317] w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg">
                      {target.pentest_count}
                    </div>
                    <span className="text-white/50 text-sm">
                      {target.pentest_count === 1 ? 'Pentest' : 'Pentests'}
                    </span>
                  </div>
                  <span className="text-[#FFA317] text-sm font-medium flex items-center gap-1">
                    View <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Pentest List View (Drilldown)
  const pentests = selectedTarget.pentests;

  return (
    <div className="min-h-screen bg-[#02030a] p-8 pt-12">
      {/* Delete Single Pentest Modal */}
      {deletePentestConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={cancelDeletePentest}>
          <div className="bg-[#0a0b14] border border-white/20 rounded-xl p-8 max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                <span className="text-3xl">⚠️</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Delete Pentest?</h2>
              <p className="text-white/60">
                Are you sure you want to delete <span className="text-white font-semibold">"{deletePentestConfirm.name}"</span>?
              </p>
              <p className="text-white/40 text-sm mt-2">This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={cancelDeletePentest}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-3 px-4 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeletePentest}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {errorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setErrorModal(null)}>
          <div className="bg-[#0a0b14] border border-white/20 rounded-xl p-8 max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
              <p className="text-white/60">{errorModal.message}</p>
            </div>
            <button
              onClick={() => setErrorModal(null)}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all duration-200"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Finalize Pentest Modal */}
      {finalizeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={cancelFinalizePentest}>
          <div className="bg-[#0a0b14] border border-white/20 rounded-xl p-8 max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Finalize Pentest?</h2>
              <p className="text-white/60">
                Are you sure you want to finalize <span className="text-white font-semibold">"{finalizeConfirm.name}"</span>?
              </p>
              <p className="text-white/40 text-sm mt-2">Once finalized, the next pentest for this target will start at version 0.8.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={cancelFinalizePentest}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-3 px-4 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmFinalizePentest}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all duration-200"
              >
                Finalize
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={handleBackToTargets}
          className="text-white/50 hover:text-[#FFA317] mb-6 flex items-center gap-2 transition-colors"
        >
          <span>←</span> Back to Targets
        </button>

        {/* Target Header */}
        <div className="bg-[#0a0b14] border border-white/10 rounded-xl p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {selectedTarget.name}
              </h1>
              <p className="text-white/50 font-mono">{selectedTarget.url}</p>
              {selectedTarget.description && (
                <p className="text-white/40 text-sm mt-4">{selectedTarget.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 pt-4 border-t border-white/5">
            <div className="text-white/30 text-sm">
              Total Pentests: <span className="text-[#FFA317] font-bold">{pentests.length}</span>
            </div>
          </div>
        </div>

        {/* Pentests List */}
        <h2 className="text-xl font-bold text-white mb-4">Pentest History</h2>

        {/* Search Field */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search pentests by ID, status, or date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0a0b14] border border-white/10 rounded-lg py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:border-[#FFA317] focus:ring-1 focus:ring-[#FFA317] transition-colors"
          />
        </div>

        {pentests.length === 0 && (
          <div className="bg-[#0a0b14] border border-white/10 rounded-xl p-8 text-center">
            <p className="text-white/50">No pentests found for this target.</p>
          </div>
        )}

        <div className="space-y-6">
          {(() => {
            // Filter pentests
            const filteredPentests = pentests.filter(job => {
              if (!searchQuery) return true;
              const query = searchQuery.toLowerCase();
              return (
                job.id.toLowerCase().includes(query) ||
                job.status.toLowerCase().includes(query) ||
                (job.result_data?.metadata?.report_id && job.result_data.metadata.report_id.toLowerCase().includes(query)) ||
                new Date(job.created_at).toLocaleString().toLowerCase().includes(query)
              );
            });

            // Group pentests by report_id
            const groupedPentests = {};
            filteredPentests.forEach(job => {
              const reportId = job.result_data?.metadata?.report_id || job.id;
              if (!groupedPentests[reportId]) {
                groupedPentests[reportId] = [];
              }
              groupedPentests[reportId].push(job);
            });

            // Render groups
            return Object.entries(groupedPentests).map(([reportId, jobs]) => {
              const isGroup = jobs.length > 1;
              const hasFinalReport = jobs.some(j => j.result_data?.metadata?.is_final);

              return (
                <div key={reportId} className={isGroup && hasFinalReport ? "bg-white/5 border border-white/5 rounded-xl p-4" : ""}>
                  {/* Group Header - only show if multiple pentests share the same report_id AND one is finalized */}
                  {isGroup && hasFinalReport && (
                    <div className="mb-4 pb-3 border-b border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-1 h-6 bg-[#FFA317] rounded-full"></div>
                          <h3 className="text-white font-bold text-base">{reportId}</h3>
                          <span className="text-white/40 text-xs">({jobs.length} version{jobs.length > 1 ? 's' : ''})</span>
                        </div>
                        {(() => {
                          // Get the latest non-finalized pentest in this group
                          const latestDraft = jobs
                            .filter(j => j.status === 'COMPLETED' && !j.result_data?.metadata?.is_final)
                            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

                          return latestDraft && (
                            <button
                              onClick={() => handleFinalizePentest(latestDraft)}
                              className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 hover:text-green-300 font-bold rounded-lg border border-green-500/30 hover:border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)] hover:shadow-[0_0_25px_rgba(34,197,94,0.4)] transition-all duration-200 text-xs whitespace-nowrap"
                              title="Finalize Latest Draft"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>Finalize</span>
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Pentest Cards */}
                  <div className={isGroup && hasFinalReport ? "space-y-3" : "space-y-6"}>
                    {jobs.map((job) => {
                      const isCompleted = job.status === 'COMPLETED';
                      const report = job.result_data;
                      const isExpanded = expandedPentest === job.id;

                      return (
                        <div key={job.id} className="bg-[#0a0b14] border border-white/10 rounded-xl overflow-hidden transition-all duration-300 hover:border-white/20 shadow-lg relative group">
                          {/* Header Row */}
                          <div
                            className="p-6 flex items-center justify-between cursor-pointer bg-white/5 hover:bg-white/10 transition-colors"
                            onClick={() => isCompleted && toggleExpandPentest(job.id)}
                          >
                            <div className="flex items-center gap-6">
                              {/* Draft/Final Status Indicator */}
                              <div className="flex flex-col items-center min-w-[80px]">
                                {isCompleted && report?.metadata?.is_final ? (
                                  <>
                                    <div className="w-12 h-12 rounded-lg bg-green-500/20 border-2 border-green-500 flex items-center justify-center mb-1">
                                      <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                    </div>
                                    <span className="text-green-400 text-xs font-bold uppercase">Final</span>
                                  </>
                                ) : isCompleted ? (
                                  <>
                                    <div className="w-12 h-12 rounded-lg bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center mb-1">
                                      <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </div>
                                    <span className="text-blue-400 text-xs font-bold uppercase">Draft</span>
                                  </>
                                ) : (
                                  <>
                                    <div className="w-12 h-12 rounded-lg bg-white/10 border-2 border-white/20 flex items-center justify-center mb-1">
                                      <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
                                    </div>
                                    <span className="text-white/40 text-xs font-bold uppercase">Processing</span>
                                  </>
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-3 mb-1">
                                  {/* Only show report_id if not in a group, otherwise just show version */}
                                  {!(isGroup && hasFinalReport) && (
                                    <h3 className="text-white font-semibold text-lg">
                                      {report?.metadata?.report_id || 'Pentest Report'}
                                    </h3>
                                  )}
                                  {report?.metadata?.version && (
                                    <span className="px-2 py-1 bg-[#FFA317]/20 text-[#FFA317] text-sm font-bold rounded border border-[#FFA317]/30">
                                      v{report.metadata.version}
                                    </span>
                                  )}
                                </div>
                                <p className="text-white/30 text-xs">
                                  {new Date(job.created_at).toLocaleString()}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              {/* Traffic Light - Security Status */}
                              {isCompleted && report?.summary?.traffic_light && (
                                <div className="flex items-center gap-2 min-w-[80px]">
                                  <div className={`w-4 h-4 rounded-full ${getTrafficLightColor(report.summary.traffic_light)}`}></div>
                                  <span className="text-white/40 text-[10px] uppercase font-medium whitespace-nowrap">
                                    {report.summary.traffic_light === 'RED' ? 'Critical' :
                                     report.summary.traffic_light === 'YELLOW' ? 'Warning' :
                                     'Safe'}
                                  </span>
                                </div>
                              )}

                              {isCompleted && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadReport(job);
                                  }}
                                  className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#FFA317] to-[#FF8C00] hover:from-[#FF8C00] hover:to-[#FFA317] text-white font-bold rounded-lg shadow-[0_0_15px_rgba(255,163,23,0.3)] hover:shadow-[0_0_25px_rgba(255,163,23,0.5)] transition-all duration-200 text-xs whitespace-nowrap"
                                  title="Download Report"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <span>Download</span>
                                </button>
                              )}

                              <div className={`text-white/30 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                ▼
                              </div>
                            </div>
                          </div>

                          {/* Expanded Details */}
                          {isExpanded && isCompleted && report && (
                            <div className="p-8 border-t border-white/10 bg-[#05060a]">
                              {/* Check if report has expected structure */}
                              {!report.summary || !Array.isArray(report.findings) ? (
                                <div className="text-center py-8">
                                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/10 flex items-center justify-center">
                                    <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                  </div>
                                  <h4 className="text-white font-bold text-lg mb-2">Incompatible Report Format</h4>
                                  <p className="text-white/50 text-sm mb-4">This pentest result uses an older or unsupported data format and cannot be displayed.</p>
                                  <details className="text-left max-w-lg mx-auto">
                                    <summary className="text-white/30 text-xs cursor-pointer hover:text-white/50 transition-colors">Show raw data</summary>
                                    <pre className="mt-3 bg-white/5 border border-white/10 rounded-lg p-4 text-white/60 text-xs overflow-auto max-h-64 font-mono">
                                      {JSON.stringify(report, null, 2)}
                                    </pre>
                                  </details>
                                </div>
                              ) : (
                                <>
                                  {/* Summary Section */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                                    <div className="col-span-2">
                                      <h4 className="text-[#FFA317] text-xs font-bold uppercase tracking-widest mb-4">Management Summary</h4>
                                      <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">
                                        {report.summary.management || 'No summary available.'}
                                      </p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-6 border border-white/5">
                                      <h4 className="text-white/60 text-xs uppercase tracking-widest mb-4">Severity Breakdown</h4>
                                      <div className="space-y-3">
                                        {report.summary.severity_breakdown ? Object.entries(report.summary.severity_breakdown).map(([level, value]) => {
                                          // Handle both old format (numbers) and new format (objects with open/mitigated)
                                          const isObject = typeof value === 'object' && value !== null;
                                          const totalCount = isObject ? (value.open || 0) + (value.mitigated || 0) : (value || 0);
                                          const openCount = isObject ? (value.open || 0) : (value || 0);
                                          const mitigatedCount = isObject ? (value.mitigated || 0) : 0;

                                          return totalCount > 0 && (
                                            <div key={level} className="flex justify-between items-center">
                                              <span className="text-white/80 capitalize text-sm">{level}</span>
                                              <div className="flex items-center gap-2">
                                                {mitigatedCount > 0 && (
                                                  <span className="px-2 py-0.5 rounded text-xs font-bold border border-green-500/30 bg-green-500/10 text-green-400 line-through">
                                                    {mitigatedCount}
                                                  </span>
                                                )}
                                                {openCount > 0 && (
                                                  <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getSeverityColor(level)}`}>
                                                    {openCount}
                                                  </span>
                                                )}
                                                {mitigatedCount === 0 && openCount === 0 && (
                                                  <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getSeverityColor(level)}`}>
                                                    {totalCount}
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        }) : (
                                          <p className="text-white/30 text-xs">No breakdown available</p>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Findings List */}
                                  <div>
                                    <h4 className="text-[#FFA317] text-xs font-bold uppercase tracking-widest mb-6">Detailed Findings</h4>
                                    <div className="space-y-4">
                                      {report.findings.map((finding, index) => {
                                        const isMitigated = finding.status === 'mitigated';
                                        return (
                                        <div key={finding.id || index} className={`bg-[#0f111a] border rounded-lg p-6 hover:border-white/10 transition-colors ${isMitigated ? 'border-green-500/30 bg-green-500/5' : 'border-white/5'}`}>
                                          {/* Mitigated Banner */}
                                          {isMitigated && (
                                            <div className="mb-4 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                                              <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                                                <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                              </div>
                                              <span className="font-bold text-sm">MITIGATED</span>
                                              {finding.mitigated_in_version && (
                                                <span className="text-sm">in Version {finding.mitigated_in_version}</span>
                                              )}
                                              {finding.mitigated_date && (
                                                <span className="text-xs opacity-80">({finding.mitigated_date})</span>
                                              )}
                                            </div>
                                          )}

                                          <div className={`flex justify-between items-start mb-3 ${isMitigated ? 'opacity-60' : ''}`}>
                                            <div className="flex items-center gap-4">
                                              <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide border ${getSeverityColor(finding.severity)} ${isMitigated ? 'line-through opacity-50' : ''}`}>
                                                {finding.severity || 'UNKNOWN'}
                                              </span>
                                              <h5 className={`text-white font-medium text-lg ${isMitigated ? 'line-through' : ''}`}>{finding.title || 'Untitled Finding'}</h5>
                                            </div>
                                            {finding.id && <span className={`text-white/30 text-xs font-mono ${isMitigated ? 'line-through' : ''}`}>{finding.id}</span>}
                                          </div>
                                          <p className={`text-white/60 text-sm mb-4 leading-relaxed ${isMitigated ? 'line-through opacity-60' : ''}`}>{finding.description || 'No description available.'}</p>

                                          {/* Impact Section */}
                                          {finding.impact && (
                                            <div className={`mb-4 bg-white/5 p-3 rounded border border-white/5 ${isMitigated ? 'opacity-60' : ''}`}>
                                              <h6 className={`text-[#FFA317] text-xs font-bold uppercase mb-1 tracking-wider ${isMitigated ? 'line-through' : ''}`}>Business Impact</h6>
                                              <p className={`text-white/70 text-sm ${isMitigated ? 'line-through' : ''}`}>{finding.impact}</p>
                                            </div>
                                          )}

                                          {/* Recommendation Section */}
                                          {Array.isArray(finding.recommendation) && finding.recommendation.length > 0 && (
                                            <div className={`mb-4 ${isMitigated ? 'opacity-60' : ''}`}>
                                              <h6 className={`text-green-400 text-xs font-bold uppercase mb-2 tracking-wider ${isMitigated ? 'line-through' : ''}`}>Recommendation</h6>
                                              <ul className={`list-disc list-inside text-white/60 text-sm space-y-1 ${isMitigated ? 'line-through' : ''}`}>
                                                {finding.recommendation.map((rec, idx) => (
                                                  <li key={idx}>{rec}</li>
                                                ))}
                                              </ul>
                                            </div>
                                          )}

                                          <div className={`flex gap-6 text-xs text-white/40 font-mono border-t border-white/5 pt-3 ${isMitigated ? 'line-through opacity-60' : ''}`}>
                                            {finding.cvss_score != null && <span>CVSS: <span className="text-white/70">{finding.cvss_score}</span></span>}
                                            {finding.affected_assets && (
                                              <span>Assets: <span className="text-white/70">{finding.affected_assets.length}</span></span>
                                            )}
                                          </div>
                                        </div>
                                      );
                                      })}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );
};

export default Results;