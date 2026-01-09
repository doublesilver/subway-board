const ProfanityFilter = require('../utils/profanityFilter');

const validatePost = (req, res, next) => {
  const { content, subway_line_id } = req.body;

  // Content validation
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ error: '내용을 입력해주세요.' });
  }

  if (content.length > 1000) {
    return res.status(400).json({ error: '내용은 1000자를 초과할 수 없습니다.' });
  }

  // Subway line validation
  if (!subway_line_id) {
    return res.status(400).json({ error: '호선을 선택해주세요.' });
  }

  const lineId = parseInt(subway_line_id);
  if (isNaN(lineId) || lineId < 1 || lineId > 9) {
    return res.status(400).json({ error: '유효하지 않은 호선입니다. (1-9호선만 가능)' });
  }

  // XSS prevention - check for script tags
  if (/<script[\s\S]*?>[\s\S]*?<\/script>/gi.test(content)) {
    return res.status(400).json({ error: '유효하지 않은 내용입니다.' });
  }

  // SQL injection prevention - basic check
  const sqlPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi;
  if (sqlPattern.test(content)) {
    return res.status(400).json({ error: '유효하지 않은 내용입니다.' });
  }

  try {
    ProfanityFilter.validate(content);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  next();
};

const validateComment = (req, res, next) => {
  const { content } = req.body;

  // Content validation
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ error: '댓글 내용을 입력해주세요.' });
  }

  if (content.length > 500) {
    return res.status(400).json({ error: '댓글은 500자를 초과할 수 없습니다.' });
  }

  // XSS prevention
  if (/<script[\s\S]*?>[\s\S]*?<\/script>/gi.test(content)) {
    return res.status(400).json({ error: '유효하지 않은 내용입니다.' });
  }

  // SQL injection prevention
  const sqlPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi;
  if (sqlPattern.test(content)) {
    return res.status(400).json({ error: '유효하지 않은 내용입니다.' });
  }

  try {
    ProfanityFilter.validate(content);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  next();
};

module.exports = {
  validatePost,
  validateComment,
};
