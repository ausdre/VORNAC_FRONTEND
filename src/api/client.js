import axios from 'axios';

const API_URL = (import.meta.env.DEV) ? '/api/v1' : 'https://c2.vornac.store/api/v1';

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

  // Construct the full URL for the login endpoint, bypassing the client baseURL
  const loginUrl = `${(import.meta.env.DEV) ? '' : 'https://c2.vornac.store'}/api/v1/auth/login`;

  // Use a completely separate, raw axios call to ensure no interference from the shared client.
  // This guarantees the Content-Type is set correctly for this specific request.
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

export const getTargets = async () => {
  const response = await client.get('/targets/');
  return response.data;
};

export const getTarget = async (targetId) => {
  const response = await client.get(`/targets/${targetId}`);
  return response.data;
};

export const getTargetPentests = async (targetId) => {
  const response = await client.get(`/targets/${targetId}/pentests`);
  return response.data;
};

export const createTarget = async (targetData) => {
  const response = await client.post('/targets/', targetData);
  return response.data;
};

export const checkSystemStatus = async () => {
    if (import.meta.env.DEV) {
        return getJobs();
    } else {
        return axios.get('https://c2.vornac.store/');
    }
};

export default client;