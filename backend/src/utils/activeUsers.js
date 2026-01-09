// 각 호선별 활성 사용자 추적 (WebSocket 기반)
// Map<lineId, Set<socketId>>
const activeUsers = new Map();

// Socket ID -> Line ID 매핑
const socketToLine = new Map();

// Socket.io 연결 핸들러
function handleSocketConnection(socket) {
  console.log(`[WebSocket] Client connected: ${socket.id}`);

  // 연결 제한 (한 소켓당 최대 3개 방까지)
  let roomCount = 0;

  // 채팅방 입장
  socket.on('join_line', (data) => {
    try {
      const { lineId, sessionId } = data;

      // 입력 검증
      if (!lineId || !sessionId) {
        socket.emit('error', { message: '잘못된 요청입니다.' });
        return;
      }

      const parsedLineId = parseInt(lineId);
      if (isNaN(parsedLineId) || parsedLineId < 1 || parsedLineId > 9) {
        socket.emit('error', { message: '유효하지 않은 호선입니다.' });
        return;
      }

      // 방 개수 제한
      if (roomCount >= 3) {
        socket.emit('error', { message: '동시에 3개 이상의 채팅방에 참여할 수 없습니다.' });
        return;
      }

      console.log(`[WebSocket] ${sessionId} joining line ${parsedLineId}`);

      // 이전 방에서 나가기
      const previousLine = socketToLine.get(socket.id);
      if (previousLine) {
        leaveRoom(socket, previousLine);
        roomCount--;
      }

      // 새 방 입장
      socket.join(`line_${parsedLineId}`);
      socketToLine.set(socket.id, parsedLineId);
      roomCount++;

      // 활성 사용자 추가
      if (!activeUsers.has(parsedLineId)) {
        activeUsers.set(parsedLineId, new Set());
      }
      activeUsers.get(parsedLineId).add(socket.id);

      // 해당 호선의 모든 사용자에게 업데이트 브로드캐스트
      broadcastActiveUsers(parsedLineId);

      console.log(`[WebSocket] Line ${parsedLineId} now has ${activeUsers.get(parsedLineId).size} users`);
    } catch (error) {
      console.error('[WebSocket] join_line error:', error);
      socket.emit('error', { message: '채팅방 입장에 실패했습니다.' });
    }
  });

  // 채팅방 퇴장
  socket.on('leave_line', (data) => {
    try {
      const { lineId } = data;

      if (!lineId) {
        socket.emit('error', { message: '잘못된 요청입니다.' });
        return;
      }

      const parsedLineId = parseInt(lineId);
      if (isNaN(parsedLineId) || parsedLineId < 1 || parsedLineId > 9) {
        socket.emit('error', { message: '유효하지 않은 호선입니다.' });
        return;
      }

      leaveRoom(socket, parsedLineId);
      roomCount = Math.max(0, roomCount - 1);
    } catch (error) {
      console.error('[WebSocket] leave_line error:', error);
    }
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

// 새 메시지를 특정 호선의 모든 사용자에게 브로드캐스트
function broadcastNewMessage(lineId, message) {
  if (global.io) {
    global.io.to(`line_${lineId}`).emit('new_message', {
      lineId,
      message
    });
    console.log(`[WebSocket] New message broadcasted to line ${lineId}`);
  }
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
  broadcastActiveUsers,
  broadcastNewMessage
};
