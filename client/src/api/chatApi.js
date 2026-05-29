import axiosInstance from './axiosInstance';

export const sendRequest   = (userId)  => axiosInstance.post(`/chat/request/${userId}`);
export const getRequests   = ()        => axiosInstance.get('/chat/requests');
export const acceptRequest = (id)      => axiosInstance.put(`/chat/requests/${id}/accept`);
export const rejectRequest = (id)      => axiosInstance.put(`/chat/requests/${id}/reject`);
export const getRooms      = ()        => axiosInstance.get('/chat/rooms');
export const getMessages   = (id)      => axiosInstance.get(`/chat/rooms/${id}/messages`);
export const readMessages  = (id)      => axiosInstance.put(`/chat/rooms/${id}/read`);