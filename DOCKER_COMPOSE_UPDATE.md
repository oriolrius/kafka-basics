# Docker Compose Update - Unified Configuration

## Changes Made

### 1. Removed Separate Docker Compose Files

**Removed:**
- `docker-compose.yml` (simple PLAINTEXT-only setup)
- `docker-compose-oauth.yml` (OAuth2-only setup)

**Created:**
- New unified `docker-compose.yml` with **both** PLAINTEXT and OAuth2 support

### 2. New Unified docker-compose.yml

The new configuration provides **two access modes** in a single setup:

#### Port 55092 - PLAINTEXT (Testing)
- **Protocol**: PLAINTEXT
- **Authentication**: None
- **SSL/TLS**: None
- **Use case**: Quick testing, development, CI/CD
- **Connection**: `localhost:55092`

#### Port 55093 - OAuth2 (Production)
- **Protocol**: SASL_SSL
- **Authentication**: OAuth2/OAUTHBEARER via Keycloak
- **SSL/TLS**: Yes (self-signed certificates)
- **Use case**: Production, security testing
- **Connection**: `localhost:55093`

### 3. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                 docker-compose.yml                       │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌───────────────────────────────────────────────┐      │
│  │   Keycloak (OAuth2 Authorization Server)      │      │
│  │   - HTTP:  localhost:55080                    │      │
│  │   - HTTPS: localhost:55443                    │      │
│  │   - Realm: kafka-basics                       │      │
│  │   - Admin: admin / admin                      │      │
│  └───────────────────────────────────────────────┘      │
│                         ▲                                │
│                         │ OAuth2                         │
│                         │                                │
│  ┌───────────────────────────────────────────────┐      │
│  │   Kafka Broker (kafka-basics)                 │      │
│  │                                                │      │
│  │   Port 55092: PLAINTEXT (no auth, no SSL)     │◄────┼─── Testing
│  │              ├─ Easy access                    │      │
│  │              ├─ Quick prototyping              │      │
│  │              └─ CI/CD pipelines                │      │
│  │                                                │      │
│  │   Port 55093: SASL_SSL with OAuth2            │◄────┼─── Production
│  │              ├─ Token authentication           │      │
│  │              ├─ SSL/TLS encryption             │      │
│  │              └─ Keycloak integration           │      │
│  └───────────────────────────────────────────────┘      │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Usage

### Quick Start (PLAINTEXT - No Auth)

```bash
# 1. Start services
docker compose up -d

# 2. Create .env or use these settings
KAFKA_BROKER=localhost:55092
KAFKA_USE_TLS=false
# Leave auth empty
KAFKA_SASL_MECHANISM=
KAFKA_USERNAME=
KAFKA_PASSWORD=

# 3. Test with CLI
pnpm kpub

# 4. Or start web UI
pnpm web
# Open http://localhost:3000
```

### Production Setup (OAuth2)

```bash
# 1. Start services
docker compose up -d

# 2. Add to /etc/hosts (IMPORTANT!)
echo "127.0.0.1 kafka-basics-keycloak kafka-basics" | sudo tee -a /etc/hosts

# 3. Configure .env for OAuth2
KAFKA_BROKER=localhost:55093
KAFKA_USE_TLS=true
KAFKA_REJECT_UNAUTHORIZED=false
KAFKA_SASL_MECHANISM=oauthbearer
OAUTH_ENABLED=true
OAUTH_CLIENT_ID=kafka-producer-client
OAUTH_CLIENT_SECRET=kafka-producer-client-secret
OAUTH_TOKEN_ENDPOINT_URI=https://kafka-basics-keycloak:55443/realms/kafka-basics/protocol/openid-connect/token
OAUTH_JWKS_ENDPOINT_URI=https://kafka-basics-keycloak:55443/realms/kafka-basics/protocol/openid-connect/certs
OAUTH_SSL_CA_LOCATION=./oauth2/certificates/ca.crt
OAUTH_SSL_REJECT_UNAUTHORIZED=false

# 4. Test
pnpm kpub
```

## Updated .env.example

The `.env.example` file has been updated with:

1. **Quickstart section** at the top showing PLAINTEXT configuration
2. **Default values** pointing to `localhost:9092` (PLAINTEXT)
3. **OAuth2 examples** showing how to use port 9093
4. **Clear comments** explaining each port's purpose

## Benefits of Unified Configuration

### Before (2 separate files)
- ❌ Had to choose between PLAINTEXT OR OAuth2
- ❌ Two different docker-compose files
- ❌ Switching required stopping and starting different files
- ❌ Documentation mentioned both files causing confusion

### After (1 unified file)
- ✅ Both PLAINTEXT AND OAuth2 available simultaneously
- ✅ Single `docker compose up -d` command
- ✅ Switch between modes by just changing port number
- ✅ Test locally with 9092, then switch to 9093 for production
- ✅ No need to tear down and rebuild
- ✅ Simpler documentation

## Port Summary

| Port | Protocol | Auth | SSL | Use Case |
|------|----------|------|-----|----------|
| 55092 | PLAINTEXT | ❌ No | ❌ No | Testing, Development |
| 55093 | SASL_SSL | ✅ OAuth2 | ✅ Yes | Production, Security Testing |
| 55080 | HTTP | N/A | ❌ No | Keycloak Admin (HTTP) |
| 55443 | HTTPS | N/A | ✅ Yes | Keycloak Admin & OAuth (HTTPS) |

