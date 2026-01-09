// 각 호선별 활성 사용자 추적
const activeUsers = new Map();

// 사용자 활동 기록
function recordActivity(lineId, sessionId) {
  if (!activeUsers.has(lineId)) {
    activeUsers.set(lineId, new Set());
  }

  const lineUsers = activeUsers.get(lineId);
  lineUsers.add(sessionId);
}

// 사용자 활동 제거 (채팅방 나갈 때)
function removeActivity(lineId, sessionId) {
  if (!activeUsers.has(lineId)) return;

  const lineUsers = activeUsers.get(lineId);
  lineUsers.delete(sessionId);

  if (lineUsers.size === 0) {
    activeUsers.delete(lineId);
  }
}

// 호선별 활성 사용자 수 조회
function getActiveUserCount(lineId) {
  const lineUsers = activeUsers.get(lineId);
  return lineUsers ? lineUsers.size : 0;
}

// 모든 호선의 활성 사용자 수 조회
function getAllActiveUserCounts() {
  const counts = {};

  activeUsers.forEach((lineUsers, lineId) => {
    counts[lineId] = lineUsers.size;
  });

  return counts;
}

module.exports = {
  recordActivity,
  removeActivity,
  getActiveUserCount,
  getAllActiveUserCounts
};
