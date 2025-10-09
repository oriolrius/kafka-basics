# 🚀 Quick Reference Card - Playwright Testing

## ⚡ Most Common Commands

```bash
# Run all tests (headless, recommended)
pnpm test:headless

# View test report
pnpm test:report

# Debug a specific test
pnpm exec playwright test tests/producer.spec.js --debug

# View a trace file
pnpm exec playwright show-trace test-results/*/trace.zip
```

## 📁 Test Files (38 tests total)

| File | Tests | What it tests |
|------|-------|---------------|
| `tests/consumer.spec.js` | 6 | Consumer subscription, polling, persistence |
| `tests/producer.spec.js` | 6 | Message sending, validation, formats |
| `tests/theme.spec.js` | 5 | Light/dark theme, localStorage |
| `tests/settings.spec.js` | 10 | Connection config, security protocols |
| `tests/admin.spec.js` | 6 | Topic management, info, deletion |
| `tests/messages.spec.js` | 5 | Message browsing, metadata |

## 🐛 When Tests Fail

1. **Check the HTML report:**
   ```bash
   pnpm test:report
   ```

2. **Find the trace file:**
   ```bash
   ls test-results/*/trace.zip
   ```

3. **Open trace viewer:**
   ```bash
   pnpm exec playwright show-trace test-results/[failed-test]/trace.zip
   ```

4. **In trace viewer:**
   - Click the red ❌ action in timeline
   - Check **Console** tab for errors
   - Check **Network** tab for API issues
   - Check **DOM snapshot** for element visibility

## 📚 Documentation Quick Links

- **Start here:** `testing/INDEX.md`
- **Full guide:** `testing/README.md`
- **Coverage details:** `testing/COVERAGE.md`
- **Debug traces:** `testing/TRACE_VIEWER_GUIDE.md`

## 🔧 Common Fixes

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

### Test timeout
Increase timeout in test file:
```javascript
await expect(element).toBeVisible({ timeout: 10000 });
```

## 💡 Pro Tips

- ✅ Always run `pnpm test:headless` before pushing
- ✅ Use traces for debugging - they have everything!
- ✅ Check browser console logs in test output
- ✅ Use unique topic names: `'test-' + Date.now()`
- ✅ Run specific test file to save time during development

## 🎯 Development Workflow

```bash
# 1. Start services
docker-compose up -d
pnpm web                    # Terminal 1

# 2. Make changes to code

# 3. Run affected tests
pnpm exec playwright test tests/your-feature.spec.js --headed

# 4. Fix issues and re-run

# 5. Run all tests before commit
pnpm test:headless

# 6. Commit and push
git add .
git commit -m "your message"
git push
```

---

**Need more details?** See `testing/INDEX.md` for complete documentation.
