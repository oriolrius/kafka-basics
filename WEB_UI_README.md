# Kafka Basics - Web UI

> Modern React-based web interface for managing Kafka producers, consumers, and topics

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/oriolrius/kafka-basics)

A complete web interface for Kafka operations with real-time message streaming, topic administration, and connection management.

## ✨ Features

### 📤 Producer
- Send messages to Kafka topics
- Support for JSON, Text, and Avro formats
- Optional message keys
- Real-time delivery confirmation

### 📥 Consumer
- Real-time message streaming
- Universal auto-detection of formats
- Support for JSON, Text, and Avro
- Live streaming with auto-scroll
- Message history (last 100 messages)
- Persistent consumer across tab switches

### 📋 Message List
- View all messages in a topic
- Browse message history
- Display metadata (partition, offset, timestamp, key)
- Pretty-printed JSON values

### ⚙️ Topic Administration
- View topic information and metadata
- Inspect partition details (watermarks, leaders, replicas, ISR)
- Delete topics (with confirmation)
- View topic configuration

### 🔧 Connection Settings
- Configure broker addresses
- Security protocols (PLAINTEXT, SSL, SASL_PLAINTEXT, SASL_SSL)
- SASL mechanisms (PLAIN, SCRAM-SHA-256, SCRAM-SHA-512, AWS, OAUTHBEARER)
- SSL/TLS configuration
- Schema Registry settings
- Save to localStorage or export to .env

### 🎨 UI Features
- **Light/Dark Theme** - Toggle with one click
- **Responsive Design** - Works on desktop and mobile
- **Real-time Updates** - Live message streaming
- **Pretty Printing** - Formatted JSON display
- **Error Handling** - Clear error messages and status indicators

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- Kafka broker running (default: localhost:9092)
- `.env` file configured (see `.env.example`)

### Installation

```bash
pnpm install
```

### Running the Web UI

Start both the API server and frontend development server:

```bash
pnpm web
```

This will start:
- **API Server**: http://localhost:3001 (backend for Kafka operations)
- **Web UI**: http://localhost:3000 (React frontend)

Or run them separately:

```bash
# Terminal 1: Start API server
pnpm api

# Terminal 2: Start frontend dev server
pnpm dev
```

## 📋 Features

### 📤 Producer
- Send messages to Kafka topics
- Support for JSON, text, and Avro formats
- Optional message keys
- Real-time feedback on message delivery

### 📥 Consumer
- Real-time message consumption
- Universal auto-detection of message formats
- Support for JSON, text, and Avro formats
- Live message streaming with auto-scroll
- Message history (last 100 messages)

### 📋 Message List
- View all messages in a topic
- Browse message history
- Display message metadata (partition, offset, timestamp, key)
- Pretty-printed JSON values

### ⚙️ Topic Administration
- View topic information and metadata
- Inspect partition details (high/low watermarks, leaders, replicas, ISR)
- Delete topics (with confirmation)
- View topic configuration

## 🎨 UI Features

- **Dark Theme**: Modern, eye-friendly dark interface
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: Live message streaming
- **Pretty Printing**: Formatted JSON display
- **Error Handling**: Clear error messages and status indicators

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite
- **Backend**: Express.js, KafkaJS
- **Styling**: Vanilla CSS with CSS variables
- **API**: REST API with JSON responses

## 📁 Project Structure

```
kafka-basics/
├── src/
│   ├── web/                    # React frontend
│   │   ├── components/         # React components
│   │   │   ├── Producer.jsx
│   │   │   ├── Consumer.jsx
│   │   │   ├── TopicInfo.jsx
│   │   │   └── MessageList.jsx
│   │   ├── App.jsx            # Main app component
│   │   ├── main.jsx           # Entry point
│   │   └── styles.css         # Styles
│   ├── api/                    # Backend API
│   │   └── server.js          # Express server
│   ├── producers/              # CLI producers
│   ├── consumers/              # CLI consumers
│   ├── admin/                  # CLI admin tools
│   └── utils/                  # Utilities
├── index.html                  # HTML template
├── vite.config.js             # Vite configuration
└── package.json               # Dependencies and scripts
```

## 🔧 Configuration

Environment variables (in `.env`):

```env
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=kafka-web-ui
API_PORT=3001
```

## 📡 API Endpoints

### Producer
- `POST /api/produce` - Send a message to a topic

### Consumer
- `POST /api/consume` - Start consuming from a topic
- `GET /api/consume/messages` - Get received messages
- `POST /api/consume/stop` - Stop consumer

### Topic Administration
- `GET /api/topic/info?topic=<name>` - Get topic information
- `DELETE /api/topic/delete` - Delete a topic

### Messages
- `GET /api/messages/list?topic=<name>` - List all messages in a topic

### Health
- `GET /api/health` - API health check

## 🏗️ Build for Production

Build the frontend:

```bash
pnpm build
```

This creates a `dist/` folder with optimized production files.

Preview the production build:

```bash
pnpm preview
```

## 💡 Tips

1. **Consumer Performance**: The consumer keeps only the last 100 messages in memory to prevent memory issues
2. **Message Listing**: The message list endpoint has a 5-second timeout to prevent hanging on large topics
3. **Topic Deletion**: Always shows a confirmation dialog before deleting topics
4. **Auto-refresh**: Consumer messages auto-refresh every second when active

## 🐛 Troubleshooting

### Cannot connect to Kafka
- Ensure Kafka broker is running
- Check `KAFKA_BROKERS` in `.env` file
- Verify network connectivity

### API not responding
- Check if API server is running on port 3001
- Look for errors in the API server console
- Ensure no other service is using port 3001

### Messages not appearing in Consumer
- Verify the topic exists and has messages
- Check that the topic name is correct
- Ensure consumer is started (green status)

## 📝 License

Same as parent project - see main README.md

## 🤝 Contributing

This web UI is part of the Kafka Basics toolkit. See main README.md for contribution guidelines.
