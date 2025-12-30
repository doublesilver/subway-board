import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || '오류가 발생했습니다.';
    console.error('API Error:', message);
    return Promise.reject(error);
  }
);

export const subwayLineAPI = {
  getAll: () => api.get('/subway-lines'),
};

export const postAPI = {
  getByLine: (lineId, page = 1, limit = 20) =>
    api.get(`/posts/line/${lineId}`, { params: { page, limit } }),
  getById: (postId) => api.get(`/posts/${postId}`),
  create: (data) => api.post('/posts', data),
  delete: (postId) => api.delete(`/posts/${postId}`),
};

export const commentAPI = {
  getByPost: (postId) => api.get(`/posts/${postId}/comments`),
  create: (postId, data) => api.post(`/posts/${postId}/comments`, data),
  delete: (commentId) => api.delete(`/comments/${commentId}`),
};

export default api;
