import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

let socket = null;

export const initSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('[WebSocket] Connected to server');
    });

    socket.on('disconnect', () => {
      console.log('[WebSocket] Disconnected from server');
    });

    socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error);
    });
  }

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// 채팅방 입장
export const joinLine = (lineId, sessionId) => {
  const sock = getSocket();
  sock.emit('join_line', { lineId, sessionId });
  console.log(`[WebSocket] Joining line ${lineId} with session ${sessionId}`);
};

// 채팅방 퇴장
export const leaveLine = (lineId) => {
  const sock = getSocket();
  sock.emit('leave_line', { lineId });
  console.log(`[WebSocket] Leaving line ${lineId}`);
};

// 활성 사용자 수 업데이트 리스너 등록
export const onActiveUsersUpdate = (callback) => {
  const sock = getSocket();
  sock.on('active_users_update', callback);
};

// 호선별 사용자 수 업데이트 리스너 등록 (메인 화면용)
export const onLineUsersUpdate = (callback) => {
  const sock = getSocket();
  sock.on('line_users_update', callback);
};

// 새 메시지 수신 리스너 등록
export const onNewMessage = (callback) => {
  const sock = getSocket();
  sock.on('new_message', callback);
};

// 리스너 제거
export const offActiveUsersUpdate = (callback) => {
  const sock = getSocket();
  if (callback) {
    sock.off('active_users_update', callback);
  }
};

export const offLineUsersUpdate = (callback) => {
  const sock = getSocket();
  if (callback) {
    sock.off('line_users_update', callback);
  }
};

export const offNewMessage = (callback) => {
  const sock = getSocket();
  if (callback) {
    sock.off('new_message', callback);
  }
};
