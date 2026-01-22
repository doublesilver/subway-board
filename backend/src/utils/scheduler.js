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

    // 방문자 중복 체크는 DB 기반으로 변경됨 (unique_visitors 테이블)
    // 인메모리 캐시 제거됨

    console.log(`Cleanup completed: ${postsResult.rowCount} posts and ${commentsResult.rowCount} comments deleted`);
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
};

const startScheduler = () => {
  // 매일 오전 9시 (운영 종료 시점)에 데이터 삭제
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
