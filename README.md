# Kafka Simple Producer

A Node.js Kafka producer implementation with support for both plain messages and Avro serialization using KafkaJS and Confluent Schema Registry.

## Features

- 🚀 Simple Kafka producer with KafkaJS
- 📋 Avro schema serialization support
- 🔐 SASL authentication (PLAIN, SCRAM-SHA-256, SCRAM-SHA-512)
- 🔒 TLS/SSL support
- 🛠️ Connection diagnostic tools
- ⚙️ Environment-based configuration
- 📊 Schema Registry integration

## Prerequisites

- Node.js (v14 or higher)
- Access to a Kafka cluster
- (Optional) Confluent Schema Registry for Avro support

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd kafka
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on your Kafka configuration:
```env
# Kafka Configuration
KAFKA_BROKER=your-kafka-broker:9092
KAFKA_CLIENT_ID=simple-producer
KAFKA_TOPIC=test-topic

# Authentication (optional)
KAFKA_USERNAME=your-username
KAFKA_PASSWORD=your-password
KAFKA_SASL_MECHANISM=plain

# TLS Configuration (optional)
KAFKA_USE_TLS=true
KAFKA_REJECT_UNAUTHORIZED=false

# Schema Registry (for Avro producer)
SCHEMA_REGISTRY_URL=http://localhost:8081
SCHEMA_REGISTRY_USERNAME=your-sr-username
SCHEMA_REGISTRY_PASSWORD=your-sr-password
```

## Usage

### Basic Producer

Run the simple Kafka producer:

```bash
npm start
```

This will send a test message to your configured Kafka topic.

### Avro Producer

Run the Avro-enabled producer with schema serialization:

```bash
npm run start-avro
```

This producer:
- Registers an Avro schema with the Schema Registry
- Serializes messages using the schema
- Sends the serialized message to Kafka

### Connection Diagnostics

Test your Kafka connection and try different SASL mechanisms:

```bash
npm run diagnose
```

This utility will:
- Test connectivity to your Kafka broker
- Try different SASL authentication mechanisms
- Provide detailed connection feedback

## Project Structure

```
├── producer.js           # Basic Kafka producer
├── avro-producer.js      # Avro-enabled producer with Schema Registry
├── diagnostic.js         # Connection diagnostic utility
├── sample-message.json   # Sample message for testing
├── test-schema.json      # Avro schema definition
├── package.json          # Project dependencies and scripts
└── .env                  # Environment configuration (create this)
```

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `KAFKA_BROKER` | Kafka broker address | - | ✓ |
| `KAFKA_CLIENT_ID` | Client identifier | `simple-producer` | |
| `KAFKA_TOPIC` | Target Kafka topic | `test-topic` | |
| `KAFKA_USERNAME` | SASL username | - | |
| `KAFKA_PASSWORD` | SASL password | - | |
| `KAFKA_SASL_MECHANISM` | SASL mechanism | `plain` | |
| `KAFKA_USE_TLS` | Enable TLS | `false` | |
| `KAFKA_REJECT_UNAUTHORIZED` | Reject unauthorized certificates | `true` | |
| `SCHEMA_REGISTRY_URL` | Schema Registry URL | - | ✓ (for Avro) |
| `SCHEMA_REGISTRY_USERNAME` | Schema Registry username | - | |
| `SCHEMA_REGISTRY_PASSWORD` | Schema Registry password | - | |

### Message Schema

The Avro schema (`test-schema.json`) defines the structure for test messages:

```json
{
  "type": "record",
  "name": "TestMessage",
  "namespace": "com.example.kafka",
  "fields": [
    {
      "name": "id",
      "type": "string",
      "doc": "Unique identifier for the message"
    },
    {
      "name": "message",
      "type": "string",
      "doc": "The main message content"
    },
    {
      "name": "timestamp",
      "type": "long",
      "doc": "Unix timestamp when the message was created"
    },
    {
      "name": "metadata",
      "type": ["null", "string"],
      "default": null,
      "doc": "Optional metadata field"
    }
  ]
}
```

## Authentication Methods

### SASL/PLAIN
```env
KAFKA_SASL_MECHANISM=plain
KAFKA_USERNAME=your-username
KAFKA_PASSWORD=your-password
```

### SASL/SCRAM-SHA-256
```env
KAFKA_SASL_MECHANISM=scram-sha-256
KAFKA_USERNAME=your-username
KAFKA_PASSWORD=your-password
```

### SASL/SCRAM-SHA-512
```env
KAFKA_SASL_MECHANISM=scram-sha-512
KAFKA_USERNAME=your-username
KAFKA_PASSWORD=your-password
```

## Error Handling

The producers include comprehensive error handling for:
- Connection timeouts
- Authentication failures
- Schema validation errors
- Topic creation issues
- Network connectivity problems

## Dependencies

- **kafkajs** (^2.2.4) - Apache Kafka client for Node.js
- **@kafkajs/confluent-schema-registry** (^3.3.0) - Schema Registry client
- **avsc** (^5.7.7) - Avro schema validation
- **dotenv** (^16.3.1) - Environment variable management

## Troubleshooting

### Connection Issues
1. Verify your broker address and port
2. Check network connectivity
3. Ensure proper authentication credentials
4. Run the diagnostic tool: `npm run diagnose`

### Schema Registry Issues
1. Verify Schema Registry URL is accessible
2. Check authentication credentials
3. Ensure the schema is valid JSON

### Common Errors
- **TimeoutError**: Increase connection and request timeouts
- **KafkaJSProtocolError**: Check authentication mechanism and credentials
- **Schema validation failed**: Verify message structure matches schema

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
- Check the [KafkaJS documentation](https://kafka.js.org/)
- Review Confluent Schema Registry [documentation](https://docs.confluent.io/platform/current/schema-registry/index.html)
- Open an issue in this repository
