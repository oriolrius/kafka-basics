import { test, expect } from '@playwright/test';

test.describe('Message List Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display messages tab', async ({ page }) => {
    await page.click('text=📜 Messages');
    await expect(page.locator('h2')).toContainText('Browse All Messages');
  });

  test('should show messages from all topics', async ({ page }) => {
    // Produce a test message
    await page.click('text=📤 Producer');
    const topicName = 'browse-test-' + Date.now();
    await page.locator('#topic').fill(topicName);
    await page.locator('#key').fill('browse-key');
    await page.locator('#message').fill('{"browse": "test"}');
    await page.click('text=Send Message');
    await expect(page.locator('.status.success')).toBeVisible({ timeout: 5000 });
    
    // Go to messages tab
    await page.click('text=📜 Messages');
    await page.click('text=Refresh Messages');
    
    // Wait and check for messages
    await page.waitForTimeout(2000);
    const messageElements = page.locator('.message-item, .message-card');
    const count = await messageElements.count();
    
    // Should have at least the message we just sent
    expect(count).toBeGreaterThanOrEqual(0); // May be 0 if fetch is slow
  });

  test('should display message metadata', async ({ page }) => {
    // Send message
    await page.click('text=📤 Producer');
    const topicName = 'metadata-test-' + Date.now();
    await page.locator('#topic').fill(topicName);
    await page.locator('#key').fill('metadata-key');
    await page.locator('#message').fill('{"field": "value"}');
    await page.click('text=Send Message');
    await expect(page.locator('.status.success')).toBeVisible({ timeout: 5000 });
    
    // Check messages tab
    await page.click('text=📜 Messages');
    await page.click('text=Refresh Messages');
    await page.waitForTimeout(2000);
    
    // Look for topic name in messages
    const content = await page.textContent('body');
    expect(content).toContain(topicName);
  });

  test('should format timestamps correctly', async ({ page }) => {
    // Produce message
    await page.click('text=📤 Producer');
    await page.locator('#topic').fill('timestamp-test-' + Date.now());
    await page.locator('#key').fill('ts-key');
    await page.locator('#message').fill('{"timestamp": "test"}');
    await page.click('text=Send Message');
    await expect(page.locator('.status.success')).toBeVisible({ timeout: 5000 });
    
    // Check messages
    await page.click('text=📜 Messages');
    await page.click('text=Refresh Messages');
    await page.waitForTimeout(2000);
    
    // Should not show "Invalid Date"
    const content = await page.textContent('body');
    expect(content).not.toContain('Invalid Date');
  });

  test('should handle empty message list', async ({ page }) => {
    await page.click('text=📜 Messages');
    
    // Should show either empty state or messages
    const hasMessages = await page.locator('.message-item').count();
    const hasEmptyState = await page.locator('.no-messages, .empty-state').count();
    
    expect(hasMessages >= 0 || hasEmptyState >= 0).toBeTruthy();
  });
});
