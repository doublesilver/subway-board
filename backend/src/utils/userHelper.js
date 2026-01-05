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

    return user;
};

module.exports = {
    getOrCreateUser,
};
