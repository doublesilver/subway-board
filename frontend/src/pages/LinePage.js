import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { postAPI, subwayLineAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { enterChatRoom, leaveChatRoom, getCurrentLineUser } from '../utils/temporaryUser';
import { joinLine, leaveLine, onActiveUsersUpdate, offActiveUsersUpdate, onNewMessage, offNewMessage } from '../utils/socket';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';
import { checkIsOperatingHours } from '../utils/operatingHours';
import SessionExpiredModal from '../components/SessionExpiredModal';

// 호선 데이터 캐싱
let cachedLines = null;

// 익명 사용자 색상 해시 함수
const getAnonymousColor = (userId) => {
  if (!userId) return '#94a3b8';

  const colors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308',
    '#84cc16', '#22c55e', '#10b981', '#14b8a6',
    '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
  ];

  const hash = userId.toString().split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  return colors[Math.abs(hash) % colors.length];
};

// 날짜 구분선 함수
const getDateLabel = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return '오늘';
  if (date.toDateString() === yesterday.toDateString()) return '어제';

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}년 ${month}월 ${day}일`;
};

function LinePage() {
  const { lineId } = useParams();
  const navigate = useNavigate();
  const { getLineUser, setLineUser, removeLineUser } = useAuth();
  const { toasts, error: showError, success: showSuccess, hideToast } = useToast();
  const [currentUser, setCurrentUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [lineInfo, setLineInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [swipedMessageId, setSwipedMessageId] = useState(null);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [touchOffset, setTouchOffset] = useState(0);
  // 세션 만료 상태
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const isInitialLoad = useRef(true);
  const textareaRef = useRef(null);

  // 키패드 높이 관리를 위한 useEffect (iOS만)
  useEffect(() => {
    // iOS에서만 키패드가 올라올 때 입력란을 키패드 위로 이동
    // Android는 브라우저가 자동으로 처리하므로 transform 적용 안 함
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    if (!isIOS) {
      // Android 등 다른 기기에서는 기본값 사용 (transform 없음)
      document.documentElement.style.setProperty('--viewport-height', '100vh');
      return;
    }

    const handleViewportResize = () => {
      if (window.visualViewport) {
        const viewportHeight = window.visualViewport.height;
        document.documentElement.style.setProperty('--viewport-height', `${viewportHeight}px`);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportResize);
      window.visualViewport.addEventListener('scroll', handleViewportResize);

      // 초기 높이 설정
      handleViewportResize();
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportResize);
        window.visualViewport.removeEventListener('scroll', handleViewportResize);
      }
    };
  }, []);

  useEffect(() => {
    // 1. 진입 시 체크
    const isOpen = checkIsOperatingHours();
    if (!isOpen) {
      navigate('/', { replace: true });
      return;
    }

    // 2. 1분마다 운영 시간 종료 체크 (실시간 만료 처리)
    const interval = setInterval(() => {
      const currentlyOpen = checkIsOperatingHours();
      if (!currentlyOpen) {
        setIsSessionExpired(true);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [navigate]);

  // 채팅방 입장 - 임시 사용자 생성 및 입장 메시지 전송
  useEffect(() => {
    const userData = enterChatRoom(lineId);
    setCurrentUser(userData);
    setLineUser(lineId, userData);

    // WebSocket으로 채팅방 입장
    joinLine(parseInt(lineId), userData.sessionId);

    // 입장 시간 기록 (이 시점 이후 메시지만 로드)
    const joinTimestampKey = `line_${lineId}_join_time`;
    const hasJoinedKey = `line_${lineId}_has_joined`;

    const initChat = async () => {
      // 이미 입장한 적이 있는지 확인 (새로고침 구분)
      const hasJoined = sessionStorage.getItem(hasJoinedKey);
      const isFirstJoin = !hasJoined;

      // 처음 입장할 때만 입장 시간 저장
      if (isFirstJoin) {
        const joinTime = new Date().toISOString();
        sessionStorage.setItem(joinTimestampKey, joinTime);
        sessionStorage.setItem(hasJoinedKey, 'true');

        console.log('✅ [LinePage] 첫 입장 - 입장 메시지 전송');

        try {
          await postAPI.createJoinMessage(parseInt(lineId));
        } catch (error) {
          console.error('Failed to send join message:', error);
        }

        // 첫 입장: 입장 시점 이후 메시지만 로드
        fetchLineInfo();
        fetchMessages(true);
      } else {
        console.log('🔄 [LinePage] 새로고침 감지 - 입장 메시지 스킵, 기존 대화 유지');

        // 새로고침: 모든 메시지 로드
        fetchLineInfo();
        fetchMessages(false);
      }
    };

    initChat();

    // WebSocket 활성 사용자 수 업데이트 리스너
    const handleActiveUsersUpdate = (data) => {
      if (data.lineId === parseInt(lineId)) {
        setLineInfo(prev => prev ? { ...prev, activeUsers: data.count } : null);
      }
    };

    // WebSocket 새 메시지 수신 리스너
    const handleNewMessage = (data) => {
      if (data.lineId === parseInt(lineId)) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[WebSocket] New message received:', data.message);
        }

        const messagesKey = `line_${lineId}_messages`;

        // 입장 시점 이후 메시지만 추가
        const joinTime = sessionStorage.getItem(joinTimestampKey);
        if (joinTime) {
          const joinDate = new Date(joinTime);
          const msgDate = new Date(data.message.created_at);

          if (msgDate >= joinDate) {
            setMessages(prev => {
              // 중복 메시지 방지
              if (prev.find(m => m.id === data.message.id)) {
                return prev;
              }
              const newMessages = [...prev, data.message];

              // sessionStorage 업데이트
              sessionStorage.setItem(messagesKey, JSON.stringify(newMessages));

              return newMessages;
            });
          }
        } else {
          // joinTime이 없으면 메시지 추가
          setMessages(prev => {
            if (prev.find(m => m.id === data.message.id)) {
              return prev;
            }
            const newMessages = [...prev, data.message];

            // sessionStorage 업데이트
            sessionStorage.setItem(messagesKey, JSON.stringify(newMessages));

            return newMessages;
          });
        }
      }
    };

    onActiveUsersUpdate(handleActiveUsersUpdate);
    onNewMessage(handleNewMessage);

    // 페이지 이탈 시 퇴장 메시지 전송 (탭 닫기, 브라우저 종료)
    // ⚠️ 새로고침 시에는 입장 플래그를 제거하지 않음
    const handleBeforeUnload = (e) => {
      // sendBeacon으로 페이지 종료 시에도 전송 보장
      const url = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/posts/leave`;
      const data = JSON.stringify({ subway_line_id: parseInt(lineId) });

      // 세션 스토리지에서 사용자 정보 가져오기
      const sessionKey = `line_${lineId}_session`;
      const nicknameKey = `line_${lineId}_nickname`;
      const sessionId = sessionStorage.getItem(sessionKey);
      const nickname = sessionStorage.getItem(nicknameKey);

      // FormData로 전송 (헤더 포함 가능)
      const formData = new FormData();
      formData.append('subway_line_id', parseInt(lineId));
      if (sessionId) formData.append('session_id', sessionId);
      if (nickname) formData.append('nickname', nickname);

      navigator.sendBeacon(url, data);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // 채팅방 퇴장 - cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);

      // WebSocket 퇴장
      leaveLine(parseInt(lineId));
      offActiveUsersUpdate(handleActiveUsersUpdate);
      offNewMessage(handleNewMessage);

      leaveChatRoom(lineId);
      removeLineUser(lineId);

      // sessionStorage 정리
      const messagesKey = `line_${lineId}_messages`;
      sessionStorage.removeItem(joinTimestampKey);
      sessionStorage.removeItem(hasJoinedKey);
      sessionStorage.removeItem(messagesKey);

      // Note: 퇴장 메시지는 handleBackClick에서 명시적으로 전송됨
    };
  }, [lineId]);

  // LinePage에서는 운영 시간 체크를 하지 않음
  // HomePage에서 이미 모달로 차단하므로, 채팅방 안에서는 자유롭게 사용 가능

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;
    setShowScrollButton(!isNearBottom);
  };

  useEffect(() => {
    if (messages.length > 0) {
      // 최초 로딩 시 즉시 스크롤, 이후엔 스크롤 버튼 상태에 따라
      const isFirstLoad = loading;
      if (isFirstLoad) {
        scrollToBottom(false);
      } else if (!showScrollButton) {
        scrollToBottom(true);
      }
    }
  }, [messages, loading, showScrollButton]);

  const fetchLineInfo = async () => {
    try {
      // 항상 최신 데이터 가져오기 (참여자 수 업데이트)
      const response = await subwayLineAPI.getAll();
      const line = response.data.find((l) => l.id === parseInt(lineId));
      setLineInfo(line);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async (isFirstJoin = false) => {
    try {
      // 최초 로딩 시에만 로딩 인디케이터 표시
      if (isInitialLoad.current) {
        setLoading(true);
      }

      const messagesKey = `line_${lineId}_messages`;

      // 새로고침인 경우: sessionStorage에서 메시지 복원
      if (!isFirstJoin) {
        const cachedMessages = sessionStorage.getItem(messagesKey);
        if (cachedMessages) {
          try {
            const parsedMessages = JSON.parse(cachedMessages);
            setMessages(parsedMessages);
            console.log(`🔄 [fetchMessages] 새로고침 - sessionStorage에서 ${parsedMessages.length}개 메시지 복원`);
            return;
          } catch (e) {
            console.error('Failed to parse cached messages:', e);
          }
        }
      }

      // 첫 입장: 서버에서 메시지 가져오기
      const response = await postAPI.getByLine(lineId, 1, 100);
      const serverMessages = response.data.posts;

      // 입장 시점 이후 메시지만 필터링
      const joinTimestampKey = `line_${lineId}_join_time`;
      const joinTime = sessionStorage.getItem(joinTimestampKey);

      let filteredMessages = serverMessages;

      if (joinTime) {
        const joinDate = new Date(joinTime);
        filteredMessages = serverMessages.filter(msg => {
          const msgDate = new Date(msg.created_at);
          return msgDate >= joinDate;
        });
      }

      setMessages(filteredMessages);

      // sessionStorage에 저장
      sessionStorage.setItem(messagesKey, JSON.stringify(filteredMessages));

      console.log(`✅ [fetchMessages] 첫 입장 - 서버에서 ${serverMessages.length}개 중 ${filteredMessages.length}개 표시 및 캐싱`);
    } catch (err) {
      setError('메시지를 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      // 최초 로딩 완료 후 로딩 상태 해제 및 플래그 변경
      if (isInitialLoad.current) {
        setLoading(false);
        isInitialLoad.current = false;
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setSubmitting(true);
      await postAPI.create({
        content: content.trim(),
        subway_line_id: parseInt(lineId),
        reply_to: replyTo?.id || null,
      });
      setContent('');
      setReplyTo(null);

      // WebSocket으로 자동 업데이트되므로 fetchMessages 불필요

      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error?.message || err.response?.data?.error || '메시지 작성에 실패했습니다.';
      showError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTextareaChange = (e) => {
    setContent(e.target.value);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? '오후' : '오전';

    if (hours > 12) hours -= 12;
    if (hours === 0) hours = 12;

    return `${period} ${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  // 터치 이벤트 핸들러
  const handleTouchStart = (e, message) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    });
    setSwipedMessageId(message.id);
  };

  const handleTouchMove = (e, message) => {
    if (swipedMessageId !== message.id) return;

    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    const deltaX = touchX - touchStart.x;
    const deltaY = touchY - touchStart.y;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault();

      const isMyMessage = currentUser && message.anonymous_id === currentUser.sessionId;

      if (isMyMessage) {
        if (deltaX < 0 && deltaX > -80) {
          setTouchOffset(deltaX);
        }
      } else {
        if (deltaX > 0 && deltaX < 80) {
          setTouchOffset(deltaX);
        }
      }
    }
  };

  const handleTouchEnd = (message) => {
    const isMyMessage = currentUser && message.anonymous_id === currentUser.sessionId;

    if (isMyMessage && touchOffset < -40) {
      setReplyTo(message);
    } else if (!isMyMessage && touchOffset > 40) {
      setReplyTo(message);
    }

    setTouchOffset(0);
    setSwipedMessageId(null);
  };

  // 날짜별로 메시지 구분 (먼저 날짜순 정렬)
  const sortedMessages = [...messages].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  const messagesWithDates = [];
  let lastDate = null;

  sortedMessages.forEach((message) => {
    const currentDate = getDateLabel(message.created_at);

    if (currentDate !== lastDate) {
      messagesWithDates.push({ type: 'date', label: currentDate });
      lastDate = currentDate;
    }

    messagesWithDates.push({ type: 'message', data: message });
  });

  if (loading && messages.length === 0 && !lineInfo) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>채팅방을 불러오는 중...</p>
      </div>
    );
  }

  const handleBackClick = async () => {
    // 퇴장 메시지 전송
    try {
      await postAPI.createLeaveMessage(parseInt(lineId));
    } catch (error) {
      console.error('Failed to send leave message:', error);
    }

    // 메인 화면으로 이동 (cleanup에서 나머지 처리됨)
    navigate('/');
  };

  return (
    <div className="chat-container">
      {/* 운영 시간 종료 모달 */}
      {isSessionExpired && (
        <SessionExpiredModal
          onConfirm={() => navigate('/', { replace: true })}
        />
      )}

      {/* Toast 알림 */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => hideToast(toast.id)}
        />
      ))}

      {/* 헤더 */}
      <header className="chat-header">
        <button onClick={handleBackClick} className="chat-back-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        {lineInfo && (
          <>
            <div className="chat-line-badge" style={{ backgroundColor: lineInfo.color }}>
              {lineInfo.line_number}
            </div>
            <div className="chat-title-group">
              <h1 className="chat-title">{lineInfo.line_name}</h1>
              <div className="chat-meta">
                <div className="pulse-dot-small"></div>
                <span>{lineInfo.activeUsers || 0}명 참여중</span>
                {currentUser && (
                  <span style={{ marginLeft: '8px', opacity: 0.7, fontSize: '0.85rem' }}>
                    · {currentUser.nickname}
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </header>


      {/* 메시지 영역 */}
      <div
        className="chat-messages"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading-inline">
            <div className="spinner"></div>
            <p>채팅방을 불러오는 중...</p>
          </div>
        ) : (
          <>
            {/* 입장 안내 메시지 (항상 맨 위에 고정) */}
            <div className="welcome-notice">
              <div className="welcome-message">
                <strong>{currentUser?.nickname || '익명'}</strong> 님이 들어왔어요.
              </div>
              <div className="welcome-warning">
                이 방을 나가면 이전 대화는 다시 볼 수 없어요.<br />
                오늘 이야기는 오늘로 끝이에요
              </div>
            </div>

            {messages.length === 0 ? (
              <div className="empty-state-inline">
                <div className="empty-icon-small">💬</div>
                <p className="empty-text">첫 메시지를 남겨보세요</p>
              </div>
            ) : (
              messagesWithDates.map((item, index) => {
                if (item.type === 'date') {
                  return (
                    <div key={`date-${index}`} className="date-divider">
                      <span>{item.label}</span>
                    </div>
                  );
                }

                const message = item.data;

                // 시스템 메시지 처리
                if (message.message_type === 'system') {
                  if (process.env.NODE_ENV === 'development') {
                    console.log('System message detected:', message);
                  }

                  // 내가 입장한 메시지인지 확인
                  const isMyJoinMessage = currentUser &&
                    message.content.includes(currentUser.nickname) &&
                    message.content.includes('들어왔어요');

                  // 내 입장 메시지는 맨 위 welcome-notice로 표시되므로 여기선 스킵
                  if (isMyJoinMessage) {
                    return null;
                  }

                  // 다른 사람의 입장/퇴장 메시지만 표시
                  return (
                    <div key={message.id}>
                      <div className="system-message">
                        <span>{message.content}</span>
                      </div>
                    </div>
                  );
                }

                const isMyMessage = currentUser && message.anonymous_id === currentUser.sessionId;

                // 디버깅용 로그 (개발 환경에서만)
                if (process.env.NODE_ENV === 'development' && index < 5) {
                  console.log(`Message ${index}:`, {
                    messageId: message.id,
                    messageAnonymousId: message.anonymous_id,
                    currentUserSessionId: currentUser?.sessionId,
                    isMyMessage,
                    nickname: message.nickname,
                    content: message.content?.substring(0, 30)
                  });
                }

                const userColor = getAnonymousColor(message.anonymous_id || message.user_id);
                const isSwipingThis = swipedMessageId === message.id;
                const swipeOffset = isSwipingThis ? touchOffset : 0;

                return (
                  <div
                    key={message.id}
                    className={`message-wrapper ${isMyMessage ? 'my-message' : ''}`}
                  >
                    <div
                      style={{
                        transform: `translateX(${swipeOffset}px)`,
                        transition: isSwipingThis ? 'none' : 'transform 0.2s ease',
                        position: 'relative',
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'flex-end',
                        width: '100%',
                      }}
                      onTouchStart={(e) => handleTouchStart(e, message)}
                      onTouchMove={(e) => handleTouchMove(e, message)}
                      onTouchEnd={() => handleTouchEnd(message)}
                    >
                      <div className="message-content">
                        <div className="message-nickname">{message.nickname || '익명'}</div>
                        <div className={`message-bubble ${isMyMessage ? 'my' : 'other'}`}>
                          {message.reply_to && (
                            <div className="reply-preview">
                              <span className="reply-preview-label">답장:</span> {messages.find(m => m.id === message.reply_to)?.content?.substring(0, 30) || '삭제된 메시지'}
                            </div>
                          )}
                          <div className="message-text">{message.content}</div>
                        </div>

                        <div className="message-meta">
                          <span className="message-time">{formatTime(message.created_at)}</span>
                        </div>
                      </div>

                      {/* 스와이프 아이콘 */}
                      {isSwipingThis && Math.abs(swipeOffset) > 20 && (
                        <div className={`swipe-reply-icon ${isMyMessage ? 'left' : 'right'}`}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        <div ref={messagesEndRef} style={{ height: '1px', minHeight: '1px' }} />
      </div>

      {/* 하단으로 스크롤 버튼 */}
      {showScrollButton && (
        <button
          className="scroll-to-bottom"
          onClick={() => scrollToBottom(true)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
          </svg>
        </button>
      )}

      {/* 입력 영역 */}
      <div className="chat-composer">
        {replyTo && (
          <div className="reply-bar">
            <div className="reply-bar-content">
              <span className="reply-label">답장</span>
              <span className="reply-text">{replyTo.content.substring(0, 40)}</span>
            </div>
            <button onClick={() => setReplyTo(null)} className="reply-close">
              ✕
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="composer-form">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextareaChange}
            placeholder="메시지 보내기"
            maxLength={1000}
            disabled={submitting}
            className="composer-input"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />

          {/* 전송 버튼 */}
          <button
            type="submit"
            className={`composer-send ${content.trim() ? 'active' : ''}`}
            disabled={submitting || !content.trim()}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

export default LinePage;
