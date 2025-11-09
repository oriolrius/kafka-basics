# Docker Deployment for Kafka Basics Web Application

This directory contains Docker configuration for deploying the Kafka Basics web application as containerized services.

## Architecture

The deployment consists of two separate containers:

1. **Backend** (`kafka-basics-backend`) - Node.js Express API server
   - Port: 3001
   - Handles Kafka operations (produce, consume, admin)
   - Provides REST API for frontend

2. **Frontend** (`kafka-basics-frontend`) - Nginx serving static React SPA
   - Port: 8080
   - Serves the web UI
   - Proxies API requests to backend

## Quick Start

### Prerequisites

- Docker 24.0+
- Docker Compose v2+
- A running Kafka broker (or use the root `docker-compose.yml` for a local broker)

### 1. Start a Local Kafka Broker (Optional)

If you don't have a Kafka broker running:

```bash
# From project root
docker compose up -d
```

This starts a single-broker Kafka cluster on port 9092.

### 2. Configure Environment

```bash
cd docker
cp .env.example .env
# Edit .env with your Kafka configuration
```

**Minimal configuration:**

```env
KAFKA_BROKERS=host.docker.internal:9092
VITE_API_URL=/api
```

### 3. Build and Run

```bash
# Build and start both services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

### 4. Access the Application

- **Web UI**: http://localhost:8080
- **API**: http://localhost:3001/api

## Manual Build (Without Docker Compose)

### Build Images

```bash
# From project root
pnpm docker:build:backend   # Build backend only
pnpm docker:build:frontend  # Build frontend only
pnpm docker:build          # Build both
```

Or directly with Docker:

```bash
# Backend
docker build -f docker/Dockerfile --target backend -t kafka-basics-backend .

# Frontend
docker build -f docker/Dockerfile --target frontend \
  --build-arg VITE_API_URL=/api \
  -t kafka-basics-frontend .
```

### Run Manually

```bash
# Create network
docker network create kafka-basics-network

# Run backend
docker run -d \
  --name kafka-basics-backend \
  --network kafka-basics-network \
  -p 3001:3001 \
  -e KAFKA_BROKERS=host.docker.internal:9092 \
  -e KAFKA_CLIENT_ID=kafka-basics-docker \
  kafka-basics-backend

# Run frontend
docker run -d \
  --name kafka-basics-frontend \
  --network kafka-basics-network \
  -p 8080:8080 \
  kafka-basics-frontend
```

## Configuration

### Environment Variables

All Kafka configuration from the main `.env.example` is supported. Key variables:

#### Server Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Node environment |
| `API_PORT` | `3001` | Backend API port |
| `BACKEND_EXTERNAL_PORT` | `3001` | Host port for backend |
| `FRONTEND_EXTERNAL_PORT` | `8080` | Host port for frontend |
| `VITE_API_URL` | `/api` | API URL for frontend (build-time) |

#### Kafka Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `KAFKA_BROKERS` | `localhost:9092` | Broker list (comma-separated) |
| `KAFKA_CLIENT_ID` | `kafka-basics-docker` | Client identifier |
| `KAFKA_TOPIC` | `test-topic` | Default topic |
| `KAFKA_USE_TLS` | `false` | Enable SSL/TLS |
| `KAFKA_SASL_MECHANISM` | - | SASL mechanism (plain, scram-sha-256, oauthbearer) |

#### OAuth2 Configuration

| Variable | Description |
|----------|-------------|
| `OAUTH_ENABLED` | Enable OAuth2 authentication |
| `OAUTH_CLIENT_ID` | OAuth2 client ID |
| `OAUTH_CLIENT_SECRET` | OAuth2 client secret |
| `OAUTH_TOKEN_ENDPOINT_URI` | Token endpoint URL |
| `OAUTH_JWKS_ENDPOINT_URI` | JWKS endpoint URL |

See `docker/.env.example` for complete configuration options.

### Accessing Host Services from Container

To connect to services running on the host machine (like a local Kafka broker):

**Linux:**
```env
KAFKA_BROKERS=172.17.0.1:9092
```

**macOS/Windows:**
```env
KAFKA_BROKERS=host.docker.internal:9092
```

### Volume Mounts for Certificates

If using SSL/TLS with custom certificates:

```yaml
# In docker-compose.yml
services:
  backend:
    volumes:
      - ../oauth2/certificates:/app/certs:ro
    environment:
      - KAFKA_SSL_CA_LOCATION=/app/certs/ca.crt
```

## GitHub Actions CI/CD

The project includes automated Docker builds via GitHub Actions.

### Workflow Triggers

- **Push to `main`**: Builds and pushes `latest` tag
- **Git tags** (`v*.*.*`): Builds and pushes semantic version tags
- **Pull requests**: Builds but doesn't push
- **Manual**: Via workflow_dispatch

### Published Images

Images are published to GitHub Container Registry (ghcr.io):

- `ghcr.io/oriolrius/kafka-basics/backend`
- `ghcr.io/oriolrius/kafka-basics/frontend`

### Image Tags

| Tag | Description |
|-----|-------------|
| `latest` | Latest build from `main` branch |
| `v3.0.0` | Specific version (semver) |
| `v3.0` | Major.minor version |
| `v3` | Major version |
| `sha-abc1234` | Git commit SHA |
| `main` | Branch name |

### Using Published Images

```bash
# Pull images
docker pull ghcr.io/oriolrius/kafka-basics/backend:latest
docker pull ghcr.io/oriolrius/kafka-basics/frontend:latest

