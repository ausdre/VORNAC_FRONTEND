import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { extractUserFromToken, isTokenExpired } from '../utils/jwt';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      isLoading: false,
      accessToken: null,
      user: null,

      login: (token) => {
        if (isTokenExpired(token)) {
          console.error('Token is expired');
          return false;
        }

        const user = extractUserFromToken(token);
        if (!user) {
          console.error('Failed to extract user from token');
          return false;
        }

        set({
          isAuthenticated: true,
          accessToken: token,
          user
        });

        return true;
      },

      logout: () => {
        set({
          isAuthenticated: false,
          accessToken: null,
          user: null
        });
        localStorage.removeItem('access_token'); // Legacy cleanup
      },

      hasPermission: (permission) => {
        const { user } = get();
        return user?.permissions?.includes(permission) || false;
      },

      hasRole: (role) => {
        const { user } = get();
        return user?.role === role;
      },

      getTenantId: () => {
        const { user } = get();
        return user?.tenantId || null;
      }
    }),
    {
      name: 'vornac-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
