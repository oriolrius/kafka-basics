# OAuth2 / OAUTHBEARER Setup Guide

Complete guide for setting up and using kafka-basics with OAuth2 authentication (OAUTHBEARER mechanism).

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Infrastructure Components](#infrastructure-components)
4. [Step-by-Step Setup](#step-by-step-setup)
5. [Configuration](#configuration)
6. [Testing OAuth2](#testing-oauth2)
7. [Troubleshooting](#troubleshooting)
8. [Production Considerations](#production-considerations)

## Overview

This project includes a complete OAuth2/OAUTHBEARER authentication setup for Kafka, including:

- **Keycloak** as the OAuth2 Authorization Server (OIDC provider)
- **Apache Kafka** with Strimzi OAuth libraries for token validation
- **Custom OAuth2 Token Provider** for KafkaJS clients
- **TLS/SSL encryption** with self-signed certificates
- **Pre-configured clients** for producers and consumers

### Why OAuth2 for Kafka?

OAuth2 provides:
- Token-based authentication (no password transmission)
- Fine-grained access control via scopes and claims
- Centralized user/client management
- Token expiration and refresh capabilities
- Integration with enterprise identity providers

## Quick Start

### 1. Add Hostnames to /etc/hosts

```bash
# Linux/Mac
sudo sh -c 'echo "127.0.0.1 kafka-basics-keycloak kafka-basics" >> /etc/hosts'

# Windows (as Administrator in PowerShell)
Add-Content -Path C:\Windows\System32\drivers\etc\hosts -Value "127.0.0.1 kafka-basics-keycloak kafka-basics"
```

**Why?** The SSL certificates use these hostnames as Subject Alternative Names (SANs).

### 2. Start OAuth2 Infrastructure

```bash
# Start Keycloak and Kafka broker with OAuth2
docker compose -f docker-compose-oauth.yml up -d

# Watch logs (optional)
docker compose -f docker-compose-oauth.yml logs -f
```

**Wait for services**: Kafka waits for Keycloak to be ready (may take 30-60 seconds).

### 3. Configure Environment

Create `.env` file in your project directory:

```bash
# Copy the OAuth2 configuration template
cat > .env << 'EOF'
# Kafka Broker Configuration
KAFKA_BROKER=kafka-basics:9093
KAFKA_BROKERS=kafka-basics:9093
KAFKA_CLIENT_ID=kafka-basics-oauth-test
KAFKA_TOPIC=test-topic

# TLS Configuration
KAFKA_USE_TLS=true
KAFKA_REJECT_UNAUTHORIZED=false
KAFKA_SSL_CA_LOCATION=./oauth2/certificates/ca.crt

# SASL OAuth2 Configuration
KAFKA_SASL_MECHANISM=oauthbearer
OAUTH_ENABLED=true

# OAuth2 Credentials (Producer)
OAUTH_CLIENT_ID=kafka-producer-client
OAUTH_CLIENT_SECRET=kafka-producer-client-secret

# OAuth2 Endpoints
OAUTH_TOKEN_ENDPOINT_URI=https://kafka-basics-keycloak:55443/realms/kafka-basics/protocol/openid-connect/token
OAUTH_JWKS_ENDPOINT_URI=https://kafka-basics-keycloak:55443/realms/kafka-basics/protocol/openid-connect/certs
OAUTH_SSL_CA_LOCATION=./oauth2/certificates/ca.crt
OAUTH_SSL_REJECT_UNAUTHORIZED=false

# Token expiry buffer (in seconds)
OAUTH_TOKEN_EXPIRY_BUFFER=60

# Schema Registry Configuration (optional)
SCHEMA_REGISTRY_URL=http://localhost:8081
SCHEMA_REGISTRY_USE_TLS=false
EOF
```

### 4. Test OAuth2 Authentication

```bash
# Test producer (send message)
pnpm kpub
# or
npx @oriolrius/kafka-basics kpub

# Test consumer (receive messages)
pnpm ksub
# or
npx @oriolrius/kafka-basics ksub

# Start Web UI
pnpm web
# Navigate to http://localhost:3000
```

**Success indicators**:
- Producer: "Connected successfully!" with OAuth2 enabled message
- Consumer: "Connected to Kafka successfully!" with OAuth2 configuration
- Web UI: Settings tab shows OAuth2 configuration loaded

## Infrastructure Components

### 1. Keycloak (Authorization Server)

**Container**: `kafka-basics-keycloak`
**Image**: `quay.io/keycloak/keycloak:26.3.3`
**Ports**:
- `55080` - HTTP (for admin console and health checks)
- `55443` - HTTPS (for OAuth2 endpoints and Kafka)

**Pre-configured Realm**: `kafka-basics`

**Pre-configured Clients**:

| Client ID | Secret | Purpose |
|-----------|--------|---------|
| `kafka-broker` | `kafka-broker-secret` | Inter-broker authentication |
| `kafka-producer-client` | `kafka-producer-client-secret` | Producer applications |
| `kafka-consumer-client` | `kafka-consumer-client-secret` | Consumer applications |

**Admin Access**:
- URL: https://localhost:55443 or http://localhost:55080
- Username: `admin`
- Password: `admin`

**Key Endpoints**:
- Token endpoint: `https://kafka-basics-keycloak:55443/realms/kafka-basics/protocol/openid-connect/token`
- JWKS endpoint: `https://kafka-basics-keycloak:55443/realms/kafka-basics/protocol/openid-connect/certs`
- Issuer: `https://kafka-basics-keycloak:55443/realms/kafka-basics`

### 2. Kafka Broker with Strimzi OAuth

**Container**: `kafka-basics-broker-oauth`
**Custom Image**: Built from `oauth2/kafka/Dockerfile`
**Port**: `9093` (SASL_SSL with OAUTHBEARER)

**Strimzi OAuth Libraries**:
- `kafka-oauth-client-*.jar` - Client authentication
- `kafka-oauth-server-*.jar` - Server-side token validation
- `kafka-oauth-common-*.jar` - Shared utilities

**Authentication Flow**:
1. Client requests token from Keycloak
2. Client presents token to Kafka broker
3. Broker validates token via JWKS endpoint
4. Broker checks token issuer and expiration
5. Access granted/denied based on validation

**Three Listeners**:
- **CONTROLLER** (9091): SASL_PLAINTEXT with SCRAM-SHA-512 (internal)
- **REPLICATION** (9092): SSL with mutual TLS (internal)
- **CLIENT** (9093): SASL_SSL with OAUTHBEARER (external access)

### 3. Certificate Infrastructure

**Location**: `oauth2/certificates/`

**Files**:
- `ca.crt` / `ca.key` - Root Certificate Authority
- `keycloak-server.crt` / `keycloak-server.key` - Keycloak HTTPS certificate
- `keycloak-server.p12` - Keycloak keystore (PKCS12)
- `cluster.keystore.p12` - Kafka broker keystore
- `cluster.truststore.p12` - Kafka broker truststore
- `ca-truststore.p12` - CA certificate for OAuth validation

**Certificate SANs** (keycloak-server.crt):
- DNS: `kafka-basics-keycloak`
- DNS: `localhost`
- IP: `127.0.0.1`

**Regenerate Certificates**:
```bash
cd oauth2/certificates
./gen-ca.sh
cd ../..
docker compose -f docker-compose-oauth.yml build
docker compose -f docker-compose-oauth.yml up -d
```

## Step-by-Step Setup

### Step 1: Prerequisites

```bash
# Install Docker and Docker Compose
docker --version  # Should be 20.x or higher
docker compose version  # Should be v2.x

# Install Node.js (>= 18.0.0)
node --version  # Should be v18.x or higher

# Install pnpm (recommended) or npm
pnpm --version
```

### Step 2: Clone and Install

```bash
# Clone repository (if not already done)
git clone https://github.com/oriolrius/kafka-basics.git
cd kafka-basics

# Install dependencies
pnpm install
# or
npm install
```

### Step 3: Configure Hostnames

Add to `/etc/hosts` (required for SSL certificate validation):

```bash
# Linux/Mac
echo "127.0.0.1 kafka-basics-keycloak kafka-basics" | sudo tee -a /etc/hosts

# Verify
ping -c 1 kafka-basics-keycloak
```

For Windows, see [Quick Start](#quick-start) section.

### Step 4: Start Infrastructure

```bash
# Start in detached mode
docker compose -f docker-compose-oauth.yml up -d

# Check status
docker compose -f docker-compose-oauth.yml ps

# Should show:
# - kafka-basics-keycloak (healthy)
# - kafka-basics-broker-oauth (running)

# View logs
docker compose -f docker-compose-oauth.yml logs kafka-basics-keycloak
docker compose -f docker-compose-oauth.yml logs kafka-basics-broker-oauth
```

**Startup sequence**:
1. Keycloak starts (20-30 seconds)
2. Keycloak imports realm configuration
3. Kafka waits for Keycloak health check
4. Kafka starts and registers with OAuth2

### Step 5: Verify Keycloak

```bash
# Check Keycloak is accessible
curl -k https://kafka-basics-keycloak:55443/realms/kafka-basics

# Should return JSON with realm information

# Manually fetch token (test authentication)
curl -k -X POST https://kafka-basics-keycloak:55443/realms/kafka-basics/protocol/openid-connect/token \
  -d "grant_type=client_credentials" \
  -d "client_id=kafka-producer-client" \
  -d "client_secret=kafka-producer-client-secret"

# Should return JSON with access_token
```

### Step 6: Configure Environment

Create `.env` file (see [Quick Start](#quick-start) for template).

Key configuration points:

| Variable | Value | Description |
|----------|-------|-------------|
| `KAFKA_BROKER` | `kafka-basics:9093` | OAuth2-enabled listener |
| `KAFKA_SASL_MECHANISM` | `oauthbearer` | SASL mechanism |
| `OAUTH_ENABLED` | `true` | Enable OAuth2 |
| `OAUTH_CLIENT_ID` | `kafka-producer-client` | Your client ID |
| `OAUTH_CLIENT_SECRET` | `kafka-producer-client-secret` | Your client secret |
| `OAUTH_TOKEN_ENDPOINT_URI` | `https://kafka-basics-keycloak:55443/...` | Token endpoint |
| `KAFKA_USE_TLS` | `true` | Enable TLS |
| `KAFKA_SSL_CA_LOCATION` | `./oauth2/certificates/ca.crt` | CA certificate |

### Step 7: Test CLI Tools

```bash
# Test producer
pnpm kpub

# Expected output:
# Kafka Configuration:
# - Broker: kafka-basics:9093
# - TLS: Yes
# - SASL: Yes (oauthbearer)
# - OAuth2: Enabled
# - Client ID: kafka-producer-client
# [OAuth2] Fetching new access token from https://...
# [OAuth2] Token acquired successfully (expires in 36000s)
# Connecting to Kafka...
# Connected successfully!

# Test consumer (in another terminal)
pnpm ksub

# Should show similar OAuth2 messages and start consuming
```

### Step 8: Test Web UI

```bash
# Start web server
pnpm web

# Access UI
# Open http://localhost:3000 in browser

# Verify settings loaded:
# 1. Go to Settings tab
# 2. Check "Security Protocol" = SASL_SSL
# 3. Check "SASL Mechanism" = OAUTHBEARER
# 4. Check "OAuth2 Enabled" is checked
# 5. Check OAuth2 credentials are populated

# Test connection:
# Click "Test Connection" button
# Should show: "Connection successful!"

# Test producer:
# 1. Go to Producer tab
# 2. Enter topic name
# 3. Enter message
# 4. Click "Send Message"
# Should succeed with OAuth2
```

## Configuration

### Environment Variables

#### Required Variables

```env
# Broker connection
KAFKA_BROKER=kafka-basics:9093
KAFKA_BROKERS=kafka-basics:9093

# OAuth2 mechanism
KAFKA_SASL_MECHANISM=oauthbearer
OAUTH_ENABLED=true

# OAuth2 credentials
OAUTH_CLIENT_ID=kafka-producer-client
OAUTH_CLIENT_SECRET=kafka-producer-client-secret

# OAuth2 endpoints
OAUTH_TOKEN_ENDPOINT_URI=https://kafka-basics-keycloak:55443/realms/kafka-basics/protocol/openid-connect/token
```

#### Optional Variables

```env
# JWKS endpoint (for token validation)
OAUTH_JWKS_ENDPOINT_URI=https://kafka-basics-keycloak:55443/realms/kafka-basics/protocol/openid-connect/certs

# OAuth2 scope (if required by authorization server)
OAUTH_SCOPE=kafka

# Token expiry buffer (refresh token N seconds before expiry)
OAUTH_TOKEN_EXPIRY_BUFFER=60

# SSL configuration for OAuth2 endpoints
OAUTH_SSL_CA_LOCATION=./oauth2/certificates/ca.crt
OAUTH_SSL_REJECT_UNAUTHORIZED=false

# SSL configuration for Kafka
KAFKA_USE_TLS=true
KAFKA_REJECT_UNAUTHORIZED=false
KAFKA_SSL_CA_LOCATION=./oauth2/certificates/ca.crt
```

### Consumer Configuration

For consumers, use the consumer client credentials:

```env
# Use consumer client
OAUTH_CLIENT_ID=kafka-consumer-client
OAUTH_CLIENT_SECRET=kafka-consumer-client-secret

# Consumer group
KAFKA_CONSUMER_GROUP=my-consumer-group

# Start from beginning
KAFKA_FROM_BEGINNING=true
```

### Programmatic Configuration

```javascript
import { buildKafkaConfig } from './src/utils/kafka-config.js';

// Build configuration with OAuth2 support
const kafkaConfig = await buildKafkaConfig('my-client-id');

// Configuration includes:
// - brokers: [kafka-basics:9093]
// - ssl: { ... CA certificate ... }
// - sasl: {
//     mechanism: 'oauthbearer',
//     oauthBearerProvider: async () => { /* token fetching */ }
//   }

const kafka = new Kafka(kafkaConfig);
```

## Testing OAuth2

### Test 1: Manual Token Fetch

```bash
# Fetch token using curl
TOKEN=$(curl -k -s -X POST \
  https://kafka-basics-keycloak:55443/realms/kafka-basics/protocol/openid-connect/token \
  -d "grant_type=client_credentials" \
  -d "client_id=kafka-producer-client" \
  -d "client_secret=kafka-producer-client-secret" \
  | jq -r .access_token)

echo "Token: $TOKEN"

# Decode token (optional - requires jwt.io or base64)
echo $TOKEN | cut -d. -f2 | base64 -d 2>/dev/null | jq
```

**Expected token claims**:
```json
{
  "exp": 1728864000,
  "iat": 1728828000,
  "iss": "https://kafka-basics-keycloak:55443/realms/kafka-basics",
  "aud": "account",
  "sub": "...",
  "typ": "Bearer",
  "azp": "kafka-producer-client",
  "scope": "profile email"
}
```

### Test 2: CLI Producer with Debug

```bash
# Enable Node.js debug output
DEBUG=kafkajs* pnpm kpub

# Or add console.log in oauth-token-provider.js
```

### Test 3: Web UI Connection Test

1. Open Web UI: http://localhost:3000
2. Go to Settings tab
3. Verify OAuth2 configuration is loaded
4. Click "Test Connection"
5. Check browser console (F12) for OAuth2 logs

### Test 4: End-to-End Message Flow

```bash
# Terminal 1: Start consumer
KAFKA_TOPIC=oauth-test pnpm ksub

# Terminal 2: Send message
KAFKA_TOPIC=oauth-test KAFKA_MESSAGE_CONTENT='{"test":"oauth2"}' pnpm kpub

# Consumer should receive the message
```

## Troubleshooting

### Issue 1: Hostname Resolution Errors

**Error**: `getaddrinfo ENOTFOUND kafka-basics-keycloak`

**Solution**: Add hostnames to `/etc/hosts`:
```bash
echo "127.0.0.1 kafka-basics-keycloak kafka-basics" | sudo tee -a /etc/hosts
```

### Issue 2: Certificate Validation Errors

**Error**: `unable to verify the first certificate` or `self signed certificate`

**Solution**: Disable certificate validation in `.env`:
```env
KAFKA_REJECT_UNAUTHORIZED=false
OAUTH_SSL_REJECT_UNAUTHORIZED=false
```

**For production**: Use properly signed certificates and enable validation.

### Issue 3: Token Endpoint Unreachable

**Error**: `Token request error: connect ECONNREFUSED`

**Check Keycloak status**:
```bash
docker compose -f docker-compose-oauth.yml ps kafka-basics-keycloak
docker compose -f docker-compose-oauth.yml logs kafka-basics-keycloak
```

**Verify endpoint**:
```bash
curl -k https://kafka-basics-keycloak:55443/realms/kafka-basics
```

### Issue 4: Invalid Token or Unauthorized

**Error**: `Authentication failed` or `Invalid token`

**Check token issuer**:
```bash
# Fetch token
TOKEN=$(curl -k -s -X POST \
  https://kafka-basics-keycloak:55443/realms/kafka-basics/protocol/openid-connect/token \
  -d "grant_type=client_credentials" \
  -d "client_id=kafka-producer-client" \
  -d "client_secret=kafka-producer-client-secret" \
  | jq -r .access_token)

# Decode and check issuer
echo $TOKEN | cut -d. -f2 | base64 -d 2>/dev/null | jq .iss
```

**Issuer must match**: `https://kafka-basics-keycloak:55443/realms/kafka-basics`

**Common cause**: Port mismatch in URLs. Always use port 55443 for consistency.

### Issue 5: Kafka Broker Not Starting

**Check logs**:
```bash
docker compose -f docker-compose-oauth.yml logs kafka-basics-broker-oauth
```

**Common issues**:
- Keycloak not ready: Kafka waits for health check
- OAuth library missing: Check Dockerfile copied JARs correctly
- Certificate path error: Verify `/tmp/kafka/` volume mount

**Restart services**:
```bash
docker compose -f docker-compose-oauth.yml down
docker compose -f docker-compose-oauth.yml up -d
```

### Issue 6: Token Expired

**Error**: `Token expired` or re-authentication fails

**Check token expiry buffer**:
```env
OAUTH_TOKEN_EXPIRY_BUFFER=60  # Refresh 60s before expiry
```

**Tokens expire in 10 hours by default** (36000 seconds). Adjust in Keycloak if needed.

### Issue 7: Consumer Group Errors

**Error**: `Not authorized to access group`

**Solution**: Kafka broker configured with `KAFKA_SUPER_USERS` for service accounts.

**Check realm configuration**: Ensure client has proper roles/scopes in Keycloak.

### Debug Checklist

```bash
# 1. Check hostnames resolve
ping -c 1 kafka-basics-keycloak
ping -c 1 kafka-basics

# 2. Check services running
docker compose -f docker-compose-oauth.yml ps

# 3. Check Keycloak accessible
curl -k https://kafka-basics-keycloak:55443/realms/kafka-basics

# 4. Fetch token manually
curl -k -X POST https://kafka-basics-keycloak:55443/realms/kafka-basics/protocol/openid-connect/token \
  -d "grant_type=client_credentials" \
  -d "client_id=kafka-producer-client" \
  -d "client_secret=kafka-producer-client-secret"

# 5. Check .env file exists and is correct
cat .env

# 6. Check Kafka logs
docker compose -f docker-compose-oauth.yml logs kafka-basics-broker-oauth | tail -50

# 7. Test CLI with debug
DEBUG=kafkajs* pnpm kpub
```

## Production Considerations

### Security Hardening

1. **Use Real Certificates**
   - Obtain certificates from trusted CA (Let's Encrypt, etc.)
   - Enable certificate validation:
     ```env
     KAFKA_REJECT_UNAUTHORIZED=true
     OAUTH_SSL_REJECT_UNAUTHORIZED=true
     ```

2. **Secure Keycloak**
   - Change default admin password
   - Use strong client secrets
   - Enable HTTPS only (disable HTTP)
   - Use external database (PostgreSQL) instead of embedded H2

3. **Network Isolation**
   - Use private networks for inter-service communication
   - Expose only necessary ports
   - Use firewall rules

4. **Secret Management**
   - Use secret management tools (Vault, AWS Secrets Manager)
   - Don't commit `.env` to version control
   - Rotate client secrets regularly

### Scalability

1. **Keycloak Clustering**
   - Use external database
   - Run multiple Keycloak instances behind load balancer
   - Configure proper session replication

2. **Kafka Clustering**
   - Use multiple brokers (3+ recommended)
   - Configure replication factor > 1
   - Use rack awareness for high availability

3. **Token Caching**
   - Token provider caches tokens by default
   - Adjust `OAUTH_TOKEN_EXPIRY_BUFFER` based on load
   - Consider Redis for distributed token caching

### Monitoring

1. **Keycloak Metrics**
   - Enable Keycloak metrics endpoint
   - Monitor token issuance rate
   - Alert on authentication failures

2. **Kafka Metrics**
   - Monitor OAuth authentication failures
   - Track token validation latency
   - Alert on JWKS endpoint unavailability

3. **Application Metrics**
   - Log OAuth token acquisition
   - Track token refresh operations
   - Monitor connection establishment time

### High Availability

1. **Keycloak HA**
   - Multi-node Keycloak cluster
   - External PostgreSQL with replication
   - Load balancer with health checks

2. **Kafka HA**
   - Multiple brokers across availability zones
   - Replication factor = 3 (recommended)
   - Min in-sync replicas = 2

3. **OAuth Token Validation**
   - JWKS caching in Kafka brokers (Strimzi default)
   - Fallback to cached keys if Keycloak unavailable
   - Circuit breaker for token endpoint

### Migration from SASL/PLAIN

1. **Dual Authentication** (transition period)
   - Enable both PLAIN and OAUTHBEARER on different listeners
   - Migrate clients gradually
   - Monitor usage of both mechanisms

2. **Client Migration Steps**
   - Create OAuth clients in Keycloak for existing users
   - Update client configuration (`.env` files)
   - Test in development environment
   - Deploy to production incrementally

3. **Decommission PLAIN**
   - Ensure all clients migrated (check metrics)
   - Remove PLAIN listener from Kafka
   - Update firewall rules

## Additional Resources

- **Strimzi OAuth**: https://github.com/strimzi/strimzi-kafka-oauth
- **Keycloak Docs**: https://www.keycloak.org/documentation
- **KafkaJS**: https://kafka.js.org/
- **OAuth 2.0 RFC 6749**: https://tools.ietf.org/html/rfc6749
- **JWT RFC 7519**: https://tools.ietf.org/html/rfc7519

## Summary

You now have a complete OAuth2-enabled Kafka development environment with:

- ✅ Keycloak authorization server
- ✅ Kafka broker with OAuth2 validation
- ✅ Pre-configured clients for testing
- ✅ TLS/SSL encryption
- ✅ Token caching and automatic refresh
- ✅ CLI and Web UI support

**Next steps**:
1. Test the setup with provided commands
2. Customize Keycloak realm for your use case
3. Add additional clients/users as needed
4. Consider production hardening measures

For issues or questions, please open a GitHub issue: https://github.com/oriolrius/kafka-basics/issues
