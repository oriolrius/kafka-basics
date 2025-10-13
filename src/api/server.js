import express from 'express';
import cors from 'cors';
import { Kafka } from 'kafkajs';
import dotenv from 'dotenv';
import https from 'https';
import { join } from 'path';
import { buildKafkaConfig } from '../utils/kafka-config.js';

// Load .env from user's working directory when using npx
const envPath = process.env.USER_CWD ? join(process.env.USER_CWD, '.env') : '.env';
dotenv.config({ path: envPath });

const app = express();
const PORT = process.env.API_PORT || 3001;

app.use(cors());
app.use(express.json());

// Silence the partitioner warning
process.env.KAFKAJS_NO_PARTITIONER_WARNING = '1';

// Kafka configuration - will be initialized asynchronously
let kafka = null;
let producer = null;
let admin = null;
const consumers = new Map(); // Store active consumers
const consumerMessages = new Map(); // Store messages for each consumer
const lastSentIndex = new Map(); // Track what messages were already sent to frontend

// Initialize Kafka connections
async function initKafka() {
  // Build Kafka configuration using centralized utility (supports OAuth2)
  const kafkaConfig = await buildKafkaConfig('kafka-web-api');

  console.log('Kafka API Configuration:');
  console.log('- Broker:', process.env.KAFKA_BROKER || process.env.KAFKA_BROKERS);
  console.log('- TLS:', kafkaConfig.ssl ? 'Yes' : 'No');
  console.log('- SASL:', kafkaConfig.sasl ? `Yes (${kafkaConfig.sasl.mechanism})` : 'No');
  if (process.env.OAUTH_ENABLED === 'true') {
    console.log('- OAuth2:', 'Enabled');
    console.log('- Client ID:', process.env.OAUTH_CLIENT_ID);
  }

  kafka = new Kafka(kafkaConfig);

  // Initialize producer and admin with OAuth2-enabled client
  producer = kafka.producer();
  admin = kafka.admin();

  await producer.connect();
  await admin.connect();

  console.log('✅ Kafka producer and admin connected with OAuth2 support');
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

// Test connection with provided settings
app.post('/api/test-connection', async (req, res) => {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    steps: [],
    success: false,
    error: null,
  };

  let testKafka = null;
  let testProducer = null;
  let testAdmin = null;

  try {
    const config = req.body;

    diagnostics.steps.push({
      step: 'Configuration received',
      status: 'success',
      details: {
        brokers: config.brokers,
        clientId: config.clientId,
        securityProtocol: config.securityProtocol,
        saslMechanism: config.saslMechanism || 'N/A',
        useTls: config.useTls || false,
        schemaRegistryUrl: config.schemaRegistryUrl || 'N/A',
      },
      timestamp: new Date().toISOString(),
    });

    // Build Kafka client configuration
    const kafkaConfig = {
      clientId: config.clientId || 'kafka-web-ui-test',
      brokers: config.brokers.split(',').map(b => b.trim()),
    };

    // Add SSL configuration if needed
    if (config.useTls || config.securityProtocol === 'SSL' || config.securityProtocol === 'SASL_SSL') {
      kafkaConfig.ssl = {
        rejectUnauthorized: config.rejectUnauthorized !== false,
      };
      diagnostics.steps.push({
        step: 'SSL/TLS configuration',
        status: 'success',
        details: {
          enabled: true,
          rejectUnauthorized: kafkaConfig.ssl.rejectUnauthorized,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Add SASL configuration if needed
    if (config.securityProtocol === 'SASL_PLAINTEXT' || config.securityProtocol === 'SASL_SSL') {
      // OAuth2 / OAUTHBEARER configuration
      if (config.saslMechanism === 'oauthbearer' && config.oauthEnabled) {
        const { buildOAuth2SaslConfig } = await import('../utils/oauth-token-provider.js');

        kafkaConfig.sasl = await buildOAuth2SaslConfig({
          tokenEndpointUri: config.oauthTokenEndpoint,
          clientId: config.oauthClientId,
          clientSecret: config.oauthClientSecret,
          scope: config.oauthScope,
          sslRejectUnauthorized: config.rejectUnauthorized !== false,
        });

        diagnostics.steps.push({
          step: 'OAuth2 authentication configuration',
          status: 'success',
          details: {
            mechanism: 'oauthbearer',
            tokenEndpoint: config.oauthTokenEndpoint,
            clientId: config.oauthClientId,
          },
          timestamp: new Date().toISOString(),
        });
      } else {
        // Standard username/password authentication
        kafkaConfig.sasl = {
          mechanism: config.saslMechanism || 'plain',
          username: config.saslUsername || '',
          password: config.saslPassword || '',
        };
        diagnostics.steps.push({
          step: 'SASL authentication configuration',
          status: 'success',
          details: {
            mechanism: kafkaConfig.sasl.mechanism,
            username: kafkaConfig.sasl.username ? '***' : '(empty)',
            password: kafkaConfig.sasl.password ? '***' : '(empty)',
          },
          timestamp: new Date().toISOString(),
        });
      }
    }

    diagnostics.steps.push({
      step: 'Creating Kafka client',
      status: 'success',
      details: {
        brokers: kafkaConfig.brokers,
        clientId: kafkaConfig.clientId,
      },
      timestamp: new Date().toISOString(),
    });

    // Create test Kafka client
    testKafka = new Kafka(kafkaConfig);
    testProducer = testKafka.producer();
    testAdmin = testKafka.admin();

    // Test producer connection
    const producerStartTime = Date.now();
    await testProducer.connect();
    const producerDuration = Date.now() - producerStartTime;

    diagnostics.steps.push({
      step: 'Producer connection',
      status: 'success',
      details: {
        duration: `${producerDuration}ms`,
      },
      timestamp: new Date().toISOString(),
    });

    // Test admin connection
    const adminStartTime = Date.now();
    await testAdmin.connect();
    const adminDuration = Date.now() - adminStartTime;

    diagnostics.steps.push({
      step: 'Admin client connection',
      status: 'success',
      details: {
        duration: `${adminDuration}ms`,
      },
      timestamp: new Date().toISOString(),
    });

    // Fetch cluster metadata
    const metadataStartTime = Date.now();
    const cluster = await testAdmin.describeCluster();
    const metadataDuration = Date.now() - metadataStartTime;

    diagnostics.steps.push({
      step: 'Cluster metadata retrieval',
      status: 'success',
      details: {
        duration: `${metadataDuration}ms`,
        brokersCount: cluster.brokers.length,
        brokers: cluster.brokers.map(b => `${b.host}:${b.port} (id: ${b.nodeId})`),
        controller: `Broker ${cluster.controller}`,
      },
      timestamp: new Date().toISOString(),
    });

    // List topics
    const topicsStartTime = Date.now();
    const topics = await testAdmin.listTopics();
    const topicsDuration = Date.now() - topicsStartTime;

    diagnostics.steps.push({
      step: 'Topics listing',
      status: 'success',
      details: {
        duration: `${topicsDuration}ms`,
        topicsCount: topics.length,
        topics: topics.slice(0, 10), // Show first 10 topics
        hasMore: topics.length > 10,
      },
      timestamp: new Date().toISOString(),
    });

    // Test Schema Registry if configured
    if (config.schemaRegistryUrl && config.schemaRegistryUrl.trim() !== '') {
      try {
        const registryStartTime = Date.now();
        const registryUrl = config.schemaRegistryUrl.trim();

        // Parse URL
        const url = new URL(registryUrl);

        // When schemaRegistryUseTls is false (unchecked), we want to ACCEPT self-signed certs
        // So rejectUnauthorized should be false
        const shouldRejectUnauthorized = config.schemaRegistryUseTls === true;

        // Helper function to test Schema Registry endpoint
        const testSchemaRegistryEndpoint = async (path) => {
          const requestOptions = {
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: url.pathname.replace(/\/$/, '') + path, // Remove trailing slash and add path
            method: 'GET',
            headers: {},
          };

          // Add basic auth if credentials provided
          if (config.schemaRegistryUsername && config.schemaRegistryPassword) {
            const auth = Buffer.from(
              `${config.schemaRegistryUsername}:${config.schemaRegistryPassword}`
            ).toString('base64');
            requestOptions.headers['Authorization'] = `Basic ${auth}`;
          }

          // For HTTPS, set rejectUnauthorized
          if (url.protocol === 'https:') {
            requestOptions.rejectUnauthorized = shouldRejectUnauthorized;
          }

          return new Promise((resolve, reject) => {
            const req = https.request(requestOptions, (res) => {
              let data = '';
              res.on('data', (chunk) => { data += chunk; });
              res.on('end', () => {
                resolve({
                  statusCode: res.statusCode,
                  statusMessage: res.statusMessage,
                  headers: res.headers,
                  body: data,
                  path: path,
                  fullUrl: `${url.protocol}//${url.hostname}:${url.port || (url.protocol === 'https:' ? 443 : 80)}${requestOptions.path}`
                });
              });
            });
            req.on('error', reject);
            req.end();
          });
        };

        // Try multiple endpoints to find the correct Schema Registry API
        const endpointsToTry = [
          '/',           // Root endpoint - often has basic info
          '/subjects',   // Standard subjects endpoint
          '/config',     // Config endpoint
          '/schemas',    // Schemas endpoint (some registries)
          '/v1/subjects', // Versioned API
          '/api/v1/subjects', // Alternative versioned API
        ];

        let lastError = null;
        let successfulResponse = null;

        // Add HTTPS configuration logging
        if (url.protocol === 'https:') {
          diagnostics.steps.push({
            step: 'Schema Registry HTTPS configuration',
            status: 'success',
            details: {
              url: registryUrl,
              schemaRegistryUseTlsCheckbox: config.schemaRegistryUseTls,
              rejectUnauthorized: shouldRejectUnauthorized,
              method: 'Using native Node.js https module',
              note: shouldRejectUnauthorized
                ? 'Certificate validation ENABLED - will REJECT self-signed certs'
                : 'Certificate validation DISABLED (like curl -k) - will ACCEPT self-signed certs',
            },
            timestamp: new Date().toISOString(),
          });
        }

        // Try each endpoint until we find one that works
        for (const endpoint of endpointsToTry) {
          try {
            const response = await testSchemaRegistryEndpoint(endpoint);
            
            if (response.statusCode >= 200 && response.statusCode < 300) {
              successfulResponse = response;
              break;
            } else if (response.statusCode === 404) {
              // Continue trying other endpoints
              lastError = response;
              continue;
            } else {
              // Non-404 error, still record it but continue
              lastError = response;
              continue;
            }
          } catch (error) {
            lastError = error;
            continue;
          }
        }

        const registryDuration = Date.now() - registryStartTime;

        // Process the results
        if (successfulResponse) {
          let parsedData = null;
          let dataType = 'unknown';
          
          try {
            // Try to parse as JSON
            parsedData = JSON.parse(successfulResponse.body);
            
            // Determine what kind of data we got
            if (Array.isArray(parsedData)) {
              dataType = 'subjects_list';
            } else if (parsedData && typeof parsedData === 'object') {
              if (parsedData.compatibilityLevel || parsedData.compatibility) {
                dataType = 'config';
              } else if (parsedData.version || parsedData.name) {
                dataType = 'info';
              } else {
                dataType = 'object';
              }
            }
          } catch (e) {
            // Not JSON, treat as text
            dataType = 'text';
            parsedData = successfulResponse.body;
          }

          diagnostics.steps.push({
            step: 'Schema Registry connection',
            status: 'success',
            details: {
              duration: `${registryDuration}ms`,
              url: successfulResponse.fullUrl,
              workingEndpoint: successfulResponse.path,
              statusCode: successfulResponse.statusCode,
              dataType: dataType,
              responseSize: successfulResponse.body.length,
              sampleData: dataType === 'subjects_list' 
                ? { subjectsCount: parsedData.length, subjects: parsedData.slice(0, 10) }
                : dataType === 'text' 
                  ? successfulResponse.body.substring(0, 200) + (successfulResponse.body.length > 200 ? '...' : '')
                  : parsedData,
            },
            timestamp: new Date().toISOString(),
          });
        } else {
          // All endpoints failed
          const errorDetails = {
            duration: `${registryDuration}ms`,
            url: registryUrl,
            testedEndpoints: endpointsToTry,
            lastError: lastError?.statusCode ? {
              statusCode: lastError.statusCode,
              statusMessage: lastError.statusMessage,
              body: lastError.body,
              fullUrl: lastError.fullUrl
            } : {
              error: lastError?.message || 'Unknown connection error',
              type: lastError?.name || 'Error'
            }
          };

          diagnostics.steps.push({
            step: 'Schema Registry connection',
            status: 'warning',
            details: errorDetails,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (schemaError) {
        // Extract detailed error information
        const errorDetails = {
          url: config.schemaRegistryUrl,
          error: schemaError.message,
          errorType: schemaError.name,
          errorCode: schemaError.code,
        };

        // Add cause information if available (this often has the real error)
        if (schemaError.cause) {
          errorDetails.cause = schemaError.cause.message || String(schemaError.cause);
          errorDetails.causeCode = schemaError.cause.code;
          errorDetails.causeType = schemaError.cause.name;

          // For system errors, add syscall and errno
          if (schemaError.cause.syscall) {
            errorDetails.syscall = schemaError.cause.syscall;
          }
          if (schemaError.cause.errno) {
            errorDetails.errno = schemaError.cause.errno;
          }
          if (schemaError.cause.address) {
            errorDetails.address = schemaError.cause.address;
          }
          if (schemaError.cause.port) {
            errorDetails.port = schemaError.cause.port;
          }
        }

        // Add stack trace for debugging
        errorDetails.stack = schemaError.stack;

        diagnostics.steps.push({
          step: 'Schema Registry connection',
          status: 'warning',
          details: errorDetails,
          timestamp: new Date().toISOString(),
        });
      }
    }

    diagnostics.success = true;
    diagnostics.steps.push({
      step: 'Connection test completed',
      status: 'success',
      details: {
        message: 'All connectivity tests passed successfully',
      },
      timestamp: new Date().toISOString(),
    });

    res.json(diagnostics);
  } catch (error) {
    diagnostics.error = {
      message: error.message,
      code: error.code || 'UNKNOWN',
      stack: error.stack,
    };

    diagnostics.steps.push({
      step: 'Connection test failed',
      status: 'error',
      details: {
        error: error.message,
        code: error.code,
      },
      timestamp: new Date().toISOString(),
    });

    res.status(500).json(diagnostics);
  } finally {
    // Cleanup test connections
    try {
      if (testProducer) {
        await testProducer.disconnect();
        diagnostics.steps.push({
          step: 'Cleanup: Producer disconnected',
          status: 'success',
          timestamp: new Date().toISOString(),
        });
      }
      if (testAdmin) {
        await testAdmin.disconnect();
        diagnostics.steps.push({
          step: 'Cleanup: Admin disconnected',
          status: 'success',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }
  }
});

// Get .env configuration
app.get('/api/config', (req, res) => {
  try {
    const config = {
      // Broker settings
      brokers: process.env.KAFKA_BROKER || process.env.KAFKA_BROKERS || 'localhost:9092',
      clientId: process.env.KAFKA_CLIENT_ID || 'kafka-web-ui',

      // Security settings - determine from configuration
      securityProtocol: 'PLAINTEXT',

      // SSL/TLS settings
      useTls: process.env.KAFKA_USE_TLS === 'true',
      rejectUnauthorized: process.env.KAFKA_REJECT_UNAUTHORIZED !== 'false',

      // SASL settings
      saslMechanism: process.env.KAFKA_SASL_MECHANISM || 'plain',
      saslUsername: process.env.KAFKA_USERNAME || '',
      saslPassword: process.env.KAFKA_PASSWORD || '',

      // OAuth2 settings
      oauthEnabled: process.env.OAUTH_ENABLED === 'true',
      oauthTokenEndpoint: process.env.OAUTH_TOKEN_ENDPOINT_URI || '',
      oauthClientId: process.env.OAUTH_CLIENT_ID || '',
      oauthClientSecret: process.env.OAUTH_CLIENT_SECRET || '',
      oauthScope: process.env.OAUTH_SCOPE || '',

      // Schema Registry settings
      schemaRegistryUrl: process.env.SCHEMA_REGISTRY_URL || 'http://localhost:8081',
      schemaRegistryUseTls: process.env.SCHEMA_REGISTRY_USE_TLS !== 'false',
      schemaRegistryUsername: process.env.SCHEMA_REGISTRY_USERNAME || '',
      schemaRegistryPassword: process.env.SCHEMA_REGISTRY_PASSWORD || ''
    };

    // Determine security protocol from configuration
    const hasSasl = process.env.KAFKA_SASL_MECHANISM || process.env.KAFKA_USERNAME || process.env.OAUTH_ENABLED === 'true';
    const hasTls = process.env.KAFKA_USE_TLS === 'true';

    if (hasSasl && hasTls) {
      config.securityProtocol = 'SASL_SSL';
    } else if (hasSasl) {
      config.securityProtocol = 'SASL_PLAINTEXT';
    } else if (hasTls) {
      config.securityProtocol = 'SSL';
    }

    res.json(config);
  } catch (error) {
    console.error('Error reading configuration:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server immediately, initialize Kafka in background
app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log('⏳ Kafka initialization in progress...');
});

// Initialize Kafka in background with retries
let kafkaInitialized = false;
async function initKafkaWithRetries(maxRetries = 5, delayMs = 5000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await initKafka();
      kafkaInitialized = true;
      console.log('✅ Kafka initialization complete - API is fully operational');
      return;
    } catch (error) {
      console.error(`❌ Kafka initialization attempt ${i + 1}/${maxRetries} failed:`, error.message);
      if (i < maxRetries - 1) {
        console.log(`⏳ Retrying in ${delayMs / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  console.error('⚠️  Failed to initialize Kafka after all retries. API server running but Kafka operations will fail.');
}

initKafkaWithRetries();

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
