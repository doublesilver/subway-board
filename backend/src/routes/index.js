const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

const subwayLineController = require('../controllers/subwayLineController');
const postController = require('../controllers/postController');
const commentController = require('../controllers/commentController');
const authController = require('../controllers/authController');
const feedbackController = require('../controllers/feedbackController');
const { validatePost, validateComment } = require('../middleware/validator');
const { validatePost, validateComment } = require('../middleware/validator');
const authMiddleware = require('../middleware/authMiddleware');
const checkOperatingHours = require('../middleware/checkOperatingHours');

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

// Auth routes
// Kakao login routes (controlled by ENABLE_KAKAO_LOGIN env variable)
if (process.env.ENABLE_KAKAO_LOGIN === 'true') {
  router.get('/auth/kakao', authController.getKakaoAuthURL);
  router.get('/auth/kakao/callback', authController.kakaoCallback);
}
router.get('/auth/me', authController.getCurrentUser);

router.get('/subway-lines', subwayLineController.getAllLines);

router.get('/posts/line/:lineId', postController.getPostsByLine);
router.get('/posts/:postId', postController.getPostById);
router.post('/posts', authMiddleware, checkOperatingHours, validatePost, postController.createPost);
router.post('/posts/join', authMiddleware, checkOperatingHours, postController.createJoinMessage);
router.post('/posts/leave', authMiddleware, postController.createLeaveMessage);
router.delete('/posts/:postId', authMiddleware, postController.deletePost);

router.get('/posts/:postId/comments', commentController.getCommentsByPost);
router.post('/posts/:postId/comments', authMiddleware, validateComment, commentController.createComment);
router.delete('/comments/:commentId', authMiddleware, commentController.deleteComment);

// Feedback routes
router.post('/feedback', authMiddleware, feedbackController.submitFeedback);
router.get('/admin/feedback', feedbackController.getAllFeedback);

module.exports = router;
