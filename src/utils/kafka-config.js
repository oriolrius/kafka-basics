import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from user's working directory when using npx
const envPath = process.env.USER_CWD ? path.join(process.env.USER_CWD, '.env') : '.env';
dotenv.config({ path: envPath });

// Silence the partitioner warning
process.env.KAFKAJS_NO_PARTITIONER_WARNING = '1';

/**
 * Build SSL configuration for Kafka
 */
function buildSslConfig() {
  if (process.env.KAFKA_USE_TLS === 'true') {
    const sslConfig = {
      rejectUnauthorized: process.env.KAFKA_REJECT_UNAUTHORIZED !== 'false'
    };

    // Add CA certificate if provided (needed for OAuth2 with self-signed certs)
    if (process.env.KAFKA_SSL_CA_LOCATION && fs.existsSync(process.env.KAFKA_SSL_CA_LOCATION)) {
      sslConfig.ca = [fs.readFileSync(process.env.KAFKA_SSL_CA_LOCATION)];
    }

    // Add client certificate if provided
    if (process.env.KAFKA_SSL_CERT_LOCATION && fs.existsSync(process.env.KAFKA_SSL_CERT_LOCATION)) {
      sslConfig.cert = fs.readFileSync(process.env.KAFKA_SSL_CERT_LOCATION);
    }

    // Add client key if provided
    if (process.env.KAFKA_SSL_KEY_LOCATION && fs.existsSync(process.env.KAFKA_SSL_KEY_LOCATION)) {
      sslConfig.key = fs.readFileSync(process.env.KAFKA_SSL_KEY_LOCATION);
    }

    return sslConfig;
  }
  return false;
}

/**
 * Build SASL configuration for Kafka
 * Supports plain, scram-sha-256, scram-sha-512, and oauthbearer mechanisms
 */
async function buildSaslConfig() {
  const mechanism = process.env.KAFKA_SASL_MECHANISM || 'plain';

  // OAuth2 / OAUTHBEARER configuration
  if (mechanism === 'oauthbearer' && process.env.OAUTH_ENABLED === 'true') {
    // Import dynamically to avoid circular dependencies
    const oauthModule = await import('./oauth-token-provider.js');
    const { buildOAuth2SaslConfig } = oauthModule;

    return buildOAuth2SaslConfig({
      tokenEndpointUri: process.env.OAUTH_TOKEN_ENDPOINT_URI,
      clientId: process.env.OAUTH_CLIENT_ID,
      clientSecret: process.env.OAUTH_CLIENT_SECRET,
      scope: process.env.OAUTH_SCOPE,
      sslCaLocation: process.env.OAUTH_SSL_CA_LOCATION,
      sslRejectUnauthorized: process.env.OAUTH_SSL_REJECT_UNAUTHORIZED !== 'false',
      tokenExpiryBuffer: parseInt(process.env.OAUTH_TOKEN_EXPIRY_BUFFER || '60', 10),
    });
  }

  // Standard username/password authentication (plain, scram-sha-256, scram-sha-512)
  if (process.env.KAFKA_USERNAME && process.env.KAFKA_PASSWORD) {
    return {
      mechanism: mechanism,
      username: process.env.KAFKA_USERNAME,
      password: process.env.KAFKA_PASSWORD,
    };
  }

  return undefined;
}

/**
 * Build complete Kafka client configuration
 */
async function buildKafkaConfig(clientId = 'kafka-client') {
  return {
    clientId: process.env.KAFKA_CLIENT_ID || clientId,
    brokers: [process.env.KAFKA_BROKER],
    ssl: buildSslConfig(),
    sasl: await buildSaslConfig(),
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
async function printKafkaConfig(includeRegistry = false) {
  const saslConfig = await buildSaslConfig();
  
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

export {
  buildSslConfig,
  buildSaslConfig,
  buildKafkaConfig,
  buildRegistryConfig,
  printKafkaConfig
};
