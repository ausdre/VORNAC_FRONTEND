/**
 * Tenants Management Page
 * CRUD operations for tenants
 */
import React, { useState, useEffect } from 'react';
import {
  listTenants,
  createTenant,
  updateTenant,
  deleteTenant,
  regenerateTenantAPIKey,
  suspendTenant,
  unsuspendTenant
} from '../api/tenants';

const TenantsPage = () => {
  const [tenants, setTenants] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [formData, setFormData] = useState({ name: '' });
  const [error, setError] = useState('');
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [selectedTenantForSuspend, setSelectedTenantForSuspend] = useState(null);
  const [suspendReason, setSuspendReason] = useState('');

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const response = await listTenants(page, 50, search);
      setTenants(response.tenants);
      setTotal(response.total);
    } catch (err) {
      console.error('Failed to fetch tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, [page, search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createTenant(formData);
      setShowCreateModal(false);
      setFormData({ name: '' });
      fetchTenants();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create tenant');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await updateTenant(selectedTenant.id, formData);
      setShowEditModal(false);
      setSelectedTenant(null);
      setFormData({ name: '' });
      fetchTenants();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update tenant');
    }
  };

  const handleDelete = async (tenant) => {
    if (!confirm(`Delete tenant "${tenant.name}"? This will also delete all associated users.`)) {
      return;
    }
    try {
      await deleteTenant(tenant.id);
      fetchTenants();
    } catch (err) {
      alert('Failed to delete tenant');
    }
  };

  const handleSuspend = async () => {
    if (!suspendReason.trim()) {
      alert('Please provide a suspension reason');
      return;
    }
    try {
      await suspendTenant(selectedTenantForSuspend.id, suspendReason);
      setShowSuspendModal(false);
      setSuspendReason('');
      setSelectedTenantForSuspend(null);
      fetchTenants();
      alert(`Tenant "${selectedTenantForSuspend.name}" has been suspended`);
    } catch (err) {
      alert('Failed to suspend tenant');
    }
  };

  const handleUnsuspend = async (tenant) => {
    if (!confirm(`Unsuspend tenant "${tenant.name}"? Users will regain access immediately.`)) {
      return;
    }
    try {
      await unsuspendTenant(tenant.id);
      fetchTenants();
      alert(`Tenant "${tenant.name}" has been reactivated`);
    } catch (err) {
      alert('Failed to unsuspend tenant');
    }
  };

  const openSuspendModal = (tenant) => {
    setSelectedTenantForSuspend(tenant);
    setSuspendReason('');
    setShowSuspendModal(true);
  };

  const handleRegenerateAPIKey = async (tenant) => {
    if (!confirm(`Regenerate API key for "${tenant.name}"? The old key will be immediately invalidated.`)) {
      return;
    }
    try {
      await regenerateTenantAPIKey(tenant.id);
      fetchTenants();
      alert('API key regenerated successfully');
    } catch (err) {
      alert('Failed to regenerate API key');
    }
  };

  const openEditModal = (tenant) => {
    setSelectedTenant(tenant);
    setFormData({ name: tenant.name });
    setShowEditModal(true);
  };

  const maskAPIKey = (key) => {
    if (!key) return '';
    return key.slice(0, 16) + '...';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          TENANTS
        </h1>
        <button
          onClick={() => {
            setFormData({ name: '' });
            setError('');
            setShowCreateModal(true);
          }}
          className="px-6 py-2 bg-[#FFA317] text-black font-bold rounded hover:bg-white transition-colors"
        >
          + Create Tenant
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tenants..."
          className="w-full max-w-md bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:border-[#FFA317] focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-[#0a0b14] border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-white/40">Loading...</div>
        ) : tenants.length === 0 ? (
          <div className="p-8 text-center text-white/40">No tenants found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left p-4 text-white/60 text-sm font-bold">Name</th>
                <th className="text-left p-4 text-white/60 text-sm font-bold">Status</th>
                <th className="text-left p-4 text-white/60 text-sm font-bold">API Key</th>
                <th className="text-left p-4 text-white/60 text-sm font-bold">Users</th>
                <th className="text-right p-4 text-white/60 text-sm font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {tenants.map((tenant) => (
                <tr key={tenant.id} className={`hover:bg-white/5 ${!tenant.is_active ? 'opacity-60' : ''}`}>
                  <td className="p-4 font-medium text-white">{tenant.name}</td>
                  <td className="p-4">
                    {tenant.is_active ? (
                      <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs font-bold rounded">Active</span>
                    ) : (
                      <div>
                        <span className="px-2 py-1 bg-red-500/10 text-red-400 text-xs font-bold rounded">Suspended</span>
                        {tenant.suspension_reason && (
                          <div className="text-xs text-white/40 mt-1">{tenant.suspension_reason}</div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="p-4 font-mono text-sm text-white/60">
                    {maskAPIKey(tenant.api_key)}
                  </td>
                  <td className="p-4 text-white/60">{tenant.user_count}</td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      {tenant.is_active ? (
                        <>
                          <button
                            onClick={() => openEditModal(tenant)}
                            className="px-3 py-1 text-sm text-blue-400 hover:bg-blue-400/10 rounded"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleRegenerateAPIKey(tenant)}
                            className="px-3 py-1 text-sm text-yellow-400 hover:bg-yellow-400/10 rounded"
                          >
                            Regen Key
                          </button>
                          <button
                            onClick={() => openSuspendModal(tenant)}
                            className="px-3 py-1 text-sm text-orange-400 hover:bg-orange-400/10 rounded"
                          >
                            Suspend
                          </button>
                          <button
                            onClick={() => handleDelete(tenant)}
                            className="px-3 py-1 text-sm text-red-400 hover:bg-red-400/10 rounded"
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleUnsuspend(tenant)}
                            className="px-3 py-1 text-sm text-green-400 hover:bg-green-400/10 rounded"
                          >
                            Unsuspend
                          </button>
                          <button
                            onClick={() => handleDelete(tenant)}
                            className="px-3 py-1 text-sm text-red-400 hover:bg-red-400/10 rounded"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#0a0b14] border border-white/10 rounded-xl p-8 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Create Tenant</h2>
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-500 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="block text-white/60 text-sm mb-2">Tenant Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:border-[#FFA317] focus:outline-none"
                  required
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-white/20 text-white rounded hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#FFA317] text-black font-bold rounded hover:bg-white"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#0a0b14] border border-white/10 rounded-xl p-8 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Edit Tenant</h2>
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-500 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleUpdate}>
              <div className="mb-4">
                <label className="block text-white/60 text-sm mb-2">Tenant Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:border-[#FFA317] focus:outline-none"
                  required
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-white/20 text-white rounded hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#FFA317] text-black font-bold rounded hover:bg-white"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {showSuspendModal && selectedTenantForSuspend && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#0a0b14] border border-white/10 rounded-xl p-8 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Suspend Tenant</h2>
            <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded">
              <p className="text-orange-400 text-sm font-bold">Warning: This will immediately block all users from "{selectedTenantForSuspend.name}"</p>
            </div>
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-500 text-sm">
                {error}
              </div>
            )}
            <div className="mb-6">
              <label className="block text-white/60 text-sm mb-2">Suspension Reason *</label>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:border-[#FFA317] focus:outline-none"
                placeholder="e.g., Payment overdue, Terms of Service violation, etc."
                rows={3}
                required
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowSuspendModal(false);
                  setSuspendReason('');
                  setSelectedTenantForSuspend(null);
                }}
                className="flex-1 px-4 py-2 border border-white/20 text-white rounded hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspend}
                disabled={!suspendReason.trim()}
                className="flex-1 px-4 py-2 bg-orange-500 text-white font-bold rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suspend Tenant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantsPage;
