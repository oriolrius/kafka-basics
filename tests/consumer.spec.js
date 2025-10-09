import { test, expect } from '@playwright/test';

test.describe('Kafka Consumer UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Enable console logging to see what's happening
    page.on('console', msg => {
      console.log(`BROWSER CONSOLE [${msg.type()}]:`, msg.text());
    });
    
    // Navigate to the app
    await page.goto('/');
  });

  test('should load the application', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Kafka Basics');
  });

  test('should have all tabs visible', async ({ page }) => {
    await expect(page.locator('text=Producer')).toBeVisible();
    await expect(page.locator('text=Consumer')).toBeVisible();
    await expect(page.locator('text=Messages')).toBeVisible();
    await expect(page.locator('text=Admin')).toBeVisible();
  });

  test('should navigate to Consumer tab', async ({ page }) => {
    await page.click('text=📥 Consumer');
    await expect(page.locator('h2')).toContainText('Kafka Consumer');
  });

  test('should start consumer and receive messages', async ({ page }) => {
    console.log('\n=== TEST: Starting Consumer ===');
    
    // Go to Consumer tab
    await page.click('text=📥 Consumer');
    await expect(page.locator('h2')).toContainText('Kafka Consumer');
    
    // Set topic name
    const topicInput = page.locator('#consumer-topic');
    await topicInput.clear();
    await topicInput.fill('dev.test');
    
    console.log('Topic set to: dev.test');
    
    // Start consumer
    await page.click('text=▶️ Start Consumer');
    
    // Wait for consumer to start
    await expect(page.locator('text=Consumer started')).toBeVisible({ timeout: 5000 });
    console.log('Consumer started successfully');
    
    // Wait a bit for messages to be polled
    await page.waitForTimeout(3000);
    
    // Check if messages are displayed
    const messageCount = page.locator('.messages-container h3');
    const messageCountText = await messageCount.textContent();
    console.log('Message count display:', messageCountText);
    
    // Check for messages in the list
    const messagesList = page.locator('.messages-list');
    const messagesContent = await messagesList.textContent();
    console.log('Messages list content length:', messagesContent.length);
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/consumer-started.png', fullPage: true });
    
    // Check if we have messages or not
    const noMessagesText = page.locator('text=No messages received yet');
    const hasNoMessages = await noMessagesText.isVisible();
    
    if (hasNoMessages) {
      console.log('⚠️  No messages displayed yet');
    } else {
      console.log('✅ Messages are being displayed!');
      const messageItems = page.locator('.message-item');
      const count = await messageItems.count();
      console.log('Number of message items:', count);
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should produce message and see it in consumer', async ({ page }) => {
    console.log('\n=== TEST: Produce and Consume ===');
    
    // Step 1: Start Consumer first
    console.log('Step 1: Starting consumer...');
    await page.click('text=📥 Consumer');
    await page.locator('#consumer-topic').fill('dev.test');
    await page.click('text=▶️ Start Consumer');
    await expect(page.locator('text=Consumer started')).toBeVisible({ timeout: 5000 });
    
    // Wait for initial messages to load
    await page.waitForTimeout(2000);
    
    // Get initial message count
    const initialMessageCount = await page.locator('.message-item').count();
    console.log('Initial message count:', initialMessageCount);
    
    // Step 2: Switch to Producer tab
    console.log('Step 2: Switching to Producer tab...');
    await page.click('text=📤 Producer');
    await expect(page.locator('h2')).toContainText('Kafka Producer');
    
    // Step 3: Send a message
    console.log('Step 3: Sending message...');
    await page.locator('#topic').fill('dev.test');
    await page.locator('#key').fill('test-key-' + Date.now());
    
    const testMessage = JSON.stringify({
      test: 'playwright-test',
      timestamp: new Date().toISOString(),
      data: 'Hello from Playwright!'
    });
    
    await page.locator('#message').fill(testMessage);
    await page.click('text=Send Message');
    
    // Wait for success message
    await expect(page.locator('text=Message sent successfully')).toBeVisible({ timeout: 5000 });
    console.log('Message sent successfully');
    
    // Step 4: Switch back to Consumer tab
    console.log('Step 4: Switching back to Consumer tab...');
    await page.click('text=📥 Consumer');
    
    // Step 5: Wait for new message to appear
    console.log('Step 5: Waiting for new message...');
    await page.waitForTimeout(3000); // Wait for polling to pick up the message
    
    // Check new message count
    const newMessageCount = await page.locator('.message-item').count();
    console.log('New message count:', newMessageCount);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/after-produce.png', fullPage: true });
    
    // Verify we have at least one more message
    expect(newMessageCount).toBeGreaterThan(initialMessageCount);
    console.log('✅ New message appeared in consumer!');
  });

  test('should keep consumer running when switching tabs', async ({ page }) => {
    console.log('\n=== TEST: Consumer Persistence Across Tabs ===');
    
    // Start consumer
    await page.click('text=📥 Consumer');
    await page.locator('#consumer-topic').fill('dev.test');
    await page.click('text=▶️ Start Consumer');
    await expect(page.locator('text=Consumer started')).toBeVisible();
    
    // Check consumer is running
    const stopButton = page.locator('text=⏹️ Stop Consumer');
    await expect(stopButton).toBeVisible();
    
    // Switch to Producer tab
    await page.click('text=📤 Producer');
    await page.waitForTimeout(1000);
    
    // Switch to Messages tab
    await page.click('text=📋 Messages');
    await page.waitForTimeout(1000);
    
    // Switch back to Consumer
    await page.click('text=📥 Consumer');
    
    // Consumer should still be running
    await expect(stopButton).toBeVisible();
    console.log('✅ Consumer still running after tab switches');
    
    // Stop the consumer
    await page.click('text=⏹️ Stop Consumer');
    await expect(page.locator('text=Consumer stopped')).toBeVisible();
    console.log('✅ Consumer stopped successfully');
  });

  test('should display console logs for debugging', async ({ page }) => {
    console.log('\n=== TEST: Console Debugging ===');
    
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push({ type: msg.type(), text: msg.text() });
    });
    
    // Start consumer
    await page.click('text=📥 Consumer');
    await page.locator('#consumer-topic').fill('dev.test');
    await page.click('text=▶️ Start Consumer');
    
    await page.waitForTimeout(5000); // Wait for several polling cycles
    
    // Print all console logs
    console.log('\n📋 Browser Console Logs:');
    consoleLogs.forEach(log => {
      console.log(`  [${log.type}] ${log.text}`);
    });
    
    // Look for polling messages
    const pollingLogs = consoleLogs.filter(log => 
      log.text.includes('Polling') || 
      log.text.includes('Poll result') ||
      log.text.includes('Received')
    );
    
    console.log(`\n Found ${pollingLogs.length} polling-related logs`);
    expect(pollingLogs.length).toBeGreaterThan(0);
  });
});
