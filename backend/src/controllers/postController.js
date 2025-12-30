const pool = require('../db/connection');
const { recordActivity } = require('../utils/activeUsers');

const getPostsByLine = async (req, res) => {
  try {
    const { lineId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // 세션 ID 생성 또는 가져오기 (IP + User-Agent 기반)
    const sessionId = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    recordActivity(lineId, sessionId);

    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT p.*, sl.line_name, sl.line_number, sl.color,
              (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND deleted_at IS NULL) as comment_count
       FROM posts p
       JOIN subway_lines sl ON p.subway_line_id = sl.id
       WHERE p.subway_line_id = $1 AND p.deleted_at IS NULL
       ORDER BY p.created_at DESC
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
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: '게시글을 불러오는데 실패했습니다.' });
  }
};

const getPostById = async (req, res) => {
  try {
    const { postId } = req.params;

    const result = await pool.query(
      `SELECT p.*, sl.line_name, sl.line_number, sl.color
       FROM posts p
       JOIN subway_lines sl ON p.subway_line_id = sl.id
       WHERE p.id = $1 AND p.deleted_at IS NULL`,
      [postId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: '게시글을 불러오는데 실패했습니다.' });
  }
};

const createPost = async (req, res) => {
  try {
    const { content, subway_line_id } = req.body;

    const result = await pool.query(
      `INSERT INTO posts (content, subway_line_id)
       VALUES ($1, $2)
       RETURNING *`,
      [content, subway_line_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: '게시글 작성에 실패했습니다.' });
  }
};

const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const result = await pool.query(
      'UPDATE posts SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING *',
      [postId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
    }

    res.json({ message: '게시글이 삭제되었습니다.' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: '게시글 삭제에 실패했습니다.' });
  }
};

module.exports = {
  getPostsByLine,
  getPostById,
  createPost,
  deletePost,
};
