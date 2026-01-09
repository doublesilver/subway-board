const pool = require('../db/connection');
const { recordActivity, removeActivity, broadcastNewMessage } = require('../utils/activeUsers');
const { getOrCreateUser } = require('../utils/userHelper');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const getPostsByLine = asyncHandler(async (req, res) => {
  const { lineId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  // 프론트엔드에서 전달한 세션 ID 사용
  const sessionId = req.headers['x-anonymous-id'];
  if (sessionId) {
    recordActivity(lineId, sessionId);
  }

  const offset = (page - 1) * limit;

  const result = await pool.query(
    `SELECT p.*, sl.line_name, sl.line_number, sl.color,
            u.nickname, u.anonymous_id,
            (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND deleted_at IS NULL) as comment_count
      FROM posts p
      JOIN subway_lines sl ON p.subway_line_id = sl.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.subway_line_id = $1 AND p.deleted_at IS NULL
      ORDER BY p.created_at ASC
      LIMIT $2 OFFSET $3`,
    [lineId, limit, offset]
  );

  const countResult = await pool.query(
    'SELECT COUNT(*) FROM posts WHERE subway_line_id = $1 AND deleted_at IS NULL',
    [lineId]
  );

  res.json({
    posts: result.rows,
    total: parseInt(countResult.rows[0].count),
    page: parseInt(page),
    totalPages: Math.ceil(countResult.rows[0].count / limit),
  });
});

const getPostById = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;

  const result = await pool.query(
    `SELECT p.*, sl.line_name, sl.line_number, sl.color
      FROM posts p
      JOIN subway_lines sl ON p.subway_line_id = sl.id
      WHERE p.id = $1 AND p.deleted_at IS NULL`,
    [postId]
  );

  if (result.rows.length === 0) {
    return next(new AppError('No post found with that ID', 404));
  }

  res.json(result.rows[0]);
});

const createPost = asyncHandler(async (req, res, next) => {
  const { content, subway_line_id } = req.body;

  if (!content) {
    return next(new AppError('Content cannot be empty', 400));
  }

  if (!req.user) {
    return next(new AppError('You must be logged in to post', 401));
  }

  const user = await getOrCreateUser(req.user);

  const result = await pool.query(
    `INSERT INTO posts (content, subway_line_id, user_id)
      VALUES ($1, $2, $3)
      RETURNING *`,
    [content, subway_line_id, user.id]
  );

  const newMessage = result.rows[0];

  // WebSocket으로 새 메시지 브로드캐스트
  const enrichedMessage = {
    ...newMessage,
    nickname: user.nickname,
    anonymous_id: user.anonymous_id
  };
  broadcastNewMessage(subway_line_id, enrichedMessage);

  res.status(201).json(newMessage);
});

const deletePost = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;

  if (!req.user) {
    return next(new AppError('You must be logged in to delete', 401));
  }

  const user = await getOrCreateUser(req.user);

  // 게시글 조회 및 권한 확인
  const postResult = await pool.query(
    'SELECT user_id FROM posts WHERE id = $1 AND deleted_at IS NULL',
    [postId]
  );

  if (postResult.rows.length === 0) {
    return next(new AppError('No post found with that ID', 404));
  }

  const post = postResult.rows[0];

  // 작성자 본인 확인
  if (post.user_id !== user.id) {
    return next(new AppError('You do not have permission to delete this post', 403));
  }

  const result = await pool.query(
    'UPDATE posts SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING *',
    [postId]
  );

  res.json({ message: 'Post deleted successfully' });
});

const createJoinMessage = asyncHandler(async (req, res, next) => {
  const { subway_line_id } = req.body;

  if (!req.user) {
    return next(new AppError('You must be logged in', 401));
  }

  const user = await getOrCreateUser(req.user);

  // 입장 시스템 메시지 생성
  const content = `${user.nickname} 님이 들어왔어요`;

  const result = await pool.query(
    `INSERT INTO posts (content, subway_line_id, user_id, message_type)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
    [content, subway_line_id, user.id, 'system']
  );

  const newMessage = result.rows[0];

  // WebSocket으로 입장 메시지 브로드캐스트
  const enrichedMessage = {
    ...newMessage,
    nickname: user.nickname,
    anonymous_id: user.anonymous_id
  };
  broadcastNewMessage(subway_line_id, enrichedMessage);

  res.status(201).json(newMessage);
});

// 퇴장 메시지 생성
const createLeaveMessage = asyncHandler(async (req, res, next) => {
  const { subway_line_id } = req.body;

  if (!req.user) {
    return next(new AppError('You must be logged in', 401));
  }

  const user = await getOrCreateUser(req.user);

  // 프론트엔드에서 전달한 세션 ID 사용
  const sessionId = req.headers['x-anonymous-id'];
  if (sessionId) {
    removeActivity(subway_line_id, sessionId);
  }

  // 퇴장 시스템 메시지 생성
  const content = `${user.nickname} 님이 나갔어요`;

  const result = await pool.query(
    `INSERT INTO posts (content, subway_line_id, user_id, message_type)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
    [content, subway_line_id, user.id, 'system']
  );

  const newMessage = result.rows[0];

  // WebSocket으로 퇴장 메시지 브로드캐스트
  const enrichedMessage = {
    ...newMessage,
    nickname: user.nickname,
    anonymous_id: user.anonymous_id
  };
  broadcastNewMessage(subway_line_id, enrichedMessage);

  res.status(201).json(newMessage);
});

module.exports = {
  getPostsByLine,
  getPostById,
  createPost,
  deletePost,
  createJoinMessage,
  createLeaveMessage,
};

