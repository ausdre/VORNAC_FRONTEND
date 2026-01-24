import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

// Get auth token from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

export const getTargets = async () => {
  const response = await axios.get(`${API_BASE_URL}/targets/`, getAuthHeaders());
  return response.data;
};

export const createTarget = async (targetData) => {
  const response = await axios.post(`${API_BASE_URL}/targets/`, targetData, getAuthHeaders());
  return response.data;
};

export const updateTarget = async (targetId, targetData) => {
  const response = await axios.put(`${API_BASE_URL}/targets/${targetId}`, targetData, getAuthHeaders());
  return response.data;
};

export const deleteTarget = async (targetId) => {
  const response = await axios.delete(`${API_BASE_URL}/targets/${targetId}`, getAuthHeaders());
  return response.data;
};
