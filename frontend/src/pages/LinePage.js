import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { postAPI, subwayLineAPI } from '../services/api';

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
  }, [lineId, page]);

  const fetchLineInfo = async () => {
    try {
      const response = await subwayLineAPI.getAll();
      const line = response.data.find((l) => l.id === parseInt(lineId));
      setLineInfo(line);
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

  if (loading && !posts.length) return <div className="loading">로딩 중...</div>;

  return (
    <div>
      <Link to="/" className="back-button">
        ← 뒤로가기
      </Link>

      {lineInfo && (
        <h2 style={{ marginBottom: '1.5rem', color: lineInfo.color }}>
          {lineInfo.line_name} 게시판
        </h2>
      )}

      <div className="write-form">
        <form onSubmit={handleSubmit}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="출퇴근길 이야기를 나눠보세요... (최대 1000자)"
            maxLength={1000}
            disabled={submitting}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: '#666' }}>
              {content.length}/1000
            </span>
            <button type="submit" disabled={submitting || !content.trim()}>
              {submitting ? '작성 중...' : '글쓰기'}
            </button>
          </div>
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
