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

export const getQueueItems = async () => {
  const response = await axios.get(`${API_BASE_URL}/queue/`, getAuthHeaders());
  return response.data;
};

export const createQueueItem = async (queueData) => {
  const response = await axios.post(`${API_BASE_URL}/queue/`, queueData, getAuthHeaders());
  return response.data;
};

export const updateQueueItem = async (queueId, queueData) => {
  const response = await axios.patch(`${API_BASE_URL}/queue/${queueId}`, queueData, getAuthHeaders());
  return response.data;
};

export const deleteQueueItem = async (queueId) => {
  const response = await axios.delete(`${API_BASE_URL}/queue/${queueId}`, getAuthHeaders());
  return response.data;
};
