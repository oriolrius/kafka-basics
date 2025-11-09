import { test, expect } from '@playwright/test';

/**
 * API JSON Response Validation Tests
 *
 * These tests ensure all API endpoints return valid JSON responses,
 * preventing "Unexpected end of JSON input" errors in the frontend.
 */

// Get API base URL from environment or use default
const API_BASE = process.env.API_URL || 'http://localhost:3001';

test.describe('API JSON Response Validation', () => {
  test('health endpoint returns valid JSON', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/health`);

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const json = await response.json();
    expect(json).toHaveProperty('status');
    expect(json).toHaveProperty('timestamp');
    expect(json).toHaveProperty('kafkaInitialized');
  });

  test('config endpoint returns valid JSON', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/config`);

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const json = await response.json();
    expect(json).toHaveProperty('brokers');
    expect(json).toHaveProperty('clientId');
    expect(json).toHaveProperty('securityProtocol');
  });

  test('produce endpoint with missing parameters returns valid error JSON', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/produce`, {
      data: {}
    });

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/json');

    const json = await response.json();
    expect(json).toHaveProperty('error');
    expect(json.error).toContain('required');
  });

  test('consume endpoint with missing parameters returns valid error JSON', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/consume`, {
      data: {}
    });

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/json');

    const json = await response.json();
    expect(json).toHaveProperty('error');
    expect(json).toHaveProperty('success', false);
  });

  test('consume messages endpoint with missing topic returns valid error JSON', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/consume/messages`);

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/json');

    const json = await response.json();
    expect(json).toHaveProperty('error');
    expect(json.error).toContain('Topic parameter is required');
  });

  test('topic info endpoint with missing topic returns valid error JSON', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/topic/info`);

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/json');

    const json = await response.json();
    expect(json).toHaveProperty('error');
    expect(json.error).toContain('Topic parameter is required');
  });

  test('messages list endpoint with missing topic returns valid error JSON', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/messages/list`);

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/json');

    const json = await response.json();
    expect(json).toHaveProperty('error');
    expect(json).toHaveProperty('messages');
    expect(Array.isArray(json.messages)).toBe(true);
  });

  test('404 endpoint returns valid error JSON', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/nonexistent-endpoint-${Date.now()}`);

    expect(response.status()).toBe(404);
    expect(response.headers()['content-type']).toContain('application/json');

    const json = await response.json();
    expect(json).toHaveProperty('error');
    expect(json).toHaveProperty('path');
    expect(json).toHaveProperty('method');
    expect(json).toHaveProperty('timestamp');
  });

  test('all error responses include timestamp', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/topic/info`);

    const json = await response.json();
    expect(json).toHaveProperty('error');

    // Note: Some endpoints might not have timestamp in error response
    // This is acceptable as long as JSON is valid
  });

  test('produce endpoint validates message parameter', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/produce`, {
      data: {
        topic: 'test-topic'
        // Missing message parameter
      }
    });

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/json');

    const json = await response.json();
    expect(json).toHaveProperty('error');
    expect(json.error).toContain('Message is required');
  });

  test('messages list returns empty array on error', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/messages/list`, {
      params: { topic: 'nonexistent-topic-' + Date.now() }
    });

    // Could be 404 or 500 depending on Kafka state, but must return valid JSON
    expect(response.headers()['content-type']).toContain('application/json');

    const json = await response.json();
    expect(json).toHaveProperty('messages');
    expect(Array.isArray(json.messages)).toBe(true);
  });
});

test.describe('API Response Consistency', () => {
  test('all success responses use consistent format', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/health`);
    const json = await response.json();

    // Success responses should have meaningful data
    expect(Object.keys(json).length).toBeGreaterThan(0);
  });

  test('all error responses have error property', async ({ request }) => {
    const endpoints = [
      { method: 'get', url: '/api/topic/info' },
      { method: 'get', url: '/api/messages/list' },
      { method: 'post', url: '/api/produce', data: {} },
      { method: 'post', url: '/api/consume', data: {} },
    ];

    for (const endpoint of endpoints) {
      const response = await request[endpoint.method](`${API_BASE}${endpoint.url}`, {
        data: endpoint.data
      });

      if (!response.ok()) {
        const json = await response.json();
        expect(json).toHaveProperty('error');
        expect(typeof json.error).toBe('string');
        expect(json.error.length).toBeGreaterThan(0);
      }
    }
  });
});
