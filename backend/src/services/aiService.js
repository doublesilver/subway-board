const OpenAI = require('openai');
const logger = require('../utils/logger');
const ProfanityFilter = require('../utils/profanityFilter');

class AIService {
    constructor(apiKey = process.env.OPENAI_API_KEY) {
        this.client = null;
        this.init(apiKey);
    }

    init(apiKey) {
        if (apiKey) {
            this.client = new OpenAI({ apiKey });
        } else {
            logger.warn('OPENAI_API_KEY is missing. AI features will be disabled.');
        }
    }

    /**
     * Check if the content is safe.
     * Uses AI (OpenAI Moderation) as primary filter, combined with local profanity filter.
     * @param {string} text - The text to check.
     * @returns {Promise<{safe: boolean, reason?: string}>}
     */
    async checkContentSafety(text) {
        // 1차: 로컬 비속어 필터 (빠르고 확실한 기본 방어)
        if (ProfanityFilter.containsProfanity(text)) {
            return { safe: false, reason: '부적절한 표현이 포함되어 있습니다.' };
        }

        // 2차: AI 모델 (더 정교한 컨텍스트 기반 판단)
        if (!this.client) {
            // AI 없으면 로컬 필터만으로 통과
            return { safe: true };
        }

        try {
            const response = await this.client.moderations.create({ input: text });
            const result = response.results[0];

            if (result.flagged) {
                // 카테고리 분석
                const categories = result.categories;
                // true인 카테고리만 추출
                const reasons = Object.keys(categories)
                    .filter(key => categories[key])
                    .map(key => this.translateCategory(key));

                return {
                    safe: false,
                    reason: `부적절한 내용 감지 (${reasons.join(', ')})`
                };
            }

            return { safe: true };
        } catch (error) {
            logger.error('OpenAI Moderation Error:', error);
            // AI 실패 시 로컬 필터를 이미 통과했으므로 허용 (Fail-open)
            return { safe: true };
        }
    }

    translateCategory(category) {
        const map = {
            'sexual': '성적인 내용',
            'hate': '혐오 발언',
            'harassment': '괴롭힘',
            'self-harm': '자해',
            'sexual/minors': '미성년자 관련 성적 내용',
            'hate/threatening': '위협적인 혐오 발언',
            'violence/graphic': '잔인한 폭력',
            'violence': '폭력',
        };
        return map[category] || category;
    }
}

/**
 * Factory function for creating AIService instances
 * Useful for testing with mock API keys
 * @param {string} apiKey - Optional API key override
 * @returns {AIService}
 */
function createAIService(apiKey) {
    return new AIService(apiKey);
}

// Default instance for production use
const defaultInstance = new AIService();

module.exports = {
    AIService,
    createAIService,
    // Default export for backwards compatibility
    checkContentSafety: (text) => defaultInstance.checkContentSafety(text)
};
