import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { postAPI, subwayLineAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// 호선 데이터 캐싱
let cachedLines = null;

// 익명 사용자 색상 해시 함수 (일관된 색상 부여)
const getAnonymousColor = (userId) => {
  if (!userId) return '#CBD5E1'; // 기본 회색

  const colors = [
    '#FECACA', // red-200
    '#FED7AA', // orange-200
    '#FEF08A', // yellow-200
    '#BBF7D0', // green-200
    '#A5F3FC', // cyan-200
    '#BAE6FD', // blue-200
    '#C7D2FE', // indigo-200
    '#DDD6FE', // violet-200
    '#FBCFE8', // pink-200
  ];

  const hash = userId.toString().split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  return colors[Math.abs(hash) % colors.length];
};

// 메시지 그룹핑 함수 (같은 사용자의 연속 메시지)
const groupMessages = (messages) => {
  const groups = [];
  let currentGroup = null;

  messages.forEach((message, index) => {
    const isSameUser = currentGroup && currentGroup.userId === message.user_id;
    const prevMessage = messages[index - 1];
    const timeDiff = prevMessage
      ? new Date(message.created_at) - new Date(prevMessage.created_at)
      : Infinity;

    // 5분 이내 + 같은 사용자면 그룹핑
    if (isSameUser && timeDiff < 300000) {
      currentGroup.messages.push(message);
    } else {
      currentGroup = {
        userId: message.user_id,
        messages: [message],
        color: getAnonymousColor(message.user_id),
      };
      groups.push(currentGroup);
    }
  });

  return groups;
};

// 날짜 구분선을 위한 함수
const getDateLabel = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return '오늘';
  if (date.toDateString() === yesterday.toDateString()) return '어제';

  return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
};

function LinePageImproved() {
  const { lineId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [lineInfo, setLineInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const isInitialLoad = useRef(true);
  const textareaRef = useRef(null);

  // 스크롤을 하단으로 이동
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  // 스크롤 위치 감지
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;

    setShowScrollButton(!isNearBottom);
  };

  useEffect(() => {
    fetchLineInfo();
    fetchMessages();

    // 5초마다 메시지 갱신
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchMessages();
      }
    }, 5000);

    // Page Visibility API
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

  // 메시지 업데이트 시 스크롤
  useEffect(() => {
    if (messages.length > 0) {
      if (isInitialLoad.current) {
        scrollToBottom(false);
        isInitialLoad.current = false;
      } else if (!showScrollButton) {
        // 사용자가 하단 근처에 있을 때만 자동 스크롤
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
      });
      setContent('');
      fetchMessages();

      // textarea 높이 초기화
      if (textareaRef.current) {
        textareaRef.current.style.height = '44px';
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

  // Textarea 자동 높이 조절
  const handleTextareaChange = (e) => {
    setContent(e.target.value);

    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 메시지 그룹핑
  const messageGroups = groupMessages(messages);

  // 날짜별로 메시지 구분
  const messagesWithDates = [];
  let lastDate = null;

  messageGroups.forEach((group) => {
    const firstMessage = group.messages[0];
    const currentDate = getDateLabel(firstMessage.created_at);

    if (currentDate !== lastDate) {
      messagesWithDates.push({ type: 'date', label: currentDate });
      lastDate = currentDate;
    }

    messagesWithDates.push({ type: 'group', data: group });
  });

  if (loading && messages.length === 0 && !lineInfo) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div className="chat-page-improved">
      {/* Compact Header */}
      <header className="chat-header-compact">
        <Link to="/" className="chat-back-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </Link>

        {lineInfo && (
          <div className="chat-header-info">
            <div className="chat-line-badge" style={{ backgroundColor: lineInfo.color }}>
              {lineInfo.line_number}
            </div>
            <h1 className="chat-title-compact">{lineInfo.line_name}</h1>

            <button
              className="chat-info-btn"
              onClick={() => setShowInfoTooltip(!showInfoTooltip)}
              aria-label="채팅방 정보"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4M12 8h.01"/>
              </svg>
            </button>

            {showInfoTooltip && (
              <div className="chat-info-tooltip">
                🕘 매일 오전 9시 자동 초기화
              </div>
            )}
          </div>
        )}
      </header>

      {/* Messages Area */}
      <div
        className="chat-messages-improved"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {error && <div className="error-message">{error}</div>}

        {messages.length === 0 ? (
          <div className="empty-chat-improved">
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

            const group = item.data;
            const isMyMessage = user && !user.isAnonymous && group.userId === user.id;

            return (
              <div
                key={`group-${index}`}
                className={`message-group ${isMyMessage ? 'my-message' : ''}`}
              >
                {!isMyMessage && (
                  <div
                    className="anonymous-indicator"
                    style={{ backgroundColor: group.color }}
                  />
                )}

                <div className="message-group-content">
                  {group.messages.map((message, msgIndex) => (
                    <div key={message.id} className="message-bubble-improved">
                      <p className="message-text">{message.content}</p>

                      {/* 마지막 메시지에만 시간 표시 */}
                      {msgIndex === group.messages.length - 1 && (
                        <div className="message-meta">
                          <span className="message-time-improved">
                            {formatTime(message.created_at)}
                          </span>

                          {isMyMessage && (
                            <button
                              onClick={() => handleDeleteMessage(message.id)}
                              className="message-delete-btn-improved"
                              aria-label="메시지 삭제"
                            >
                              삭제
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollButton && (
        <button
          className="scroll-to-bottom"
          onClick={() => scrollToBottom(true)}
          aria-label="최신 메시지로 이동"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M19 12l-7 7-7-7"/>
          </svg>
        </button>
      )}

      {/* Composer (Input Area) */}
      <div className="chat-composer">
        <form onSubmit={handleSubmit}>
          <div className="composer-input-wrapper">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleTextareaChange}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="메시지를 입력하세요"
              maxLength={1000}
              disabled={submitting}
              className="composer-textarea"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />

            <button
              type="submit"
              className={`composer-send-btn ${content.trim() ? 'active' : ''}`}
              disabled={submitting || !content.trim()}
              aria-label="메시지 전송"
            >
              {submitting ? (
                <svg className="spinner" width="24" height="24" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.25"/>
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                </svg>
              )}
            </button>
          </div>

          {/* 하단 정보 (포커스 시 or 입력 중 표시) */}
          {(inputFocused || content.length > 0) && (
            <div className="composer-footer">
              <span className="composer-info">🔒 익명</span>
              <span className="composer-counter">{content.length}/1000</span>
            </div>
          )}
        </form>

        {/* 가벼운 안내 문구 */}
        {!inputFocused && content.length === 0 && (
          <div className="composer-hint">
            🕘 매일 9시 자동 리셋
          </div>
        )}
      </div>
    </div>
  );
}

export default LinePageImproved;
