# Kafka Basics

> Complete Kafka toolkit with web UI, CLI tools, and comprehensive documentation

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/oriolrius/kafka-basics)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

A modern, full-featured Kafka development toolkit with both **React Web UI** and **CLI tools** for producers, consumers, and topic administration.

## ✨ Features

- 🌐 **Modern Web UI** - React-based interface with light/dark themes
- 📤 **Producers** - Send JSON, Text, or Avro messages
- 📥 **Consumers** - Real-time message streaming with auto-scroll
- ⚙️ **Admin Tools** - Topic management and inspection
- 🔧 **Connection Settings** - Configure all Kafka security protocols
- 🧪 **Testing** - Playwright E2E test suite
- 🐳 **Docker Support** - Kafka broker setup included

## 🚀 Quick Start

### Web UI (Recommended)

\`\`\`bash
# Install dependencies
pnpm install

# Start Kafka (if not running)
docker compose up -d

# Launch Web UI + API
pnpm web
\`\`\`

Access at: <http://localhost:3000>

📖 See [WEB_UI_README.md](WEB_UI_README.md) for detailed web UI documentation.

### CLI Tools

\`\`\`bash
# Install dependencies
pnpm install

# Configure environment
cp .env.example .env

# Use CLI commands
pnpm kstart            # Show help
pnpm kpub              # Send message
pnpm ksub              # Consume messages
\`\`\`

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [WEB_UI_README.md](WEB_UI_README.md) | Complete Web UI documentation |
| [QUICKSTART.md](QUICKSTART.md) | Step-by-step getting started guide |
| [TESTING.md](TESTING.md) | Playwright testing guide |
| [README.md](README.md) | This file - overview and CLI reference |

## 🌐 Web UI

Modern React-based interface with:

- **Producer Tab** - Send messages to topics
- **Consumer Tab** - Real-time message streaming  
- **Messages Tab** - Browse all messages in a topic
- **Admin Tab** - Topic info and management
- **Settings Tab** - Configure Kafka connections
- **Light/Dark Themes** - Toggle with one click

### Web UI Scripts

\`\`\`bash
pnpm web               # Start both API and frontend
pnpm api               # Start API server only
pnpm dev               # Start frontend only
pnpm build             # Build for production
pnpm preview           # Preview production build
\`\`\`

## 📁 Project Structure

\`\`\`text
kafka-basics/
├── src/
│   ├── web/              # React Web UI
│   │   ├── components/   # React components
│   │   ├── App.jsx       # Main app
│   │   ├── main.jsx      # Entry point
│   │   └── styles.css    # Styling
│   ├── api/              # Express API server
│   │   └── server.js     # Backend for web UI
│   ├── producers/        # CLI producers
│   │   ├── producer.js
│   │   └── avro-producer.js
│   ├── consumers/        # CLI consumers
│   │   ├── consumer.js
│   │   ├── avro-consumer.js
│   │   └── universal-consumer.js
│   ├── admin/            # CLI admin tools
│   │   ├── topic-info.js
│   │   ├── delete-topic.js
│   │   └── list-messages.js
│   └── utils/            # Shared utilities
│       ├── kafka-config.js
│       └── diagnostic.js
├── tests/                # Playwright E2E tests
├── docker-compose.yml    # Kafka broker setup
├── index.html            # Web UI entry
├── vite.config.js        # Vite configuration
└── package.json          # Dependencies and scripts
\`\`\`

## 🔧 CLI Usage

### Producers

\`\`\`bash
pnpm kpub              # Send JSON/Text messages
pnpm kpub-avro         # Send Avro messages
\`\`\`

### Consumers

\`\`\`bash
pnpm ksub              # Consume JSON/Text messages
pnpm ksub-avro         # Consume Avro messages
pnpm ksub-universal    # Auto-detect message format
\`\`\`

### Admin Tools

\`\`\`bash
pnpm klist             # List all messages in topic
pnpm ktopic-info       # Show topic information
pnpm ktopic-delete     # Delete topic
\`\`\`

### Utilities

\`\`\`bash
pnpm kstart            # Show help and structure
pnpm kdiagnose         # Test Kafka connection
```

