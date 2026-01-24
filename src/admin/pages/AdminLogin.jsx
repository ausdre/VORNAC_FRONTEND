/**
 * Admin Login Page
 * Two-step MFA authentication with enrollment support
 * Step 1: Email + Password → Step 2: TOTP or Enrollment
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuthStore } from '../stores/adminAuthStore';
import { loginStep1, enrollMFA, confirmMFA, loginStep2 } from '../api/auth';
import MFAEnrollment from '../components/MFAEnrollment';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { loginStep1: setStep1, loginStep2: setStep2 } = useAdminAuthStore();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');

  // Flow state
  const [step, setStep] = useState('credentials'); // credentials, enrollment, totp
  const [sessionToken, setSessionToken] = useState(null);
  const [enrollmentData, setEnrollmentData] = useState(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Submit credentials
  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await loginStep1(email, password);

      setSessionToken(response.session_token);
      setStep1(response.session_token, response.requires_mfa_enrollment);

      if (response.requires_mfa_enrollment) {
        // Need to enroll MFA - fetch enrollment data
        const enrollData = await enrollMFA(response.session_token);
        setEnrollmentData(enrollData);
        setStep('enrollment');
      } else {
        // MFA already enrolled - proceed to TOTP
        setStep('totp');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  // MFA Enrollment: Complete enrollment
  const handleEnrollmentComplete = async (totpCode) => {
    try {
      await confirmMFA(sessionToken, totpCode);

      // Now verify TOTP to complete login
      const response = await loginStep2(sessionToken, totpCode);

      const success = setStep2(response.access_token);
      if (success) {
        navigate('/admin/dashboard');
      } else {
        setError('Authentication failed. Please try again.');
      }
    } catch (err) {
      throw err; // Let MFAEnrollment handle the error
    }
  };

  // Step 2: Submit TOTP code
  const handleTOTPSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await loginStep2(sessionToken, totpCode);

      const success = setStep2(response.access_token);
      if (success) {
        navigate('/admin/dashboard');
      } else {
        setError('Authentication failed. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const handleTOTPKeyPress = (e) => {
    if (e.key === 'Enter' && totpCode.length === 6) {
      handleTOTPSubmit(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#02030a] flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          {/* VORNAC Logo */}
          <div className="flex justify-center mb-4">
            <img src="/vornac_static.svg" alt="VORNAC" className="h-16 w-auto drop-shadow-[0_0_20px_rgba(255,163,23,0.5)]" />
          </div>
          <p className="text-white/40 text-sm text-center">Super Admin Access</p>
        </div>

        {/* Step 1: Credentials */}
        {step === 'credentials' && (
          <div className="bg-[#0a0b14] border border-white/10 rounded-xl p-8">
            <h2 className="text-xl font-bold mb-6 text-center">Sign In</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-500 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleCredentialsSubmit}>
              <div className="mb-4">
                <label className="block text-white/60 text-sm mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:border-[#FFA317] focus:outline-none"
                  placeholder="admin@vornac.com"
                  required
                  autoFocus
                  disabled={loading}
                />
              </div>

              <div className="mb-6">
                <label className="block text-white/60 text-sm mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:border-[#FFA317] focus:outline-none"
                  placeholder="••••••••••"
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-[#FFA317] text-black font-bold rounded hover:bg-white transition-colors disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Continue'}
              </button>
            </form>
          </div>
        )}

        {/* Step: MFA Enrollment */}
        {step === 'enrollment' && enrollmentData && (
          <MFAEnrollment
            qrCode={enrollmentData.qr_code}
            backupCodes={enrollmentData.backup_codes}
            secret={enrollmentData.secret}
            onComplete={handleEnrollmentComplete}
            onError={setError}
          />
        )}

        {/* Step 2: TOTP Verification */}
        {step === 'totp' && (
          <div className="bg-[#0a0b14] border border-white/10 rounded-xl p-8">
            <h2 className="text-xl font-bold mb-4 text-center">Enter TOTP Code</h2>
            <p className="text-white/60 text-sm text-center mb-6">
              Enter the 6-digit code from your authenticator app
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-500 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleTOTPSubmit}>
              <div className="mb-6">
                <input
                  type="text"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyPress={handleTOTPKeyPress}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-center text-2xl font-mono tracking-widest text-white placeholder:text-white/40 focus:border-[#FFA317] focus:outline-none"
                  autoFocus
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={totpCode.length !== 6 || loading}
                className="w-full px-6 py-3 bg-[#FFA317] text-black font-bold rounded hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Sign In'}
              </button>
            </form>

            <button
              onClick={() => {
                setStep('credentials');
                setTotpCode('');
                setSessionToken(null);
                setError('');
              }}
              className="w-full mt-4 text-white/40 text-sm hover:text-white/60 transition-colors"
            >
              ← Back to login
            </button>
          </div>
        )}

        {error && step === 'enrollment' && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-500 text-sm text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLogin;
