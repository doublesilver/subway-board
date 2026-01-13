import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

let socket = null;
let connectionStatusCallback = null;

export const initSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
      timeout: 20000,
    });

    socket.on('connect', () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[WebSocket] Connected to server');
      }
      if (connectionStatusCallback) {
        connectionStatusCallback('connected');
      }
    });

    socket.on('disconnect', (reason) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[WebSocket] Disconnected from server:', reason);
      }
      if (connectionStatusCallback) {
        connectionStatusCallback('disconnected', reason);
      }
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[WebSocket] Reconnection attempt ${attemptNumber}`);
      }
      if (connectionStatusCallback) {
        connectionStatusCallback('reconnecting', attemptNumber);
      }
    });

    socket.on('reconnect_failed', () => {
      if (process.env.NODE_ENV === 'development') {
        console.error('[WebSocket] Reconnection failed');
      }
      if (connectionStatusCallback) {
        connectionStatusCallback('failed');
      }
    });

    socket.on('connect_error', (error) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('[WebSocket] Connection error:', error);
      }
      if (connectionStatusCallback) {
        connectionStatusCallback('error', error.message);
      }
    });
  }

  return socket;
};

// 연결 상태 콜백 등록
export const onConnectionStatus = (callback) => {
  connectionStatusCallback = callback;
};

// 연결 상태 확인
export const isConnected = () => {
  return socket && socket.connected;
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
  if (process.env.NODE_ENV === 'development') {
    console.log(`[WebSocket] Joining line ${lineId} with session ${sessionId}`);
  }
};

// 채팅방 퇴장
export const leaveLine = (lineId) => {
  const sock = getSocket();
  sock.emit('leave_line', { lineId });
  if (process.env.NODE_ENV === 'development') {
    console.log(`[WebSocket] Leaving line ${lineId}`);
  }
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

// 수동 재연결 (모바일 포그라운드 전환 시 사용)
export const reconnectSocket = () => {
  if (socket && !socket.connected) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[WebSocket] Attempting manual reconnection...');
    }
    socket.connect();
  } else if (!socket) {
    initSocket();
  }
};
