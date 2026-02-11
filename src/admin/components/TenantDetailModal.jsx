/**
 * Tenant Detail Modal
 * Comprehensive tenant view with integrated SSO and KMS configuration
 */
import { useState, useEffect } from 'react';
import adminClient from '../api/client';
import {
  regenerateTenantAPIKey,
  suspendTenant,
  unsuspendTenant,
  deleteTenant
} from '../api/tenants';
import { listUsers, createUser, updateUser } from '../api/users';
import { useToastStore } from '../../stores/toastStore';

export default function TenantDetailModal({ tenant, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [ssoConfig, setSsoConfig] = useState(null);
  const [kmsConfig, setKmsConfig] = useState(null);
  const [tenantUsers, setTenantUsers] = useState([]);
  const [error, setError] = useState('');
  const [showSuspendForm, setShowSuspendForm] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  // Add user modal state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addUserMode, setAddUserMode] = useState('existing'); // 'existing' | 'new'
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newUserData, setNewUserData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'user',
    password: ''
  });

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Basic tenant fields
  const [tenantData, setTenantData] = useState({
    name: tenant.name || '',
    pentest_limit_per_year: tenant.pentest_limit_per_year || '',
    contract_end_date: tenant.contract_end_date ? tenant.contract_end_date.split('T')[0] : '',
    annual_arr: tenant.annual_arr || ''
  });

  // Contract end date visibility toggle
  const [hasContractEndDate, setHasContractEndDate] = useState(!!tenant.contract_end_date);

  // Logo upload state
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(tenant.logo_url || null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Authentication type
  const [authType, setAuthType] = useState('authenticator'); // 'authenticator' or 'sso'

  // SSO Configuration
  const [ssoData, setSsoData] = useState({
    provider: 'okta',
    idp_entity_id: '',
    idp_sso_url: '',
    idp_certificate: '',
    jit_provisioning: true
  });

  // KMS Configuration
  const [kmsData, setKmsData] = useState({
    provider: 'aws',
    kek_id: '',
    use_cases: ['pentest_results'],
    byok_enabled: false,
    // AWS
    aws_region: 'us-east-1',
    aws_access_key: '',
    aws_secret_key: '',
    // Azure
    azure_vault_url: '',
    azure_tenant_id: '',
    azure_client_id: '',
    azure_client_secret: '',
    // GCP
    gcp_project_id: '',
    gcp_location: 'global',
    // Vault
    vault_addr: '',
    vault_token: '',
    vault_namespace: '',
    vault_mount_point: 'transit'
  });

  useEffect(() => {
    loadConfigurations();
  }, [tenant.id]);

  const loadConfigurations = async () => {
    try {
      // Load SSO config
      const ssoRes = await adminClient.get('/sso/configurations');
      const tenantSso = ssoRes.data.find(c => c.tenant_id === tenant.id);
      if (tenantSso) {
        setSsoConfig(tenantSso);
        setAuthType('sso');
        setSsoData({
          provider: tenantSso.provider,
          idp_entity_id: tenantSso.idp_entity_id,
          idp_sso_url: tenantSso.idp_sso_url,
          idp_certificate: tenantSso.idp_certificate,
          jit_provisioning: tenantSso.jit_provisioning
        });
      }

      // Load KMS config
      const kmsRes = await adminClient.get('/kms/configurations');
      const tenantKms = kmsRes.data.find(c => c.tenant_id === tenant.id);
      if (tenantKms) {
        setKmsConfig(tenantKms);
      }

      // Load tenant users
      try {
        const usersRes = await adminClient.get(`/users?tenant_id=${tenant.id}`);
        setTenantUsers(usersRes.data.users || []);
      } catch (usersErr) {
        console.error('Failed to load users:', usersErr);
      }
    } catch (err) {
      console.error('Failed to load configurations:', err);
    }
  };

  // Load users that can be assigned to this tenant (users without a tenant or from other tenants)
  const loadAvailableUsers = async () => {
    try {
      const response = await listUsers({ page: 1, pageSize: 200 });
      // Filter out users already in this tenant and super_admins
      const available = response.users.filter(
        u => u.tenant_id !== tenant.id && u.role !== 'super_admin'
      );
      setAvailableUsers(available);
    } catch (err) {
      console.error('Failed to load available users:', err);
    }
  };

  // Assign existing user to this tenant
  const handleAssignUserToTenant = async () => {
    if (!selectedUserId) return;
    setLoading(true);
    setError('');
    try {
      await updateUser(selectedUserId, { tenant_id: tenant.id });
      setShowAddUserModal(false);
      setSelectedUserId('');
      loadConfigurations();
      onUpdate();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to assign user');
    } finally {
      setLoading(false);
    }
  };

  // Create new user for this tenant
  const handleCreateUserForTenant = async () => {
    if (!newUserData.email || !newUserData.firstName || !newUserData.lastName) {
      setError('Email, first name, and last name are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = {
        email: newUserData.email,
        first_name: newUserData.firstName,
        last_name: newUserData.lastName,
        role: newUserData.role,
        tenant_id: tenant.id,
        password: newUserData.password || undefined
      };
      const response = await createUser(payload);

      if (response.generated_password) {
        alert(`User created!\n\nGenerated Password: ${response.generated_password}\n\nCopy and save - won't be shown again!`);
      }

      setShowAddUserModal(false);
      resetNewUserForm();
      loadConfigurations();
      onUpdate();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const resetNewUserForm = () => {
    setNewUserData({
      email: '',
      firstName: '',
      lastName: '',
      role: 'user',
      password: ''
    });
    setError('');
  };

  const handleRegenerateAPIKey = async () => {
    if (!confirm('Regenerate API key? The old key will be immediately invalidated.')) return;
    try {
      await regenerateTenantAPIKey(tenant.id);
      onUpdate();
      alert('API key regenerated successfully');
    } catch (err) {
      alert('Failed to regenerate API key');
    }
  };

  const handleSuspend = async () => {
    if (!suspendReason.trim()) {
      alert('Please provide a suspension reason');
      return;
    }
    try {
      await suspendTenant(tenant.id, suspendReason);
      onUpdate();
      setShowSuspendForm(false);
      setSuspendReason('');
    } catch (err) {
      alert('Failed to suspend tenant');
    }
  };

  const handleUnsuspend = async () => {
    if (!confirm('Unsuspend this tenant? Users will regain access immediately.')) return;
    try {
      await unsuspendTenant(tenant.id);
      onUpdate();
    } catch (err) {
      alert('Failed to unsuspend tenant');
    }
  };

  const handleDelete = async () => {
    if (!confirm(`DELETE "${tenant.name}"? This will permanently delete all users and data. This cannot be undone.`)) return;
    try {
      await deleteTenant(tenant.id);
      onUpdate();
      onClose();
    } catch (err) {
      alert('Failed to delete tenant');
    }
  };

  const maskAPIKey = (key) => {
    if (!key) return '';
    if (showApiKey) return key;
    return key.slice(0, 8) + '••••••••' + key.slice(-4);
  };

  const handleSaveTenant = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        name: tenantData.name,
        pentest_limit_per_year: tenantData.pentest_limit_per_year === '' ? null : parseInt(tenantData.pentest_limit_per_year),
        contract_end_date: tenantData.contract_end_date === '' ? null : tenantData.contract_end_date,
        annual_arr: tenantData.annual_arr === '' ? null : parseFloat(tenantData.annual_arr)
      };

      await adminClient.put(`/tenants/${tenant.id}`, payload);
      onUpdate();
      useToastStore.getState().success('Tenant updated successfully');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update tenant');
      useToastStore.getState().error('Failed to update tenant');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
      if (!validTypes.includes(file.type)) {
        setError('Invalid file type. Please upload PNG, JPG, or SVG');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File too large. Maximum size is 5MB');
        return;
      }

      setLogoFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadLogo = async () => {
    if (!logoFile) return;

    setUploadingLogo(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', logoFile);

      const response = await adminClient.post(`/tenants/${tenant.id}/logo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setLogoPreview(response.data.logo_url);
      setLogoFile(null);
      onUpdate();
      useToastStore.getState().success('Logo uploaded successfully');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload logo');
      useToastStore.getState().error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleConfigureSSO = async () => {
    setLoading(true);
    setError('');
    try {
      if (ssoConfig) {
        // Update existing
        await adminClient.put(`/sso/configurations/${ssoConfig.id}`, ssoData);
      } else {
        // Create new
        const payload = {
          tenant_id: tenant.id,
          ...ssoData
        };
        const response = await adminClient.post('/sso/configurations', payload);
        setSsoConfig(response.data);
      }
      loadConfigurations();
      useToastStore.getState().success('SSO configuration saved successfully');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to configure SSO');
      useToastStore.getState().error('Failed to configure SSO');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableSSO = async () => {
    if (!ssoConfig) return;
    try {
      await adminClient.put(`/sso/configurations/${ssoConfig.id}/enable`);
      loadConfigurations();
      useToastStore.getState().success('SSO enabled successfully');
    } catch (err) {
      useToastStore.getState().error('Failed to enable SSO: ' + err.message);
    }
  };

  const handleDisableSSO = async () => {
    if (!ssoConfig) return;
    try {
      await adminClient.put(`/sso/configurations/${ssoConfig.id}/disable`);
      loadConfigurations();
      useToastStore.getState().success('SSO disabled successfully');
    } catch (err) {
      useToastStore.getState().error('Failed to disable SSO: ' + err.message);
    }
  };

  const buildKmsProviderConfig = () => {
    switch (kmsData.provider) {
      case 'aws':
        return {
          region: kmsData.aws_region,
          access_key_id: kmsData.aws_access_key,
          secret_access_key: kmsData.aws_secret_key
        };
      case 'azure':
        return {
          vault_url: kmsData.azure_vault_url,
          tenant_id: kmsData.azure_tenant_id,
          client_id: kmsData.azure_client_id,
          client_secret: kmsData.azure_client_secret
        };
      case 'gcp':
        return {
          project_id: kmsData.gcp_project_id,
          location: kmsData.gcp_location
        };
      case 'vault':
        return {
          vault_addr: kmsData.vault_addr,
          vault_token: kmsData.vault_token,
          vault_namespace: kmsData.vault_namespace,
          mount_point: kmsData.vault_mount_point
        };
      default:
        return {};
    }
  };

  const handleConfigureKMS = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        tenant_id: tenant.id,
        provider: kmsData.provider,
        kek_id: kmsData.kek_id,
        provider_config: buildKmsProviderConfig(),
        use_cases: kmsData.use_cases,
        byok_enabled: kmsData.byok_enabled
      };

      if (kmsConfig) {
        await adminClient.put(`/kms/configurations/${kmsConfig.id}`, payload);
      } else {
        const response = await adminClient.post('/kms/configurations', payload);
        setKmsConfig(response.data);
      }
      loadConfigurations();
      useToastStore.getState().success('KMS configuration saved successfully');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to configure KMS');
      useToastStore.getState().error('Failed to configure KMS');
    } finally {
      setLoading(false);
    }
  };

  const handleTestKMS = async () => {
    if (!kmsConfig) return;
    try {
      const response = await adminClient.post(`/kms/configurations/${kmsConfig.id}/test`);
      if (response.data.success) {
        alert('✅ KMS connection test successful!');
      } else {
        alert('❌ KMS connection test failed:\n' + (response.data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('❌ Test failed: ' + err.message);
    }
  };

  const handleEnableKMS = async () => {
    if (!kmsConfig) return;
    try {
      await adminClient.put(`/kms/configurations/${kmsConfig.id}/enable`);
      loadConfigurations();
      useToastStore.getState().success('KMS enabled successfully');
    } catch (err) {
      useToastStore.getState().error('Failed to enable KMS: ' + err.message);
    }
  };

  const toggleUseCase = (useCase) => {
    setKmsData(prev => ({
      ...prev,
      use_cases: prev.use_cases.includes(useCase)
        ? prev.use_cases.filter(uc => uc !== useCase)
        : [...prev.use_cases, useCase]
    }));
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#0a0b14] border border-white/10 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">{tenant.name}</h2>
              <p className="text-white/60 text-sm mt-1">Tenant ID: {tenant.id}</p>
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
            {['overview', 'details', 'users', 'authentication', 'encryption'].map((tab) => (
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
                {tab === 'details' && '📊 Contract'}
                {tab === 'users' && `👥 Users (${tenantUsers.length})`}
                {tab === 'authentication' && '🔐 Auth'}
                {tab === 'encryption' && '🔑 KMS'}
              </button>
            ))}
          </div>
        </div>

        {/* Content - scrollable */}
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
              {!tenant.is_active && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-red-400 font-bold">⚠️ SUSPENDED</span>
                      {tenant.suspension_reason && (
                        <p className="text-red-400/80 text-sm mt-1">{tenant.suspension_reason}</p>
                      )}
                      {tenant.suspended_at && (
                        <p className="text-red-400/60 text-xs mt-1">
                          Since: {new Date(tenant.suspended_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={handleUnsuspend}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-bold"
                    >
                      Unsuspend
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-white/60 text-xs uppercase mb-1">Status</div>
                  <div className={`text-lg font-bold ${tenant.is_active ? 'text-green-400' : 'text-red-400'}`}>
                    {tenant.is_active ? 'Active' : 'Suspended'}
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-white/60 text-xs uppercase mb-1">Users</div>
                  <div className="text-lg font-bold text-white">{tenant.user_count || tenantUsers.length}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-white/60 text-xs uppercase mb-1">Pentests</div>
                  <div className="text-lg font-bold text-white">
                    {tenant.pentest_count || 0}
                    {tenant.pentest_limit_per_year && (
                      <span className="text-white/40 text-sm"> / {tenant.pentest_limit_per_year}</span>
                    )}
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-white/60 text-xs uppercase mb-1">Auth Method</div>
                  <div className="text-lg font-bold text-white">
                    {ssoConfig ? (
                      <span className="text-purple-400">SSO</span>
                    ) : (
                      <span className="text-blue-400">TOTP</span>
                    )}
                  </div>
                </div>
              </div>

              {/* API Key Section */}
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-white font-bold">API Key</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="px-3 py-1 text-xs text-white/60 hover:text-white border border-white/20 rounded"
                    >
                      {showApiKey ? 'Hide' : 'Show'}
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(tenant.api_key);
                        alert('API key copied!');
                      }}
                      className="px-3 py-1 text-xs text-white/60 hover:text-white border border-white/20 rounded"
                    >
                      Copy
                    </button>
                    <button
                      onClick={handleRegenerateAPIKey}
                      className="px-3 py-1 text-xs text-yellow-400 hover:bg-yellow-400/10 border border-yellow-400/20 rounded"
                    >
                      Regenerate
                    </button>
                  </div>
                </div>
                <code className="text-white/80 font-mono text-sm bg-black/30 px-3 py-2 rounded block">
                  {maskAPIKey(tenant.api_key)}
                </code>
              </div>

              {/* Configuration Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-bold">Authentication</span>
                    {ssoConfig?.enabled ? (
                      <span className="px-2 py-1 text-xs bg-green-500/10 text-green-400 rounded">Enabled</span>
                    ) : ssoConfig ? (
                      <span className="px-2 py-1 text-xs bg-yellow-500/10 text-yellow-400 rounded">Configured</span>
                    ) : (
                      <span className="px-2 py-1 text-xs bg-blue-500/10 text-blue-400 rounded">TOTP</span>
                    )}
                  </div>
                  <p className="text-white/60 text-sm">
                    {ssoConfig ? `${ssoConfig.provider.toUpperCase()} SSO` : 'TOTP Authenticator'}
                  </p>
                  <button
                    onClick={() => setActiveTab('authentication')}
                    className="text-[#FFA317] text-sm mt-2 hover:underline"
                  >
                    Configure →
                  </button>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-bold">Encryption (KMS)</span>
                    {kmsConfig?.enabled ? (
                      <span className="px-2 py-1 text-xs bg-green-500/10 text-green-400 rounded">Enabled</span>
                    ) : kmsConfig ? (
                      <span className="px-2 py-1 text-xs bg-yellow-500/10 text-yellow-400 rounded">Configured</span>
                    ) : (
                      <span className="px-2 py-1 text-xs bg-white/10 text-white/40 rounded">Not Set</span>
                    )}
                  </div>
                  <p className="text-white/60 text-sm">
                    {kmsConfig ? `${kmsConfig.provider.toUpperCase()} KMS` : 'Standard encryption'}
                  </p>
                  <button
                    onClick={() => setActiveTab('encryption')}
                    className="text-[#FFA317] text-sm mt-2 hover:underline"
                  >
                    Configure →
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              {tenant.is_active && (
                <div className="border-t border-white/10 pt-4">
                  <div className="text-white/60 text-sm mb-3">Quick Actions</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowSuspendForm(true)}
                      className="px-4 py-2 text-orange-400 border border-orange-400/30 rounded hover:bg-orange-400/10"
                    >
                      Suspend Tenant
                    </button>
                    <button
                      onClick={handleDelete}
                      className="px-4 py-2 text-red-400 border border-red-400/30 rounded hover:bg-red-400/10"
                    >
                      Delete Tenant
                    </button>
                  </div>

                  {showSuspendForm && (
                    <div className="mt-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                      <label className="block text-white/60 text-sm mb-2">Suspension Reason</label>
                      <textarea
                        value={suspendReason}
                        onChange={(e) => setSuspendReason(e.target.value)}
                        placeholder="e.g., Payment overdue, Terms violation..."
                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm"
                        rows={2}
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => {
                            setShowSuspendForm(false);
                            setSuspendReason('');
                          }}
                          className="px-3 py-1 text-white/60 border border-white/20 rounded text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSuspend}
                          disabled={!suspendReason.trim()}
                          className="px-3 py-1 bg-orange-500 text-white rounded text-sm font-bold disabled:opacity-50"
                        >
                          Confirm Suspend
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Contract/Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/60 text-sm mb-2">Tenant Name</label>
                  <input
                    type="text"
                    value={tenantData.name}
                    onChange={(e) => setTenantData({ ...tenantData, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-2">Tenant ID</label>
                  <input
                    type="text"
                    value={tenant.id}
                    disabled
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white/40"
                  />
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <h4 className="text-white font-bold mb-4">Contract Details</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Pentest Limit (per year)</label>
                    <input
                      type="number"
                      value={tenantData.pentest_limit_per_year}
                      onChange={(e) => setTenantData({ ...tenantData, pentest_limit_per_year: e.target.value })}
                      placeholder="Unlimited"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                    />
                    <p className="text-white/40 text-xs mt-1">Leave blank for unlimited</p>
                  </div>

                  <div>
                    <label className="flex items-center text-white cursor-pointer mb-3">
                      <input
                        type="checkbox"
                        checked={hasContractEndDate}
                        onChange={(e) => {
                          setHasContractEndDate(e.target.checked);
                          if (!e.target.checked) {
                            setTenantData({ ...tenantData, contract_end_date: '' });
                          }
                        }}
                        className="mr-2 w-4 h-4"
                      />
                      <span>Set Contract End Date</span>
                    </label>

                    {hasContractEndDate && (
                      <>
                        <input
                          type="date"
                          value={tenantData.contract_end_date}
                          onChange={(e) => setTenantData({ ...tenantData, contract_end_date: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                        />
                        <p className="text-white/40 text-xs mt-1">Specify when the contract expires</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <h4 className="text-white font-bold mb-4">Revenue & Analytics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Annual ARR (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={tenantData.annual_arr}
                      onChange={(e) => setTenantData({ ...tenantData, annual_arr: e.target.value })}
                      placeholder="0.00"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Cost per Pentest</label>
                    <div className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white/60">
                      {tenant.cost_per_pentest
                        ? `€${parseFloat(tenant.cost_per_pentest).toFixed(2)}`
                        : 'N/A'}
                    </div>
                    <p className="text-white/40 text-xs mt-1">Calculated from ARR / pentests</p>
                  </div>
                </div>
              </div>

              {/* Logo Upload Section */}
              <div className="border-t border-white/10 pt-4">
                <h4 className="text-white font-bold mb-4">Tenant Logo (PDF Reports)</h4>
                <div className="space-y-4">
                  {/* Current Logo Preview */}
                  {logoPreview && (
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <p className="text-white/60 text-sm mb-2">Current Logo:</p>
                      <img
                        src={logoPreview.startsWith('data:') ? logoPreview : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${logoPreview}`}
                        alt="Tenant Logo"
                        className="max-h-24 max-w-full object-contain bg-white/10 p-2 rounded"
                      />
                    </div>
                  )}

                  {/* File Upload */}
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Upload New Logo</label>
                    <div className="flex items-center gap-3">
                      <label className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:border-[#FFA317]/50 transition-colors">
                        <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="text-white/50 text-sm truncate">
                          {logoFile ? logoFile.name : 'Choose logo file...'}
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                          onChange={handleLogoFileSelect}
                        />
                      </label>
                      {logoFile && (
                        <button
                          onClick={handleUploadLogo}
                          disabled={uploadingLogo}
                          className="px-4 py-2.5 bg-[#FFA317] text-black font-bold rounded-lg hover:bg-white disabled:opacity-50 transition-colors"
                        >
                          {uploadingLogo ? 'Uploading...' : 'Upload'}
                        </button>
                      )}
                    </div>
                    <p className="text-white/40 text-xs mt-1">Accepts PNG, JPG, SVG (max 5MB). Will appear on PDF report cover page.</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <h4 className="text-white font-bold mb-4">Metadata</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-white/60">Created:</span>
                    <span className="text-white ml-2">
                      {tenant.created_at ? new Date(tenant.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/60">Total Pentests:</span>
                    <span className="text-white ml-2">{tenant.pentest_count || 0}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleSaveTenant}
                  disabled={loading}
                  className="w-full py-2 bg-[#FFA317] text-black font-bold rounded hover:bg-white disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold">Tenant Users ({tenantUsers.length})</h3>
                <button
                  onClick={() => {
                    loadAvailableUsers();
                    setShowAddUserModal(true);
                    setAddUserMode('existing');
                    setError('');
                  }}
                  className="px-4 py-2 bg-[#FFA317] text-black font-bold rounded hover:bg-white transition-colors text-sm"
                >
                  + Add User
                </button>
              </div>

              {tenantUsers.length === 0 ? (
                <div className="text-center py-8 text-white/40">
                  No users found for this tenant
                </div>
              ) : (
                <div className="bg-white/5 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="text-left p-3 text-white/60 text-sm">Email</th>
                        <th className="text-left p-3 text-white/60 text-sm">Name</th>
                        <th className="text-left p-3 text-white/60 text-sm">Role</th>
                        <th className="text-left p-3 text-white/60 text-sm">MFA</th>
                        <th className="text-left p-3 text-white/60 text-sm">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {tenantUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-white/5">
                          <td className="p-3 text-white">{user.email}</td>
                          <td className="p-3 text-white/80">
                            {user.first_name} {user.last_name}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-1 text-xs rounded ${
                              user.role === 'admin'
                                ? 'bg-purple-500/10 text-purple-400'
                                : 'bg-blue-500/10 text-blue-400'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="p-3">
                            {user.mfa_enabled ? (
                              <span className="text-green-400 text-sm">✓ Enabled</span>
                            ) : (
                              <span className="text-white/40 text-sm">Not set</span>
                            )}
                          </td>
                          <td className="p-3">
                            {user.is_active ? (
                              <span className="text-green-400 text-sm">Active</span>
                            ) : (
                              <span className="text-red-400 text-sm">Inactive</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Add User Modal */}
              {showAddUserModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
                  <div className="bg-[#0a0b14] border border-white/10 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                    <h3 className="text-white font-bold text-lg mb-4">Add User to {tenant.name}</h3>

                    {error && (
                      <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-500 text-sm">
                        {error}
                      </div>
                    )}

                    {/* Mode Toggle */}
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => {
                          setAddUserMode('existing');
                          setError('');
                        }}
                        className={`flex-1 py-2 rounded text-sm font-bold transition-colors ${
                          addUserMode === 'existing'
                            ? 'bg-[#FFA317] text-black'
                            : 'bg-white/10 text-white/60 hover:text-white'
                        }`}
                      >
                        Assign Existing
                      </button>
                      <button
                        onClick={() => {
                          setAddUserMode('new');
                          setError('');
                        }}
                        className={`flex-1 py-2 rounded text-sm font-bold transition-colors ${
                          addUserMode === 'new'
                            ? 'bg-[#FFA317] text-black'
                            : 'bg-white/10 text-white/60 hover:text-white'
                        }`}
                      >
                        Create New
                      </button>
                    </div>

                    {/* Assign Existing User */}
                    {addUserMode === 'existing' && (
                      <div>
                        <label className="block text-white/60 text-sm mb-2">Select User</label>
                        <select
                          value={selectedUserId}
                          onChange={(e) => setSelectedUserId(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white mb-4 focus:border-[#FFA317] focus:outline-none"
                        >
                          <option value="" className="bg-[#0a0b14]">Choose a user...</option>
                          {availableUsers.length === 0 ? (
                            <option value="" disabled className="bg-[#0a0b14]">No available users</option>
                          ) : (
                            availableUsers.map(u => (
                              <option key={u.id} value={u.id} className="bg-[#0a0b14]">
                                {u.email} ({u.first_name} {u.last_name}){u.tenant_name ? ` - ${u.tenant_name}` : ''}
                              </option>
                            ))
                          )}
                        </select>
                        {availableUsers.length === 0 && (
                          <p className="text-white/40 text-xs mb-4">
                            No users available to assign. Create a new user instead.
                          </p>
                        )}
                        <button
                          onClick={handleAssignUserToTenant}
                          disabled={!selectedUserId || loading}
                          className="w-full py-2 bg-[#FFA317] text-black font-bold rounded hover:bg-white disabled:opacity-50 transition-colors"
                        >
                          {loading ? 'Assigning...' : 'Assign User'}
                        </button>
                      </div>
                    )}

                    {/* Create New User */}
                    {addUserMode === 'new' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-white/60 text-sm mb-1">Email *</label>
                          <input
                            type="email"
                            value={newUserData.email}
                            onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                            placeholder="user@example.com"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#FFA317] focus:outline-none"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-white/60 text-sm mb-1">First Name *</label>
                            <input
                              type="text"
                              value={newUserData.firstName}
                              onChange={(e) => setNewUserData({ ...newUserData, firstName: e.target.value })}
                              placeholder="John"
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#FFA317] focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-white/60 text-sm mb-1">Last Name *</label>
                            <input
                              type="text"
                              value={newUserData.lastName}
                              onChange={(e) => setNewUserData({ ...newUserData, lastName: e.target.value })}
                              placeholder="Doe"
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#FFA317] focus:outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-white/60 text-sm mb-1">Role *</label>
                          <select
                            value={newUserData.role}
                            onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#FFA317] focus:outline-none"
                          >
                            <option value="user" className="bg-[#0a0b14]">User</option>
                            <option value="admin" className="bg-[#0a0b14]">Admin</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-white/60 text-sm mb-1">Password (optional)</label>
                          <input
                            type="text"
                            value={newUserData.password}
                            onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                            placeholder="Leave empty to auto-generate"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white font-mono focus:border-[#FFA317] focus:outline-none"
                          />
                          <p className="text-white/40 text-xs mt-1">If empty, a random password will be generated</p>
                        </div>
                        <button
                          onClick={handleCreateUserForTenant}
                          disabled={loading}
                          className="w-full py-2 bg-[#FFA317] text-black font-bold rounded hover:bg-white disabled:opacity-50 transition-colors"
                        >
                          {loading ? 'Creating...' : 'Create User'}
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setShowAddUserModal(false);
                        setSelectedUserId('');
                        resetNewUserForm();
                      }}
                      className="w-full mt-3 py-2 border border-white/20 text-white rounded hover:bg-white/5 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Authentication Tab */}
          {activeTab === 'authentication' && (
            <div className="space-y-6">
              {/* Auth Type Selector */}
              <div>
                <label className="block text-white font-bold mb-3">Authentication Method</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setAuthType('authenticator')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      authType === 'authenticator'
                        ? 'border-[#FFA317] bg-[#FFA317]/10'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="text-2xl mb-2">📱</div>
                    <div className="text-white font-bold">Authenticator (TOTP)</div>
                    <div className="text-white/60 text-sm">Google Authenticator, Authy, etc.</div>
                  </button>

                  <button
                    onClick={() => setAuthType('sso')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      authType === 'sso'
                        ? 'border-[#FFA317] bg-[#FFA317]/10'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="text-2xl mb-2">🔐</div>
                    <div className="text-white font-bold">SSO / SAML</div>
                    <div className="text-white/60 text-sm">Okta, Azure AD, Google, etc.</div>
                  </button>
                </div>
              </div>

              {/* SSO Configuration (only if SSO selected) */}
              {authType === 'sso' && (
                <div className="space-y-4 p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-bold">SSO Configuration</h3>
                    {ssoConfig && (
                      <span className={`px-2 py-1 text-xs font-bold rounded ${
                        ssoConfig.enabled
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {ssoConfig.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-white/60 text-sm mb-2">Provider</label>
                    <select
                      value={ssoData.provider}
                      onChange={(e) => setSsoData({ ...ssoData, provider: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                    >
                      <option value="okta">Okta</option>
                      <option value="azure_ad">Azure AD</option>
                      <option value="google">Google Workspace</option>
                      <option value="onelogin">OneLogin</option>
                      <option value="generic">Generic SAML 2.0</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white/60 text-sm mb-2">IdP Entity ID</label>
                    <input
                      type="text"
                      value={ssoData.idp_entity_id}
                      onChange={(e) => setSsoData({ ...ssoData, idp_entity_id: e.target.value })}
                      placeholder="http://www.okta.com/exk..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-white/60 text-sm mb-2">IdP SSO URL</label>
                    <input
                      type="url"
                      value={ssoData.idp_sso_url}
                      onChange={(e) => setSsoData({ ...ssoData, idp_sso_url: e.target.value })}
                      placeholder="https://your-org.okta.com/..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-white/60 text-sm mb-2">IdP Certificate</label>
                    <textarea
                      value={ssoData.idp_certificate}
                      onChange={(e) => setSsoData({ ...ssoData, idp_certificate: e.target.value })}
                      placeholder="MIICmTCCAYGgAwIBAgIGAY..."
                      rows={4}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="flex items-center text-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ssoData.jit_provisioning}
                        onChange={(e) => setSsoData({ ...ssoData, jit_provisioning: e.target.checked })}
                        className="mr-2"
                      />
                      <span>Enable JIT Provisioning</span>
                    </label>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleConfigureSSO}
                      disabled={loading}
                      className="flex-1 py-2 bg-[#FFA317] text-black font-bold rounded hover:bg-white disabled:opacity-50"
                    >
                      Save SSO Config
                    </button>
                    {ssoConfig && !ssoConfig.enabled && (
                      <button
                        onClick={handleEnableSSO}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Enable
                      </button>
                    )}
                    {ssoConfig && ssoConfig.enabled && (
                      <button
                        onClick={handleDisableSSO}
                        className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                      >
                        Disable
                      </button>
                    )}
                  </div>
                </div>
              )}

              {authType === 'authenticator' && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-blue-400 text-sm">
                    <strong>Authenticator TOTP:</strong> Users will set up Google Authenticator or similar apps on first login. They'll scan a QR code and enter 6-digit codes to authenticate.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Encryption Tab */}
          {activeTab === 'encryption' && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold">KMS Encryption</h3>
                  {kmsConfig && (
                    <span className={`px-2 py-1 text-xs font-bold rounded ${
                      kmsConfig.enabled
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-yellow-500/10 text-yellow-400'
                    }`}>
                      {kmsConfig.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-white/60 text-sm mb-2">KMS Provider</label>
                    <select
                      value={kmsData.provider}
                      onChange={(e) => setKmsData({ ...kmsData, provider: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                    >
                      <option value="aws">AWS KMS</option>
                      <option value="azure">Azure Key Vault</option>
                      <option value="gcp">Google Cloud KMS</option>
                      <option value="vault">HashiCorp Vault</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white/60 text-sm mb-2">
                      {kmsData.provider === 'aws' && 'Key ARN'}
                      {kmsData.provider === 'azure' && 'Key URL'}
                      {kmsData.provider === 'gcp' && 'Key Resource Name'}
                      {kmsData.provider === 'vault' && 'Key Name'}
                    </label>
                    <input
                      type="text"
                      value={kmsData.kek_id}
                      onChange={(e) => setKmsData({ ...kmsData, kek_id: e.target.value })}
                      placeholder={
                        kmsData.provider === 'aws' ? 'arn:aws:kms:us-east-1:...' :
                        kmsData.provider === 'azure' ? 'https://vault-name.vault.azure.net/keys/...' :
                        kmsData.provider === 'gcp' ? 'projects/.../cryptoKeys/...' :
                        'my-encryption-key'
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white font-mono text-sm"
                    />
                  </div>

                  {/* Provider-specific fields (condensed) */}
                  {kmsData.provider === 'aws' && (
                    <div className="space-y-3 p-3 bg-white/5 rounded">
                      <input
                        type="text"
                        value={kmsData.aws_region}
                        onChange={(e) => setKmsData({ ...kmsData, aws_region: e.target.value })}
                        placeholder="Region (us-east-1)"
                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm"
                      />
                      <input
                        type="text"
                        value={kmsData.aws_access_key}
                        onChange={(e) => setKmsData({ ...kmsData, aws_access_key: e.target.value })}
                        placeholder="Access Key ID"
                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white font-mono text-sm"
                      />
                      <input
                        type="password"
                        value={kmsData.aws_secret_key}
                        onChange={(e) => setKmsData({ ...kmsData, aws_secret_key: e.target.value })}
                        placeholder="Secret Access Key"
                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white font-mono text-sm"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-white/60 text-sm mb-2">Use Cases</label>
                    <div className="space-y-2">
                      {['api_keys', 'pentest_results', 'db_fields', 'signing'].map((uc) => (
                        <label key={uc} className="flex items-center text-white cursor-pointer">
                          <input
                            type="checkbox"
                            checked={kmsData.use_cases.includes(uc)}
                            onChange={() => toggleUseCase(uc)}
                            className="mr-2"
                          />
                          <span className="text-sm">{uc.replace('_', ' ').toUpperCase()}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center text-white cursor-pointer font-bold">
                      <input
                        type="checkbox"
                        checked={kmsData.byok_enabled}
                        onChange={(e) => setKmsData({ ...kmsData, byok_enabled: e.target.checked })}
                        className="mr-2"
                      />
                      <span>Enable BYOK (Bring Your Own Key)</span>
                    </label>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleConfigureKMS}
                      disabled={loading}
                      className="flex-1 py-2 bg-[#FFA317] text-black font-bold rounded hover:bg-white disabled:opacity-50"
                    >
                      Save KMS Config
                    </button>
                    {kmsConfig && (
                      <>
                        <button
                          onClick={handleTestKMS}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Test
                        </button>
                        {!kmsConfig.enabled ? (
                          <button
                            onClick={handleEnableKMS}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Enable
                          </button>
                        ) : (
                          <span className="px-4 py-2 bg-green-600 text-white rounded opacity-50">
                            Enabled
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
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
