// 각 호선별 활성 사용자 추적 (WebSocket 기반)
// Map<lineId, Set<socketId>>
const activeUsers = new Map();

// Socket ID -> Line ID 매핑
const socketToLine = new Map();

// Socket.io 연결 핸들러
function handleSocketConnection(socket) {
  console.log(`[WebSocket] Client connected: ${socket.id}`);

  // 채팅방 입장
  socket.on('join_line', (data) => {
    const { lineId, sessionId } = data;
    console.log(`[WebSocket] ${sessionId} joining line ${lineId}`);

    // 이전 방에서 나가기
    const previousLine = socketToLine.get(socket.id);
    if (previousLine) {
      leaveRoom(socket, previousLine);
    }

    // 새 방 입장
    socket.join(`line_${lineId}`);
    socketToLine.set(socket.id, lineId);

    // 활성 사용자 추가
    if (!activeUsers.has(lineId)) {
      activeUsers.set(lineId, new Set());
    }
    activeUsers.get(lineId).add(socket.id);

    // 해당 호선의 모든 사용자에게 업데이트 브로드캐스트
    broadcastActiveUsers(lineId);

    console.log(`[WebSocket] Line ${lineId} now has ${activeUsers.get(lineId).size} users`);
  });

  // 채팅방 퇴장
  socket.on('leave_line', (data) => {
    const { lineId } = data;
    leaveRoom(socket, lineId);
  });

  // 연결 해제
  socket.on('disconnect', () => {
    console.log(`[WebSocket] Client disconnected: ${socket.id}`);
    const lineId = socketToLine.get(socket.id);
    if (lineId) {
      leaveRoom(socket, lineId);
    }
  });
}

// 방 나가기 헬퍼 함수
function leaveRoom(socket, lineId) {
  socket.leave(`line_${lineId}`);
  socketToLine.delete(socket.id);

  if (activeUsers.has(lineId)) {
    activeUsers.get(lineId).delete(socket.id);

    if (activeUsers.get(lineId).size === 0) {
      activeUsers.delete(lineId);
    }

    broadcastActiveUsers(lineId);
    console.log(`[WebSocket] Line ${lineId} now has ${activeUsers.get(lineId)?.size || 0} users`);
  }
}

// 특정 호선의 활성 사용자 수를 모든 클라이언트에게 브로드캐스트
function broadcastActiveUsers(lineId) {
  const count = getActiveUserCount(lineId);

  if (global.io) {
    // 해당 호선의 사용자들에게만 전송
    global.io.to(`line_${lineId}`).emit('active_users_update', {
      lineId,
      count
    });

    // 메인 화면의 모든 사용자에게도 전송
    global.io.emit('line_users_update', {
      lineId,
      count
    });
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

// 레거시 함수들 (API 호출용 - 필요시 사용)
function recordActivity(lineId, sessionId) {
  // WebSocket 방식으로 전환했으므로 사용하지 않음
  console.log(`[Legacy] recordActivity called for line ${lineId}`);
}

function removeActivity(lineId, sessionId) {
  // WebSocket 방식으로 전환했으므로 사용하지 않음
  console.log(`[Legacy] removeActivity called for line ${lineId}`);
}

module.exports = {
  handleSocketConnection,
  recordActivity,
  removeActivity,
  getActiveUserCount,
  getAllActiveUserCounts,
  broadcastActiveUsers
};
