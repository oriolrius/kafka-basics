import { test, expect } from '@playwright/test';

test.describe('Theme Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should start with light theme by default', async ({ page }) => {
    const htmlElement = page.locator('html');
    const dataTheme = await htmlElement.getAttribute('data-theme');
    
    // Should be null or 'light'
    expect(dataTheme === null || dataTheme === 'light').toBeTruthy();
  });

  test('should toggle to dark theme', async ({ page }) => {
    const themeToggle = page.locator('button:has-text("🌙")');
    await themeToggle.click();
    
    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveAttribute('data-theme', 'dark');
    
    // Button should now show sun icon
    await expect(page.locator('button:has-text("☀️")')).toBeVisible();
  });

  test('should toggle back to light theme', async ({ page }) => {
    // Toggle to dark
    await page.click('button:has-text("🌙")');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    
    // Toggle back to light
    await page.click('button:has-text("☀️")');
    
    const htmlElement = page.locator('html');
    const dataTheme = await htmlElement.getAttribute('data-theme');
    expect(dataTheme === null || dataTheme === 'light').toBeTruthy();
  });

  test('should persist theme preference in localStorage', async ({ page }) => {
    // Toggle to dark theme
    await page.click('button:has-text("🌙")');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    
    // Reload page
    await page.reload();
    
    // Theme should persist
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('button:has-text("☀️")')).toBeVisible();
  });

  test('should apply theme styles correctly', async ({ page }) => {
    const container = page.locator('.container');
    
    // Check light theme background
    const lightBg = await container.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    
    // Toggle to dark
    await page.click('button:has-text("🌙")');
    
    // Check dark theme background (should be different)
    const darkBg = await container.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    
    expect(lightBg).not.toBe(darkBg);
  });
});
