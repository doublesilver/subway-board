require('dotenv').config();
const aiService = require('./src/services/aiService');

async function verify() {
    console.log('Verifying AI Service with gemini-2.0-flash...');
    try {
        const safeMsg = "안녕하세요";
        const unsafeMsg = "꺼져 이 새끼야";

        console.log(`Checking safely: "${safeMsg}"`);
        const res1 = await aiService.checkContentSafety(safeMsg);
        console.log('Result 1:', res1);

        console.log(`Checking unsafe: "${unsafeMsg}"`);
        const res2 = await aiService.checkContentSafety(unsafeMsg);
        console.log('Result 2:', res2);

        if (res1.safe && !res2.safe) {
            console.log("SUCCESS: AI is working correctly!");
        } else {
            console.log("WARNING: AI might be fail-opening or logic is lenient.");
        }
    } catch (error) {
        console.error('Verify failed:', error);
    }
}

verify();
