# syntax=docker/dockerfile:1

################################################################################
# Base Stage - Common dependencies
################################################################################
FROM node:22-alpine AS base

# Set working directory
WORKDIR /app

################################################################################
# Dependencies Stage - Install production dependencies
################################################################################
FROM base AS dependencies

# Copy package files
COPY package.json package-lock.json ./

# Install production dependencies
RUN npm ci --omit=dev

################################################################################
# Build Frontend
################################################################################
FROM base AS build-frontend

# Accept build arguments for frontend configuration
ARG VITE_API_URL=/api

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source files needed for frontend build
COPY src/ ./src/
COPY index.html ./
COPY vite.config.js ./
COPY .env.example ./.env

# Set environment variable for Vite build
ENV VITE_API_URL=${VITE_API_URL}

# Build frontend
RUN npm run build

################################################################################
# Production Backend Stage
################################################################################
FROM node:22-alpine AS backend

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy production dependencies
COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=dependencies --chown=nodejs:nodejs /app/package.json ./

# Copy backend source
COPY --chown=nodejs:nodejs src/api ./src/api
COPY --chown=nodejs:nodejs src/utils ./src/utils
COPY --chown=nodejs:nodejs src/producers ./src/producers
COPY --chown=nodejs:nodejs src/consumers ./src/consumers
COPY --chown=nodejs:nodejs src/admin ./src/admin

# Copy entrypoint script
COPY --chown=nodejs:nodejs docker/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Switch to non-root user
USER nodejs

# Set environment variables with production defaults
ENV NODE_ENV=production \
    PORT=3001 \
    HOST=0.0.0.0 \
    API_PORT=3001

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--", "/usr/local/bin/docker-entrypoint.sh"]

# Start the application
CMD ["node", "src/api/server.js"]

################################################################################
# Production Frontend Stage
################################################################################
FROM nginx:alpine AS frontend

# Create non-root user
RUN addgroup -g 1001 -S nginx-user && \
    adduser -S nginx-user -u 1001

# Copy built frontend from build stage
COPY --from=build-frontend --chown=nginx-user:nginx-user /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Create necessary directories and set permissions
RUN mkdir -p /var/cache/nginx/client_temp \
             /var/cache/nginx/proxy_temp \
             /var/cache/nginx/fastcgi_temp \
             /var/cache/nginx/uwsgi_temp \
             /var/cache/nginx/scgi_temp && \
    chown -R nginx-user:nginx-user /var/cache/nginx && \
    chown -R nginx-user:nginx-user /var/log/nginx && \
    chown -R nginx-user:nginx-user /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx-user:nginx-user /var/run/nginx.pid

USER nginx-user

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://127.0.0.1:8080/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
