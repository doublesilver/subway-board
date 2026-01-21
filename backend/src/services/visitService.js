const pool = require('../db/connection');
const crypto = require('crypto');

class VisitService {
    getVisitorHash(ip, userAgent) {
        return crypto.createHash('sha256').update(`${ip}:${userAgent}`).digest('hex').substring(0, 16);
    }

    async recordVisit(ip, userAgent, subway_line_id) {
        if (!subway_line_id) {
            throw new Error('호선 ID가 필요합니다.');
        }

        // 현재 시간 (KST 기준)
        const now = new Date();
        const kstNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
        const today = kstNow.toISOString().split('T')[0];
        const currentHour = kstNow.getHours();
        const visitorHash = this.getVisitorHash(ip, userAgent);

        // 1. 고유 방문자 체크 (DB 기반 중복 방지)
        const existingVisitor = await pool.query(
            'SELECT id, lines_visited FROM unique_visitors WHERE visitor_hash = $1 AND visit_date = $2',
            [visitorHash, today]
        );

        const isFirstVisitToday = existingVisitor.rows.length === 0;

        if (isFirstVisitToday) {
            // 오늘 첫 방문 - unique_visitors에 기록
            await pool.query(
                `INSERT INTO unique_visitors (visitor_hash, visit_date, first_line_id, lines_visited)
         VALUES ($1, $2, $3, 1)`,
                [visitorHash, today, subway_line_id]
            );
        } else {
            // 이미 오늘 방문한 사용자 - 다른 호선이면 lines_visited 증가
            const currentLinesVisited = existingVisitor.rows[0].lines_visited;
            await pool.query(
                `UPDATE unique_visitors SET lines_visited = $1 WHERE visitor_hash = $2 AND visit_date = $3`,
                [currentLinesVisited + 1, visitorHash, today]
            );
        }

        // 2. 일별 호선별 집계 (daily_visits) - 중복 방문도 카운트
        await pool.query(`
      INSERT INTO daily_visits (visit_date, subway_line_id, visit_count)
      VALUES ($1, $2, 1)
      ON CONFLICT (visit_date, subway_line_id)
      DO UPDATE SET visit_count = daily_visits.visit_count + 1
    `, [today, subway_line_id]);

        // 3. 시간대별 호선별 집계 (hourly_visits)
        await pool.query(`
      INSERT INTO hourly_visits (visit_date, visit_hour, subway_line_id, visit_count)
      VALUES ($1, $2, $3, 1)
      ON CONFLICT (visit_date, visit_hour, subway_line_id)
      DO UPDATE SET visit_count = hourly_visits.visit_count + 1
    `, [today, currentHour, subway_line_id]);

        return { success: true, firstVisit: isFirstVisitToday };
    }

    async getStats(days = 7) {
        const daysInt = parseInt(days);

        // 1. 일별 고유 방문자 수 (UV)
        const dailyUV = await pool.query(`
      SELECT visit_date as date, COUNT(*) as unique_visitors
      FROM unique_visitors
      WHERE visit_date >= CURRENT_DATE - INTERVAL '${daysInt} days'
      GROUP BY visit_date
      ORDER BY visit_date DESC
    `);

        // 2. 호선별 방문 통계
        const lineStats = await pool.query(`
      SELECT
        sl.line_number,
        sl.line_name,
        SUM(dv.visit_count) as total_visits
      FROM daily_visits dv
      JOIN subway_lines sl ON dv.subway_line_id = sl.id
      WHERE dv.visit_date >= CURRENT_DATE - INTERVAL '${daysInt} days'
      GROUP BY sl.id, sl.line_number, sl.line_name
      ORDER BY total_visits DESC
    `);

        // 3. 시간대별 피크 분석
        const hourlyPeak = await pool.query(`
      SELECT
        visit_hour as hour,
        SUM(visit_count) as total_visits
      FROM hourly_visits
      WHERE visit_date >= CURRENT_DATE - INTERVAL '${daysInt} days'
      GROUP BY visit_hour
      ORDER BY total_visits DESC
    `);

        // 4. 호선별 피크 시간대
        const lineHourlyPeak = await pool.query(`
      SELECT
        sl.line_name,
        hv.visit_hour as peak_hour,
        SUM(hv.visit_count) as visits
      FROM hourly_visits hv
      JOIN subway_lines sl ON hv.subway_line_id = sl.id
      WHERE hv.visit_date >= CURRENT_DATE - INTERVAL '${daysInt} days'
      GROUP BY sl.line_name, hv.visit_hour
      ORDER BY sl.line_name, visits DESC
    `);

        // 5. 오늘 고유 방문자 수
        const todayUV = await pool.query(`
      SELECT COUNT(*) as unique_visitors
      FROM unique_visitors
      WHERE visit_date = CURRENT_DATE
    `);

        // 6. DAU/WAU/MAU
        const wau = await pool.query(`
      SELECT COUNT(DISTINCT visitor_hash) as wau
      FROM unique_visitors
      WHERE visit_date >= CURRENT_DATE - INTERVAL '7 days'
    `);

        const mau = await pool.query(`
      SELECT COUNT(DISTINCT visitor_hash) as mau
      FROM unique_visitors
      WHERE visit_date >= CURRENT_DATE - INTERVAL '30 days'
    `);

        // 7. 재방문율 (지난주 방문자 중 이번주 다시 방문한 비율)
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

        return {
            today: {
                unique_visitors: parseInt(todayUV.rows[0].unique_visitors)
            },
            summary: {
                dau: parseInt(todayUV.rows[0].unique_visitors),
                wau: parseInt(wau.rows[0].wau),
                mau: parseInt(mau.rows[0].mau),
                retention_rate: retentionRate
            },
            daily: dailyUV.rows,
            byLine: lineStats.rows,
            hourlyPeak: hourlyPeak.rows,
            lineHourlyPeak: lineHourlyPeak.rows
        };
    }
}

module.exports = new VisitService();
