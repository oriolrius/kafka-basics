const { Kafka } = require('kafkajs');
require('dotenv').config();

// Silence the partitioner warning
process.env.KAFKAJS_NO_PARTITIONER_WARNING = '1';

// Build SSL configuration
let sslConfig = false;
if (process.env.KAFKA_USE_TLS === 'true') {
  sslConfig = {
    rejectUnauthorized: process.env.KAFKA_REJECT_UNAUTHORIZED !== 'false'
  };
}

// Build SASL configuration
let saslConfig = undefined;
if (process.env.KAFKA_USERNAME && process.env.KAFKA_PASSWORD) {
  saslConfig = {
    mechanism: process.env.KAFKA_SASL_MECHANISM || 'plain',
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD,
  };
}

console.log('Kafka Consumer Configuration:');
console.log('- Broker:', process.env.KAFKA_BROKER);
console.log('- TLS:', process.env.KAFKA_USE_TLS === 'true');
console.log('- SASL:', saslConfig ? `Yes (${saslConfig.mechanism})` : 'No');
console.log('- Group ID:', process.env.KAFKA_CONSUMER_GROUP || 'simple-consumer-group');
console.log('- Topic:', process.env.KAFKA_TOPIC);

// Create Kafka client
const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'simple-consumer',
  brokers: [process.env.KAFKA_BROKER],
  ssl: sslConfig,
  sasl: saslConfig,
  connectionTimeout: 10000,
  requestTimeout: 30000,
  retry: {
    initialRetryTime: 100,
    retries: 3
  }
});

async function consumeMessages() {
  const consumer = kafka.consumer({ 
    groupId: process.env.KAFKA_CONSUMER_GROUP || 'simple-consumer-group',
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
    console.log('\n📨 Waiting for messages...\n');
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const messageValue = message.value.toString();
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📩 Message received:`);
        console.log(`  Topic: ${topic}`);
        console.log(`  Partition: ${partition}`);
        console.log(`  Offset: ${message.offset}`);
        console.log(`  Timestamp: ${new Date(parseInt(message.timestamp)).toISOString()}`);
        console.log(`  Key: ${message.key ? message.key.toString() : 'null'}`);
        
        // Try to parse as JSON
        try {
          const jsonValue = JSON.parse(messageValue);
          console.log(`  Value (JSON):`);
          console.log(JSON.stringify(jsonValue, null, 2).split('\n').map(line => `    ${line}`).join('\n'));
        } catch (e) {
          // Not JSON, show as plain text
          console.log(`  Value: ${messageValue}`);
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
consumeMessages().catch(console.error);
