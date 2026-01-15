const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
    try {
        const assetsDir = 'c:/side/assets';
        if (!fs.existsSync(assetsDir)) {
            fs.mkdirSync(assetsDir, { recursive: true });
        }

        console.log('Launching browser...');
        const browser = await chromium.launch();
        // iPhone 12 Pro dimensions
        const context = await browser.newContext({
            viewport: { width: 390, height: 844 },
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1',
            deviceScaleFactor: 3,
            isMobile: true,
            hasTouch: true
        });
        const page = await context.newPage();

        console.log('Navigating to http://localhost:3000 ...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 60000 });

        // Wait for any initial animations
        await page.waitForTimeout(3000);

        // 1. Capture Home Screen
        console.log('Capturing Home Screen...');
        await page.screenshot({ path: path.join(assetsDir, '01_home_mobile.png') });

        // 2. Select Line (Try to find a line button)
        // Adjust selector based on typical React button usage. Assuming "2호선" or buttons with line numbers.
        console.log('Looking for Line button...');
        // Try searching for specific expected text for a line button
        const lineButton = page.locator('button').filter({ hasText: /2호선|Line 2/i }).first();

        if (await lineButton.isVisible()) {
            console.log('Clicking 2호선...');
            await lineButton.click();
        } else {
            console.log('Specific line button not found. Clicking the first available button...');
            const firstButton = page.locator('button').first();
            if (await firstButton.isVisible()) {
                await firstButton.click();
            } else {
                console.error('No buttons found to click!');
            }
        }

        // Wait for navigation/modal
        await page.waitForTimeout(3000);

        // 3. User might need to enter nickname?
        // Let's check if there is an input field for nickname.
        const nicknameInput = page.locator('input[placeholder*="닉네임"], input[type="text"]').first();
        const startButton = page.locator('button').filter({ hasText: /입장|Start|Go/i }).first();

        if (await nicknameInput.isVisible()) {
            console.log(' Entering nickname...');
            await nicknameInput.fill('테스터01');
            if (await startButton.isVisible()) {
                await startButton.click();
                await page.waitForTimeout(3000);
            } else {
                await nicknameInput.press('Enter');
                await page.waitForTimeout(3000);
            }
        }

        // 4. Capture Chat Room
        console.log('Capturing Chat Room...');
        await page.screenshot({ path: path.join(assetsDir, '02_chat_room.png') });

        // 5. Send Message
        const chatInput = page.locator('input[type="text"], textarea').last();
        if (await chatInput.isVisible()) {
            console.log('Sending message...');
            await chatInput.fill('안녕하세요! 스크린샷 캡처 중입니다. 📸');
            await chatInput.press('Enter');
            await page.waitForTimeout(1000);

            await chatInput.fill('모바일 뷰 테스트... 😎');
            await chatInput.press('Enter');
            await page.waitForTimeout(2000);
        }

        console.log('Capturing Chat Message...');
        await page.screenshot({ path: path.join(assetsDir, '03_chat_message.png') });

        await browser.close();
        console.log('Done! Screenshots saved to c:/side/assets');

    } catch (err) {
        console.error('Script failed:', err);
        process.exit(1);
    }
})();
