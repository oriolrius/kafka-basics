import React, { useState, useEffect } from 'react';

function Settings() {
  const [config, setConfig] = useState({
    // Broker settings
    brokers: 'localhost:9092',
    clientId: 'kafka-web-ui',
    
    // Security settings
    securityProtocol: 'PLAINTEXT', // PLAINTEXT, SSL, SASL_PLAINTEXT, SASL_SSL
    
    // SSL/TLS settings
    useTls: false,
    rejectUnauthorized: true,
    
    // SASL settings
    saslMechanism: 'plain', // plain, scram-sha-256, scram-sha-512, aws, oauthbearer
    saslUsername: '',
    saslPassword: '',
    
    // Schema Registry settings
    schemaRegistryUrl: 'http://localhost:8081',
    schemaRegistryUseTls: false,
    schemaRegistryUsername: '',
    schemaRegistryPassword: '',
  });

  const [status, setStatus] = useState('');
  const [saved, setSaved] = useState(false);

  // Load saved configuration on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('kafka-connection-config');
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.error('Failed to load saved config:', e);
      }
    }
  }, []);

  const handleChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    try {
      // Save to localStorage
      localStorage.setItem('kafka-connection-config', JSON.stringify(config));
      
      // Show success message
      setStatus('✅ Configuration saved successfully! Restart the server to apply changes.');
      setSaved(true);
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => setStatus(''), 5000);
    } catch (error) {
      setStatus(`❌ Error saving configuration: ${error.message}`);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset to default configuration? This will clear all saved settings.')) {
      const defaultConfig = {
        brokers: 'localhost:9092',
        clientId: 'kafka-web-ui',
        securityProtocol: 'PLAINTEXT',
        useTls: false,
        rejectUnauthorized: true,
        saslMechanism: 'plain',
        saslUsername: '',
        saslPassword: '',
        schemaRegistryUrl: 'http://localhost:8081',
        schemaRegistryUseTls: false,
        schemaRegistryUsername: '',
        schemaRegistryPassword: '',
      };
      setConfig(defaultConfig);
      localStorage.removeItem('kafka-connection-config');
      setStatus('ℹ️ Configuration reset to defaults');
      setSaved(false);
    }
  };

  const handleExport = () => {
    const envContent = `# Kafka Broker Configuration
KAFKA_BROKERS=${config.brokers}
KAFKA_CLIENT_ID=${config.clientId}

# Security Protocol
# Options: PLAINTEXT, SSL, SASL_PLAINTEXT, SASL_SSL
SECURITY_PROTOCOL=${config.securityProtocol}

# SSL/TLS Configuration
KAFKA_USE_TLS=${config.useTls}
KAFKA_REJECT_UNAUTHORIZED=${config.rejectUnauthorized}

# SASL Authentication
# Mechanisms: plain, scram-sha-256, scram-sha-512, aws, oauthbearer
KAFKA_SASL_MECHANISM=${config.saslMechanism}
KAFKA_USERNAME=${config.saslUsername}
KAFKA_PASSWORD=${config.saslPassword}

# Schema Registry Configuration
SCHEMA_REGISTRY_URL=${config.schemaRegistryUrl}
SCHEMA_REGISTRY_USE_TLS=${config.schemaRegistryUseTls}
SCHEMA_REGISTRY_USERNAME=${config.schemaRegistryUsername}
SCHEMA_REGISTRY_PASSWORD=${config.schemaRegistryPassword}
`;

    const blob = new Blob([envContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.env';
    a.click();
    URL.revokeObjectURL(url);
    
    setStatus('✅ Configuration exported to .env file');
  };

  const needsSasl = config.securityProtocol === 'SASL_PLAINTEXT' || config.securityProtocol === 'SASL_SSL';
  const needsSsl = config.securityProtocol === 'SSL' || config.securityProtocol === 'SASL_SSL';

  return (
    <div className="settings">
      <h2>⚙️ Connection Settings</h2>
      <p>Configure Kafka broker connection and authentication</p>

      <div className="settings-sections">
        {/* Broker Configuration */}
        <section className="settings-section">
          <h3>🔌 Broker Configuration</h3>
          
          <div className="form-group">
            <label htmlFor="brokers">
              Broker(s)
              <span className="field-hint">Comma-separated list (e.g., localhost:9092,broker2:9092)</span>
            </label>
            <input
              id="brokers"
              type="text"
              value={config.brokers}
              onChange={(e) => handleChange('brokers', e.target.value)}
              placeholder="localhost:9092"
            />
          </div>

          <div className="form-group">
            <label htmlFor="clientId">
              Client ID
              <span className="field-hint">Unique identifier for this client</span>
            </label>
            <input
              id="clientId"
              type="text"
              value={config.clientId}
              onChange={(e) => handleChange('clientId', e.target.value)}
              placeholder="kafka-web-ui"
            />
          </div>

          <div className="form-group">
            <label htmlFor="securityProtocol">
              Security Protocol
              <span className="field-hint">Communication security level</span>
            </label>
            <select
              id="securityProtocol"
              value={config.securityProtocol}
              onChange={(e) => handleChange('securityProtocol', e.target.value)}
            >
              <option value="PLAINTEXT">PLAINTEXT - No encryption or auth</option>
              <option value="SSL">SSL - TLS encryption only</option>
              <option value="SASL_PLAINTEXT">SASL_PLAINTEXT - Auth without encryption</option>
              <option value="SASL_SSL">SASL_SSL - Auth with TLS encryption</option>
            </select>
          </div>
        </section>

        {/* SSL/TLS Configuration */}
        {needsSsl && (
          <section className="settings-section">
            <h3>🔒 SSL/TLS Configuration</h3>
            
            <div className="form-group-checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={config.useTls}
                  onChange={(e) => handleChange('useTls', e.target.checked)}
                />
                <span>Enable TLS/SSL encryption</span>
              </label>
            </div>

            <div className="form-group-checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={config.rejectUnauthorized}
                  onChange={(e) => handleChange('rejectUnauthorized', e.target.checked)}
                />
                <span>Reject unauthorized certificates</span>
                <span className="field-hint">Disable for self-signed certificates</span>
              </label>
            </div>
          </section>
        )}

        {/* SASL Authentication */}
        {needsSasl && (
          <section className="settings-section">
            <h3>🔑 SASL Authentication</h3>
            
            <div className="form-group">
              <label htmlFor="saslMechanism">
                SASL Mechanism
                <span className="field-hint">Authentication method</span>
              </label>
              <select
                id="saslMechanism"
                value={config.saslMechanism}
                onChange={(e) => handleChange('saslMechanism', e.target.value)}
              >
                <option value="plain">PLAIN - Simple username/password</option>
                <option value="scram-sha-256">SCRAM-SHA-256 - Salted challenge</option>
                <option value="scram-sha-512">SCRAM-SHA-512 - Stronger salted challenge</option>
                <option value="aws">AWS - AWS MSK IAM authentication</option>
                <option value="oauthbearer">OAUTHBEARER - OAuth 2.0</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="saslUsername">Username</label>
              <input
                id="saslUsername"
                type="text"
                value={config.saslUsername}
                onChange={(e) => handleChange('saslUsername', e.target.value)}
                placeholder="kafka-user"
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="saslPassword">Password</label>
              <input
                id="saslPassword"
                type="password"
                value={config.saslPassword}
                onChange={(e) => handleChange('saslPassword', e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
              />
            </div>
          </section>
        )}

        {/* Schema Registry */}
        <section className="settings-section">
          <h3>📋 Schema Registry</h3>
          
          <div className="form-group">
            <label htmlFor="schemaRegistryUrl">
              Schema Registry URL
              <span className="field-hint">Confluent Schema Registry endpoint</span>
            </label>
            <input
              id="schemaRegistryUrl"
              type="text"
              value={config.schemaRegistryUrl}
              onChange={(e) => handleChange('schemaRegistryUrl', e.target.value)}
              placeholder="http://localhost:8081"
            />
          </div>

          <div className="form-group-checkbox">
            <label>
              <input
                type="checkbox"
                checked={config.schemaRegistryUseTls}
                onChange={(e) => handleChange('schemaRegistryUseTls', e.target.checked)}
              />
              <span>Use TLS for Schema Registry</span>
            </label>
          </div>

          <div className="form-group">
            <label htmlFor="schemaRegistryUsername">
              Registry Username (optional)
            </label>
            <input
              id="schemaRegistryUsername"
              type="text"
              value={config.schemaRegistryUsername}
              onChange={(e) => handleChange('schemaRegistryUsername', e.target.value)}
              placeholder="Leave empty if no auth required"
            />
          </div>

          <div className="form-group">
            <label htmlFor="schemaRegistryPassword">
              Registry Password (optional)
            </label>
            <input
              id="schemaRegistryPassword"
              type="password"
              value={config.schemaRegistryPassword}
              onChange={(e) => handleChange('schemaRegistryPassword', e.target.value)}
              placeholder="Leave empty if no auth required"
            />
          </div>
        </section>
      </div>

      {/* Action Buttons */}
      <div className="settings-actions">
        <button onClick={handleSave} className="btn-primary" disabled={saved}>
          {saved ? '✓ Saved' : '💾 Save Configuration'}
        </button>
        <button onClick={handleExport} className="btn-secondary">
          📥 Export to .env
        </button>
        <button onClick={handleReset} className="btn-danger">
          🔄 Reset to Defaults
        </button>
      </div>

      {status && (
        <div className={
          status.startsWith('✅') ? 'status success' : 
          status.startsWith('❌') ? 'status error' : 
          'status info'
        }>
          {status}
        </div>
      )}

      <div className="settings-note">
        <h4>⚠️ Important Notes</h4>
        <ul>
          <li><strong>Client-side only:</strong> These settings are saved in your browser's localStorage</li>
          <li><strong>Server restart required:</strong> To apply these settings to the API server, export to .env and restart</li>
          <li><strong>Security:</strong> Passwords are stored in browser storage - use environment variables for production</li>
          <li><strong>Testing:</strong> Use "Test Connection" in the Admin tab to verify settings</li>
        </ul>
      </div>
    </div>
  );
}

export default Settings;
