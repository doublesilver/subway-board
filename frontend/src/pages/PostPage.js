import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { postAPI, commentAPI } from '../services/api';

function PostPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentContent, setCommentContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [postId]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await postAPI.getById(postId);
      setPost(response.data);
    } catch (err) {
      setError('게시글을 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await commentAPI.getByPost(postId);
      setComments(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    try {
      setSubmitting(true);
      await commentAPI.create(postId, { content: commentContent.trim() });
      setCommentContent('');
      fetchComments();
    } catch (err) {
      const errorMsg = err.response?.data?.error || '댓글 작성에 실패했습니다.';
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

  if (loading) return <div className="loading">로딩 중...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!post) return <div className="error-message">게시글을 찾을 수 없습니다.</div>;

  return (
    <div>
      <Link
        to={`/line/${post.subway_line_id}`}
        className="back-button"
      >
        ← {post.line_name}으로 돌아가기
      </Link>

      <div className="post-list" style={{ marginTop: '1rem' }}>
        <div style={{ borderLeft: `4px solid ${post.color}`, paddingLeft: '1rem' }}>
          <div className="post-header">
            <h3>{post.line_name}</h3>
            <span className="post-date">{formatDate(post.created_at)}</span>
          </div>
          <div className="post-content" style={{ fontSize: '1.1rem', marginTop: '1rem' }}>
            {post.content}
          </div>
        </div>
      </div>

      <div className="comment-section">
        <h3 style={{ marginBottom: '1rem' }}>
          댓글 {comments.length}개
        </h3>

        <div className="write-form" style={{ marginBottom: '1.5rem' }}>
          <form onSubmit={handleCommentSubmit}>
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder="댓글을 입력하세요... (최대 500자)"
              maxLength={500}
              disabled={submitting}
              style={{ minHeight: '80px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: '#666' }}>
                {commentContent.length}/500
              </span>
              <button type="submit" disabled={submitting || !commentContent.trim()}>
                {submitting ? '작성 중...' : '댓글 작성'}
              </button>
            </div>
          </form>
        </div>

        {comments.length === 0 ? (
          <div className="empty-state">
            첫 번째 댓글을 남겨보세요!
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-content">{comment.content}</div>
              <div className="comment-date">{formatDate(comment.created_at)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default PostPage;
