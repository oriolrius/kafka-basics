const { Kafka } = require('kafkajs');
const { SchemaRegistry } = require('@kafkajs/confluent-schema-registry');
require('dotenv').config();

// Silence the partitioner warning
process.env.KAFKAJS_NO_PARTITIONER_WARNING = '1';

// Build SSL configuration for Kafka
let kafkaSslConfig = false;
if (process.env.KAFKA_USE_TLS === 'true') {
  kafkaSslConfig = {
    rejectUnauthorized: process.env.KAFKA_REJECT_UNAUTHORIZED !== 'false'
  };
}

// Build SASL configuration for Kafka
let kafkaSaslConfig = undefined;
if (process.env.KAFKA_USERNAME && process.env.KAFKA_PASSWORD) {
  kafkaSaslConfig = {
    mechanism: process.env.KAFKA_SASL_MECHANISM || 'plain',
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD,
  };
}

// Build Schema Registry configuration (optional)
let registry = null;
if (process.env.SCHEMA_REGISTRY_URL) {
  const registryConfig = {
    host: process.env.SCHEMA_REGISTRY_URL,
    clientId: 'universal-consumer',
    retry: {
      retries: 3,
      factor: 2,
      multiplier: 1000,
      maxRetryTimeInSecs: 60
    }
  };

  // Add authentication for Schema Registry if provided
  if (process.env.SCHEMA_REGISTRY_USERNAME && process.env.SCHEMA_REGISTRY_PASSWORD) {
    registryConfig.auth = {
      username: process.env.SCHEMA_REGISTRY_USERNAME,
      password: process.env.SCHEMA_REGISTRY_PASSWORD,
    };
  }

  registry = new SchemaRegistry(registryConfig);
}

console.log('Universal Kafka Consumer Configuration:');
console.log('- Kafka Broker:', process.env.KAFKA_BROKER);
console.log('- Kafka TLS:', process.env.KAFKA_USE_TLS === 'true');
console.log('- Kafka SASL:', kafkaSaslConfig ? `Yes (${kafkaSaslConfig.mechanism})` : 'No');
console.log('- Schema Registry:', registry ? process.env.SCHEMA_REGISTRY_URL : 'Not configured (JSON only)');
console.log('- Group ID:', process.env.KAFKA_CONSUMER_GROUP || 'universal-consumer-group');
console.log('- Topic:', process.env.KAFKA_TOPIC);

// Create Kafka client
const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'universal-consumer',
  brokers: [process.env.KAFKA_BROKER],
  ssl: kafkaSslConfig,
  sasl: kafkaSaslConfig,
  connectionTimeout: 10000,
  requestTimeout: 30000,
  retry: {
    initialRetryTime: 100,
    retries: 3
  }
});

/**
 * Detects if a buffer is Avro-encoded by checking for the magic byte and schema ID
 * Avro wire format: [0x00][4-byte schema ID][avro payload]
 */
function isAvroEncoded(buffer) {
  // Avro messages start with magic byte 0x00 and have at least 5 bytes (1 magic + 4 schema ID)
  return buffer.length >= 5 && buffer[0] === 0x00;
}

async function consumeUniversalMessages() {
  const consumer = kafka.consumer({ 
    groupId: process.env.KAFKA_CONSUMER_GROUP || 'universal-consumer-group',
    sessionTimeout: 30000,
    heartbeatInterval: 3000,
  });

  try {
    // Connect to Kafka
    console.log('\nConnecting to Kafka...');
    await consumer.connect();
    console.log('✅ Connected to Kafka successfully!');

    // Subscribe to topic
    console.log(`\nSubscribing to topic: ${process.env.KAFKA_TOPIC}`);
    await consumer.subscribe({ 
      topic: process.env.KAFKA_TOPIC,
      fromBeginning: process.env.KAFKA_FROM_BEGINNING === 'true' || false
    });
    console.log('✅ Subscribed to topic successfully!');

    // Start consuming messages
    console.log('\n📨 Waiting for messages (Avro or JSON)...\n');
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const timestamp = new Date(parseInt(message.timestamp)).toISOString();
        const key = message.key ? message.key.toString() : 'null';
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        // Check if message is Avro-encoded
        if (registry && isAvroEncoded(message.value)) {
          // Try to decode as Avro
          try {
            const decodedMessage = await registry.decode(message.value);
            
            console.log(`📩 Avro Message received:`);
            console.log(`  Topic: ${topic}`);
            console.log(`  Partition: ${partition}`);
            console.log(`  Offset: ${message.offset}`);
            console.log(`  Timestamp: ${timestamp}`);
            console.log(`  Key: ${key}`);
            console.log(`  Type: Avro-encoded`);
            console.log(`  Decoded Value:`);
            console.log(JSON.stringify(decodedMessage, null, 2).split('\n').map(line => `    ${line}`).join('\n'));
          } catch (decodeError) {
            console.log(`⚠️  Avro decode error:`);
            console.log(`  Topic: ${topic}`);
            console.log(`  Partition: ${partition}`);
            console.log(`  Offset: ${message.offset}`);
            console.log(`  Timestamp: ${timestamp}`);
            console.log(`  Key: ${key}`);
            console.log(`  Error: ${decodeError.message}`);
            console.log(`  Raw Data: [Binary, length: ${message.value.length} bytes]`);
          }
        } else {
          // Try to parse as JSON/plain text
          try {
            const messageValue = message.value.toString();
            
            console.log(`📩 Message received:`);
            console.log(`  Topic: ${topic}`);
            console.log(`  Partition: ${partition}`);
            console.log(`  Offset: ${message.offset}`);
            console.log(`  Timestamp: ${timestamp}`);
            console.log(`  Key: ${key}`);
            
            // Try to parse as JSON
            try {
              const jsonValue = JSON.parse(messageValue);
              console.log(`  Type: JSON`);
              console.log(`  Value:`);
              console.log(JSON.stringify(jsonValue, null, 2).split('\n').map(line => `    ${line}`).join('\n'));
            } catch (e) {
              // Not JSON, show as plain text
              console.log(`  Type: Plain text`);
              console.log(`  Value: ${messageValue}`);
            }
          } catch (stringError) {
            // Cannot convert to string, show as binary
            console.log(`📩 Binary Message received:`);
            console.log(`  Topic: ${topic}`);
            console.log(`  Partition: ${partition}`);
            console.log(`  Offset: ${message.offset}`);
            console.log(`  Timestamp: ${timestamp}`);
            console.log(`  Key: ${key}`);
            console.log(`  Type: Binary`);
            console.log(`  Length: ${message.value.length} bytes`);
          }
        }
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      },
    });

  } catch (error) {
    console.error('❌ Error consuming messages:', error);
  }
}

// Handle graceful shutdown
const errorTypes = ['unhandledRejection', 'uncaughtException'];
const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

errorTypes.forEach(type => {
  process.on(type, async (e) => {
    try {
      console.log(`\n${type}: ${e}`);
      process.exit(0);
    } catch (_) {
      process.exit(1);
    }
  });
});

signalTraps.forEach(type => {
  process.once(type, async () => {
    try {
      console.log(`\n${type} signal received, shutting down gracefully...`);
      process.exit(0);
    } finally {
      process.kill(process.pid, type);
    }
  });
});

// Run the consumer
consumeUniversalMessages().catch(console.error);
