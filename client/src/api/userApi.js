import axiosInstance from './axiosInstance';

export const getProfile        = (username) => axiosInstance.get(`/users/${username}`);
export const getMe             = ()         => axiosInstance.get('/users/me');
export const updateProfile     = (data)     => axiosInstance.put('/users/me/update', data);
export const toggleFollow      = (userId)   => axiosInstance.post(`/follow/${userId}`);
export const getFollowers      = (id)       => axiosInstance.get(`/users/${id}/followers`);
export const getFollowing      = (id)       => axiosInstance.get(`/users/${id}/following`);
export const searchUsers       = (q)        => axiosInstance.get(`/users/search?q=${q}`);
export const getRecommendedUsers = ()       => axiosInstance.get('/users/recommended');