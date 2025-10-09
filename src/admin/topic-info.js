const { Kafka } = require('kafkajs');
const { buildKafkaConfig, printKafkaConfig } = require('../utils/kafka-config');

console.log('═══════════════════════════════════════════════════════');
console.log('ℹ️  KAFKA TOPIC INFORMATION');
console.log('═══════════════════════════════════════════════════════\n');

printKafkaConfig(false);

const topic = process.env.KAFKA_TOPIC;

if (!topic) {
  console.error('\n❌ Error: KAFKA_TOPIC not set in environment variables');
  process.exit(1);
}

// Create Kafka client
const kafka = new Kafka(buildKafkaConfig('topic-info'));

async function getTopicInfo() {
  const admin = kafka.admin();

  try {
    console.log('\nConnecting to Kafka...');
    await admin.connect();
    console.log('✅ Connected successfully!\n');

    // Check if topic exists
    console.log(`🔍 Fetching information for topic: ${topic}\n`);
    const topics = await admin.listTopics();
    
    if (!topics.includes(topic)) {
      console.log(`⚠️  Topic "${topic}" does not exist.\n`);
      console.log('Available topics:');
      if (topics.length === 0) {
        console.log('  (no topics found)');
      } else {
        topics.forEach(t => console.log(`  - ${t}`));
      }
      await admin.disconnect();
      return;
    }

    // Get topic metadata
    const metadata = await admin.fetchTopicMetadata({ topics: [topic] });
    const topicMetadata = metadata.topics[0];
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 TOPIC DETAILS');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log(`Name: ${topicMetadata.name}`);
    console.log(`Partitions: ${topicMetadata.partitions.length}`);
    console.log();

    // Partition details
    console.log('Partition Details:');
    topicMetadata.partitions.forEach(partition => {
      console.log(`\n  Partition ${partition.partitionId}:`);
      console.log(`    Leader: ${partition.leader}`);
      console.log(`    Replicas: [${partition.replicas.join(', ')}]`);
      console.log(`    ISR: [${partition.isr.join(', ')}]`);
    });
    console.log();

    // Get consumer group offsets if available
    try {
      const groups = await admin.listGroups();
      console.log('═══════════════════════════════════════════════════════');
      console.log('👥 CONSUMER GROUPS');
      console.log('═══════════════════════════════════════════════════════\n');
      
      if (groups.groups.length === 0) {
        console.log('  No active consumer groups found.\n');
      } else {
        console.log(`Found ${groups.groups.length} consumer group(s):\n`);
        groups.groups.forEach(group => {
          console.log(`  - ${group.groupId} (protocol: ${group.protocolType})`);
        });
        console.log();
      }
    } catch (e) {
      console.log('  Could not fetch consumer groups:', e.message);
    }

    // Get topic configuration
    try {
      const configs = await admin.fetchTopicOffsets(topic);
      console.log('═══════════════════════════════════════════════════════');
      console.log('📈 OFFSET INFORMATION');
      console.log('═══════════════════════════════════════════════════════\n');
      
      let totalMessages = 0;
      configs.forEach(partition => {
        const messages = parseInt(partition.high) - parseInt(partition.low);
        totalMessages += messages;
        console.log(`  Partition ${partition.partition}:`);
        console.log(`    Low offset: ${partition.low}`);
        console.log(`    High offset: ${partition.high}`);
        console.log(`    Messages: ~${messages}`);
        console.log();
      });
      
      console.log(`  Total messages (approx): ${totalMessages}`);
      console.log();
    } catch (e) {
      console.log('  Could not fetch offsets:', e.message);
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ Information retrieval completed!');
    console.log('═══════════════════════════════════════════════════════');

  } catch (error) {
    console.error('\n❌ Error fetching topic info:', error.message || error);
    process.exit(1);
  } finally {
    await admin.disconnect();
  }
}

// Run
getTopicInfo().catch(console.error);
