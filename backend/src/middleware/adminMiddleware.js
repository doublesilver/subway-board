const AppError = require('../utils/AppError');
const { ErrorCodes } = require('../utils/errorCodes');
const logger = require('../utils/logger');

const adminMiddleware = (req, res, next) => {
    const adminKey = req.headers['x-admin-key'];
    const validAdminKey = process.env.ADMIN_KEY;

    // ADMIN_KEY가 환경변수에 설정되어 있지 않으면 보안상 모든 접근 차단
    if (!validAdminKey) {
        logger.error('ADMIN_KEY environment variable is not set! Blocking admin access.');
        return next(AppError.fromErrorCode(ErrorCodes.AUTH_FORBIDDEN, 403));
    }

    if (!adminKey || adminKey !== validAdminKey) {
        logger.warn('Unauthorized admin access attempt', {
            ip: req.ip,
            keyProvided: adminKey ? '***' : 'none'
        });
        return next(AppError.fromErrorCode(ErrorCodes.AUTH_FORBIDDEN, 403));
    }

    next();
};

module.exports = adminMiddleware;
