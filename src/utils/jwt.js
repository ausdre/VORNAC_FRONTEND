import { jwtDecode } from 'jwt-decode';

export const decodeToken = (token) => {
  try {
    return jwtDecode(token);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

export const extractUserFromToken = (token) => {
  const decoded = decodeToken(token);
  if (!decoded) return null;

  return {
    id: decoded.sub,
    email: decoded.email,
    firstName: decoded.first_name,
    lastName: decoded.last_name,
    role: decoded.role,
    tenantId: decoded.tenant_id,
    tenantName: decoded.tenant_name,
    permissions: decoded.permissions || []
  };
};

export const isTokenExpired = (token) => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  return Date.now() >= decoded.exp * 1000;
};
