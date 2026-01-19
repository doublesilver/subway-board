const pool = require('../db/connection');
const crypto = require('crypto');

// 방문자 중복 체크용 인메모리 캐시
// key: "날짜:호선ID:visitorHash", value: true
const visitCache = new Map();

// 방문 캐시 전체 초기화 (스케줄러에서 호출)
const clearVisitCache = () => {
  visitCache.clear();
  console.log('Visit cache cleared');
};

// 방문자 고유 해시 생성 (IP + User-Agent)
const getVisitorHash = (req) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const userAgent = req.get('user-agent') || '';
  return crypto.createHash('sha256').update(`${ip}:${userAgent}`).digest('hex').substring(0, 16);
};

// 방문 기록 (해당 날짜+호선의 카운트 증가, 중복 방문 제외)
const recordVisit = async (req, res) => {
  try {
    const { subway_line_id } = req.body;

    if (!subway_line_id) {
      return res.status(400).json({ error: '호선 ID가 필요합니다.' });
    }

    // 오늘 날짜 (KST 기준)
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
    const visitorHash = getVisitorHash(req);
    const cacheKey = `${today}:${subway_line_id}:${visitorHash}`;

    // 이미 오늘 해당 호선에 방문한 사용자면 스킵
    if (visitCache.has(cacheKey)) {
      return res.status(200).json({ success: true, duplicate: true });
    }

    // 캐시에 기록
    visitCache.set(cacheKey, true);

    // UPSERT: 있으면 카운트 증가, 없으면 새로 생성
    await pool.query(`
      INSERT INTO daily_visits (visit_date, subway_line_id, visit_count)
      VALUES ($1, $2, 1)
      ON CONFLICT (visit_date, subway_line_id)
      DO UPDATE SET visit_count = daily_visits.visit_count + 1
    `, [today, subway_line_id]);

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

    // 일별 전체 방문자 수
    const dailyStats = await pool.query(`
      SELECT
        visit_date as date,
        SUM(visit_count) as total_visits
      FROM daily_visits
      WHERE visit_date >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
      GROUP BY visit_date
      ORDER BY visit_date DESC
    `);

    // 호선별 방문 통계
    const lineStats = await pool.query(`
      SELECT
        sl.line_number,
        sl.line_name,
        SUM(dv.visit_count) as total_visits
      FROM daily_visits dv
      JOIN subway_lines sl ON dv.subway_line_id = sl.id
      WHERE dv.visit_date >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
      GROUP BY sl.id, sl.line_number, sl.line_name
      ORDER BY total_visits DESC
    `);

    // 오늘 통계
    const todayStats = await pool.query(`
      SELECT COALESCE(SUM(visit_count), 0) as total_visits
      FROM daily_visits
      WHERE visit_date = CURRENT_DATE
    `);

    // 전체 통계
    const totalStats = await pool.query(`
      SELECT COALESCE(SUM(visit_count), 0) as total_visits
      FROM daily_visits
    `);

    res.json({
      today: { total_visits: parseInt(todayStats.rows[0].total_visits) },
      total: { total_visits: parseInt(totalStats.rows[0].total_visits) },
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
  getStats,
  clearVisitCache
};
