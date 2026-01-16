/**
 * 표준화된 에러 코드 정의
 * 클라이언트에서 에러 처리 및 국제화(i18n)를 위한 코드 체계
 *
 * 형식: CATEGORY_SPECIFIC_ERROR
 */

const ErrorCodes = {
  // 인증 관련 (AUTH_*)
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_INVALID_TOKEN: 'AUTH_INVALID_TOKEN',
  AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
  AUTH_FORBIDDEN: 'AUTH_FORBIDDEN',

  // 권한 관련 (PERMISSION_*)
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  PERMISSION_NOT_OWNER: 'PERMISSION_NOT_OWNER',

  // 검증 관련 (VALIDATION_*)
  VALIDATION_EMPTY_CONTENT: 'VALIDATION_EMPTY_CONTENT',
  VALIDATION_CONTENT_TOO_LONG: 'VALIDATION_CONTENT_TOO_LONG',
  VALIDATION_INVALID_LINE: 'VALIDATION_INVALID_LINE',
  VALIDATION_INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',
  VALIDATION_PROFANITY_DETECTED: 'VALIDATION_PROFANITY_DETECTED',

  // 리소스 관련 (RESOURCE_*)
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_POST_NOT_FOUND: 'RESOURCE_POST_NOT_FOUND',
  RESOURCE_COMMENT_NOT_FOUND: 'RESOURCE_COMMENT_NOT_FOUND',
  RESOURCE_LINE_NOT_FOUND: 'RESOURCE_LINE_NOT_FOUND',

  // Rate Limiting (RATE_LIMIT_*)
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  RATE_LIMIT_TOO_MANY_REQUESTS: 'RATE_LIMIT_TOO_MANY_REQUESTS',

  // WebSocket 관련 (WS_*)
  WS_INVALID_REQUEST: 'WS_INVALID_REQUEST',
  WS_MAX_ROOMS_EXCEEDED: 'WS_MAX_ROOMS_EXCEEDED',
  WS_INVALID_LINE: 'WS_INVALID_LINE',
  WS_JOIN_FAILED: 'WS_JOIN_FAILED',

  // 서버 에러 (SERVER_*)
  SERVER_ERROR: 'SERVER_ERROR',
  SERVER_DATABASE_ERROR: 'SERVER_DATABASE_ERROR',
  SERVER_UNAVAILABLE: 'SERVER_UNAVAILABLE',

  // 운영 관련 (SERVICE_*)
  SERVICE_CLOSED: 'SERVICE_CLOSED',
};

/**
 * 에러 코드별 기본 메시지 (한국어)
 */
const ErrorMessages = {
  // 인증
  [ErrorCodes.AUTH_REQUIRED]: '로그인이 필요합니다.',
  [ErrorCodes.AUTH_INVALID_TOKEN]: '유효하지 않은 인증 정보입니다.',
  [ErrorCodes.AUTH_SESSION_EXPIRED]: '세션이 만료되었습니다. 다시 로그인해주세요.',
  [ErrorCodes.AUTH_FORBIDDEN]: '접근 권한이 없습니다.',

  // 권한
  [ErrorCodes.PERMISSION_DENIED]: '권한이 없습니다.',
  [ErrorCodes.PERMISSION_NOT_OWNER]: '본인이 작성한 글만 삭제할 수 있습니다.',

  // 검증
  [ErrorCodes.VALIDATION_EMPTY_CONTENT]: '내용을 입력해주세요.',
  [ErrorCodes.VALIDATION_CONTENT_TOO_LONG]: '내용이 너무 깁니다.',
  [ErrorCodes.VALIDATION_INVALID_LINE]: '유효하지 않은 호선입니다.',
  [ErrorCodes.VALIDATION_INVALID_FORMAT]: '유효하지 않은 형식입니다.',
  [ErrorCodes.VALIDATION_PROFANITY_DETECTED]: '부적절한 언어가 포함되어 있습니다.',

  // 리소스
  [ErrorCodes.RESOURCE_NOT_FOUND]: '요청한 리소스를 찾을 수 없습니다.',
  [ErrorCodes.RESOURCE_POST_NOT_FOUND]: '게시글을 찾을 수 없습니다.',
  [ErrorCodes.RESOURCE_COMMENT_NOT_FOUND]: '댓글을 찾을 수 없습니다.',
  [ErrorCodes.RESOURCE_LINE_NOT_FOUND]: '호선 정보를 찾을 수 없습니다.',

  // Rate Limiting
  [ErrorCodes.RATE_LIMIT_EXCEEDED]: '너무 많은 요청이 발생했습니다.',
  [ErrorCodes.RATE_LIMIT_TOO_MANY_REQUESTS]: '잠시 후 다시 시도해주세요.',

  // WebSocket
  [ErrorCodes.WS_INVALID_REQUEST]: '잘못된 요청입니다.',
  [ErrorCodes.WS_MAX_ROOMS_EXCEEDED]: '동시에 참여할 수 있는 채팅방 수를 초과했습니다.',
  [ErrorCodes.WS_INVALID_LINE]: '유효하지 않은 호선입니다.',
  [ErrorCodes.WS_JOIN_FAILED]: '채팅방 입장에 실패했습니다.',

  // 서버
  [ErrorCodes.SERVER_ERROR]: '서버 오류가 발생했습니다.',
  [ErrorCodes.SERVER_DATABASE_ERROR]: '데이터베이스 오류가 발생했습니다.',
  [ErrorCodes.SERVER_DATABASE_ERROR]: '데이터베이스 오류가 발생했습니다.',
  [ErrorCodes.SERVER_UNAVAILABLE]: '서버를 사용할 수 없습니다.',
  [ErrorCodes.SERVICE_CLOSED]: '현재 운영 시간이 아닙니다. (평일 07:00 ~ 09:00)',
};

/**
 * 에러 응답 생성 헬퍼
 * @param {string} code - ErrorCodes 중 하나
 * @param {string} customMessage - 커스텀 메시지 (선택사항)
 * @param {object} details - 추가 상세 정보 (선택사항)
 */
function createErrorResponse(code, customMessage = null, details = null) {
  const response = {
    error: {
      code,
      message: customMessage || ErrorMessages[code] || ErrorMessages[ErrorCodes.SERVER_ERROR],
    }
  };

  if (details) {
    response.error.details = details;
  }

  return response;
}

module.exports = {
  ErrorCodes,
  ErrorMessages,
  createErrorResponse,
};
