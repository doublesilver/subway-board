const pool = require('../db/connection');
const { getOrCreateUser } = require('../utils/userHelper');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const getCommentsByPost = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;

  const result = await pool.query(
    `SELECT * FROM comments
      WHERE post_id = $1 AND deleted_at IS NULL
      ORDER BY created_at ASC`,
    [postId]
  );

  res.json(result.rows);
});

const createComment = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;
  const { content } = req.body;

  if (!content) {
    return next(new AppError('Content cannot be empty', 400));
  }

  if (!req.user) {
    return next(new AppError('You must be logged in to comment', 401));
  }

  const user = await getOrCreateUser(req.user);

  const postCheck = await pool.query(
    'SELECT id FROM posts WHERE id = $1 AND deleted_at IS NULL',
    [postId]
  );

  if (postCheck.rows.length === 0) {
    return next(new AppError('Post not found', 404));
  }

  const result = await pool.query(
    `INSERT INTO comments (post_id, content, user_id)
      VALUES ($1, $2, $3)
      RETURNING *`,
    [postId, content, user.id]
  );

  res.status(201).json(result.rows[0]);
});

const deleteComment = asyncHandler(async (req, res, next) => {
  const { commentId } = req.params;

  if (!req.user) {
    return next(new AppError('You must be logged in to delete', 401));
  }

  const user = await getOrCreateUser(req.user);

  // 댓글 조회 및 권한 확인
  const commentResult = await pool.query(
    'SELECT user_id FROM comments WHERE id = $1 AND deleted_at IS NULL',
    [commentId]
  );

  if (commentResult.rows.length === 0) {
    return next(new AppError('Comment not found', 404));
  }

  const comment = commentResult.rows[0];

  // 작성자 본인 확인
  if (comment.user_id !== user.id) {
    return next(new AppError('You do not have permission to delete this comment', 403));
  }

  const result = await pool.query(
    'UPDATE comments SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING *',
    [commentId]
  );

  res.json({ message: 'Comment deleted successfully' });
});

module.exports = {
  getCommentsByPost,
  createComment,
  deleteComment,
};
