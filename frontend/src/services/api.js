import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    // 호선별 임시 사용자 정보 확인 (sessionStorage)
    // 1. URL에서 lineId 추출 시도
    let lineId = null;
    const urlMatch = config.url?.match(/\/line\/(\d+)/);
    if (urlMatch) {
      lineId = urlMatch[1];
    }

    // 2. POST body에서 subway_line_id 확인
    if (!lineId && config.data && config.data.subway_line_id) {
      lineId = config.data.subway_line_id;
    }

    if (lineId) {
      const sessionKey = `line_${lineId}_session`;
      const nicknameKey = `line_${lineId}_nickname`;

      const sessionId = sessionStorage.getItem(sessionKey);
      const nickname = sessionStorage.getItem(nicknameKey);

      if (sessionId) {
        config.headers['X-Anonymous-ID'] = sessionId;
      }
      if (nickname) {
        config.headers['X-Anonymous-Nickname'] = encodeURIComponent(nickname);
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

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
  createJoinMessage: (subway_line_id) => api.post('/api/posts/join', { subway_line_id }),
  createLeaveMessage: (subway_line_id) => api.post('/api/posts/leave', { subway_line_id }),
  delete: (postId) => api.delete(`/api/posts/${postId}`),
};

export const commentAPI = {
  getByPost: (postId) => api.get(`/api/posts/${postId}/comments`),
  create: (postId, data) => api.post(`/api/posts/${postId}/comments`, data),
  delete: (commentId) => api.delete(`/api/comments/${commentId}`),
};

export const feedbackAPI = {
  submit: (content) => api.post('/api/feedback', { content }),
  getAll: (limit, offset) => api.get('/api/admin/feedback', { params: { limit, offset } }),
};

export default api;
