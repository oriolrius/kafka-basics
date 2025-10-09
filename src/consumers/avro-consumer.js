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

// Build Schema Registry configuration
if (!process.env.SCHEMA_REGISTRY_URL) {
  console.error('❌ SCHEMA_REGISTRY_URL is not set in .env file');
  process.exit(1);
}

const registryConfig = {
  host: process.env.SCHEMA_REGISTRY_URL,
  clientId: 'avro-consumer',
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

console.log('Kafka Consumer Configuration:');
console.log('- Kafka Broker:', process.env.KAFKA_BROKER);
console.log('- Kafka TLS:', process.env.KAFKA_USE_TLS === 'true');
console.log('- Kafka SASL:', kafkaSaslConfig ? `Yes (${kafkaSaslConfig.mechanism})` : 'No');
console.log('- Schema Registry:', process.env.SCHEMA_REGISTRY_URL);
console.log('- Schema Registry Auth:', registryConfig.auth ? `Yes (${registryConfig.auth.username})` : 'No');
console.log('- Group ID:', process.env.KAFKA_CONSUMER_GROUP || 'avro-consumer-group');
console.log('- Topic:', process.env.KAFKA_TOPIC);

// Create Kafka client
const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'avro-consumer',
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

// Create Schema Registry client
const registry = new SchemaRegistry(registryConfig);

async function consumeAvroMessages() {
  const consumer = kafka.consumer({ 
    groupId: process.env.KAFKA_CONSUMER_GROUP || 'avro-consumer-group',
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
    console.log('\n📨 Waiting for Avro-encoded messages...\n');
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          // Decode the Avro message
          const decodedMessage = await registry.decode(message.value);
          
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log(`📩 Avro Message received:`);
          console.log(`  Topic: ${topic}`);
          console.log(`  Partition: ${partition}`);
          console.log(`  Offset: ${message.offset}`);
          console.log(`  Timestamp: ${new Date(parseInt(message.timestamp)).toISOString()}`);
          console.log(`  Key: ${message.key ? message.key.toString() : 'null'}`);
          console.log(`  Decoded Value:`);
          console.log(JSON.stringify(decodedMessage, null, 2).split('\n').map(line => `    ${line}`).join('\n'));
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        } catch (decodeError) {
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log(`⚠️  Message received (not Avro or decode error):`);
          console.log(`  Topic: ${topic}`);
          console.log(`  Partition: ${partition}`);
          console.log(`  Offset: ${message.offset}`);
          console.log(`  Timestamp: ${new Date(parseInt(message.timestamp)).toISOString()}`);
          console.log(`  Key: ${message.key ? message.key.toString() : 'null'}`);
          console.log(`  Decode Error: ${decodeError.message}`);
          
          // Try to show raw value as fallback
          try {
            const rawValue = message.value.toString();
            console.log(`  Raw Value: ${rawValue}`);
          } catch (e) {
            console.log(`  Raw Value: [Binary data, length: ${message.value.length} bytes]`);
          }
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        }
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
consumeAvroMessages().catch(console.error);
