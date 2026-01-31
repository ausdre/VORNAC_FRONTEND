import React, { useState, useEffect } from 'react';
import { updateTarget, createTarget } from '../api/targets';

const TARGET_TYPES = [
  { value: 'web_app', label: 'Web Application' },
  { value: 'api', label: 'API / REST Service' },
  { value: 'network', label: 'Network / Infrastructure' },
  { value: 'mobile', label: 'Mobile Application' }
];

const AUTH_TYPES = [
  { value: 'none', label: 'No Authentication' },
  { value: 'basic', label: 'Basic Auth (Username/Password)' },
  { value: 'bearer', label: 'Bearer Token / API Key' },
  { value: 'cookie', label: 'Cookie / Session Based' },
  { value: 'form', label: 'Form Login' },
  { value: 'custom', label: 'Custom Authentication' }
];

const SCAN_INTENSITIES = [
  { value: 'passive', label: 'Passive', description: 'Read-only, no active probing' },
  { value: 'light', label: 'Light', description: 'Minimal probing, low risk' },
  { value: 'moderate', label: 'Moderate', description: 'Standard testing (Recommended)' },
  { value: 'aggressive', label: 'Aggressive', description: 'Full testing, may cause disruption' }
];

const TEST_CATEGORIES = [
  { value: 'xss', label: 'XSS (Cross-Site Scripting)' },
  { value: 'sqli', label: 'SQL Injection' },
  { value: 'auth', label: 'Authentication & Authorization' },
  { value: 'csrf', label: 'CSRF' },
  { value: 'ssrf', label: 'SSRF' },
  { value: 'lfi', label: 'Local File Inclusion' },
  { value: 'rce', label: 'Remote Code Execution' },
  { value: 'info_disclosure', label: 'Information Disclosure' },
  { value: 'misconfig', label: 'Security Misconfiguration' },
  { value: 'crypto', label: 'Cryptographic Issues' }
];

