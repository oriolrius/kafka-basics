import React from 'react';
import packageJson from '../../../package.json';

function Overview() {
  return (
    <div className="overview-container">
      <div className="welcome-section">
        <h2><i className="fas fa-rocket"></i> Welcome to Kafka Basics</h2>
        <p className="subtitle">
          A modern, full-featured Kafka development toolkit with both Web UI and CLI tools
        </p>
        <div className="version-badge">
          <i className="fas fa-tag"></i> Version {packageJson.version}
        </div>
      </div>

      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon producer-color">
            <i className="fas fa-paper-plane"></i>
          </div>
          <h3>Producer</h3>
          <p>Send messages to Kafka topics with support for JSON, Text, or Avro formats. Features include:</p>
          <ul>
            <li>Multiple message formats (JSON/Text/Avro)</li>
            <li>Real-time message sending</li>
            <li>Format validation</li>
            <li>Custom headers support</li>
          </ul>
        </div>

        <div className="feature-card">
          <div className="feature-icon consumer-color">
            <i className="fas fa-inbox"></i>
          </div>
          <h3>Consumer</h3>
          <p>Real-time message streaming with intelligent features:</p>
          <ul>
            <li>Live message consumption</li>
            <li>Auto-scroll to latest messages</li>
            <li>Consumer group management</li>
            <li>Start/stop controls</li>
          </ul>
        </div>

        <div className="feature-card">
          <div className="feature-icon messages-color">
            <i className="fas fa-clipboard-list"></i>
          </div>
          <h3>Messages</h3>
          <p>Browse and inspect all messages in a topic:</p>
          <ul>
            <li>Paginated message browsing</li>
            <li>Message metadata display</li>
            <li>Timestamp information</li>
            <li>Partition and offset details</li>
          </ul>
        </div>

        <div className="feature-card">
          <div className="feature-icon admin-color">
            <i className="fas fa-info-circle"></i>
          </div>
          <h3>Topic Info</h3>
          <p>Comprehensive topic administration tools:</p>
          <ul>
            <li>Topic inspection and metadata</li>
            <li>Partition information</li>
            <li>Offset management</li>
            <li>Topic configuration details</li>
          </ul>
        </div>

        <div className="feature-card">
          <div className="feature-icon settings-color">
            <i className="fas fa-wrench"></i>
          </div>
          <h3>Settings</h3>
          <p>Configure all aspects of your Kafka connection:</p>
          <ul>
            <li>Broker configuration</li>
            <li>Security protocols (PLAINTEXT, SSL, SASL)</li>
            <li>Schema registry integration</li>
            <li>Export settings to .env file</li>
          </ul>
        </div>

        <div className="feature-card">
          <div className="feature-icon theme-color">
            <i className="fas fa-palette"></i>
          </div>
          <h3>Themes</h3>
          <p>Customizable interface for your preference:</p>
          <ul>
            <li>Dark theme (default)</li>
            <li>Light theme</li>
            <li>Persistent theme selection</li>
            <li>Easy theme toggle</li>
          </ul>
        </div>
      </div>

      <div className="getting-started">
        <h2><i className="fas fa-play-circle"></i> Getting Started</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>Configure Connection</h4>
              <p>Go to <strong>Settings</strong> to configure your Kafka broker connection and security settings.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>Choose Your Tool</h4>
              <p>Select a tab based on your needs: <strong>Producer</strong> to send messages, <strong>Consumer</strong> to receive them, or <strong>Messages</strong> to browse.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>Start Working</h4>
              <p>Use the intuitive interface to interact with your Kafka topics. All settings are automatically saved.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="additional-info">
        <div className="info-box">
          <h3><i className="fas fa-terminal"></i> CLI Tools Available</h3>
          <p>This toolkit also includes powerful CLI tools:</p>
          <div className="cli-commands">
            <code>kpub</code> - Send messages from terminal<br/>
            <code>ksub</code> - Consume messages from terminal<br/>
            <code>ktopic-info</code> - Get topic information<br/>
            <code>kafka-basics</code> - Show help and structure
          </div>
        </div>

        <div className="info-box">
          <h3><i className="fas fa-book"></i> Documentation</h3>
          <p>Need help? Check out the documentation:</p>
          <ul>
            <li><a href="https://github.com/oriolrius/kafka-basics" target="_blank" rel="noopener noreferrer">GitHub Repository</a></li>
            <li><a href="https://www.npmjs.com/package/@oriolrius/kafka-basics" target="_blank" rel="noopener noreferrer">NPM Package</a></li>
            <li><a href="https://github.com/oriolrius/kafka-basics/blob/main/README.md" target="_blank" rel="noopener noreferrer">README</a></li>
          </ul>
        </div>
      </div>

      <div className="quick-tips">
        <h3><i className="fas fa-lightbulb"></i> Quick Tips</h3>
        <div className="tips-grid">
          <div className="tip">
            <i className="fas fa-check-circle"></i>
            <span>All topic names are shared across tabs for seamless workflow</span>
          </div>
          <div className="tip">
            <i className="fas fa-check-circle"></i>
            <span>Settings are automatically saved to localStorage</span>
          </div>
          <div className="tip">
            <i className="fas fa-check-circle"></i>
            <span>Use the theme toggle in the header to switch between light/dark modes</span>
          </div>
          <div className="tip">
            <i className="fas fa-check-circle"></i>
            <span>Export your settings to a .env file for use with CLI tools</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Overview;
