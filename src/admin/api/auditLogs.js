/**
 * Admin Audit Logs API
 * View and export audit logs
 */
import adminClient from './client';

/**
 * List audit logs with pagination and filters
 */
export const listAuditLogs = async (params = {}) => {
  const {
    page = 1,
    pageSize = 100,
    userEmail,
    action,
    resourceType,
    startDate,
    endDate
  } = params;

  const queryParams = { page, page_size: pageSize };
  if (userEmail) queryParams.user_email = userEmail;
  if (action) queryParams.action = action;
  if (resourceType) queryParams.resource_type = resourceType;
  if (startDate) queryParams.start_date = startDate;
  if (endDate) queryParams.end_date = endDate;

  const response = await adminClient.get('/audit-logs', { params: queryParams });
  return response.data;
};

/**
 * Get single audit log by ID
 */
export const getAuditLog = async (logId) => {
  const response = await adminClient.get(`/audit-logs/${logId}`);
  return response.data;
};

/**
 * Get audit log statistics
 */
export const getAuditLogStats = async (days = 30) => {
  const response = await adminClient.get('/audit-logs/stats/summary', {
    params: { days }
  });
  return response.data;
};

/**
 * Export audit logs to CSV
 * Returns blob for download
 */
export const exportAuditLogsCSV = async (params = {}) => {
  const {
    userEmail,
    action,
    resourceType,
    startDate,
    endDate,
    limit = 10000
  } = params;

  const queryParams = { limit };
  if (userEmail) queryParams.user_email = userEmail;
  if (action) queryParams.action = action;
  if (resourceType) queryParams.resource_type = resourceType;
  if (startDate) queryParams.start_date = startDate;
  if (endDate) queryParams.end_date = endDate;

  const response = await adminClient.get('/audit-logs/export/csv', {
    params: queryParams,
    responseType: 'blob'
  });

  return response.data;
};
