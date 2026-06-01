import axiosInstance from './axiosInstance';

export const sendRequest   = (userId)  => axiosInstance.post(`/chat/request/${userId}`);
export const getRequests   = ()        => axiosInstance.get('/chat/requests');
export const acceptRequest = (id)      => axiosInstance.put(`/chat/requests/${id}/accept`);
export const rejectRequest = (id)      => axiosInstance.put(`/chat/requests/${id}/reject`);
export const getRooms      = ()        => axiosInstance.get('/chat/rooms');
export const getMessages   = (id)      => axiosInstance.get(`/chat/rooms/${id}/messages`);
export const readMessages  = (id)      => axiosInstance.put(`/chat/rooms/${id}/read`);
export const uploadChatImage  = (formData) =>
  axiosInstance.post('/chat/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const createGroup     = (name, memberIds) =>
  axiosInstance.post('/chat/groups', { name, memberIds });
export const getGroupMembers = (id) =>
  axiosInstance.get(`/chat/groups/${id}/members`);