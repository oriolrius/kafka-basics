# 🚀 Quick Start Guide - Kafka Basics Web UI

## Step 1: Install Dependencies

```bash
pnpm install
```

## Step 2: Configure Environment

Create a `.env` file:

```bash
cp .env.example .env
```

Or create manually with:

```env
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=kafka-web-ui
API_PORT=3001
```

## Step 3: Start Kafka (if not running)

Make sure you have Kafka running locally. If using Docker:

```bash
# Start Kafka with Docker Compose (example)
docker-compose up -d
```

## Step 4: Launch the Web UI

```bash
pnpm web
```

This will start:
- ✅ API Server at http://localhost:3001
- ✅ Web UI at http://localhost:3000

## Step 5: Use the Web UI

### 📤 Send a Message (Producer Tab)

1. Click on the **Producer** tab
2. Enter topic name (e.g., `test-topic`)
3. Choose format: JSON, Text, or Avro
4. Enter your message
5. Click **Send Message**

Example JSON message:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "timestamp": "2025-10-09T10:00:00Z"
}
```

### 📥 Receive Messages (Consumer Tab)

1. Click on the **Consumer** tab
2. Enter the topic name
3. Choose format (Universal auto-detects)
4. Click **Start Consumer**
5. Watch messages appear in real-time!

### 📋 View All Messages (Messages Tab)

1. Click on the **Messages** tab
2. Enter topic name
3. Click **Load Messages**
4. Browse all messages in the topic

### ⚙️ Manage Topics (Admin Tab)

1. Click on the **Admin** tab
2. Enter topic name
3. Click **Get Topic Info** to view:
   - Number of partitions
   - Partition details (offsets, leaders, replicas)
   - Topic configuration
4. Use **Delete Topic** to remove topics (with confirmation)

## Troubleshooting

### Cannot connect to Kafka
```
Error: KafkaJSConnectionError
```

**Solution:**
- Check if Kafka is running: `docker ps` or `systemctl status kafka`
- Verify `KAFKA_BROKERS` in `.env` matches your Kafka address
- Default is `localhost:9092`

### Port already in use
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution:**
- Change `API_PORT` in `.env` to a different port (e.g., 3002)
- Or stop the service using port 3001

### No messages appearing in Consumer
- Ensure topic exists and has messages
- Try sending a test message first using the Producer tab
- Check topic name spelling

### Build errors
```bash
# Clear cache and reinstall
rm -rf node_modules
pnpm install
```

## CLI Alternative

You can also use the CLI tools alongside the Web UI:

```bash
# Send a message
pnpm kpub

# Consume messages
pnpm ksub

# Get topic info
pnpm ktopic-info

# List all messages
pnpm klist
```

## Next Steps

- Explore Avro message format for schema-validated messages
- Set up multiple topics for different data types
- Monitor partition distribution and consumer lag
- Test with high-volume message production

## Support

For issues or questions, check:
- [WEB_UI_README.md](WEB_UI_README.md) - Full documentation
- [README.md](README.md) - CLI documentation
- KafkaJS Documentation: https://kafka.js.org/

Happy Kafka-ing! 🎉
