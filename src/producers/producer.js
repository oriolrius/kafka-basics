import { Kafka } from 'kafkajs';
import { buildKafkaConfig } from '../utils/kafka-config.js';
import dotenv from 'dotenv';

dotenv.config();

// Silence the partitioner warning
process.env.KAFKAJS_NO_PARTITIONER_WARNING = '1';

async function publishMessage() {
  // Build Kafka configuration using centralized utility (supports OAuth2)
  const kafkaConfig = await buildKafkaConfig();

  console.log('Kafka Configuration:');
  console.log('- Broker:', process.env.KAFKA_BROKER);
  console.log('- TLS:', kafkaConfig.ssl ? 'Yes' : 'No');
  console.log('- SASL:', kafkaConfig.sasl ? `Yes (${kafkaConfig.sasl.mechanism})` : 'No');
  if (process.env.OAUTH_ENABLED === 'true') {
    console.log('- OAuth2:', 'Enabled');
    console.log('- Client ID:', process.env.OAUTH_CLIENT_ID);
  }

  // Create Kafka client
  const kafka = new Kafka(kafkaConfig);
  const producer = kafka.producer();

  try {
    // Connect to Kafka
    console.log('Connecting to Kafka...');
    await producer.connect();
    console.log('Connected successfully!');

    // Get message from command-line args or environment variable
    const args = process.argv.slice(2);
    const messageIndex = args.indexOf('--message');
    const messageContent = messageIndex !== -1 ? args[messageIndex + 1] : process.env.KAFKA_MESSAGE_CONTENT || 'Test message';

    // Send message
    const message = {
      topic: process.env.KAFKA_TOPIC,
      messages: [
        {
          value: messageContent,
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