# Update docker-compose.yml to use published images
# Comment out the 'build' section and use published images
```

In `docker-compose.yml`:

```yaml
services:
  backend:
    # build:
    #   context: ..
    #   dockerfile: docker/Dockerfile
    #   target: backend
    image: ghcr.io/oriolrius/kafka-basics/backend:latest
    # ... rest of config
```

## Security Features

### Non-Root User

Both images run as non-root users (UID 1001):
- Backend: `nodejs` user
- Frontend: `nginx-user`

### Read-Only Filesystem

Frontend runs with a read-only filesystem. Writable paths are provided via tmpfs:
- `/var/cache/nginx`
- `/var/run`
- `/var/log/nginx`

### Security Options

- `no-new-privileges:true` - Prevents privilege escalation
- Security scanning with Trivy (in CI)
- SBOM attestation for supply chain security

### Health Checks

Both containers include health checks:

**Backend:**
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', ...)"
```

**Frontend:**
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://127.0.0.1:8080/health
```

## Advanced Usage

### Multi-Platform Builds

The GitHub Actions workflow builds for multiple architectures:
- `linux/amd64` (x86_64)
- `linux/arm64` (ARM64/Apple Silicon)

For local multi-platform builds:

```bash
# Create builder
docker buildx create --use --name multi-arch-builder

# Build for multiple platforms
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -f docker/Dockerfile \
  --target backend \
  -t kafka-basics-backend \
  --push \
  .
```

### Production Deployment

For production deployments:

1. **Use specific version tags** (not `latest`)
2. **Enable TLS** for Kafka connections
3. **Set strong authentication** (SASL/OAuth2)
4. **Use secrets management** for credentials
5. **Enable certificate verification**
6. **Deploy behind reverse proxy** (Traefik, nginx, etc.)
7. **Set resource limits**

Example `docker-compose.yml` for production:

```yaml
services:
  backend:
    image: ghcr.io/oriolrius/kafka-basics/backend:v3.0.0
    restart: always
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
    environment:
      - NODE_ENV=production
      - KAFKA_USE_TLS=true
      - KAFKA_REJECT_UNAUTHORIZED=true
      - KAFKA_SASL_MECHANISM=scram-sha-256
    secrets:
      - kafka_username
      - kafka_password

secrets:
  kafka_username:
    file: ./secrets/kafka_username.txt
  kafka_password:
    file: ./secrets/kafka_password.txt
```

### Nginx Reverse Proxy

To deploy behind nginx:

```nginx
upstream kafka_basics_frontend {
    server localhost:8080;
}

server {
    listen 443 ssl http2;
    server_name kafka-basics.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://kafka_basics_frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Troubleshooting

### Cannot Connect to Kafka

**Symptom:** Backend logs show connection errors

**Solutions:**
1. Check `KAFKA_BROKERS` points to correct address
2. Use `host.docker.internal` for host services on Mac/Windows
3. Use `172.17.0.1` (Docker bridge) on Linux
4. Ensure Kafka is configured to accept external connections
5. Check network connectivity: `docker exec kafka-basics-backend ping kafka-broker`

### Frontend Can't Reach Backend

**Symptom:** API calls fail in browser console

**Solutions:**
1. Ensure backend is healthy: `docker compose ps`
2. Check nginx upstream: `docker exec kafka-basics-frontend cat /etc/nginx/nginx.conf`
3. Verify both containers on same network: `docker network inspect kafka-basics-network`
4. Check CORS configuration in backend

### Build Fails

**Symptom:** Docker build errors

**Solutions:**
1. Ensure `pnpm-lock.yaml` exists: `pnpm install`
2. Check Docker version: `docker --version` (need 24.0+)
3. Enable BuildKit: `export DOCKER_BUILDKIT=1`
4. Clear build cache: `docker builder prune`

### Permission Errors

**Symptom:** Container crashes with permission errors

**Solutions:**
1. Ensure entrypoint script is executable: `chmod +x docker/docker-entrypoint.sh`
2. Check file ownership in volumes
3. Verify tmpfs mounts are configured (frontend)

## NPM Scripts Reference

| Command | Description |
|---------|-------------|
| `pnpm docker:build` | Build both images |
| `pnpm docker:build:backend` | Build backend only |
| `pnpm docker:build:frontend` | Build frontend only |
| `pnpm docker:up` | Start services |
| `pnpm docker:down` | Stop services |
| `pnpm docker:logs` | View logs |
| `pnpm docker:clean` | Stop and remove all data |

## Resources

- [Dockerfile Reference](https://docs.docker.com/engine/reference/builder/)
- [Docker Compose Specification](https://docs.docker.com/compose/compose-file/)
- [Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Security Best Practices](https://docs.docker.com/develop/security-best-practices/)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)

## License

MIT License - See [LICENSE](../LICENSE) for details.
