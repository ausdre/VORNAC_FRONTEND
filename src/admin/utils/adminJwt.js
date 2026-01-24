/**
 * Admin JWT Utilities
 * Helper functions for decoding and validating admin JWT tokens
 */

/**
 * Decode JWT token payload (base64)
 * Returns null if token is invalid
 */
export const decodeToken = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token) => {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return true;

  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now;
};

/**
 * Extract user info from token
 */
export const extractUserFromToken = (token) => {
  const payload = decodeToken(token);
  if (!payload) return null;

  return {
    email: payload.email || payload.sub,
    role: payload.role,
    firstName: payload.first_name,
    lastName: payload.last_name,
    permissions: payload.permissions || []
  };
};

/**
 * Validate if token is for super admin
 */
export const isSuperAdminToken = (token) => {
  const payload = decodeToken(token);
  return payload && payload.role === 'super_admin';
};
