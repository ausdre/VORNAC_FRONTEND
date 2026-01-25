import { useState, useEffect } from 'react';
import axios from 'axios';

export default function KMSConfigPage() {
  const [configs, setConfigs] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [testing, setTesting] = useState(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    tenant_id: '',
    provider: 'aws',
    kek_id: '',
    provider_config: {},
    use_cases: ['pentest_results'],
    byok_enabled: false,
    // AWS fields
    aws_region: 'us-east-1',
    aws_access_key: '',
    aws_secret_key: '',
    // Azure fields
    azure_vault_url: '',
    azure_tenant_id: '',
    azure_client_id: '',
    azure_client_secret: '',
    // GCP fields
    gcp_project_id: '',
    gcp_location: 'global',
    // Vault fields
    vault_addr: '',
    vault_token: '',
    vault_namespace: '',
    vault_mount_point: 'transit'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [configsRes, tenantsRes] = await Promise.all([
        axios.get('http://localhost:8000/api/v1/admin/kms/configurations'),
        axios.get('http://localhost:8000/api/v1/admin/tenants')
      ]);
      setConfigs(configsRes.data);
      setTenants(tenantsRes.data.tenants || []);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load configurations');
    } finally {
      setLoading(false);
    }
  };

  const buildProviderConfig = () => {
    switch (formData.provider) {
      case 'aws':
        return {
          region: formData.aws_region,
          access_key_id: formData.aws_access_key,
          secret_access_key: formData.aws_secret_key
        };
      case 'azure':
        return {
          vault_url: formData.azure_vault_url,
          tenant_id: formData.azure_tenant_id,
          client_id: formData.azure_client_id,
          client_secret: formData.azure_client_secret
        };
      case 'gcp':
        return {
          project_id: formData.gcp_project_id,
          location: formData.gcp_location
        };
      case 'vault':
        return {
          vault_addr: formData.vault_addr,
          vault_token: formData.vault_token,
          vault_namespace: formData.vault_namespace,
          mount_point: formData.vault_mount_point
        };
      default:
        return {};
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const payload = {
        tenant_id: parseInt(formData.tenant_id),
        provider: formData.provider,
        kek_id: formData.kek_id,
        provider_config: buildProviderConfig(),
        use_cases: formData.use_cases,
        byok_enabled: formData.byok_enabled
      };

      await axios.post('http://localhost:8000/api/v1/admin/kms/configurations', payload);
      setShowModal(false);
      resetForm();
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create KMS configuration');
    }
  };

  const resetForm = () => {
    setFormData({
      tenant_id: '',
      provider: 'aws',
      kek_id: '',
      provider_config: {},
      use_cases: ['pentest_results'],
      byok_enabled: false,
      aws_region: 'us-east-1',
      aws_access_key: '',
      aws_secret_key: '',
      azure_vault_url: '',
      azure_tenant_id: '',
      azure_client_id: '',
      azure_client_secret: '',
      gcp_project_id: '',
      gcp_location: 'global',
      vault_addr: '',
      vault_token: '',
      vault_namespace: '',
      vault_mount_point: 'transit'
    });
  };

  const handleTest = async (configId) => {
    setTesting(configId);
    try {
      const response = await axios.post(
        `http://localhost:8000/api/v1/admin/kms/configurations/${configId}/test`
      );
      if (response.data.success) {
        alert('✅ KMS connection test successful!');
      } else {
        alert('❌ KMS connection test failed:\n' + (response.data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('❌ Test failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setTesting(null);
    }
  };

  const handleEnable = async (configId) => {
    try {
      await axios.put(`http://localhost:8000/api/v1/admin/kms/configurations/${configId}/enable`);
      loadData();
    } catch (err) {
      alert('Failed to enable KMS: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDisable = async (configId) => {
    try {
      await axios.put(`http://localhost:8000/api/v1/admin/kms/configurations/${configId}/disable`);
      loadData();
    } catch (err) {
      alert('Failed to disable KMS: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDelete = async (configId) => {
    if (!confirm('Are you sure? This will prevent decryption of existing encrypted data!')) return;

    try {
      await axios.delete(`http://localhost:8000/api/v1/admin/kms/configurations/${configId}`);
      loadData();
    } catch (err) {
      alert('Failed to delete KMS configuration: ' + (err.response?.data?.detail || err.message));
    }
  };

  const toggleUseCase = (useCase) => {
    setFormData(prev => ({
      ...prev,
      use_cases: prev.use_cases.includes(useCase)
        ? prev.use_cases.filter(uc => uc !== useCase)
        : [...prev.use_cases, useCase]
    }));
  };

  const providerLabels = {
    aws: 'AWS KMS',
    azure: 'Azure Key Vault',
    gcp: 'Google Cloud KMS',
    vault: 'HashiCorp Vault'
  };

  const useCaseLabels = {
    api_keys: 'API Keys',
    pentest_results: 'Pentest Results',
    db_fields: 'Database Fields',
    signing: 'Data Signing'
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            KMS CONFIGURATIONS
          </h1>
          <p className="text-white/60 mt-2">Configure customer-managed encryption keys (BYOK supported)</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-2 bg-[#FFA317] text-black font-bold rounded hover:bg-white transition-colors"
        >
          + Add KMS Config
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#0a0b14] border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-white/40">Loading...</div>
        ) : configs.length === 0 ? (
          <div className="p-8 text-center text-white/40">
            No KMS configurations yet. Click "Add KMS Config" to get started.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left p-4 text-white/60 text-sm font-bold">Tenant</th>
                <th className="text-left p-4 text-white/60 text-sm font-bold">Provider</th>
                <th className="text-left p-4 text-white/60 text-sm font-bold">Status</th>
                <th className="text-left p-4 text-white/60 text-sm font-bold">BYOK</th>
                <th className="text-left p-4 text-white/60 text-sm font-bold">Use Cases</th>
                <th className="text-left p-4 text-white/60 text-sm font-bold">DEK Count</th>
                <th className="text-right p-4 text-white/60 text-sm font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {configs.map((config) => (
                <tr key={config.id} className="hover:bg-white/5">
                  <td className="p-4 text-white font-medium">{config.tenant_name}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-purple-500/10 text-purple-400 text-xs font-bold rounded">
                      {providerLabels[config.provider] || config.provider}
                    </span>
                  </td>
                  <td className="p-4">
                    {config.enabled ? (
                      <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs font-bold rounded">
                        Enabled
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-500/10 text-yellow-400 text-xs font-bold rounded">
                        Disabled
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    {config.byok_enabled ? (
                      <span className="text-green-400 font-bold">✓ Yes</span>
                    ) : (
                      <span className="text-white/40">No</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {config.use_cases?.map((uc) => (
                        <span key={uc} className="px-2 py-0.5 bg-white/5 text-white/60 text-xs rounded">
                          {useCaseLabels[uc] || uc}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-white/60">{config.dek_count || 0}</td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleTest(config.id)}
                        disabled={testing === config.id}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        {testing === config.id ? 'Testing...' : 'Test'}
                      </button>
                      {!config.enabled ? (
                        <button
                          onClick={() => handleEnable(config.id)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          Enable
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDisable(config.id)}
                          className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
                        >
                          Disable
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(config.id)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
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

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#0a0b14] border border-white/10 rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">Add KMS Configuration</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-500 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate}>
              {/* Tenant Selection */}
              <div className="mb-4">
                <label className="block text-white/60 text-sm mb-2">Tenant *</label>
                <select
                  required
                  value={formData.tenant_id}
                  onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#FFA317] focus:outline-none"
                >
                  <option value="">Select tenant...</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Provider */}
              <div className="mb-4">
                <label className="block text-white/60 text-sm mb-2">KMS Provider *</label>
                <select
                  required
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#FFA317] focus:outline-none"
                >
                  <option value="aws">AWS KMS</option>
                  <option value="azure">Azure Key Vault</option>
                  <option value="gcp">Google Cloud KMS</option>
                  <option value="vault">HashiCorp Vault</option>
                </select>
              </div>

              {/* KEK ID */}
              <div className="mb-4">
                <label className="block text-white/60 text-sm mb-2">
                  {formData.provider === 'aws' && 'Key ARN *'}
                  {formData.provider === 'azure' && 'Key URL *'}
                  {formData.provider === 'gcp' && 'Key Resource Name *'}
                  {formData.provider === 'vault' && 'Key Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.kek_id}
                  onChange={(e) => setFormData({ ...formData, kek_id: e.target.value })}
                  placeholder={
                    formData.provider === 'aws' ? 'arn:aws:kms:us-east-1:123456789012:key/...' :
                    formData.provider === 'azure' ? 'https://vault-name.vault.azure.net/keys/key-name' :
                    formData.provider === 'gcp' ? 'projects/project/locations/location/keyRings/ring/cryptoKeys/key' :
                    'my-encryption-key'
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:border-[#FFA317] focus:outline-none font-mono text-sm"
                />
              </div>

              {/* Provider-specific fields */}
              {formData.provider === 'aws' && (
                <div className="space-y-4 mb-4 p-4 bg-white/5 rounded-lg">
                  <h3 className="text-white font-bold">AWS Configuration</h3>
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Region *</label>
                    <input
                      type="text"
                      required
                      value={formData.aws_region}
                      onChange={(e) => setFormData({ ...formData, aws_region: e.target.value })}
                      placeholder="us-east-1"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Access Key ID *</label>
                    <input
                      type="text"
                      required
                      value={formData.aws_access_key}
                      onChange={(e) => setFormData({ ...formData, aws_access_key: e.target.value })}
                      placeholder="AKIA..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Secret Access Key *</label>
                    <input
                      type="password"
                      required
                      value={formData.aws_secret_key}
                      onChange={(e) => setFormData({ ...formData, aws_secret_key: e.target.value })}
                      placeholder="Secret..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white font-mono"
                    />
                  </div>
                </div>
              )}

              {formData.provider === 'azure' && (
                <div className="space-y-4 mb-4 p-4 bg-white/5 rounded-lg">
                  <h3 className="text-white font-bold">Azure Configuration</h3>
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Vault URL *</label>
                    <input
                      type="url"
                      required
                      value={formData.azure_vault_url}
                      onChange={(e) => setFormData({ ...formData, azure_vault_url: e.target.value })}
                      placeholder="https://vault-name.vault.azure.net/"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Tenant ID *</label>
                    <input
                      type="text"
                      required
                      value={formData.azure_tenant_id}
                      onChange={(e) => setFormData({ ...formData, azure_tenant_id: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Client ID *</label>
                    <input
                      type="text"
                      required
                      value={formData.azure_client_id}
                      onChange={(e) => setFormData({ ...formData, azure_client_id: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Client Secret *</label>
                    <input
                      type="password"
                      required
                      value={formData.azure_client_secret}
                      onChange={(e) => setFormData({ ...formData, azure_client_secret: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white font-mono"
                    />
                  </div>
                </div>
              )}

              {formData.provider === 'gcp' && (
                <div className="space-y-4 mb-4 p-4 bg-white/5 rounded-lg">
                  <h3 className="text-white font-bold">Google Cloud Configuration</h3>
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Project ID *</label>
                    <input
                      type="text"
                      required
                      value={formData.gcp_project_id}
                      onChange={(e) => setFormData({ ...formData, gcp_project_id: e.target.value })}
                      placeholder="my-project-12345"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Location</label>
                    <input
                      type="text"
                      value={formData.gcp_location}
                      onChange={(e) => setFormData({ ...formData, gcp_location: e.target.value })}
                      placeholder="global or us-east1"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  <p className="text-white/40 text-xs">
                    Note: Configure service account credentials via GOOGLE_APPLICATION_CREDENTIALS
                  </p>
                </div>
              )}

              {formData.provider === 'vault' && (
                <div className="space-y-4 mb-4 p-4 bg-white/5 rounded-lg">
                  <h3 className="text-white font-bold">HashiCorp Vault Configuration</h3>
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Vault Address *</label>
                    <input
                      type="url"
                      required
                      value={formData.vault_addr}
                      onChange={(e) => setFormData({ ...formData, vault_addr: e.target.value })}
                      placeholder="https://vault.example.com:8200"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Vault Token *</label>
                    <input
                      type="password"
                      required
                      value={formData.vault_token}
                      onChange={(e) => setFormData({ ...formData, vault_token: e.target.value })}
                      placeholder="s.xxxxxxxxxxxxxxxxxxxxx"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Namespace (Enterprise)</label>
                    <input
                      type="text"
                      value={formData.vault_namespace}
                      onChange={(e) => setFormData({ ...formData, vault_namespace: e.target.value })}
                      placeholder="admin/my-namespace"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Mount Point</label>
                    <input
                      type="text"
                      value={formData.vault_mount_point}
                      onChange={(e) => setFormData({ ...formData, vault_mount_point: e.target.value })}
                      placeholder="transit"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                </div>
              )}

              {/* Use Cases */}
              <div className="mb-4">
                <label className="block text-white/60 text-sm mb-2">Use Cases (select at least one) *</label>
                <div className="space-y-2">
                  {Object.entries(useCaseLabels).map(([key, label]) => (
                    <label key={key} className="flex items-center text-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.use_cases.includes(key)}
                        onChange={() => toggleUseCase(key)}
                        className="mr-2"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* BYOK */}
              <div className="mb-6">
                <label className="flex items-center text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.byok_enabled}
                    onChange={(e) => setFormData({ ...formData, byok_enabled: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="font-bold">Enable BYOK (Bring Your Own Key)</span>
                </label>
                <p className="text-white/30 text-xs mt-1 ml-6">
                  Customer provides and controls the encryption key material
                </p>
              </div>

              {/* Warning Box */}
              <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-yellow-400 text-sm font-bold mb-1">⚠️ Important</p>
                <p className="text-white/60 text-sm">
                  Test the connection before enabling. Losing access to the KMS key will make encrypted data unrecoverable.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setError('');
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-white/20 text-white rounded hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#FFA317] text-black font-bold rounded hover:bg-white"
                >
                  Create KMS Config
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