### Testing

Run comprehensive Playwright E2E tests covering all features:

```bash
pnpm test:headless     # Run all tests (CI mode)
pnpm test:headed       # Run with browser visible
pnpm test:ui           # Interactive test UI
pnpm test:report       # View last test report
```

📚 **[Complete Testing Guide →](testing/README.md)**

## ⚙️ Configuration
\`\`\`

### Testing

\`\`\`bash
pnpm test              # Run Playwright tests
pnpm test:headed       # Run tests with browser visible
pnpm test:debug        # Debug tests step-by-step
pnpm test:ui           # Interactive test UI
\`\`\`

## ⚙️ Configuration

### Environment Variables

Create a \`.env\` file (see \`.env.example\`):

\`\`\`env
# Kafka Broker
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=kafka-web-ui

# Security Protocol (PLAINTEXT, SSL, SASL_PLAINTEXT, SASL_SSL)
SECURITY_PROTOCOL=PLAINTEXT

# SSL/TLS (when using SSL or SASL_SSL)
KAFKA_USE_TLS=false
KAFKA_REJECT_UNAUTHORIZED=true

# SASL Authentication (when using SASL_PLAINTEXT or SASL_SSL)
# Mechanisms: plain, scram-sha-256, scram-sha-512, aws, oauthbearer
KAFKA_SASL_MECHANISM=plain
KAFKA_USERNAME=
KAFKA_PASSWORD=

# Schema Registry
SCHEMA_REGISTRY_URL=http://localhost:8081
SCHEMA_REGISTRY_USE_TLS=false
SCHEMA_REGISTRY_USERNAME=
SCHEMA_REGISTRY_PASSWORD=

# API Server
API_PORT=3001
\`\`\`

### Web UI Settings

Configure connection settings directly in the **🔧 Settings** tab:

- Broker addresses
- Security protocols (PLAINTEXT, SSL, SASL)
- Authentication (PLAIN, SCRAM, AWS, OAuth)
- Schema Registry
- Export to \`.env\` file

## 🐳 Docker Setup

Start Kafka broker locally:

\`\`\`bash
docker compose up -d
\`\`\`

This creates:

- Kafka broker on \`localhost:9092\`
- Single-node KRaft mode (no Zookeeper)
- Auto-created topics enabled
- Persistent volume for data

Stop Kafka:

\`\`\`bash
docker compose down
\`\`\`

## 🧪 Testing

Comprehensive Playwright test suite:

\`\`\`bash
# Start web server
pnpm web

# Run tests (in another terminal)
pnpm test
\`\`\`

See [TESTING.md](TESTING.md) for details.

## 🏗️ Technology Stack

**Frontend:**

- React 19.2.0
- Vite 7.1.9
- Modern ES modules

**Backend:**

- Express 5.1.0
- KafkaJS 2.2.4
- CORS enabled

**Testing:**

- Playwright
- Chromium headless

**Infrastructure:**

- Docker Compose
- Apache Kafka (latest)
- Node.js 18+

## 📖 Examples

### Web UI Workflow

1. Start Kafka: \`docker compose up -d\`
2. Launch UI: \`pnpm web\`
3. Go to Settings → Configure connection
4. Go to Producer → Send test message
5. Go to Consumer → Start consumer and see messages
6. Go to Admin → View topic info

### CLI Workflow

\`\`\`bash
# View topic information
pnpm ktopic-info

# Send a message
KAFKA_TOPIC=my-topic KAFKA_MESSAGE_CONTENT="Hello" pnpm kpub

# Consume messages
KAFKA_TOPIC=my-topic pnpm ksub

# List all messages
KAFKA_TOPIC=my-topic pnpm klist
\`\`\`

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built with [KafkaJS](https://kafka.js.org/)
- UI powered by [React](https://react.dev/)
- Testing with [Playwright](https://playwright.dev/)

---

**Author:** Oriol Rius  
**Repository:** <https://github.com/oriolrius/kafka-basics>  
**Version:** 2.0.0
