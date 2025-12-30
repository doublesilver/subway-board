const pool = require('../db/connection');
const { getAllActiveUserCounts } = require('../utils/activeUsers');

const getAllLines = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM subway_lines ORDER BY id'
    );

    // 활성 사용자 수 추가
    const activeCounts = getAllActiveUserCounts();
    const linesWithUsers = result.rows.map(line => ({
      ...line,
      activeUsers: activeCounts[line.id] || 0
    }));

    res.json(linesWithUsers);
  } catch (error) {
    console.error('Error fetching subway lines:', error);
    res.status(500).json({ error: '호선 목록을 불러오는데 실패했습니다.' });
  }
};

module.exports = {
  getAllLines,
};
