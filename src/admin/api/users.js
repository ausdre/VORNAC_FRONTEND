/**
 * Admin Users API
 * CRUD operations for user management with MFA controls
 */
import adminClient from './client';

/**
 * List all users with pagination and filters
 */
export const listUsers = async (params = {}) => {
  const {
    page = 1,
    pageSize = 50,
    tenantId,
    role,
    search,
    mfaEnabled,
    isActive
  } = params;

  const queryParams = { page, page_size: pageSize };
  if (tenantId) queryParams.tenant_id = tenantId;
  if (role) queryParams.role = role;
  if (search) queryParams.search = search;
  if (mfaEnabled !== undefined) queryParams.mfa_enabled = mfaEnabled;
  if (isActive !== undefined) queryParams.is_active = isActive;

  const response = await adminClient.get('/users', { params: queryParams });
  return response.data;
};

/**
 * Get single user by ID
 */
export const getUser = async (userId) => {
  const response = await adminClient.get(`/users/${userId}`);
  return response.data;
};

/**
 * Create new user
 */
export const createUser = async (userData) => {
  const response = await adminClient.post('/users', userData);
  return response.data;
};

/**
 * Update user
 */
export const updateUser = async (userId, userData) => {
  const response = await adminClient.put(`/users/${userId}`, userData);
  return response.data;
};

/**
 * Reset user password
 */
export const resetUserPassword = async (userId) => {
  const response = await adminClient.post(`/users/${userId}/reset-password`);
  return response.data;
};

/**
 * Reset user MFA
 */
export const resetUserMFA = async (userId) => {
  const response = await adminClient.post(`/users/${userId}/reset-mfa`);
  return response.data;
};

/**
 * Delete user
 */
export const deleteUser = async (userId) => {
  const response = await adminClient.delete(`/users/${userId}`);
  return response.data;
};
