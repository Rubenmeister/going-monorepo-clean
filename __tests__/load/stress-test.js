/**
 * Stress Test (k6)
 * Pushes the system to breaking point with 1000 concurrent users
 *
 * Scenario:
 * - Duration: 60 minutes
 * - Ramp-up: 10 → 500 → 1000 users (10 min)
 * - Steady state: 1000 users (40 min)
 * - Ramp-down: 1000 → 0 users (10 min)
 *
 * Acceptance Criteria:
 * - System remains stable
 * - No cascading failures
 * - Error rate < 10%
 * - Identify breaking point
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

const errorRate = new Rate('errors');
const duration = new Trend('request_duration');
const throughput = new Counter('requests');
const activeUsers = new Gauge('active_users');
const slowRequests = new Counter('slow_requests');

export const options = {
  stages: [
    { duration: '2m', target: 250 }, // Ramp up to 250 users
    { duration: '2m', target: 500 }, // Ramp up to 500 users
    { duration: '2m', target: 750 }, // Ramp up to 750 users
    { duration: '2m', target: 1000 }, // Ramp up to 1000 users
    { duration: '20m', target: 1000 }, // Stay at 1000 users (steady state)
    { duration: '2m', target: 500 }, // Ramp down
    { duration: '2m', target: 250 }, // Ramp down
    { duration: '2m', target: 0 }, // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
    errors: ['rate<0.10'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  activeUsers.add(__VU);

  group('Heavy Ride Operations', function () {
    // Concurrent ride requests
    for (let i = 0; i < 3; i++) {
      const rideRes = http.post(`${BASE_URL}/api/rides/request`, {
        pickupLocation: {
          latitude: 37.7749 + Math.random() * 0.2,
          longitude: -122.4194 + Math.random() * 0.2,
        },
        dropoffLocation: {
          latitude: 37.7849 + Math.random() * 0.2,
          longitude: -122.4294 + Math.random() * 0.2,
        },
        rideType: 'ECONOMY',
      });

      check(rideRes, {
        'ride request successful': (r) => r.status < 500,
      });

      if (rideRes.timings.duration > 1000) {
        slowRequests.add(1);
      }

      duration.add(rideRes.timings.duration);
      throughput.add(1);
      errorRate.add(rideRes.status >= 500);
    }
  });

  group('Heavy Payment Operations', function () {
    // Concurrent payment requests
    for (let i = 0; i < 2; i++) {
      const paymentRes = http.post(`${BASE_URL}/api/payments/process`, {
        amount: Math.random() * 100,
        currency: 'USD',
        method: 'CREDIT_CARD',
        cardToken: 'tok_visa',
      });

      check(paymentRes, {
        'payment request successful': (r) => r.status < 500,
      });

      if (paymentRes.timings.duration > 1500) {
        slowRequests.add(1);
      }

      duration.add(paymentRes.timings.duration);
      throughput.add(1);
      errorRate.add(paymentRes.status >= 500);
    }
  });

  group('Heavy Database Queries', function () {
    // Multiple concurrent profile fetches
    for (let i = 0; i < 5; i++) {
      const profileRes = http.get(`${BASE_URL}/api/users/profile`);

      check(profileRes, {
        'profile fetch successful': (r) => r.status < 500,
      });

      duration.add(profileRes.timings.duration);
      throughput.add(1);
      errorRate.add(profileRes.status >= 500);
    }
  });

  sleep(Math.random() * 2);
}

export function teardown(data) {
  console.log('⚠️  Stress Test Complete');
  console.log(`📊 Total Requests: ${throughput.value}`);
  console.log(`❌ Error Rate: ${errorRate.value.toFixed(2)}%`);
  console.log(`⏱️  Avg Response Time: ${duration.value.toFixed(0)}ms`);
  console.log(`🐢 Slow Requests (>1s): ${slowRequests.value}`);
}
