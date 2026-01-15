import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { postAPI } from '../services/api';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';
import { checkIsOperatingHours } from '../utils/operatingHours';
import SessionExpiredModal from '../components/SessionExpiredModal';

// Custom Hooks
import { useChatSocket } from '../hooks/useChatSocket';
import { useChatScroll } from '../hooks/useChatScroll';
import { useSwipeReply } from '../hooks/useSwipeReply';

// 날짜 구분선 함수
const getDateLabel = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return '오늘';
  if (date.toDateString() === yesterday.toDateString()) return '어제';
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
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

function LinePage() {
  const { lineId } = useParams();
  const navigate = useNavigate();
  const { toasts, error: showError, success: showSuccess, hideToast } = useToast();

  // Custom Hooks
  const { messages, setMessages, lineInfo, currentUser, loading, error, leaveRoom } = useChatSocket(lineId);
  const { messagesContainerRef, messagesEndRef, showScrollButton, handleScroll, scrollToBottom } = useChatScroll(messages);

  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  const textareaRef = useRef(null);

  // Swipe Gesture
  const { swipedMessageId, touchOffset, handleTouchStart, handleTouchMove, handleTouchEnd } = useSwipeReply(currentUser, setReplyTo);

  // iOS Keyboard Fix
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (!isIOS) return;

    const handleViewportResize = () => {
      if (window.visualViewport) {
        const keyboardHeight = window.innerHeight - window.visualViewport.height;
        const composer = document.querySelector('.chat-composer');
        if (composer) composer.style.transform = `translateY(-${keyboardHeight}px)`;
      }
    };

    window.visualViewport?.addEventListener('resize', handleViewportResize);
    window.visualViewport?.addEventListener('scroll', handleViewportResize);
    handleViewportResize();

    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportResize);
      window.visualViewport?.removeEventListener('scroll', handleViewportResize);
      const composer = document.querySelector('.chat-composer');
      if (composer) composer.style.transform = '';
    };
  }, []);

  // Operating Hours Check
  useEffect(() => {
    window.scrollTo(0, 0);
    if (!checkIsOperatingHours()) {
      navigate('/', { replace: true });
      return;
    }
    const interval = setInterval(() => {
      if (!checkIsOperatingHours()) setIsSessionExpired(true);
    }, 60000);
    return () => clearInterval(interval);
  }, [navigate]);

  useEffect(() => {
    if (error) showError(error);
  }, [error, showError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    const messageContent = content.trim();
    const currentReplyTo = replyTo;

    // 낙관적 업데이트: 즉시 화면에 표시
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      content: messageContent,
      nickname: currentUser?.nickname || '익명',
      anonymous_id: currentUser?.sessionId,
      created_at: new Date().toISOString(),
      reply_to: currentReplyTo?.id || null,
      message_type: 'chat',
      _isPending: true, // 전송 중 표시용
    };

    // 즉시 UI 업데이트
    setMessages(prev => [...prev, optimisticMessage]);
    setContent('');
    setReplyTo(null);

    // iOS 키보드 유지를 위한 포커스 처리
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      // iOS에서 키보드가 내려가는 것을 방지하기 위해 즉시 + 지연 포커스
      textareaRef.current.focus();
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 10);
    }
    scrollToBottom();

    // 서버에 전송
    setSubmitting(true);
    try {
      await postAPI.create({
        content: messageContent,
        subway_line_id: parseInt(lineId),
        reply_to: currentReplyTo?.id || null,
      });
      // 성공 시: WebSocket에서 실제 메시지가 오면 중복 제거됨
      // 임시 메시지 제거 (WebSocket 메시지로 대체됨)
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } catch (err) {
      // 실패 시: 임시 메시지 제거 및 에러 표시
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setContent(messageContent); // 내용 복원
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

  const handleBackClick = async () => {
    await leaveRoom();
    navigate('/');
  };

  // Sort and Group Messages
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

  return (
    <div className="chat-container">
      {isSessionExpired && <SessionExpiredModal onConfirm={() => navigate('/', { replace: true })} />}
      {toasts.map(toast => (
        <Toast key={toast.id} message={toast.message} type={toast.type} duration={toast.duration} onClose={() => hideToast(toast.id)} />
      ))}

      <header className="chat-header">
        <button onClick={handleBackClick} className="chat-back-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        {lineInfo && (
          <>
            <div className="chat-line-badge" style={{ backgroundColor: lineInfo.color }}>{lineInfo.line_number}</div>
            <div className="chat-title-group">
              <h1 className="chat-title">{lineInfo.line_name}</h1>
              <div className="chat-meta">
                <div className="pulse-dot-small"></div>
                <span>{lineInfo.activeUsers || 0}명 참여중</span>
                {currentUser && <span style={{ marginLeft: '8px', opacity: 0.7, fontSize: '0.85rem' }}>· {currentUser.nickname}</span>}
              </div>
            </div>
          </>
        )}
      </header>

      <div className="chat-messages" ref={messagesContainerRef} onScroll={handleScroll}>
        {loading ? (
          <div className="loading-inline">
            <div className="spinner"></div>
            <p>채팅방을 불러오는 중...</p>
          </div>
        ) : (
          <>
            <div className="welcome-notice">
              <div className="welcome-message"><strong>{currentUser?.nickname || '익명'}</strong> 님이 들어왔어요.</div>
              <div className="welcome-warning">이 방을 나가면 이전 대화는 다시 볼 수 없어요.<br />오늘 이야기는 오늘로 끝이에요</div>
            </div>

            {messages.length === 0 ? (
              <div className="empty-state-inline">
                <p className="empty-text">{new Date().getFullYear()}년 {new Date().getMonth() + 1}월 {new Date().getDate()}일</p>
              </div>
            ) : (
              messagesWithDates.map((item, index) => {
                if (item.type === 'date') return <div key={`date-${index}`} className="date-divider"><span>{item.label}</span></div>;

                const message = item.data;
                if (message.message_type === 'system') {
                  const isMyJoinMessage = currentUser && message.content.includes(currentUser.nickname) && message.content.includes('들어왔어요');
                  if (isMyJoinMessage) return null;
                  return <div key={message.id}><div className="system-message"><span>{message.content}</span></div></div>;
                }

                const isMyMessage = currentUser && message.anonymous_id === currentUser.sessionId;
                const isSwipingThis = swipedMessageId === message.id;
                const swipeOffset = isSwipingThis ? touchOffset : 0;

                return (
                  <div key={message.id} className={`message-wrapper ${isMyMessage ? 'my-message' : ''}`}>
                    <div
                      style={{
                        transform: `translateX(${swipeOffset}px)`,
                        transition: isSwipingThis ? 'none' : 'transform 0.2s ease',
                        position: 'relative', display: 'flex', gap: '10px', alignItems: 'flex-end', width: '100%',
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
            <div ref={messagesEndRef} style={{ height: '1px', minHeight: '1px' }} />
          </>
        )}
      </div>

      {showScrollButton && (
        <button className="scroll-to-bottom" onClick={() => scrollToBottom(true)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
          </svg>
        </button>
      )}

      <div className="chat-composer">
        {replyTo && (
          <div className="reply-bar">
            <div className="reply-bar-content">
              <span className="reply-label">답장</span>
              <span className="reply-text">{replyTo.content.substring(0, 40)}</span>
            </div>
            <button onClick={() => setReplyTo(null)} className="reply-close">✕</button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="composer-form">
          <textarea
            ref={textareaRef} value={content} onChange={handleTextareaChange}
            placeholder="메시지 보내기" maxLength={1000}
            className="composer-input"
            onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
          />
          <button
            type="submit"
            className={`composer-send ${content.trim() ? 'active' : ''}`}
            disabled={submitting || !content.trim()}
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
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
