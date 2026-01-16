const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        // 1. JWT 토큰 확인 (카카오 로그인)
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.user = {
                    userId: decoded.userId, // DB ID
                    kakaoId: decoded.kakaoId,
                    nickname: decoded.nickname,
                    type: 'kakao',
                };
                return next();
            } catch (err) {
                console.error('Invalid JWT:', err.message);
                // 토큰이 유효하지 않으면 익명으로 넘어갈지, 에러를 낼지 결정.
                // 여기서는 에러 없이 다음으로 넘기고(혹은 익명 체크), 컨트롤러에서 권한 없음을 처리할 수도 있음.
                // 하지만 유효하지 않은 토큰은 보안상 거부하는게 맞을 수도 있으나, 
                // 클라이언트가 토큰 만료시 익명 헤더를 같이 보낼 수도 있음.
                // 일단 진행.
            }
        }

        // 2. 익명 ID 확인
        const anonymousId = req.headers['x-anonymous-id'];
        const anonymousNickname = req.headers['x-anonymous-nickname'] ? decodeURIComponent(req.headers['x-anonymous-nickname']) : ''; // decode for Korean
        const signature = req.headers['x-anonymous-signature'];

        if (anonymousId) {
            // [Security] HMAC 서명 검증 (Mandatory)
            if (!process.env.JWT_SECRET) {
                console.error('CRITICAL: JWT_SECRET is not defined.');
                return res.status(500).json({ error: 'Server configuration error' });
            }

            if (!signature) {
                console.warn(`Missing signature for anonymousId: ${anonymousId}`);
                // 서명이 없으면 401 Unauthorized
                return res.status(401).json({ error: 'Missing authentication signature' });
            }

            const crypto = require('crypto');
            const expectedSignature = crypto
                .createHmac('sha256', process.env.JWT_SECRET)
                .update(anonymousId)
                .digest('hex');

            if (signature !== expectedSignature) {
                console.warn(`Invalid signature for anonymousId: ${anonymousId}`);
                // 서명 불일치 시 403 Forbidden
                return res.status(403).json({ error: 'Invalid authentication signature' });
            }

            req.user = {
                userId: null, // 아직 DB ID 모름
                anonymousId: anonymousId,
                sessionId: anonymousId, // 피드백 등에서 sessionId로 참조
                nickname: anonymousNickname || '익명',
                type: 'anonymous',
            };
            return next();
        }

        // 3. 인증 정보 없음
        req.user = null;
        next();
    } catch (error) {
        console.error('Auth Middleware Error:', error);
        next();
    }
};

module.exports = authMiddleware;
