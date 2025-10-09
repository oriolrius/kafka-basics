import { test, expect } from '@playwright/test';

test.describe('Settings Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('text=⚙️ Settings');
  });

  test('should display settings form', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Kafka Connection Settings');
    await expect(page.locator('#brokers')).toBeVisible();
    await expect(page.locator('#securityProtocol')).toBeVisible();
    await expect(page.locator('#schemaRegistry')).toBeVisible();
  });

  test('should load default connection settings', async ({ page }) => {
    const brokersInput = page.locator('#brokers');
    const value = await brokersInput.inputValue();
    
    // Should have localhost:9092 as default
    expect(value).toContain('localhost:9092');
  });

  test('should show SASL options when SASL_PLAINTEXT selected', async ({ page }) => {
    await page.locator('#securityProtocol').selectOption('SASL_PLAINTEXT');
    
    // SASL fields should be visible
    await expect(page.locator('#saslMechanism')).toBeVisible();
    await expect(page.locator('#saslUsername')).toBeVisible();
    await expect(page.locator('#saslPassword')).toBeVisible();
  });

  test('should show SSL and SASL options when SASL_SSL selected', async ({ page }) => {
    await page.locator('#securityProtocol').selectOption('SASL_SSL');
    
    // Both SSL and SASL fields should be visible
    await expect(page.locator('#sslCa')).toBeVisible();
    await expect(page.locator('#sslCert')).toBeVisible();
    await expect(page.locator('#sslKey')).toBeVisible();
    await expect(page.locator('#saslMechanism')).toBeVisible();
  });

  test('should show only SSL options when SSL selected', async ({ page }) => {
    await page.locator('#securityProtocol').selectOption('SSL');
    
    // SSL fields should be visible
    await expect(page.locator('#sslCa')).toBeVisible();
    await expect(page.locator('#sslCert')).toBeVisible();
    await expect(page.locator('#sslKey')).toBeVisible();
    
    // SASL fields should not be visible
    await expect(page.locator('#saslMechanism')).not.toBeVisible();
  });

  test('should hide SSL and SASL options when PLAINTEXT selected', async ({ page }) => {
    // First select SASL_SSL to show all options
    await page.locator('#securityProtocol').selectOption('SASL_SSL');
    await expect(page.locator('#sslCa')).toBeVisible();
    
    // Switch to PLAINTEXT
    await page.locator('#securityProtocol').selectOption('PLAINTEXT');
    
    // Options should be hidden
    await expect(page.locator('#sslCa')).not.toBeVisible();
    await expect(page.locator('#saslMechanism')).not.toBeVisible();
  });

  test('should save settings to localStorage', async ({ page }) => {
    await page.locator('#brokers').fill('broker1:9092,broker2:9092');
    await page.locator('#securityProtocol').selectOption('SASL_SSL');
    await page.locator('#saslMechanism').selectOption('scram-sha-256');
    await page.locator('#saslUsername').fill('testuser');
    await page.locator('#saslPassword').fill('testpass');
    
    await page.click('text=Save Settings');
    
    await expect(page.locator('.status.success')).toBeVisible();
    
    // Reload and check persistence
    await page.reload();
    await page.click('text=⚙️ Settings');
    
    await expect(page.locator('#brokers')).toHaveValue('broker1:9092,broker2:9092');
    await expect(page.locator('#securityProtocol')).toHaveValue('SASL_SSL');
    await expect(page.locator('#saslMechanism')).toHaveValue('scram-sha-256');
  });

  test('should export settings as .env format', async ({ page }) => {
    await page.locator('#brokers').fill('kafka:9092');
    await page.locator('#schemaRegistry').fill('http://schema-registry:8081');
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('text=Export as .env');
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toBe('kafka-config.env');
  });

  test('should support all SASL mechanisms', async ({ page }) => {
    await page.locator('#securityProtocol').selectOption('SASL_PLAINTEXT');
    
    const mechanisms = ['plain', 'scram-sha-256', 'scram-sha-512', 'aws', 'oauthbearer'];
    
    for (const mechanism of mechanisms) {
      await page.locator('#saslMechanism').selectOption(mechanism);
      await expect(page.locator('#saslMechanism')).toHaveValue(mechanism);
    }
  });

  test('should validate brokers format', async ({ page }) => {
    const brokersInput = page.locator('#brokers');
    
    // Should accept valid format
    await brokersInput.fill('localhost:9092');
    await page.click('text=Save Settings');
    await expect(page.locator('.status.success')).toBeVisible();
    
    // Should accept multiple brokers
    await brokersInput.fill('broker1:9092,broker2:9093,broker3:9094');
    await page.click('text=Save Settings');
    await expect(page.locator('.status.success')).toBeVisible();
  });
});
