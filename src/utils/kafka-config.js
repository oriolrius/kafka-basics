require('dotenv').config();

// Silence the partitioner warning
process.env.KAFKAJS_NO_PARTITIONER_WARNING = '1';

/**
 * Build SSL configuration for Kafka
 */
function buildSslConfig() {
  if (process.env.KAFKA_USE_TLS === 'true') {
    return {
      rejectUnauthorized: process.env.KAFKA_REJECT_UNAUTHORIZED !== 'false'
    };
  }
  return false;
}

/**
 * Build SASL configuration for Kafka
 */
function buildSaslConfig() {
  if (process.env.KAFKA_USERNAME && process.env.KAFKA_PASSWORD) {
    return {
      mechanism: process.env.KAFKA_SASL_MECHANISM || 'plain',
      username: process.env.KAFKA_USERNAME,
      password: process.env.KAFKA_PASSWORD,
    };
  }
  return undefined;
}

/**
 * Build complete Kafka client configuration
 */
function buildKafkaConfig(clientId = 'kafka-client') {
  return {
    clientId: process.env.KAFKA_CLIENT_ID || clientId,
    brokers: [process.env.KAFKA_BROKER],
    ssl: buildSslConfig(),
    sasl: buildSaslConfig(),
    connectionTimeout: 10000,
    requestTimeout: 30000,
    retry: {
      initialRetryTime: 100,
      retries: 3
    }
  };
}

/**
 * Build Schema Registry configuration
 */
function buildRegistryConfig(clientId = 'schema-registry-client') {
  if (!process.env.SCHEMA_REGISTRY_URL) {
    return null;
  }

  const config = {
    host: process.env.SCHEMA_REGISTRY_URL,
    clientId,
    retry: {
      retries: 3,
      factor: 2,
      multiplier: 1000,
      maxRetryTimeInSecs: 60
    }
  };

  // Add authentication if provided
  if (process.env.SCHEMA_REGISTRY_USERNAME && process.env.SCHEMA_REGISTRY_PASSWORD) {
    config.auth = {
      username: process.env.SCHEMA_REGISTRY_USERNAME,
      password: process.env.SCHEMA_REGISTRY_PASSWORD,
    };
  }

  return config;
}

/**
 * Print Kafka configuration to console
 */
function printKafkaConfig(includeRegistry = false) {
  const saslConfig = buildSaslConfig();
  
  console.log('Kafka Configuration:');
  console.log('- Broker:', process.env.KAFKA_BROKER);
  console.log('- TLS:', process.env.KAFKA_USE_TLS === 'true');
  console.log('- SASL:', saslConfig ? `Yes (${saslConfig.mechanism})` : 'No');
  console.log('- Topic:', process.env.KAFKA_TOPIC);
  
  if (includeRegistry) {
    const registryConfig = buildRegistryConfig();
    console.log('- Schema Registry:', registryConfig ? process.env.SCHEMA_REGISTRY_URL : 'Not configured');
    if (registryConfig?.auth) {
      console.log('- Schema Registry Auth:', `Yes (${registryConfig.auth.username})`);
    }
  }
}

module.exports = {
  buildSslConfig,
  buildSaslConfig,
  buildKafkaConfig,
  buildRegistryConfig,
  printKafkaConfig
};
