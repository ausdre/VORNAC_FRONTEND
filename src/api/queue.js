import client from './client';

export const getQueueItems = async () => {
  const response = await client.get('/queue/');
  return response.data;
};

export const createQueueItem = async (queueData) => {
  const response = await client.post('/queue/', queueData);
  return response.data;
};

export const updateQueueItem = async (queueId, queueData) => {
  const response = await client.patch(`/queue/${queueId}`, queueData);
  return response.data;
};

export const deleteQueueItem = async (queueId) => {
  const response = await client.delete(`/queue/${queueId}`);
  return response.data;
};
