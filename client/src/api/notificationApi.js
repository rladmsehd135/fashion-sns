import axiosInstance from './axiosInstance';

export const getNotifications = () => axiosInstance.get('/notifications');
export const readAll          = () => axiosInstance.put('/notifications/read');
export const readOne          = (id) => axiosInstance.put(`/notifications/${id}/read`);