# Testing Documentation Index

Complete testing resources for the Kafka Basics Web UI project.

## 📚 Documentation Files

### 🚀 [README.md](README.md)
**Complete Testing Guide**

Your primary resource for running and debugging tests:
- Quick start instructions
- Test suite overview (38 tests)
- Running tests (headless, headed, UI, debug)
- Detailed test coverage
- Debugging techniques
- Common issues and solutions
- Tips and best practices

**Start here** if you're new to the testing setup.

---

### 📊 [COVERAGE.md](COVERAGE.md)
**Test Coverage Summary**

Detailed breakdown of all test suites:
- Test files and test counts
- Feature coverage by category
- What each test validates
- Test quality metrics
- Next steps and recommendations

**Use this** to understand what's tested and find gaps.

---

### 🔍 [TRACE_VIEWER_GUIDE.md](TRACE_VIEWER_GUIDE.md)
**Trace Viewer Debugging Guide**

Master the Playwright trace viewer:
- What traces capture
- How to open and navigate traces
- Debugging workflows
- Example debugging sessions
- Keyboard shortcuts
- CI/CD integration

**Use this** when tests fail and you need to debug.

---

### 🎉 [ENHANCEMENT_SUMMARY.md](ENHANCEMENT_SUMMARY.md)
**Testing Enhancement Overview**

Summary of recent testing improvements:
- Coverage extension (6 → 38 tests)
- Trace generation setup
- Documentation reorganization
- Script simplification
- Files changed

**Use this** to understand what was improved and why.

---

### 📝 [TESTING.md.old](TESTING.md.old)
**Original Testing Documentation**

Backup of the original testing guide (for reference).

---

## 🎯 Quick Links by Task

### I want to...

**Run tests:**
- → [README.md - Running Tests](README.md#running-tests)

**Understand what's tested:**
- → [COVERAGE.md - Test Coverage](COVERAGE.md#test-coverage)

**Debug a failed test:**
- → [TRACE_VIEWER_GUIDE.md - Viewing Traces](TRACE_VIEWER_GUIDE.md#viewing-traces)

**See test results:**
- → [README.md - Test Report](README.md#debugging)

**Write new tests:**
- → [README.md - Writing New Tests](README.md#writing-new-tests)

**Fix flaky tests:**
- → [README.md - Common Issues](README.md#common-issues)
- → [TRACE_VIEWER_GUIDE.md - Debug Timing Issues](TRACE_VIEWER_GUIDE.md#understand-timing-issues)

**Set up CI/CD:**
- → [README.md - Example Test Session](README.md#example-test-session)
- → [TRACE_VIEWER_GUIDE.md - Automated CI/CD](TRACE_VIEWER_GUIDE.md#automated-cicd-traces)

---

## 📦 Test Files Location

All test files are in the `/tests` directory:

```
tests/
├── consumer.spec.js     # Consumer functionality (6 tests)
├── producer.spec.js     # Message production (6 tests)
├── theme.spec.js        # Theme toggle (5 tests)
├── settings.spec.js     # Connection settings (10 tests)
├── admin.spec.js        # Topic administration (6 tests)
└── messages.spec.js     # Message browsing (5 tests)
```

## ⚡ Common Commands

```bash
# Run all tests (headless, recommended)
pnpm test:headless

# Run with browser visible
pnpm test:headed

# Interactive test UI
pnpm test:ui

# Debug mode (step-by-step)
pnpm test:debug

# View HTML report
pnpm test:report

# View trace file
pnpm exec playwright show-trace test-results/[test-name]/trace.zip
```

## 🆘 Getting Help

1. **Check the guides:**
   - Start with [README.md](README.md)
   - Review [Common Issues](README.md#common-issues)

2. **Use traces for debugging:**
   - See [TRACE_VIEWER_GUIDE.md](TRACE_VIEWER_GUIDE.md)

3. **Understand test coverage:**
   - Review [COVERAGE.md](COVERAGE.md)

4. **Check test artifacts:**
   ```bash
   ls test-results/*/trace.zip
   ls test-results/*/*.png
   ```

---

## 📖 External Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Tests](https://playwright.dev/docs/debug)
- [Trace Viewer](https://playwright.dev/docs/trace-viewer)

---

**Last Updated:** January 2025  
**Total Tests:** 38  
**Test Framework:** Playwright 1.56.0
