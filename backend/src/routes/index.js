const express = require('express');
const router = express.Router();

const subwayLineController = require('../controllers/subwayLineController');
const postController = require('../controllers/postController');
const commentController = require('../controllers/commentController');
const { validatePost, validateComment } = require('../middleware/validator');

router.get('/subway-lines', subwayLineController.getAllLines);

router.get('/posts/line/:lineId', postController.getPostsByLine);
router.get('/posts/:postId', postController.getPostById);
router.post('/posts', validatePost, postController.createPost);
router.delete('/posts/:postId', postController.deletePost);

router.get('/posts/:postId/comments', commentController.getCommentsByPost);
router.post('/posts/:postId/comments', validateComment, commentController.createComment);
router.delete('/comments/:commentId', commentController.deleteComment);

module.exports = router;
