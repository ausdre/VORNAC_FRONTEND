/**
 * Access Logs API Client
 * Provides functions to interact with the admin access logs API
 */
import adminClient from './client';

/**
 * List access logs with pagination and filters
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.page_size - Items per page (default: 100)
 * @param {number} params.tenant_id - Filter by tenant ID
 * @param {string} params.user_email - Filter by user email (partial match on anonymized)
 * @param {string} params.action - Filter by action type
 * @param {string} params.resource_type - Filter by resource type
 * @param {string} params.start_date - Start date (ISO format)
 * @param {string} params.end_date - End date (ISO format)
 * @returns {Promise<Object>} Paginated access logs response
 */
export const listAccessLogs = async (params = {}) => {
  const response = await adminClient.get('/access-logs', { params });
  return response.data;
};

/**
 * Get access log statistics
 * @param {number} days - Number of days to include (default: 30)
 * @param {number} tenantId - Filter by tenant ID
 * @returns {Promise<Object>} Statistics response
 */
export const getAccessLogStats = async (days = 30, tenantId = null) => {
  const params = { days };
  if (tenantId !== null) {
    params.tenant_id = tenantId;
  }
  const response = await adminClient.get('/access-logs/stats/summary', { params });
  return response.data;
};

/**
 * Export access logs to CSV
 * @param {Object} params - Query parameters
 * @param {number} params.tenant_id - Filter by tenant ID
 * @param {string} params.start_date - Start date (ISO format)
 * @param {string} params.end_date - End date (ISO format)
 * @param {number} params.limit - Max rows to export (default: 10000)
 * @returns {Promise<Blob>} CSV file blob
 */
export const exportAccessLogsCSV = async (params = {}) => {
  const response = await adminClient.get('/access-logs/export/csv', {
    params,
    responseType: 'blob'
  });
  return response.data;
};
