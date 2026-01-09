// 각 호선별 활성 사용자 추적
const activeUsers = new Map();

// 사용자 활동 기록
function recordActivity(lineId, sessionId) {
  if (!activeUsers.has(lineId)) {
    activeUsers.set(lineId, new Set());
  }

  const lineUsers = activeUsers.get(lineId);
  lineUsers.add(sessionId);
  console.log(`[Active Users] Added to line ${lineId}: ${sessionId}, total: ${lineUsers.size}`);
}

// 사용자 활동 제거 (채팅방 나갈 때)
function removeActivity(lineId, sessionId) {
  console.log(`[Active Users] Removing from line ${lineId}: ${sessionId}`);
  if (!activeUsers.has(lineId)) {
    console.log(`[Active Users] Line ${lineId} not found in activeUsers`);
    return;
  }

  const lineUsers = activeUsers.get(lineId);
  const hadSession = lineUsers.has(sessionId);
  lineUsers.delete(sessionId);
  console.log(`[Active Users] Removed from line ${lineId}: ${sessionId} (existed: ${hadSession}), remaining: ${lineUsers.size}`);

  if (lineUsers.size === 0) {
    activeUsers.delete(lineId);
    console.log(`[Active Users] Line ${lineId} removed from activeUsers (no users left)`);
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
