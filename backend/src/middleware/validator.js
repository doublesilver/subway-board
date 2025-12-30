const ProfanityFilter = require('../utils/profanityFilter');

const validatePost = (req, res, next) => {
  const { content, subway_line_id } = req.body;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: '내용을 입력해주세요.' });
  }

  if (content.length > 1000) {
    return res.status(400).json({ error: '내용은 1000자를 초과할 수 없습니다.' });
  }

  if (!subway_line_id) {
    return res.status(400).json({ error: '호선을 선택해주세요.' });
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

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: '댓글 내용을 입력해주세요.' });
  }

  if (content.length > 500) {
    return res.status(400).json({ error: '댓글은 500자를 초과할 수 없습니다.' });
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
