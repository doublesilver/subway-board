import { useState, useEffect, useRef, useCallback } from 'react';
import { postAPI, subwayLineAPI, visitAPI } from '../services/api';
import { joinLine, leaveLine, onActiveUsersUpdate, offActiveUsersUpdate, onNewMessage, offNewMessage, reconnectSocket } from '../utils/socket';
import { enterChatRoom, leaveChatRoom } from '../utils/temporaryUser';
import { useAuth } from '../contexts/AuthContext';
import { API } from '../config/constants';

// 모듈 스코프 상태: 수동 퇴장 여부 추적 (window 전역 변수 대신 사용)
const leavingManuallyMap = new Map();

export const useChatSocket = (lineId) => {
    const [messages, setMessages] = useState([]);
    const [lineInfo, setLineInfo] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { setLineUser, removeLineUser } = useAuth();

    const isInitialLoad = useRef(true);

    useEffect(() => {
        // 1. Room Entry & User Setup
        const userData = enterChatRoom(lineId);
        setCurrentUser(userData);
        setLineUser(lineId, userData);

        // 2. Socket Join
        joinLine(parseInt(lineId), userData.sessionId);

        // 3. Init Logic (Join Time, Messages, etc)
        const joinTimestampKey = `line_${lineId}_join_time`;
        const hasJoinedKey = `line_${lineId}_has_joined`;

        const initChat = async () => {
            try {
                const hasJoined = sessionStorage.getItem(hasJoinedKey);
                const isFirstJoin = !hasJoined;

                if (isFirstJoin) {
                    const joinTime = new Date().toISOString();
                    sessionStorage.setItem(joinTimestampKey, joinTime);
                    sessionStorage.setItem(hasJoinedKey, 'true');

                    // Fire and forget calls (에러는 서버 로그에서 추적)
                    postAPI.createJoinMessage(parseInt(lineId)).catch(() => {});
                    visitAPI.record(parseInt(lineId)).catch(() => {});

                    await Promise.all([
                        fetchLineInfo(),
                        fetchMessages(true)
                    ]);
                } else {
                    await Promise.all([
                        fetchLineInfo(),
                        fetchMessages(false)
                    ]);
                }
            } catch (err) {
                setError('채팅방을 불러오는데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };

        initChat();

        // 4. Event Listeners
        const handleActiveUsersUpdate = (data) => {
            if (data.lineId === parseInt(lineId)) {
                setLineInfo(prev => prev ? { ...prev, activeUsers: data.count } : null);
            }
        };

        const handleNewMessage = (data) => {
            if (data.lineId !== parseInt(lineId)) return;

            const messagesKey = `line_${lineId}_messages`;
            const joinTime = sessionStorage.getItem(joinTimestampKey);

            setMessages(prev => {
                if (prev.find(m => m.id === data.message.id)) return prev;

                // Filter logic based on join time
                if (joinTime) {
                    const joinDate = new Date(joinTime);
                    const msgDate = new Date(data.message.created_at);
                    if (msgDate < joinDate) return prev;
                }

                const newMessages = [...prev, data.message];
                sessionStorage.setItem(messagesKey, JSON.stringify(newMessages));
                return newMessages;
            });
        };

        onActiveUsersUpdate(handleActiveUsersUpdate);
        onNewMessage(handleNewMessage);

        // 5. Visibility Change (Reconnect)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                reconnectSocket();
                // lineInfo는 WebSocket으로 activeUsers 업데이트됨
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // 6. Before Unload (Leave Message)
        // 모듈 스코프 Map으로 수동 퇴장 여부 추적
        leavingManuallyMap.set(lineId, false);

        const handleBeforeUnload = () => {
            // 수동 퇴장(뒤로가기)일 때는 이미 leaveRoom에서 처리됨
            if (leavingManuallyMap.get(lineId)) return;

            const url = `${API.BASE_URL}/api/posts/leave`;
            const data = JSON.stringify({ subway_line_id: parseInt(lineId) });
            const blob = new Blob([data], { type: 'application/json' });
            navigator.sendBeacon(url, blob);
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        // Cleanup
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);

            leaveLine(parseInt(lineId));
            offActiveUsersUpdate(handleActiveUsersUpdate);
            offNewMessage(handleNewMessage);

            leaveChatRoom(lineId);
            removeLineUser(lineId);

            // Clear Session Logic
            const messagesKey = `line_${lineId}_messages`;
            sessionStorage.removeItem(joinTimestampKey);
            sessionStorage.removeItem(hasJoinedKey);
            sessionStorage.removeItem(messagesKey);

            // 모듈 스코프 상태 정리
            leavingManuallyMap.delete(lineId);
        };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lineId]); // setLineUser, removeLineUser는 useCallback으로 안정적인 참조

    // Helpers
    const fetchLineInfo = async () => {
        try {
            const response = await subwayLineAPI.getAll();
            const line = response.data.find((l) => l.id === parseInt(lineId));
            setLineInfo(line);
        } catch {
            // 서버 로그에서 추적
        }
    };

    const fetchMessages = async (isFirstJoin) => {
        if (isInitialLoad.current) setLoading(true);

        const messagesKey = `line_${lineId}_messages`;

        // Cache check
        if (!isFirstJoin) {
            const cachedMessages = sessionStorage.getItem(messagesKey);
            if (cachedMessages) {
                try {
                    const parsed = JSON.parse(cachedMessages);
                    setMessages(parsed);
                    setLoading(false);
                    return;
                } catch { /* 캐시 파싱 실패 - 서버에서 다시 로드 */ }
            }
        }

        // API Call
        try {
            const response = await postAPI.getByLine(lineId, 1, 100);
            const serverMessages = response.data.posts;

            const joinTime = sessionStorage.getItem(`line_${lineId}_join_time`);
            let filteredMessages = serverMessages;

            if (joinTime) {
                const joinDate = new Date(joinTime);
                filteredMessages = serverMessages.filter(msg => new Date(msg.created_at) >= joinDate);
            }

            setMessages(filteredMessages);
            sessionStorage.setItem(messagesKey, JSON.stringify(filteredMessages));
        } catch {
            setError('메시지를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
            isInitialLoad.current = false;
        }
    };

    const leaveRoom = useCallback(async () => {
        // 모듈 스코프 플래그 설정: beforeunload에서 중복 퇴장 메시지 방지
        leavingManuallyMap.set(lineId, true);

        try {
            await postAPI.createLeaveMessage(parseInt(lineId));
        } catch (error) {
            if (import.meta.env.DEV) {
                console.error('Failed to send leave message:', error);
            }
        }
        // Navigation is handled by caller
    }, [lineId]);

    return {
        messages,
        setMessages, // Exposed in case LinePage needs manual updates
        lineInfo,
        currentUser,
        loading,
        error,
        leaveRoom
    };
};
