/**
 * Normal Load Test (k6)
 * Simulates normal production load with 100 concurrent users
 *
 * Scenario:
 * - Duration: 30 minutes
 * - Ramp-up: 10 → 50 → 100 users (5 min)
 * - Steady state: 100 users (20 min)
 * - Ramp-down: 100 → 0 users (5 min)
 *
 * Acceptance Criteria:
 * - p95 latency < 500ms
 * - p99 latency < 1000ms
 * - Error rate < 1%
 * - Custom metric violations < 1%
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const duration = new Trend('request_duration');
const throughput = new Counter('requests');
const activeUsers = new Gauge('active_users');
const cacheHitRate = new Rate('cache_hits');

export const options = {
  stages: [
    { duration: '1m', target: 50 }, // Ramp up to 50 users
    { duration: '1m', target: 100 }, // Ramp up to 100 users
    { duration: '10m', target: 100 }, // Stay at 100 users (steady state)
    { duration: '1m', target: 50 }, // Ramp down to 50 users
    { duration: '1m', target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    errors: ['rate<0.01'],
    request_duration: ['p(95)<500', 'p(99)<1000'],
    cache_hits: ['rate>0.70'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  activeUsers.add(__VU);

  group('User Registration & Authentication', function () {
    const signupRes = http.post(`${BASE_URL}/api/auth/register`, {
      email: `user_${__VU}_${Date.now()}@example.com`,
      password: 'SecurePassword123!',
      name: `Test User ${__VU}`,
    });

    check(signupRes, {
      'signup status is 201': (r) => r.status === 201,
      'signup response time OK': (r) => r.timings.duration < 500,
    });

    duration.add(signupRes.timings.duration);
    throughput.add(1);
    errorRate.add(signupRes.status !== 201);

    sleep(1);

    // Login
    const loginRes = http.post(`${BASE_URL}/api/auth/login`, {
      email: `user_${__VU}_${Date.now()}@example.com`,
      password: 'SecurePassword123!',
    });

    check(loginRes, {
      'login status is 200': (r) => r.status === 200,
      'login returns token': (r) => r.json('token') !== null,
      'login response time OK': (r) => r.timings.duration < 300,
    });

    duration.add(loginRes.timings.duration);
    throughput.add(1);
    errorRate.add(loginRes.status !== 200);
  });

  const token = `Bearer token_${__VU}`;

  group('User Profile Operations', function () {
    // Get profile
    const profileRes = http.get(`${BASE_URL}/api/users/profile`, {
      headers: { Authorization: token },
    });

    check(profileRes, {
      'get profile status is 200': (r) => r.status === 200,
      'profile response time OK': (r) => r.timings.duration < 200,
    });

    const isCached = profileRes.headers['X-Cache'] === 'HIT';
    cacheHitRate.add(isCached);
    duration.add(profileRes.timings.duration);
    throughput.add(1);
    errorRate.add(profileRes.status !== 200);

    sleep(1);

    // Update profile
    const updateRes = http.put(
      `${BASE_URL}/api/users/profile`,
      {
        phone: `+1234567890${__VU}`,
        city: 'San Francisco',
        bio: 'Test user bio',
      },
      {
        headers: { Authorization: token },
      }
    );

    check(updateRes, {
      'update profile status is 200': (r) => r.status === 200,
      'update response time OK': (r) => r.timings.duration < 300,
    });

    duration.add(updateRes.timings.duration);
    throughput.add(1);
    errorRate.add(updateRes.status !== 200);
  });

  group('Ride Operations', function () {
    sleep(1);

    // Request a ride
    const rideRes = http.post(
      `${BASE_URL}/api/rides/request`,
      {
        pickupLocation: {
          latitude: 37.7749 + Math.random() * 0.1,
          longitude: -122.4194 + Math.random() * 0.1,
        },
        dropoffLocation: {
          latitude: 37.7849 + Math.random() * 0.1,
          longitude: -122.4294 + Math.random() * 0.1,
        },
        rideType: 'ECONOMY',
      },
      {
        headers: { Authorization: token },
      }
    );

    check(rideRes, {
      'ride request status is 201': (r) => r.status === 201,
      'ride has ID': (r) => r.json('rideId') !== null,
      'ride response time OK': (r) => r.timings.duration < 800,
    });

    duration.add(rideRes.timings.duration);
    throughput.add(1);
    errorRate.add(rideRes.status !== 201);

    const rideId = rideRes.json('rideId');

    sleep(2);

    // Get ride status
    const statusRes = http.get(`${BASE_URL}/api/rides/${rideId}`, {
      headers: { Authorization: token },
    });

    check(statusRes, {
      'get ride status is 200': (r) => r.status === 200,
      'ride status is valid': (r) =>
        ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(
          r.json('status')
        ),
      'status response time OK': (r) => r.timings.duration < 200,
    });

    const isCached = statusRes.headers['X-Cache'] === 'HIT';
    cacheHitRate.add(isCached);
    duration.add(statusRes.timings.duration);
    throughput.add(1);
    errorRate.add(statusRes.status !== 200);
  });

  group('Payment Operations', function () {
    sleep(1);

    // Process payment
    const paymentRes = http.post(
      `${BASE_URL}/api/payments/process`,
      {
        amount: 25.5,
        currency: 'USD',
        method: 'CREDIT_CARD',
        cardToken: 'tok_visa',
      },
      {
        headers: { Authorization: token },
      }
    );

    check(paymentRes, {
      'payment status is 200': (r) => r.status === 200,
      'payment successful': (r) => r.json('status') === 'SUCCESS',
      'payment response time OK': (r) => r.timings.duration < 1000,
    });

    duration.add(paymentRes.timings.duration);
    throughput.add(1);
    errorRate.add(paymentRes.status !== 200);

    sleep(1);

    // Get payment history
    const historyRes = http.get(`${BASE_URL}/api/payments/history`, {
      headers: { Authorization: token },
    });

    check(historyRes, {
      'history status is 200': (r) => r.status === 200,
      'history is array': (r) => Array.isArray(r.json()),
      'history response time OK': (r) => r.timings.duration < 300,
    });

    duration.add(historyRes.timings.duration);
    throughput.add(1);
    errorRate.add(historyRes.status !== 200);
  });

  group('Rating & Review Operations', function () {
    sleep(1);

    // Submit rating
    const ratingRes = http.post(
      `${BASE_URL}/api/ratings/submit`,
      {
        rideId: `ride_${__VU}`,
        rating: 5,
        comment: 'Great ride experience!',
      },
      {
        headers: { Authorization: token },
      }
    );

    check(ratingRes, {
      'rating status is 201': (r) => r.status === 201,
      'rating recorded': (r) => r.json('id') !== null,
      'rating response time OK': (r) => r.timings.duration < 300,
    });

    duration.add(ratingRes.timings.duration);
    throughput.add(1);
    errorRate.add(ratingRes.status !== 201);
  });

  sleep(1);
}

export function teardown(data) {
  console.log('✅ Normal Load Test Complete');
  console.log(`📊 Total Requests: ${throughput.value}`);
  console.log(`❌ Error Rate: ${errorRate.value.toFixed(2)}%`);
  console.log(`⏱️  Avg Response Time: ${duration.value.toFixed(0)}ms`);
}
