const { Kafka } = require('kafkajs');
const { SchemaRegistry } = require('@kafkajs/confluent-schema-registry');
const { buildKafkaConfig, buildRegistryConfig, printKafkaConfig } = require('../utils/kafka-config');

console.log('═══════════════════════════════════════════════════════');
console.log('📋 KAFKA TOPIC MESSAGE LISTER');
console.log('═══════════════════════════════════════════════════════\n');

printKafkaConfig(true);

// Create Kafka client
const kafka = new Kafka(buildKafkaConfig('message-lister'));

// Create Schema Registry client (optional)
const registryConfig = buildRegistryConfig('message-lister');
const registry = registryConfig ? new SchemaRegistry(registryConfig) : null;

/**
 * Detects if a buffer is Avro-encoded
 */
function isAvroEncoded(buffer) {
  return buffer.length >= 5 && buffer[0] === 0x00;
}

/**
 * Format message value for display
 */
async function formatMessageValue(value) {
  // Try Avro first if registry is available
  if (registry && isAvroEncoded(value)) {
    try {
      const decoded = await registry.decode(value);
      return {
        type: 'Avro',
        value: decoded,
        display: JSON.stringify(decoded, null, 2)
      };
    } catch (e) {
      // Avro decode failed, continue to other formats
    }
  }

  // Try JSON/Text
  try {
    const stringValue = value.toString();
    try {
      const jsonValue = JSON.parse(stringValue);
      return {
        type: 'JSON',
        value: jsonValue,
        display: JSON.stringify(jsonValue, null, 2)
      };
    } catch (e) {
      return {
        type: 'Text',
        value: stringValue,
        display: stringValue
      };
    }
  } catch (e) {
    return {
      type: 'Binary',
      value: value,
      display: `[Binary data, ${value.length} bytes]`
    };
  }
}

async function listMessages() {
  const consumer = kafka.consumer({ 
    groupId: `message-lister-${Date.now()}`, // Unique group to not affect others
    sessionTimeout: 30000,
    heartbeatInterval: 3000,
  });

  const messages = [];
  let partitionInfo = {};

  try {
    console.log('\nConnecting to Kafka...');
    await consumer.connect();
    console.log('✅ Connected successfully!\n');

    // Subscribe to topic
    const topic = process.env.KAFKA_TOPIC;
    await consumer.subscribe({ topic, fromBeginning: true });

    console.log(`📨 Reading all messages from topic: ${topic}`);
    console.log('⏳ Please wait...\n');

    // Track when we've finished reading
    let isReading = true;
    let lastMessageTime = Date.now();
    const timeout = 5000; // 5 seconds without messages = done

    // Check periodically if we're done reading
    const checkInterval = setInterval(() => {
      if (Date.now() - lastMessageTime > timeout && isReading) {
        isReading = false;
      }
    }, 1000);

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        lastMessageTime = Date.now();
        
        const formatted = await formatMessageValue(message.value);
        
        messages.push({
          topic,
          partition,
          offset: message.offset,
          timestamp: new Date(parseInt(message.timestamp)),
          key: message.key ? message.key.toString() : null,
          type: formatted.type,
          value: formatted.value,
          display: formatted.display
        });

        // Track partition info
        if (!partitionInfo[partition]) {
          partitionInfo[partition] = { count: 0, minOffset: message.offset, maxOffset: message.offset };
        }
        partitionInfo[partition].count++;
        partitionInfo[partition].maxOffset = message.offset;
      },
    });

    // Wait until we stop receiving messages
    while (isReading) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    clearInterval(checkInterval);
    await consumer.disconnect();

    // Display results
    console.log('═══════════════════════════════════════════════════════');
    console.log(`📊 SUMMARY: Found ${messages.length} message(s)\n`);
    
    // Partition summary
    console.log('Partition Distribution:');
    Object.keys(partitionInfo).sort().forEach(partition => {
      const info = partitionInfo[partition];
      console.log(`  Partition ${partition}: ${info.count} message(s) (offsets ${info.minOffset}-${info.maxOffset})`);
    });
    console.log();

    // Type summary
    const typeCount = {};
    messages.forEach(m => {
      typeCount[m.type] = (typeCount[m.type] || 0) + 1;
    });
    console.log('Message Types:');
    Object.keys(typeCount).sort().forEach(type => {
      console.log(`  ${type}: ${typeCount[type]} message(s)`);
    });
    console.log();

    // Display messages
    if (messages.length === 0) {
      console.log('ℹ️  No messages found in topic.');
    } else {
      console.log('═══════════════════════════════════════════════════════');
      console.log('📋 MESSAGES:');
      console.log('═══════════════════════════════════════════════════════\n');

      messages.forEach((msg, index) => {
        console.log(`━━━ Message ${index + 1}/${messages.length} ━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`  Partition: ${msg.partition} | Offset: ${msg.offset}`);
        console.log(`  Timestamp: ${msg.timestamp.toISOString()}`);
        console.log(`  Key: ${msg.key || '(null)'}`);
        console.log(`  Type: ${msg.type}`);
        console.log(`  Value:`);
        msg.display.split('\n').forEach(line => console.log(`    ${line}`));
        console.log();
      });
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ Listing completed!');
    console.log('═══════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error listing messages:', error);
    process.exit(1);
  }
}

// Run
listMessages().catch(console.error);
