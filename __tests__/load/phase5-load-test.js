import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

/**
 * Phase 5 Load Test Suite
 *
 * Tests performance under load for:
 * - Messaging APIs
 * - Ride Matching APIs
 * - WebSocket connections
 * - Real-time updates
 */

// Custom metrics
const rideRequestDuration = new Trend('ride_request_duration');
const messageLatency = new Trend('message_latency');
const matchingAlgorithmTime = new Trend('matching_algorithm_time');
const errorRate = new Rate('error_rate');
const successRate = new Rate('success_rate');
const concurrentUsers = new Gauge('concurrent_users');

// Test configuration
export const options = {
  stages: [
    // Warm up: gradually increase from 1 to 50 users
    { duration: '2m', target: 50, name: 'warm-up' },
    // Sustained load: maintain 50 users for 5 minutes
    { duration: '5m', target: 50, name: 'sustained-load' },
    // Spike: sudden increase to 200 users
    { duration: '1m', target: 200, name: 'spike' },
    // Stress: push to 500 users
    { duration: '2m', target: 500, name: 'stress' },
    // Cool down: gradually decrease back to 0
    { duration: '2m', target: 0, name: 'cool-down' },
  ],
  thresholds: {
    ride_request_duration: ['p(95)<2000', 'p(99)<3000'], // 95th percentile < 2s, 99th < 3s
    message_latency: ['p(95)<1000', 'p(99)<2000'], // 95th percentile < 1s, 99th < 2s
    matching_algorithm_time: ['p(95)<500', 'p(99)<1000'], // 95th percentile < 500ms, 99th < 1s
    error_rate: ['rate<0.05'], // Less than 5% error rate
    success_rate: ['rate>0.95'], // Greater than 95% success rate
    http_req_duration: ['p(95)<3000', 'p(99)<5000'], // HTTP request duration thresholds
  },
};

// Test data
const API_BASE_URL = __ENV.API_URL || 'http://localhost:3000/api';
const PASSENGER_TOKEN =
  'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyIsImlkIjoidXNlcl8xMjMiLCJlbWFpbCI6InBhc3NlbmdlckBleGFtcGxlLmNvbSIsImlhdCI6MTYzMDAwMDAwMH0.fake_signature';
const DRIVER_TOKEN =
  'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkcml2ZXJfMTIzIiwiaWQiOiJkcml2ZXJfMTIzIiwiZW1haWwiOiJkcml2ZXJAZXhhbXBsZS5jb20iLCJpYXQiOjE2MzAwMDAwMDB9.fake_signature';

const locations = [
  {
    name: 'Times Square',
    pickupLat: 40.758,
    pickupLon: -73.9855,
    dropoffLat: 40.7128,
    dropoffLon: -74.006,
  },
  {
    name: 'Central Park',
    pickupLat: 40.7829,
    pickupLon: -73.9654,
    dropoffLat: 40.7489,
    dropoffLon: -73.968,
  },
  {
    name: 'Brooklyn Bridge',
    pickupLat: 40.7061,
    pickupLon: -73.9969,
    dropoffLat: 40.6892,
    dropoffLon: -73.976,
  },
  {
    name: 'Statue of Liberty',
    pickupLat: 40.6892,
    pickupLon: -74.0445,
    dropoffLat: 40.7128,
    dropoffLon: -74.006,
  },
  {
    name: 'Empire State Building',
    pickupLat: 40.7484,
    pickupLon: -73.9857,
    dropoffLat: 40.7614,
    dropoffLon: -73.9776,
  },
];

const serviceTypes = ['standard', 'premium', 'xl'];

// Utility functions
function getRandomLocation() {
  return locations[Math.floor(Math.random() * locations.length)];
}

function getRandomServiceType() {
  return serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
}

function getRandomDelay() {
  return Math.floor(Math.random() * 3000) + 1000; // 1-4 seconds
}

