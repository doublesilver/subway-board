const pool = require('../db/connection');
const { recordActivity, removeActivity, broadcastNewMessage } = require('../utils/activeUsers');
const { getOrCreateUser } = require('../utils/userHelper');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { PAGINATION, SUBWAY_LINE } = require('../config/constants');
const { ErrorCodes } = require('../utils/errorCodes');

const getPostsByLine = asyncHandler(async (req, res, next) => {
  const { lineId } = req.params;
  // Input validation
  const parsedLineId = parseInt(lineId);
  if (isNaN(parsedLineId) || parsedLineId < SUBWAY_LINE.MIN_ID || parsedLineId > SUBWAY_LINE.MAX_ID) {
    return next(AppError.fromErrorCode(ErrorCodes.VALIDATION_INVALID_LINE, 400));
  }

  let { page = 1, limit = PAGINATION.DEFAULT_LIMIT } = req.query;

  // [Security] Pagination Limit Clamp
  const parsedPage = parseInt(page);
  const parsedLimit = parseInt(limit);

  page = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
  limit = isNaN(parsedLimit) || parsedLimit < 1 ? PAGINATION.DEFAULT_LIMIT : Math.min(50, parsedLimit); // Max 50, Default if invalid

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
    return next(AppError.fromErrorCode(ErrorCodes.RESOURCE_POST_NOT_FOUND, 404));
  }

  res.json(result.rows[0]);
});

const createPost = asyncHandler(async (req, res, next) => {
  const { content, subway_line_id, reply_to } = req.body;

  if (!content) {
    return next(AppError.fromErrorCode(ErrorCodes.VALIDATION_EMPTY_CONTENT, 400));
  }

  // [AI Cleanbot Integration]
  const { checkContentSafety } = require('../services/aiService');
  const safetyResult = await checkContentSafety(content);
  if (!safetyResult.safe) {
    return next(new AppError(`AI Cleanbot: ${safetyResult.reason || '부적절한 메시지가 감지되었습니다.'}`, 400));
  }

  if (!req.user) {
    return next(AppError.fromErrorCode(ErrorCodes.AUTH_REQUIRED, 401));
  }

  const user = await getOrCreateUser(req.user);

  let replyToId = null;
  if (reply_to !== undefined && reply_to !== null) {
    const parsedReplyTo = parseInt(reply_to);
    if (isNaN(parsedReplyTo)) {
      return next(AppError.fromErrorCode(ErrorCodes.VALIDATION_INVALID_FORMAT, 400));
    }

    const replyTarget = await pool.query(
      'SELECT id FROM posts WHERE id = $1 AND subway_line_id = $2 AND deleted_at IS NULL',
      [parsedReplyTo, subway_line_id]
    );

    if (replyTarget.rows.length === 0) {
      return next(AppError.fromErrorCode(ErrorCodes.RESOURCE_POST_NOT_FOUND, 404));
    }

    replyToId = parsedReplyTo;
  }

  const result = await pool.query(
    `INSERT INTO posts (content, subway_line_id, user_id, reply_to)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
    [content, subway_line_id, user.id, replyToId]
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
    return next(AppError.fromErrorCode(ErrorCodes.AUTH_REQUIRED, 401));
  }

  const user = await getOrCreateUser(req.user);

  // 게시글 조회 및 권한 확인
  const postResult = await pool.query(
    'SELECT user_id FROM posts WHERE id = $1 AND deleted_at IS NULL',
    [postId]
  );

  if (postResult.rows.length === 0) {
    return next(AppError.fromErrorCode(ErrorCodes.RESOURCE_POST_NOT_FOUND, 404));
  }

  const post = postResult.rows[0];

  // 작성자 본인 확인
  if (post.user_id !== user.id) {
    return next(AppError.fromErrorCode(ErrorCodes.PERMISSION_NOT_OWNER, 403));
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
    return next(AppError.fromErrorCode(ErrorCodes.AUTH_REQUIRED, 401));
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
    return next(AppError.fromErrorCode(ErrorCodes.AUTH_REQUIRED, 401));
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