export default function TargetDetailModal({ target, onClose, onUpdate, isNew = false }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Edit form state - use empty defaults for new target
  const [formData, setFormData] = useState({
    name: target?.name || '',
    url: target?.url || '',
    description: target?.description || '',
    target_type: target?.target_type || 'web_app',
    ip_addresses: target?.ip_addresses?.join('\n') || '',
    subdomains: target?.subdomains?.join('\n') || '',
    ports: target?.ports?.join(', ') || '',
    out_of_scope: target?.out_of_scope?.join('\n') || '',
    technologies: target?.technologies?.join(', ') || '',
    auth_type: target?.auth_type || 'none',
    auth_config: target?.auth_config || {},
    scan_intensity: target?.scan_intensity || 'moderate',
    test_categories: target?.test_categories || [],
    custom_headers: JSON.stringify(target?.custom_headers || {}, null, 2),
    rate_limit: target?.rate_limit || '',
    notification_emails: target?.notification_emails?.join(', ') || '',
    contact_name: target?.contact_name || '',
    contact_phone: target?.contact_phone || ''
  });

  // Auth config fields
  const [authUsername, setAuthUsername] = useState(target?.auth_config?.username || '');
  const [authPassword, setAuthPassword] = useState(target?.auth_config?.password || '');
  const [authToken, setAuthToken] = useState(target?.auth_config?.token || '');
  const [authLoginUrl, setAuthLoginUrl] = useState(target?.auth_config?.login_url || '');

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleSave = async () => {
    // Validate required fields
    if (!formData.name.trim()) {
      setError('Target name is required');
      return;
    }
    if (!formData.url.trim()) {
      setError('Target URL is required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Build auth_config based on auth_type
      let authConfig = null;
      if (formData.auth_type === 'basic') {
        authConfig = { username: authUsername, password: authPassword };
      } else if (formData.auth_type === 'bearer') {
        authConfig = { token: authToken };
      } else if (formData.auth_type === 'form') {
        authConfig = { login_url: authLoginUrl, username: authUsername, password: authPassword };
      } else if (formData.auth_type === 'cookie') {
        authConfig = { cookie: authToken };
      }

      // Parse custom_headers JSON
      let customHeaders = null;
      try {
        if (formData.custom_headers.trim()) {
          customHeaders = JSON.parse(formData.custom_headers);
        }
      } catch (e) {
        setError('Invalid JSON in Custom Headers');
        setLoading(false);
        return;
      }

      const payload = {
        name: formData.name,
        url: formData.url,
        description: formData.description || null,
        target_type: formData.target_type,
        ip_addresses: formData.ip_addresses ? formData.ip_addresses.split('\n').map(s => s.trim()).filter(Boolean) : null,
        subdomains: formData.subdomains ? formData.subdomains.split('\n').map(s => s.trim()).filter(Boolean) : null,
        ports: formData.ports ? formData.ports.split(',').map(s => s.trim()).filter(Boolean) : null,
        out_of_scope: formData.out_of_scope ? formData.out_of_scope.split('\n').map(s => s.trim()).filter(Boolean) : null,
        technologies: formData.technologies ? formData.technologies.split(',').map(s => s.trim()).filter(Boolean) : null,
        auth_type: formData.auth_type,
        auth_config: authConfig,
        scan_intensity: formData.scan_intensity,
        test_categories: formData.test_categories.length > 0 ? formData.test_categories : null,
        custom_headers: customHeaders,
        rate_limit: formData.rate_limit ? parseInt(formData.rate_limit) : null,
        notification_emails: formData.notification_emails ? formData.notification_emails.split(',').map(s => s.trim()).filter(Boolean) : null,
        contact_name: formData.contact_name || null,
        contact_phone: formData.contact_phone || null
      };

      if (isNew) {
        await createTarget(payload);
        setSuccess('Target created successfully');
      } else {
        await updateTarget(target.id, payload);
        setSuccess('Target updated successfully');
      }
      onUpdate();

      // Close modal after short delay to show success message
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.detail || (isNew ? 'Failed to create target' : 'Failed to update target'));
    } finally {
      setLoading(false);
    }
  };

  const toggleTestCategory = (category) => {
    setFormData(prev => ({
      ...prev,
      test_categories: prev.test_categories.includes(category)
        ? prev.test_categories.filter(c => c !== category)
        : [...prev.test_categories, category]
    }));
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'scope', label: 'Scope' },
    { id: 'authentication', label: 'Auth' },
    { id: 'testing', label: 'Testing' },
    { id: 'notifications', label: 'Contacts' }
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0a0b14] border border-white/10 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white">
              {isNew ? 'Add New Target' : (formData.name || target?.name)}
            </h2>
            <p className="text-white/50 text-sm font-mono">
              {isNew ? 'Configure all target settings' : (formData.url || target?.url)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors text-2xl"
          >
            &times;
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 px-6 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-bold transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-[#FFA317] border-b-2 border-[#FFA317]'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded text-green-400 text-sm">
              {success}
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-white/40 text-xs uppercase mb-1">Target Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#FFA317] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/40 text-xs uppercase mb-1">Target Type</label>
                  <select
                    value={formData.target_type}
                    onChange={(e) => setFormData({ ...formData, target_type: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#FFA317] focus:outline-none"
                  >
                    {TARGET_TYPES.map(t => (
                      <option key={t.value} value={t.value} className="bg-[#0a0b14]">{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-white/40 text-xs uppercase mb-1">URL</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white font-mono focus:border-[#FFA317] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-white/40 text-xs uppercase mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#FFA317] focus:outline-none"
                />
              </div>

              {/* Stats - only show for existing targets */}
              {!isNew && target && (
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-[#FFA317]">{target.total_scans || 0}</p>
                    <p className="text-white/40 text-xs uppercase">Total Scans</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <p className="text-sm text-white">{target.last_scan_at ? new Date(target.last_scan_at).toLocaleDateString() : 'Never'}</p>
                    <p className="text-white/40 text-xs uppercase">Last Scan</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <p className="text-sm text-white">{new Date(target.created_at).toLocaleDateString()}</p>
                    <p className="text-white/40 text-xs uppercase">Created</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Scope Tab */}
          {activeTab === 'scope' && (
            <div className="space-y-6">
              <div>
                <label className="block text-white/40 text-xs uppercase mb-1">IP Addresses (one per line)</label>
                <textarea
                  value={formData.ip_addresses}
                  onChange={(e) => setFormData({ ...formData, ip_addresses: e.target.value })}
                  rows={4}
                  placeholder="192.168.1.1&#10;10.0.0.0/24"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white font-mono text-sm focus:border-[#FFA317] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-white/40 text-xs uppercase mb-1">Subdomains / Domains (one per line)</label>
                <textarea
                  value={formData.subdomains}
                  onChange={(e) => setFormData({ ...formData, subdomains: e.target.value })}
                  rows={4}
                  placeholder="api.example.com&#10;staging.example.com&#10;*.dev.example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white font-mono text-sm focus:border-[#FFA317] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-white/40 text-xs uppercase mb-1">Ports (comma-separated)</label>
                <input
                  type="text"
                  value={formData.ports}
                  onChange={(e) => setFormData({ ...formData, ports: e.target.value })}
                  placeholder="80, 443, 8080, 8000-9000"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white font-mono focus:border-[#FFA317] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-white/40 text-xs uppercase mb-1">Out of Scope (one per line)</label>
                <textarea
                  value={formData.out_of_scope}
                  onChange={(e) => setFormData({ ...formData, out_of_scope: e.target.value })}
                  rows={3}
                  placeholder="/admin/*&#10;/api/internal/*&#10;192.168.1.100"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white font-mono text-sm focus:border-[#FFA317] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-white/40 text-xs uppercase mb-1">Known Technologies (comma-separated)</label>
                <input
                  type="text"
                  value={formData.technologies}
                  onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                  placeholder="React, Node.js, PostgreSQL, AWS"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#FFA317] focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Authentication Tab */}
          {activeTab === 'authentication' && (
            <div className="space-y-6">
              <div>
                <label className="block text-white/40 text-xs uppercase mb-2">Authentication Type</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {AUTH_TYPES.map(auth => (
                    <button
                      key={auth.value}
                      onClick={() => setFormData({ ...formData, auth_type: auth.value })}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        formData.auth_type === auth.value
                          ? 'border-[#FFA317] bg-[#FFA317]/10 text-white'
                          : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
                      }`}
                    >
                      <span className="text-sm font-medium">{auth.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {formData.auth_type !== 'none' && (
                <div className="p-4 bg-white/5 rounded-lg border border-white/10 space-y-4">
                  <h4 className="text-white font-bold text-sm">Authentication Credentials</h4>

                  {(formData.auth_type === 'basic' || formData.auth_type === 'form') && (
                    <>
                      <div>
                        <label className="block text-white/40 text-xs uppercase mb-1">Username</label>
                        <input
                          type="text"
                          value={authUsername}
                          onChange={(e) => setAuthUsername(e.target.value)}
                          className="w-full bg-[#02030a] border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#FFA317] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-white/40 text-xs uppercase mb-1">Password</label>
                        <input
                          type="password"
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          className="w-full bg-[#02030a] border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#FFA317] focus:outline-none"
                        />
                      </div>
                    </>
                  )}

                  {formData.auth_type === 'form' && (
                    <div>
                      <label className="block text-white/40 text-xs uppercase mb-1">Login URL</label>
                      <input
                        type="url"
                        value={authLoginUrl}
                        onChange={(e) => setAuthLoginUrl(e.target.value)}
                        placeholder="https://example.com/login"
                        className="w-full bg-[#02030a] border border-white/10 rounded-lg px-4 py-2 text-white font-mono focus:border-[#FFA317] focus:outline-none"
                      />
                    </div>
                  )}

                  {(formData.auth_type === 'bearer' || formData.auth_type === 'cookie') && (
                    <div>
                      <label className="block text-white/40 text-xs uppercase mb-1">
                        {formData.auth_type === 'bearer' ? 'Bearer Token / API Key' : 'Session Cookie'}
                      </label>
                      <textarea
                        value={authToken}
                        onChange={(e) => setAuthToken(e.target.value)}
                        rows={3}
                        placeholder={formData.auth_type === 'bearer' ? 'eyJhbGciOiJIUzI1NiIs...' : 'session_id=abc123; csrf_token=xyz789'}
                        className="w-full bg-[#02030a] border border-white/10 rounded-lg px-4 py-2 text-white font-mono text-sm focus:border-[#FFA317] focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Testing Tab */}
          {activeTab === 'testing' && (
            <div className="space-y-6">
              <div>
                <label className="block text-white/40 text-xs uppercase mb-2">Scan Intensity</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {SCAN_INTENSITIES.map(intensity => (
                    <button
                      key={intensity.value}
                      onClick={() => setFormData({ ...formData, scan_intensity: intensity.value })}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        formData.scan_intensity === intensity.value
                          ? 'border-[#FFA317] bg-[#FFA317]/10'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <span className={`block text-sm font-bold ${formData.scan_intensity === intensity.value ? 'text-[#FFA317]' : 'text-white'}`}>
                        {intensity.label}
                      </span>
                      <span className="text-white/40 text-xs">{intensity.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-white/40 text-xs uppercase mb-2">Test Categories</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {TEST_CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      onClick={() => toggleTestCategory(cat.value)}
                      className={`p-2 rounded-lg border text-left text-sm transition-all ${
                        formData.test_categories.includes(cat.value)
                          ? 'border-[#FFA317] bg-[#FFA317]/10 text-white'
                          : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
                      }`}
                    >
                      {formData.test_categories.includes(cat.value) && '✓ '}
                      {cat.label}
                    </button>
                  ))}
                </div>
                <p className="text-white/30 text-xs mt-2">Leave empty to run all applicable tests</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/40 text-xs uppercase mb-1">Rate Limit (req/sec)</label>
                  <input
                    type="number"
                    value={formData.rate_limit}
                    onChange={(e) => setFormData({ ...formData, rate_limit: e.target.value })}
                    placeholder="Default: No limit"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#FFA317] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/40 text-xs uppercase mb-1">Custom HTTP Headers (JSON)</label>
                <textarea
                  value={formData.custom_headers}
                  onChange={(e) => setFormData({ ...formData, custom_headers: e.target.value })}
                  rows={4}
                  placeholder='{"X-Custom-Header": "value"}'
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white font-mono text-sm focus:border-[#FFA317] focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <label className="block text-white/40 text-xs uppercase mb-1">Notification Emails (comma-separated)</label>
                <input
                  type="text"
                  value={formData.notification_emails}
                  onChange={(e) => setFormData({ ...formData, notification_emails: e.target.value })}
                  placeholder="security@company.com, cto@company.com"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#FFA317] focus:outline-none"
                />
                <p className="text-white/30 text-xs mt-1">These contacts will be notified when pentests complete</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/40 text-xs uppercase mb-1">Emergency Contact Name</label>
                  <input
                    type="text"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#FFA317] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/40 text-xs uppercase mb-1">Emergency Phone</label>
                  <input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    placeholder="+49 123 456789"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#FFA317] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-white/10 bg-white/5">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-white/20 text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-[#FFA317] text-black font-bold rounded-lg hover:bg-white disabled:opacity-50 transition-colors"
          >
            {loading ? (isNew ? 'Creating...' : 'Saving...') : (isNew ? 'Create Target' : 'Save Changes')}
          </button>
        </div>
      </div>
    </div>
  );
}
