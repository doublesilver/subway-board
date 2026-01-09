// Rate Limiting 설정
const RATE_LIMIT = {
  WRITE: {
    WINDOW_MS: parseInt(process.env.RATE_LIMIT_WRITE_WINDOW_MS) || 15 * 60 * 1000, // 15분
    MAX: parseInt(process.env.RATE_LIMIT_WRITE_MAX) || 50,
  },
  READ: {
    WINDOW_MS: parseInt(process.env.RATE_LIMIT_READ_WINDOW_MS) || 60 * 1000, // 1분
    MAX: parseInt(process.env.RATE_LIMIT_READ_MAX) || 100,
  },
};

// 데이터베이스 설정
const DATABASE = {
  POOL_MAX: parseInt(process.env.DB_POOL_MAX) || 20,
};

// 페이지네이션 설정
const PAGINATION = {
  DEFAULT_LIMIT: parseInt(process.env.DEFAULT_PAGE_LIMIT) || 20,
};

// WebSocket 설정
const WEBSOCKET = {
  MAX_ROOMS_PER_CLIENT: parseInt(process.env.WS_MAX_ROOMS_PER_CLIENT) || 3,
};

// 콘텐츠 제한
const CONTENT = {
  POST_MAX_LENGTH: parseInt(process.env.POST_MAX_LENGTH) || 1000,
  COMMENT_MAX_LENGTH: parseInt(process.env.COMMENT_MAX_LENGTH) || 500,
};

// 호선 제한
const SUBWAY_LINE = {
  MIN_ID: parseInt(process.env.MIN_LINE_ID) || 1,
  MAX_ID: parseInt(process.env.MAX_LINE_ID) || 9,
};

// 보안 설정
const SECURITY = {
  HSTS_MAX_AGE: 31536000, // 1년 (보안상 하드코딩 권장)
};

// 운영 시간 설정 (07:00 ~ 09:00)
const OPERATING_HOURS = {
  START: 7,
  END: 9,
};

module.exports = {
  RATE_LIMIT,
  DATABASE,
  PAGINATION,
  WEBSOCKET,
  CONTENT,
  SUBWAY_LINE,
  SECURITY,
  OPERATING_HOURS,
};
