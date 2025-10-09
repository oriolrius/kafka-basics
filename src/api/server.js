import express from 'express';
import cors from 'cors';
import { Kafka } from 'kafkajs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3001;

app.use(cors());
app.use(express.json());

// Kafka configuration
const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'kafka-web-ui',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
});

const producer = kafka.producer();
const admin = kafka.admin();
const consumers = new Map(); // Store active consumers
const consumerMessages = new Map(); // Store messages for each consumer
const lastSentIndex = new Map(); // Track what messages were already sent to frontend

// Initialize Kafka connections
async function initKafka() {
  await producer.connect();
  await admin.connect();
  console.log('✅ Kafka producer and admin connected');
}

// Produce message
app.post('/api/produce', async (req, res) => {
  try {
    const { topic, key, message, format } = req.body;

    let value;
    if (format === 'json') {
      try {
        value = JSON.stringify(JSON.parse(message));
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON format' });
      }
    } else {
      value = message;
    }

    const result = await producer.send({
      topic,
      messages: [
        {
          key: key || null,
          value: value,
        },
      ],
    });

    console.log(`📤 Sent message to ${topic}[${result[0].partition}]@${result[0].offset}`);

    res.json({
      success: true,
      offset: result[0].offset,
      partition: result[0].partition,
    });
  } catch (error) {
    console.error('Error producing message:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start consumer
app.post('/api/consume', async (req, res) => {
  try {
    const { topic, format } = req.body;
    
    // Check if consumer already exists for this topic
    if (consumers.has(topic)) {
      return res.json({ success: true, message: 'Consumer already running for this topic' });
    }

    const consumerId = `${topic}-${Date.now()}`;

    // Create a new consumer with a unique group ID to always get messages
    const consumer = kafka.consumer({
      groupId: `web-ui-consumer-${Date.now()}`,
      sessionTimeout: 30000,
    });

    await consumer.connect();
    console.log(`✅ Consumer connected for topic: ${topic}`);
    
    // Subscribe from beginning to see existing messages
    await consumer.subscribe({ topic, fromBeginning: true });

    // Store messages for this consumer
    const messages = [];
    consumerMessages.set(topic, messages);

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        console.log(`📨 Received message on ${topic}[${partition}]@${message.offset}`);
        
        const msg = {
          partition,
          offset: message.offset,
          key: message.key ? message.key.toString() : null,
          value: message.value ? message.value.toString() : null,
          timestamp: message.timestamp,
        };

        // Try to parse as JSON
        try {
          msg.value = JSON.parse(msg.value);
        } catch (e) {
          // Keep as string if not JSON
        }

        messages.push(msg);
        
        // Keep only last 100 messages
        if (messages.length > 100) {
          messages.shift();
        }
      },
    });

    consumers.set(topic, consumer);

    res.json({ success: true, consumerId });
  } catch (error) {
    console.error('Error starting consumer:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get consumed messages
app.get('/api/consume/messages', (req, res) => {
  const { topic } = req.query;
  const allMessages = consumerMessages.get(topic) || [];
  const lastIndex = lastSentIndex.get(topic) || 0;
  
  // Only return new messages since last poll
  const newMessages = allMessages.slice(lastIndex);
  
  // Update the last sent index
  lastSentIndex.set(topic, allMessages.length);
  
  console.log(`📬 Returning ${newMessages.length} new messages for ${topic} (total: ${allMessages.length})`);
  
  res.json({ messages: newMessages });
});

// Stop consumer
app.post('/api/consume/stop', async (req, res) => {
  try {
    const { topic } = req.body;
    const consumer = consumers.get(topic);

    if (consumer) {
      console.log(`⏹️ Stopping consumer for topic: ${topic}`);
      await consumer.disconnect();
      consumers.delete(topic);
      consumerMessages.delete(topic);
      lastSentIndex.delete(topic);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error stopping consumer:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get topic info
app.get('/api/topic/info', async (req, res) => {
  try {
    const { topic } = req.query;

    const topics = await admin.fetchTopicMetadata({ topics: [topic] });
    const topicData = topics.topics[0];

    if (!topicData) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    // Get offsets for each partition
    const partitionsWithOffsets = await Promise.all(
      topicData.partitions.map(async (partition) => {
        const offsets = await admin.fetchTopicOffsets(topic);
        const partitionOffset = offsets.find(
          (o) => o.partition === partition.partitionId
        );

        return {
          ...partition,
          high: partitionOffset?.high || '0',
          low: partitionOffset?.low || '0',
        };
      })
    );

    res.json({
      name: topicData.name,
      partitions: partitionsWithOffsets,
    });
  } catch (error) {
    console.error('Error fetching topic info:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete topic
app.delete('/api/topic/delete', async (req, res) => {
  try {
    const { topic } = req.body;

    await admin.deleteTopics({
      topics: [topic],
      timeout: 30000,
    });

    res.json({ success: true, message: `Topic ${topic} deleted` });
  } catch (error) {
    console.error('Error deleting topic:', error);
    res.status(500).json({ error: error.message });
  }
});

// List all messages in a topic
app.get('/api/messages/list', async (req, res) => {
  try {
    const { topic } = req.query;

    // Create a temporary consumer to read all messages
    const consumer = kafka.consumer({
      groupId: `list-messages-${Date.now()}`,
    });

    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: true });

    const messages = [];
    let timeout;

    const promise = new Promise((resolve) => {
      timeout = setTimeout(() => {
        resolve();
      }, 5000); // Wait 5 seconds for messages

      consumer.run({
        eachMessage: async ({ partition, message }) => {
          const msg = {
            partition,
            offset: message.offset,
            key: message.key ? message.key.toString() : null,
            value: message.value ? message.value.toString() : null,
            timestamp: message.timestamp,
          };

          // Try to parse as JSON
          try {
            msg.value = JSON.parse(msg.value);
          } catch (e) {
            // Keep as string if not JSON
          }

          messages.push(msg);
        },
      });
    });

    await promise;
    clearTimeout(timeout);
    await consumer.disconnect();

    res.json({ messages });
  } catch (error) {
    console.error('Error listing messages:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
initKafka()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 API server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize Kafka:', error);
    process.exit(1);
  });

// Cleanup on exit
process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  
  // Disconnect all consumers
  for (const [topic, consumer] of consumers.entries()) {
    try {
      await consumer.disconnect();
      console.log(`Disconnected consumer for topic: ${topic}`);
    } catch (error) {
      console.error(`Error disconnecting consumer for ${topic}:`, error);
    }
  }

  await producer.disconnect();
  await admin.disconnect();
  console.log('Kafka connections closed');
  process.exit(0);
});
