import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { postAPI, subwayLineAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { enterChatRoom, leaveChatRoom, getCurrentLineUser } from '../utils/temporaryUser';

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
  const { getLineUser, setLineUser, removeLineUser } = useAuth();
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

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const isInitialLoad = useRef(true);
  const textareaRef = useRef(null);

  // 채팅방 입장 - 임시 사용자 생성 및 입장 메시지 전송
  useEffect(() => {
    const userData = enterChatRoom(lineId);
    setCurrentUser(userData);
    setLineUser(lineId, userData);

    // 입장 메시지 생성
    const sendJoinMessage = async () => {
      try {
        await postAPI.createJoinMessage(parseInt(lineId));
      } catch (err) {
        console.error('Failed to send join message:', err);
      }
    };

    sendJoinMessage();

    // 채팅방 퇴장 - cleanup
    return () => {
      leaveChatRoom(lineId);
      removeLineUser(lineId);
    };
  }, [lineId]);

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
    fetchLineInfo();
    fetchMessages();

    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchMessages();
      }
    }, 5000);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchMessages();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [lineId]);

  useEffect(() => {
    if (messages.length > 0) {
      if (isInitialLoad.current) {
        scrollToBottom(false);
        isInitialLoad.current = false;
      } else if (!showScrollButton) {
        scrollToBottom(true);
      }
    }
  }, [messages]);

  const fetchLineInfo = async () => {
    try {
      if (cachedLines) {
        const line = cachedLines.find((l) => l.id === parseInt(lineId));
        setLineInfo(line);
      } else {
        const response = await subwayLineAPI.getAll();
        cachedLines = response.data;
        const line = response.data.find((l) => l.id === parseInt(lineId));
        setLineInfo(line);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await postAPI.getByLine(lineId, 1, 100);
      setMessages(response.data.posts);
    } catch (err) {
      setError('메시지를 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
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

      // 메시지 전송 후 즉시 목록 새로고침
      await fetchMessages();

      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || '메시지 작성에 실패했습니다.';
      alert(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('메시지를 삭제하시겠습니까?')) return;

    try {
      await postAPI.delete(messageId);
      await fetchMessages();
    } catch (err) {
      const errorMsg = err.response?.data?.error || '메시지 삭제에 실패했습니다.';
      alert(errorMsg);
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
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div className="chat-container">
      {/* 헤더 */}
      <header className="chat-header">
        <Link to="/" className="chat-back-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>

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

        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <p className="empty-title">첫 메시지를 남겨보세요</p>
            <p className="empty-subtitle">이 대화는 매일 9시에 리셋됩니다</p>
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
              return (
                <div key={message.id} className="system-message">
                  <span>{message.content}</span>
                </div>
              );
            }

            const isMyMessage = currentUser && message.anonymous_id === currentUser.sessionId;

            // 디버깅용 로그
            if (index === 339) {
              console.log('Message debug:', {
                messageId: message.id,
                messageAnonymousId: message.anonymous_id,
                currentUserSessionId: currentUser?.sessionId,
                isMyMessage,
                nickname: message.nickname
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
                      {isMyMessage && (
                        <button
                          onClick={() => handleDeleteMessage(message.id)}
                          className="message-delete-btn"
                        >
                          삭제
                        </button>
                      )}
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

        <div ref={messagesEndRef} />
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
