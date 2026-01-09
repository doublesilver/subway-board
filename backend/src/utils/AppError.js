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
        const message = customMessage || ErrorMessages[errorCode] || ErrorMessages[ErrorCodes.SERVER_ERROR];
        return new AppError(message, statusCode, errorCode, details);
    }
}

module.exports = AppError;
