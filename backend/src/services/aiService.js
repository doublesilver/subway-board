const { GoogleGenerativeAI } = require("@google/generative-ai");
const logger = require('../utils/logger');

class AIService {
    constructor() {
        this.model = null;
        this.init();
    }

    init() {
        if (process.env.GEMINI_API_KEY) {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        } else {
            logger.warn('GEMINI_API_KEY is missing. AI features will be disabled.');
        }
    }

    /**
     * Check if the content is safe.
     * @param {string} text - The text to check.
     * @returns {Promise<{safe: boolean, reason?: string}>}
     */
    async checkContentSafety(text) {
        if (!this.model) {
            // Fail-open if no API key
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
            // Fallback: allow message if AI fails
            return { safe: true };
        }
    }
}

module.exports = new AIService();
