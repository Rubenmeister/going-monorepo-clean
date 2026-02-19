import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const rideRequestDuration = new Trend('ride_request_duration');
const paymentProcessDuration = new Trend('payment_process_duration');
const ratingSubmitDuration = new Trend('rating_submit_duration');
const successfulRides = new Counter('successful_rides');
const failedRides = new Counter('failed_rides');
const onlineDrivers = new Gauge('online_drivers');

// Load test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Warm-up: 10 virtual users
    { duration: '5m', target: 50 },   // Ramp-up: 50 users
    { duration: '5m', target: 100 },  // Load: 100 users
    { duration: '5m', target: 50 },   // Ramp-down: 50 users
    { duration: '1m', target: 0 },    // Cool-down: 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95th percentile < 500ms, 99th < 1s
    http_req_failed: ['rate<0.1'],                   // Error rate < 10%
    errors: ['rate<0.05'],                           // Custom error rate < 5%
  },
  ext: {
    loadimpact: {
      projectID: 3356643,
      name: 'Going Platform - Load Test',
    },
  },
};

const BASE_URL = 'http://localhost:3000/api';
const DRIVER_IDS = Array.from({ length: 20 }, (_, i) => `driver-${i + 1}`);
const PASSENGER_IDS = Array.from({ length: 100 }, (_, i) => `passenger-${i + 1}`);

/**
 * Generate random passenger and driver
 */
function getRandomPassenger() {
  return PASSENGER_IDS[Math.floor(Math.random() * PASSENGER_IDS.length)];
}

function getRandomDriver() {
  return DRIVER_IDS[Math.floor(Math.random() * DRIVER_IDS.length)];
}

/**
 * Simulate ride request from passenger
 */
function requestRide(passengerId) {
  return group('Request Ride', () => {
    const payload = {
      passengerId,
      pickupLocation: {
        lat: 40.7128 + (Math.random() - 0.5) * 0.1,
        lon: -74.006 + (Math.random() - 0.5) * 0.1,
      },
      dropoffLocation: {
        lat: 40.7489 + (Math.random() - 0.5) * 0.1,
        lon: -73.968 + (Math.random() - 0.5) * 0.1,
      },
      estimatedDistance: 5 + Math.random() * 10,
      estimatedDuration: 10 + Math.random() * 20,
    };

    const res = http.post(`${BASE_URL}/rides/request`, JSON.stringify(payload), {
      headers: { 'Content-Type': 'application/json' },
      timeout: '30s',
    });

    const success = check(res, {
      'ride request status is 200': (r) => r.status === 200 || r.status === 201,
      'ride has tripId': (r) => JSON.parse(r.body).tripId !== undefined,
    });

    rideRequestDuration.add(res.timings.duration);
    if (!success) {
      errorRate.add(1);
      failedRides.add(1);
    } else {
      successfulRides.add(1);
    }

    return JSON.parse(res.body);
  });
}

/**
 * Simulate driver accepting ride
 */
function acceptRide(tripId, driverId) {
  return group('Accept Ride', () => {
    const payload = {
      driverId,
      currentLocation: {
        lat: 40.715 + Math.random() * 0.05,
        lon: -74.008 + Math.random() * 0.05,
      },
    };

    const res = http.post(`${BASE_URL}/rides/${tripId}/accept`, JSON.stringify(payload), {
      headers: { 'Content-Type': 'application/json' },
      timeout: '30s',
    });

    const success = check(res, {
      'ride accept status is 200': (r) => r.status === 200,
      'ride status is accepted': (r) => JSON.parse(r.body).status === 'accepted',
    });

    if (!success) {
      errorRate.add(1);
    }

    return JSON.parse(res.body);
  });
}

/**
 * Simulate driver location tracking (real-time updates)
 */
function trackLocation(tripId, driverId) {
  return group('Track Location', () => {
    const payload = {
      driverId,
      location: {
        lat: 40.715 + Math.random() * 0.02,
        lon: -74.008 + Math.random() * 0.02,
      },
      accuracy: 10,
      heading: Math.floor(Math.random() * 360),
      speed: 25 + Math.random() * 15,
      timestamp: new Date().toISOString(),
    };

    const res = http.post(`${BASE_URL}/locations/track`, JSON.stringify(payload), {
      headers: { 'Content-Type': 'application/json' },
      timeout: '10s',
    });

    check(res, {
      'location tracking status is 200': (r) => r.status === 200,
    });
  });
}

/**
 * Simulate ride completion
 */
function completeRide(tripId, driverId) {
  return group('Complete Ride', () => {
    const payload = {
      tripId,
      endLocation: {
        lat: 40.7489 + (Math.random() - 0.5) * 0.02,
        lon: -73.968 + (Math.random() - 0.5) * 0.02,
      },
      actualDistance: 5 + Math.random() * 10,
      actualDuration: 10 + Math.random() * 20,
    };

    const res = http.post(`${BASE_URL}/rides/${tripId}/complete`, JSON.stringify(payload), {
      headers: { 'Content-Type': 'application/json' },
      timeout: '30s',
    });

    const success = check(res, {
      'ride complete status is 200': (r) => r.status === 200,
      'ride status is completed': (r) => JSON.parse(r.body).status === 'completed',
    });

    if (!success) {
      errorRate.add(1);
    }

    return JSON.parse(res.body);
  });
}

