import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { postAPI, subwayLineAPI } from '../services/api';

// 호선 데이터 캐싱 (HomePage와 공유)
let cachedLines = null;

function LinePage() {
  const { lineId } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [lineInfo, setLineInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchLineInfo();
    fetchPosts();

    // 10초마다 게시글 갱신 (활동 기록 유지 및 새 게시글 확인)
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchPosts();
      }
    }, 10000);

    // Page Visibility API - 포그라운드 복귀 시 즉시 갱신
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchPosts();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [lineId, page]);

  const fetchLineInfo = async () => {
    try {
      // 캐시가 있으면 바로 사용
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

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await postAPI.getByLine(lineId, page);
      setPosts(response.data.posts);
      setTotalPages(response.data.totalPages);
    } catch (err) {
      setError('게시글을 불러오는데 실패했습니다.');
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
      setPage(1);
      fetchPosts();
    } catch (err) {
      const errorMsg = err.response?.data?.error || '게시글 작성에 실패했습니다.';
      alert(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return '방금 전';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    return date.toLocaleDateString('ko-KR');
  };

  if (loading && posts.length === 0 && !lineInfo) return <div className="loading">로딩 중...</div>;

  return (
    <div>
      <Link to="/" className="back-button">
        ← 뒤로가기
      </Link>

      {lineInfo && (
        <div className="line-header">
          <div className="line-header-content">
            <span className="line-indicator-thin" style={{ backgroundColor: lineInfo.color }}></span>
            <div className="line-header-text">
              <h2 className="line-title">{lineInfo.line_name}</h2>
              <p className="line-subtitle">안전한 익명 공간</p>
            </div>
          </div>
        </div>
      )}

      <div className="write-form">
        <form onSubmit={handleSubmit}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="오늘 하루 어떠셨나요? 편하게 이야기해보세요..."
            maxLength={1000}
            disabled={submitting}
          />

          <div className="write-info">
            <div className="write-info-tags">
              <span className="info-tag">🔒 익명으로 작성돼요</span>
              <span className="info-tag">⏰ 오전 9시에 자동 삭제돼요</span>
            </div>
            <span className="char-count">{content.length}/1000</span>
          </div>

          <button
            type="submit"
            className="write-submit-btn"
            disabled={submitting || !content.trim()}
          >
            {submitting ? '작성 중...' : '익명으로 글쓰기'}
          </button>
        </form>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="post-list">
        {posts.length === 0 ? (
          <div className="empty-state">
            첫 번째 글을 작성해보세요!
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="post-item"
              onClick={() => navigate(`/post/${post.id}`)}
            >
              <div className="post-header">
                <span className="post-date">{formatDate(post.created_at)}</span>
              </div>
              <div className="post-content">{post.content}</div>
              <div className="post-meta">
                댓글 {post.comment_count}개
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            이전
          </button>
          <span style={{ padding: '0.5rem 1rem' }}>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}

export default LinePage;
