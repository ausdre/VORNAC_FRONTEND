/**
 * Admin API Client
 * Axios instance configured for admin API endpoints
 * Separate from regular user API client
 */
import axios from 'axios';
import { useAdminAuthStore } from '../stores/adminAuthStore';

const adminClient = axios.create({
  baseURL: 'http://localhost:8000/api/v1/admin',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: Add auth token
adminClient.interceptors.request.use(
  (config) => {
    const token = useAdminAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
      useAdminAuthStore.getState().logout();
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export default adminClient;