/**
 * Simulate payment processing
 */
function processPayment(tripId, passengerId, driverId, finalFare) {
  return group('Process Payment', () => {
    const paymentMethods = ['card', 'wallet', 'cash'];
    const payload = {
      tripId,
      passengerId,
      driverId,
      finalFare,
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      paymentMethodId: 'pm_test' + Math.random().toString(36).substring(7),
    };

    const res = http.post(`${BASE_URL}/payments/complete-ride`, JSON.stringify(payload), {
      headers: { 'Content-Type': 'application/json' },
      timeout: '30s',
    });

    const success = check(res, {
      'payment processing status is 200': (r) => r.status === 200 || r.status === 201,
      'payment status is completed': (r) => JSON.parse(r.body).status === 'completed',
      'payment has correct amount': (r) => Math.abs(JSON.parse(r.body).amount - finalFare) < 0.01,
    });

    paymentProcessDuration.add(res.timings.duration);
    if (!success) {
      errorRate.add(1);
    }

    return JSON.parse(res.body);
  });
}

/**
 * Simulate rating submission
 */
function submitRating(tripId, passengerId, driverId) {
  return group('Submit Rating', () => {
    const stars = Math.floor(Math.random() * 5) + 1;
    const reviews = [
      'Great driver, very professional!',
      'Clean car and friendly',
      'Good service',
      'Driver was a bit rude',
      'Excellent experience!',
    ];

    const payload = {
      tripId,
      raterId: passengerId,
      rateeId: driverId,
      stars,
      review: reviews[Math.floor(Math.random() * reviews.length)],
      categories: {
        cleanliness: Math.floor(Math.random() * 5) + 1,
        communication: Math.floor(Math.random() * 5) + 1,
        driving: Math.floor(Math.random() * 5) + 1,
        behavior: Math.floor(Math.random() * 5) + 1,
      },
    };

    const res = http.post(`${BASE_URL}/ratings/submit`, JSON.stringify(payload), {
      headers: { 'Content-Type': 'application/json' },
      timeout: '30s',
    });

    const success = check(res, {
      'rating submit status is 200': (r) => r.status === 200 || r.status === 201,
      'rating stars valid': (r) => {
        const body = JSON.parse(r.body);
        return body.stars >= 1 && body.stars <= 5;
      },
    });

    ratingSubmitDuration.add(res.timings.duration);
    if (!success) {
      errorRate.add(1);
    }

    return JSON.parse(res.body);
  });
}

/**
 * Simulate getting driver profile
 */
function getDriverProfile(driverId) {
  return group('Get Driver Profile', () => {
    const res = http.get(`${BASE_URL}/drivers/${driverId}/profile`, {
      timeout: '10s',
    });

    check(res, {
      'driver profile status is 200': (r) => r.status === 200,
      'profile has averageRating': (r) => JSON.parse(r.body).averageRating !== undefined,
      'profile has badges': (r) => JSON.parse(r.body).badges !== undefined,
    });

    return JSON.parse(res.body);
  });
}

/**
 * Simulate getting analytics
 */
function getAnalytics() {
  return group('Get Analytics', () => {
    const res = http.get(`${BASE_URL}/analytics/daily`, {
      timeout: '10s',
    });

    check(res, {
      'analytics status is 200': (r) => r.status === 200,
      'analytics has totalRides': (r) => JSON.parse(r.body).totalRides !== undefined,
      'analytics has totalRevenue': (r) => JSON.parse(r.body).totalRevenue !== undefined,
    });

    return JSON.parse(res.body);
  });
}

/**
 * Main load test scenario
 */
export default function () {
  const passengerId = getRandomPassenger();
  const driverId = getRandomDriver();

  // Step 1: Request Ride
  const rideRequest = requestRide(passengerId);
  const tripId = rideRequest.tripId;
  sleep(1);

  // Step 2: Accept Ride
  acceptRide(tripId, driverId);
  sleep(1);

  // Step 3: Simulate location tracking (3 updates during ride)
  for (let i = 0; i < 3; i++) {
    trackLocation(tripId, driverId);
    sleep(1);
  }

  // Step 4: Complete Ride
  const completedRide = completeRide(tripId, driverId);
  const finalFare = completedRide.finalFare || 25.5;
  sleep(1);

  // Step 5: Process Payment
  processPayment(tripId, passengerId, driverId, finalFare);
  sleep(1);

  // Step 6: Submit Rating
  submitRating(tripId, passengerId, driverId);
  sleep(1);

  // Step 7: Check driver profile
  getDriverProfile(driverId);
  sleep(1);

  // Step 8: Check analytics
  getAnalytics();
  sleep(2); // Wait before next iteration
}

/**
 * Cleanup function
 */
export function teardown(data) {
  console.log('Load test completed');
  console.log(`Total successful rides: ${successfulRides.value}`);
  console.log(`Total failed rides: ${failedRides.value}`);
  console.log(`Average request duration: ${rideRequestDuration.value}ms`);
}
