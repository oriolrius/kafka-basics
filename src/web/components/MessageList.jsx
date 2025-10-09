import React, { useState } from 'react';

function MessageList() {
  const [topic, setTopic] = useState('test-topic');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const fetchMessages = async () => {
    setLoading(true);
    setStatus('');
    setMessages([]);

    try {
      const response = await fetch(`/api/messages/list?topic=${topic}`);
      const data = await response.json();

      if (response.ok) {
        setMessages(data.messages || []);
        setStatus(`✅ Loaded ${data.messages?.length || 0} messages`);
      } else {
        setStatus(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="message-list">
      <h2>📋 Message List</h2>
      <p>View all messages in a Kafka topic</p>

      <div className="form">
        <div className="form-group">
          <label htmlFor="list-topic">Topic Name:</label>
          <input
            id="list-topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="test-topic"
          />
        </div>

        <button
          onClick={fetchMessages}
          className="btn-primary"
          disabled={loading}
        >
          {loading ? 'Loading...' : '📥 Load Messages'}
        </button>
      </div>

      {status && (
        <div className={status.startsWith('✅') ? 'status success' : 'status error'}>
          {status}
        </div>
      )}

      <div className="messages-container">
        <h3>Messages ({messages.length})</h3>
        <div className="messages-list">
          {messages.length === 0 ? (
            <p className="no-messages">No messages to display. Click "Load Messages" to fetch.</p>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className="message-item">
                <div className="message-header">
                  <span className="message-partition">Partition: {msg.partition}</span>
                  <span className="message-offset">Offset: {msg.offset}</span>
                  {msg.key && <span className="message-key">Key: {msg.key}</span>}
                  {msg.timestamp && (
                    <span className="message-time">
                      {new Date(Number(msg.timestamp)).toLocaleString()}
                    </span>
                  )}
                </div>
                <pre className="message-value">{JSON.stringify(msg.value, null, 2)}</pre>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default MessageList;
