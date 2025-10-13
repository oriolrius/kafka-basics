import https from 'https';
import http from 'http';
import fs from 'fs';
import { URL } from 'url';

/**
 * OAuth2 Token Provider for Kafka SASL/OAUTHBEARER authentication
 *
 * This class handles token acquisition, caching, and automatic refresh
 * for OAuth2-based authentication with Kafka brokers.
 *
 * @class OAuth2TokenProvider
 */
class OAuth2TokenProvider {
  constructor(config) {
    this.config = {
      tokenEndpointUri: config.tokenEndpointUri || process.env.OAUTH_TOKEN_ENDPOINT_URI,
      clientId: config.clientId || process.env.OAUTH_CLIENT_ID,
      clientSecret: config.clientSecret || process.env.OAUTH_CLIENT_SECRET,
      scope: config.scope || process.env.OAUTH_SCOPE || '',
      sslCaLocation: config.sslCaLocation || process.env.OAUTH_SSL_CA_LOCATION,
      sslRejectUnauthorized: config.sslRejectUnauthorized !== undefined
        ? config.sslRejectUnauthorized
        : (process.env.OAUTH_SSL_REJECT_UNAUTHORIZED !== 'false'),
      tokenExpiryBuffer: config.tokenExpiryBuffer || parseInt(process.env.OAUTH_TOKEN_EXPIRY_BUFFER || '60', 10),
    };

    // Validate required configuration
    if (!this.config.tokenEndpointUri) {
      throw new Error('OAuth2 token endpoint URI is required');
    }
    if (!this.config.clientId || !this.config.clientSecret) {
      throw new Error('OAuth2 client ID and secret are required');
    }

    // Token cache
    this.cachedToken = null;
    this.tokenExpiryTime = null;

    // Parse token endpoint URL
    this.tokenUrl = new URL(this.config.tokenEndpointUri);

    // Load CA certificate if provided
    this.ca = null;
    if (this.config.sslCaLocation && fs.existsSync(this.config.sslCaLocation)) {
      this.ca = fs.readFileSync(this.config.sslCaLocation);
    }
  }

  /**
   * Get access token (from cache or fetch new one)
   * @returns {Promise<string>} Access token
   */
  async getToken() {
    // Check if we have a valid cached token
    if (this.cachedToken && this.isTokenValid()) {
      console.log('[OAuth2] Using cached token');
      return this.cachedToken;
    }

    // Fetch new token
    console.log('[OAuth2] Fetching new access token from', this.config.tokenEndpointUri);
    return await this.fetchToken();
  }

  /**
   * Check if cached token is still valid
   * @returns {boolean} True if token is valid
   */
  isTokenValid() {
    if (!this.tokenExpiryTime) {
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    const bufferTime = this.config.tokenExpiryBuffer;

    // Token is valid if it doesn't expire within the buffer time
    return (this.tokenExpiryTime - now) > bufferTime;
  }

  /**
   * Fetch new access token from OAuth2 server
   * @returns {Promise<string>} Access token
   */
  async fetchToken() {
    const postData = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });

    if (this.config.scope) {
      postData.append('scope', this.config.scope);
    }

    const postDataString = postData.toString();

    const options = {
      hostname: this.tokenUrl.hostname,
      port: this.tokenUrl.port || (this.tokenUrl.protocol === 'https:' ? 443 : 80),
      path: this.tokenUrl.pathname + (this.tokenUrl.search || ''),
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postDataString),
      },
    };

    // Add SSL/TLS options for HTTPS
    if (this.tokenUrl.protocol === 'https:') {
      options.rejectUnauthorized = this.config.sslRejectUnauthorized;
      if (this.ca) {
        options.ca = this.ca;
      }
    }

    return new Promise((resolve, reject) => {
      const protocol = this.tokenUrl.protocol === 'https:' ? https : http;

      const req = protocol.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const tokenResponse = JSON.parse(data);

              if (!tokenResponse.access_token) {
                reject(new Error('No access_token in response'));
                return;
              }

              // Cache the token
              this.cachedToken = tokenResponse.access_token;

              // Calculate expiry time
              const expiresIn = tokenResponse.expires_in || 300; // Default 5 minutes
              this.tokenExpiryTime = Math.floor(Date.now() / 1000) + expiresIn;

              console.log(`[OAuth2] Token acquired successfully (expires in ${expiresIn}s)`);
              resolve(this.cachedToken);
            } catch (parseError) {
              reject(new Error(`Failed to parse token response: ${parseError.message}`));
            }
          } else {
            reject(new Error(`Token request failed with status ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Token request error: ${error.message}`));
      });

      req.write(postDataString);
      req.end();
    });
  }

  /**
   * Generate OAUTHBEARER SASL token for KafkaJS
   * This is called by KafkaJS during authentication
   *
   * @returns {Promise<Object>} Token object with value
   */
  async generateToken() {
    const accessToken = await this.getToken();

    return {
      value: accessToken,
    };
  }

  /**
   * Clear cached token (force refresh on next getToken call)
   */
  clearCache() {
    this.cachedToken = null;
    this.tokenExpiryTime = null;
    console.log('[OAuth2] Token cache cleared');
  }

  /**
   * Get token information (for debugging)
   * @returns {Object} Token metadata
   */
  getTokenInfo() {
    if (!this.cachedToken || !this.tokenExpiryTime) {
      return {
        hasCachedToken: false,
        isValid: false,
      };
    }

    const now = Math.floor(Date.now() / 1000);
    const expiresIn = this.tokenExpiryTime - now;

    return {
      hasCachedToken: true,
      isValid: this.isTokenValid(),
      expiresIn: expiresIn,
      expiresAt: new Date(this.tokenExpiryTime * 1000).toISOString(),
    };
  }
}

/**
 * Create OAuth2 token provider for KafkaJS SASL configuration
 *
 * @param {Object} config - OAuth2 configuration
 * @returns {OAuth2TokenProvider} Token provider instance
 */
export function createOAuth2TokenProvider(config = {}) {
  return new OAuth2TokenProvider(config);
}

/**
 * Build SASL OAuth2 configuration for KafkaJS
 *
 * @param {Object} config - OAuth2 configuration (optional, uses env vars if not provided)
 * @returns {Object} KafkaJS SASL configuration object
 */
export function buildOAuth2SaslConfig(config = {}) {
  const tokenProvider = createOAuth2TokenProvider(config);

  return {
    mechanism: 'oauthbearer',
    oauthBearerProvider: async () => {
      const token = await tokenProvider.generateToken();
      return {
        value: token.value,
      };
    },
  };
}

export default OAuth2TokenProvider;
