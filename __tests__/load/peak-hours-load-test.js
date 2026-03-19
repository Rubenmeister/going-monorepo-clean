import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics for peak hour testing
const peakHourErrorRate = new Rate('peak_errors');
const paymentConcurrencyDuration = new Trend('payment_concurrent_duration');
const concurrentRidesCounter = new Counter('concurrent_rides');
const paymentSuccessRate = new Rate('payment_success');

export const options = {
  stages: [
    { duration: '1m', target: 50 },    // Ramp-up
    { duration: '10m', target: 200 },  // Peak load (simulating peak hours: 8-9am, 5-7pm)
    { duration: '5m', target: 100 },   // Plateau
    { duration: '2m', target: 0 },     // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'], // Higher latency during peak
    http_req_failed: ['rate<0.15'],                   // Allow up to 15% failure rate under peak
    'payment_success': ['rate>0.90'],                 // At least 90% payment success
  },
};

const BASE_URL = 'http://localhost:3000/api';

/**
 * Simulate concurrent payment processing (critical path)
 */
export function handleConcurrentPayments() {
  return group('Concurrent Payment Processing', () => {
    // Simulate 5 concurrent payment requests
    const paymentPromises = [];

    for (let i = 0; i < 5; i++) {
      const payload = {
        tripId: `trip-${Date.now()}-${i}`,
        passengerId: `passenger-${Math.floor(Math.random() * 1000)}`,
        driverId: `driver-${Math.floor(Math.random() * 100)}`,
        finalFare: 20 + Math.random() * 30,
        paymentMethod: ['card', 'wallet', 'cash'][Math.floor(Math.random() * 3)],
      };

      const res = http.post(`${BASE_URL}/payments/complete-ride`, JSON.stringify(payload), {
        headers: { 'Content-Type': 'application/json' },
        timeout: '30s',
      });

      const success = check(res, {
        'payment processing successful': (r) => r.status === 200 || r.status === 201,
        'payment status completed': (r) => {
          try {
            return JSON.parse(r.body).status === 'completed';
          } catch {
            return false;
          }
        },
      });

      paymentConcurrencyDuration.add(res.timings.duration);
      if (success) {
        paymentSuccessRate.add(1);
      } else {
        paymentSuccessRate.add(0);
        peakHourErrorRate.add(1);
      }

      paymentPromises.push(res);
    }

    concurrentRidesCounter.add(1);
    return paymentPromises;
  });
}

/**
 * Simulate ride requests during peak hours
 */
export function simulatePeakHourRideRequests() {
  return group('Peak Hour Ride Requests', () => {
    // Simulate requests coming in rapid succession
    const requests = [];

    for (let i = 0; i < 10; i++) {
      const payload = {
        passengerId: `passenger-${Math.floor(Math.random() * 5000)}`,
        pickupLocation: {
          lat: 40.7128 + (Math.random() - 0.5) * 0.2,
          lon: -74.006 + (Math.random() - 0.5) * 0.2,
        },
        dropoffLocation: {
          lat: 40.7489 + (Math.random() - 0.5) * 0.2,
          lon: -73.968 + (Math.random() - 0.5) * 0.2,
        },
        estimatedDistance: 3 + Math.random() * 15,
        estimatedDuration: 5 + Math.random() * 30,
      };

      const res = http.post(`${BASE_URL}/rides/request`, JSON.stringify(payload), {
        headers: { 'Content-Type': 'application/json' },
        timeout: '30s',
      });

      check(res, {
        'ride request successful': (r) => r.status === 200 || r.status === 201,
      });

      if (res.status !== 200 && res.status !== 201) {
        peakHourErrorRate.add(1);
      }

      requests.push(res);
    }

    return requests;
  });
}

/**
 * Simulate location updates at high frequency (multiple drivers in parallel)
 */
export function simulateHighFrequencyLocationUpdates() {
  return group('High Frequency Location Updates', () => {
    // Simulate 20 drivers sending location updates simultaneously
    const updates = [];

    for (let i = 0; i < 20; i++) {
      const driverId = `driver-${i + 1}`;
      const payload = {
        driverId,
        location: {
          lat: 40.7128 + (Math.random() - 0.5) * 0.1,
          lon: -74.006 + (Math.random() - 0.5) * 0.1,
        },
        accuracy: 5 + Math.random() * 10,
        heading: Math.floor(Math.random() * 360),
        speed: 20 + Math.random() * 40,
        timestamp: new Date().toISOString(),
      };

      const res = http.post(`${BASE_URL}/locations/track`, JSON.stringify(payload), {
        headers: { 'Content-Type': 'application/json' },
        timeout: '10s',
      });

      check(res, {
        'location update successful': (r) => r.status === 200,
      });

      updates.push(res);
    }

    return updates;
  });
}

