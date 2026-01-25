/**
 * Tenants Management Page
 * CRUD operations for tenants with SSO/KMS integration
 */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  listTenants,
  createTenant,
  updateTenant,
  deleteTenant,
  regenerateTenantAPIKey,
  suspendTenant,
  unsuspendTenant
} from '../api/tenants';
import TenantDetailModal from '../components/TenantDetailModal';

const TenantsPage = () => {
  const [tenants, setTenants] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTenantForDetail, setSelectedTenantForDetail] = useState(null);
  const [ssoConfigs, setSsoConfigs] = useState({});
  const [kmsConfigs, setKmsConfigs] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    pentest_limit_per_year: '',
    contract_end_date: '',
    annual_arr: ''
  });
  const [error, setError] = useState('');
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [selectedTenantForSuspend, setSelectedTenantForSuspend] = useState(null);
  const [suspendReason, setSuspendReason] = useState('');

  // Sorting and filtering state
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [contractFilter, setContractFilter] = useState('all');

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

  const fetchConfigurations = async () => {
    try {
      // Fetch SSO configs
      const ssoRes = await axios.get('http://localhost:8000/api/v1/admin/sso/configurations');
      const ssoMap = {};
      ssoRes.data.forEach(config => {
        ssoMap[config.tenant_id] = config;
      });
      setSsoConfigs(ssoMap);

      // Fetch KMS configs
      const kmsRes = await axios.get('http://localhost:8000/api/v1/admin/kms/configurations');
      const kmsMap = {};
      kmsRes.data.forEach(config => {
        kmsMap[config.tenant_id] = config;
      });
      setKmsConfigs(kmsMap);
    } catch (err) {
      console.error('Failed to fetch configurations:', err);
    }
  };

  useEffect(() => {
    fetchTenants();
    fetchConfigurations();
  }, [page, search]);

  const openDetailModal = (tenant) => {
    setSelectedTenantForDetail(tenant);
    setShowDetailModal(true);
  };

  const handleDetailModalClose = () => {
    setShowDetailModal(false);
    setSelectedTenantForDetail(null);
  };

  const handleDetailModalUpdate = () => {
    fetchTenants();
    fetchConfigurations();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Format the payload - convert empty strings to null for optional fields
      const payload = {
        name: formData.name,
        pentest_limit_per_year: formData.pentest_limit_per_year === '' ? null : parseInt(formData.pentest_limit_per_year),
        contract_end_date: formData.contract_end_date === '' ? null : formData.contract_end_date,
        annual_arr: formData.annual_arr === '' ? null : parseFloat(formData.annual_arr)
      };
      await createTenant(payload);
      setShowCreateModal(false);
      setFormData({ name: '', pentest_limit_per_year: '', contract_end_date: '', annual_arr: '' });
      fetchTenants();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create tenant');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Format the payload - convert empty strings to null for optional fields
      const payload = {
        name: formData.name,
        pentest_limit_per_year: formData.pentest_limit_per_year === '' ? null : parseInt(formData.pentest_limit_per_year),
        contract_end_date: formData.contract_end_date === '' ? null : formData.contract_end_date,
        annual_arr: formData.annual_arr === '' ? null : parseFloat(formData.annual_arr)
      };
      await updateTenant(selectedTenant.id, payload);
      setShowEditModal(false);
      setSelectedTenant(null);
      setFormData({ name: '', pentest_limit_per_year: '', contract_end_date: '', annual_arr: '' });
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
    setFormData({
      name: tenant.name,
      pentest_limit_per_year: tenant.pentest_limit_per_year || '',
      contract_end_date: tenant.contract_end_date ? tenant.contract_end_date.split('T')[0] : '',
      annual_arr: tenant.annual_arr || ''
    });
    setShowEditModal(true);
  };

  const maskAPIKey = (key) => {
    if (!key) return '';
    return key.slice(0, 16) + '...';
  };

  // Sorting function
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Filter and sort tenants
  const getFilteredAndSortedTenants = () => {
    let filtered = [...tenants];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t =>
        statusFilter === 'active' ? t.is_active : !t.is_active
      );
    }

    // Apply contract filter
    if (contractFilter === 'expiring') {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      filtered = filtered.filter(t => {
        if (!t.contract_end_date) return false;
        const endDate = new Date(t.contract_end_date);
        return endDate <= thirtyDaysFromNow && endDate >= new Date();
      });
    } else if (contractFilter === 'expired') {
      filtered = filtered.filter(t => {
        if (!t.contract_end_date) return false;
        return new Date(t.contract_end_date) < new Date();
      });
    } else if (contractFilter === 'unlimited') {
      filtered = filtered.filter(t => !t.contract_end_date);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (sortColumn) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'status':
          aVal = a.is_active ? 1 : 0;
          bVal = b.is_active ? 1 : 0;
          break;
        case 'users':
          aVal = a.user_count || 0;
          bVal = b.user_count || 0;
          break;
        case 'pentests':
          aVal = a.pentest_count || 0;
          bVal = b.pentest_count || 0;
          break;
        case 'cost':
          aVal = parseFloat(a.cost_per_pentest) || 0;
          bVal = parseFloat(b.cost_per_pentest) || 0;
          break;
        case 'contract':
          aVal = a.contract_end_date ? new Date(a.contract_end_date).getTime() : Infinity;
          bVal = b.contract_end_date ? new Date(b.contract_end_date).getTime() : Infinity;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  const SortIcon = ({ column }) => {
    if (sortColumn !== column) {
      return <span className="text-white/20 ml-1">⇅</span>;
    }
    return <span className="text-[#FFA317] ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          TENANTS
        </h1>
        <button
          onClick={() => {
            setFormData({ name: '', pentest_limit_per_year: '', contract_end_date: '', annual_arr: '' });
            setError('');
            setShowCreateModal(true);
          }}
          className="px-6 py-2 bg-[#FFA317] text-black font-bold rounded hover:bg-white transition-colors"
        >
          + Create Tenant
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex gap-4 flex-wrap items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tenants..."
          className="flex-1 min-w-[300px] bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:border-[#FFA317] focus:outline-none"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#FFA317] focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="suspended">Suspended Only</option>
        </select>

        <select
          value={contractFilter}
          onChange={(e) => setContractFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#FFA317] focus:outline-none"
        >
          <option value="all">All Contracts</option>
          <option value="expiring">Expiring Soon (30d)</option>
          <option value="expired">Expired</option>
          <option value="unlimited">Unlimited</option>
        </select>

        <button
          onClick={() => {
            setStatusFilter('all');
            setContractFilter('all');
            setSearch('');
          }}
          className="px-4 py-2 text-sm text-white/60 hover:text-white border border-white/10 rounded-lg hover:bg-white/5"
        >
          Clear Filters
        </button>
      </div>

      {/* Results count */}
      {!loading && tenants.length > 0 && (
        <div className="mb-4 text-white/60 text-sm">
          Showing {getFilteredAndSortedTenants().length} of {tenants.length} tenants
        </div>
      )}

      {/* Table */}
      <div className="bg-[#0a0b14] border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-white/40">Loading...</div>
        ) : tenants.length === 0 ? (
          <div className="p-8 text-center text-white/40">No tenants found</div>
        ) : getFilteredAndSortedTenants().length === 0 ? (
          <div className="p-8 text-center text-white/40">No tenants match the current filters</div>
        ) : (
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th
                  onClick={() => handleSort('name')}
                  className="text-left p-4 text-white/60 text-sm font-bold cursor-pointer hover:text-white transition-colors"
                >
                  Name <SortIcon column="name" />
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="text-left p-4 text-white/60 text-sm font-bold cursor-pointer hover:text-white transition-colors"
                >
                  Status <SortIcon column="status" />
                </th>
                <th className="text-left p-4 text-white/60 text-sm font-bold">API Key</th>
                <th className="text-left p-4 text-white/60 text-sm font-bold">Auth / KMS</th>
                <th
                  onClick={() => handleSort('users')}
                  className="text-left p-4 text-white/60 text-sm font-bold cursor-pointer hover:text-white transition-colors"
                >
                  Users <SortIcon column="users" />
                </th>
                <th
                  onClick={() => handleSort('pentests')}
                  className="text-left p-4 text-white/60 text-sm font-bold cursor-pointer hover:text-white transition-colors"
                >
                  Pentests <SortIcon column="pentests" />
                </th>
                <th
                  onClick={() => handleSort('cost')}
                  className="text-left p-4 text-white/60 text-sm font-bold cursor-pointer hover:text-white transition-colors"
                >
                  Cost/Pentest <SortIcon column="cost" />
                </th>
                <th
                  onClick={() => handleSort('contract')}
                  className="text-left p-4 text-white/60 text-sm font-bold cursor-pointer hover:text-white transition-colors"
                >
                  Contract End <SortIcon column="contract" />
                </th>
                <th className="text-right p-4 text-white/60 text-sm font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {getFilteredAndSortedTenants().map((tenant) => (
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
                  <td className="p-4">
                    <div className="flex gap-2">
                      {/* SSO Status */}
                      {ssoConfigs[tenant.id] ? (
                        <span
                          className={`px-2 py-1 text-xs font-bold rounded ${
                            ssoConfigs[tenant.id].enabled
                              ? 'bg-purple-500/10 text-purple-400'
                              : 'bg-yellow-500/10 text-yellow-400'
                          }`}
                          title={`SSO: ${ssoConfigs[tenant.id].provider} (${ssoConfigs[tenant.id].enabled ? 'Enabled' : 'Configured'})`}
                        >
                          SSO
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-bold rounded bg-blue-500/10 text-blue-400" title="Using TOTP Authenticator">
                          TOTP
                        </span>
                      )}
                      {/* KMS Status */}
                      {kmsConfigs[tenant.id] && (
                        <span
                          className={`px-2 py-1 text-xs font-bold rounded ${
                            kmsConfigs[tenant.id].enabled
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-yellow-500/10 text-yellow-400'
                          }`}
                          title={`KMS: ${kmsConfigs[tenant.id].provider} (${kmsConfigs[tenant.id].enabled ? 'Enabled' : 'Configured'})`}
                        >
                          KMS
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-white/60">{tenant.user_count}</td>
                  <td className="p-4 text-white/60">
                    {tenant.pentest_count || 0}
                    {tenant.pentest_limit_per_year && (
                      <span className="text-white/40 text-xs ml-1">
                        / {tenant.pentest_limit_per_year}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-white/60">
                    {tenant.cost_per_pentest ? (
                      <span>€{parseFloat(tenant.cost_per_pentest).toFixed(2)}</span>
                    ) : (
                      <span className="text-white/40 italic">-</span>
                    )}
                  </td>
                  <td className="p-4 text-white/60">
                    {tenant.contract_end_date ? (
                      <span>{new Date(tenant.contract_end_date).toLocaleDateString('de-DE')}</span>
                    ) : (
                      <span className="text-white/40 italic">Unlimited</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openDetailModal(tenant)}
                        className="px-3 py-1 text-sm text-[#FFA317] hover:bg-[#FFA317]/10 rounded font-bold"
                      >
                        View
                      </button>
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
              <div className="mb-4">
                <label className="block text-white/60 text-sm mb-2">Pentest Limit Per Year</label>
                <input
                  type="number"
                  min="0"
                  value={formData.pentest_limit_per_year}
                  onChange={(e) => setFormData({ ...formData, pentest_limit_per_year: e.target.value })}
                  placeholder="Leave blank for unlimited"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:border-[#FFA317] focus:outline-none"
                />
                <p className="text-white/30 text-xs mt-1">Leave blank for unlimited pentests</p>
              </div>
              <div className="mb-4">
                <label className="block text-white/60 text-sm mb-2">Contract End Date</label>
                <input
                  type="date"
                  value={formData.contract_end_date}
                  onChange={(e) => setFormData({ ...formData, contract_end_date: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#FFA317] focus:outline-none"
                />
                <p className="text-white/30 text-xs mt-1">Leave blank for unlimited contract</p>
              </div>
              <div className="mb-4">
                <label className="block text-white/60 text-sm mb-2">Annual ARR (€)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.annual_arr}
                  onChange={(e) => setFormData({ ...formData, annual_arr: e.target.value })}
                  placeholder="Annual recurring revenue"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:border-[#FFA317] focus:outline-none"
                />
                <p className="text-white/30 text-xs mt-1">Used for cost-per-pentest analytics</p>
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
              <div className="mb-4">
                <label className="block text-white/60 text-sm mb-2">Pentest Limit Per Year</label>
                <input
                  type="number"
                  min="0"
                  value={formData.pentest_limit_per_year}
                  onChange={(e) => setFormData({ ...formData, pentest_limit_per_year: e.target.value })}
                  placeholder="Leave blank for unlimited"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:border-[#FFA317] focus:outline-none"
                />
                <p className="text-white/30 text-xs mt-1">Leave blank for unlimited pentests</p>
              </div>
              <div className="mb-4">
                <label className="block text-white/60 text-sm mb-2">Contract End Date</label>
                <input
                  type="date"
                  value={formData.contract_end_date}
                  onChange={(e) => setFormData({ ...formData, contract_end_date: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#FFA317] focus:outline-none"
                />
                <p className="text-white/30 text-xs mt-1">Leave blank for unlimited contract</p>
              </div>
              <div className="mb-4">
                <label className="block text-white/60 text-sm mb-2">Annual ARR (€)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.annual_arr}
                  onChange={(e) => setFormData({ ...formData, annual_arr: e.target.value })}
                  placeholder="Annual recurring revenue"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:border-[#FFA317] focus:outline-none"
                />
                <p className="text-white/30 text-xs mt-1">Used for cost-per-pentest analytics</p>
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

      {/* Tenant Detail Modal */}
      {showDetailModal && selectedTenantForDetail && (
        <TenantDetailModal
          tenant={selectedTenantForDetail}
          onClose={handleDetailModalClose}
          onUpdate={handleDetailModalUpdate}
        />
      )}
    </div>
  );
};

export default TenantsPage;
