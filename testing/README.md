# 🧪 Testing Documentation

Complete guide for running and debugging Playwright tests for the Kafka Basics Web UI.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Test Suite Overview](#test-suite-overview)
- [Running Tests](#running-tests)
- [Test Coverage](#test-coverage)
- [Debugging](#debugging)
- [Trace Files](#trace-files)
- [Common Issues](#common-issues)

## 🚀 Quick Start

### Prerequisites

- Kafka broker running (via Docker Compose)
- Dependencies installed: `pnpm install`

### Run Tests (Headless)

```bash
# Start Kafka broker (if not running)
docker-compose up -d

# Run all tests
pnpm test:headless
```

Tests will automatically:
- Start the web server
- Run all test suites
- Generate traces on failures
- Create HTML report

## 🎯 Test Suite Overview

### Test Files

| Test File | Focus | Test Count |
|-----------|-------|------------|
| `consumer.spec.js` | Consumer functionality, message polling | 6 tests |
| `producer.spec.js` | Message production, form validation | 6 tests |
| `theme.spec.js` | Light/dark theme toggle, persistence | 5 tests |
| `settings.spec.js` | Connection settings, security protocols | 10 tests |
| `admin.spec.js` | Topic administration, info, deletion | 6 tests |
| `messages.spec.js` | Message browsing, metadata display | 5 tests |

**Total: 38 comprehensive tests**

## 🏃 Running Tests

### Headless Mode (CI/Production)

```bash
# Run all tests headless
pnpm test:headless

# Run specific test file
pnpm exec playwright test tests/producer.spec.js

# Run tests matching pattern
pnpm exec playwright test --grep "theme"
```

### Development Mode

```bash
# Run with browser visible
pnpm test:headed

# Run with Playwright UI
pnpm test:ui

# Debug mode (step through tests)
pnpm test:debug

# Run single test file in headed mode
pnpm exec playwright test tests/consumer.spec.js --headed
```

### Manual Setup (Two Terminals)

**Terminal 1 - Start Web Server:**
```bash
pnpm web
```

**Terminal 2 - Run Tests:**
```bash
pnpm test
```

## 📊 Test Coverage

### Consumer Tests (`consumer.spec.js`)

- ✅ Application loads successfully
- ✅ All navigation tabs are visible
- ✅ Can navigate to Consumer tab
- ✅ Can start consumer subscription
- ✅ Producer → Consumer message flow works
- ✅ Consumer persists across tab switches

### Producer Tests (`producer.spec.js`)

- ✅ Producer form displays correctly
- ✅ Can send JSON messages
- ✅ Form validation for required fields
- ✅ Fields clear after successful send
- ✅ Can switch between message formats (JSON/Text/Avro)

### Theme Tests (`theme.spec.js`)

- ✅ Starts with light theme by default
- ✅ Can toggle to dark theme
- ✅ Can toggle back to light theme
- ✅ Theme persists in localStorage across reloads
- ✅ Theme styles apply correctly

### Settings Tests (`settings.spec.js`)

- ✅ Settings form displays correctly
- ✅ Loads default connection settings
- ✅ SASL options show for SASL_PLAINTEXT
- ✅ SSL + SASL options show for SASL_SSL
- ✅ SSL-only options show for SSL
- ✅ Options hide for PLAINTEXT
- ✅ Settings persist to localStorage
- ✅ Can export settings as .env file
- ✅ Supports all SASL mechanisms (plain, scram-sha-256, scram-sha-512, aws, oauthbearer)
- ✅ Validates broker format

### Admin Tests (`admin.spec.js`)

- ✅ Admin interface displays correctly
- ✅ Can get topic information
- ✅ Handles non-existent topics gracefully
- ✅ Can list all messages from topic
- ✅ Requires topic name for operations
- ✅ Shows delete confirmation warning

### Message Tests (`messages.spec.js`)

- ✅ Messages tab displays correctly
- ✅ Shows messages from all topics
- ✅ Displays message metadata
- ✅ Formats timestamps correctly (no "Invalid Date")
- ✅ Handles empty message list

## 🐛 Debugging

### View Test Report

```bash
# After tests run
pnpm exec playwright show-report
```

Interactive HTML report shows:
- Test results
- Screenshots on failure
- Browser console logs
- Network activity
- Trace viewer links

### Trace Files

Traces are automatically captured on test failures and stored in `test-results/`.

**View a trace:**
```bash
pnpm exec playwright show-trace test-results/[test-name]/trace.zip
```

**What traces show:**
- Complete DOM snapshots at each step
- Network requests and responses
- Console logs
- Screenshots
- Source code location
- Exact timing of each action

### Browser Console Logs

All tests capture browser console output. Look for:

```
🔄 Starting message polling     - Consumer polling started
📡 Polling for messages         - Each poll attempt
📬 Poll result: {...}           - API response data
📨 Received X new messages      - New messages detected
Total messages in UI: X         - UI state update
```

### Screenshots

Tests capture screenshots on failure automatically. Find them in:
```
test-results/[test-name]/test-failed-1.png
```

### API Server Logs

When running `pnpm web`, watch for:

```
📤 Sent message to topic[partition]@offset    - Producer activity
📨 Received message on topic[partition]@offset - Consumer activity
📬 Returning X new messages                    - API responses
```

### Debug a Specific Test

```bash
# Run single test in debug mode
pnpm exec playwright test tests/consumer.spec.js -g "should persist" --debug
```

This opens Playwright Inspector where you can:
- Step through each test action
- Inspect DOM state
- View console logs
- Examine network requests

## 🔧 Common Issues

### Port Already in Use

```bash
# Kill existing processes
pkill -f "node src/api/server"
pkill -f "vite"

# Or find and kill specific port
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

### Kafka Broker Not Running

```bash
# Check Docker containers
docker ps | grep kafka

# Start broker
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Tests Timeout

Increase timeout in specific test:
```javascript
await expect(element).toBeVisible({ timeout: 10000 }); // 10 seconds
```

Or globally in `playwright.config.js`:
```javascript
use: {
  actionTimeout: 10000,
  navigationTimeout: 30000,
}
```

### Consumer Not Receiving Messages

**Check:**
1. Is Kafka broker running? `docker ps`
2. Are API server logs showing messages? Check Terminal 1
3. Are browser console logs showing polling? Check test output
4. Is the topic correct? Check screenshots

**Debug:**
```bash
# Run with headed mode to watch
pnpm test:headed tests/consumer.spec.js
```

### Test Fails Intermittently

**Common causes:**
- Race conditions (add waits)
- Kafka topic creation delay (increase timeouts)
- Message delivery timing (poll longer)

**Fix:**
```javascript
// Wait for element with retry
await expect(element).toBeVisible({ timeout: 5000 });

// Add explicit wait for async operations
await page.waitForTimeout(2000);

// Wait for network to be idle
await page.waitForLoadState('networkidle');
```

## 📁 Test Artifacts

```
test-results/           - Test run artifacts
├── trace.zip          - Playwright traces (on failure)
├── video.webm         - Test recording (on failure)
└── *.png             - Screenshots (on failure)

playwright-report/      - HTML test report
└── index.html         - View with: pnpm exec playwright show-report

.playwright/           - Playwright internals
└── chromium-*/        - Browser binaries
```

## 🎬 Example Test Session

```bash
# Terminal 1: Start services
docker-compose up -d        # Start Kafka
pnpm web                    # Start web server (http://localhost:3000)

# Terminal 2: Run tests
pnpm test:headless          # Run all tests

# Output:
Running 38 tests using 1 worker
  ✓ consumer.spec.js:6:1 › should load the app (423ms)
  ✓ consumer.spec.js:11:1 › should show all tabs (201ms)
  ...
  38 passed (2.3m)

# View results
pnpm exec playwright show-report
```

## 📝 Writing New Tests

### Test Template

```javascript
import { test, expect } from '@playwright/test';

test.describe('Feature Name Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Setup steps
  });

  test('should do something', async ({ page }) => {
    // Arrange
    await page.click('text=Tab Name');
    
    // Act
    await page.locator('#input').fill('value');
    await page.click('button:has-text("Submit")');
    
    // Assert
    await expect(page.locator('.result')).toContainText('expected');
  });
});
```

### Best Practices

1. **Use descriptive test names** - "should send message when form is valid"
2. **Wait for elements** - Always use `expect().toBeVisible()` with timeout
3. **Isolate tests** - Each test should be independent
4. **Clean up** - Create unique topic names with timestamps
5. **Capture context** - Add console logs for debugging

### Running Your New Tests

```bash
# Test your new file
pnpm exec playwright test tests/your-feature.spec.js --headed --debug
```

## 🔗 Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [Trace Viewer](https://playwright.dev/docs/trace-viewer)

## 💡 Tips

1. **Always run headless in CI** - Use `pnpm test:headless`
2. **Use headed mode for development** - See what's happening
3. **Check traces when tests fail** - They contain everything you need
4. **Watch API logs alongside tests** - Understand the full flow
5. **Use unique topic names** - Prevent test interference: `'test-' + Date.now()`
6. **Wait for operations to complete** - Kafka operations are async
7. **Test isolation** - Don't rely on test execution order
