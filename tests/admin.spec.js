import { test, expect } from '@playwright/test';

test.describe('Admin/Topic Info Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('text=🔧 Admin');
  });

  test('should display admin interface', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Topic Administration');
    await expect(page.locator('#topicName')).toBeVisible();
    await expect(page.locator('button:has-text("Get Topic Info")')).toBeVisible();
    await expect(page.locator('button:has-text("List All Messages")')).toBeVisible();
    await expect(page.locator('button:has-text("Delete Topic")')).toBeVisible();
  });

  test('should get topic information', async ({ page }) => {
    // Create a topic first via producer
    await page.click('text=📤 Producer');
    await page.locator('#topic').fill('admin-test-topic-' + Date.now());
    await page.locator('#key').fill('test-key');
    await page.locator('#message').fill('{"test": "data"}');
    await page.click('text=Send Message');
    await expect(page.locator('.status.success')).toBeVisible({ timeout: 5000 });
    
    const topicName = await page.locator('#topic').inputValue();
    
    // Go to admin and check topic info
    await page.click('text=🔧 Admin');
    await page.locator('#topicName').fill(topicName);
    await page.click('text=Get Topic Info');
    
    // Should show topic info
    await expect(page.locator('.topic-info')).toBeVisible({ timeout: 5000 });
  });

  test('should handle non-existent topic gracefully', async ({ page }) => {
    await page.locator('#topicName').fill('non-existent-topic-xyz-' + Date.now());
    await page.click('text=Get Topic Info');
    
    // Should show error or no results
    await page.waitForTimeout(2000);
    const errorOrEmpty = page.locator('.status.error, .no-data');
    const count = await errorOrEmpty.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should list all messages from topic', async ({ page }) => {
    // Create topic with message
    await page.click('text=📤 Producer');
    const topicName = 'list-test-topic-' + Date.now();
    await page.locator('#topic').fill(topicName);
    await page.locator('#key').fill('list-key');
    await page.locator('#message').fill('{"msg": "for listing"}');
    await page.click('text=Send Message');
    await expect(page.locator('.status.success')).toBeVisible({ timeout: 5000 });
    
    // List messages
    await page.click('text=🔧 Admin');
    await page.locator('#topicName').fill(topicName);
    await page.click('text=List All Messages');
    
    // Should show messages
    await page.waitForTimeout(3000); // Give time for consumption
    const messagesArea = page.locator('.messages-list, .message-item, pre');
    const count = await messagesArea.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should require topic name for operations', async ({ page }) => {
    const topicInput = page.locator('#topicName');
    
    // Should have required attribute
    await expect(topicInput).toHaveAttribute('required', '');
  });

  test('should show delete confirmation warning', async ({ page }) => {
    await page.locator('#topicName').fill('test-topic');
    
    // Listen for confirm dialog
    page.on('dialog', dialog => dialog.accept());
    
    await page.click('text=Delete Topic');
    
    // Wait for operation to complete
    await page.waitForTimeout(1000);
  });
});
