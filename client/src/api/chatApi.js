import axiosInstance from './axiosInstance';

export const sendRequest    = (userId)   => axiosInstance.post(`/chat/request/${userId}`);
export const getRequests    = ()         => axiosInstance.get('/chat/requests');
export const acceptRequest  = (id)       => axiosInstance.put(`/chat/requests/${id}/accept`);
export const rejectRequest  = (id)       => axiosInstance.put(`/chat/requests/${id}/reject`);
export const getRooms       = ()         => axiosInstance.get('/chat/rooms');
export const getMessages    = (id, cursor) => axiosInstance.get(`/chat/rooms/${id}/messages${cursor ? `?cursor=${cursor}` : ''}`);
export const readMessages   = (id)       => axiosInstance.put(`/chat/rooms/${id}/read`);