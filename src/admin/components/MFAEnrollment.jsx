/**
 * MFA Enrollment Component
 * Wizard for enrolling in Google Authenticator TOTP
 * Shows QR code, backup codes, and first verification
 */
import React, { useState } from 'react';

const MFAEnrollment = ({ qrCode, backupCodes, secret, onComplete, onError }) => {
  const [step, setStep] = useState(1); // 1: QR, 2: Backup codes, 3: Verification
  const [totpCode, setTotpCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleDownloadBackupCodes = () => {
    const text = `VORNAC ADMIN - MFA Backup Codes\n\n${backupCodes.join('\n')}\n\nKeep these codes in a secure location. Each code can only be used once.`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vornac-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleVerify = async () => {
    if (totpCode.length !== 6) {
      onError('Please enter a 6-digit code');
      return;
    }

    setVerifying(true);
    try {
      await onComplete(totpCode);
    } catch (error) {
      onError(error.response?.data?.detail || 'Invalid verification code');
      setVerifying(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && totpCode.length === 6) {
      handleVerify();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-[#0a0b14] border border-white/10 rounded-xl p-8">
      {/* Step indicator */}
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                step >= s
                  ? 'bg-[#FFA317] text-black'
                  : 'bg-white/10 text-white/40'
              }`}
            >
              {s}
            </div>
            {s < 3 && (
              <div
                className={`w-16 h-0.5 ${
                  step > s ? 'bg-[#FFA317]' : 'bg-white/10'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: QR Code */}
      {step === 1 && (
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Scan QR Code</h2>
          <p className="text-white/60 mb-6">
            Open Google Authenticator or any TOTP authenticator app and scan this QR code
          </p>

          <div className="bg-white p-6 rounded-lg inline-block mb-6">
            <img
              src={`data:image/png;base64,${qrCode}`}
              alt="MFA QR Code"
              className="w-64 h-64"
            />
          </div>

          <div className="mb-6">
            <p className="text-white/40 text-sm mb-2">Can't scan? Enter this code manually:</p>
            <code className="text-[#FFA317] bg-white/5 px-4 py-2 rounded font-mono text-sm">
              {secret}
            </code>
          </div>

          <button
            onClick={() => setStep(2)}
            className="px-8 py-3 bg-[#FFA317] text-black font-bold rounded hover:bg-white transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Step 2: Backup Codes */}
      {step === 2 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-center">Save Backup Codes</h2>
          <p className="text-white/60 mb-6 text-center">
            Save these codes in a secure location. You can use them to log in if you lose access to your authenticator.
          </p>

          <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-2 gap-3">
              {backupCodes.map((code, idx) => (
                <div
                  key={idx}
                  className="font-mono text-[#FFA317] text-center py-2 bg-white/5 rounded"
                >
                  {code}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleDownloadBackupCodes}
              className="flex-1 px-6 py-3 border border-white/20 text-white font-bold rounded hover:bg-white/10 transition-colors"
            >
              Download Codes
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 px-6 py-3 bg-[#FFA317] text-black font-bold rounded hover:bg-white transition-colors"
            >
              I've Saved Them
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Verification */}
      {step === 3 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-center">Verify Setup</h2>
          <p className="text-white/60 mb-6 text-center">
            Enter the 6-digit code from your authenticator app to complete setup
          </p>

          <div className="mb-6">
            <input
              type="text"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyPress={handleKeyPress}
              placeholder="000000"
              maxLength={6}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-center text-2xl font-mono tracking-widest text-white placeholder:text-white/40 focus:border-[#FFA317] focus:outline-none"
              autoFocus
              disabled={verifying}
            />
          </div>

          <button
            onClick={handleVerify}
            disabled={totpCode.length !== 6 || verifying}
            className="w-full px-6 py-3 bg-[#FFA317] text-black font-bold rounded hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {verifying ? 'Verifying...' : 'Complete Setup'}
          </button>
        </div>
      )}
    </div>
  );
};

export default MFAEnrollment;
