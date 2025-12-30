const axios = require('axios');
const jwt = require('jsonwebtoken');
const pool = require('../db/connection');

// 카카오 로그인 URL 생성
const getKakaoAuthURL = (req, res) => {
  const redirectUri = process.env.NODE_ENV === 'production'
    ? process.env.KAKAO_REDIRECT_URI_PROD
    : process.env.KAKAO_REDIRECT_URI;
  const kakaoAuthURL = `https://kauth.kakao.com/oauth/authorize?client_id=${process.env.KAKAO_REST_API_KEY}&redirect_uri=${redirectUri}&response_type=code`;
  res.json({ url: kakaoAuthURL });
};

// 카카오 콜백 처리
const kakaoCallback = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: '인증 코드가 없습니다.' });
  }

  try {
    const redirectUri = process.env.NODE_ENV === 'production'
      ? process.env.KAKAO_REDIRECT_URI_PROD
      : process.env.KAKAO_REDIRECT_URI;

    // 1. 카카오 액세스 토큰 받기
    const tokenResponse = await axios.post(
      'https://kauth.kakao.com/oauth/token',
      null,
      {
        params: {
          grant_type: 'authorization_code',
          client_id: process.env.KAKAO_REST_API_KEY,
          redirect_uri: redirectUri,
          code,
        },
        headers: {
          'Content-type': 'application/x-www-form-urlencoded;charset=utf-8',
        },
      }
    );

    const { access_token } = tokenResponse.data;

    // 2. 카카오 사용자 정보 가져오기
    const userResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const kakaoId = userResponse.data.id;
    const nickname = userResponse.data.properties?.nickname || '익명';

    // 3. DB에서 사용자 찾거나 생성
    let user = await pool.query('SELECT * FROM users WHERE kakao_id = $1', [kakaoId]);

    if (user.rows.length === 0) {
      // 신규 사용자 생성
      const newUser = await pool.query(
        'INSERT INTO users (kakao_id, nickname) VALUES ($1, $2) RETURNING *',
        [kakaoId, nickname]
      );
      user = newUser;
    } else {
      // 기존 사용자 last_login_at 업데이트
      await pool.query(
        'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE kakao_id = $1',
        [kakaoId]
      );
    }

    // 4. JWT 토큰 생성
    const token = jwt.sign(
      {
        userId: user.rows[0].id,
        kakaoId: user.rows[0].kakao_id,
        nickname: user.rows[0].nickname,
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // 5. 프론트엔드로 리다이렉트 (토큰 포함)
    const redirectURL = `${process.env.NODE_ENV === 'production' ? 'https://subway-board.vercel.app' : 'http://localhost:3000'}/auth/kakao/success?token=${token}`;
    res.redirect(redirectURL);
  } catch (error) {
    console.error('Kakao login error:', error);
    res.status(500).json({ error: '카카오 로그인에 실패했습니다.' });
  }
};

// 현재 로그인한 사용자 정보 조회
const getCurrentUser = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.json({ user: null });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await pool.query('SELECT id, nickname FROM users WHERE id = $1', [decoded.userId]);

    if (user.rows.length === 0) {
      return res.json({ user: null });
    }

    res.json({ user: user.rows[0] });
  } catch (error) {
    res.json({ user: null });
  }
};

module.exports = {
  getKakaoAuthURL,
  kakaoCallback,
  getCurrentUser,
};
