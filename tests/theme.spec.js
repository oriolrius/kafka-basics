import { test, expect } from '@playwright/test';

test.describe('Theme Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test to ensure consistent state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should start with dark theme by default', async ({ page }) => {
    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveAttribute('data-theme', 'dark');
    
    // Button should show light icon (to switch to light)
    await expect(page.locator('button:has-text("☀️ Light")')).toBeVisible();
  });

  test('should toggle to light theme', async ({ page }) => {
    // Click the light theme button
    await page.click('button:has-text("☀️ Light")');
    
    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveAttribute('data-theme', 'light');
    
    // Button should now show dark icon
    await expect(page.locator('button:has-text("🌙 Dark")')).toBeVisible();
  });

  test('should toggle back to dark theme', async ({ page }) => {
    // Toggle to light
    await page.click('button:has-text("☀️ Light")');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    
    // Toggle back to dark
    await page.click('button:has-text("🌙 Dark")');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('should persist theme preference in localStorage', async ({ page }) => {
    // Toggle to light theme
    await page.click('button:has-text("☀️ Light")');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    
    // Reload page
    await page.reload();
    
    // Theme should persist
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('button:has-text("🌙 Dark")')).toBeVisible();
  });

  test('should apply theme styles correctly', async ({ page }) => {
    // Start with dark theme
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    
    // Toggle to light
    await page.click('button:has-text("☀️ Light")');
    
    // Verify theme attribute changed
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    
    // Toggle back to dark
    await page.click('button:has-text("🌙 Dark")');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });
});
