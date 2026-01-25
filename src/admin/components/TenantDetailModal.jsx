/**
 * Tenant Detail Modal
 * Comprehensive tenant view with integrated SSO and KMS configuration
 */
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function TenantDetailModal({ tenant, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(false);
  const [ssoConfig, setSsoConfig] = useState(null);
  const [kmsConfig, setKmsConfig] = useState(null);
  const [error, setError] = useState('');

  // Basic tenant fields
  const [tenantData, setTenantData] = useState({
    name: tenant.name || '',
    pentest_limit_per_year: tenant.pentest_limit_per_year || '',
    contract_end_date: tenant.contract_end_date ? tenant.contract_end_date.split('T')[0] : '',
    annual_arr: tenant.annual_arr || ''
  });

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
      const ssoRes = await axios.get('http://localhost:8000/api/v1/admin/sso/configurations');
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
      const kmsRes = await axios.get('http://localhost:8000/api/v1/admin/kms/configurations');
      const tenantKms = kmsRes.data.find(c => c.tenant_id === tenant.id);
      if (tenantKms) {
        setKmsConfig(tenantKms);
      }
    } catch (err) {
      console.error('Failed to load configurations:', err);
    }
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

      await axios.put(`http://localhost:8000/api/v1/admin/tenants/${tenant.id}`, payload);
      onUpdate();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update tenant');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigureSSO = async () => {
    setLoading(true);
    setError('');
    try {
      if (ssoConfig) {
        // Update existing
        await axios.put(`http://localhost:8000/api/v1/admin/sso/configurations/${ssoConfig.id}`, ssoData);
      } else {
        // Create new
        const payload = {
          tenant_id: tenant.id,
          ...ssoData
        };
        const response = await axios.post('http://localhost:8000/api/v1/admin/sso/configurations', payload);
        setSsoConfig(response.data);
      }
      loadConfigurations();
      alert('SSO configuration saved successfully!');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to configure SSO');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableSSO = async () => {
    if (!ssoConfig) return;
    try {
      await axios.put(`http://localhost:8000/api/v1/admin/sso/configurations/${ssoConfig.id}/enable`);
      loadConfigurations();
    } catch (err) {
      alert('Failed to enable SSO: ' + err.message);
    }
  };

  const handleDisableSSO = async () => {
    if (!ssoConfig) return;
    try {
      await axios.put(`http://localhost:8000/api/v1/admin/sso/configurations/${ssoConfig.id}/disable`);
      loadConfigurations();
    } catch (err) {
      alert('Failed to disable SSO: ' + err.message);
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
        await axios.put(`http://localhost:8000/api/v1/admin/kms/configurations/${kmsConfig.id}`, payload);
      } else {
        const response = await axios.post('http://localhost:8000/api/v1/admin/kms/configurations', payload);
        setKmsConfig(response.data);
      }
      loadConfigurations();
      alert('KMS configuration saved successfully!');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to configure KMS');
    } finally {
      setLoading(false);
    }
  };

  const handleTestKMS = async () => {
    if (!kmsConfig) return;
    try {
      const response = await axios.post(`http://localhost:8000/api/v1/admin/kms/configurations/${kmsConfig.id}/test`);
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
      await axios.put(`http://localhost:8000/api/v1/admin/kms/configurations/${kmsConfig.id}/enable`);
      loadConfigurations();
    } catch (err) {
      alert('Failed to enable KMS: ' + err.message);
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0a0b14] border border-white/10 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
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
            {['details', 'authentication', 'encryption'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 px-1 font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-[#FFA317] border-b-2 border-[#FFA317]'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {tab === 'details' && '📊 Details'}
                {tab === 'authentication' && '🔐 Authentication'}
                {tab === 'encryption' && '🔑 Encryption'}
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

          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-4">
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
                <label className="block text-white/60 text-sm mb-2">Pentest Limit (per year)</label>
                <input
                  type="number"
                  value={tenantData.pentest_limit_per_year}
                  onChange={(e) => setTenantData({ ...tenantData, pentest_limit_per_year: e.target.value })}
                  placeholder="Unlimited"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-white/60 text-sm mb-2">Contract End Date</label>
                <input
                  type="date"
                  value={tenantData.contract_end_date}
                  onChange={(e) => setTenantData({ ...tenantData, contract_end_date: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-white/60 text-sm mb-2">Annual ARR (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={tenantData.annual_arr}
                  onChange={(e) => setTenantData({ ...tenantData, annual_arr: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                />
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
                        kmsData.provider === 'azure' ? 'https://vault.azure.net/keys/...' :
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
