import React, { useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const Settings = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [modalState, setModalState] = useState(null); // { type: 'success'|'error', message }
  const [loading, setLoading] = useState(false);

  // Get user info from Zustand store
  const { user } = useAuthStore();
  const userEmail = user?.email || 'Unknown';

  const handleChangePassword = async (e) => {
    e.preventDefault();

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setModalState({
        type: 'error',
        title: 'Missing Information',
        message: 'Please fill in all password fields'
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setModalState({
        type: 'error',
        title: 'Passwords Do Not Match',
        message: 'New password and confirmation password must match'
      });
      return;
    }

    if (newPassword.length < 8) {
      setModalState({
        type: 'error',
        title: 'Password Too Short',
        message: 'Password must be at least 8 characters long'
      });
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      await axios.post(
        'http://localhost:8000/api/v1/auth/change-password',
        {
          current_password: currentPassword,
          new_password: newPassword
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setModalState({
        type: 'success',
        title: 'Password Changed',
        message: 'Your password has been successfully updated'
      });
    } catch (error) {
      console.error('Failed to change password:', error);

      let errorMessage = 'Failed to change password. Please try again.';

      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.status === 401) {
        errorMessage = 'Current password is incorrect';
      }

      setModalState({
        type: 'error',
        title: 'Password Change Failed',
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#02030a] p-8 pt-12">
      {/* Success/Error Modal */}
      {modalState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setModalState(null)}>
          <div className="bg-[#0a0b14] border border-white/20 rounded-xl p-8 max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${modalState.type === 'error' ? 'bg-red-500/10' : 'bg-[#FFA317]/10'} flex items-center justify-center`}>
                {modalState.type === 'error' ? (
                  <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-[#FFA317]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">{modalState.title}</h2>
              <p className="text-white/60">{modalState.message}</p>
            </div>
            <button
              onClick={() => setModalState(null)}
              className={`w-full ${modalState.type === 'error' ? 'bg-red-500 hover:bg-red-600' : 'bg-gradient-to-r from-[#FFA317] to-[#FF8C00] hover:from-[#FF8C00] hover:to-[#FFA317]'} text-white font-bold py-3 px-4 rounded-lg shadow-[0_0_20px_rgba(255,163,23,0.3)] hover:shadow-[0_0_30px_rgba(255,163,23,0.5)] transition-all duration-200`}
            >
              OK
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 tracking-wide" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          SETTINGS
        </h1>

        <div className="space-y-6">
          {/* User Information Section */}
          <div className="bg-[#0a0b14] border border-white/10 rounded-xl p-8 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <svg className="w-6 h-6 text-[#FFA317]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              User Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-white/40 text-xs uppercase tracking-wider mb-2">Email</label>
                <div className="bg-[#02030a] border border-white/10 rounded-lg py-3 px-4 text-white font-mono">
                  {userEmail}
                </div>
              </div>

              <div>
                <label className="block text-white/40 text-xs uppercase tracking-wider mb-2">Role</label>
                <div className="bg-[#02030a] border border-white/10 rounded-lg py-3 px-4 text-white">
                  {user?.role || 'Unknown'}
                </div>
              </div>

              <div>
                <label className="block text-white/40 text-xs uppercase tracking-wider mb-2">Organization</label>
                <div className="bg-[#02030a] border border-white/10 rounded-lg py-3 px-4 text-white">
                  {user?.tenantName || 'Unknown'}
                </div>
              </div>
            </div>
          </div>

          {/* Change Password Section */}
          <div className="bg-[#0a0b14] border border-white/10 rounded-xl p-8 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <svg className="w-6 h-6 text-[#FFA317]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Change Password
            </h2>

            <form onSubmit={handleChangePassword} className="space-y-6">
              <div>
                <label htmlFor="currentPassword" className="block text-white/70 text-sm font-medium mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-[#02030a] border border-white/10 rounded-lg py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:border-[#FFA317] focus:ring-1 focus:ring-[#FFA317] transition-colors"
                  placeholder="Enter your current password"
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-white/70 text-sm font-medium mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#02030a] border border-white/10 rounded-lg py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:border-[#FFA317] focus:ring-1 focus:ring-[#FFA317] transition-colors"
                  placeholder="Enter new password (min. 8 characters)"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-white/70 text-sm font-medium mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#02030a] border border-white/10 rounded-lg py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:border-[#FFA317] focus:ring-1 focus:ring-[#FFA317] transition-colors"
                  placeholder="Confirm your new password"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`bg-gradient-to-r from-[#FFA317] to-[#FF8C00] hover:from-[#FF8C00] hover:to-[#FFA317] text-white font-bold py-3 px-6 rounded-lg shadow-[0_0_20px_rgba(255,163,23,0.3)] hover:shadow-[0_0_30px_rgba(255,163,23,0.5)] transition-all duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Updating Password...' : 'Update Password'}
                </button>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-blue-400 text-sm font-medium mb-1">Password Requirements</p>
                    <ul className="text-blue-400/70 text-xs space-y-1">
                      <li>• Minimum 8 characters</li>
                      <li>• Use a mix of letters, numbers, and symbols for better security</li>
                      <li>• Don't reuse passwords from other accounts</li>
                    </ul>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* System Information Section */}
          <div className="bg-[#0a0b14] border border-white/10 rounded-xl p-8 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <svg className="w-6 h-6 text-[#FFA317]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              System Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white/40 text-xs uppercase tracking-wider mb-2">Version</label>
                <div className="text-white font-mono">v1.0.0</div>
              </div>

              <div>
                <label className="block text-white/40 text-xs uppercase tracking-wider mb-2">Environment</label>
                <div className="text-white font-mono">Development</div>
              </div>

              <div>
                <label className="block text-white/40 text-xs uppercase tracking-wider mb-2">API Status</label>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-white">Connected</span>
                </div>
              </div>

              <div>
                <label className="block text-white/40 text-xs uppercase tracking-wider mb-2">Last Updated</label>
                <div className="text-white">{new Date().toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
