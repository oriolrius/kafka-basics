import React, { useState } from 'react';
import Producer from './components/Producer';
import Consumer from './components/Consumer';
import TopicInfo from './components/TopicInfo';
import MessageList from './components/MessageList';

function App() {
  const [activeTab, setActiveTab] = useState('producer');

  return (
    <div className="app">
      <header className="header">
        <h1>🚀 Kafka Basics - Web UI</h1>
        <p>Complete Kafka toolkit with producers, consumers, and admin tools</p>
      </header>

      <nav className="tabs">
        <button
          className={activeTab === 'producer' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('producer')}
        >
          📤 Producer
        </button>
        <button
          className={activeTab === 'consumer' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('consumer')}
        >
          📥 Consumer
        </button>
        <button
          className={activeTab === 'messages' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('messages')}
        >
          📋 Messages
        </button>
        <button
          className={activeTab === 'admin' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('admin')}
        >
          ⚙️ Admin
        </button>
      </nav>

      <main className="content">
        <div style={{ display: activeTab === 'producer' ? 'block' : 'none' }}>
          <Producer />
        </div>
        <div style={{ display: activeTab === 'consumer' ? 'block' : 'none' }}>
          <Consumer />
        </div>
        <div style={{ display: activeTab === 'messages' ? 'block' : 'none' }}>
          <MessageList />
        </div>
        <div style={{ display: activeTab === 'admin' ? 'block' : 'none' }}>
          <TopicInfo />
        </div>
      </main>

      <footer className="footer">
        <p>Kafka Basics v2.0.0 - Built with React</p>
      </footer>
    </div>
  );
}

export default App;
