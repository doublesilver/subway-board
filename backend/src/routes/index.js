const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

const subwayLineController = require('../controllers/subwayLineController');
const postController = require('../controllers/postController');
const commentController = require('../controllers/commentController');
const authController = require('../controllers/authController');
const feedbackController = require('../controllers/feedbackController');
const visitController = require('../controllers/visitController');
const dashboardController = require('../controllers/dashboardController');
const { validatePost, validateComment } = require('../middleware/validator');
const authMiddleware = require('../middleware/authMiddleware');
const checkOperatingHours = require('../middleware/checkOperatingHours');
const { adminMiddleware, adminLoginMiddleware } = require('../middleware/adminMiddleware');

// 특수 호선 삭제 (1회성 정리용)
router.post('/admin/cleanup-lines', adminMiddleware, async (req, res) => {
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
router.post('/auth/anonymous', authController.issueAnonymousSignature); // 익명 서명 발급

/**
 * @swagger
 * /api/subway-lines:
 *   get:
 *     summary: 전체 지하철 호선 목록 조회
 *     tags: [Subway]
 *     responses:
 *       200:
 *         description: 호선 목록 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   line_number:
 *                     type: string
 *                   line_name:
 *                     type: string
 *                   color:
 *                     type: string
 */
router.get('/subway-lines', subwayLineController.getAllLines);

// Reading endpoints also need auth to verify ownership (if anonymousId provided)
/**
 * @swagger
 * /api/posts/line/{lineId}:
 *   get:
 *     summary: 호선별 게시글 조회
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: lineId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 게시글 목록
 */
router.get('/posts/line/:lineId', authMiddleware, postController.getPostsByLine);
router.get('/posts/:postId', authMiddleware, postController.getPostById);

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: 게시글 작성
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subway_line_id
 *               - content
 *             properties:
 *               subway_line_id:
 *                 type: integer
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: 작성 성공
 */
router.post('/posts', authMiddleware, checkOperatingHours, validatePost, postController.createPost);
router.post('/posts/join', authMiddleware, checkOperatingHours, postController.createJoinMessage); // 입장도 제한
router.post('/posts/leave', authMiddleware, postController.createLeaveMessage); // 퇴장은 허용 (잔류 인원 처리)
router.delete('/posts/:postId', authMiddleware, checkOperatingHours, postController.deletePost);

router.get('/posts/:postId/comments', commentController.getCommentsByPost);
router.post('/posts/:postId/comments', authMiddleware, checkOperatingHours, validateComment, commentController.createComment);
router.delete('/comments/:commentId', authMiddleware, checkOperatingHours, commentController.deleteComment);

// Feedback routes
router.post('/feedback', authMiddleware, feedbackController.submitFeedback);
router.get('/admin/feedback', adminMiddleware, feedbackController.getAllFeedback);

// Visit tracking routes
router.post('/visits', authMiddleware, visitController.recordVisit);
router.get('/admin/stats', adminMiddleware, visitController.getStats);

// Dashboard routes (JWT 기반 인증)
router.post('/dashboard/login', adminLoginMiddleware, dashboardController.login);
router.get('/dashboard/data', dashboardController.verifyToken, dashboardController.getDashboardData);
router.get('/dashboard/raw', dashboardController.verifyToken, dashboardController.getRawData);
router.post('/dashboard/query', dashboardController.verifyToken, dashboardController.executeQuery);

module.exports = router;
