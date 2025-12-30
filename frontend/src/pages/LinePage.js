import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { postAPI, subwayLineAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// 호선 데이터 캐싱 (HomePage와 공유)
let cachedLines = null;

function LinePage() {
  const { lineId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [lineInfo, setLineInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const messagesEndRef = useRef(null);

  // 스크롤을 하단으로 이동
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

    // Page Visibility API - 포그라운드 복귀 시 즉시 갱신
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
    scrollToBottom();
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
      const response = await postAPI.getByLine(lineId, 1, 100); // 최근 100개 메시지
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

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return '방금 전';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;

    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && messages.length === 0 && !lineInfo) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div className="chat-page">
      <div className="chat-header">
        <Link to="/" className="chat-back-button">
          ←
        </Link>
        {lineInfo && (
          <div className="chat-header-content">
            <span
              className="chat-line-indicator"
              style={{ backgroundColor: lineInfo.color }}
            ></span>
            <div className="chat-header-text">
              <h2 className="chat-title">{lineInfo.line_name}</h2>
              <p className="chat-subtitle">익명 채팅방 · 매일 9시 초기화</p>
            </div>
          </div>
        )}
      </div>

      <div className="chat-messages">
        {error && <div className="error-message">{error}</div>}

        {messages.length === 0 ? (
          <div className="empty-chat">
            <p>첫 번째 메시지를 보내보세요!</p>
            <p>이 채팅방의 모든 메시지는 매일 오전 9시에 자동 삭제됩니다</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="message-item">
              <div className="message-bubble">
                <div className="message-content">{message.content}</div>
                <div className="message-footer">
                  <span className="message-time">{formatTime(message.created_at)}</span>
                  {user && !user.isAnonymous && message.user_id === user.id && (
                    <button
                      onClick={() => handleDeleteMessage(message.id)}
                      className="message-delete-btn"
                      title="내 메시지 삭제"
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <form onSubmit={handleSubmit}>
          <div className="chat-input-container">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="메시지를 입력하세요..."
              maxLength={1000}
              disabled={submitting}
              rows={1}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={submitting || !content.trim()}
            >
              {submitting ? '...' : '전송'}
            </button>
          </div>
          <div className="chat-input-info">
            <span className="info-tag">🔒 익명</span>
            <span className="char-count">{content.length}/1000</span>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LinePage;
