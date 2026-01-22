import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { postAPI } from '../services/api';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';
import { checkIsOperatingHours } from '../utils/operatingHours';
import SessionExpiredModal from '../components/SessionExpiredModal';
import { CONTENT, UI } from '../config/constants';
import LinkifyText from '../components/LinkifyText';

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
  const { toasts, error: showError, success: showSuccess, warning: showWarning, hideToast } = useToast();

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

  // Mobile Keyboard Fix (iOS & Android)
  useEffect(() => {
    if (!window.visualViewport) return;

    const handleViewportChange = () => {
      // 1. 헤더 고정 (상단 스크롤 방지)
      // 키보드가 올라오면서 뷰포트가 offsetTop만큼 밀려날 때, 헤더도 같이 내려와야 함
      const header = document.querySelector('.chat-header');
      if (header) {
        // visualViewport.offsetTop: 뷰포트 상단이 레이아웃 상단으로부터 얼마나 떨어져 있는지
        header.style.transform = `translateY(${window.visualViewport.offsetTop}px)`;
      }

      // 2. 입력창 고정 (하단 고정)
      const composer = document.querySelector('.chat-composer');
      if (composer) {
        // Android/iOS 모두 뷰포트 높이가 줄어들므로, 화면 높이 차이만큼 올려줌
        // 단, Android Chrome은 window.innerHeight가 *줄어들지 않는* 경우가 있어 계산 주의
        // visualViewport.height가 실제 보이는 높이.

        // Mobile Safari (iOS) 등
        const keyboardHeight = window.innerHeight - window.visualViewport.height;
        // visualViewport.offsetTop(스크롤된 양) + height가 전체 높이가 되어야 함

        // 가장 확실한 방법: bottom: 0 + transform
        // 하지만 container가 fixed이므로, composer를 뷰포트 하단에 딱 붙이는 계산:

        // composer는 'bottom: 0' fixed임.
        // 키보드가 올라오면 -> visualViewport.height가 줄어듦.
        // layout viewport(window.innerHeight)는 그대로일 수 있음 (iOS).
        // 따라서 그 차이만큼 위로 올려야 함.

        // 단, Android에서는 OS 설정에 따라 window.innerHeight가 같이 줄어들기도 함.
        // 이 경우 keyboardHeight가 0에 가까움 -> transform 필요 없음.

        // safe logic:
        const offsetBottom = window.innerHeight - window.visualViewport.height - window.visualViewport.offsetTop;

        // 심플한 접근: iOS는 확실히 transform 필요. Android는 테스트 필요하나 일반적으로 height 변경됨.
        // 여기서는 기존 iOS 로직을 유지하되, Android도 대응하도록 visualViewport API가 있으면 적용.

        // 더 정확한 계산:
        // 고정된 헤더와 달리 푸터는 '보이는 뷰포트'의 가장 아래에 있어야 함.
        // 뷰포트의 높이가 H, 오프셋이 T일 때,
        // 화면상 좌표계에서 T + H 위치가 시각적 바닥.
        // 레이아웃 전체 높이는 window.innerHeight (L).
        // 기존 bottom:0 요소는 L 위치에 있음.
        // 따라서 (L - (T + H)) 만큼 위로 올려야 함 (-값).

        const scrollOffset = window.visualViewport.offsetTop;
        const viewIdx = window.visualViewport.height;
        const layoutH = window.innerHeight;

        // 올릴 양 = 레이아웃 바닥(L) - (현재 보고있는 바닥(T+H))
        // 예: L=800, T=200, H=400 (키보드 200, 스크롤 200) -> 바닥은 600.
        // 800에 위치한 놈을 600으로 -> -200px 이동.

        const translateY = -(layoutH - (scrollOffset + viewIdx));

        // 미세 조정 (음수값만 허용, 0보다 커지면 안됨)
        composer.style.transform = `translateY(${Math.min(0, translateY)}px)`;
      }
    };

    window.visualViewport.addEventListener('resize', handleViewportChange);
    window.visualViewport.addEventListener('scroll', handleViewportChange);

    // 초기 실행
    handleViewportChange();

    return () => {
      window.visualViewport.removeEventListener('resize', handleViewportChange);
      window.visualViewport.removeEventListener('scroll', handleViewportChange);

      const header = document.querySelector('.chat-header');
      if (header) header.style.transform = '';

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
    }, UI.OPERATING_HOURS_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [navigate]);

  useEffect(() => {
    // useChatSocket 초기화 에러만 표시 (API 에러는 handleSubmit에서 처리)
    if (error && !error.includes('부적절')) showError(error);
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
      client_id: tempId,
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
    scrollToBottom(false);

    // 서버에 전송
    setSubmitting(true);
    try {
      await postAPI.create({
        content: messageContent,
        subway_line_id: parseInt(lineId),
        reply_to: currentReplyTo?.id || null,
      });
      // 성공 시: WebSocket에서 실제 메시지로 교체됨 (임시 메시지는 유지)
    } catch (err) {
      // 실패 시: 임시 메시지 제거 및 에러 표시
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setContent(messageContent); // 내용 복원
      const errorMsg = err.response?.data?.error?.message || err.response?.data?.error || '메시지 작성에 실패했습니다.';
      // AI Cleanbot 메시지는 warning으로 표시 (덜 공격적)
      if (errorMsg.includes('부적절') || errorMsg.includes('Cleanbot')) {
        showWarning(errorMsg);
      } else {
        showError(errorMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleTextareaChange = (e) => {
    setContent(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, CONTENT.TEXTAREA_MAX_HEIGHT)}px`;
    }
  };

  const handleBackClick = async () => {
    await leaveRoom();
    navigate('/');
  };

  // Sort and Group Messages
  const messagesWithDates = React.useMemo(() => {
    const sortedMessages = [...messages].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const result = [];
    let lastDate = null;

    sortedMessages.forEach((message) => {
      const currentDate = getDateLabel(message.created_at);
      if (currentDate !== lastDate) {
        result.push({ type: 'date', label: currentDate });
        lastDate = currentDate;
      }
      result.push({ type: 'message', data: message });
    });
    return result;
  }, [messages]);

  return (
    <div className="chat-container">
      {loading && (
        <div className="chat-loading-overlay" aria-live="polite">
          <div className="spinner"></div>
          <p>채팅방을 불러오는 중...</p>
        </div>
      )}
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
        {!loading && (
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
                const replyTarget = message.reply_to
                  ? messages.find(m => m.id === message.reply_to)
                  : null;
                const replyNickname = replyTarget?.nickname || '익명';
                const replyContent = replyTarget?.content || '삭제된 메시지';

                const messageKey = message.client_id || message.id;
                return (
                  <div key={messageKey} className={`message-wrapper ${isMyMessage ? 'my-message' : ''}`}>
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
                              <div className="reply-preview-title">{replyNickname} 님에게 답장</div>
                              <div className="reply-preview-original">{replyContent}</div>
                              <div className="reply-preview-divider"></div>
                            </div>
                          )}
                          <div className="message-text"><LinkifyText text={message.content} /></div>
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
              <span className="reply-target">{(replyTo.nickname || '익명')} 님에게 답장</span>
            </div>
            <button onClick={() => setReplyTo(null)} className="reply-close">✕</button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="composer-form">
          <textarea
            ref={textareaRef} value={content} onChange={handleTextareaChange}
            placeholder="메시지 보내기" maxLength={CONTENT.MESSAGE_MAX_LENGTH}
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
