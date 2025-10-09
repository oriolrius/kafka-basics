# Playwright Testing Guide

## Setup

Tests are already configured. Chromium is installed.

## Running Tests

### Method 1: Manual (Recommended)

1. **Start the web server** (in one terminal):
   ```bash
   pnpm web
   ```

2. **Run tests** (in another terminal):
   ```bash
   pnpm test
   ```

3. **View results**:
   ```bash
   pnpm exec playwright show-report
   ```

### Method 2: Automated Script

```bash
./run-tests.sh
```

## Test Commands

```bash
# Run all tests (headless)
pnpm test

# Run with browser visible
pnpm test:headed

# Run in debug mode (step through)
pnpm test:debug

# Run with UI mode
pnpm test:ui

# Run specific test
pnpm test tests/consumer.spec.js

# Run with more verbose output
pnpm test --reporter=line
```

## What the Tests Do

### Test 1: Load Application
- Verifies the app loads
- Checks that main title is visible

### Test 2: Tab Navigation
- Verifies all tabs are present
- Tests switching between tabs

### Test 3: Start Consumer
- Clicks on Consumer tab
- Sets topic to 'dev.test'
- Starts the consumer
- Waits for messages
- **Captures screenshot** → `test-results/consumer-started.png`
- Logs all browser console output

### Test 4: Produce and Consume
- Starts consumer on 'dev.test'
- Switches to Producer tab
- Sends a test message
- Switches back to Consumer tab
- Verifies new message appears
- **Captures screenshot** → `test-results/after-produce.png`

### Test 5: Consumer Persistence
- Starts consumer
- Switches between tabs
- Verifies consumer keeps running
- Stops consumer

### Test 6: Console Debugging
- Captures ALL browser console logs
- Prints them to test output
- Verifies polling is happening

## Debugging

### View Browser Console Logs

The tests capture and print browser console logs. Look for:
- `🔄 Starting message polling` - Polling started
- `📡 Polling for messages` - Each poll attempt
- `📬 Poll result` - API response
- `📨 Received X new messages` - Messages received
- `Total messages in UI: X` - UI state update

### View Screenshots

After running tests, check:
```bash
ls -la test-results/*.png
```

Screenshots show exactly what the browser sees.

### Check API Logs

When running `pnpm web`, watch for:
- `📤 Sent message to topic[partition]@offset` - Producer
- `📨 Received message on topic[partition]@offset` - Consumer
- `📬 Returning X new messages` - API response

## Common Issues

### Port Already in Use
Kill existing processes:
```bash
pkill -f "node src/api/server"
pkill -f "vite"
```

### Tests Timeout
Increase timeout in test file:
```javascript
await expect(something).toBeVisible({ timeout: 10000 });
```

### Consumer Not Receiving
Check:
1. API server logs - are messages being received?
2. Browser console logs - is polling happening?
3. Screenshots - is UI rendering correctly?

## Example Test Run

```bash
# Terminal 1
pnpm web

# Terminal 2
pnpm test

# Output will show:
# - Which tests pass/fail
# - Browser console logs
# - Message counts
# - Any errors

# View HTML report
pnpm exec playwright show-report
```

## Test Files

- `playwright.config.js` - Playwright configuration
- `tests/consumer.spec.js` - Consumer tests
- `test-results/` - Screenshots and artifacts
- `playwright-report/` - HTML test report

## Tips

1. **Run with headed mode first** to see what's happening:
   ```bash
   pnpm test:headed
   ```

2. **Use debug mode** to step through:
   ```bash
   pnpm test:debug
   ```

3. **Check screenshots** if tests fail - they show the exact UI state

4. **Read console logs** - they reveal what the JavaScript is doing

5. **Compare API logs vs Browser logs** - see where the disconnect is
