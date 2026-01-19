const xss = require('xss');
const { CONTENT, SUBWAY_LINE } = require('../config/constants');
const { createErrorResponse, ErrorCodes } = require('../utils/errorCodes');

const sqlInjectionPattern = /(\bselect\b\s+.+\bfrom\b|\bunion\b\s+\bselect\b|\bdrop\b\s+\btable\b|\binsert\b\s+into\b|\bupdate\b\s+\w+\s+set\b|\bdelete\b\s+from\b|--|\/\*|\*\/)/i;

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

  // XSS prevention: allow harmless symbols like >ㅁ<, block real HTML tags
  const hasHtmlTag = /<\/?[a-z][\s\S]*?>/i.test(content);
  if (hasHtmlTag) {
    return res.status(400).json(createErrorResponse(ErrorCodes.VALIDATION_INVALID_FORMAT));
  }

  const cleanContent = xss(content);
  req.body.content = cleanContent;

  if (sqlInjectionPattern.test(cleanContent)) {
    return res.status(400).json(createErrorResponse(ErrorCodes.VALIDATION_INVALID_FORMAT));
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

  // XSS prevention: allow harmless symbols like >ㅁ<, block real HTML tags
  const hasHtmlTag = /<\/?[a-z][\s\S]*?>/i.test(content);
  if (hasHtmlTag) {
    return res.status(400).json(createErrorResponse(ErrorCodes.VALIDATION_INVALID_FORMAT));
  }

  const cleanContent = xss(content);
  req.body.content = cleanContent;

  if (sqlInjectionPattern.test(cleanContent)) {
    return res.status(400).json(createErrorResponse(ErrorCodes.VALIDATION_INVALID_FORMAT));
  }

  next();
};

module.exports = {
  validatePost,
  validateComment,
};
