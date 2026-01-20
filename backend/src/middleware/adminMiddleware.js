const AppError = require('../utils/AppError');
const { ErrorCodes } = require('../utils/errorCodes');
const logger = require('../utils/logger');

// IP 추출 함수
const getClientIP = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    return req.ip || req.connection?.remoteAddress || '';
};

// IP 화이트리스트 체크
const isIPAllowed = (clientIP) => {
    const whitelist = process.env.ADMIN_IP_WHITELIST;

    // 화이트리스트가 설정되지 않으면 IP 체크 스킵 (비밀번호만 체크)
    if (!whitelist) {
        return true;
    }

    const allowedIPs = whitelist.split(',').map(ip => ip.trim());

    // IPv6 localhost 변환
    const normalizedIP = clientIP === '::1' ? '127.0.0.1' : clientIP;

    return allowedIPs.some(allowed => {
        // CIDR 표기 지원 (예: 192.168.1.0/24)
        if (allowed.includes('/')) {
            return isIPInCIDR(normalizedIP, allowed);
        }
        return normalizedIP === allowed || clientIP === allowed;
    });
};

// CIDR 범위 체크
const isIPInCIDR = (ip, cidr) => {
    try {
        const [range, bits] = cidr.split('/');
        const mask = ~(2 ** (32 - parseInt(bits)) - 1);
        const ipNum = ipToNumber(ip);
        const rangeNum = ipToNumber(range);
        return (ipNum & mask) === (rangeNum & mask);
    } catch {
        return false;
    }
};

const ipToNumber = (ip) => {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
};

const adminMiddleware = (req, res, next) => {
    const clientIP = getClientIP(req);
    const adminKey = req.headers['x-admin-key'];
    const validAdminKey = process.env.ADMIN_KEY;

    // ADMIN_KEY가 환경변수에 설정되어 있지 않으면 보안상 모든 접근 차단
    if (!validAdminKey) {
        logger.error('ADMIN_KEY environment variable is not set! Blocking admin access.');
        return next(AppError.fromErrorCode(ErrorCodes.AUTH_FORBIDDEN, 403));
    }

    // 1. IP 화이트리스트 체크
    if (!isIPAllowed(clientIP)) {
        logger.warn('Admin access blocked by IP whitelist', { ip: clientIP });
        return next(AppError.fromErrorCode(ErrorCodes.AUTH_FORBIDDEN, 403));
    }

    // 2. 비밀번호(Admin Key) 체크
    if (!adminKey || adminKey !== validAdminKey) {
        logger.warn('Unauthorized admin access attempt', {
            ip: clientIP,
            keyProvided: adminKey ? '***' : 'none'
        });
        return next(AppError.fromErrorCode(ErrorCodes.AUTH_FORBIDDEN, 403));
    }

    next();
};

// 대시보드 로그인용 (세션/토큰 발급)
const adminLoginMiddleware = (req, res, next) => {
    const clientIP = getClientIP(req);
    const { password } = req.body;
    const validPassword = process.env.ADMIN_DASHBOARD_PASSWORD || process.env.ADMIN_KEY;

    if (!validPassword) {
        logger.error('Admin password not configured');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    // IP 체크
    if (!isIPAllowed(clientIP)) {
        logger.warn('Dashboard login blocked by IP', { ip: clientIP });
        return res.status(403).json({ error: 'Access denied' });
    }

    // 비밀번호 체크
    if (!password || password !== validPassword) {
        logger.warn('Dashboard login failed', { ip: clientIP });
        return res.status(401).json({ error: 'Invalid password' });
    }

    next();
};

module.exports = { adminMiddleware, adminLoginMiddleware, getClientIP, isIPAllowed };
