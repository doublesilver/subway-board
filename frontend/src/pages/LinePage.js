import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { postAPI, subwayLineAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// 호선 데이터 캐싱
let cachedLines = null;

// 익명 사용자 색상 해시 함수
const getAnonymousColor = (userId) => {
  if (!userId) return '#95A5A6';

  const colors = [
    '#E74C3C', '#E67E22', '#F39C12', '#F1C40F',
    '#2ECC71', '#1ABC9C', '#3498DB', '#9B59B6',
    '#34495E', '#E91E63', '#FF5722', '#795548'
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
  const { user } = useAuth();
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
      fetchMessages();

      if (textareaRef.current) {
        textareaRef.current.style.height = '20px';
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
      fetchMessages();
    } catch (err) {
      const errorMsg = err.response?.data?.error || '메시지 삭제에 실패했습니다.';
      alert(errorMsg);
    }
  };

  const handleTextareaChange = (e) => {
    setContent(e.target.value);

    if (textareaRef.current) {
      textareaRef.current.style.height = '20px';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
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

  // 터치 이벤트 핸들러 (스와이프 답장)
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

    // 가로 스와이프가 세로 스와이프보다 크면
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault();

      const isMyMessage = user && !user.isAnonymous && message.user_id === user.id;

      if (isMyMessage) {
        // 내 메시지: 왼쪽으로 스와이프 (음수)
        if (deltaX < 0 && deltaX > -80) {
          setTouchOffset(deltaX);
        }
      } else {
        // 다른 사람 메시지: 오른쪽으로 스와이프 (양수)
        if (deltaX > 0 && deltaX < 80) {
          setTouchOffset(deltaX);
        }
      }
    }
  };

  const handleTouchEnd = (message) => {
    const isMyMessage = user && !user.isAnonymous && message.user_id === user.id;

    if (isMyMessage && touchOffset < -40) {
      // 내 메시지를 왼쪽으로 충분히 스와이프
      setReplyTo(message);
    } else if (!isMyMessage && touchOffset > 40) {
      // 다른 사람 메시지를 오른쪽으로 충분히 스와이프
      setReplyTo(message);
    }

    setTouchOffset(0);
    setSwipedMessageId(null);
  };

  // 날짜별로 메시지 구분
  const messagesWithDates = [];
  let lastDate = null;

  messages.forEach((message) => {
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
    <div className="kakao-chat">
      {/* 헤더 */}
      <header className="kakao-header">
        <Link to="/" className="kakao-back">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
          </svg>
        </Link>

        {lineInfo && (
          <div className="kakao-header-info">
            <h1 className="kakao-title">{lineInfo.line_name}</h1>
            <p className="kakao-subtitle">{messages.length}개 메시지 · 매일 9시 리셋</p>
          </div>
        )}
      </header>

      {/* 메시지 영역 */}
      <div
        className="kakao-messages"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {error && <div className="error-message">{error}</div>}

        {messages.length === 0 ? (
          <div className="kakao-empty">
            <div className="kakao-empty-icon">💬</div>
            <p className="kakao-empty-text">첫 메시지를 남겨보세요</p>
          </div>
        ) : (
          messagesWithDates.map((item, index) => {
            if (item.type === 'date') {
              return (
                <div key={`date-${index}`} className="kakao-date">
                  {item.label}
                </div>
              );
            }

            const message = item.data;
            const isMyMessage = user && !user.isAnonymous && message.user_id === user.id;
            const userColor = getAnonymousColor(message.user_id);
            const isSwipingThis = swipedMessageId === message.id;
            const swipeOffset = isSwipingThis ? touchOffset : 0;

            return (
              <div
                key={message.id}
                className={`kakao-message-wrapper ${isMyMessage ? 'my' : 'other'}`}
              >
                <div
                  className="kakao-message-container"
                  style={{
                    transform: `translateX(${swipeOffset}px)`,
                    transition: isSwipingThis ? 'none' : 'transform 0.2s ease',
                  }}
                  onTouchStart={(e) => handleTouchStart(e, message)}
                  onTouchMove={(e) => handleTouchMove(e, message)}
                  onTouchEnd={() => handleTouchEnd(message)}
                >
                  {!isMyMessage && (
                    <div
                      className="kakao-avatar"
                      style={{ backgroundColor: userColor }}
                    >
                      {message.user_id % 100}
                    </div>
                  )}

                  <div className="kakao-message-content">
                    {!isMyMessage && (
                      <div className="kakao-username" style={{ color: userColor }}>
                        익명 #{message.user_id % 1000}
                      </div>
                    )}

                    <div className={`kakao-bubble ${isMyMessage ? 'my' : 'other'}`}>
                      {message.reply_to && (
                        <div className="kakao-reply-preview">
                          <div className="kakao-reply-bar"></div>
                          <div className="kakao-reply-text">
                            답장: {messages.find(m => m.id === message.reply_to)?.content?.substring(0, 30) || '삭제된 메시지'}
                          </div>
                        </div>
                      )}
                      <div className="kakao-text">{message.content}</div>
                    </div>

                    <div className="kakao-message-footer">
                      <span className="kakao-time">{formatTime(message.created_at)}</span>
                      {isMyMessage && (
                        <button
                          onClick={() => handleDeleteMessage(message.id)}
                          className="kakao-delete"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 스와이프 답장 아이콘 */}
                {isSwipingThis && Math.abs(swipeOffset) > 20 && (
                  <div className={`kakao-reply-icon ${isMyMessage ? 'left' : 'right'}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
                    </svg>
                  </div>
                )}
              </div>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 하단으로 스크롤 버튼 */}
      {showScrollButton && (
        <button
          className="kakao-scroll-down"
          onClick={() => scrollToBottom(true)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
          </svg>
        </button>
      )}

      {/* 입력 영역 */}
      <div className="kakao-input-wrapper">
        {replyTo && (
          <div className="kakao-reply-bar">
            <div className="kakao-reply-info">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
              </svg>
              <span>답장: {replyTo.content.substring(0, 30)}</span>
            </div>
            <button onClick={() => setReplyTo(null)} className="kakao-reply-close">
              ✕
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="kakao-input-form">
          <button type="button" className="kakao-plus-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </button>

          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextareaChange}
            placeholder="메시지를 입력하세요"
            maxLength={1000}
            disabled={submitting}
            className="kakao-input"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />

          <button
            type="submit"
            className={`kakao-send-btn ${content.trim() ? 'active' : ''}`}
            disabled={submitting || !content.trim()}
          >
            {submitting ? '...' : '전송'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LinePage;
