const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('Listing models...');
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        // Note: The SDK doesn't have a direct 'listModels' method exposed easily on the main class in some versions,
        // but we can try to infer or use a simple generate to check.
        // Actually, checking the docs, we might need to use the REST API manually if SDK doesn't throw helpful error.
        // However, let's try to just run a simple prompt with 'gemini-1.0-pro'

        // Better yet, let's try a different known model name 'gemini-1.0-pro-latest' or just 'gemini-1.0-pro'

        const candidates = ['gemini-pro', 'gemini-1.0-pro', 'gemini-1.5-flash', 'gemini-1.5-pro-latest'];

        for (const name of candidates) {
            process.stdout.write(`Testing ${name}... `);
            try {
                const m = genAI.getGenerativeModel({ model: name });
                const result = await m.generateContent("Hello");
                console.log('SUCCESS');
                return;
            } catch (e) {
                console.log('FAILED');
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

listModels();
