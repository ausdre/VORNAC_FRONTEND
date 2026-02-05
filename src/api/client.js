import axios from 'axios';

const API_URL = (import.meta.env.DEV) ? '/api/v1' : 'https://c2.vornac.store/api/v1';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT to every request if available
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = async (username, password) => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);
  // FastAPI OAuth2PasswordRequestForm expects form data
  const response = await client.post('/auth/login', formData);
  return response.data;
};

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

// Target endpoints
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
    // This endpoint is at the root, so we need to bypass the baseURL
    // We can use the axios instance but override the baseURL for this request
    // Or just use a relative path if we want to hit /api/v1/.. but the health check is usually at /
    
    // If the health check is at the root of the domain (not under /api/v1), we need to handle it carefully.
    // In dev: /api/v1 is proxied. / is not proxied to the API server usually, it serves the frontend.
    // However, we can add a specific proxy for /health or just assume the API is up if /api/v1 works.
    
    // Let's assume there is a health check at /api/v1/ or we just check /api/v1/inference/
    // If the user specifically wants to check the root of the API server:
    
    if (import.meta.env.DEV) {
        // In dev, we can't easily hit the root of the target via the same proxy unless we add another proxy rule.
        // For simplicity, let's just check the jobs endpoint as a "health check"
        return getJobs();
    } else {
        // In prod, we can hit the full URL
        return axios.get('https://c2.vornac.store/');
    }
};

export default client;