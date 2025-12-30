const pool = require('../db/connection');

const getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params;

    const result = await pool.query(
      `SELECT * FROM comments
       WHERE post_id = $1 AND deleted_at IS NULL
       ORDER BY created_at ASC`,
      [postId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: '댓글을 불러오는데 실패했습니다.' });
  }
};

const createComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    const postCheck = await pool.query(
      'SELECT id FROM posts WHERE id = $1 AND deleted_at IS NULL',
      [postId]
    );

    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
    }

    const result = await pool.query(
      `INSERT INTO comments (post_id, content)
       VALUES ($1, $2)
       RETURNING *`,
      [postId, content]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: '댓글 작성에 실패했습니다.' });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const result = await pool.query(
      'UPDATE comments SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING *',
      [commentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '댓글을 찾을 수 없습니다.' });
    }

    res.json({ message: '댓글이 삭제되었습니다.' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: '댓글 삭제에 실패했습니다.' });
  }
};

module.exports = {
  getCommentsByPost,
  createComment,
  deleteComment,
};