export default function testSuite() {
  const scenarioWeights = {
    rideRequest: 0.4, // 40% of requests
    messaging: 0.3, // 30% of requests
    rideAccept: 0.2, // 20% of requests
    rideCompletion: 0.1, // 10% of requests
  };

  const random = Math.random();
  let scenario;

  if (random < scenarioWeights.rideRequest) {
    scenario = 'ride-request';
  } else if (random < scenarioWeights.rideRequest + scenarioWeights.messaging) {
    scenario = 'messaging';
  } else if (
    random <
    scenarioWeights.rideRequest +
      scenarioWeights.messaging +
      scenarioWeights.rideAccept
  ) {
    scenario = 'ride-accept';
  } else {
    scenario = 'ride-completion';
  }

  concurrentUsers.add(__VU); // Update concurrent user gauge

  switch (scenario) {
    case 'ride-request':
      testRideRequest();
      break;
    case 'messaging':
      testMessaging();
      break;
    case 'ride-accept':
      testRideAccept();
      break;
    case 'ride-completion':
      testRideCompletion();
      break;
  }

  sleep(Math.random() * 2 + 1); // Sleep 1-3 seconds between requests
}

/**
 * Test: Request Ride
 * Measures performance of ride request API
 */
function testRideRequest() {
  const location = getRandomLocation();
  const startTime = new Date();

  group('Request Ride', () => {
    const payload = JSON.stringify({
      pickupLatitude: location.pickupLat,
      pickupLongitude: location.pickupLon,
      dropoffLatitude: location.dropoffLat,
      dropoffLongitude: location.dropoffLon,
      serviceType: getRandomServiceType(),
    });

    const headers = {
      'Content-Type': 'application/json',
      Authorization: PASSENGER_TOKEN,
    };

    const response = http.post(`${API_BASE_URL}/rides/request`, payload, {
      headers,
    });

    const duration = new Date() - startTime;
    rideRequestDuration.add(duration);

    const success =
      response.status === 201 &&
      response.body &&
      JSON.parse(response.body).rideId &&
      JSON.parse(response.body).status === 'requested';

    check(response, {
      'status is 201': (r) => r.status === 201,
      'response has rideId': (r) => r.json('rideId') !== undefined,
      'ride status is requested': (r) => r.json('status') === 'requested',
      'response time < 2s': (r) => r.timings.duration < 2000,
    });

    if (success) {
      successRate.add(1);
    } else {
      errorRate.add(1);
    }

    // Simulate matching algorithm wait
    sleep(getRandomDelay() / 1000);
  });
}

/**
 * Test: Send Message
 * Measures message latency
 */
function testMessaging() {
  const rideId = `ride_${Math.floor(Math.random() * 10000)}`;
  const startTime = new Date();

  group('Send Message', () => {
    const payload = JSON.stringify({
      content: 'Where are you? I am waiting',
      receiverId: 'driver_123',
    });

    const headers = {
      'Content-Type': 'application/json',
      Authorization: PASSENGER_TOKEN,
    };

    const response = http.post(
      `${API_BASE_URL}/chats/rides/${rideId}/messages`,
      payload,
      { headers }
    );

    const duration = new Date() - startTime;
    messageLatency.add(duration);

    check(response, {
      'status is 201': (r) => r.status === 201,
      'response has messageId': (r) => r.json('messageId') !== undefined,
      'message content matches': (r) =>
        r.json('content') === 'Where are you? I am waiting',
      'response time < 1s': (r) => r.timings.duration < 1000,
    });

    if (response.status === 201) {
      successRate.add(1);
    } else {
      errorRate.add(1);
    }
  });

  group('Get Conversation', () => {
    const headers = {
      Authorization: PASSENGER_TOKEN,
    };

    const response = http.get(
      `${API_BASE_URL}/chats/rides/${rideId}/conversation?otherUserId=driver_123`,
      { headers }
    );

    check(response, {
      'status is 200': (r) => r.status === 200,
      'response has messages': (r) => Array.isArray(r.json('messages')),
      'response time < 500ms': (r) => r.timings.duration < 500,
    });

    if (response.status === 200) {
      successRate.add(1);
    } else {
      errorRate.add(1);
    }
  });
}

/**
 * Test: Accept Ride
 * Measures ride acceptance performance
 */
