# Testing Guide

## Quick Start

```bash
# Start Kafka
docker-compose up -d

# Run all tests
pnpm test:headless

# View report (accessible remotely on port 9323)
pnpm test:report
```

## Configuration

Tests use environment variables for configuration (no hardcoded values):

```bash
# Set custom base URL (default: http://localhost:3000)
BASE_URL=http://localhost:3000 pnpm test

# Set custom API URL (default: http://localhost:3001)
API_URL=http://localhost:3001 pnpm test

# Both can be set together
BASE_URL=http://myserver:8080 API_URL=http://myserver:8081 pnpm test
```

Configuration is managed through `playwright.config.js` and environment variables.

## Test Files (47 tests)

| File | Tests | What it covers |
|------|-------|----------------|
| `consumer.spec.js` | 6 | Consumer subscription, polling, message receiving |
| `producer.spec.js` | 6 | Message sending, form validation, format switching |
| `theme.spec.js` | 5 | Light/dark theme toggle and persistence |
| `settings.spec.js` | 10 | Connection config, security protocols, SASL |
| `admin.spec.js` | 6 | Topic info, message listing, deletion |
| `messages.spec.js` | 5 | Message browsing, metadata, timestamps |
| `screenshots.spec.js` | 9 | Screenshots for documentation (includes Overview) |
| `api-json-responses.spec.js` | 11 | API error handling, JSON response validation |

## Running Tests

```bash
# Headless (CI/production)
pnpm test:headless

# Watch browser
pnpm test:headed

# Debug specific test
pnpm exec playwright test tests/producer.spec.js --debug

# Run by pattern
pnpm exec playwright test --grep "theme"
```

## Debugging Failed Tests

1. **View HTML report:**

   ```bash
   pnpm test:report
   ```

2. **Open trace file:**

   ```bash
   pnpm exec playwright show-trace test-results/*/trace.zip
   ```

3. **Check what's in the trace:**
   - DOM snapshots at each step
   - Network requests/responses
   - Browser console logs
   - Screenshots and timing

## Common Issues

### Port conflicts

```bash
pkill -f "node src/api/server"
pkill -f "vite"
```

### Kafka not running

```bash
docker-compose up -d
docker ps | grep kafka
```

### Test timeouts

Add timeout to specific checks:

```javascript
await expect(element).toBeVisible({ timeout: 10000 });
```

## Writing Tests

Basic template:

```javascript
import { test, expect } from '@playwright/test';

test.describe('Feature Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should do something', async ({ page }) => {
    await page.click('text=Tab Name');
    await page.locator('#input').fill('value');
    await page.click('button:has-text("Submit")');
    await expect(page.locator('.result')).toContainText('expected');
  });
});
```

## Tips

- Use unique topic names: `'test-' + Date.now()`
- Always wait for elements: `expect().toBeVisible()`
- Check traces when tests fail - they have everything
- Run specific test files during development to save time

## Test Artifacts

- `test-results/` - Traces, screenshots, videos (on failure)
- `playwright-report/` - HTML report with all test results
- `../assets/` - Screenshots for documentation (README.md)

## Capturing Screenshots for Documentation

To update the screenshots shown in the README.md:

```bash
# Make sure the web server is running
pnpm web

# In another terminal, run the screenshot script
pnpm capture-screenshots

# Or run the Playwright test (requires manual server start)
pnpm test:screenshots
```

The screenshots will be saved to the `assets/` folder and are automatically displayed in the main README.md file under the "Web UI Features" section.
