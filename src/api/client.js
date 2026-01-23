import axios from 'axios';

const API_URL = 'http://localhost:8000/api/v1';

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

export default client;