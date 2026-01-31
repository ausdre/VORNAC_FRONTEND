/**
 * User Detail Modal
 * Comprehensive user view with editing capabilities
 */
import { useState, useEffect } from 'react';
import { updateUser, resetUserPassword, resetUserMFA } from '../api/users';

export default function UserDetailModal({ user, tenants, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Editable user data
  const [userData, setUserData] = useState({
    email: user.email || '',
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    role: user.role || 'user',
    tenant_id: user.tenant_id || '',
    is_active: user.is_active !== false
  });

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleSave = async () => {
    setLoading(true);
    setError('');

    // Validation
    if (!userData.email || !userData.first_name || !userData.last_name) {
      setError('Email, first name, and last name are required');
      setLoading(false);
      return;
    }

    if (userData.role !== 'super_admin' && !userData.tenant_id) {
      setError('Tenant is required for non-super admin users');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role,
        tenant_id: userData.role === 'super_admin' ? null : parseInt(userData.tenant_id),
        is_active: userData.is_active
      };

      await updateUser(user.id, payload);
      onUpdate();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!confirm(`Reset password for ${user.email}?`)) return;
    try {
      const response = await resetUserPassword(user.id);
      alert(`New password: ${response.new_password}\n\nCopy and save this password - it will not be shown again!`);
    } catch (err) {
      alert('Failed to reset password');
    }
  };

  const handleResetMFA = async () => {
    if (!confirm(`Reset MFA for ${user.email}? They will need to re-enroll.`)) return;
    try {
      await resetUserMFA(user.id);
      alert('MFA reset successfully');
      onUpdate();
    } catch (err) {
      alert('Failed to reset MFA');
    }
  };

  const handleToggleActive = async () => {
    const newStatus = !userData.is_active;
    const action = newStatus ? 'activate' : 'deactivate';
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} user ${user.email}?`)) return;

    setLoading(true);
    try {
      await updateUser(user.id, { is_active: newStatus });
      setUserData({ ...userData, is_active: newStatus });
      onUpdate();
    } catch (err) {
      alert(`Failed to ${action} user`);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role) => {
    if (role === 'super_admin') return 'text-orange-500 bg-orange-500/10';
    if (role === 'admin') return 'text-purple-400 bg-purple-400/10';
    return 'text-blue-400 bg-blue-400/10';
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#0a0b14] border border-white/10 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">{user.first_name} {user.last_name}</h2>
              <p className="text-white/60 text-sm mt-1">{user.email}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-4 border-b border-white/10">
            {['overview', 'details'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 px-1 font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-[#FFA317] border-b-2 border-[#FFA317]'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {tab === 'overview' && '🏠 Overview'}
                {tab === 'details' && '✏️ Edit Details'}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Status Banner */}
              {!user.is_active && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <span className="text-red-400 font-bold">⚠️ INACTIVE USER</span>
                  <p className="text-red-400/80 text-sm mt-1">This user cannot log in.</p>
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-white/60 text-xs uppercase mb-1">Status</div>
                  <div className={`text-lg font-bold ${user.is_active ? 'text-green-400' : 'text-red-400'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-white/60 text-xs uppercase mb-1">Role</div>
                  <span className={`px-2 py-1 rounded text-sm font-bold ${getRoleColor(user.role)}`}>
                    {user.role}
                  </span>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-white/60 text-xs uppercase mb-1">Tenant</div>
                  <div className="text-lg font-bold text-white">
                    {user.tenant_name || <span className="text-white/40">None</span>}
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-white/60 text-xs uppercase mb-1">MFA</div>
                  <div className={`text-lg font-bold ${user.mfa_enabled ? 'text-green-400' : 'text-white/40'}`}>
                    {user.mfa_enabled ? 'Enabled' : 'Not Set'}
                  </div>
                </div>
              </div>

              {/* User Info */}
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-white font-bold mb-3">User Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-white/60">User ID:</span>
                    <span className="text-white ml-2 font-mono">{user.id}</span>
                  </div>
                  <div>
                    <span className="text-white/60">Email:</span>
                    <span className="text-white ml-2">{user.email}</span>
                  </div>
                  <div>
                    <span className="text-white/60">First Name:</span>
                    <span className="text-white ml-2">{user.first_name}</span>
                  </div>
                  <div>
                    <span className="text-white/60">Last Name:</span>
                    <span className="text-white ml-2">{user.last_name}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="border-t border-white/10 pt-4">
                <div className="text-white/60 text-sm mb-3">Quick Actions</div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={handleResetPassword}
                    className="px-4 py-2 text-yellow-400 border border-yellow-400/30 rounded hover:bg-yellow-400/10"
                  >
                    Reset Password
                  </button>
                  {user.mfa_enabled && (
                    <button
                      onClick={handleResetMFA}
                      className="px-4 py-2 text-orange-400 border border-orange-400/30 rounded hover:bg-orange-400/10"
                    >
                      Reset MFA
                    </button>
                  )}
                  <button
                    onClick={handleToggleActive}
                    className={`px-4 py-2 rounded ${
                      userData.is_active
                        ? 'text-red-400 border border-red-400/30 hover:bg-red-400/10'
                        : 'text-green-400 border border-green-400/30 hover:bg-green-400/10'
                    }`}
                  >
                    {userData.is_active ? 'Deactivate User' : 'Activate User'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/60 text-sm mb-2">Email *</label>
                  <input
                    type="email"
                    value={userData.email}
                    onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#FFA317] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-2">User ID</label>
                  <input
                    type="text"
                    value={user.id}
                    disabled
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/60 text-sm mb-2">First Name *</label>
                  <input
                    type="text"
                    value={userData.first_name}
                    onChange={(e) => setUserData({ ...userData, first_name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#FFA317] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-2">Last Name *</label>
                  <input
                    type="text"
                    value={userData.last_name}
                    onChange={(e) => setUserData({ ...userData, last_name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#FFA317] focus:outline-none"
                  />
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <h4 className="text-white font-bold mb-4">Role & Tenant</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Role *</label>
                    <select
                      value={userData.role}
                      onChange={(e) => setUserData({
                        ...userData,
                        role: e.target.value,
                        tenant_id: e.target.value === 'super_admin' ? '' : userData.tenant_id
                      })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#FFA317] focus:outline-none"
                    >
                      <option value="user" className="bg-[#0a0b14]">User</option>
                      <option value="admin" className="bg-[#0a0b14]">Admin</option>
                      <option value="super_admin" className="bg-[#0a0b14]">Super Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-2">
                      Tenant {userData.role !== 'super_admin' && '*'}
                    </label>
                    <select
                      value={userData.tenant_id}
                      onChange={(e) => setUserData({ ...userData, tenant_id: e.target.value })}
                      disabled={userData.role === 'super_admin'}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#FFA317] focus:outline-none disabled:opacity-50"
                    >
                      <option value="" className="bg-[#0a0b14]">
                        {userData.role === 'super_admin' ? 'No Tenant (Super Admin)' : 'Select Tenant...'}
                      </option>
                      {tenants.map((tenant) => (
                        <option key={tenant.id} value={tenant.id} className="bg-[#0a0b14]">
                          {tenant.name}
                        </option>
                      ))}
                    </select>
                    {userData.role === 'super_admin' && (
                      <p className="text-white/40 text-xs mt-1">Super admins don't belong to a tenant</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <h4 className="text-white font-bold mb-4">Account Status</h4>
                <label className="flex items-center text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={userData.is_active}
                    onChange={(e) => setUserData({ ...userData, is_active: e.target.checked })}
                    className="mr-2 w-4 h-4"
                  />
                  <span>Account is active</span>
                </label>
                <p className="text-white/40 text-xs mt-1">Inactive users cannot log in</p>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="w-full py-2 bg-[#FFA317] text-black font-bold rounded hover:bg-white disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-white/20 text-white rounded hover:bg-white/5"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
