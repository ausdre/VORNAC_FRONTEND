/**
 * Admin Dashboard Page
 * Overview statistics and recent activity
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listTenants } from '../api/tenants';
import { listUsers } from '../api/users';
import { listAuditLogs, getAuditLogStats } from '../api/auditLogs';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalTenants: 0,
    totalUsers: 0,
    totalSuperAdmins: 0,
    recentLogs: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch tenants count
        const tenantsRes = await listTenants(1, 1);

        // Fetch users count
        const usersRes = await listUsers({ page: 1, pageSize: 1 });

        // Fetch super admins count
        const superAdminsRes = await listUsers({ role: 'super_admin', page: 1, pageSize: 1 });

        // Fetch recent audit logs
        const logsRes = await listAuditLogs({ page: 1, pageSize: 10 });

        setStats({
          totalTenants: tenantsRes.total,
          totalUsers: usersRes.total,
          totalSuperAdmins: superAdminsRes.total,
          recentLogs: logsRes.logs
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getActionColor = (action) => {
    if (action.includes('CREATE')) return 'text-green-400';
    if (action.includes('DELETE')) return 'text-red-400';
    if (action.includes('UPDATE')) return 'text-blue-400';
    if (action.includes('RESET')) return 'text-yellow-400';
    return 'text-white';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-white/60">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8" style={{ fontFamily: 'Montserrat, sans-serif' }}>
        OVERVIEW
      </h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Total Tenants */}
        <div className="bg-[#0a0b14] border border-white/10 rounded-xl p-6">
          <h3 className="text-white/50 text-xs font-bold uppercase tracking-widest mb-4">
            Total Tenants
          </h3>
          <div className="text-4xl font-bold text-[#FFA317]">{stats.totalTenants}</div>
        </div>

        {/* Total Users */}
        <div className="bg-[#0a0b14] border border-white/10 rounded-xl p-6">
          <h3 className="text-white/50 text-xs font-bold uppercase tracking-widest mb-4">
            Total Users
          </h3>
          <div className="text-4xl font-bold text-white">{stats.totalUsers}</div>
        </div>

        {/* Super Admins */}
        <div className="bg-[#0a0b14] border border-white/10 rounded-xl p-6">
          <h3 className="text-white/50 text-xs font-bold uppercase tracking-widest mb-4">
            Super Admins
          </h3>
          <div className="text-4xl font-bold text-orange-500">{stats.totalSuperAdmins}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Link
          to="/admin/tenants"
          className="bg-[#0a0b14] border border-white/10 rounded-xl p-6 hover:border-[#FFA317]/50 transition-colors group"
        >
          <div className="w-12 h-12 rounded-full bg-[#FFA317]/10 flex items-center justify-center mb-4 group-hover:bg-[#FFA317]/20 transition-colors">
            <span className="text-2xl text-[#FFA317]">+</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Create Tenant</h3>
          <p className="text-white/50 text-sm">Add a new tenant organization</p>
        </Link>

        <Link
          to="/admin/users"
          className="bg-[#0a0b14] border border-white/10 rounded-xl p-6 hover:border-white/30 transition-colors group"
        >
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors">
            <span className="text-2xl">👤</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Manage Users</h3>
          <p className="text-white/50 text-sm">Create and manage user accounts</p>
        </Link>

        <Link
          to="/admin/audit-logs"
          className="bg-[#0a0b14] border border-white/10 rounded-xl p-6 hover:border-white/30 transition-colors group"
        >
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors">
            <span className="text-2xl">📋</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">View Audit Logs</h3>
          <p className="text-white/50 text-sm">Review admin activity logs</p>
        </Link>
      </div>

      {/* Recent Activity */}
      <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
      <div className="bg-[#0a0b14] border border-white/10 rounded-xl overflow-hidden">
        {stats.recentLogs.length === 0 ? (
          <div className="p-8 text-center text-white/40">No recent activity</div>
        ) : (
          <div className="divide-y divide-white/5">
            {stats.recentLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-white/5 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`font-bold ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                      <span className="text-white/40 text-sm">{log.resource_type}</span>
                    </div>
                    <div className="text-sm text-white/60">{log.user_email}</div>
                  </div>
                  <div className="text-xs text-white/30">
                    {formatTimestamp(log.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
