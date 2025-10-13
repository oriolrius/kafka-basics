# CLAUDE.md - Project Deep Dive

> Comprehensive technical documentation for AI assistants working on kafka-basics

## Project Overview

**kafka-basics** is a complete Apache Kafka development toolkit providing both CLI tools and a modern React web interface for interacting with Kafka brokers. It supports multiple authentication methods including OAuth2/OAUTHBEARER, making it suitable for both development and production environments.

**Version**: 2.3.0
**Author**: Oriol Rius
**License**: MIT
**NPM Package**: `@oriolrius/kafka-basics`
**Repository**: https://github.com/oriolrius/kafka-basics

**Documentation Files**:
- `README.md` - User-facing documentation and quick start
- `OAUTH2_SETUP.md` - Complete OAuth2/OAUTHBEARER setup guide
- `TESTING.md` - Playwright testing guide
- `CLAUDE.md` - This file - technical deep dive for AI assistants

### Core Purpose

1. **Development Tool**: Rapid Kafka prototyping and testing
2. **Educational Tool**: Learn Kafka concepts with a visual interface
3. **Production Tool**: Connect to any Kafka cluster with comprehensive security support
4. **CLI Toolkit**: Scriptable Kafka operations for automation

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      kafka-basics                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌─────────────────────────┐   │
│  │   CLI Tools      │         │      Web Interface      │   │
│  │  (bin/*.js)      │         │  (React + Vite)         │   │
│  └────────┬─────────┘         └───────────┬─────────────┘   │
│           │                               │                  │
│           │    ┌──────────────────────┐   │                 │
│           └────┤  Shared Utilities    ├───┘                 │
│                │  - kafka-config.js   │                      │
│                │  - oauth-provider.js │                      │
│                └──────────┬───────────┘                      │
│                           │                                  │
│                    ┌──────▼──────┐                          │
│                    │   KafkaJS   │                          │
│                    └──────┬──────┘                          │
└───────────────────────────┼─────────────────────────────────┘
                            │
                    ┌───────▼────────┐
                    │  Kafka Broker  │
                    │  (any version) │
                    └────────────────┘
```

### Component Architecture

#### 1. CLI Layer (`bin/`)

**Entry Point**: `bin/kafka-basics.js`

Command routing system that spawns Node processes for each command:

- `web` → Launches Vite dev server + Express API
- `kstart` → Shows project structure
- `kpub` → Producer CLI
- `ksub` → Consumer CLI
- `ktopic-info` → Topic information

**Key Pattern**: Commands pass `USER_CWD` environment variable to locate user's `.env` file when using `npx`.

#### 2. Backend Layer (`src/api/`)

**File**: `src/api/server.js`

Express API server providing:
- `/api/produce` - Send messages
- `/api/consume` - Subscribe to topics
- `/api/list-messages` - Get all messages
- `/api/topics` - List topics
- `/api/topic-info/:topic` - Topic metadata
- `/api/delete-topic/:topic` - Delete topic
- `/api/test-connection` - Test Kafka connectivity
- `/api/config` - Read `.env` configuration

**Port**: 3001 (configurable via `API_PORT`)

**Critical Feature**: Non-blocking initialization with retry logic to prevent crashes if Kafka is unavailable at startup.

```javascript
// Server starts immediately
app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
});

// Kafka initialization happens in background with retries
async function initKafkaWithRetries(maxRetries = 5, delayMs = 5000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await initKafka();
      return;
    } catch (error) {
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
}
```

#### 3. Frontend Layer (`src/web/`)

**Framework**: React 19.2.0 with Vite
**Entry**: `src/web/main.jsx` → `src/web/App.jsx`

**Tab-Based Architecture**:

| Tab | Component | Purpose |
|-----|-----------|---------|
| Overview | `Overview.jsx` | Welcome page with documentation |
| Producer | `Producer.jsx` | Send messages to topics |
| Consumer | `Consumer.jsx` | Real-time message streaming |
| Messages | `MessageList.jsx` | Browse all messages with pagination |
| Admin | `TopicInfo.jsx` | Topic management and metadata |
| Settings | `Settings.jsx` | Connection and security configuration |

**State Management**:
- `localStorage` for theme, shared topic, and connection config
- Component-level state for tab-specific data
- No Redux/Context - kept simple intentionally

**Shared Topic Pattern**: All tabs share a single topic input that syncs across the entire application via `sharedTopic` state in `App.jsx`.

#### 4. Producers (`src/producers/`)

Three producer implementations:

1. **producer.js** - Basic JSON/Text producer
2. **avro-producer.js** - Avro with Schema Registry support
3. Used by both CLI and API server

**Pattern**: All use centralized `buildKafkaConfig()` for consistent authentication.

#### 5. Consumers (`src/consumers/`)

Three consumer implementations:

1. **consumer.js** - Basic JSON/Text consumer
2. **avro-consumer.js** - Avro with Schema Registry support
3. **universal-consumer.js** - Auto-detects format

**Graceful Shutdown**: All consumers implement signal handling for clean disconnection.

#### 6. Admin Tools (`src/admin/`)

- **topic-info.js** - Partition offsets, watermarks, metadata
- **list-messages.js** - Fetch all messages from topic
- **delete-topic.js** - Remove topics

#### 7. Utilities (`src/utils/`)

**kafka-config.js** - Centralized Kafka configuration builder

Key functions:
- `buildKafkaConfig(clientId)` - Complete Kafka config with OAuth2 support
- `buildSslConfig()` - TLS/SSL configuration
- `buildSaslConfig()` - SASL authentication (plain, scram, oauth)
- `buildRegistryConfig()` - Schema Registry configuration
- `printKafkaConfig()` - Debug output

**oauth-token-provider.js** - OAuth2 token management

Implements:
- Token caching with expiry tracking
- Automatic token refresh with configurable buffer time
- HTTPS support with custom CA certificates
- Client credentials flow (grant_type=client_credentials)

Class: `OAuth2TokenProvider`
```javascript
const provider = new OAuth2TokenProvider({
  tokenEndpointUri: 'https://keycloak:55443/realms/kafka/protocol/openid-connect/token',
  clientId: 'kafka-client',
  clientSecret: 'secret',
  sslCaLocation: './certs/ca.crt',
  tokenExpiryBuffer: 60 // seconds
});

// Used internally by KafkaJS
const token = await provider.getToken();
```

## Directory Structure

```
kafka-basics/
├── assets/                      # Screenshots for README
│   ├── admin-tab.png
│   ├── consumer-tab.png
│   ├── producer-tab.png
│   └── settings-tab.png
│
├── bin/                         # CLI executables (chmod +x)
│   ├── kafka-basics.js         # Main CLI entry point
│   ├── kpub.js                 # Producer shortcut
│   ├── ksub.js                 # Consumer shortcut
│   ├── ktopic-info.js          # Topic info shortcut
│   ├── kstart.js               # Help shortcut
│   └── capture-screenshots.js  # Playwright screenshot automation
│
├── contrib/                     # Contribution tools
│   └── bumpr/                  # Version bumping utilities
│
├── examples/                    # Sample data
│   └── sample-message.json     # Example Kafka message
│
├── oauth2/                      # OAuth2/OIDC infrastructure
│   ├── certificates/           # CA, server certs, keystores
│   │   ├── ca.crt
│   │   ├── ca.key
│   │   ├── keycloak-server.crt
│   │   └── *.p12              # PKCS12 keystores
│   ├── kafka/                  # Custom Kafka image with Strimzi OAuth
│   │   ├── Dockerfile
│   │   ├── start.sh           # Kafka startup script
│   │   ├── oauth.sh           # OAuth configuration helper
│   │   └── libs/              # Strimzi OAuth JAR files
│   └── keycloak/               # Keycloak configuration
│       └── realms/            # Pre-configured realm with clients
│
├── schemas/                     # Avro schemas
│   └── test-schema.json
│
├── src/
│   ├── admin/                  # Admin CLI tools
│   │   ├── delete-topic.js
│   │   ├── list-messages.js
│   │   └── topic-info.js
│   │
│   ├── api/                    # Express backend
│   │   └── server.js          # REST API for Web UI
│   │
│   ├── consumers/              # Consumer implementations
│   │   ├── consumer.js        # JSON/Text consumer
│   │   ├── avro-consumer.js   # Avro consumer
│   │   └── universal-consumer.js
│   │
│   ├── producers/              # Producer implementations
│   │   ├── producer.js        # JSON/Text producer
│   │   └── avro-producer.js   # Avro producer
│   │
│   ├── utils/                  # Shared utilities
│   │   ├── kafka-config.js    # Config builder (CORE)
│   │   ├── oauth-token-provider.js  # OAuth2 implementation
│   │   ├── diagnostic.js      # Connection testing
│   │   └── show-structure.js  # Help text
│   │
│   └── web/                    # React frontend
│       ├── App.jsx            # Main application
│       ├── main.jsx           # React entry point
│       ├── styles.css         # Global styles with theme variables
│       ├── fonts.css          # Font Awesome integration
│       ├── components/
│       │   ├── Consumer.jsx   # Real-time consumer UI
│       │   ├── Producer.jsx   # Message sending UI
│       │   ├── MessageList.jsx # Message browser
│       │   ├── TopicInfo.jsx  # Topic metadata viewer
│       │   ├── Settings.jsx   # Configuration UI (24KB!)
│       │   └── Overview.jsx   # Welcome page
│       └── fonts/             # Font Awesome webfonts
│
├── tests/                      # Playwright E2E tests
│   ├── admin.spec.js          # Topic admin tests
│   ├── consumer.spec.js       # Consumer functionality
│   ├── producer.spec.js       # Producer functionality
│   ├── messages.spec.js       # Message list tests
│   ├── settings.spec.js       # Settings UI tests
│   ├── theme.spec.js          # Theme toggle tests
│   ├── screenshots.spec.js    # Screenshot generation
│   └── README.md              # Testing guide
│
├── .env                        # Environment configuration (user-created)
├── .env.example                # Example configuration
├── docker-compose.yml          # Simple Kafka broker (PLAINTEXT)
├── docker-compose-oauth.yml    # Kafka + Keycloak with OAuth2
├── index.html                  # Vite entry HTML
├── package.json                # Dependencies and scripts
├── vite.config.js              # Vite configuration
├── playwright.config.js        # Test configuration
├── README.md                   # User documentation
├── TESTING.md                  # Testing guide (symlink to tests/README.md)
└── CLAUDE.md                   # This file
```

## Technology Stack

### Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| kafkajs | ^2.2.4 | Kafka client library |
| express | ^5.1.0 | REST API server |
| react | ^19.2.0 | UI framework |
| react-dom | ^19.2.0 | React rendering |
| vite | ^7.1.9 | Build tool and dev server |
| dotenv | ^16.3.1 | Environment variables |
| cors | ^2.8.5 | Cross-origin support |
| @kafkajs/confluent-schema-registry | ^3.3.0 | Avro support |
| avsc | ^5.7.7 | Avro serialization |
| concurrently | ^9.2.1 | Run API + frontend together |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| @playwright/test | ^1.56.0 | E2E testing framework |
| eslint | ^8.57.1 | Code linting |

### External Systems

- **Apache Kafka**: Any version with KRaft or Zookeeper
- **Keycloak**: 26.3.3 (for OAuth2 setup)
- **Docker**: For local Kafka/Keycloak infrastructure
- **Node.js**: >= 18.0.0 required

## Features

### Security Protocols Supported

1. **PLAINTEXT** - No encryption, no authentication
2. **SSL** - TLS encryption only
3. **SASL_PLAINTEXT** - Authentication without encryption
4. **SASL_SSL** - Both TLS and authentication

### SASL Mechanisms

1. **PLAIN** - Simple username/password
2. **SCRAM-SHA-256** - Salted Challenge Response
3. **SCRAM-SHA-512** - Stronger SCRAM variant
4. **OAUTHBEARER** - OAuth2 token-based authentication
5. **AWS** - AWS IAM authentication (KafkaJS built-in)

### OAuth2 Implementation

**Complete OAUTHBEARER support** with:

- Client Credentials flow (RFC 6749)
- Token caching with automatic refresh
- Configurable expiry buffer (default 60s)
- SSL/TLS support for token endpoints
- Custom CA certificate support
- Used for both client authentication and inter-broker communication

**OAuth2 Configuration Example**:

```env
# Enable OAuth2
KAFKA_SASL_MECHANISM=oauthbearer
OAUTH_ENABLED=true

# OAuth2 Credentials
OAUTH_CLIENT_ID=kafka-producer-client
OAUTH_CLIENT_SECRET=kafka-producer-client-secret

# OAuth2 Endpoints
OAUTH_TOKEN_ENDPOINT_URI=https://kafka-basics-keycloak:55443/realms/kafka-basics/protocol/openid-connect/token
OAUTH_JWKS_ENDPOINT_URI=https://kafka-basics-keycloak:55443/realms/kafka-basics/protocol/openid-connect/certs

# SSL Configuration for OAuth
OAUTH_SSL_CA_LOCATION=./oauth2/certificates/ca.crt
OAUTH_SSL_REJECT_UNAUTHORIZED=false
OAUTH_TOKEN_EXPIRY_BUFFER=60
```

### SSL/TLS Configuration

Supports:
- Custom CA certificates (`KAFKA_SSL_CA_LOCATION`)
- Client certificates for mutual TLS (`KAFKA_SSL_CERT_LOCATION`, `KAFKA_SSL_KEY_LOCATION`)
- Certificate validation control (`KAFKA_REJECT_UNAUTHORIZED`)

### Schema Registry Integration

Full Avro support with Confluent Schema Registry:
- Automatic schema registration
- Schema evolution
- Basic authentication
- TLS support

## Configuration System

### Configuration Priority (Lowest to Highest)

1. **Hardcoded defaults** in `kafka-config.js`
2. **`.env` file** in user's working directory
3. **Environment variables** in shell
4. **Inline environment variables** with command
5. **Web UI settings** (stored in localStorage)

### Key Environment Variables

```env
# === Kafka Broker ===
KAFKA_BROKER=localhost:9092              # Single broker (CLI scripts)
KAFKA_BROKERS=localhost:9092             # Broker list (API server)
KAFKA_CLIENT_ID=kafka-basics-client
KAFKA_TOPIC=test-topic

# === Security ===
KAFKA_USE_TLS=true                       # Enable SSL/TLS
KAFKA_REJECT_UNAUTHORIZED=true           # Verify certificates
KAFKA_SSL_CA_LOCATION=/path/to/ca.crt
KAFKA_SSL_CERT_LOCATION=/path/to/cert.pem  # Client cert (mutual TLS)
KAFKA_SSL_KEY_LOCATION=/path/to/key.pem    # Client key (mutual TLS)

# === SASL Authentication ===
KAFKA_SASL_MECHANISM=plain               # plain, scram-sha-256, scram-sha-512, oauthbearer
KAFKA_USERNAME=user
KAFKA_PASSWORD=pass

# === OAuth2 ===
OAUTH_ENABLED=true
OAUTH_CLIENT_ID=my-client
OAUTH_CLIENT_SECRET=my-secret
OAUTH_TOKEN_ENDPOINT_URI=https://auth-server/token
OAUTH_JWKS_ENDPOINT_URI=https://auth-server/certs
OAUTH_SCOPE=kafka                        # Optional
OAUTH_SSL_CA_LOCATION=/path/to/ca.crt
OAUTH_SSL_REJECT_UNAUTHORIZED=true
OAUTH_TOKEN_EXPIRY_BUFFER=60             # Seconds before expiry to refresh

# === Schema Registry ===
SCHEMA_REGISTRY_URL=http://localhost:8081
SCHEMA_REGISTRY_USE_TLS=false
SCHEMA_REGISTRY_USERNAME=user
SCHEMA_REGISTRY_PASSWORD=pass

# === Consumer Settings ===
KAFKA_CONSUMER_GROUP=my-group
KAFKA_FROM_BEGINNING=true

# === Producer Settings ===
KAFKA_MESSAGE_CONTENT={"key":"value"}
KAFKA_MESSAGE_KEY=my-key

# === API Server ===
API_PORT=3001
```

### Web UI Configuration

The Settings component (`src/web/components/Settings.jsx`) provides a comprehensive UI for:

- Broker configuration
- Security protocol selection
- SASL mechanism configuration
- SSL certificate paths
- OAuth2 credentials and endpoints
- Schema Registry settings
- Test connection functionality
- Export to `.env` file

**Auto-loading**: Settings are automatically loaded from `/api/config` endpoint on mount, which reads the `.env` file.

## Docker Infrastructure

### Simple Setup (docker-compose.yml)

Single-broker Kafka in KRaft mode:
- Port: 9092
- Protocol: PLAINTEXT
- Auto-create topics: enabled
- No Zookeeper required
- Persistent volume: `kafka-basics-data`

Usage:
```bash
docker compose up -d
```

### OAuth2 Setup (docker-compose-oauth.yml)

Complete OAuth2 infrastructure with:

1. **Keycloak** (kafka-basics-keycloak)
   - Ports: 55080 (HTTP), 55443 (HTTPS)
   - Pre-configured realm: `kafka-basics`
   - Pre-configured clients:
     - `kafka-broker` (broker authentication)
     - `kafka-producer-client` (producer)
     - `kafka-consumer-client` (consumer)
   - Custom hostname: `kafka-basics-keycloak`
   - Self-signed SSL certificate

2. **Kafka Broker** (kafka-basics-broker-oauth)
   - Custom image with Strimzi OAuth libraries
   - Port: 9093
   - Protocol: SASL_SSL with OAUTHBEARER
   - Three listeners:
     - CONTROLLER (9091): SASL_PLAINTEXT with SCRAM-SHA-512
     - REPLICATION (9092): SSL with client auth
     - CLIENT (9093): SASL_SSL with OAUTHBEARER
   - OAuth validation via JWKS endpoint
   - Token issuer validation
   - Hostname: `kafka-basics`

**Important**: Requires hostname mapping in `/etc/hosts`:
```
127.0.0.1 kafka-basics-keycloak kafka-basics
```

Usage:
```bash
docker compose -f docker-compose-oauth.yml up -d
```

### Certificate Infrastructure

Located in `oauth2/certificates/`:

- **ca.crt / ca.key**: Root CA for all certificates
- **keycloak-server.crt**: Keycloak HTTPS certificate
- **cluster.keystore.p12**: Kafka broker keystore
- **cluster.truststore.p12**: Kafka broker truststore
- **ca-truststore.p12**: CA certificate in PKCS12 format

**Regeneration**: Use `oauth2/certificates/gen-ca.sh` to regenerate all certificates.

**SAN Configuration**: Keycloak certificate includes:
- DNS: kafka-basics-keycloak
- DNS: localhost
- IP: 127.0.0.1

## Testing

### Test Framework

**Playwright** for E2E testing with:
- Chromium headless browser
- HTML report generation
- Trace recording on failure
- Screenshot capture
- Parallel execution

### Test Organization

| File | Tests | Coverage |
|------|-------|----------|
| `admin.spec.js` | 6 | Topic info, message listing, deletion |
| `consumer.spec.js` | 6 | Subscription, polling, message display |
| `producer.spec.js` | 6 | Message sending, validation, format switching |
| `messages.spec.js` | 5 | Message browsing, metadata, timestamps |
| `settings.spec.js` | 10 | Connection config, protocols, SASL |
| `theme.spec.js` | 5 | Theme toggle, persistence |
| `screenshots.spec.js` | 9 | Documentation screenshot generation |

**Total**: 47 tests

### Running Tests

```bash
# Start dependencies
docker compose up -d
pnpm web

# Run tests (separate terminal)
pnpm test:headless     # CI mode
pnpm test:headed       # Watch browser
pnpm test:ui           # Interactive UI
pnpm test:debug        # Step-by-step debugging

# View report
pnpm test:report       # Opens on 0.0.0.0:9323
```

### Test Configuration

**playwright.config.js**:
- Base URL: http://localhost:3000
- Timeout: 30s per test
- Retries: 2 on CI, 0 locally
- Screenshots: only on failure
- Traces: on first retry
- Workers: 1 (sequential to avoid Kafka conflicts)

**playwright.screenshots.config.js**:
- Optimized for documentation screenshot generation
- Headless mode
- Larger viewport (1920x1080)
- No parallelization

### Screenshot Automation

The `bin/capture-screenshots.js` script:
1. Starts web server automatically
2. Waits for server to be ready
3. Runs screenshot tests via Playwright
4. Saves to `assets/` directory
5. Cleans up server process

Usage:
```bash
pnpm capture-screenshots
```

Screenshots are used in README.md to showcase the UI.

## Development Workflow

### Local Development

```bash
# Clone repository
git clone https://github.com/oriolrius/kafka-basics.git
cd kafka-basics

# Install dependencies
pnpm install

# Start local Kafka (optional)
docker compose up -d

# Configure connection
cp .env.example .env
# Edit .env with your Kafka broker details

# Start web interface
pnpm web
# Runs API (port 3001) + Vite (port 3000) concurrently

# Or run separately
pnpm api      # API server only
pnpm dev      # Frontend only

# CLI development
pnpm kpub     # Test producer
pnpm ksub     # Test consumer
```

### Testing Workflow

```bash
# Lint code
pnpm lint
pnpm lint:fix

# Run tests
pnpm test

# Generate screenshots
pnpm capture-screenshots

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Publishing Workflow

GitHub Actions automation:

1. **CI Pipeline** (`.github/workflows/ci.yml`)
   - Runs on every push/PR
   - Lints code with ESLint
   - Builds with Vite
   - Validates package
   - Publishes to npm on releases

2. **Release Workflow** (`.github/workflows/release.yml`)
   - Manual trigger from GitHub Actions tab
   - Bumps version (patch/minor/major)
   - Creates git tag
   - Creates GitHub release
   - Triggers CI pipeline for publishing

**NPM Token Required**: Add `NPM_TOKEN` secret in GitHub repository settings.

## Important Patterns and Conventions

### ES Modules

The entire project uses ES modules (`"type": "module"` in package.json):

- Use `import/export` syntax
- Use `import.meta.url` for file paths
- Dynamic imports: `await import('./module.js')`
- No `require()` or `module.exports`

### Async Configuration Building

All Kafka configuration is async to support OAuth2 token fetching:

```javascript
// CORRECT
const kafkaConfig = await buildKafkaConfig();
const kafka = new Kafka(kafkaConfig);

// WRONG - will not work with OAuth2
const kafka = new Kafka(buildKafkaConfig());
```

### Environment Variable Loading

For npx usage, the system uses a two-step env loading:

1. `bin/kafka-basics.js` passes `USER_CWD` env var
2. `src/utils/kafka-config.js` loads `.env` from user's directory:

```javascript
const envPath = process.env.USER_CWD
  ? path.join(process.env.USER_CWD, '.env')
  : '.env';
dotenv.config({ path: envPath });
```

This allows `.env` files to work with `npx @oriolrius/kafka-basics`.

### Graceful Shutdown

All long-running processes implement graceful shutdown:

```javascript
const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
signalTraps.forEach(type => {
  process.once(type, async () => {
    await consumer.disconnect();
    process.exit(0);
  });
});
```

### Shared Topic State

The web UI maintains a single shared topic across all tabs:

```javascript
// In App.jsx
const [sharedTopic, setSharedTopic] = useState(() => {
  return localStorage.getItem('kafka-shared-topic') || 'test-topic';
});

// Passed to all components
<Producer topic={sharedTopic} onTopicChange={handleTopicChange} />
<Consumer topic={sharedTopic} onTopicChange={handleTopicChange} />
```

### Theme System

CSS custom properties for theming:

```css
[data-theme="dark"] {
  --bg-primary: #1a1a1a;
  --text-primary: #ffffff;
  --accent: #4a9eff;
}

[data-theme="light"] {
  --bg-primary: #ffffff;
  --text-primary: #333333;
  --accent: #0066cc;
}
```

Theme persisted in localStorage and applied via `data-theme` attribute on `<html>`.

### Error Handling

API endpoints return consistent error format:

```javascript
res.status(500).json({
  error: 'Error message',
  details: error.message  // Optional
});
```

Frontend displays errors in status divs:

```javascript
<div className="status error">
  {error}
</div>
```

### OAuth2 Token Caching

Token provider caches tokens and refreshes before expiry:

```javascript
isTokenValid() {
  const now = Math.floor(Date.now() / 1000);
  const bufferTime = this.config.tokenExpiryBuffer; // 60s default
  return (this.tokenExpiryTime - now) > bufferTime;
}
```

This prevents unnecessary token requests and ensures seamless re-authentication.

## Known Issues and Limitations

### 1. Multiple Server Instances

**Issue**: Running `pnpm web` multiple times can create multiple server instances on different ports.

**Solution**: Kill all instances before restarting:
```bash
pkill -9 -f "node.*server.js"
pkill -9 -f "vite"
pkill -9 -f "concurrently"
```

### 2. Port Conflicts

**Issue**: Vite auto-increments port if 3000 is occupied (3001, 3002, etc.)

**Detection**: Check Vite output for actual port:
```
➜  Local:   http://localhost:3008/
```

**Solution**: Use the port shown in Vite output, or kill old processes.

### 3. OAuth2 Hostname Resolution

**Issue**: OAuth2 requires hostname `kafka-basics-keycloak` to match certificate SAN.

**Solution**: Add to `/etc/hosts`:
```
127.0.0.1 kafka-basics-keycloak kafka-basics
```

**Windows**: Edit `C:\Windows\System32\drivers\etc\hosts`
**Linux/Mac**: Edit `/etc/hosts`

### 4. Certificate Validation

**Issue**: Self-signed certificates cause validation errors.

**Solution**: Set in `.env`:
```env
KAFKA_REJECT_UNAUTHORIZED=false
OAUTH_SSL_REJECT_UNAUTHORIZED=false
```

**Production**: Use properly signed certificates and enable validation.

### 5. Token Issuer Port Mismatch

**Issue**: OAuth2 tokens include issuer claim with port. If accessed via different port, validation fails.

**Solution**: Use consistent ports (55080/55443) for both internal and external access:
```yaml
# docker-compose-oauth.yml
ports:
  - "55443:55443"  # Same port mapping
command: "--https-port=55443"  # Keycloak internal port
```

### 6. Kafka Startup Timing

**Issue**: API server may fail to connect if Kafka isn't ready.

**Solution**: Implemented retry logic in `server.js`:
```javascript
async function initKafkaWithRetries(maxRetries = 5, delayMs = 5000) {
  // Retries connection up to 5 times with 5s delay
}
```

### 7. npx Caching

**Issue**: `npx` may cache old versions of the package.

**Solution**: Use `--yes` flag or clear cache:
```bash
npx --yes @oriolrius/kafka-basics web
# or
npm cache clean --force
```

### 8. Schema Registry Errors

**Issue**: Avro operations fail if Schema Registry is misconfigured.

**Solution**: Verify `SCHEMA_REGISTRY_URL` is accessible:
```bash
curl http://localhost:8081/subjects
```

## Common Tasks

### Add a New CLI Command

1. Create script in `src/` (e.g., `src/admin/my-command.js`)
2. Add to `bin/kafka-basics.js`:
   ```javascript
   const commands = {
     'my-command': ['node', join(srcDir, 'admin', 'my-command.js')],
   };
   ```
3. Create executable wrapper in `bin/my-command.js`:
   ```javascript
   #!/usr/bin/env node
   import('../src/admin/my-command.js');
   ```
4. Make executable: `chmod +x bin/my-command.js`
5. Add to `package.json`:
   ```json
   "bin": {
     "my-command": "bin/my-command.js"
   },
   "scripts": {
     "my-command": "node src/admin/my-command.js"
   }
   ```

### Add a New API Endpoint

1. Edit `src/api/server.js`:
   ```javascript
   app.post('/api/my-endpoint', async (req, res) => {
     try {
       const { param } = req.body;
       // Logic here
       res.json({ success: true, data: result });
     } catch (error) {
       res.status(500).json({ error: error.message });
     }
   });
   ```

2. Update frontend component to call it:
   ```javascript
   const response = await fetch('/api/my-endpoint', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ param: value })
   });
   const data = await response.json();
   ```

### Add OAuth2 Support to New Feature

1. Use `buildKafkaConfig()` for Kafka client:
   ```javascript
   import { buildKafkaConfig } from '../utils/kafka-config.js';

   const kafkaConfig = await buildKafkaConfig('my-client-id');
   const kafka = new Kafka(kafkaConfig);
   ```

2. For manual OAuth2 usage:
   ```javascript
   import { createOAuth2TokenProvider } from '../utils/oauth-token-provider.js';

   const provider = createOAuth2TokenProvider({
     tokenEndpointUri: process.env.OAUTH_TOKEN_ENDPOINT_URI,
     clientId: process.env.OAUTH_CLIENT_ID,
     clientSecret: process.env.OAUTH_CLIENT_SECRET,
   });

   const token = await provider.getToken();
   ```

### Add a New Web UI Tab

1. Create component in `src/web/components/MyTab.jsx`:
   ```javascript
   import React, { useState } from 'react';

   function MyTab({ topic, onTopicChange }) {
     return (
       <div className="tab-content">
         <h2>My Tab</h2>
         {/* Content */}
       </div>
     );
   }

   export default MyTab;
   ```

2. Import in `src/web/App.jsx`:
   ```javascript
   import MyTab from './components/MyTab';
   ```

3. Add tab button and content:
   ```javascript
   <button
     className={activeTab === 'mytab' ? 'tab active' : 'tab'}
     onClick={() => setActiveTab('mytab')}
   >
     <i className="fas fa-icon"></i> My Tab
   </button>

   <div style={{ display: activeTab === 'mytab' ? 'block' : 'none' }}>
     <MyTab topic={sharedTopic} onTopicChange={handleTopicChange} />
   </div>
   ```

### Update Keycloak Realm Configuration

1. Start Keycloak:
   ```bash
   docker compose -f docker-compose-oauth.yml up kafka-basics-keycloak
   ```

2. Access admin console: https://localhost:55443
   - Username: `admin`
   - Password: `admin`

3. Make changes in UI (add clients, users, etc.)

4. Export realm:
   ```bash
   docker exec kafka-basics-keycloak /opt/keycloak/bin/kc.sh export \
     --dir /opt/keycloak/data/export \
     --realm kafka-basics
   ```

5. Copy exported JSON:
   ```bash
   docker cp kafka-basics-keycloak:/opt/keycloak/data/export/kafka-basics-realm.json \
     oauth2/keycloak/realms/
   ```

6. Restart to test import:
   ```bash
   docker compose -f docker-compose-oauth.yml down
   docker compose -f docker-compose-oauth.yml up
   ```

### Regenerate Certificates

1. Navigate to certificate directory:
   ```bash
   cd oauth2/certificates
   ```

2. Edit `keycloak-server-ext.cnf` to add/modify SANs:
   ```ini
   [alt_names]
   DNS.1 = kafka-basics-keycloak
   DNS.2 = localhost
   IP.1 = 127.0.0.1
   ```

3. Run generation script:
   ```bash
   ./gen-ca.sh
   ```

4. Rebuild Kafka image (includes certificates):
   ```bash
   cd ../..
   docker compose -f docker-compose-oauth.yml build
   ```

5. Restart services:
   ```bash
   docker compose -f docker-compose-oauth.yml down
   docker compose -f docker-compose-oauth.yml up
   ```

### Debug OAuth2 Token Issues

1. Check Keycloak is accessible:
   ```bash
   curl -k https://kafka-basics-keycloak:55443/realms/kafka-basics
   ```

2. Manually fetch token:
   ```bash
   curl -k -X POST https://kafka-basics-keycloak:55443/realms/kafka-basics/protocol/openid-connect/token \
     -d "grant_type=client_credentials" \
     -d "client_id=kafka-producer-client" \
     -d "client_secret=kafka-producer-client-secret"
   ```

3. Decode JWT token (use jwt.io):
   ```bash
   echo "TOKEN" | cut -d. -f2 | base64 -d | jq
   ```

4. Check issuer claim matches:
   ```json
   {
     "iss": "https://kafka-basics-keycloak:55443/realms/kafka-basics"
   }
   ```

5. Enable debug logging:
   ```javascript
   // In oauth-token-provider.js
   console.log('[OAuth2 DEBUG]', JSON.stringify(tokenResponse, null, 2));
   ```

### Add Support for New SASL Mechanism

1. Update `buildSaslConfig()` in `src/utils/kafka-config.js`:
   ```javascript
   async function buildSaslConfig() {
     const mechanism = process.env.KAFKA_SASL_MECHANISM;

     if (mechanism === 'my-mechanism') {
       return {
         mechanism: 'my-mechanism',
         // Custom configuration
       };
     }
     // ... existing mechanisms
   }
   ```

2. Add environment variables to `.env.example`:
   ```env
   # My Mechanism
   KAFKA_SASL_MECHANISM=my-mechanism
   MY_MECHANISM_PARAM=value
   ```

3. Update Settings UI (`src/web/components/Settings.jsx`):
   ```javascript
   <option value="my-mechanism">My Mechanism</option>

   {config.saslMechanism === 'my-mechanism' && (
     <div className="form-group">
       <label htmlFor="myParam">My Parameter</label>
       <input id="myParam" value={config.myParam} onChange={...} />
     </div>
   )}
   ```

4. Update API server (`src/api/server.js`) `/api/test-connection`:
   ```javascript
   if (config.saslMechanism === 'my-mechanism') {
     kafkaConfig.sasl = {
       mechanism: 'my-mechanism',
       myParam: config.myParam
     };
   }
   ```

## File Reference Quick Guide

| File | Lines | Purpose | Key Functions/Components |
|------|-------|---------|--------------------------|
| `src/utils/kafka-config.js` | 158 | Core config builder | `buildKafkaConfig()`, `buildSaslConfig()`, `buildSslConfig()` |
| `src/utils/oauth-token-provider.js` | 243 | OAuth2 implementation | `OAuth2TokenProvider` class, `buildOAuth2SaslConfig()` |
| `src/api/server.js` | 400+ | Express API server | All `/api/*` endpoints, Kafka initialization |
| `src/web/App.jsx` | 128 | React root component | Tab routing, theme toggle, shared state |
| `src/web/components/Settings.jsx` | 900+ | Settings UI | Complete Kafka configuration form |
| `src/producers/producer.js` | 63 | CLI producer | `publishMessage()` |
| `src/consumers/consumer.js` | 109 | CLI consumer | `consumeMessages()`, graceful shutdown |
| `bin/kafka-basics.js` | 79 | CLI entry point | Command routing, process spawning |
| `docker-compose-oauth.yml` | 180+ | OAuth2 infrastructure | Keycloak + Kafka with OAuth2 |

## Version History

### 2.3.0 (Current)
- Added OAuth2/OAUTHBEARER support
- Custom OAuth2 token provider
- Docker compose with Keycloak
- Complete SSL/TLS certificate infrastructure
- API endpoint for reading `.env` configuration
- Settings UI auto-loading from backend
- Comprehensive OAuth2 documentation

### 2.2.x
- Added Overview welcome page
- Improved screenshot documentation
- Enhanced README with npx quick start
- Testing suite with Playwright
- Screenshot automation

### 2.x
- React 19 upgrade
- Vite 7 upgrade
- Modern ES modules throughout
- Theme system with localStorage
- Shared topic state

### 1.x
- Initial release
- Basic producer/consumer
- CLI tools
- Simple web UI

## Contributing Guidelines

When contributing to kafka-basics:

1. **Follow ES module conventions** - Use import/export
2. **Make async** - All Kafka config building must be async
3. **Reuse utilities** - Don't duplicate OAuth2 or config logic
4. **Test thoroughly** - Add Playwright tests for UI changes
5. **Update CLAUDE.md** - Document new patterns and features
6. **Lint before commit** - Run `pnpm lint:fix`
7. **Consider npx usage** - Ensure `.env` loading works with npx
8. **Maintain backward compatibility** - Don't break existing APIs

## Support and Resources

- **GitHub Issues**: https://github.com/oriolrius/kafka-basics/issues
- **NPM Package**: https://www.npmjs.com/package/@oriolrius/kafka-basics
- **KafkaJS Docs**: https://kafka.js.org/
- **Strimzi OAuth**: https://github.com/strimzi/strimzi-kafka-oauth
- **Keycloak Docs**: https://www.keycloak.org/documentation

---

**Last Updated**: 2025-10-13
**Maintained by**: Oriol Rius
**For**: Claude Code and AI assistants
