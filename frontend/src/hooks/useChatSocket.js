import { useState, useEffect, useRef, useCallback } from 'react';
import { postAPI, subwayLineAPI, visitAPI, authAPI } from '../services/api';
import { joinLine, leaveLine, onActiveUsersUpdate, offActiveUsersUpdate, onNewMessage, offNewMessage, reconnectSocket } from '../utils/socket';
import { enterChatRoom, leaveChatRoom, getLineSignature, setLineSignature } from '../utils/temporaryUser';
import { useAuth } from '../contexts/AuthContext';
import { API } from '../config/constants';

// ëª¨ë“ˆ ?¤ì½”???íƒœ ?œê±° (useRefë¡??€ì²´ë¨)

export const useChatSocket = (lineId) => {
    const [messages, setMessages] = useState([]);
    const [lineInfo, setLineInfo] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { setLineUser, removeLineUser } = useAuth();

    const isInitialLoad = useRef(true);
    // ?˜ë™ ?´ì¥ ?¬ë? ì¶”ì  (Ref ?¬ìš©)
    const isLeavingManuallyRef = useRef(false);

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
                // [Security] Signature Check & Issue
                // [Security] Signature Check & Issue (Server-Side ID)
                let signature = getLineSignature(lineId);

                // ?œëª…???†ê±°??legacy/new) ? íš¨?˜ì? ?Šì? ê²½ìš°, ?œë²„ë¡œë?????ID?€ ?œëª…??ë°œê¸‰ë°›ìŒ
                if (!signature) {
                    try {
                        // 1. ?œë²„????ID+?œëª… ?”ì²­
                        const sigResponse = await authAPI.issueAnonymousSignature();
                        const { anonymousId, signature: newSignature } = sigResponse.data;

                        if (anonymousId && newSignature) {
                            // 2. ë¡œì»¬ ?¤í† ë¦¬ì? ?…ë°?´íŠ¸ (ê¸°ì¡´ Client-Side ID ??–´?°ê¸°)
                            setLineSession(lineId, anonymousId);
                            setLineSignature(lineId, newSignature);

                            // 3. ?íƒœ ?…ë°?´íŠ¸
                            signature = newSignature;
                            const newUserData = { ...userData, sessionId: anonymousId };
                            setCurrentUser(newUserData);
                            setLineUser(lineId, newUserData);

                            // joinLine????IDë¡??¤ì‹œ ?¸ì¶œ?´ì•¼ ?????ˆìŒ.
                            // ?˜ì?ë§?socket.js??joinLine?€ ?¨ìˆœ??emitë§???
                            // ë¬¸ì œ??'2. Socket Join' ?¨ê³„?ì„œ ?´ë? êµ¬IDë¡?join???œë„?ˆì„ ???ˆìŒ.
                            // ?°ë¼???¬ê¸°???¬ê???emit)???´ì£¼??ê²ƒì´ ?ˆì „??
                            joinLine(parseInt(lineId), anonymousId);

                            // userData ì°¸ì¡° ?…ë°?´íŠ¸
                            userData.sessionId = anonymousId;
                        }
                    } catch (sigErr) {
                        console.error('Failed to issue identity from server:', sigErr);
                                                return; // Stop initialization
                    }
                }

                const hasJoined = sessionStorage.getItem(hasJoinedKey);
                const isFirstJoin = !hasJoined;

                if (isFirstJoin) {
                    const joinTime = new Date().toISOString();
                    sessionStorage.setItem(joinTimestampKey, joinTime);
                    sessionStorage.setItem(hasJoinedKey, 'true');

                    // Fire and forget calls (?ëŸ¬???œë²„ ë¡œê·¸?ì„œ ì¶”ì )
                    postAPI.createJoinMessage(parseInt(lineId)).catch(() => { });
                    visitAPI.record(parseInt(lineId)).catch(() => { });

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
                setError('???? ????? ??????.');
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
                const alreadyExists = prev.find(m => m.id === data.message.id);
                if (alreadyExists) return prev;

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
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // 6. Before Unload (Leave Message)
        const handleBeforeUnload = () => {
            // ?˜ë™ ?´ì¥(?¤ë¡œê°€ê¸????ŒëŠ” ?´ë? leaveRoom?ì„œ ì²˜ë¦¬??
            if (isLeavingManuallyRef.current) return;

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

            // Ref ?íƒœ?€ ?ê??†ì´ cleanup ?œì—???Œì¼“ ?°ê²° ?´ì œ
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

            // Ref??ì»´í¬?ŒíŠ¸ ?¸ë§ˆ?´íŠ¸ ???ë™ ?Œë©¸?˜ë?ë¡?ë³„ë„ cleanup ë¶ˆí•„??
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lineId]); // setLineUser, removeLineUser??useCallback?¼ë¡œ ?ˆì •?ì¸ ì°¸ì¡°

    // Helpers
    const fetchLineInfo = async () => {
        try {
            const response = await subwayLineAPI.getAll();
            const line = response.data.find((l) => l.id === parseInt(lineId));
            setLineInfo(line);
        } catch {
            // ?œë²„ ë¡œê·¸?ì„œ ì¶”ì 
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
                } catch { /* ìºì‹œ ?Œì‹± ?¤íŒ¨ - ?œë²„?ì„œ ?¤ì‹œ ë¡œë“œ */ }
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
            setError('???? ????? ??????.');
        } finally {
            setLoading(false);
            isInitialLoad.current = false;
        }
    };

    const leaveRoom = useCallback(async () => {
        // Ref ?¬ìš©?˜ì—¬ ?˜ë™ ?´ì¥ ?íƒœ ?¤ì •
        isLeavingManuallyRef.current = true;

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

