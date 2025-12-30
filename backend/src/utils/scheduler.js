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
  cron.schedule('0 0 * * *', deleteOldData);
  console.log('Daily cleanup scheduler started (runs at midnight)');
};

module.exports = {
  startScheduler,
  deleteOldData,
};
