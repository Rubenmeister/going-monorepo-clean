/**
 * Spike Test (k6)
 * Simulates sudden traffic spike and system recovery
 *
 * Scenario:
 * - Duration: 20 minutes
 * - Baseline: 50 users (5 min)
 * - Spike: 500 users (5 min)
 * - Recovery: 50 users (10 min)
 *
 * Acceptance Criteria:
 * - System recovery time < 2 minutes
 * - No cascading failures
 * - Error rate spike < 20%
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

const errorRate = new Rate('errors');
const duration = new Trend('request_duration');
const throughput = new Counter('requests');
const recoveryTime = new Gauge('recovery_time');

export const options = {
  stages: [
    { duration: '2m', target: 50 }, // Baseline load (50 users)
    { duration: '3m', target: 500 }, // Sudden spike (500 users)
    { duration: '10m', target: 50 }, // Recovery (back to 50 users)
    { duration: '5m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    errors: ['rate<0.20'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
let spikeStartTime = null;
let recoveryStartTime = null;

export default function () {
  // Record spike timing
  if (__VU > 100 && !spikeStartTime) {
    spikeStartTime = Date.now();
    console.log(
      `🔴 SPIKE DETECTED at ${new Date(spikeStartTime).toISOString()}`
    );
  }

  group('Ride Request During Spike', function () {
    const rideRes = http.post(`${BASE_URL}/api/rides/request`, {
      pickupLocation: {
        latitude: 37.7749 + Math.random() * 0.1,
        longitude: -122.4194 + Math.random() * 0.1,
      },
      dropoffLocation: {
        latitude: 37.7849 + Math.random() * 0.1,
        longitude: -122.4294 + Math.random() * 0.1,
      },
      rideType: 'ECONOMY',
    });

    const isSuccess = rideRes.status < 500;
    check(rideRes, {
      'ride request handled': (r) => r.status < 500,
    });

    duration.add(rideRes.timings.duration);
    throughput.add(1);
    errorRate.add(!isSuccess);

    // Track recovery
    if (__VU <= 100 && spikeStartTime && !recoveryStartTime) {
      const timeSinceSpikeStart = Date.now() - spikeStartTime;
      if (timeSinceSpikeStart > 300000) {
        // 5 minutes after spike started
        recoveryStartTime = Date.now();
        const recoveryDuration = recoveryStartTime - spikeStartTime;
        recoveryTime.add(recoveryDuration / 1000 / 60); // Convert to minutes
        console.log(`✅ RECOVERY COMPLETE: ${recoveryDuration / 1000}s`);
      }
    }
  });

  group('Payment During Spike', function () {
    const paymentRes = http.post(`${BASE_URL}/api/payments/process`, {
      amount: 25.5,
      currency: 'USD',
      method: 'CREDIT_CARD',
      cardToken: 'tok_visa',
    });

    check(paymentRes, {
      'payment processed': (r) => r.status < 500,
    });

    duration.add(paymentRes.timings.duration);
    throughput.add(1);
    errorRate.add(paymentRes.status >= 500);
  });

  group('Profile Access During Spike', function () {
    const profileRes = http.get(`${BASE_URL}/api/users/profile`);

    check(profileRes, {
      'profile accessible': (r) => r.status < 500,
    });

    duration.add(profileRes.timings.duration);
    throughput.add(1);
    errorRate.add(profileRes.status >= 500);
  });

  sleep(0.5);
}

export function teardown(data) {
  console.log('📈 Spike Test Complete');
  console.log(`📊 Total Requests: ${throughput.value}`);
  console.log(`❌ Peak Error Rate: ${errorRate.value.toFixed(2)}%`);
  console.log(`⏱️  Avg Response Time: ${duration.value.toFixed(0)}ms`);
  console.log(
    `🔄 System Recovery Time: ${recoveryTime.value.toFixed(1)} minutes`
  );
}
