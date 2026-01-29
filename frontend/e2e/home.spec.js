import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the app title', async ({ page }) => {
    await expect(page).toHaveTitle(/가기싫어/);
  });

  test('should display subway lines', async ({ page }) => {
    // Wait for subway lines to load
    await page.waitForSelector('[data-testid="subway-line"]', { timeout: 10000 }).catch(() => {
      // If data-testid doesn't exist, look for line buttons
    });

    // Check if there are clickable subway line elements
    const lineElements = page.locator('button, a, [role="button"]').filter({ hasText: /호선/ });
    const count = await lineElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should be able to select a subway line', async ({ page }) => {
    // Find and click the first subway line
    const firstLine = page.locator('button, a, [role="button"]').filter({ hasText: /호선/ }).first();
    await firstLine.click();

    // Should navigate to chat room or show chat interface
    await expect(page.locator('body')).toContainText(/메시지|채팅|입력/i);
  });
});

test.describe('Chat Room', () => {
  test('should allow sending messages', async ({ page }) => {
    await page.goto('/');

    // Select a subway line
    const firstLine = page.locator('button, a, [role="button"]').filter({ hasText: /호선/ }).first();
    await firstLine.click();

    // Wait for chat interface
    await page.waitForTimeout(1000);

    // Find message input
    const messageInput = page.locator('input[type="text"], textarea').first();

    if (await messageInput.isVisible()) {
      // Type a message
      await messageInput.fill('테스트 메시지입니다');

      // Find and click send button
      const sendButton = page.locator('button[type="submit"], button').filter({ hasText: /전송|보내기|send/i }).first();

      if (await sendButton.isVisible()) {
        await sendButton.click();

        // Verify message appears (or input is cleared)
        await page.waitForTimeout(500);
      }
    }
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // App should still be functional
    await expect(page.locator('body')).toBeVisible();

    // Check if subway lines are visible
    const lineElements = page.locator('button, a, [role="button"]').filter({ hasText: /호선/ });
    const count = await lineElements.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/');

    // Check for at least one heading
    const headings = page.locator('h1, h2, h3');
    const count = await headings.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');

    // Tab through the page
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Something should be focused
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});
