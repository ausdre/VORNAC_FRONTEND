import axios from 'axios';

const API_URL = (import.meta.env.DEV) ? '/api/v1' : 'https://c2.vornac.store/api/v1';

// Do not set default Content-Type here, let Axios handle it based on the data type
const client = axios.create({
  baseURL: API_URL,
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
  const params = new URLSearchParams();
  params.append('username', username);
  params.append('password', password);
  
  // Axios automatically sets Content-Type to application/x-www-form-urlencoded for URLSearchParams
  const response = await client.post('/auth/login', params);
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
    if (import.meta.env.DEV) {
        return getJobs();
    } else {
        return axios.get('https://c2.vornac.store/');
    }
};

export default client;