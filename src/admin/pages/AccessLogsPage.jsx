/**
 * Access Logs Page
 * View and export customer area access logs (anonymized)
 */
import React, { useState, useEffect } from 'react';
import { listAccessLogs, exportAccessLogsCSV } from '../api/accessLogs';

const AccessLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    tenant_id: '',
    user_email: '',
    action: '',
    resource_type: '',
    start_date: '',
    end_date: ''
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        page_size: 100
      };

      // Only include filters that have values
      if (filters.tenant_id) params.tenant_id = parseInt(filters.tenant_id);
      if (filters.user_email) params.user_email = filters.user_email;
      if (filters.action) params.action = filters.action;
      if (filters.resource_type) params.resource_type = filters.resource_type;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;

      const response = await listAccessLogs(params);
      setLogs(response.logs);
      setTotal(response.total);
    } catch (err) {
      console.error('Failed to fetch access logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  useEffect(() => {
    // Reset to page 1 when filters change
    if (page === 1) {
      fetchLogs();
    } else {
      setPage(1);
    }
  }, [filters]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = {};
      if (filters.tenant_id) params.tenant_id = parseInt(filters.tenant_id);
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;

      const blob = await exportAccessLogsCSV(params);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `access_logs_${new Date().toISOString()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
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
    if (action.includes('VIEW')) return 'text-purple-400 bg-purple-400/10';
    if (action.includes('DOWNLOAD')) return 'text-yellow-400 bg-yellow-400/10';
    if (action.includes('UPDATE')) return 'text-blue-400 bg-blue-400/10';
    if (action.includes('LOGIN')) return 'text-green-400 bg-green-400/10';
    if (action.includes('FINALIZE')) return 'text-orange-400 bg-orange-400/10';
    if (action.includes('SCHEDULE')) return 'text-cyan-400 bg-cyan-400/10';
    return 'text-white/60 bg-white/5';
  };

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    const totalPages = Math.ceil(total / 100);
    if (page < totalPages) setPage(page + 1);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            CUSTOMER ACCESS LOGS
          </h1>
          <p className="text-white/40 text-sm mt-2">
            All data is anonymized for privacy protection
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="px-6 py-2 bg-[#FFA317] text-black font-bold rounded hover:bg-white transition-colors disabled:opacity-50"
        >
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <input
          type="number"
          value={filters.tenant_id}
          onChange={(e) => setFilters({ ...filters, tenant_id: e.target.value })}
          placeholder="Tenant ID..."
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:border-[#FFA317] focus:outline-none text-sm"
        />
        <input
          type="text"
          value={filters.user_email}
          onChange={(e) => setFilters({ ...filters, user_email: e.target.value })}
          placeholder="User email (anonymized)..."
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
          value={filters.resource_type}
          onChange={(e) => setFilters({ ...filters, resource_type: e.target.value })}
          placeholder="Resource type..."
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:border-[#FFA317] focus:outline-none text-sm"
        />
        <input
          type="date"
          value={filters.start_date}
          onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
          placeholder="Start date"
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#FFA317] focus:outline-none text-sm"
        />
        <input
          type="date"
          value={filters.end_date}
          onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
          placeholder="End date"
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left p-4 text-white/60 text-sm font-bold">Timestamp</th>
                  <th className="text-left p-4 text-white/60 text-sm font-bold">Tenant</th>
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
                    <td className="p-4 text-sm text-white/60">
                      ID: {log.tenant_id}
                    </td>
                    <td className="p-4 text-sm text-white/80 font-mono">
                      {log.user_email_anonymized}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-white/60">
                      <div>{log.resource_type}</div>
                      {log.resource_name && (
                        <div className="text-white/80 text-xs mt-1">{log.resource_name}</div>
                      )}
                      {log.resource_id && (
                        <div className="text-white/30 text-xs">ID: {log.resource_id.substring(0, 8)}...</div>
                      )}
                    </td>
                    <td className="p-4 text-sm font-mono text-white/40">
                      {log.ip_address_anonymized || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-white/40 text-sm">
          Showing {(page - 1) * 100 + 1} - {Math.min(page * 100, total)} of {total} logs
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrevPage}
            disabled={page === 1}
            className="px-4 py-2 bg-white/5 text-white rounded border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <div className="px-4 py-2 bg-white/5 text-white rounded border border-white/10">
            Page {page} of {Math.max(1, Math.ceil(total / 100))}
          </div>
          <button
            onClick={handleNextPage}
            disabled={page >= Math.ceil(total / 100)}
            className="px-4 py-2 bg-white/5 text-white rounded border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessLogsPage;
