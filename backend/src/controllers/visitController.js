const pool = require('../db/connection');

// 방문 기록 저장
const recordVisit = async (req, res) => {
  try {
    const sessionId = req.headers['x-anonymous-id'];
    const { subway_line_id } = req.body;
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    if (!sessionId) {
      return res.status(400).json({ error: '세션 ID가 필요합니다.' });
    }

    await pool.query(
      `INSERT INTO visits (session_id, subway_line_id, ip_address, user_agent)
       VALUES ($1, $2, $3, $4)`,
      [sessionId, subway_line_id || null, ipAddress, userAgent]
    );

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Visit record error:', error);
    res.status(500).json({ error: '방문 기록 저장 실패' });
  }
};

// 통계 조회 (관리자용)
const getStats = async (req, res) => {
  try {
    const { days = 7 } = req.query;

    // 일별 방문자 수 (중복 세션 제외)
    const dailyStats = await pool.query(`
      SELECT
        DATE(visited_at AT TIME ZONE 'Asia/Seoul') as date,
        COUNT(DISTINCT session_id) as unique_visitors,
        COUNT(*) as total_visits
      FROM visits
      WHERE visited_at >= NOW() - INTERVAL '${parseInt(days)} days'
      GROUP BY DATE(visited_at AT TIME ZONE 'Asia/Seoul')
      ORDER BY date DESC
    `);

    // 호선별 방문 통계
    const lineStats = await pool.query(`
      SELECT
        sl.line_number,
        sl.line_name,
        COUNT(DISTINCT v.session_id) as unique_visitors,
        COUNT(*) as total_visits
      FROM visits v
      LEFT JOIN subway_lines sl ON v.subway_line_id = sl.id
      WHERE v.visited_at >= NOW() - INTERVAL '${parseInt(days)} days'
      GROUP BY sl.id, sl.line_number, sl.line_name
      ORDER BY unique_visitors DESC
    `);

    // 오늘 통계
    const todayStats = await pool.query(`
      SELECT
        COUNT(DISTINCT session_id) as unique_visitors,
        COUNT(*) as total_visits
      FROM visits
      WHERE DATE(visited_at AT TIME ZONE 'Asia/Seoul') = DATE(NOW() AT TIME ZONE 'Asia/Seoul')
    `);

    // 전체 통계
    const totalStats = await pool.query(`
      SELECT
        COUNT(DISTINCT session_id) as unique_visitors,
        COUNT(*) as total_visits
      FROM visits
    `);

    res.json({
      today: todayStats.rows[0],
      total: totalStats.rows[0],
      daily: dailyStats.rows,
      byLine: lineStats.rows
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: '통계 조회 실패' });
  }
};

module.exports = {
  recordVisit,
  getStats
};
