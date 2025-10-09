import React, { useState } from 'react';

function Producer() {
  const [message, setMessage] = useState('');
  const [key, setKey] = useState('');
  const [topic, setTopic] = useState('test-topic');
  const [format, setFormat] = useState('json');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('');

    try {
      const response = await fetch('/api/produce', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          key,
          message,
          format,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus(`✅ Message sent successfully! Offset: ${data.offset}`);
        setMessage('');
        setKey('');
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
    <div className="producer">
      <h2>📤 Kafka Producer</h2>
      <p>Send messages to Kafka topics</p>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="topic">Topic:</label>
          <input
            id="topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="test-topic"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="key">Key (optional):</label>
          <input
            id="key"
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="message-key"
          />
        </div>

        <div className="form-group">
          <label htmlFor="format">Format:</label>
          <select
            id="format"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
          >
            <option value="json">JSON</option>
            <option value="text">Text</option>
            <option value="avro">Avro</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="message">Message:</label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={format === 'json' ? '{"name": "example", "value": 123}' : 'Your message here'}
            rows="8"
            required
          />
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Sending...' : 'Send Message'}
        </button>
      </form>

      {status && (
        <div className={status.startsWith('✅') ? 'status success' : 'status error'}>
          {status}
        </div>
      )}
    </div>
  );
}

export default Producer;
