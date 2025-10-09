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
  clientId: 'avro-producer',
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

console.log('Configuration:');
console.log('- Kafka Broker:', process.env.KAFKA_BROKER);
console.log('- Kafka TLS:', process.env.KAFKA_USE_TLS === 'true');
console.log('- Kafka SASL:', kafkaSaslConfig ? `Yes (${kafkaSaslConfig.mechanism})` : 'No');
console.log('- Schema Registry:', process.env.SCHEMA_REGISTRY_URL);
console.log('- Schema Registry Auth:', registryConfig.auth ? `Yes (${registryConfig.auth.username})` : 'No');
console.log('- Schema Subject:', process.env.AVRO_SCHEMA_SUBJECT);
console.log('- Topic:', process.env.KAFKA_TOPIC);

// Create Kafka client
const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'avro-producer',
  brokers: [process.env.KAFKA_BROKER],
  ssl: kafkaSslConfig,
  sasl: kafkaSaslConfig,
  connectionTimeout: 10000,
  requestTimeout: 30000,
});

// Create Schema Registry client
const registry = new SchemaRegistry(registryConfig);

async function publishAvroMessage() {
  const producer = kafka.producer();

  try {
    // Connect to Kafka
    console.log('\nConnecting to Kafka...');
    await producer.connect();
    console.log('✅ Connected to Kafka successfully!');

    // Get schema from registry
    console.log(`\nFetching schema for subject: ${process.env.AVRO_SCHEMA_SUBJECT}`);
    let schemaId;
    try {
      // Try to get the latest version of the schema
      const latestSchema = await registry.getLatestSchemaId(process.env.AVRO_SCHEMA_SUBJECT);
      schemaId = latestSchema;
      console.log(`✅ Retrieved existing schema ID: ${schemaId}`);
    } catch (error) {
      console.log(`❌ Failed to retrieve existing schema: ${error.message}`);
      
      // If schema doesn't exist, register a simple test schema
      console.log('\nRegistering a simple test schema...');
      const testSchema = {
        type: 'record',
        name: 'TestMessage',
        fields: [
          { name: 'id', type: 'string' },
          { name: 'message', type: 'string' },
          { name: 'timestamp', type: 'long' },
          { name: 'metadata', type: ['null', 'string'], default: null }
        ]
      };

      const registeredSchema = await registry.register({
        type: 'AVRO',
        schema: JSON.stringify(testSchema)
      }, {
        subject: process.env.AVRO_SCHEMA_SUBJECT
      });
      
      schemaId = registeredSchema.id;
      console.log(`✅ Registered new schema with ID: ${schemaId}`);
    }

    // Create the message data
    const messageData = {
      id: process.env.AVRO_MESSAGE_ID || `msg-${Date.now()}`,
      message: process.env.AVRO_MESSAGE_CONTENT || 'Hello from Avro producer!',
      timestamp: Date.now(),
      metadata: process.env.AVRO_MESSAGE_METADATA || null
    };

    console.log('\nMessage data to encode:', messageData);

    // Encode the message using the schema
    console.log('Encoding message with Avro schema...');
    const encodedMessage = await registry.encode(schemaId, messageData);
    console.log('✅ Message encoded successfully');

    // Send the encoded message to Kafka
    const kafkaMessage = {
      topic: process.env.KAFKA_TOPIC,
      messages: [
        {
          key: messageData.id,
          value: encodedMessage,
          timestamp: messageData.timestamp.toString(),
        },
      ],
    };

    console.log(`\nPublishing Avro message to topic: ${process.env.KAFKA_TOPIC}`);
    const result = await producer.send(kafkaMessage);
    console.log('✅ Avro message published successfully!');
    console.log('Result:', JSON.stringify(result, null, 2));

    // Verify by decoding the message (optional verification step)
    console.log('\n--- Verification ---');
    const decodedMessage = await registry.decode(encodedMessage);
    console.log('✅ Message decoded successfully:', decodedMessage);

  } catch (error) {
    console.error('❌ Error publishing Avro message:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  } finally {
    // Disconnect
    await producer.disconnect();
    console.log('\nDisconnected from Kafka');
  }
}

// Run the Avro publisher
publishAvroMessage().catch(console.error);