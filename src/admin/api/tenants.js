/**
 * Admin Tenants API
 * CRUD operations for tenant management
 */
import adminClient from './client';

/**
 * List all tenants with pagination and search
 */
export const listTenants = async (page = 1, pageSize = 50, search = '') => {
  const params = { page, page_size: pageSize };
  if (search) params.search = search;

  const response = await adminClient.get('/tenants', { params });
  return response.data;
};

/**
 * Get single tenant by ID
 */
export const getTenant = async (tenantId) => {
  const response = await adminClient.get(`/tenants/${tenantId}`);
  return response.data;
};

/**
 * Create new tenant
 */
export const createTenant = async (tenantData) => {
  const response = await adminClient.post('/tenants', tenantData);
  return response.data;
};

/**
 * Update tenant
 */
export const updateTenant = async (tenantId, tenantData) => {
  const response = await adminClient.put(`/tenants/${tenantId}`, tenantData);
  return response.data;
};

/**
 * Regenerate tenant API key
 */
export const regenerateTenantAPIKey = async (tenantId) => {
  const response = await adminClient.post(`/tenants/${tenantId}/regenerate-api-key`);
  return response.data;
};

/**
 * Delete tenant
 */
export const deleteTenant = async (tenantId) => {
  await adminClient.delete(`/tenants/${tenantId}`);
};
