import React, { useState, useEffect } from 'react';
import { updateTarget, createTarget } from '../api/targets';

const TARGET_TYPES = [
  { value: 'web_app', label: 'Web App' },
  { value: 'binary', label: 'Binary' },
  { value: 'infrastructure', label: 'Infrastructure' }
];

const TEST_TYPES = [
  { value: 'black_box', label: 'Black Box' },
  { value: 'grey_box', label: 'Grey Box' }
];

const AUTH_TYPES = [
  { value: 'username_password', label: 'Username / Password' },
  { value: 'token', label: 'Token' },
  { value: 'cookie', label: 'Cookie' }
];

// Reusable input styling
const inputClass = "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-[#FFA317] focus:outline-none transition-colors";
const labelClass = "block text-white/40 text-xs uppercase tracking-wider mb-1.5 font-medium";
const sectionClass = "p-5 bg-white/[0.03] rounded-xl border border-white/10 space-y-4";

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-[#FFA317]' : 'bg-white/10'}`}
        onClick={(e) => { e.preventDefault(); onChange(!checked); }}
      >
        <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </div>
      <span className="text-white/70 text-sm group-hover:text-white transition-colors">{label}</span>
    </label>
  );
}

function CredentialBlock({ credential, index, onUpdate, onRemove, fields }) {
  return (
    <div className="relative p-4 bg-[#02030a] rounded-lg border border-white/10 space-y-3">
      {index > 0 && (
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 transition-all text-xs"
          title="Remove"
        >
          &times;
        </button>
      )}
      <div className="text-white/30 text-xs uppercase mb-2">Login #{index + 1}</div>
      {fields.map(field => (
        <div key={field.key}>
          <label className={labelClass}>{field.label}</label>
          {field.type === 'file' ? (
            <div className="flex items-center gap-3">
              <label className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:border-[#FFA317]/50 transition-colors">
                <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-white/50 text-sm truncate">
                  {credential[field.key] || 'Choose certificate file...'}
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept=".pem,.crt,.cer,.key,.p12,.pfx"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) onUpdate(field.key, file.name);
                  }}
                />
              </label>
            </div>
          ) : (
            <input
              type={field.type || 'text'}
              value={credential[field.key] || ''}
              onChange={(e) => onUpdate(field.key, e.target.value)}
              placeholder={field.placeholder || ''}
              className={inputClass}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function TargetDetailModal({ target, onClose, onUpdate, isNew = false }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: target?.name || '',
    url: target?.url || '',
    description: target?.description || '',
    target_type: target?.target_type || (isNew ? '' : 'web_app'),
    test_type: target?.test_type || 'black_box',
    include_subdomains: target?.include_subdomains || false,
    test_infrastructure: target?.test_infrastructure || false,
    endpoints: target?.endpoints || [],
    vpn_needed: target?.vpn_needed || false,
    auth_type: target?.auth_type || 'username_password',
    binary_filename: target?.binary_filename || ''
  });

  const [endpointsText, setEndpointsText] = useState(
    (target?.endpoints || []).join('\n')
  );

  // VPN credentials (multiple)
  const [vpnCredentials, setVpnCredentials] = useState(
    target?.vpn_credentials?.length > 0
      ? target.vpn_credentials
      : [{ username: '', password: '', certificate_name: '', certificate_password: '' }]
  );

  // System auth credentials (multiple, grey box only)
  const [authCredentials, setAuthCredentials] = useState(
    target?.auth_credentials?.length > 0
      ? target.auth_credentials
      : [{ username: '', password: '', token: '', cookie: '', role: 'user' }]
  );

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateVpnCredential = (index, key, value) => {
    setVpnCredentials(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  };

  const addVpnCredential = () => {
    setVpnCredentials(prev => [...prev, { username: '', password: '', certificate_name: '', certificate_password: '' }]);
  };

  const removeVpnCredential = (index) => {
    setVpnCredentials(prev => prev.filter((_, i) => i !== index));
  };

  const updateAuthCredential = (index, key, value) => {
    setAuthCredentials(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  };

  const addAuthCredential = () => {
    setAuthCredentials(prev => [...prev, { username: '', password: '', token: '', cookie: '', role: 'user' }]);
  };

  const removeAuthCredential = (index) => {
    setAuthCredentials(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Target name is required');
      return;
    }
    if (formData.target_type !== 'binary' && !formData.url.trim()) {
      setError('IP/Domain is required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        name: formData.name,
        url: formData.target_type === 'binary' ? null : formData.url,
        description: formData.description || null,
        target_type: formData.target_type,
        test_type: formData.target_type === 'binary' ? null : formData.test_type,
        include_subdomains: formData.target_type === 'web_app' && formData.test_type === 'black_box' ? formData.include_subdomains : false,
        test_infrastructure: formData.target_type === 'web_app' ? formData.test_infrastructure : false,
        endpoints: formData.target_type === 'web_app' && formData.test_type === 'grey_box'
          ? endpointsText.split('\n').map(s => s.trim()).filter(Boolean)
          : null,
        vpn_needed: formData.target_type !== 'binary' ? formData.vpn_needed : false,
        vpn_credentials: formData.vpn_needed && formData.target_type !== 'binary'
          ? vpnCredentials.filter(c => c.username || c.certificate_name)
          : null,
        auth_type: formData.test_type === 'grey_box' && formData.target_type === 'web_app' ? formData.auth_type : 'none',
        auth_credentials: formData.test_type === 'grey_box' && formData.target_type === 'web_app'
          ? authCredentials.filter(c => c.username || c.token || c.cookie)
          : null,
        binary_filename: formData.target_type === 'binary' ? formData.binary_filename : null
      };

      if (isNew) {
        await createTarget(payload);
        setSuccess('Target created successfully');
      } else {
        await updateTarget(target.id, payload);
        setSuccess('Target updated successfully');
      }
      onUpdate();
      setTimeout(() => onClose(), 800);
    } catch (err) {
      setError(err.response?.data?.detail || (isNew ? 'Failed to create target' : 'Failed to update target'));
    } finally {
      setLoading(false);
    }
  };

  const isBinary = formData.target_type === 'binary';
  const isWebApp = formData.target_type === 'web_app';
  const isInfra = formData.target_type === 'infrastructure';
  const isBlackBox = formData.test_type === 'black_box';
  const isGreyBox = formData.test_type === 'grey_box';

  // VPN credential fields
  const vpnFields = [
    { key: 'username', label: 'Username', type: 'text', placeholder: 'VPN username' },
    { key: 'password', label: 'Password', type: 'password', placeholder: 'VPN password' },
    { key: 'certificate_name', label: 'Certificate', type: 'file' },
    { key: 'certificate_password', label: 'Certificate Password (optional)', type: 'password', placeholder: 'Certificate passphrase' }
  ];

  // Auth credential fields based on auth type
  const getAuthFields = () => {
    switch (formData.auth_type) {
      case 'username_password':
        return [
          { key: 'username', label: 'Username', type: 'text' },
          { key: 'password', label: 'Password', type: 'password' }
        ];
      case 'token':
        return [
          { key: 'token', label: 'Token', type: 'text', placeholder: 'Bearer token or API key' }
        ];
      case 'cookie':
        return [
          { key: 'cookie', label: 'Cookie', type: 'text', placeholder: 'session_id=abc123; csrf_token=xyz' }
        ];
      default:
        return [];
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#0a0b14] border border-white/10 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white">
              {isNew ? 'New Target' : (formData.name || target?.name)}
            </h2>
            {!isNew && formData.url && (
              <p className="text-white/50 text-sm font-mono">{formData.url}</p>
            )}
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors text-2xl">&times;</button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6" style={{ maxHeight: 'calc(90vh - 160px)' }}>
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>
          )}
          {success && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">{success}</div>
          )}

          {/* ── TARGET NAME ── */}
          <div>
            <label className={labelClass}>Target Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="My Target"
              className={inputClass}
            />
          </div>

          {/* ── TARGET TYPE ── */}
          <div>
            <label className={labelClass}>Target Type</label>
            <div className="grid grid-cols-3 gap-3">
              {TARGET_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => updateField('target_type', t.value)}
                  className={`p-4 rounded-xl border text-center transition-all ${
                    formData.target_type === t.value
                      ? 'border-[#FFA317] bg-[#FFA317]/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <span className={`block text-sm font-bold ${formData.target_type === t.value ? 'text-[#FFA317]' : 'text-white'}`}>
                    {t.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ── BINARY: File Upload ── */}
          {formData.target_type && isBinary && (
            <div className={sectionClass}>
              <h3 className="text-white font-bold text-sm uppercase tracking-wider">Binary Upload</h3>
              <label className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-[#FFA317]/50 transition-colors">
                <svg className="w-10 h-10 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-white/50 text-sm">
                  {formData.binary_filename || 'Click to upload binary file'}
                </span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) updateField('binary_filename', file.name);
                  }}
                />
              </label>
              {formData.binary_filename && (
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <span className="text-[#FFA317]">Selected:</span>
                  <span className="font-mono">{formData.binary_filename}</span>
                </div>
              )}
            </div>
          )}

          {/* ── TEST TYPE SELECTOR (Web App & Infrastructure only) ── */}
          {formData.target_type && !isBinary && (
            <>
              <div>
                <label className={labelClass}>Test Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {TEST_TYPES.map(tt => (
                    <button
                      key={tt.value}
                      onClick={() => updateField('test_type', tt.value)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        formData.test_type === tt.value
                          ? 'border-[#FFA317] bg-[#FFA317]/10'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <span className={`block text-sm font-bold ${formData.test_type === tt.value ? 'text-[#FFA317]' : 'text-white'}`}>
                        {tt.label}
                      </span>
                      <span className="text-white/40 text-xs">
                        {tt.value === 'black_box' ? 'No internal knowledge' : 'Partial internal knowledge'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── SCOPE FIELDS ── */}
              <div className={sectionClass}>
                <h3 className="text-white font-bold text-sm uppercase tracking-wider">Scope</h3>

                {/* IP/Domain field */}
                <div>
                  <label className={labelClass}>
                    {isInfra && isGreyBox ? 'IP:Port' : 'IP / Domain'}
                  </label>
                  <input
                    type="text"
                    value={formData.url}
                    onChange={(e) => updateField('url', e.target.value)}
                    placeholder={isInfra && isGreyBox ? '192.168.1.1:8080' : 'example.com or 192.168.1.1'}
                    className={inputClass}
                  />
                  {isBlackBox && (
                    <p className="text-white/30 text-xs mt-1">Black Box: only one IP/Domain allowed</p>
                  )}
                </div>

                {/* Web App Black Box: Include Subdomains + Test Infrastructure */}
                {isWebApp && isBlackBox && (
                  <div className="flex flex-col gap-3">
                    <Toggle
                      label="Include Subdomains"
                      checked={formData.include_subdomains}
                      onChange={(v) => updateField('include_subdomains', v)}
                    />
                    <Toggle
                      label="Test Infrastructure"
                      checked={formData.test_infrastructure}
                      onChange={(v) => updateField('test_infrastructure', v)}
                    />
                  </div>
                )}

                {/* Web App Grey Box: Endpoints + Test Infrastructure */}
                {isWebApp && isGreyBox && (
                  <>
                    <div>
                      <label className={labelClass}>Endpoints (one per line)</label>
                      <textarea
                        value={endpointsText}
                        onChange={(e) => setEndpointsText(e.target.value)}
                        rows={4}
                        placeholder={"/api/v1/users\n/api/v1/auth\n/admin/dashboard"}
                        className={inputClass + " font-mono text-sm"}
                      />
                    </div>
                    <Toggle
                      label="Test Infrastructure"
                      checked={formData.test_infrastructure}
                      onChange={(v) => updateField('test_infrastructure', v)}
                    />
                  </>
                )}
              </div>

              {/* ── VPN ACCESS ── */}
              <div className={sectionClass}>
                <Toggle
                  label="VPN Access Needed"
                  checked={formData.vpn_needed}
                  onChange={(v) => updateField('vpn_needed', v)}
                />

                {formData.vpn_needed && (
                  <div className="space-y-3 mt-3">
                    {vpnCredentials.map((cred, i) => (
                      <CredentialBlock
                        key={i}
                        credential={cred}
                        index={i}
                        onUpdate={(key, value) => updateVpnCredential(i, key, value)}
                        onRemove={() => removeVpnCredential(i)}
                        fields={vpnFields}
                      />
                    ))}
                    <button
                      onClick={addVpnCredential}
                      className="w-full py-2 border border-dashed border-white/10 rounded-lg text-white/40 text-sm hover:text-[#FFA317] hover:border-[#FFA317]/30 transition-colors"
                    >
                      + Add VPN Login
                    </button>
                  </div>
                )}
              </div>

              {/* ── SYSTEM AUTH (Web App Grey Box only) ── */}
              {isWebApp && isGreyBox && (
                <div className={sectionClass}>
                  <h3 className="text-white font-bold text-sm uppercase tracking-wider">System Authentication</h3>

                  <div>
                    <label className={labelClass}>Auth Method</label>
                    <div className="grid grid-cols-3 gap-2">
                      {AUTH_TYPES.map(at => (
                        <button
                          key={at.value}
                          onClick={() => updateField('auth_type', at.value)}
                          className={`p-2.5 rounded-lg border text-center text-sm transition-all ${
                            formData.auth_type === at.value
                              ? 'border-[#FFA317] bg-[#FFA317]/10 text-[#FFA317] font-bold'
                              : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
                          }`}
                        >
                          {at.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {authCredentials.map((cred, i) => (
                      <div key={i} className="space-y-3">
                        <CredentialBlock
                          credential={cred}
                          index={i}
                          onUpdate={(key, value) => updateAuthCredential(i, key, value)}
                          onRemove={() => removeAuthCredential(i)}
                          fields={getAuthFields()}
                        />
                        {/* Role Selector for each credential */}
                        <div className="pl-4">
                          <label className={labelClass}>User Role</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => updateAuthCredential(i, 'role', 'user')}
                              className={`p-2.5 rounded-lg border text-center text-sm transition-all ${
                                (cred.role || 'user') === 'user'
                                  ? 'border-blue-500 bg-blue-500/10 text-blue-400 font-bold'
                                  : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
                              }`}
                            >
                              User
                            </button>
                            <button
                              onClick={() => updateAuthCredential(i, 'role', 'admin')}
                              className={`p-2.5 rounded-lg border text-center text-sm transition-all ${
                                cred.role === 'admin'
                                  ? 'border-[#FFA317] bg-[#FFA317]/10 text-[#FFA317] font-bold'
                                  : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
                              }`}
                            >
                              Admin
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={addAuthCredential}
                      className="w-full py-2 border border-dashed border-white/10 rounded-lg text-white/40 text-sm hover:text-[#FFA317] hover:border-[#FFA317]/30 transition-colors"
                    >
                      + Add Login
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── STATS (existing targets only) ── */}
          {formData.target_type && !isNew && target && (
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-[#FFA317]">{target.total_scans || 0}</p>
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

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-white/10 bg-white/[0.02]">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-white/20 text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2.5 bg-[#FFA317] text-black font-bold rounded-lg hover:bg-white disabled:opacity-50 transition-colors"
          >
            {loading ? (isNew ? 'Creating...' : 'Saving...') : (isNew ? 'Create Target' : 'Save Changes')}
          </button>
        </div>
      </div>
    </div>
  );
}
