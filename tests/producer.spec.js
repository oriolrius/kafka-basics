import { test, expect } from '@playwright/test';

test.describe('Producer Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('text=📤 Producer');
  });

  test('should display producer form', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Kafka Producer');
    await expect(page.locator('#topic')).toBeVisible();
    await expect(page.locator('#key')).toBeVisible();
    await expect(page.locator('#message')).toBeVisible();
    await expect(page.locator('#format')).toBeVisible();
  });

  test('should send JSON message successfully', async ({ page }) => {
    await page.locator('#topic').fill('test-topic');
    await page.locator('#key').fill('test-key-' + Date.now());
    await page.locator('#message').fill('{"test": "data", "value": 123}');
    
    await page.click('text=Send Message');
    
    // Wait for success message
    await expect(page.locator('.status.success')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.status')).toContainText('Message sent successfully');
  });

  test('should validate required fields', async ({ page }) => {
    // Try to submit without filling required fields
    await page.click('text=Send Message');
    
    // HTML5 validation should prevent submission
    const topicInput = page.locator('#topic');
    await expect(topicInput).toHaveAttribute('required', '');
  });

  test('should clear fields after successful send', async ({ page }) => {
    await page.locator('#topic').fill('test-topic');
    await page.locator('#key').fill('test-key');
    await page.locator('#message').fill('{"test": "message"}');
    
    await page.click('text=Send Message');
    await expect(page.locator('.status.success')).toBeVisible({ timeout: 5000 });
    
    // Message and key should be cleared
    await expect(page.locator('#message')).toHaveValue('');
    await expect(page.locator('#key')).toHaveValue('');
  });

  test('should switch between message formats', async ({ page }) => {
    const formatSelect = page.locator('#format');
    
    // Test JSON format
    await formatSelect.selectOption('json');
    await expect(formatSelect).toHaveValue('json');
    
    // Test Text format
    await formatSelect.selectOption('text');
    await expect(formatSelect).toHaveValue('text');
    
    // Test Avro format
    await formatSelect.selectOption('avro');
    await expect(formatSelect).toHaveValue('avro');
  });
});
