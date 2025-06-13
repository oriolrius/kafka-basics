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

console.log('Kafka Configuration:');
console.log('- Broker:', process.env.KAFKA_BROKER);
console.log('- TLS:', process.env.KAFKA_USE_TLS === 'true');
console.log('- SASL:', saslConfig ? `Yes (${saslConfig.mechanism})` : 'No');
console.log('- Reject Unauthorized:', process.env.KAFKA_REJECT_UNAUTHORIZED !== 'false');

// Create Kafka client with increased timeouts
const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'simple-producer',
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

async function publishMessage() {
  const producer = kafka.producer();

  try {
    // Connect to Kafka
    console.log('Connecting to Kafka...');
    await producer.connect();
    console.log('Connected successfully!');

    // Send message
    const message = {
      topic: process.env.KAFKA_TOPIC,
      messages: [
        {
          value: process.env.KAFKA_MESSAGE_CONTENT,
          timestamp: Date.now().toString(),
        },
      ],
    };

    console.log(`Publishing message to topic: ${process.env.KAFKA_TOPIC}`);
    const result = await producer.send(message);
    console.log('Message published successfully:', result);

  } catch (error) {
    console.error('Error publishing message:', error);
  } finally {
    // Disconnect
    await producer.disconnect();
    console.log('Disconnected from Kafka');
  }
}

// Run the publisher
publishMessage().catch(console.error);