/**
 * Stress test: Analytics aggregation under load
 */
export function stressTestAnalyticsAggregation() {
  return group('Analytics Aggregation Under Load', () => {
    // Simulate multiple simultaneous analytics requests
    const analyticsRequests = [];

    for (let i = 0; i < 5; i++) {
      const res = http.get(`${BASE_URL}/analytics/daily`, {
        timeout: '30s',
      });

      check(res, {
        'analytics retrieval successful': (r) => r.status === 200,
        'analytics has metrics': (r) => {
          try {
            const body = JSON.parse(r.body);
            return (
              body.totalRides !== undefined &&
              body.totalRevenue !== undefined &&
              body.completedRides !== undefined
            );
          } catch {
            return false;
          }
        },
      });

      analyticsRequests.push(res);
    }

    return analyticsRequests;
  });
}

/**
 * Test driver profile updates under concurrent rating submissions
 */
export function stressTestDriverProfileUpdates() {
  return group('Driver Profile Updates Under Load', () => {
    const driverId = `driver-${Math.floor(Math.random() * 100)}`;
    const ratingUpdates = [];

    // Simulate 10 concurrent rating submissions for same driver
    for (let i = 0; i < 10; i++) {
      const payload = {
        tripId: `trip-${Date.now()}-${i}`,
        raterId: `passenger-${Math.floor(Math.random() * 5000)}`,
        rateeId: driverId,
        stars: Math.floor(Math.random() * 5) + 1,
        review: 'Test review',
        categories: {
          cleanliness: Math.floor(Math.random() * 5) + 1,
          communication: Math.floor(Math.random() * 5) + 1,
          driving: Math.floor(Math.random() * 5) + 1,
        },
      };

      const res = http.post(`${BASE_URL}/ratings/submit`, JSON.stringify(payload), {
        headers: { 'Content-Type': 'application/json' },
        timeout: '30s',
      });

      check(res, {
        'rating submission successful': (r) => r.status === 200 || r.status === 201,
      });

      ratingUpdates.push(res);
    }

    // Verify driver profile after ratings
    sleep(1);
    const profileRes = http.get(`${BASE_URL}/drivers/${driverId}/profile`);
    check(profileRes, {
      'driver profile updated': (r) => r.status === 200,
    });

    return ratingUpdates;
  });
}

/**
 * Test database query performance under load
 */
export function testDatabaseQueryPerformance() {
  return group('Database Query Performance', () => {
    const passengerId = `passenger-${Math.floor(Math.random() * 5000)}`;

    // Get passenger history
    const historyRes = http.get(
      `${BASE_URL}/passengers/${passengerId}/rides?limit=50&offset=0`,
      {
        timeout: '30s',
      }
    );

    check(historyRes, {
      'ride history retrieval successful': (r) => r.status === 200,
      'history has rides': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body.rides);
        } catch {
          return false;
        }
      },
    });

    return historyRes;
  });
}

/**
 * Main test function
 */
export default function () {
  // Simulate peak hour scenario
  const currentHour = new Date().getHours();

  // Peak hours: 8-9am, 5-7pm
  const isPeakHour = (currentHour >= 8 && currentHour <= 9) || (currentHour >= 17 && currentHour <= 19);

  if (isPeakHour || Math.random() > 0.5) {
    // During peak hours or 50% of time, do intensive operations
    simulatePeakHourRideRequests();
    sleep(0.5);

    handleConcurrentPayments();
    sleep(0.5);

    simulateHighFrequencyLocationUpdates();
    sleep(0.5);

    stressTestAnalyticsAggregation();
    sleep(0.5);

    stressTestDriverProfileUpdates();
    sleep(0.5);

    testDatabaseQueryPerformance();
  } else {
    // Off-peak operations
    simulatePeakHourRideRequests();
    sleep(1);

    handleConcurrentPayments();
    sleep(1);

    testDatabaseQueryPerformance();
  }

  sleep(1);
}
