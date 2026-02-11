/**
 * Admin Settings Page
 * Allows superadmins to change their password and view account information
 */
import React, { useState } from 'react';
import { changePassword } from '../api/auth';
import { useAdminAuthStore } from '../stores/adminAuthStore';
import { useToastStore } from '../../stores/toastStore';

const AdminSettingsPage = () => {
  const { accessToken, user } = useAdminAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [modalState, setModalState] = useState(null); // { type: 'success'|'error', message }
  const [loading, setLoading] = useState(false);

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
      await changePassword(currentPassword, newPassword, accessToken);

      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setModalState({
        type: 'success',
        title: 'Password Changed',
        message: 'Your password has been successfully updated'
      });
      useToastStore.getState().success('Password changed successfully');
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
      useToastStore.getState().error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#02030a] p-8">
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
              className={`w-full ${modalState.type === 'error' ? 'bg-red-500 hover:bg-red-600' : 'bg-[#FFA317] hover:bg-white'} text-${modalState.type === 'error' ? 'white' : 'black'} font-bold py-3 px-4 rounded-lg transition-colors`}
            >
              OK
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 tracking-wide">
          ADMIN SETTINGS
        </h1>

        <div className="space-y-6">
          {/* Account Information */}
          <div className="bg-[#0a0b14] border border-white/10 rounded-xl p-8 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <svg className="w-6 h-6 text-[#FFA317]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Account Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-white/40 text-xs uppercase tracking-wider mb-2">Email</label>
                <div className="bg-[#02030a] border border-white/10 rounded-lg py-3 px-4 text-white font-mono">
                  {user?.email || 'N/A'}
                </div>
              </div>

              <div>
                <label className="block text-white/40 text-xs uppercase tracking-wider mb-2">Role</label>
                <div className="bg-[#02030a] border border-white/10 rounded-lg py-3 px-4">
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-[#FFA317]/20 text-[#FFA317] rounded-lg text-sm font-bold">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Super Admin
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-white/40 text-xs uppercase tracking-wider mb-2">Name</label>
                <div className="bg-[#02030a] border border-white/10 rounded-lg py-3 px-4 text-white">
                  {user?.first_name && user?.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : 'N/A'}
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
                  className={`bg-[#FFA317] hover:bg-white text-black font-bold py-3 px-6 rounded-lg transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
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

          {/* Security Notice */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-6">
            <div className="flex gap-3">
              <svg className="w-6 h-6 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-amber-400 font-medium mb-2">Security Best Practices</p>
                <ul className="text-amber-400/80 text-sm space-y-1">
                  <li>• As a Super Admin, your account has full system access</li>
                  <li>• Use a strong, unique password and change it regularly</li>
                  <li>• Enable MFA (Multi-Factor Authentication) for additional security</li>
                  <li>• Never share your credentials with anyone</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