## Testing Both Modes

### Test PLAINTEXT (55092)

```bash
# Create test .env
cat > .env << EOF
KAFKA_BROKER=localhost:55092
KAFKA_CLIENT_ID=test-client
KAFKA_TOPIC=test-topic
KAFKA_USE_TLS=false
KAFKA_MESSAGE_CONTENT={"message":"Hello from PLAINTEXT"}
EOF

# Send message
pnpm kpub

# Consume
pnpm ksub
```

### Test OAuth2 (55093)

```bash
# Update .env for OAuth2
cat > .env << EOF
KAFKA_BROKER=localhost:55093
KAFKA_CLIENT_ID=kafka-basics-oauth
KAFKA_TOPIC=test-topic
KAFKA_USE_TLS=true
KAFKA_REJECT_UNAUTHORIZED=false
KAFKA_SASL_MECHANISM=oauthbearer
OAUTH_ENABLED=true
OAUTH_CLIENT_ID=kafka-producer-client
OAUTH_CLIENT_SECRET=kafka-producer-client-secret
OAUTH_TOKEN_ENDPOINT_URI=https://kafka-basics-keycloak:55443/realms/kafka-basics/protocol/openid-connect/token
OAUTH_SSL_CA_LOCATION=./oauth2/certificates/ca.crt
OAUTH_SSL_REJECT_UNAUTHORIZED=false
KAFKA_MESSAGE_CONTENT={"message":"Hello from OAuth2"}
EOF

# Send message
pnpm kpub

# Consume
pnpm ksub
```

## Keycloak Pre-configured Clients

The Keycloak realm includes these service accounts:

| Client ID | Secret | Permissions | Use Case |
|-----------|--------|-------------|----------|
| `kafka-broker` | `kafka-broker-secret` | Full admin | Inter-broker communication |
| `kafka-producer-client` | `kafka-producer-client-secret` | Producer | Sending messages |
| `kafka-consumer-client` | `kafka-consumer-client-secret` | Consumer | Reading messages |

Access Keycloak:
- **URL**: https://localhost:55443
- **Username**: `admin`
- **Password**: `admin`

## Troubleshooting

### Port Already in Use

```bash
# Kill existing processes
docker compose down

# Remove orphaned containers
docker ps -a | grep kafka | awk '{print $1}' | xargs docker rm -f
```

### Permission Errors

The broker runs as root (`user: "0:0"`) to avoid volume permission issues.

### Kafka Won't Start

```bash
# Check logs
docker logs kafka-basics-broker

# If cluster ID mismatch, clear volumes
docker compose down -v
docker compose up -d
```

### OAuth2 Connection Fails

1. Check `/etc/hosts` includes:
   ```
   127.0.0.1 kafka-basics-keycloak kafka-basics
   ```

2. Verify Keycloak is running:
   ```bash
   curl -k https://kafka-basics-keycloak:55443/realms/kafka-basics
   ```

3. Check certificates exist:
   ```bash
   ls -la oauth2/certificates/ca.crt
   ```

## Migration from Old Setup

If you were using the old `docker-compose.yml` or `docker-compose-oauth.yml`:

```bash
# 1. Stop old setup
docker compose down -v
# or
docker compose -f docker-compose-oauth.yml down -v

# 2. Use new unified setup
docker compose up -d

# 3. Update .env - no changes needed if using PLAINTEXT
#    Just point to localhost:55092

# 4. For OAuth2, point to localhost:55093
```

## Docker Compose Configuration Details

### Key Environment Variables

```yaml
# Listeners define what ports and protocols are available
KAFKA_LISTENERS: CONTROLLER://kafka-basics:9091,PLAINTEXT://kafka-basics:9092,OAUTH://kafka-basics:9093

# Protocol mapping
KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: CONTROLLER:SASL_PLAINTEXT,PLAINTEXT:PLAINTEXT,OAUTH:SASL_SSL

# Inter-broker uses PLAINTEXT for simplicity
KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT

# Advertised listeners (what clients connect to)
KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:55092,OAUTH://localhost:55093
```

### Services

```yaml
services:
  kafka-basics-keycloak:
    # Keycloak 26.3.3 with pre-configured realm

  kafka-basics-broker:
    # Custom Kafka image with Strimzi OAuth libraries
    # Ports: 55092 (PLAINTEXT), 55093 (OAuth2)
```

## Files Modified

- `docker-compose.yml` - Unified configuration (CREATED/REPLACED)
- `.env.example` - Updated with PLAINTEXT defaults and OAuth2 examples
- `docker-compose-oauth.yml` - REMOVED (functionality merged into main file)

## Files Removed

- `docker-compose.yml.backup` - Old PLAINTEXT-only config (backed up then removed)
- `docker-compose-oauth.yml` - Old OAuth2-only config (functionality merged)

## Documentation Updates Needed

The following files reference docker-compose files and may need updates:
- `README.md` - Update docker-compose commands
- `OAUTH2_SETUP.md` - Update to reference new unified setup
- `CLAUDE.md` - Update Docker infrastructure section
- `tests/README.md` - Already updated

---

**Date**: 2025-10-15
**Impact**: High - Simplifies deployment and testing workflow
**Breaking Changes**: None - both old configurations are supported in new unified setup
