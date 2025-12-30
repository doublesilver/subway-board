import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 5000,
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
  getAll: () => api.get('/api/subway-lines'),
};

export const postAPI = {
  getByLine: (lineId, page = 1, limit = 20) =>
    api.get(`/api/posts/line/${lineId}`, { params: { page, limit } }),
  getById: (postId) => api.get(`/api/posts/${postId}`),
  create: (data) => api.post('/api/posts', data),
  delete: (postId) => api.delete(`/api/posts/${postId}`),
};

export const commentAPI = {
  getByPost: (postId) => api.get(`/api/posts/${postId}/comments`),
  create: (postId, data) => api.post(`/api/posts/${postId}/comments`, data),
  delete: (commentId) => api.delete(`/api/comments/${commentId}`),
};

export default api;
