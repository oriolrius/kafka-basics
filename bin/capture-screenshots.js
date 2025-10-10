#!/usr/bin/env node
/**
 * Screenshot Capture Script
 * This script captures screenshots of the Kafka Basics Web UI
 * and saves them to the assets folder.
 */

import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const screenshotsDir = path.join(__dirname, '..', 'assets');
const baseURL = 'http://localhost:3003';

async function captureScreenshots() {
  console.log('🚀 Starting screenshot capture...');
  console.log(`📁 Screenshots will be saved to: ${screenshotsDir}`);
  console.log(`🌐 Using base URL: ${baseURL}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    // Navigate to the application
    console.log('📡 Connecting to application...');
    await page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    console.log('✅ Application loaded\n');

    // Capture overview (default tab)
    console.log('📸 Capturing Overview tab...');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(screenshotsDir, 'overview.png'),
      fullPage: true
    });
    console.log('✅ Saved overview.png');

    // Capture Producer tab
    console.log('📸 Capturing Producer tab...');
    const producerTab = await page.locator('button.tab:has-text("Producer")');
    await producerTab.waitFor({ state: 'visible', timeout: 10000 });
    await producerTab.click();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(screenshotsDir, 'producer-tab.png'),
      fullPage: true
    });
    console.log('✅ Saved producer-tab.png');

    // Capture Consumer tab
    console.log('📸 Capturing Consumer tab...');
    const consumerTab = await page.locator('button.tab:has-text("Consumer")');
    await consumerTab.waitFor({ state: 'visible', timeout: 10000 });
    await consumerTab.click();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(screenshotsDir, 'consumer-tab.png'),
      fullPage: true
    });
    console.log('✅ Saved consumer-tab.png');

    // Capture Messages tab
    console.log('📸 Capturing Messages tab...');
    const messagesTab = await page.locator('button.tab:has-text("Messages")');
    await messagesTab.waitFor({ state: 'visible', timeout: 10000 });
    await messagesTab.click();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(screenshotsDir, 'messages-tab.png'),
      fullPage: true
    });
    console.log('✅ Saved messages-tab.png');

    // Capture Admin tab
    console.log('📸 Capturing Admin tab...');
    const adminTab = await page.locator('button.tab:has-text("Topic Info")');
    await adminTab.waitFor({ state: 'visible', timeout: 10000 });
    await adminTab.click();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(screenshotsDir, 'admin-tab.png'),
      fullPage: true
    });
    console.log('✅ Saved admin-tab.png');

    // Capture Settings tab
    console.log('📸 Capturing Settings tab...');
    const settingsTab = await page.locator('button.tab:has-text("Settings")');
    await settingsTab.waitFor({ state: 'visible', timeout: 10000 });
    await settingsTab.click();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(screenshotsDir, 'settings-tab.png'),
      fullPage: true
    });
    console.log('✅ Saved settings-tab.png');

    // Capture dark theme (default)
    console.log('📸 Capturing dark theme...');
    const darkButton = page.locator('button.theme-toggle:has-text("Dark")');
    if (await darkButton.isVisible().catch(() => false)) {
      await darkButton.click();
      await page.waitForTimeout(1000);
    }
    const producerTabDark = await page.locator('button.tab:has-text("Producer")');
    await producerTabDark.click();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(screenshotsDir, 'dark-theme.png'),
      fullPage: true
    });
    console.log('✅ Saved dark-theme.png');

    // Capture light theme
    console.log('📸 Capturing light theme...');
    const lightButton = page.locator('button.theme-toggle:has-text("Light")');
    if (await lightButton.isVisible().catch(() => false)) {
      await lightButton.click();
      await page.waitForTimeout(1000);
    }
    await page.screenshot({
      path: path.join(screenshotsDir, 'light-theme.png'),
      fullPage: true
    });
    console.log('✅ Saved light-theme.png');

    console.log('\n🎉 All screenshots captured successfully!');
  } catch (error) {
    console.error('❌ Error capturing screenshots:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Run the script
captureScreenshots();
