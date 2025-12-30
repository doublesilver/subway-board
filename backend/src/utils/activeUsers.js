// 각 호선별 활성 사용자 추적
const activeUsers = new Map();

// 사용자 세션 타임아웃 (30초)
const SESSION_TIMEOUT = 30000;

// 사용자 활동 기록
function recordActivity(lineId, sessionId) {
  if (!activeUsers.has(lineId)) {
    activeUsers.set(lineId, new Map());
  }

  const lineUsers = activeUsers.get(lineId);
  lineUsers.set(sessionId, Date.now());
}

// 만료된 세션 정리
function cleanupExpiredSessions() {
  const now = Date.now();

  activeUsers.forEach((lineUsers, lineId) => {
    const expiredSessions = [];

    lineUsers.forEach((timestamp, sessionId) => {
      if (now - timestamp > SESSION_TIMEOUT) {
        expiredSessions.push(sessionId);
      }
    });

    expiredSessions.forEach(sessionId => lineUsers.delete(sessionId));

    if (lineUsers.size === 0) {
      activeUsers.delete(lineId);
    }
  });
}

// 호선별 활성 사용자 수 조회
function getActiveUserCount(lineId) {
  cleanupExpiredSessions();
  const lineUsers = activeUsers.get(lineId);
  return lineUsers ? lineUsers.size : 0;
}

// 모든 호선의 활성 사용자 수 조회
function getAllActiveUserCounts() {
  cleanupExpiredSessions();
  const counts = {};

  activeUsers.forEach((lineUsers, lineId) => {
    counts[lineId] = lineUsers.size;
  });

  return counts;
}

// 주기적으로 만료된 세션 정리 (10초마다)
setInterval(cleanupExpiredSessions, 10000);

module.exports = {
  recordActivity,
  getActiveUserCount,
  getAllActiveUserCounts
};
