#!/bin/sh
set -e

echo "Starting Kafka Basics API Server..."

# Print environment info
echo "Environment: ${NODE_ENV:-development}"
echo "API Port: ${API_PORT:-3001}"
echo "Kafka Broker: ${KAFKA_BROKERS:-not set}"

# Start the server
echo "Starting API server..."
exec "$@"
