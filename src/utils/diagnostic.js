const { Kafka } = require('kafkajs');
require('dotenv').config();

process.env.KAFKAJS_NO_PARTITIONER_WARNING = '1';

const broker = process.env.KAFKA_BROKER;
const username = process.env.KAFKA_USERNAME;
const password = process.env.KAFKA_PASSWORD;

console.log('=== Kafka Connection Diagnostic ===');
console.log('Broker:', broker);
console.log('Username:', username ? `${username.substring(0, 3)}***` : 'Not set');
console.log('Password:', password ? '***' : 'Not set');
console.log('');

// Test different SASL mechanisms
const mechanisms = ['plain', 'scram-sha-256', 'scram-sha-512'];

async function testConnection(mechanism) {
  console.log(`\n--- Testing ${mechanism.toUpperCase()} ---`);
  
  const kafka = new Kafka({
    clientId: 'diagnostic-client',
    brokers: [broker],
    ssl: {
      rejectUnauthorized: false
    },
    sasl: {
      mechanism: mechanism,
      username: username,
      password: password,
    },
    connectionTimeout: 10000,
    requestTimeout: 30000,
  });

  const admin = kafka.admin();
  
  try {
    console.log(`Connecting with ${mechanism}...`);
    await admin.connect();
    console.log(`✅ SUCCESS: Connected with ${mechanism}`);
    
    // Try to list topics to verify full connectivity
    const metadata = await admin.fetchTopicMetadata();
    console.log(`✅ Topic metadata fetched successfully`);
    console.log(`Available topics: ${metadata.topics.map(t => t.name).slice(0, 5).join(', ')}${metadata.topics.length > 5 ? '...' : ''}`);
    
    await admin.disconnect();
    return true;
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    try {
      await admin.disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
    return false;
  }
}

async function testWithoutAuth() {
  console.log(`\n--- Testing WITHOUT SASL ---`);
  
  const kafka = new Kafka({
    clientId: 'diagnostic-client-noauth',
    brokers: [broker],
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeout: 10000,
    requestTimeout: 30000,
  });

  const admin = kafka.admin();
  
  try {
    console.log('Connecting without SASL...');
    await admin.connect();
    console.log('✅ SUCCESS: Connected without SASL');
    
    const metadata = await admin.fetchTopicMetadata();
    console.log('✅ Topic metadata fetched successfully');
    
    await admin.disconnect();
    return true;
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    try {
      await admin.disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
    return false;
  }
}

async function runDiagnostics() {
  let successCount = 0;
  
  // Test without authentication first
  if (await testWithoutAuth()) {
    successCount++;
  }
  
  // Test each SASL mechanism
  for (const mechanism of mechanisms) {
    if (await testConnection(mechanism)) {
      successCount++;
    }
  }
  
  console.log('\n=== DIAGNOSTIC SUMMARY ===');
  if (successCount === 0) {
    console.log('❌ No successful connections found');
    console.log('\nPossible issues:');
    console.log('- Incorrect broker address or port');
    console.log('- Network connectivity issues');
    console.log('- Firewall blocking the connection');
    console.log('- Incorrect credentials');
    console.log('- Broker requires a different SASL mechanism');
  } else {
    console.log(`✅ Found ${successCount} working configuration(s)`);
    console.log('\nUpdate your .env file with the working configuration shown above.');
  }
}

runDiagnostics().catch(console.error);