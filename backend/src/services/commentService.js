const pool = require('../db/connection');
const { getOrCreateUser } = require('../utils/userHelper');
const AppError = require('../utils/AppError');

class CommentService {
    async getCommentsByPost(postId) {
        const result = await pool.query(
            `SELECT * FROM comments
        WHERE post_id = $1 AND deleted_at IS NULL
        ORDER BY created_at ASC`,
            [postId]
        );
        return result.rows;
    }

    async createComment(userContext, { postId, content }) {
        if (!content) {
            throw new AppError('Content cannot be empty', 400);
        }

        if (!userContext) {
            throw new AppError('You must be logged in to comment', 401);
        }

        const user = await getOrCreateUser(userContext);

        const postCheck = await pool.query(
            'SELECT id FROM posts WHERE id = $1 AND deleted_at IS NULL',
            [postId]
        );

        if (postCheck.rows.length === 0) {
            throw new AppError('Post not found', 404);
        }

        const result = await pool.query(
            `INSERT INTO comments (post_id, content, user_id)
        VALUES ($1, $2, $3)
        RETURNING *`,
            [postId, content, user.id]
        );

        return result.rows[0];
    }

    async deleteComment(userContext, commentId) {
        if (!userContext) {
            throw new AppError('You must be logged in to delete', 401);
        }

        const user = await getOrCreateUser(userContext);

        // Check ownership
        const commentResult = await pool.query(
            'SELECT user_id FROM comments WHERE id = $1 AND deleted_at IS NULL',
            [commentId]
        );

        if (commentResult.rows.length === 0) {
            throw new AppError('Comment not found', 404);
        }

        const comment = commentResult.rows[0];

        if (comment.user_id !== user.id) {
            throw new AppError('You do not have permission to delete this comment', 403);
        }

        await pool.query(
            'UPDATE comments SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING *',
            [commentId]
        );

        return { message: 'Comment deleted successfully' };
    }
}

module.exports = new CommentService();
