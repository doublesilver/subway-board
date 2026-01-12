const pool = require('../db/connection');
const logger = require('../utils/logger');

// 피드백 제출
exports.submitFeedback = async (req, res, next) => {
    try {
        const { content } = req.body;
        const userSessionId = req.user?.sessionId || null;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('user-agent');

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: '피드백 내용을 입력해주세요.' });
        }

        if (content.length > 2000) {
            return res.status(400).json({ error: '피드백은 2000자를 초과할 수 없습니다.' });
        }

        const result = await pool.query(
            `INSERT INTO feedback (content, user_session_id, ip_address, user_agent)
             VALUES ($1, $2, $3, $4)
             RETURNING id, created_at`,
            [content.trim(), userSessionId, ipAddress, userAgent]
        );

        logger.info('Feedback submitted', {
            feedbackId: result.rows[0].id,
            userSessionId,
            contentLength: content.length
        });

        res.status(201).json({
            success: true,
            message: '소중한 피드백 감사합니다!',
            feedback: result.rows[0]
        });
    } catch (error) {
        logger.error('Feedback submission error:', error);
        next(error);
    }
};

// 피드백 목록 조회 (관리자용)
exports.getAllFeedback = async (req, res, next) => {
    try {
        const { limit = 50, offset = 0 } = req.query;

        const result = await pool.query(
            `SELECT id, content, user_session_id, created_at, ip_address
             FROM feedback
             ORDER BY created_at DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        const countResult = await pool.query('SELECT COUNT(*) FROM feedback');
        const total = parseInt(countResult.rows[0].count);

        res.json({
            success: true,
            feedback: result.rows,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        logger.error('Feedback fetch error:', error);
        next(error);
    }
};
