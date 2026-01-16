const { ErrorCodes, ErrorMessages } = require('./errorCodes');

class AppError extends Error {
    constructor(message, statusCode, errorCode = null, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        this.errorCode = errorCode;
        this.details = details;

        Error.captureStackTrace(this, this.constructor);
    }

    // 에러 코드로부터 AppError 생성하는 헬퍼 메서드
    static fromErrorCode(errorCode, statusCode = 400, customMessage = null, details = null) {
        if (!statusCode || statusCode === 400) {
            const statusMap = {
                [ErrorCodes.AUTH_SESSION_EXPIRED]: 401,
                [ErrorCodes.AUTH_FORBIDDEN]: 403,
                [ErrorCodes.PERMISSION_DENIED]: 403,
                [ErrorCodes.AUTH_REQUIRED]: 401
            };
            if (statusMap[errorCode]) statusCode = statusMap[errorCode];
        }

        const message = customMessage || ErrorMessages[errorCode] || ErrorMessages[ErrorCodes.SERVER_ERROR];
        return new AppError(message, statusCode, errorCode, details);
    }
}

module.exports = AppError;
