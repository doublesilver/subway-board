const AppError = require('../utils/AppError');
const { ErrorCodes } = require('../utils/errorCodes');
const logger = require('../utils/logger');

const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // 에러 응답 기본 구조
    const errorResponse = {
        status: err.status,
        error: {
            message: err.message,
            code: err.errorCode || ErrorCodes.SERVER_ERROR,
        }
    };

    // 상세 정보가 있으면 추가
    if (err.details) {
        errorResponse.error.details = err.details;
    }

    if (process.env.NODE_ENV === 'development') {
        // 개발 환경: 스택 트레이스 포함
        errorResponse.error.stack = err.stack;
        errorResponse.error.fullError = err;

        res.status(err.statusCode).json(errorResponse);
    } else {
        // 프로덕션: trusted error vs unknown error
        if (err.isOperational) {
            // 운영 가능한 에러는 info 레벨로 로깅
            logger.info('Operational error', {
                code: err.errorCode,
                message: err.message,
                statusCode: err.statusCode
            });
            res.status(err.statusCode).json(errorResponse);
        } else {
            // 예상치 못한 에러는 error 레벨로 로깅
            logger.error('Unexpected error', {
                error: err.message,
                stack: err.stack,
                statusCode: err.statusCode
            });
            res.status(500).json({
                status: 'error',
                error: {
                    message: '서버 오류가 발생했습니다.',
                    code: ErrorCodes.SERVER_ERROR,
                }
            });
        }
    }
};

module.exports = globalErrorHandler;
