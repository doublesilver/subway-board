const cron = require('node-cron');
const pool = require('../db/connection');

const deleteOldData = async () => {
  try {
    console.log('Starting daily cleanup...');

    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const commentsResult = await pool.query(
      'DELETE FROM comments WHERE created_at < $1',
      [oneDayAgo]
    );

    const postsResult = await pool.query(
      'DELETE FROM posts WHERE created_at < $1',
      [oneDayAgo]
    );

    console.log(`Cleanup completed: ${postsResult.rowCount} posts and ${commentsResult.rowCount} comments deleted`);
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
};

const startScheduler = () => {
  // 매일 오전 9시 (Asia/Seoul 기준)에 실행
  cron.schedule('0 9 * * *', deleteOldData, {
    scheduled: true,
    timezone: "Asia/Seoul"
  });
  console.log('Daily cleanup scheduler started (runs at 09:00 KST)');
};

module.exports = {
  startScheduler,
  deleteOldData,
};
