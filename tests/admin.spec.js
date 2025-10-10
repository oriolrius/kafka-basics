import { test, expect } from '@playwright/test';

test.describe('Admin/Topic Info Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('text=⚙️ Admin');
    await expect(page.locator('h2')).toContainText('Topic Administration');
  });

  test('should display admin interface', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Topic Administration');
    await expect(page.locator('#admin-topic')).toBeVisible();
    await expect(page.locator('button:has-text("📊 Get Topic Info")')).toBeVisible();
    await expect(page.locator('button:has-text("🗑️ Delete Topic")')).toBeVisible();
  });

  test('should get topic information', async ({ page }) => {
    // Create a topic first via producer
    await page.click('text=📤 Producer');
    const topicName = 'admin-test-topic-' + Date.now();
    await page.locator('#topic').fill(topicName);
    await page.locator('#key').fill('test-key');
    await page.locator('#message').fill('{"test": "data"}');
    await page.click('text=Send Message');
    await expect(page.locator('.status.success')).toBeVisible({ timeout: 5000 });
    
    // Go to admin and check topic info
    await page.click('text=⚙️ Admin');
    await page.locator('#admin-topic').fill(topicName);
    await page.click('text=📊 Get Topic Info');
    
    // Should show topic info with success status
    await expect(page.locator('.status.success')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.topic-details')).toBeVisible({ timeout: 5000 });
  });

  test('should handle non-existent topic gracefully', async ({ page }) => {
    await page.locator('#admin-topic').fill('non-existent-topic-xyz-' + Date.now());
    await page.click('text=📊 Get Topic Info');
    
    // Should show error status
    await expect(page.locator('.status.error')).toBeVisible({ timeout: 5000 });
  });

  test('should require topic name for operations', async ({ page }) => {
    const topicInput = page.locator('#admin-topic');
    
    // Input should be visible and have placeholder
    await expect(topicInput).toBeVisible();
    await expect(topicInput).toHaveAttribute('placeholder', 'test-topic');
  });

  test('should show delete confirmation warning', async ({ page }) => {
    await page.locator('#admin-topic').fill('test-delete-topic');
    
    // Listen for confirm dialog
    let dialogShown = false;
    page.on('dialog', async dialog => {
      dialogShown = true;
      await dialog.dismiss();
    });
    
    await page.click('text=🗑️ Delete Topic');
    
    // Wait a bit for dialog
    await page.waitForTimeout(500);
    expect(dialogShown).toBe(true);
  });
});
