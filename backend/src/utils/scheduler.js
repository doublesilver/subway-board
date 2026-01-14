const cron = require('node-cron');
const pool = require('../db/connection');

const deleteOldData = async () => {
  try {
    console.log('Starting daily cleanup (Full Wipe)...');

    // 모든 데이터 삭제 (하루의 시작을 깨끗하게)
    // 외래 키 제약 조건(ON DELETE CASCADE)이 설정되어 있다면 posts만 삭제해도 되지만,
    // 명시적으로 둘 다 삭제하여 확실하게 처리
    const commentsResult = await pool.query('DELETE FROM comments');
    const postsResult = await pool.query('DELETE FROM posts');

    console.log(`Cleanup completed: ${postsResult.rowCount} posts and ${commentsResult.rowCount} comments deleted`);
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
};

const startScheduler = () => {
  // 테스트 기간: 매일 자정 (00:00)에 실행 (원복 시 '0 9 * * *'로 변경)
  cron.schedule('0 0 * * *', deleteOldData, {
    scheduled: true,
    timezone: "Asia/Seoul"
  });
  console.log('Daily cleanup scheduler started (runs at 00:00 KST - TEST MODE)');
};

module.exports = {
  startScheduler,
  deleteOldData,
};
