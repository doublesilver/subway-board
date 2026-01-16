require('dotenv').config();
const aiService = require('./src/services/aiService');

const fs = require('fs');

async function test() {
    console.log('Testing AI Service with key:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');

    const testMessages = [
        '안녕하세요', // safe
        '꺼져 이 새끼야', // unsafe
    ];

    for (const msg of testMessages) {
        console.log(`\nChecking: "${msg}"`);
        try {
            const result = await aiService.checkContentSafety(msg);
            console.log('Result:', result);
        } catch (error) {
            console.error('Error:', error);
            fs.writeFileSync('error.log', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        }
    }
}

test();
