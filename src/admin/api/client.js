/**
 * Admin API Client
 * Axios instance configured for admin API endpoints
 * Separate from regular user API client
 */
import axios from 'axios';
import { useAdminAuthStore } from '../stores/adminAuthStore';

// Use relative path to leverage Vite proxy (dev) and Vercel rewrites (prod)
const adminClient = axios.create({
  baseURL: '/api/v1/admin',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: Add auth token
adminClient.interceptors.request.use(
  (config) => {
    const token = useAdminAuthStore.getState().accessToken;
    console.log('[Admin API] Request to:', config.url);
    console.log('[Admin API] Token:', token ? token.substring(0, 50) + '...' : 'MISSING');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[Admin API] Authorization header set');
    } else {
      alert('[DEBUG] API request without token! URL: ' + config.url);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle auth errors
adminClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Unauthorized or forbidden - logout
      const url = error.config?.url || 'unknown';
      alert(`[DEBUG] ${error.response?.status} error on ${url} - Logging out!`);
      console.error('[Admin API] Auth error:', error.response?.status, 'URL:', url);
      useAdminAuthStore.getState().logout();
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export default adminClient;
