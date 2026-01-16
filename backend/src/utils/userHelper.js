const pool = require('../db/connection');

// 사용자 찾기 또는 생성
// identity: { kakaoId, anonymousId, nickname }
const getOrCreateUser = async (identity) => {
    const { kakaoId, anonymousId, nickname } = identity;

    if (!kakaoId && !anonymousId) {
        throw new Error('User identity missing');
    }

    let user;

    // 1. 카카오 사용자인 경우
    if (kakaoId) {
        const result = await pool.query('SELECT * FROM users WHERE kakao_id = $1', [kakaoId]);
        if (result.rows.length > 0) {
            user = result.rows[0];
        } else {
            // 카카오 사용자 신규 생성 (authController에서 처리하지만 안전장치)
            const newUser = await pool.query(
                'INSERT INTO users (kakao_id, nickname) VALUES ($1, $2) RETURNING *',
                [kakaoId, nickname || '익명']
            );
            user = newUser.rows[0];
        }
    }
    // 2. 익명 사용자인 경우
    else if (anonymousId) {
        const result = await pool.query('SELECT * FROM users WHERE anonymous_id = $1', [anonymousId]);
        if (result.rows.length > 0) {
            user = result.rows[0];
        } else {
            // 익명 사용자 신규 생성
            const newUser = await pool.query(
                'INSERT INTO users (anonymous_id, nickname) VALUES ($1, $2) RETURNING *',
                [anonymousId, nickname || '익명']
            );
            user = newUser.rows[0];
        }
    }

    // 3. 서명 생성 (HMAC-SHA256)
    // 보안 강화: 클라이언트에게 발급할 서명 생성 (나중에 검증용)
    const crypto = require('crypto');
    const signature = crypto
        .createHmac('sha256', process.env.JWT_SECRET || 'fallback_secret')
        .update(user.anonymous_id || user.kakao_id || '')
        .digest('hex');

    // User 객체에 서명 포함하여 반환 (DB에는 저장 안함)
    user.signature = signature;

    return user;
};

module.exports = {
    getOrCreateUser,
};
