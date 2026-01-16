const { GoogleGenerativeAI } = require("@google/generative-ai");
const logger = require('../utils/logger');
const ProfanityFilter = require('../utils/profanityFilter');

class AIService {
    constructor(apiKey = process.env.GEMINI_API_KEY) {
        this.model = null;
        this.init(apiKey);
    }

    init(apiKey) {
        if (apiKey) {
            const genAI = new GoogleGenerativeAI(apiKey);
            // Using gemini-1.5-flash which is free and fast, with fail-open logic for quota limits
            this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        } else {
            logger.warn('GEMINI_API_KEY is missing. AI features will be disabled.');
        }
    }

    /**
     * Check if the content is safe.
     * Uses AI (Gemini) as primary filter, falls back to regex-based ProfanityFilter.
     * @param {string} text - The text to check.
     * @returns {Promise<{safe: boolean, reason?: string}>}
     */
    async checkContentSafety(text) {
        // 1차: 로컬 비속어 필터 (빠르고 확실한 기본 방어)
        if (ProfanityFilter.containsProfanity(text)) {
            return { safe: false, reason: '부적절한 표현이 포함되어 있습니다.' };
        }

        // 2차: AI 모델 (더 정교한 컨텍스트 기반 판단)
        if (!this.model) {
            // AI 없으면 로컬 필터만으로 통과
            return { safe: true };
        }

        try {
            const prompt = `
        You are a content moderation assistant.
        Check the user's message for hate speech, explicit violence, sexual content, or severe harassment.
        Permit mild slang or casual expressions.
        Return ONLY a JSON object: { "safe": boolean, "reason": string }.
        "reason" should be a short explanation in Korean if unsafe, otherwise null.

        Message: "${text}"
      `;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const textResponse = response.text();

            // Clean up markdown code blocks if present (Gemini sometimes adds them)
            const jsonStr = textResponse.replace(/^```json\n|\n```$/g, '').trim();

            return JSON.parse(jsonStr);
        } catch (error) {
            logger.error('Gemini Moderation Error:', error);
            // AI 실패 시 로컬 필터를 이미 통과했으므로 허용
            return { safe: true };
        }
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