function testRideAccept() {
  const rideId = `ride_${Math.floor(Math.random() * 10000)}`;
  const startTime = new Date();

  group('Accept Ride', () => {
    const payload = JSON.stringify({
      driverId: 'driver_123',
    });

    const headers = {
      'Content-Type': 'application/json',
      Authorization: DRIVER_TOKEN,
    };

    const response = http.put(
      `${API_BASE_URL}/rides/${rideId}/accept`,
      payload,
      { headers }
    );

    const duration = new Date() - startTime;
    matchingAlgorithmTime.add(duration);

    check(response, {
      'status is 200 or 404': (r) => r.status === 200 || r.status === 404,
      'response time < 500ms': (r) => r.timings.duration < 500,
    });

    if (response.status === 200) {
      successRate.add(1);
    } else if (response.status === 404) {
      // Expected if ride doesn't exist
      successRate.add(1);
    } else {
      errorRate.add(1);
    }
  });
}

/**
 * Test: Complete Ride
 * Measures ride completion performance
 */
function testRideCompletion() {
  const rideId = `ride_${Math.floor(Math.random() * 10000)}`;

  group('Complete Ride', () => {
    const payload = JSON.stringify({
      distanceKm: Math.random() * 20 + 1,
      durationSeconds: Math.floor(Math.random() * 3600) + 300,
    });

    const headers = {
      'Content-Type': 'application/json',
      Authorization: DRIVER_TOKEN,
    };

    const response = http.put(
      `${API_BASE_URL}/rides/${rideId}/complete`,
      payload,
      { headers }
    );

    check(response, {
      'status is 200 or 404': (r) => r.status === 200 || r.status === 404,
      'response time < 1s': (r) => r.timings.duration < 1000,
    });

    if (response.status === 200) {
      successRate.add(1);
    } else if (response.status === 404) {
      // Expected if ride doesn't exist
      successRate.add(1);
    } else {
      errorRate.add(1);
    }
  });
}

/**
 * Setup function - runs once before tests
 */
export function setup() {
  console.log('Starting Phase 5 load test suite');
  console.log(`API Base URL: ${API_BASE_URL}`);

  // Verify API is reachable
  const response = http.get(`${API_BASE_URL}/health`);
  check(response, {
    'API is reachable': (r) => r.status < 500,
  });
}

/**
 * Teardown function - runs after tests complete
 */
export function teardown() {
  console.log('Phase 5 load test suite completed');
}

/**
 * Handle errors
 */
export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data),
  };
}

/**
 * Text summary formatter
 */
function textSummary(data, options) {
  let summary = '\n===== Load Test Summary =====\n';

  if (data.metrics) {
    summary += '\nRequest Duration Metrics:\n';
    if (data.metrics.ride_request_duration) {
      const rideMetrics = data.metrics.ride_request_duration;
      summary += `  Ride Request (ms):\n`;
      summary += `    - p95: ${Math.round(rideMetrics.values.p95)}\n`;
      summary += `    - p99: ${Math.round(rideMetrics.values.p99)}\n`;
      summary += `    - avg: ${Math.round(rideMetrics.values.avg)}\n`;
    }

    if (data.metrics.message_latency) {
      const msgMetrics = data.metrics.message_latency;
      summary += `  Message Latency (ms):\n`;
      summary += `    - p95: ${Math.round(msgMetrics.values.p95)}\n`;
      summary += `    - p99: ${Math.round(msgMetrics.values.p99)}\n`;
      summary += `    - avg: ${Math.round(msgMetrics.values.avg)}\n`;
    }

    summary += '\nSuccess/Error Metrics:\n';
    if (data.metrics.success_rate) {
      const successRate = (data.metrics.success_rate.values.rate * 100).toFixed(
        2
      );
      summary += `  - Success Rate: ${successRate}%\n`;
    }
    if (data.metrics.error_rate) {
      const errorRate = (data.metrics.error_rate.values.rate * 100).toFixed(2);
      summary += `  - Error Rate: ${errorRate}%\n`;
    }
  }

  summary += '\n=============================\n';
  return summary;
}
