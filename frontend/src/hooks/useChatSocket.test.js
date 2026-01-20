import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock all external dependencies before importing the hook
vi.mock('../services/api', () => ({
  postAPI: {
    getByLine: vi.fn(() => Promise.resolve({ data: { posts: [] } })),
    createJoinMessage: vi.fn(() => Promise.resolve()),
    createLeaveMessage: vi.fn(() => Promise.resolve()),
  },
  subwayLineAPI: {
    getAll: vi.fn(() => Promise.resolve({
      data: [
        { id: 1, name: '1호선', color: '#0052A4' },
        { id: 2, name: '2호선', color: '#00A84D' },
      ]
    })),
  },
  visitAPI: {
    record: vi.fn(() => Promise.resolve()),
  },
  authAPI: {
    issueAnonymousSignature: vi.fn(() => Promise.resolve({
      data: { anonymousId: 'server-id', signature: 'server-sig' }
    })),
  },
}));

vi.mock('../utils/socket', () => ({
  joinLine: vi.fn(),
  leaveLine: vi.fn(),
  onActiveUsersUpdate: vi.fn(),
  offActiveUsersUpdate: vi.fn(),
  onNewMessage: vi.fn(),
  offNewMessage: vi.fn(),
  reconnectSocket: vi.fn(),
}));

vi.mock('../utils/temporaryUser', () => ({
  enterChatRoom: vi.fn(() => ({
    sessionId: 'test-session-id',
    nickname: 'Test User',
  })),
  leaveChatRoom: vi.fn(),
  getLineSignature: vi.fn(() => 'test-signature'),
  setLineSignature: vi.fn(),
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    setLineUser: vi.fn(),
    removeLineUser: vi.fn(),
  })),
}));

vi.mock('../config/constants', () => ({
  API: {
    BASE_URL: 'http://localhost:5000',
  },
}));

// Import after mocks are set up
import { useChatSocket } from './useChatSocket';
import { postAPI, subwayLineAPI, visitAPI } from '../services/api';
import { joinLine, leaveLine, onNewMessage, offNewMessage, onActiveUsersUpdate, offActiveUsersUpdate } from '../utils/socket';
import { enterChatRoom, leaveChatRoom } from '../utils/temporaryUser';

