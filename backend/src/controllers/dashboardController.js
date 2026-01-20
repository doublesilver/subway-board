const pool = require('../db/connection');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.ADMIN_KEY || 'fallback-secret';
const TOKEN_EXPIRY = '24h';

// 대시보드 로그인 - JWT 토큰 발급
const login = async (req, res) => {
  try {
    const token = jwt.sign(
      { role: 'admin', iat: Date.now() },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    res.json({
      success: true,
      token,
      expiresIn: TOKEN_EXPIRY
    });
  } catch (error) {
    console.error('Dashboard login error:', error);
    res.status(500).json({ error: '로그인 처리 실패' });
  }
};

// 토큰 검증 미들웨어
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// 전체 대시보드 데이터 조회
const getDashboardData = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysInt = parseInt(days);

    // 1. 요약 통계 (DAU/WAU/MAU)
    const todayUV = await pool.query(`
      SELECT COUNT(*) as count FROM unique_visitors WHERE visit_date = CURRENT_DATE
    `);

    const wau = await pool.query(`
      SELECT COUNT(DISTINCT visitor_hash) as count
      FROM unique_visitors
      WHERE visit_date >= CURRENT_DATE - INTERVAL '7 days'
    `);

    const mau = await pool.query(`
      SELECT COUNT(DISTINCT visitor_hash) as count
      FROM unique_visitors
      WHERE visit_date >= CURRENT_DATE - INTERVAL '30 days'
    `);

    // 2. 재방문율
    const retention = await pool.query(`
      WITH last_week AS (
        SELECT DISTINCT visitor_hash
        FROM unique_visitors
        WHERE visit_date BETWEEN CURRENT_DATE - INTERVAL '14 days' AND CURRENT_DATE - INTERVAL '7 days'
      ),
      this_week AS (
        SELECT DISTINCT visitor_hash
        FROM unique_visitors
        WHERE visit_date >= CURRENT_DATE - INTERVAL '7 days'
      )
      SELECT
        (SELECT COUNT(*) FROM last_week) as last_week_users,
        COUNT(*) as retained_users
      FROM last_week lw
      WHERE EXISTS (SELECT 1 FROM this_week tw WHERE tw.visitor_hash = lw.visitor_hash)
    `);

    const lastWeekUsers = parseInt(retention.rows[0]?.last_week_users || 0);
    const retainedUsers = parseInt(retention.rows[0]?.retained_users || 0);
    const retentionRate = lastWeekUsers > 0 ? Math.round((retainedUsers / lastWeekUsers) * 1000) / 10 : 0;

    // 3. 일별 방문자 추이
    const dailyTrend = await pool.query(`
      SELECT
        visit_date as date,
        COUNT(*) as unique_visitors,
        SUM(lines_visited) as total_visits
      FROM unique_visitors
      WHERE visit_date >= CURRENT_DATE - INTERVAL '${daysInt} days'
      GROUP BY visit_date
      ORDER BY visit_date ASC
    `);

    // 4. 호선별 통계
    const lineStats = await pool.query(`
      SELECT
        sl.id,
        sl.line_number,
        sl.line_name,
        sl.color,
        COALESCE(SUM(dv.visit_count), 0) as total_visits
      FROM subway_lines sl
      LEFT JOIN daily_visits dv ON sl.id = dv.subway_line_id
        AND dv.visit_date >= CURRENT_DATE - INTERVAL '${daysInt} days'
      GROUP BY sl.id, sl.line_number, sl.line_name, sl.color
      ORDER BY sl.line_number::int
    `);

    // 5. 시간대별 통계
    const hourlyStats = await pool.query(`
      SELECT
        visit_hour as hour,
        SUM(visit_count) as total_visits
      FROM hourly_visits
      WHERE visit_date >= CURRENT_DATE - INTERVAL '${daysInt} days'
      GROUP BY visit_hour
      ORDER BY visit_hour
    `);

    // 6. 호선별 시간대 히트맵 데이터
    const lineHourlyHeatmap = await pool.query(`
      SELECT
        sl.line_number,
        sl.line_name,
        hv.visit_hour,
        SUM(hv.visit_count) as visits
      FROM hourly_visits hv
      JOIN subway_lines sl ON hv.subway_line_id = sl.id
      WHERE hv.visit_date >= CURRENT_DATE - INTERVAL '${daysInt} days'
      GROUP BY sl.line_number, sl.line_name, hv.visit_hour
      ORDER BY sl.line_number::int, hv.visit_hour
    `);

    // 7. 오늘의 실시간 현황
    const todayByLine = await pool.query(`
      SELECT
        sl.line_number,
        sl.line_name,
        sl.color,
        COALESCE(dv.visit_count, 0) as today_visits
      FROM subway_lines sl
      LEFT JOIN daily_visits dv ON sl.id = dv.subway_line_id AND dv.visit_date = CURRENT_DATE
      ORDER BY sl.line_number::int
    `);

    // 8. 게시글/댓글 통계
    const contentStats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM posts WHERE deleted_at IS NULL) as total_posts,
        (SELECT COUNT(*) FROM comments WHERE deleted_at IS NULL) as total_comments,
        (SELECT COUNT(*) FROM posts WHERE created_at >= CURRENT_DATE AND deleted_at IS NULL) as today_posts,
        (SELECT COUNT(*) FROM comments WHERE created_at >= CURRENT_DATE AND deleted_at IS NULL) as today_comments
    `);

    // 9. 피드백 통계
    const feedbackStats = await pool.query(`
      SELECT
        COUNT(*) as total_feedback,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today_feedback
      FROM feedback
    `);

    res.json({
      summary: {
        dau: parseInt(todayUV.rows[0].count),
        wau: parseInt(wau.rows[0].count),
        mau: parseInt(mau.rows[0].count),
        retentionRate
      },
      dailyTrend: dailyTrend.rows,
      lineStats: lineStats.rows,
      hourlyStats: hourlyStats.rows,
      lineHourlyHeatmap: lineHourlyHeatmap.rows,
      todayByLine: todayByLine.rows,
      content: {
        totalPosts: parseInt(contentStats.rows[0].total_posts),
        totalComments: parseInt(contentStats.rows[0].total_comments),
        todayPosts: parseInt(contentStats.rows[0].today_posts),
        todayComments: parseInt(contentStats.rows[0].today_comments)
      },
      feedback: {
        total: parseInt(feedbackStats.rows[0].total_feedback),
        today: parseInt(feedbackStats.rows[0].today_feedback)
      },
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ error: '대시보드 데이터 조회 실패' });
  }
};

// Raw 데이터 조회 (커스텀 분석용)
const getRawData = async (req, res) => {
  try {
    const { table, days = 7, limit = 1000 } = req.query;
    const daysInt = parseInt(days);
    const limitInt = Math.min(parseInt(limit), 10000); // 최대 10000개

    const allowedTables = ['unique_visitors', 'daily_visits', 'hourly_visits', 'posts', 'comments', 'feedback'];

    if (!table || !allowedTables.includes(table)) {
      return res.status(400).json({
        error: 'Invalid table',
        allowedTables
      });
    }

    let query;
    switch (table) {
      case 'unique_visitors':
        query = `
          SELECT uv.*, sl.line_name as first_line_name
          FROM unique_visitors uv
          LEFT JOIN subway_lines sl ON uv.first_line_id = sl.id
          WHERE uv.visit_date >= CURRENT_DATE - INTERVAL '${daysInt} days'
          ORDER BY uv.created_at DESC
          LIMIT ${limitInt}
        `;
        break;
      case 'daily_visits':
        query = `
          SELECT dv.*, sl.line_name, sl.color
          FROM daily_visits dv
          JOIN subway_lines sl ON dv.subway_line_id = sl.id
          WHERE dv.visit_date >= CURRENT_DATE - INTERVAL '${daysInt} days'
          ORDER BY dv.visit_date DESC
          LIMIT ${limitInt}
        `;
        break;
      case 'hourly_visits':
        query = `
          SELECT hv.*, sl.line_name, sl.color
          FROM hourly_visits hv
          JOIN subway_lines sl ON hv.subway_line_id = sl.id
          WHERE hv.visit_date >= CURRENT_DATE - INTERVAL '${daysInt} days'
          ORDER BY hv.visit_date DESC, hv.visit_hour DESC
          LIMIT ${limitInt}
        `;
        break;
      case 'posts':
        query = `
          SELECT p.id, p.subway_line_id, sl.line_name, p.created_at, p.deleted_at,
                 LENGTH(p.content) as content_length
          FROM posts p
          JOIN subway_lines sl ON p.subway_line_id = sl.id
          WHERE p.created_at >= CURRENT_DATE - INTERVAL '${daysInt} days'
          ORDER BY p.created_at DESC
          LIMIT ${limitInt}
        `;
        break;
      case 'comments':
        query = `
          SELECT c.id, c.post_id, c.created_at, c.deleted_at,
                 LENGTH(c.content) as content_length
          FROM comments c
          WHERE c.created_at >= CURRENT_DATE - INTERVAL '${daysInt} days'
          ORDER BY c.created_at DESC
          LIMIT ${limitInt}
        `;
        break;
      case 'feedback':
        query = `
          SELECT id, created_at, LENGTH(content) as content_length
          FROM feedback
          WHERE created_at >= CURRENT_DATE - INTERVAL '${daysInt} days'
          ORDER BY created_at DESC
          LIMIT ${limitInt}
        `;
        break;
    }

    const result = await pool.query(query);

    res.json({
      table,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Raw data error:', error);
    res.status(500).json({ error: '데이터 조회 실패' });
  }
};

// 커스텀 쿼리 실행 (읽기 전용)
const executeQuery = async (req, res) => {
  try {
    const { sql } = req.body;

    if (!sql) {
      return res.status(400).json({ error: 'SQL query required' });
    }

    // 보안: SELECT만 허용
    const normalizedSQL = sql.trim().toUpperCase();
    if (!normalizedSQL.startsWith('SELECT')) {
      return res.status(403).json({ error: 'Only SELECT queries are allowed' });
    }

    // 위험한 키워드 차단
    const dangerousKeywords = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'TRUNCATE', 'CREATE', 'GRANT', 'REVOKE'];
    if (dangerousKeywords.some(kw => normalizedSQL.includes(kw))) {
      return res.status(403).json({ error: 'Query contains forbidden keywords' });
    }

    const result = await pool.query(sql);

    res.json({
      rowCount: result.rowCount,
      fields: result.fields?.map(f => f.name) || [],
      data: result.rows
    });
  } catch (error) {
    console.error('Custom query error:', error);
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  login,
  verifyToken,
  getDashboardData,
  getRawData,
  executeQuery
};
