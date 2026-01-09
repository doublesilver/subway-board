const ProfanityFilter = require('../utils/profanityFilter');
const { CONTENT, SUBWAY_LINE } = require('../config/constants');
const { createErrorResponse, ErrorCodes } = require('../utils/errorCodes');

const validatePost = (req, res, next) => {
  const { content, subway_line_id } = req.body;

  // Content validation
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json(createErrorResponse(ErrorCodes.VALIDATION_EMPTY_CONTENT));
  }

  if (content.length > CONTENT.POST_MAX_LENGTH) {
    return res.status(400).json(createErrorResponse(
      ErrorCodes.VALIDATION_CONTENT_TOO_LONG,
      `내용은 ${CONTENT.POST_MAX_LENGTH}자를 초과할 수 없습니다.`,
      { maxLength: CONTENT.POST_MAX_LENGTH, currentLength: content.length }
    ));
  }

  // Subway line validation
  if (!subway_line_id) {
    return res.status(400).json(createErrorResponse(ErrorCodes.VALIDATION_INVALID_LINE, '호선을 선택해주세요.'));
  }

  const lineId = parseInt(subway_line_id);
  if (isNaN(lineId) || lineId < SUBWAY_LINE.MIN_ID || lineId > SUBWAY_LINE.MAX_ID) {
    return res.status(400).json(createErrorResponse(
      ErrorCodes.VALIDATION_INVALID_LINE,
      `유효하지 않은 호선입니다. (${SUBWAY_LINE.MIN_ID}-${SUBWAY_LINE.MAX_ID}호선만 가능)`,
      { minLine: SUBWAY_LINE.MIN_ID, maxLine: SUBWAY_LINE.MAX_ID }
    ));
  }

  // XSS prevention - check for script tags
  if (/<script[\s\S]*?>[\s\S]*?<\/script>/gi.test(content)) {
    return res.status(400).json(createErrorResponse(ErrorCodes.VALIDATION_INVALID_FORMAT));
  }

  // SQL injection prevention - basic check
  const sqlPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi;
  if (sqlPattern.test(content)) {
    return res.status(400).json(createErrorResponse(ErrorCodes.VALIDATION_INVALID_FORMAT));
  }

  try {
    ProfanityFilter.validate(content);
  } catch (error) {
    return res.status(400).json(createErrorResponse(ErrorCodes.VALIDATION_PROFANITY_DETECTED, error.message));
  }

  next();
};

const validateComment = (req, res, next) => {
  const { content } = req.body;

  // Content validation
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json(createErrorResponse(ErrorCodes.VALIDATION_EMPTY_CONTENT, '댓글 내용을 입력해주세요.'));
  }

  if (content.length > CONTENT.COMMENT_MAX_LENGTH) {
    return res.status(400).json(createErrorResponse(
      ErrorCodes.VALIDATION_CONTENT_TOO_LONG,
      `댓글은 ${CONTENT.COMMENT_MAX_LENGTH}자를 초과할 수 없습니다.`,
      { maxLength: CONTENT.COMMENT_MAX_LENGTH, currentLength: content.length }
    ));
  }

  // XSS prevention
  if (/<script[\s\S]*?>[\s\S]*?<\/script>/gi.test(content)) {
    return res.status(400).json(createErrorResponse(ErrorCodes.VALIDATION_INVALID_FORMAT));
  }

  // SQL injection prevention
  const sqlPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi;
  if (sqlPattern.test(content)) {
    return res.status(400).json(createErrorResponse(ErrorCodes.VALIDATION_INVALID_FORMAT));
  }

  try {
    ProfanityFilter.validate(content);
  } catch (error) {
    return res.status(400).json(createErrorResponse(ErrorCodes.VALIDATION_PROFANITY_DETECTED, error.message));
  }

  next();
};

module.exports = {
  validatePost,
  validateComment,
};
