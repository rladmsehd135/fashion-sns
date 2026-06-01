import axiosInstance from './axiosInstance';

export const getCategories = () => axiosInstance.get('/posts/categories');
export const getFeed = (page = 1) => axiosInstance.get(`/posts/feed?page=${page}`);
export const getExplore = (style, page) => axiosInstance.get(`/posts/explore?style=${style || ''}&page=${page}`);
export const getRecommended = (page = 1) => axiosInstance.get(`/posts/recommended?page=${page}`);
export const getPost = (id) => axiosInstance.get(`/posts/${id}`);
export const getUserPosts = (id) => axiosInstance.get(`/posts/user/${id}`);
export const createPost = (data) => axiosInstance.post('/posts', data);
export const updatePost = (id, data) => axiosInstance.put(`/posts/${id}`, data);
export const deletePost = (id) => axiosInstance.delete(`/posts/${id}`);
export const toggleLike = (id) => axiosInstance.post(`/posts/${id}/like`);
export const toggleBookmark = (id) => axiosInstance.post(`/bookmarks/${id}`);
export const getMyBookmarks = () => axiosInstance.get('/bookmarks');
export const getComments = (id) => axiosInstance.get(`/posts/${id}/comments`);
export const createComment = (id, data) => axiosInstance.post(`/posts/${id}/comments`, data);
export const deleteComment = (id) => axiosInstance.delete(`/comments/${id}`);
export const getStories = () => axiosInstance.get('/stories');
export const getUserStories = (userId) => axiosInstance.get(`/stories/${userId}`);
export const uploadStory = (formData) => axiosInstance.post('/stories', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
});
