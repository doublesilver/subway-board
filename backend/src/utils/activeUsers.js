const { WEBSOCKET, SUBWAY_LINE } = require('../config/constants');
const { ErrorCodes } = require('./errorCodes');
const logger = require('./logger');
const socketService = require('../utils/socket'); // socket.js 모듈 가져오기
const { metrics } = require('./metrics');

// 각 호선별 활성 사용자 추적 (WebSocket 기반)
// Map<lineId, Set<socketId>>
const activeUsers = new Map();

// Socket ID -> Line ID 매핑
const socketToLine = new Map();

// Socket.io 연결 핸들러
function handleSocketConnection(socket) {
  logger.info('WebSocket client connected', { socketId: socket.id });
  metrics.incCounter('websocket_connections_total', { event: 'connect' });

  // 연결 제한 (한 소켓당 최대 3개 방까지)
  let roomCount = 0;

  // 채팅방 입장
  socket.on('join_line', (data) => {
    try {
      const { lineId, sessionId } = data;

      // 입력 검증
      if (!lineId || !sessionId) {
        socket.emit('error', {
          code: ErrorCodes.WS_INVALID_REQUEST,
          message: '잘못된 요청입니다.'
        });
        return;
      }

      const parsedLineId = parseInt(lineId);
      if (isNaN(parsedLineId) || parsedLineId < SUBWAY_LINE.MIN_ID || parsedLineId > SUBWAY_LINE.MAX_ID) {
        socket.emit('error', {
          code: ErrorCodes.WS_INVALID_LINE,
          message: '유효하지 않은 호선입니다.'
        });
        return;
      }

      // 방 개수 제한
      if (roomCount >= WEBSOCKET.MAX_ROOMS_PER_CLIENT) {
        socket.emit('error', {
          code: ErrorCodes.WS_MAX_ROOMS_EXCEEDED,
          message: `동시에 ${WEBSOCKET.MAX_ROOMS_PER_CLIENT}개 이상의 채팅방에 참여할 수 없습니다.`
        });
        return;
      }

      logger.debug('User joining line', { sessionId, lineId: parsedLineId, socketId: socket.id });

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

      logger.debug('Line user count updated', {
        lineId: parsedLineId,
        userCount: activeUsers.get(parsedLineId).size
      });
    } catch (error) {
      logger.error('WebSocket join_line error', { error: error.message, stack: error.stack });
      socket.emit('error', {
        code: ErrorCodes.WS_JOIN_FAILED,
        message: '채팅방 입장에 실패했습니다.'
      });
    }
  });

  // 채팅방 퇴장
  socket.on('leave_line', (data) => {
    try {
      const { lineId } = data;

      if (!lineId) {
        socket.emit('error', {
          code: ErrorCodes.WS_INVALID_REQUEST,
          message: '잘못된 요청입니다.'
        });
        return;
      }

      const parsedLineId = parseInt(lineId);
      if (isNaN(parsedLineId) || parsedLineId < SUBWAY_LINE.MIN_ID || parsedLineId > SUBWAY_LINE.MAX_ID) {
        socket.emit('error', {
          code: ErrorCodes.WS_INVALID_LINE,
          message: '유효하지 않은 호선입니다.'
        });
        return;
      }

      leaveRoom(socket, parsedLineId);
      roomCount = Math.max(0, roomCount - 1);
    } catch (error) {
      logger.error('WebSocket leave_line error', { error: error.message, stack: error.stack });
    }
  });

  // 연결 해제
  socket.on('disconnect', () => {
    logger.info('WebSocket client disconnected', { socketId: socket.id });
    metrics.incCounter('websocket_connections_total', { event: 'disconnect' });
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
    logger.debug('Line user count updated after leave', {
      lineId,
      userCount: activeUsers.get(lineId)?.size || 0
    });
  }
}

// 특정 호선의 활성 사용자 수를 모든 클라이언트에게 브로드캐스트
function broadcastActiveUsers(lineId) {
  const count = getActiveUserCount(lineId);
  metrics.setGauge('active_users_count', { line_id: lineId }, count);

  try {
    const io = socketService.getIO();
    // 해당 호선의 사용자들에게만 전송
    io.to(`line_${lineId}`).emit('active_users_update', {
      lineId,
      count
    });

    // 메인 화면의 모든 사용자에게도 전송
    io.emit('line_users_update', {
      lineId,
      count
    });
  } catch (e) {
    logger.warn('Socket IO not available yet in broadcastActiveUsers');
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
  try {
    const io = socketService.getIO();
    io.to(`line_${lineId}`).emit('new_message', {
      lineId,
      message
    });
    logger.debug('New message broadcasted', { lineId, messageId: message.id });
  } catch (e) {
    logger.warn('Socket IO not available for broadcasting message');
  }
}

// 레거시 함수들 (API 호출용 - 필요시 사용)
function recordActivity(lineId, sessionId) {
  // WebSocket 방식으로 전환했으므로 사용하지 않음
  logger.debug('Legacy recordActivity called', { lineId, sessionId });
}

function removeActivity(lineId, sessionId) {
  // WebSocket 방식으로 전환했으므로 사용하지 않음
  logger.debug('Legacy removeActivity called', { lineId, sessionId });
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
