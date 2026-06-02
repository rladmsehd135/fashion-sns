import axiosInstance from './axiosInstance';

export const getBrandRanking = (period = 'all') =>
  axiosInstance.get(`/ranking/brands?period=${period}`);

export const getItemRanking = (period = 'all', category = '') =>
  axiosInstance.get(`/ranking/items?period=${period}${category ? `&category=${category}` : ''}`);

export const getStyleRanking = (period = 'all') =>
  axiosInstance.get(`/ranking/styles?period=${period}`);
