const pool = require('../db/connection');

const getAllLines = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM subway_lines ORDER BY id'
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching subway lines:', error);
    res.status(500).json({ error: '호선 목록을 불러오는데 실패했습니다.' });
  }
};

module.exports = {
  getAllLines,
};
