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
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState(null);

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

  // Handle dynamic tooltip positioning to prevent overflow
  useEffect(() => {
    const handleTooltipPositioning = () => {
      const tooltips = document.querySelectorAll('.tooltip-icon');
      tooltips.forEach(tooltip => {
        const rect = tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        
        // Remove existing positioning classes
        tooltip.classList.remove('tooltip-positioned-left', 'tooltip-positioned-right');
        
        // If tooltip is near the right edge, position it to the left
        if (rect.right > viewportWidth - 150) {
          tooltip.classList.add('tooltip-positioned-right');
        }
        // If tooltip is near the left edge, position it to the right
        else if (rect.left < 150) {
          tooltip.classList.add('tooltip-positioned-left');
        }
      });
    };

    // Run on mount and when window resizes
    handleTooltipPositioning();
    window.addEventListener('resize', handleTooltipPositioning);
    
    // Also run when mouse enters any tooltip (for dynamic content)
    const tooltips = document.querySelectorAll('.tooltip-icon');
    tooltips.forEach(tooltip => {
      tooltip.addEventListener('mouseenter', handleTooltipPositioning);
    });

    return () => {
      window.removeEventListener('resize', handleTooltipPositioning);
      tooltips.forEach(tooltip => {
        tooltip.removeEventListener('mouseenter', handleTooltipPositioning);
      });
    };
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
      setStatus('<i class="fas fa-check-circle"></i> Configuration saved successfully! Restart the server to apply changes.');
      setSaved(true);
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => setStatus(''), 5000);
    } catch (error) {
      setStatus(`<i class="fas fa-times-circle"></i> Error saving configuration: ${error.message}`);
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
      setStatus('<i class="fas fa-info-circle"></i> Configuration reset to defaults');
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
    
    setStatus('<i class="fas fa-check-circle"></i> Configuration exported to .env file');
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResults(null);
    setStatus('');

    try {
      const response = await fetch('/api/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const results = await response.json();
      setTestResults(results);

      if (results.success) {
        setStatus('<i class="fas fa-check-circle"></i> Connection test passed! All systems are operational.');
      } else {
        setStatus('<i class="fas fa-times-circle"></i> Connection test failed. See details below.');
      }
    } catch (error) {
      setTestResults({
        success: false,
        error: {
          message: error.message,
          code: 'NETWORK_ERROR',
        },
        steps: [
          {
            step: 'API request',
            status: 'error',
            details: {
              error: error.message,
            },
            timestamp: new Date().toISOString(),
          },
        ],
      });
      setStatus('<i class="fas fa-times-circle"></i> Failed to connect to API server. Make sure it is running.');
    } finally {
      setTesting(false);
    }
  };

  const needsSasl = config.securityProtocol === 'SASL_PLAINTEXT' || config.securityProtocol === 'SASL_SSL';
  const needsSsl = config.securityProtocol === 'SSL' || config.securityProtocol === 'SASL_SSL';

  return (
    <div className="settings">
      <h2><i className="fas fa-wrench"></i> Connection Settings</h2>
      <p>Configure Kafka broker connection and authentication</p>

      <div className="settings-sections">
        {/* Broker Configuration */}
        <section className="settings-section">
          <h3><i className="fas fa-plug"></i> Broker Configuration</h3>

          <div className="form-group">
            <div className="field-label-wrapper">
              <label htmlFor="brokers">Broker(s)</label>
              <span className="tooltip-icon" data-tooltip="Comma-separated list (e.g., localhost:9092,broker2:9092)">
                <i className="fas fa-info-circle"></i>
              </span>
            </div>
            <input
              id="brokers"
              type="text"
              value={config.brokers}
              onChange={(e) => handleChange('brokers', e.target.value)}
              placeholder="localhost:9092"
            />
          </div>

          <div className="form-group">
            <div className="field-label-wrapper">
              <label htmlFor="clientId">Client ID</label>
              <span className="tooltip-icon" data-tooltip="Unique identifier for this client">
                <i className="fas fa-info-circle"></i>
              </span>
            </div>
            <input
              id="clientId"
              type="text"
              value={config.clientId}
              onChange={(e) => handleChange('clientId', e.target.value)}
              placeholder="kafka-web-ui"
            />
          </div>

          <div className="form-group">
            <div className="field-label-wrapper">
              <label htmlFor="securityProtocol">Security Protocol</label>
              <span className="tooltip-icon" data-tooltip="Communication security level">
                <i className="fas fa-info-circle"></i>
              </span>
            </div>
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
            <h3><i className="fas fa-lock"></i> SSL/TLS Configuration</h3>

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
                <span className="tooltip-icon" data-tooltip="Disable for self-signed certificates">
                  <i className="fas fa-info-circle"></i>
                </span>
              </label>
            </div>
          </section>
        )}

        {/* SASL Authentication */}
        {needsSasl && (
          <section className="settings-section">
            <h3><i className="fas fa-key"></i> SASL Authentication</h3>
            
            <div className="form-group">
              <div className="field-label-wrapper">
                <label htmlFor="saslMechanism">SASL Mechanism</label>
                <span className="tooltip-icon" data-tooltip="Authentication method">
                  <i className="fas fa-info-circle"></i>
                </span>
              </div>
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
          <h3><i className="fas fa-clipboard-list"></i> Schema Registry</h3>
          
          <div className="form-group">
            <div className="field-label-wrapper">
              <label htmlFor="schemaRegistryUrl">Schema Registry URL</label>
              <span className="tooltip-icon" data-tooltip="Confluent Schema Registry endpoint">
                <i className="fas fa-info-circle"></i>
              </span>
            </div>
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
              <span>Validate SSL certificates (strict mode)</span>
              <span className="tooltip-icon" data-tooltip="Uncheck to accept self-signed certificates">
                <i className="fas fa-info-circle"></i>
              </span>
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
        <button onClick={handleTestConnection} className="btn-test" disabled={testing}>
          {testing ? <><i className="fas fa-hourglass-half fa-spin"></i> Testing...</> : <><i className="fas fa-search"></i> Test Connection</>}
        </button>
        <button onClick={handleSave} className="btn-primary" disabled={saved}>
          {saved ? <><i className="fas fa-check"></i> Saved</> : <><i className="fas fa-save"></i> Save Configuration</>}
        </button>
        <button onClick={handleExport} className="btn-secondary">
          <i className="fas fa-download"></i> Export to .env
        </button>
        <button onClick={handleReset} className="btn-danger">
          <i className="fas fa-sync-alt"></i> Reset to Defaults
        </button>
      </div>

      {status && (
        <div className={
          status.includes('fa-check-circle') ? 'status success' :
          status.includes('fa-times-circle') ? 'status error' :
          'status info'
        }>
          <span dangerouslySetInnerHTML={{ __html: status }}></span>
        </div>
      )}

      {/* Connection Test Results */}
      {testResults && (
        <div className="test-results">
          <h3>Connection Test Results</h3>
          <div className="test-summary">
            <div className={`test-status ${testResults.success ? 'success' : 'failed'}`}>
              {testResults.success ? <><i className="fas fa-check-circle"></i> Success</> : <><i className="fas fa-times-circle"></i> Failed</>}
            </div>
            <div className="test-timestamp">
              Tested at: {new Date(testResults.timestamp).toLocaleString()}
            </div>
          </div>

          {testResults.error && (
            <div className="test-error">
              <h4>Error Details</h4>
              <div className="error-details">
                <div><strong>Message:</strong> {testResults.error.message}</div>
                <div><strong>Code:</strong> {testResults.error.code}</div>
                {testResults.error.stack && (
                  <details>
                    <summary>Stack Trace</summary>
                    <pre>{testResults.error.stack}</pre>
                  </details>
                )}
              </div>
            </div>
          )}

          <div className="test-steps">
            <h4>Test Execution Steps</h4>
            {testResults.steps.map((step, index) => (
              <div key={index} className={`test-step ${step.status}`}>
                <div className="step-header">
                  <span className="step-number">{index + 1}</span>
                  <span className="step-name">{step.step}</span>
                  <span className={`step-status status-${step.status}`}>
                    {step.status === 'success' && <i className="fas fa-check-circle"></i>}
                    {step.status === 'error' && <i className="fas fa-times-circle"></i>}
                    {step.status === 'warning' && <i className="fas fa-exclamation-triangle"></i>}
                  </span>
                </div>
                {step.details && (
                  <div className="step-details">
                    {Object.entries(step.details).map(([key, value]) => (
                      <div key={key} className="detail-item">
                        <strong>{key}:</strong>{' '}
                        {typeof value === 'object' ? (
                          <pre>{JSON.stringify(value, null, 2)}</pre>
                        ) : (
                          <span>{String(value)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="step-timestamp">
                  {new Date(step.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="settings-note">
        <h4><i className="fas fa-exclamation-triangle"></i> Important Notes</h4>
        <ul>
          <li><strong>Client-side only:</strong> These settings are saved in your browser's localStorage</li>
          <li><strong>Server restart required:</strong> To apply these settings to the API server, export to .env and restart</li>
          <li><strong>Security:</strong> Passwords are stored in browser storage - use environment variables for production</li>
          <li><strong>Testing:</strong> Use "Test Connection" button above to verify settings before saving</li>
        </ul>
      </div>
    </div>
  );
}

export default Settings;
