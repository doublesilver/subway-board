import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Axios 인스턴스 생성 (인증 헤더 자동 추가)
const authAPI = axios.create({
  baseURL: `${API_URL}/api`,
});

// 요청 인터셉터: Authorization 헤더 자동 추가
authAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('subway_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 카카오 로그인 URL 받기
export const getKakaoAuthURL = async () => {
  try {
    const response = await authAPI.get('/auth/kakao');
    return response.data.url;
  } catch (error) {
    console.error('Failed to get Kakao auth URL:', error);
    throw error;
  }
};

// 현재 로그인한 사용자 정보 조회
export const getCurrentUser = async () => {
  try {
    const response = await authAPI.get('/auth/me');
    return response.data.user;
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
};

// 로그아웃 (로컬 토큰만 삭제, 서버 요청 없음)
export const logout = () => {
  localStorage.removeItem('subway_token');
};
