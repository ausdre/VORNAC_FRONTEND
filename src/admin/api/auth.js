/**
 * Admin Authentication API
 * Two-step MFA authentication flow
 */
import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api/v1/admin/auth';

/**
 * Step 1: Login with credentials
 * Returns session token for MFA flow
 */
export const loginStep1 = async (email, password) => {
  const response = await axios.post(`${BASE_URL}/login-step1`, {
    email,
    password
  });
  return response.data;
};

/**
 * MFA Enrollment: Get QR code and backup codes
 */
export const enrollMFA = async (sessionToken) => {
  const response = await axios.get(`${BASE_URL}/mfa/enroll`, {
    params: { session_token: sessionToken }
  });
  return response.data;
};

/**
 * MFA Confirmation: Verify first TOTP code
 */
export const confirmMFA = async (sessionToken, totpCode) => {
  const response = await axios.post(`${BASE_URL}/mfa/confirm`,
    { totp_code: totpCode },
    { params: { session_token: sessionToken } }
  );
  return response.data;
};

/**
 * Step 2: Verify TOTP code and get access token
 */
export const loginStep2 = async (sessionToken, totpCode) => {
  const response = await axios.post(`${BASE_URL}/login-step2`, {
    session_token: sessionToken,
    totp_code: totpCode
  });
  return response.data;
};
