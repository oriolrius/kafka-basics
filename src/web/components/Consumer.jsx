import React, { useState, useEffect, useRef } from 'react';

function Consumer({ topic, onTopicChange }) {
  const [format, setFormat] = useState('universal');
  const [messages, setMessages] = useState([]);
  const [isConsuming, setIsConsuming] = useState(false);
  const [status, setStatus] = useState('');
  const messagesEndRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Polling effect - runs when isConsuming changes
  useEffect(() => {
    if (!isConsuming) {
      // Stop polling when not consuming
      if (pollingIntervalRef.current) {
        console.log('⏹️ Stopping message polling');
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    // Start polling for messages
    console.log('🔄 Starting message polling for topic:', topic);
    
    const pollMessages = async () => {
      try {
        console.log('📡 Polling for messages...');
        const res = await fetch(`/api/consume/messages?topic=${topic}`);
        const data = await res.json();
        
        console.log('📬 Poll result:', data);
        
        if (data.messages && data.messages.length > 0) {
          console.log('📨 Received', data.messages.length, 'new messages');
          setMessages((prev) => {
            const updated = [...prev, ...data.messages];
            console.log('Total messages in UI:', updated.length);
            return updated;
          });
        }
      } catch (error) {
        console.error('❌ Error polling messages:', error);
      }
    };
    
    // Poll immediately
    pollMessages();
    
    // Then poll every second
    pollingIntervalRef.current = setInterval(pollMessages, 1000);

    // Cleanup on unmount or when isConsuming changes
    return () => {
      if (pollingIntervalRef.current) {
        console.log('⏹️ Stopping message polling (cleanup)');
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isConsuming, topic]);

  const startConsuming = async () => {
    setStatus('<i class="fas fa-sync-alt fa-spin"></i> Starting consumer...');
    setMessages([]);

    try {
      const response = await fetch('/api/consume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          format,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Consumer started:', data);
        setIsConsuming(true);
        setStatus('<i class="fas fa-check-circle"></i> Consumer started. Listening for messages...');
      } else {
        const data = await response.json();
        setStatus(`<i class="fas fa-times-circle"></i> Error: ${data.error}`);
      }
    } catch (error) {
      setStatus(`<i class="fas fa-times-circle"></i> Error: ${error.message}`);
    }
  };

  const stopConsuming = async () => {
    try {
      console.log('⏹️ Stopping consumer for topic:', topic);
      await fetch('/api/consume/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic }),
      });
      setIsConsuming(false);
      setStatus('<i class="fas fa-stop"></i> Consumer stopped');
    } catch (error) {
      setStatus(`<i class="fas fa-times-circle"></i> Error stopping consumer: ${error.message}`);
    }
  };

  return (
    <div className="consumer">
      <h2><i className="fas fa-inbox"></i> Kafka Consumer</h2>
      <p>Consume messages from Kafka topics in real-time</p>

      <div className="form">
        <div className="form-group">
          <label htmlFor="consumer-topic">Topic:</label>
          <input
            id="consumer-topic"
            type="text"
            value={topic}
            onChange={(e) => onTopicChange(e.target.value)}
            placeholder="test-topic"
            disabled={isConsuming}
          />
        </div>

        <div className="form-group">
          <label htmlFor="consumer-format">Format:</label>
          <select
            id="consumer-format"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            disabled={isConsuming}
          >
            <option value="universal">Universal (Auto-detect)</option>
            <option value="json">JSON</option>
            <option value="text">Text</option>
            <option value="avro">Avro</option>
          </select>
        </div>

        <div className="button-group">
          {!isConsuming ? (
            <button onClick={startConsuming} className="btn-primary">
              <i className="fas fa-play"></i> Start Consumer
            </button>
          ) : (
            <button onClick={stopConsuming} className="btn-danger">
              <i className="fas fa-stop"></i> Stop Consumer
            </button>
          )}
          <button
            onClick={() => setMessages([])}
            className="btn-secondary"
            disabled={messages.length === 0}
          >
            <i className="fas fa-trash"></i> Clear Messages
          </button>
        </div>
      </div>

      {status && (
        <div className={status.includes('fa-check-circle') ? 'status success' : 'status info'}>
          <span dangerouslySetInnerHTML={{ __html: status }}></span>
        </div>
      )}

      <div className="messages-container">
        <h3>Received Messages ({messages.length})</h3>
        <div className="messages-list">
          {messages.length === 0 ? (
            <p className="no-messages">No messages received yet...</p>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className="message-item">
                <div className="message-header">
                  <span className="message-time">
                    {msg.timestamp ? new Date(Number(msg.timestamp)).toLocaleString() : 'No timestamp'}
                  </span>
                  <span className="message-offset">Offset: {msg.offset}</span>
                  {msg.key && <span className="message-key">Key: {msg.key}</span>}
                </div>
                <pre className="message-value">{JSON.stringify(msg.value, null, 2)}</pre>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}

export default Consumer;
