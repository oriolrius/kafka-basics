import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Application Screenshots', () => {
  const screenshotsDir = path.join(process.cwd(), 'assets');

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
  });

  test('capture overview tab screenshot', async ({ page }) => {
    // Overview is the default tab
    await page.waitForTimeout(500);
    
    // Take screenshot
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'overview.png'),
      fullPage: true 
    });
  });

  test('capture producer tab screenshot', async ({ page }) => {
    // Navigate to Producer tab
    await page.click('button:has-text("📤 Producer")');
    await page.waitForTimeout(500); // Wait for tab transition
    
    // Take screenshot
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'producer-tab.png'),
      fullPage: true 
    });
  });

  test('capture consumer tab screenshot', async ({ page }) => {
    // Navigate to Consumer tab
    await page.click('button:has-text("📥 Consumer")');
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'consumer-tab.png'),
      fullPage: true 
    });
  });

  test('capture messages tab screenshot', async ({ page }) => {
    // Navigate to Messages tab
    await page.click('button:has-text("📋 Messages")');
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'messages-tab.png'),
      fullPage: true 
    });
  });

  test('capture admin tab screenshot', async ({ page }) => {
    // Navigate to Admin tab
    await page.click('button:has-text("⚙️ Admin")');
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'admin-tab.png'),
      fullPage: true 
    });
  });

  test('capture settings tab screenshot', async ({ page }) => {
    // Navigate to Settings tab
    await page.click('button:has-text("🔧 Settings")');
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'settings-tab.png'),
      fullPage: true 
    });
  });

  test('capture light theme screenshot', async ({ page }) => {
    // Toggle to light theme
    const themeButton = page.locator('button:has-text("☀️ Light")');
    if (await themeButton.isVisible()) {
      await themeButton.click();
      await page.waitForTimeout(500);
      
      // Capture producer tab in light mode
      await page.click('button:has-text("📤 Producer")');
      await page.waitForTimeout(500);
      
      await page.screenshot({ 
        path: path.join(screenshotsDir, 'light-theme.png'),
        fullPage: true 
      });
    }
  });

  test('capture dark theme screenshot', async ({ page }) => {
    // Ensure dark theme is active
    const darkButton = page.locator('button:has-text("🌙 Dark")');
    if (await darkButton.isVisible()) {
      await darkButton.click();
      await page.waitForTimeout(500);
    }
    
    // Capture producer tab in dark mode
    await page.click('button:has-text("📤 Producer")');
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'dark-theme.png'),
      fullPage: true 
    });
  });

  test('capture overview screenshot', async ({ page }) => {
    // Capture the main interface (default tab)
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'overview.png'),
      fullPage: true 
    });
  });
});
