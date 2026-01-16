/**
 * Frontend Configuration Constants
 * 하드코딩된 값들을 한 곳에서 관리
 */

export const API = {
  TIMEOUT: 15000, // API 요청 타임아웃 (ms)
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
};

export const CONTENT = {
  MESSAGE_MAX_LENGTH: 1000, // 메시지 최대 길이
  TEXTAREA_MAX_HEIGHT: 120, // textarea 최대 높이 (px)
};

export const UI = {
  TOAST_DURATION: 2000, // 토스트 메시지 지속 시간 (ms)
  OPERATING_HOURS_CHECK_INTERVAL: 60000, // 운영시간 체크 주기 (ms)
};
