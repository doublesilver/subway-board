const pool = require('../db/connection');
const { queryWithRetry } = require('../db/connection');
const { getAllActiveUserCounts, recordActivity } = require('../utils/activeUsers');

const getAllLines = async (req, res) => {
  const startTime = Date.now();

  try {
    // Use retry logic for better reliability
    const result = await queryWithRetry(
      'SELECT * FROM subway_lines ORDER BY id'
    );

    // 활성 사용자 수 추가
    const activeCounts = getAllActiveUserCounts();
    const linesWithUsers = result.rows.map(line => ({
      ...line,
      activeUsers: activeCounts[line.id] || 0
    }));

    const duration = Date.now() - startTime;
    console.log(`✓ Fetched ${linesWithUsers.length} subway lines in ${duration}ms`);

    res.json(linesWithUsers);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`✗ Error fetching subway lines after ${duration}ms:`, {
      message: error.message,
      code: error.code,
      stack: error.stack.split('\n').slice(0, 3).join('\n')
    });
    res.status(500).json({ error: '호선 목록을 불러오는데 실패했습니다.' });
  }
};

module.exports = {
  getAllLines,
};
