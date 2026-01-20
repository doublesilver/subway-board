/**
 * API 응답 헬퍼 유틸리티
 * 일관된 응답 형식을 위한 표준화된 응답 함수들
 */

/**
 * 성공 응답
 * @param {Response} res - Express response 객체
 * @param {*} data - 응답 데이터
 * @param {number} statusCode - HTTP 상태 코드 (기본: 200)
 */
const success = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
  });
};

/**
 * 생성 성공 응답 (201)
 * @param {Response} res - Express response 객체
 * @param {*} data - 생성된 리소스 데이터
 */
const created = (res, data) => {
  return success(res, data, 201);
};

/**
 * 페이지네이션 응답
 * @param {Response} res - Express response 객체
 * @param {Array} items - 아이템 배열
 * @param {Object} pagination - 페이지네이션 정보
 * @param {number} pagination.page - 현재 페이지
 * @param {number} pagination.limit - 페이지당 아이템 수
 * @param {number} pagination.total - 전체 아이템 수
 */
const paginated = (res, items, { page, limit, total }) => {
  const totalPages = Math.ceil(total / limit);

  return res.status(200).json({
    success: true,
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  });
};

/**
 * 에러 응답
 * @param {Response} res - Express response 객체
 * @param {string} message - 에러 메시지
 * @param {number} statusCode - HTTP 상태 코드 (기본: 400)
 * @param {string} code - 에러 코드 (선택적)
 */
const error = (res, message, statusCode = 400, code = null) => {
  const response = {
    success: false,
    error: {
      message,
      statusCode,
    },
  };

  if (code) {
    response.error.code = code;
  }

  return res.status(statusCode).json(response);
};

/**
 * 404 Not Found 응답
 * @param {Response} res - Express response 객체
 * @param {string} resource - 찾을 수 없는 리소스 이름
 */
const notFound = (res, resource = 'Resource') => {
  return error(res, `${resource}을(를) 찾을 수 없습니다.`, 404, 'NOT_FOUND');
};

/**
 * 401 Unauthorized 응답
 * @param {Response} res - Express response 객체
 * @param {string} message - 에러 메시지
 */
const unauthorized = (res, message = '인증이 필요합니다.') => {
  return error(res, message, 401, 'UNAUTHORIZED');
};

/**
 * 403 Forbidden 응답
 * @param {Response} res - Express response 객체
 * @param {string} message - 에러 메시지
 */
const forbidden = (res, message = '접근 권한이 없습니다.') => {
  return error(res, message, 403, 'FORBIDDEN');
};

/**
 * 422 Validation Error 응답
 * @param {Response} res - Express response 객체
 * @param {string} message - 검증 에러 메시지
 * @param {Object} details - 상세 검증 에러 (선택적)
 */
const validationError = (res, message, details = null) => {
  const response = {
    success: false,
    error: {
      message,
      statusCode: 422,
      code: 'VALIDATION_ERROR',
    },
  };

  if (details) {
    response.error.details = details;
  }

  return res.status(422).json(response);
};

/**
 * 500 Internal Server Error 응답
 * @param {Response} res - Express response 객체
 * @param {string} message - 에러 메시지
 */
const serverError = (res, message = '서버 오류가 발생했습니다.') => {
  return error(res, message, 500, 'INTERNAL_ERROR');
};

module.exports = {
  success,
  created,
  paginated,
  error,
  notFound,
  unauthorized,
  forbidden,
  validationError,
  serverError,
};
