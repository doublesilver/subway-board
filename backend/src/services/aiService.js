const axios = require('axios');
const logger = require('../utils/logger');
const ProfanityFilter = require('../utils/profanityFilter');

class AIService {
    constructor() {
        // OpenAI API Key check
        if (!process.env.OPENAI_API_KEY) {
            logger.warn('OPENAI_API_KEY is missing. AI moderation features will be disabled.');
        }
    }

    /**
     * Check if the content is safe.
     * Uses a 2-step process:
     * 1. Local ProfanityFilter (Zero-latency, 0 cost)
     * 2. OpenAI Moderation API (High accuracy, free tier)
     * 
     * @param {string} text - The text to check.
     * @returns {Promise<{safe: boolean, reason?: string}>}
     */
    async checkContentSafety(text) {
        // 1. Local Filter Check
        if (ProfanityFilter.containsProfanity(text)) {
            logger.info(`[Filter] Blocked by Local Filter: "${text}"`);
            return { safe: false, reason: "부적절한 언어가 포함되어 있습니다." };
        }

        // 2. OpenAI Moderation API Check
        if (!process.env.OPENAI_API_KEY) {
            // Fail-open if no API key
            return { safe: true };
        }

        try {
            const response = await axios.post(
                'https://api.openai.com/v1/moderations',
                { input: text },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                    }
                }
            );

            const result = response.data.results[0];

            if (result.flagged) {
                // Map OpenAI categories to Korean reasons
                const categories = result.categories;
                let reason = "부적절한 내용이 감지되었습니다.";

                if (categories['sexual']) reason = "선정적인 내용이 포함되어 있습니다.";
                else if (categories['hate']) reason = "혐오 발언이 포함되어 있습니다.";
                else if (categories['harassment']) reason = "괴롭힘 또는 혐오 발언이 감지되었습니다.";
                else if (categories['self-harm']) reason = "자해 관련 내용이 감지되었습니다.";
                else if (categories['violence']) reason = "폭력적인 내용이 포함되어 있습니다.";

                logger.info(`[Filter] Blocked by OpenAI: "${text}" (${reason})`);
                return { safe: false, reason };
            }

            return { safe: true };

        } catch (error) {
            logger.error('OpenAI Moderation Error:', error.message);
            // Fallback: allow message if AI fails
            return { safe: true };
        }
    }
}

module.exports = new AIService();
