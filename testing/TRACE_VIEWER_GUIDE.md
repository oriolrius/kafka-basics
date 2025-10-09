# 🔍 Trace Viewer Quick Guide

## What are Playwright Traces?

Traces are complete recordings of test execution that capture:
- Every DOM interaction and state change
- All network requests and responses
- Browser console logs (errors, warnings, info)
- Screenshots at each step
- Exact timing of all actions
- Source code locations

## When Traces are Generated

Traces are **automatically generated** when tests fail:

```javascript
// From playwright.config.js
use: {
  trace: 'retain-on-failure',        // Save trace when test fails
  screenshot: 'only-on-failure',     // Capture screenshot
  video: 'retain-on-failure',        // Record video
}
```

## Viewing Traces

### 1. Find Trace Files

After running tests, traces are saved in `test-results/`:

```bash
# List all trace files
ls test-results/*/trace.zip

# Example output:
test-results/producer-should-send-message/trace.zip
test-results/settings-should-save/trace.zip
test-results/theme-should-toggle/trace.zip
```

### 2. Open Trace Viewer

```bash
# View a specific trace
pnpm exec playwright show-trace test-results/[test-name]/trace.zip

# Example:
pnpm exec playwright show-trace test-results/producer-should-send-message/trace.zip
```

### 3. View Most Recent Trace

```bash
# Open the latest trace
pnpm exec playwright show-trace $(ls -t test-results/*/trace.zip | head -1)
```

## Trace Viewer Interface

### Left Panel: Actions Timeline

Shows every step of the test:
- ✅ Successful actions (green)
- ❌ Failed actions (red)
- ⏱️ Timestamps for each step
- 📍 Source code locations

**Click any action to:**
- See DOM snapshot at that moment
- View network activity
- Read console logs
- Inspect screenshots

### Center Panel: Visual Snapshot

Shows exactly what the browser looked like:
- Full page screenshot
- Interactive DOM inspector
- Hover to highlight elements
- Click to inspect HTML/CSS

### Right Panel: Details

**Tabs available:**
1. **Call** - Action details, parameters
2. **Log** - Console output (errors, warnings, logs)
3. **Source** - Test code that triggered this action
4. **Network** - HTTP requests/responses
5. **Console** - Browser console messages
6. **Errors** - Stack traces and error details

## Common Use Cases

### Debug Test Failure

1. **Find the failing test trace:**
   ```bash
   ls test-results/*/trace.zip
   ```

2. **Open the trace:**
   ```bash
   pnpm exec playwright show-trace test-results/failing-test/trace.zip
   ```

3. **Navigate to the failure:**
   - Look for red ❌ action in timeline
   - Click on it to see state at failure
   - Check Console tab for errors
   - Review Network tab for API issues

### Investigate "Element Not Found" Error

1. Open trace at the failing step
2. Check DOM snapshot - is element present?
3. Review Console for JavaScript errors
4. Check if element is hidden (CSS display/visibility)
5. Verify element selector in test code

### Debug API Integration

1. Open trace
2. Click on Network tab
3. Find the API request:
   - Request URL and method
   - Request headers and body
   - Response status and data
   - Response timing
4. Compare with expected values

### Understand Timing Issues

1. Open trace
2. Check timestamps in timeline
3. Find slow operations:
   - Long network requests
   - Delayed element appearances
   - Async state updates
4. Add appropriate waits in test

## Example Debugging Session

### Scenario: "Send Message" Button Not Working

**1. Run test and capture trace:**
```bash
pnpm test:headless tests/producer.spec.js
```

**2. Test fails - open trace:**
```bash
pnpm exec playwright show-trace test-results/producer-should-send-message/trace.zip
```

**3. Timeline shows:**
```
✓ Fill topic field
✓ Fill message field
❌ Click "Send Message" button - element not found
```

**4. Click on failed action:**
- **DOM Snapshot:** Button exists but is disabled
- **Console Tab:** "Validation error: message is required"
- **Source:** Test didn't wait for validation