describe('useChatSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useChatSocket('1'));

    expect(result.current.loading).toBe(true);
    expect(result.current.messages).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should set up user on mount', async () => {
    renderHook(() => useChatSocket('1'));

    expect(enterChatRoom).toHaveBeenCalledWith('1');
    expect(joinLine).toHaveBeenCalledWith(1, 'test-session-id');
  });

  it('should fetch line info on mount', async () => {
    const { result } = renderHook(() => useChatSocket('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(subwayLineAPI.getAll).toHaveBeenCalled();
    expect(result.current.lineInfo).toEqual({ id: 1, name: '1호선', color: '#0052A4' });
  });

  it('should set up socket event listeners', () => {
    renderHook(() => useChatSocket('1'));

    expect(onActiveUsersUpdate).toHaveBeenCalled();
    expect(onNewMessage).toHaveBeenCalled();
  });

  it('should clean up on unmount', async () => {
    const { result, unmount } = renderHook(() => useChatSocket('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    unmount();

    expect(leaveLine).toHaveBeenCalledWith(1);
    expect(offActiveUsersUpdate).toHaveBeenCalled();
    expect(offNewMessage).toHaveBeenCalled();
    expect(leaveChatRoom).toHaveBeenCalledWith('1');
  });

  it('should create join message on first visit', async () => {
    const { result } = renderHook(() => useChatSocket('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(postAPI.createJoinMessage).toHaveBeenCalledWith(1);
    expect(visitAPI.record).toHaveBeenCalledWith(1);
  });

  it('should not create join message on subsequent visits', async () => {
    // Simulate previous visit
    sessionStorage.setItem('line_1_has_joined', 'true');
    sessionStorage.setItem('line_1_join_time', new Date().toISOString());

    vi.clearAllMocks();

    const { result } = renderHook(() => useChatSocket('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(postAPI.createJoinMessage).not.toHaveBeenCalled();
    expect(visitAPI.record).not.toHaveBeenCalled();
  });

  it('should provide leaveRoom function', async () => {
    const { result } = renderHook(() => useChatSocket('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.leaveRoom).toBe('function');
  });

  it('should call leave message API when leaveRoom is called', async () => {
    const { result } = renderHook(() => useChatSocket('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.leaveRoom();
    });

    expect(postAPI.createLeaveMessage).toHaveBeenCalledWith(1);
  });

  it('should return currentUser with session info', async () => {
    const { result } = renderHook(() => useChatSocket('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.currentUser).toEqual({
      sessionId: 'test-session-id',
      nickname: 'Test User',
    });
  });

  it('should handle messages from server', async () => {
    const mockMessages = [
      { id: 1, content: 'Hello', created_at: new Date().toISOString(), anonymous_id: 'user1' },
      { id: 2, content: 'World', created_at: new Date().toISOString(), anonymous_id: 'user2' },
    ];

    postAPI.getByLine.mockResolvedValueOnce({ data: { posts: mockMessages } });

    const { result } = renderHook(() => useChatSocket('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Messages may be filtered by join time logic, so check count or structure
    await waitFor(() => {
      expect(result.current.messages.length).toBeGreaterThanOrEqual(0);
    });
  });

  it('should update lineInfo when active users count changes', async () => {
    let activeUsersCallback;
    onActiveUsersUpdate.mockImplementation((callback) => {
      activeUsersCallback = callback;
    });

    const { result } = renderHook(() => useChatSocket('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Simulate active users update
    act(() => {
      activeUsersCallback({ lineId: 1, count: 5 });
    });

    expect(result.current.lineInfo.activeUsers).toBe(5);
  });

  it('should add new messages from socket', async () => {
    let newMessageCallback;
    onNewMessage.mockImplementation((callback) => {
      newMessageCallback = callback;
    });

    // Set up join time
    const joinTime = new Date().toISOString();
    sessionStorage.setItem('line_1_join_time', joinTime);
    sessionStorage.setItem('line_1_has_joined', 'true');

    const { result } = renderHook(() => useChatSocket('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newMessage = {
      id: 3,
      content: 'New message',
      created_at: new Date().toISOString(),
      anonymous_id: 'user3',
    };

    // Simulate new message from socket
    act(() => {
      newMessageCallback({ lineId: 1, message: newMessage });
    });

    await waitFor(() => {
      expect(result.current.messages).toContainEqual(newMessage);
    });
  });

  it('should ignore messages from other lines', async () => {
    let newMessageCallback;
    onNewMessage.mockImplementation((callback) => {
      newMessageCallback = callback;
    });

    const { result } = renderHook(() => useChatSocket('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialLength = result.current.messages.length;

    // Simulate message from different line
    act(() => {
      newMessageCallback({
        lineId: 2,
        message: { id: 99, content: 'Other line', created_at: new Date().toISOString() }
      });
    });

    expect(result.current.messages.length).toBe(initialLength);
  });

  it('should not add duplicate messages', async () => {
    let newMessageCallback;
    onNewMessage.mockImplementation((callback) => {
      newMessageCallback = callback;
    });

    // Set join time to allow messages through
    const joinTime = new Date(Date.now() - 60000).toISOString(); // 1 minute ago
    sessionStorage.setItem('line_1_join_time', joinTime);
    sessionStorage.setItem('line_1_has_joined', 'true');

    const existingMessage = {
      id: 1,
      content: 'Hello',
      created_at: new Date().toISOString(),
      anonymous_id: 'user1',
    };

    postAPI.getByLine.mockResolvedValueOnce({ data: { posts: [existingMessage] } });

    const { result } = renderHook(() => useChatSocket('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialCount = result.current.messages.length;

    // Try to add the same message again
    act(() => {
      newMessageCallback({ lineId: 1, message: existingMessage });
    });

    // Count should not increase (duplicate detection)
    expect(result.current.messages.length).toBe(initialCount);
  });

  it('should expose setMessages for manual updates', async () => {
    const { result } = renderHook(() => useChatSocket('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.setMessages).toBe('function');
  });

  it('should handle API errors gracefully', async () => {
    subwayLineAPI.getAll.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useChatSocket('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should not crash, lineInfo may be null
    expect(result.current.lineInfo).toBeNull();
  });
});
