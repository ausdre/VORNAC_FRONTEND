/**
 * Admin Authentication Store
 * Separate auth state management for super admin portal
 * Uses zustand with persistence
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { extractUserFromToken, isTokenExpired } from '../utils/adminJwt';

export const useAdminAuthStore = create(
  persist(
    (set, get) => ({
      // Auth state
      isAuthenticated: false,
      accessToken: null,
      sessionToken: null,
      user: null,
      requiresMFAEnrollment: false,

      // Step 1: Credentials login
      loginStep1: (sessionToken, requiresMFAEnrollment) => {
        set({
          sessionToken,
          requiresMFAEnrollment,
          isAuthenticated: false,
          accessToken: null,
          user: null
        });
      },

      // Step 2: TOTP verification (complete authentication)
      loginStep2: (accessToken) => {
        // Validate token
        if (isTokenExpired(accessToken)) {
          console.error('[Admin Auth] Token is expired');
          return false;
        }

        const user = extractUserFromToken(accessToken);
        if (!user) {
          console.error('[Admin Auth] Failed to extract user from token');
          return false;
        }

        if (user.role !== 'super_admin') {
          console.error('[Admin Auth] Invalid role:', user.role, '(expected: super_admin)');
          return false;
        }

        set({
          isAuthenticated: true,
          accessToken,
          sessionToken: null,
          requiresMFAEnrollment: false,
          user
        });

        return true;
      },

      // Logout
      logout: () => {
        set({
          isAuthenticated: false,
          accessToken: null,
          sessionToken: null,
          user: null,
          requiresMFAEnrollment: false
        });
        localStorage.removeItem('vornac-admin-auth');
      },

      // Check if token is still valid
      checkAuth: () => {
        const { accessToken } = get();
        if (!accessToken) {
          get().logout();
          return false;
        }

        if (isTokenExpired(accessToken)) {
          get().logout();
          return false;
        }

        return true;
      },

      // Get auth header for API requests
      getAuthHeader: () => {
        const { accessToken } = get();
        if (!accessToken) return {};
        return { Authorization: `Bearer ${accessToken}` };
      }
    }),
    {
      name: 'vornac-admin-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
