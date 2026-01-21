const asyncHandler = require('../utils/asyncHandler');
const commentService = require('../services/commentService');

const getCommentsByPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const comments = await commentService.getCommentsByPost(postId);
  res.json(comments);
});

const createComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;
  const newComment = await commentService.createComment(req.user, { postId, content });
  res.status(201).json(newComment);
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const result = await commentService.deleteComment(req.user, commentId);
  res.json(result);
});

module.exports = {
  getCommentsByPost,
  createComment,
  deleteComment,
};
