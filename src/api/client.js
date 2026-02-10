import axios from 'axios';

// Always use relative path. 
// In Dev: Vite proxy handles /api -> http://localhost:8000/api
// In Prod (Vercel): vercel.json rewrites /api -> https://c2.vornac.store/api
const API_URL = '/api/v1';

// Shared client for JSON-based API calls
const client = axios.create({
  baseURL: API_URL,
});

// Add JWT to every request if available
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Ensure other requests are JSON
  if (!config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
});

export const login = async (username, password) => {
  const params = new URLSearchParams();
  params.append('username', username);
  params.append('password', password);

  // Use relative path for login as well
  const loginUrl = '/api/v1/auth/login';

  // Use a completely separate, raw axios call to ensure no interference from the shared client.
  const response = await axios.post(loginUrl, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  return response.data;
};

// All other functions will use the standard client
export const changePassword = async (currentPassword, newPassword) => {
  const response = await client.post('/auth/change-password', {
    current_password: currentPassword,
    new_password: newPassword
  });
  return response.data;
};

export const getJobs = async () => {
  const response = await client.get('/inference/');
  return response.data;
};

export const createJob = async (inputData) => {
  const response = await client.post('/inference/', { input_data: inputData });
  return response.data;
};

export const getJobStatus = async (jobId) => {
  const response = await client.get(`/inference/${jobId}`);
  return response.data;
};

export const deleteJob = async (jobId) => {
  const response = await client.delete(`/inference/${jobId}`);
  return response.data;
};

export const downloadPentestReport = async (jobId) => {
  const response = await client.get(`/inference/${jobId}/pdf`, {
    responseType: 'blob', // Important: tell axios to expect binary data
  });
  return response.data; // This will be a Blob
};

export const checkSystemStatus = async () => {
    // Just check the jobs endpoint as a health check
    return getJobs();
};

export default client;