import { useState, useEffect } from 'react';
import axios from 'axios';

export default function SSOConfigPage() {
  const [configs, setConfigs] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    tenant_id: '',
    provider: 'okta',
    idp_entity_id: '',
    idp_sso_url: '',
    idp_certificate: '',
    jit_provisioning: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [configsRes, tenantsRes] = await Promise.all([
        axios.get('http://localhost:8000/api/v1/admin/sso/configurations'),
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

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await axios.post('http://localhost:8000/api/v1/admin/sso/configurations', formData);
      setShowModal(false);
      setFormData({
        tenant_id: '',
        provider: 'okta',
        idp_entity_id: '',
        idp_sso_url: '',
        idp_certificate: '',
        jit_provisioning: true
      });
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create SSO configuration');
    }
  };

  const handleEnable = async (configId) => {
    try {
      await axios.put(`http://localhost:8000/api/v1/admin/sso/configurations/${configId}/enable`);
      loadData();
    } catch (err) {
      alert('Failed to enable SSO: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDisable = async (configId) => {
    try {
      await axios.put(`http://localhost:8000/api/v1/admin/sso/configurations/${configId}/disable`);
      loadData();
    } catch (err) {
      alert('Failed to disable SSO: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDelete = async (configId) => {
    if (!confirm('Are you sure you want to delete this SSO configuration?')) return;

    try {
      await axios.delete(`http://localhost:8000/api/v1/admin/sso/configurations/${configId}`);
      loadData();
    } catch (err) {
      alert('Failed to delete SSO configuration: ' + (err.response?.data?.detail || err.message));
    }
  };

  const getMetadataUrl = (tenantId) => {
    return `http://localhost:8000/api/v1/sso/auth/metadata/${tenantId}`;
  };

  const providerLabels = {
    okta: 'Okta',
    azure_ad: 'Azure AD',
    google: 'Google Workspace',
    onelogin: 'OneLogin',
    generic: 'Generic SAML 2.0'
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            SSO CONFIGURATIONS
          </h1>
          <p className="text-white/60 mt-2">Configure SAML-based single sign-on for tenants</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-2 bg-[#FFA317] text-black font-bold rounded hover:bg-white transition-colors"
        >
          + Add SSO Config
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#0a0b14] border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-white/40">Loading...</div>
        ) : configs.length === 0 ? (
          <div className="p-8 text-center text-white/40">
            No SSO configurations yet. Click "Add SSO Config" to get started.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left p-4 text-white/60 text-sm font-bold">Tenant</th>
                <th className="text-left p-4 text-white/60 text-sm font-bold">Provider</th>
                <th className="text-left p-4 text-white/60 text-sm font-bold">Status</th>
                <th className="text-left p-4 text-white/60 text-sm font-bold">IdP Entity ID</th>
                <th className="text-left p-4 text-white/60 text-sm font-bold">JIT Provisioning</th>
                <th className="text-right p-4 text-white/60 text-sm font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {configs.map((config) => (
                <tr key={config.id} className="hover:bg-white/5">
                  <td className="p-4 text-white font-medium">{config.tenant_name}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold rounded">
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
                  <td className="p-4 text-white/60 text-sm font-mono max-w-xs truncate">
                    {config.idp_entity_id}
                  </td>
                  <td className="p-4 text-white/60">
                    {config.jit_provisioning ? (
                      <span className="text-green-400">✓ Enabled</span>
                    ) : (
                      <span className="text-red-400">✗ Disabled</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
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
                      <a
                        href={getMetadataUrl(config.tenant_id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Metadata
                      </a>
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
          <div className="bg-[#0a0b14] border border-white/10 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">Add SSO Configuration</h2>

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
                <label className="block text-white/60 text-sm mb-2">Identity Provider *</label>
                <select
                  required
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#FFA317] focus:outline-none"
                >
                  <option value="okta">Okta</option>
                  <option value="azure_ad">Azure AD</option>
                  <option value="google">Google Workspace</option>
                  <option value="onelogin">OneLogin</option>
                  <option value="generic">Generic SAML 2.0</option>
                </select>
              </div>

              {/* IdP Entity ID */}
              <div className="mb-4">
                <label className="block text-white/60 text-sm mb-2">IdP Entity ID *</label>
                <input
                  type="text"
                  required
                  value={formData.idp_entity_id}
                  onChange={(e) => setFormData({ ...formData, idp_entity_id: e.target.value })}
                  placeholder="http://www.okta.com/exk1234567890"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:border-[#FFA317] focus:outline-none"
                />
              </div>

              {/* IdP SSO URL */}
              <div className="mb-4">
                <label className="block text-white/60 text-sm mb-2">IdP SSO URL *</label>
                <input
                  type="url"
                  required
                  value={formData.idp_sso_url}
                  onChange={(e) => setFormData({ ...formData, idp_sso_url: e.target.value })}
                  placeholder="https://your-org.okta.com/app/vornac/sso/saml"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:border-[#FFA317] focus:outline-none"
                />
              </div>

              {/* IdP Certificate */}
              <div className="mb-4">
                <label className="block text-white/60 text-sm mb-2">
                  IdP Certificate (X.509 PEM format) *
                </label>
                <textarea
                  required
                  value={formData.idp_certificate}
                  onChange={(e) => setFormData({ ...formData, idp_certificate: e.target.value })}
                  placeholder="MIICmTCCAYGgAwIBAgIGAY..."
                  rows={6}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:border-[#FFA317] focus:outline-none font-mono text-sm"
                />
                <p className="text-white/30 text-xs mt-1">
                  Paste the certificate without headers (-----BEGIN CERTIFICATE-----)
                </p>
              </div>

              {/* JIT Provisioning */}
              <div className="mb-6">
                <label className="flex items-center text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.jit_provisioning}
                    onChange={(e) => setFormData({ ...formData, jit_provisioning: e.target.checked })}
                    className="mr-2"
                  />
                  <span>Enable Just-In-Time (JIT) User Provisioning</span>
                </label>
                <p className="text-white/30 text-xs mt-1 ml-6">
                  Automatically create users on first SSO login
                </p>
              </div>

              {/* Info Box */}
              <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-blue-400 text-sm font-bold mb-2">Configure in your IdP:</p>
                <div className="space-y-1 text-sm text-white/60 font-mono">
                  <p>ACS URL: http://localhost:8000/api/v1/sso/auth/acs</p>
                  <p>Entity ID: https://vornac.com/saml/sp/{'{tenant_id}'}</p>
                  <p>NameID Format: Email Address</p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 border border-white/20 text-white rounded hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#FFA317] text-black font-bold rounded hover:bg-white"
                >
                  Create SSO Config
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
