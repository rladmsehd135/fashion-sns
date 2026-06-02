import axiosInstance from './axiosInstance';

export const getProfile        = (username) => axiosInstance.get(`/users/${username}`);
export const getMe             = ()         => axiosInstance.get('/users/me');
export const updateProfile = (data) =>
  axiosInstance.put('/users/me/update', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const toggleFollow      = (userId)   => axiosInstance.post(`/follow/${userId}`);
export const getFollowers = (id) => axiosInstance.get(`/users/${id}/followers`);
export const getFollowing = (id) => axiosInstance.get(`/users/${id}/following`);
export const searchUsers       = (q)        => axiosInstance.get(`/users/search?q=${q}`);
export const getRecommendedUsers = ()       => axiosInstance.get('/users/recommended');
export const getStyleReport    = ()         => axiosInstance.get('/users/me/style-report');
export const blockUser         = (id)       => axiosInstance.post(`/users/${id}/block`);
export const reportUser        = (id, reason) => axiosInstance.post(`/users/${id}/report`, { reason });