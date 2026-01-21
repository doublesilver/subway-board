const visitService = require('../services/visitService');

const recordVisit = async (req, res) => {
  try {
    const { subway_line_id } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.get('user-agent') || '';

    const result = await visitService.recordVisit(ip, userAgent, subway_line_id);
    res.status(201).json(result);
  } catch (error) {
    if (error.message === '호선 ID가 필요합니다.') {
      return res.status(400).json({ error: error.message });
    }
    console.error('Visit record error:', error);
    res.status(500).json({ error: '방문 기록 저장 실패' });
  }
};

const getStats = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const stats = await visitService.getStats(days);
    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: '통계 조회 실패' });
  }
};

module.exports = {
  recordVisit,
  getStats
};
