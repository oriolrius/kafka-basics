const { Kafka } = require('kafkajs');
const { buildKafkaConfig, printKafkaConfig } = require('../utils/kafka-config');

console.log('═══════════════════════════════════════════════════════');
console.log('🗑️  KAFKA TOPIC DELETION TOOL');
console.log('═══════════════════════════════════════════════════════\n');

printKafkaConfig(false);

const topic = process.env.KAFKA_TOPIC;

if (!topic) {
  console.error('\n❌ Error: KAFKA_TOPIC not set in environment variables');
  process.exit(1);
}

// Create Kafka client
const kafka = new Kafka(buildKafkaConfig('topic-deleter'));

async function deleteTopic() {
  const admin = kafka.admin();

  try {
    console.log('\nConnecting to Kafka...');
    await admin.connect();
    console.log('✅ Connected successfully!\n');

    // Check if topic exists
    console.log(`🔍 Checking if topic exists: ${topic}`);
    const topics = await admin.listTopics();
    
    if (!topics.includes(topic)) {
      console.log(`\n⚠️  Topic "${topic}" does not exist.`);
      console.log('   Nothing to delete.');
      await admin.disconnect();
      return;
    }

    console.log(`✅ Topic found: ${topic}\n`);

    // Get topic metadata
    const metadata = await admin.fetchTopicMetadata({ topics: [topic] });
    const topicMetadata = metadata.topics[0];
    
    console.log('Topic Information:');
    console.log(`  Name: ${topicMetadata.name}`);
    console.log(`  Partitions: ${topicMetadata.partitions.length}`);
    console.log();

    // Ask for confirmation (in production, you might want to use a proper prompt)
    console.log('⚠️  WARNING: This will DELETE the topic and ALL its messages!');
    console.log('   This operation CANNOT be undone!');
    console.log();
    
    // Auto-confirm if KAFKA_CONFIRM_DELETE=yes
    if (process.env.KAFKA_CONFIRM_DELETE !== 'yes') {
      console.log('❌ Deletion cancelled.');
      console.log('   To confirm deletion, set: KAFKA_CONFIRM_DELETE=yes');
      await admin.disconnect();
      return;
    }

    console.log('🗑️  Deleting topic...');
    await admin.deleteTopics({
      topics: [topic],
      timeout: 30000
    });

    console.log(`\n✅ Topic "${topic}" has been deleted successfully!`);
    console.log('   All messages have been removed.\n');

  } catch (error) {
    if (error.message && error.message.includes('UnknownTopicOrPartition')) {
      console.log(`\nℹ️  Topic "${topic}" does not exist or was already deleted.`);
    } else {
      console.error('\n❌ Error deleting topic:', error.message || error);
      process.exit(1);
    }
  } finally {
    await admin.disconnect();
    console.log('═══════════════════════════════════════════════════════');
  }
}

// Run
deleteTopic().catch(console.error);
