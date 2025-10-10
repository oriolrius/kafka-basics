import React, { useState } from 'react';

function TopicInfo({ topic, onTopicChange }) {
  const [topicData, setTopicData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const fetchTopicInfo = async () => {
    setLoading(true);
    setStatus('');
    setTopicData(null);

    try {
      const response = await fetch(`/api/topic/info?topic=${topic}`);
      const data = await response.json();

      if (response.ok) {
        setTopicData(data);
        setStatus('<i class="fas fa-check-circle"></i> Topic information loaded');
      } else {
        setStatus(`<i class="fas fa-times-circle"></i> Error: ${data.error}`);
      }
    } catch (error) {
      setStatus(`<i class="fas fa-times-circle"></i> Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteTopic = async () => {
    if (!window.confirm(`Are you sure you want to delete topic "${topic}"? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    setStatus('');

    try {
      const response = await fetch('/api/topic/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus(`<i class="fas fa-check-circle"></i> Topic "${topic}" deleted successfully`);
        setTopicData(null);
      } else {
        setStatus(`<i class="fas fa-times-circle"></i> Error: ${data.error}`);
      }
    } catch (error) {
      setStatus(`<i class="fas fa-times-circle"></i> Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="topic-info">
      <h2><i className="fas fa-info-circle"></i> Topic Information</h2>
      <p>View and manage Kafka topics</p>

      <div className="form">
        <div className="form-group">
          <label htmlFor="admin-topic">Topic Name:</label>
          <input
            id="admin-topic"
            type="text"
            value={topic}
            onChange={(e) => onTopicChange(e.target.value)}
            placeholder="test-topic"
          />
        </div>

        <div className="button-group">
          <button
            onClick={fetchTopicInfo}
            className="btn-primary"
            disabled={loading}
          >
            {loading ? <><i className="fas fa-spinner fa-spin"></i> Loading...</> : <><i className="fas fa-chart-bar"></i> Get Topic Info</>}
          </button>
          <button
            onClick={deleteTopic}
            className="btn-danger"
            disabled={loading}
          >
            <i className="fas fa-trash"></i> Delete Topic
          </button>
        </div>
      </div>

      {status && (
        <div className={status.includes('fa-check-circle') ? 'status success' : 'status error'}>
          <span dangerouslySetInnerHTML={{ __html: status }}></span>
        </div>
      )}

      {topicData && (
        <div className="topic-details">
          <h3>Topic: {topicData.name}</h3>
          
          <div className="detail-section">
            <h4>Partitions ({topicData.partitions?.length || 0})</h4>
            {topicData.partitions?.map((partition) => (
              <div key={partition.partitionId} className="partition-item">
                <p><strong>Partition {partition.partitionId}</strong></p>
                <p>High Watermark: {partition.high}</p>
                <p>Low Watermark: {partition.low}</p>
                <p>Leader: {partition.leader}</p>
                <p>Replicas: {partition.replicas?.join(', ')}</p>
                <p>ISR: {partition.isr?.join(', ')}</p>
              </div>
            ))}
          </div>

          {topicData.config && (
            <div className="detail-section">
              <h4>Configuration</h4>
              <pre>{JSON.stringify(topicData.config, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TopicInfo;
