const pool = require('../db/connection');
const { broadcastNewMessage } = require('../utils/activeUsers');
const { getOrCreateUser } = require('../utils/userHelper');
const AppError = require('../utils/AppError');
const { PAGINATION, SUBWAY_LINE } = require('../config/constants');
const { ErrorCodes } = require('../utils/errorCodes');
const { checkContentSafety } = require('./aiService');

class PostService {
    async getPostsByLine(lineId, page = 1, limit = PAGINATION.DEFAULT_LIMIT) {
        // Input validation
        const parsedLineId = parseInt(lineId);
        if (isNaN(parsedLineId) || parsedLineId < SUBWAY_LINE.MIN_ID || parsedLineId > SUBWAY_LINE.MAX_ID) {
            throw AppError.fromErrorCode(ErrorCodes.VALIDATION_INVALID_LINE, 400);
        }

        // Pagination Limit Clamp
        const parsedPage = parseInt(page);
        const parsedLimit = parseInt(limit);
        const safePage = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
        const safeLimit = isNaN(parsedLimit) || parsedLimit < 1 ? PAGINATION.DEFAULT_LIMIT : Math.min(50, parsedLimit);

        const offset = (safePage - 1) * safeLimit;

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
            [lineId, safeLimit, offset]
        );

        const countResult = await pool.query(
            'SELECT COUNT(*) FROM posts WHERE subway_line_id = $1 AND deleted_at IS NULL',
            [lineId]
        );

        return {
            posts: result.rows,
            total: parseInt(countResult.rows[0].count),
            page: safePage,
            totalPages: Math.ceil(countResult.rows[0].count / safeLimit),
        };
    }

    async getPostById(postId) {
        const result = await pool.query(
            `SELECT p.*, sl.line_name, sl.line_number, sl.color
        FROM posts p
        JOIN subway_lines sl ON p.subway_line_id = sl.id
        WHERE p.id = $1 AND p.deleted_at IS NULL`,
            [postId]
        );

        if (result.rows.length === 0) {
            throw AppError.fromErrorCode(ErrorCodes.RESOURCE_POST_NOT_FOUND, 404);
        }

        return result.rows[0];
    }

    async createPost(userContext, { content, subway_line_id, reply_to }) {
        if (!content) {
            throw AppError.fromErrorCode(ErrorCodes.VALIDATION_EMPTY_CONTENT, 400);
        }

        // [AI Cleanbot Integration]
        const safetyResult = await checkContentSafety(content);
        if (!safetyResult.safe) {
            throw new AppError(`AI Cleanbot: ${safetyResult.reason || '부적절한 메시지가 감지되었습니다.'}`, 400);
        }

        if (!userContext) {
            throw AppError.fromErrorCode(ErrorCodes.AUTH_REQUIRED, 401);
        }

        const user = await getOrCreateUser(userContext);

        let replyToId = null;
        if (reply_to !== undefined && reply_to !== null) {
            const parsedReplyTo = parseInt(reply_to);
            if (isNaN(parsedReplyTo)) {
                throw AppError.fromErrorCode(ErrorCodes.VALIDATION_INVALID_FORMAT, 400);
            }

            const replyTarget = await pool.query(
                'SELECT id FROM posts WHERE id = $1 AND subway_line_id = $2 AND deleted_at IS NULL',
                [parsedReplyTo, subway_line_id]
            );

            if (replyTarget.rows.length === 0) {
                throw AppError.fromErrorCode(ErrorCodes.RESOURCE_POST_NOT_FOUND, 404);
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

        // WebSocket Broadcast
        const enrichedMessage = {
            ...newMessage,
            nickname: user.nickname,
            anonymous_id: user.anonymous_id
        };
        broadcastNewMessage(subway_line_id, enrichedMessage);

        return newMessage;
    }

    async deletePost(userContext, postId) {
        if (!userContext) {
            throw AppError.fromErrorCode(ErrorCodes.AUTH_REQUIRED, 401);
        }

        const user = await getOrCreateUser(userContext);

        // Check ownership
        const postResult = await pool.query(
            'SELECT user_id FROM posts WHERE id = $1 AND deleted_at IS NULL',
            [postId]
        );

        if (postResult.rows.length === 0) {
            throw AppError.fromErrorCode(ErrorCodes.RESOURCE_POST_NOT_FOUND, 404);
        }

        const post = postResult.rows[0];

        if (post.user_id !== user.id) {
            throw AppError.fromErrorCode(ErrorCodes.PERMISSION_NOT_OWNER, 403);
        }

        await pool.query(
            'UPDATE posts SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING *',
            [postId]
        );

        return { message: 'Post deleted successfully' };
    }

    async createSystemMessage(userContext, { subway_line_id, type }) {
        if (!userContext) {
            throw AppError.fromErrorCode(ErrorCodes.AUTH_REQUIRED, 401);
        }

        const user = await getOrCreateUser(userContext);

        let content = '';
        if (type === 'join') {
            content = `${user.nickname} 님이 들어왔어요`;
        } else if (type === 'leave') {
            content = `${user.nickname} 님이 나갔어요`;
        } else {
            throw new Error('Invalid system message type');
        }

        const result = await pool.query(
            `INSERT INTO posts (content, subway_line_id, user_id, message_type)
        VALUES ($1, $2, $3, $4)
        RETURNING *`,
            [content, subway_line_id, user.id, 'system']
        );

        const newMessage = result.rows[0];

        const enrichedMessage = {
            ...newMessage,
            nickname: user.nickname,
            anonymous_id: user.anonymous_id
        };
        broadcastNewMessage(subway_line_id, enrichedMessage);

        return newMessage;
    }
}

module.exports = new PostService();
