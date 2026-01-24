/**
 * Audit Logs Page
 * View and export audit logs
 */
import React, { useState, useEffect } from 'react';
import { listAuditLogs, exportAuditLogsCSV } from '../api/auditLogs';

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    userEmail: '',
    action: '',
    resourceType: '',
    startDate: '',
    endDate: ''
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await listAuditLogs({
        page,
        pageSize: 100,
        ...filters
      });
      setLogs(response.logs);
      setTotal(response.total);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, filters]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportAuditLogsCSV(filters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export logs');
    } finally {
      setExporting(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getActionColor = (action) => {
    if (action.includes('CREATE')) return 'text-green-400 bg-green-400/10';
    if (action.includes('DELETE')) return 'text-red-400 bg-red-400/10';
    if (action.includes('UPDATE')) return 'text-blue-400 bg-blue-400/10';
    if (action.includes('RESET')) return 'text-yellow-400 bg-yellow-400/10';
    return 'text-white/60 bg-white/5';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          AUDIT LOGS
        </h1>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="px-6 py-2 bg-[#FFA317] text-black font-bold rounded hover:bg-white transition-colors disabled:opacity-50"
        >
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <input
          type="text"
          value={filters.userEmail}
          onChange={(e) => setFilters({ ...filters, userEmail: e.target.value })}
          placeholder="User email..."
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:border-[#FFA317] focus:outline-none text-sm"
        />
        <input
          type="text"
          value={filters.action}
          onChange={(e) => setFilters({ ...filters, action: e.target.value })}
          placeholder="Action..."
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:border-[#FFA317] focus:outline-none text-sm"
        />
        <input
          type="text"
          value={filters.resourceType}
          onChange={(e) => setFilters({ ...filters, resourceType: e.target.value })}
          placeholder="Resource type..."
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:border-[#FFA317] focus:outline-none text-sm"
        />
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#FFA317] focus:outline-none text-sm"
        />
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#FFA317] focus:outline-none text-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-[#0a0b14] border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-white/40">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-white/40">No logs found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left p-4 text-white/60 text-sm font-bold">Timestamp</th>
                <th className="text-left p-4 text-white/60 text-sm font-bold">User</th>
                <th className="text-left p-4 text-white/60 text-sm font-bold">Action</th>
                <th className="text-left p-4 text-white/60 text-sm font-bold">Resource</th>
                <th className="text-left p-4 text-white/60 text-sm font-bold">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/5">
                  <td className="p-4 text-sm text-white/60">
                    {formatTimestamp(log.timestamp)}
                  </td>
                  <td className="p-4 text-sm text-white">{log.user_email}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-white/60">
                    {log.resource_type}
                    {log.resource_id && (
                      <span className="text-white/30"> #{log.resource_id}</span>
                    )}
                  </td>
                  <td className="p-4 text-sm font-mono text-white/40">
                    {log.ip_address || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-4 text-white/40 text-sm">
        Showing {logs.length} of {total} logs
      </div>
    </div>
  );
};

export default AuditLogsPage;
