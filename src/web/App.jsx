import React, { useState, useEffect } from 'react';
import Producer from './components/Producer';
import Consumer from './components/Consumer';
import TopicInfo from './components/TopicInfo';
import MessageList from './components/MessageList';
import Settings from './components/Settings';

function App() {
  const [activeTab, setActiveTab] = useState('producer');
  const [theme, setTheme] = useState(() => {
    // Get saved theme or default to dark
    return localStorage.getItem('kafka-theme') || 'dark';
  });
  
  // Shared topic state across all components
  const [sharedTopic, setSharedTopic] = useState(() => {
    // Get saved topic or default to 'test-topic'
    return localStorage.getItem('kafka-shared-topic') || 'test-topic';
  });

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('kafka-theme', theme);
  }, [theme]);

  // Save topic to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('kafka-shared-topic', sharedTopic);
  }, [sharedTopic]);

  const handleTopicChange = (newTopic) => {
    setSharedTopic(newTopic);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div>
            <h1><i className="fas fa-rocket"></i> Kafka Basics - Web UI</h1>
            <p>Complete Kafka toolkit with producers, consumers, and admin tools</p>
          </div>
          <button 
            className="theme-toggle" 
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <><i className="fas fa-sun"></i> Light</> : <><i className="fas fa-moon"></i> Dark</>}
          </button>
        </div>
      </header>

      <nav className="tabs">
        <button
          className={activeTab === 'producer' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('producer')}
        >
          <i className="fas fa-paper-plane"></i> Producer
        </button>
        <button
          className={activeTab === 'consumer' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('consumer')}
        >
          <i className="fas fa-inbox"></i> Consumer
        </button>
        <button
          className={activeTab === 'messages' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('messages')}
        >
          <i className="fas fa-clipboard-list"></i> Messages
        </button>
        <button
          className={activeTab === 'admin' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('admin')}
        >
          <i className="fas fa-info-circle"></i> Topic Info
        </button>
        <button
          className={activeTab === 'settings' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('settings')}
        >
          <i className="fas fa-wrench"></i> Settings
        </button>
      </nav>

      <main className="content">
        <div style={{ display: activeTab === 'producer' ? 'block' : 'none' }}>
          <Producer topic={sharedTopic} onTopicChange={handleTopicChange} />
        </div>
        <div style={{ display: activeTab === 'consumer' ? 'block' : 'none' }}>
          <Consumer topic={sharedTopic} onTopicChange={handleTopicChange} />
        </div>
        <div style={{ display: activeTab === 'messages' ? 'block' : 'none' }}>
          <MessageList topic={sharedTopic} onTopicChange={handleTopicChange} />
        </div>
        <div style={{ display: activeTab === 'admin' ? 'block' : 'none' }}>
          <TopicInfo topic={sharedTopic} onTopicChange={handleTopicChange} />
        </div>
        <div style={{ display: activeTab === 'settings' ? 'block' : 'none' }}>
          <Settings />
        </div>
      </main>

      <footer className="footer">
        <p>Kafka Basics v2.0.0 - Built with React</p>
      </footer>
    </div>
  );
}

export default App;
