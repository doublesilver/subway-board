const asyncHandler = require('../utils/asyncHandler');
const postService = require('../services/postService');
const { recordActivity, removeActivity } = require('../utils/activeUsers');

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: Post management
 */

/**
 * @swagger
 * /api/posts/line/{lineId}:
 *   get:
 *     summary: Get posts by subway line
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: lineId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Subway line ID (1-9)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of posts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
 *                   type: array
 *                   items:
 *                     type: object
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 */
const getPostsByLine = asyncHandler(async (req, res) => {
  const { lineId } = req.params;
  const { page, limit } = req.query;

  // Activity Recording (Side-effect)
  // Maintains existing behavior of recording activity when header is present
  const sessionId = req.headers['x-anonymous-id'];
  if (sessionId) {
    recordActivity(lineId, sessionId);
  }

  const result = await postService.getPostsByLine(lineId, page, limit);
  res.json(result);
});

/**
 * @swagger
 * /api/posts/{postId}:
 *   get:
 *     summary: Get a post by ID
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post details
 *       404:
 *         description: Post not found
 */
const getPostById = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const post = await postService.getPostById(postId);
  res.json(post);
});

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create a new post
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
 *               - content
 *               - subway_line_id
 *             properties:
 *               content:
 *                 type: string
 *               subway_line_id:
 *                 type: integer
 *               reply_to:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Post created
 *       400:
 *         description: Invalid input or content blocked by AI
 *       401:
 *         description: Unauthorized
 */
const createPost = asyncHandler(async (req, res) => {
  const newMessage = await postService.createPost(req.user, req.body);
  res.status(201).json(newMessage);
});

const deletePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const result = await postService.deletePost(req.user, postId);
  res.json(result);
});

const createJoinMessage = asyncHandler(async (req, res) => {
  const { subway_line_id } = req.body;
  const newMessage = await postService.createSystemMessage(req.user, {
    subway_line_id,
    type: 'join'
  });
  res.status(201).json(newMessage);
});

const createLeaveMessage = asyncHandler(async (req, res) => {
  const { subway_line_id } = req.body;

  // Side-effect: Remove activity
  const sessionId = req.headers['x-anonymous-id'];
  if (sessionId) {
    removeActivity(subway_line_id, sessionId);
  }

  const newMessage = await postService.createSystemMessage(req.user, {
    subway_line_id,
    type: 'leave'
  });
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
