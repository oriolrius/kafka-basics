# 🚀 Automated NPM Publishing Setup

This project now includes automated NPM publishing using GitHub Actions! Here's how it works:

## 📋 Overview

The repository includes two main workflows:

- **CI/CD Pipeline** (`ci.yml`) - Runs on every push/PR and publishes on releases
- **Release Workflow** (`release.yml`) - Creates releases and triggers publishing

## 🔧 Setup Required

### 1. NPM Token

You need to add your NPM token as a GitHub secret:

1. Go to [npmjs.com](https://npmjs.com) → Account → Access Tokens
2. Create a new **Automation** token (read/write)
3. Go to your GitHub repo → Settings → Secrets and variables → Actions
4. Add a new repository secret:
   - **Name**: `NPM_TOKEN`
   - **Value**: Your NPM token

### 2. Repository Settings

Make sure your repository allows:

- GitHub Actions to run
- Actions to write to the repository
- Creating releases

## 📦 How to Publish

### Option 1: Manual Release (Recommended)

1. Go to **Actions** tab in GitHub
2. Select **Release** workflow
3. Click **Run workflow**
4. Choose version bump type:
   - `patch` for bug fixes (2.1.2 → 2.1.3)
   - `minor` for features (2.1.2 → 2.2.0)
   - `major` for breaking changes (2.1.2 → 3.0.0)
5. Click **Run workflow**

This will:

- Bump the version in package.json
- Create a git tag
- Create a GitHub release with changelog
- Trigger the CI/CD pipeline to publish to npm

### Option 2: Manual Git Tags

```bash
# Bump version locally
npm version patch  # or minor/major

# Push changes and tags
git push origin main --tags
```

### Option 3: Create GitHub Release

1. Go to **Releases** → **Create a new release**
2. Choose/create a tag (format: `v2.1.3`)
3. Add release notes
4. Click **Publish release**

## 🔄 CI/CD Pipeline

The pipeline automatically:

### On Push/PR

- ✅ Lints code with ESLint
- ✅ Builds the project with Vite
- ✅ Validates package creation
- ⏸️ Tests (currently commented out - not mature enough)

### On Release

- ✅ All above checks
- 🚀 Publishes to npm as `@oriolrius/kafka-basics`
- 📧 Notifies on success/failure

> **Note**: Playwright tests are currently commented out in the workflow as they need more development. To enable them later, uncomment the `test` job in `ci.yml` and add `test` back to the `needs` array in the `publish` job.

## 📊 Monitoring

After setup, you can monitor:

- **GitHub Actions**: Check the Actions tab for pipeline status
- **NPM Package**: <https://www.npmjs.com/package/@oriolrius/kafka-basics>
- **Package downloads**: NPM provides analytics

## 🎯 Usage After Publishing

Once published, users can install your Kafka toolkit with:

```bash
# Run directly without installation
npx @oriolrius/kafka-basics web
npx @oriolrius/kafka-basics kstart
npx @oriolrius/kafka-basics kpub --topic test --message "Hello"

# Or with pnpm
pnpm dlx @oriolrius/kafka-basics web
```

## 🛠️ Development Workflow

1. **Make changes** to your code
2. **Test locally**: `pnpm build && pnpm lint`
3. **Commit & push** to main branch
4. **Create release** when ready to publish
5. **GitHub Actions** handles the rest!

## 🔍 Troubleshooting

### Build Failures

- Check Node.js version compatibility (>=18.0.0)
- Ensure all dependencies are properly declared
- Verify ESLint passes: `pnpm lint`

### Publishing Failures

- Verify NPM_TOKEN is correct and has proper permissions
- Check if package name is available on npm
- Ensure version number hasn't been used before

### Common Issues

- **Token expired**: Generate new NPM token
- **Permission denied**: Check token has automation/publish rights
- **Version conflict**: Bump version number appropriately

## 📚 Files in this Directory

- `ci.yml` - Main CI/CD pipeline
- `release.yml` - Release automation
- `README.md` - This documentation

Your Kafka toolkit is now ready for automated publishing! 🎉