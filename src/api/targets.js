import client from './client';

export const getTargets = async () => {
  const response = await client.get('/targets/');
  return response.data;
};

export const createTarget = async (targetData) => {
  const response = await client.post('/targets/', targetData);
  return response.data;
};

export const updateTarget = async (targetId, targetData) => {
  const response = await client.put(`/targets/${targetId}`, targetData);
  return response.data;
};

export const deleteTarget = async (targetId) => {
  const response = await client.delete(`/targets/${targetId}`);
  return response.data;
};
