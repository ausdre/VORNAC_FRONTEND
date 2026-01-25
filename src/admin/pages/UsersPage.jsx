/**
 * Users Management Page
 * CRUD operations for users with MFA management
 */
import React, { useState, useEffect } from 'react';
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  resetUserMFA
} from '../api/users';
import { listTenants } from '../api/tenants';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'user',
    tenantId: '',
    password: ''
  });
  const [error, setError] = useState('');

  // Sorting and filtering state
  const [sortColumn, setSortColumn] = useState('email');
  const [sortDirection, setSortDirection] = useState('asc');
  const [tenantFilter, setTenantFilter] = useState('all');
  const [mfaFilter, setMfaFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await listUsers({ page, pageSize: 50, search, role: roleFilter });
      setUsers(response.users);
      setTotal(response.total);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tenantsRes = await listTenants(1, 100);
        setTenants(tenantsRes.tenants);
      } catch (err) {
        console.error('Failed to fetch tenants:', err);
      }
      fetchUsers();
    };
    fetchData();
  }, [page, search, roleFilter]);

  const handleResetPassword = async (user) => {
    if (!confirm(`Reset password for ${user.email}?`)) return;
    try {
      const response = await resetUserPassword(user.id);
      alert(`New password: ${response.new_password}\n\nCopy and save this password - it will not be shown again!`);
    } catch (err) {
      alert('Failed to reset password');
    }
  };

  const handleResetMFA = async (user) => {
    if (!confirm(`Reset MFA for ${user.email}? They will need to re-enroll.`)) return;
    try {
      await resetUserMFA(user.id);
      alert('MFA reset successfully');
      fetchUsers();
    } catch (err) {
      alert('Failed to reset MFA');
    }
  };

  const handleDelete = async (user) => {
    if (!confirm(`Delete user ${user.email}?`)) return;
    try {
      await deleteUser(user.id);
      fetchUsers();
    } catch (err) {
      alert('Failed to delete user');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');

    // Validate tenant selection for non-super_admin users
    if (formData.role !== 'super_admin' && !formData.tenantId) {
      setError('Tenant is required for non-super admin users');
      return;
    }

    try {
      const payload = {
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: formData.role,
        password: formData.password || undefined, // Backend will generate if not provided
        tenant_id: formData.role === 'super_admin' ? null : parseInt(formData.tenantId)
      };

      const response = await createUser(payload);

      // Show password if it was generated
      if (response.generated_password) {
        alert(`User created successfully!\n\nGenerated Password: ${response.generated_password}\n\nCopy and save this password - it will not be shown again!`);
      }

      setShowCreateModal(false);
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        role: 'user',
        tenantId: '',
        password: ''
      });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create user');
    }
  };

  const getRoleColor = (role) => {
    if (role === 'super_admin') return 'text-orange-500 bg-orange-500/10';
    if (role === 'admin') return 'text-blue-400 bg-blue-400/10';
    return 'text-white/60 bg-white/5';
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

  // Filter and sort users
  const getFilteredAndSortedUsers = () => {
    let filtered = [...users];

    // Apply tenant filter
    if (tenantFilter !== 'all') {
      if (tenantFilter === 'none') {
        filtered = filtered.filter(u => !u.tenant_id);
      } else {
        filtered = filtered.filter(u => u.tenant_id === parseInt(tenantFilter));
      }
    }

    // Apply MFA filter
    if (mfaFilter !== 'all') {
      filtered = filtered.filter(u =>
        mfaFilter === 'enabled' ? u.mfa_enabled : !u.mfa_enabled
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(u =>
        statusFilter === 'active' ? u.is_active : !u.is_active
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (sortColumn) {
        case 'email':
          aVal = a.email.toLowerCase();
          bVal = b.email.toLowerCase();
          break;
        case 'name':
          aVal = `${a.first_name} ${a.last_name}`.toLowerCase();
          bVal = `${b.first_name} ${b.last_name}`.toLowerCase();
          break;
        case 'tenant':
          aVal = a.tenant_name?.toLowerCase() || '';
          bVal = b.tenant_name?.toLowerCase() || '';
          break;
        case 'role':
          const roleOrder = { super_admin: 3, admin: 2, user: 1 };
          aVal = roleOrder[a.role] || 0;
          bVal = roleOrder[b.role] || 0;
          break;
        case 'mfa':
          aVal = a.mfa_enabled ? 1 : 0;
          bVal = b.mfa_enabled ? 1 : 0;
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
          USERS
        </h1>
        <button
          onClick={() => {
            setFormData({
              email: '',
              firstName: '',
              lastName: '',
              role: 'user',
              tenantId: '',
              password: ''
            });
            setError('');
            setShowCreateModal(true);
          }}
          className="px-6 py-2 bg-[#FFA317] text-black font-bold rounded hover:bg-white transition-colors"
        >
          + Create User
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex gap-4 flex-wrap items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="flex-1 min-w-[300px] bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:border-[#FFA317] focus:outline-none"
        />

        <select
          value={tenantFilter}
          onChange={(e) => setTenantFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#FFA317] focus:outline-none"
        >
          <option value="all">All Tenants</option>
          <option value="none">No Tenant (Super Admins)</option>
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
          ))}
        </select>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#FFA317] focus:outline-none"
        >
          <option value="">All Roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>

        <select
          value={mfaFilter}
          onChange={(e) => setMfaFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#FFA317] focus:outline-none"
        >
          <option value="all">All MFA Status</option>
          <option value="enabled">MFA Enabled</option>
          <option value="disabled">MFA Not Enabled</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#FFA317] focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>

        <button
          onClick={() => {
            setTenantFilter('all');
            setRoleFilter('');
            setMfaFilter('all');
            setStatusFilter('all');
            setSearch('');
          }}
          className="px-4 py-2 text-sm text-white/60 hover:text-white border border-white/10 rounded-lg hover:bg-white/5"
        >
          Clear Filters
        </button>
      </div>

      {/* Results count */}
      {!loading && users.length > 0 && (
        <div className="mb-4 text-white/60 text-sm">
          Showing {getFilteredAndSortedUsers().length} of {users.length} users
        </div>
      )}

      {/* Table */}
      <div className="bg-[#0a0b14] border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-white/40">Loading...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-white/40">No users found</div>
        ) : getFilteredAndSortedUsers().length === 0 ? (
          <div className="p-8 text-center text-white/40">No users match the current filters</div>
        ) : (
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th
                  onClick={() => handleSort('email')}
                  className="text-left p-4 text-white/60 text-sm font-bold cursor-pointer hover:text-white transition-colors"
                >
                  Email <SortIcon column="email" />
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="text-left p-4 text-white/60 text-sm font-bold cursor-pointer hover:text-white transition-colors"
                >
                  Name <SortIcon column="name" />
                </th>
                <th
                  onClick={() => handleSort('tenant')}
                  className="text-left p-4 text-white/60 text-sm font-bold cursor-pointer hover:text-white transition-colors"
                >
                  Tenant <SortIcon column="tenant" />
                </th>
                <th
                  onClick={() => handleSort('role')}
                  className="text-left p-4 text-white/60 text-sm font-bold cursor-pointer hover:text-white transition-colors"
                >
                  Role <SortIcon column="role" />
                </th>
                <th
                  onClick={() => handleSort('mfa')}
                  className="text-left p-4 text-white/60 text-sm font-bold cursor-pointer hover:text-white transition-colors"
                >
                  MFA <SortIcon column="mfa" />
                </th>
                <th className="text-right p-4 text-white/60 text-sm font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {getFilteredAndSortedUsers().map((user) => (
                <tr key={user.id} className="hover:bg-white/5">
                  <td className="p-4 text-white">{user.email}</td>
                  <td className="p-4 text-white/60">{user.first_name} {user.last_name}</td>
                  <td className="p-4 text-white/60 text-sm">
                    {user.tenant_name || <span className="text-white/30">-</span>}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    {user.mfa_enabled ? (
                      <span className="text-green-400">✓ Enabled</span>
                    ) : (
                      <span className="text-white/30">Not enrolled</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleResetPassword(user)}
                        className="px-3 py-1 text-sm text-yellow-400 hover:bg-yellow-400/10 rounded"
                      >
                        Reset PW
                      </button>
                      {user.mfa_enabled && (
                        <button
                          onClick={() => handleResetMFA(user)}
                          className="px-3 py-1 text-sm text-orange-400 hover:bg-orange-400/10 rounded"
                        >
                          Reset MFA
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(user)}
                        className="px-3 py-1 text-sm text-red-400 hover:bg-red-400/10 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#0a0b14] border border-white/10 rounded-xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">Create User</h2>
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-500 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="block text-white/60 text-sm mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:border-[#FFA317] focus:outline-none"
                  placeholder="user@example.com"
                  required
                  autoFocus
                />
              </div>

              <div className="mb-4">
                <label className="block text-white/60 text-sm mb-2">First Name *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:border-[#FFA317] focus:outline-none"
                  placeholder="John"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-white/60 text-sm mb-2">Last Name *</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:border-[#FFA317] focus:outline-none"
                  placeholder="Doe"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-white/60 text-sm mb-2">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value, tenantId: e.target.value === 'super_admin' ? '' : formData.tenantId })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#FFA317] focus:outline-none"
                  required
                >
                  <option value="user" className="bg-[#0a0b14] text-white">User</option>
                  <option value="admin" className="bg-[#0a0b14] text-white">Admin</option>
                  <option value="super_admin" className="bg-[#0a0b14] text-white">Super Admin</option>
                </select>
              </div>

              {formData.role !== 'super_admin' && (
                <div className="mb-4">
                  <label className="block text-white/60 text-sm mb-2">Tenant *</label>
                  <select
                    value={formData.tenantId}
                    onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#FFA317] focus:outline-none"
                    required={formData.role !== 'super_admin'}
                  >
                    <option value="" className="bg-[#0a0b14] text-white">Select Tenant...</option>
                    {tenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id} className="bg-[#0a0b14] text-white">
                        {tenant.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-white/30 text-xs mt-1">Super admins don't belong to a tenant</p>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-white/60 text-sm mb-2">Password (optional)</label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:border-[#FFA317] focus:outline-none font-mono"
                  placeholder="Leave empty to auto-generate"
                />
                <p className="text-white/30 text-xs mt-1">If empty, a random password will be generated</p>
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
    </div>
  );
};

export default UsersPage;
