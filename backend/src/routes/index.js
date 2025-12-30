const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

const subwayLineController = require('../controllers/subwayLineController');
const postController = require('../controllers/postController');
const commentController = require('../controllers/commentController');
const { validatePost, validateComment } = require('../middleware/validator');

// 특수 호선 삭제 (1회성 정리용)
router.post('/admin/cleanup-lines', async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM subway_lines WHERE line_number NOT IN ('1', '2', '3', '4', '5', '6', '7', '8', '9')"
    );
    res.json({
      success: true,
      message: `${result.rowCount}개의 특수 호선이 삭제되었습니다.`,
      deletedCount: result.rowCount
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ error: '정리 작업 실패' });
  }
});

router.get('/subway-lines', subwayLineController.getAllLines);

router.get('/posts/line/:lineId', postController.getPostsByLine);
router.get('/posts/:postId', postController.getPostById);
router.post('/posts', validatePost, postController.createPost);
router.delete('/posts/:postId', postController.deletePost);

router.get('/posts/:postId/comments', commentController.getCommentsByPost);
router.post('/posts/:postId/comments', validateComment, commentController.createComment);
router.delete('/comments/:commentId', commentController.deleteComment);

module.exports = router;