**5. Fix test:**
```javascript
// Before (fails)
await page.click('button:has-text("Send Message")');

// After (waits for button to be enabled)
await expect(page.locator('button:has-text("Send Message")')).toBeEnabled();
await page.click('button:has-text("Send Message")');
```

## Tips for Better Debugging

### 1. Focus on the Failure Point

- Don't start from the beginning
- Jump to the red ❌ action
- Work backwards to find the cause

### 2. Check Multiple Tabs

- **Call:** What action was attempted
- **Log:** Console output at that moment
- **Network:** API requests/responses
- **Console:** JavaScript errors
- **Errors:** Stack traces

### 3. Compare Before/After

- Click action before failure
- Click failed action
- See what changed in DOM

### 4. Use Console Logs

Tests already log extensively:
```javascript
BROWSER CONSOLE [log]: ✅ Consumer started
BROWSER CONSOLE [log]: 🔄 Starting message polling
BROWSER CONSOLE [log]: 📡 Polling for messages...
BROWSER CONSOLE [log]: 📬 Poll result: {messages: Array(5)}
```

These appear in the Console tab!

### 5. Inspect Network Timing

Check Network tab for:
- Slow API responses (> 1s)
- Failed requests (4xx, 5xx)
- Missing requests
- Incorrect request data

## Trace Viewer Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←` `→` | Navigate between actions |
| `Space` | Play/pause timeline |
| `Esc` | Close viewer |
| `Cmd/Ctrl + F` | Search in source |

## Automated CI/CD Traces

### GitHub Actions Example

```yaml
- name: Run Playwright tests
  run: pnpm test:headless

- name: Upload traces on failure
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-traces
    path: test-results/
    retention-days: 7
```

**Download traces from GitHub:**
1. Go to failed workflow run
2. Click "Artifacts"
3. Download `playwright-traces.zip`
4. Extract and view locally:
   ```bash
   pnpm exec playwright show-trace trace.zip
   ```

## Trace Files Structure

```
test-results/
└── producer-should-send-message-chromium/
    ├── trace.zip              # Complete trace (open this)
    ├── test-failed-1.png      # Screenshot at failure
    ├── video.webm             # Video recording
    └── test-finished-*.png    # Final state screenshot
```

## Advanced: Trace Programmatically

You can also generate traces manually in tests:

```javascript
import { test } from '@playwright/test';

test('my test', async ({ page, context }) => {
  // Start tracing
  await context.tracing.start({ screenshots: true, snapshots: true });
  
  // Your test actions...
  await page.goto('http://localhost:3000');
  
  // Stop and save trace
  await context.tracing.stop({ path: 'trace.zip' });
});
```

## Troubleshooting Trace Viewer

### Trace Won't Open

```bash
# Make sure Playwright is installed
pnpm install @playwright/test

# Try with npx
npx playwright show-trace trace.zip
```

### Trace File Not Found

```bash
# Check test-results directory exists
ls -la test-results/

# Run tests to generate traces
pnpm test:headless
```

### Trace is Empty

- Trace generation might be disabled
- Check `playwright.config.js`:
  ```javascript
  use: {
    trace: 'retain-on-failure',  // Must be enabled
  }
  ```

## Best Practices

### ✅ Do:
- Always check traces for failed tests
- Look at Console tab for errors
- Review Network tab for API issues
- Compare snapshots before/after failure
- Share traces with team for debugging

### ❌ Don't:
- Ignore trace files - they're invaluable!
- Only look at screenshots - traces have more info
- Delete traces immediately - keep for reference
- Skip reviewing before asking for help

## Resources

- **Playwright Trace Viewer Docs:** https://playwright.dev/docs/trace-viewer
- **Debugging Guide:** https://playwright.dev/docs/debug
- **Our Testing Docs:** [testing/README.md](README.md)

---

💡 **Pro Tip:** Traces are the fastest way to debug flaky or failing tests. They capture everything you need in one file!
