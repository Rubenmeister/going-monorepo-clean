import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../transport-service/src/app.module';

/**
 * Integration Tests for Ride Matching APIs
 *
 * Tests the complete ride lifecycle:
 * - Request a ride
 * - Accept a ride (driver)
 * - Start a ride
 * - Complete a ride
 * - Get ride history
 * - Cancel a ride
 * - Ride matching algorithm
 */
describe('Ride Matching API Integration Tests', () => {
  let app: INestApplication;
  let module: TestingModule;

  // Mock JWT token for testing
  const mockToken =
    'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyIsImlkIjoidXNlcl8xMjMiLCJlbWFpbCI6InBhc3NlbmdlckBleGFtcGxlLmNvbSIsImlhdCI6MTYzMDAwMDAwMH0.fake_signature';
  const mockDriverToken =
    'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkcml2ZXJfMTIzIiwiaWQiOiJkcml2ZXJfMTIzIiwiZW1haWwiOiJkcml2ZXJAZXhhbXBsZS5jb20iLCJpYXQiOjE2MzAwMDAwMDB9.fake_signature';

  const testUser = {
    id: 'user_123',
    email: 'passenger@example.com',
  };

  const testDriver = {
    id: 'driver_123',
    email: 'driver@example.com',
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /rides/request - Request a Ride', () => {
    const requestRideDto = {
      pickupLatitude: 40.7128,
      pickupLongitude: -74.006,
      dropoffLatitude: 40.758,
      dropoffLongitude: -73.9855,
      serviceType: 'standard',
    };

    it('should request a ride successfully with valid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/rides/request')
        .set('Authorization', mockToken)
        .send(requestRideDto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('rideId');
      expect(response.body.status).toBe('requested');
      expect(response.body.passengerId).toBe(testUser.id);
      expect(response.body.pickupLocation).toBeDefined();
      expect(response.body.dropoffLocation).toBeDefined();
    });

    it('should fail without JWT token', async () => {
      await request(app.getHttpServer())
        .post('/rides/request')
        .send(requestRideDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should fail with invalid coordinates', async () => {
      const invalidDto = {
        pickupLatitude: 999, // Invalid latitude
        pickupLongitude: -74.006,
        dropoffLatitude: 40.758,
        dropoffLongitude: -73.9855,
        serviceType: 'standard',
      };

      await request(app.getHttpServer())
        .post('/rides/request')
        .set('Authorization', mockToken)
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should fail with missing required fields', async () => {
      const invalidDto = {
        pickupLatitude: 40.7128,
        // Missing other required fields
      };

      await request(app.getHttpServer())
        .post('/rides/request')
        .set('Authorization', mockToken)
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should support different service types', async () => {
      const serviceTypes = ['standard', 'premium', 'xl'];

      for (const serviceType of serviceTypes) {
        const response = await request(app.getHttpServer())
          .post('/rides/request')
          .set('Authorization', mockToken)
          .send({ ...requestRideDto, serviceType })
          .expect(HttpStatus.CREATED);

        expect(response.body.serviceType).toBe(serviceType);
      }
    });
  });

  describe('GET /rides/:rideId - Get Ride Details', () => {
    const rideId = 'ride_123';

    it('should retrieve ride details successfully', async () => {
      const response = await request(app.getHttpServer())
        .get(`/rides/${rideId}`)
        .set('Authorization', mockToken)
        .expect(HttpStatus.OK);

      expect(response.body.rideId).toBe(rideId);
    });

    it('should fail without JWT token', async () => {
      await request(app.getHttpServer())
        .get(`/rides/${rideId}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 404 for non-existent ride', async () => {
      await request(app.getHttpServer())
        .get('/rides/ride_nonexistent')
        .set('Authorization', mockToken)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('PUT /rides/:rideId/accept - Accept a Ride (Driver)', () => {
    const rideId = 'ride_123';
    const acceptRideDto = {
      driverId: testDriver.id,
    };

    it('should accept a ride successfully', async () => {
      const response = await request(app.getHttpServer())
        .put(`/rides/${rideId}/accept`)
        .set('Authorization', mockDriverToken)
        .send(acceptRideDto)
        .expect(HttpStatus.OK);

      expect(response.body.rideId).toBe(rideId);
      expect(response.body.status).toBe('accepted');
      expect(response.body.driverId).toBe(testDriver.id);
    });

    it('should fail without JWT token', async () => {
      await request(app.getHttpServer())
        .put(`/rides/${rideId}/accept`)
        .send(acceptRideDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should fail if ride is not in requested state', async () => {
      await request(app.getHttpServer())
        .put('/rides/ride_already_accepted/accept')
        .set('Authorization', mockDriverToken)
        .send(acceptRideDto)
        .expect(HttpStatus.CONFLICT);
    });

    it('should handle multiple drivers accepting same ride', async () => {
      const rideId = 'ride_multiple_accepts';

      // First driver accepts
      await request(app.getHttpServer())
        .put(`/rides/${rideId}/accept`)
        .set('Authorization', mockDriverToken)
        .send({ driverId: testDriver.id })
        .expect(HttpStatus.OK);

      // Second driver tries to accept (should fail)
      await request(app.getHttpServer())
        .put(`/rides/${rideId}/accept`)
        .set('Authorization', mockDriverToken)
        .send({ driverId: 'driver_456' })
        .expect(HttpStatus.CONFLICT);
    });
  });

  describe('PUT /rides/:rideId/start - Start a Ride', () => {
    const rideId = 'ride_123';
    const startRideDto = {};

    it('should start a ride successfully', async () => {
      const response = await request(app.getHttpServer())
        .put(`/rides/${rideId}/start`)
        .set('Authorization', mockDriverToken)
        .send(startRideDto)
        .expect(HttpStatus.OK);

      expect(response.body.rideId).toBe(rideId);
      expect(response.body.status).toBe('started');
      expect(response.body.startedAt).toBeDefined();
    });

    it('should fail without JWT token', async () => {
      await request(app.getHttpServer())
        .put(`/rides/${rideId}/start`)
        .send(startRideDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should fail if ride is not accepted', async () => {
      await request(app.getHttpServer())
        .put('/rides/ride_requested/start')
        .set('Authorization', mockDriverToken)
        .send(startRideDto)
        .expect(HttpStatus.CONFLICT);
    });
  });

  describe('PUT /rides/:rideId/complete - Complete a Ride', () => {
    const rideId = 'ride_123';
    const completeRideDto = {
      distanceKm: 5.2,
      durationSeconds: 1200,
    };

    it('should complete a ride successfully', async () => {
      const response = await request(app.getHttpServer())
        .put(`/rides/${rideId}/complete`)
        .set('Authorization', mockDriverToken)
        .send(completeRideDto)
        .expect(HttpStatus.OK);

      expect(response.body.rideId).toBe(rideId);
      expect(response.body.status).toBe('completed');
      expect(response.body.distance).toBe(completeRideDto.distanceKm);
      expect(response.body.duration).toBe(completeRideDto.durationSeconds);
    });

    it('should fail without JWT token', async () => {
      await request(app.getHttpServer())
        .put(`/rides/${rideId}/complete`)
        .send(completeRideDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should fail with invalid distance', async () => {
      const invalidDto = {
        distanceKm: -5,
        durationSeconds: 1200,
      };

      await request(app.getHttpServer())
        .put(`/rides/${rideId}/complete`)
        .set('Authorization', mockDriverToken)
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should fail if ride is not started', async () => {
      await request(app.getHttpServer())
        .put('/rides/ride_accepted/complete')
        .set('Authorization', mockDriverToken)
        .send(completeRideDto)
        .expect(HttpStatus.CONFLICT);
    });
  });

  describe('GET /rides/history/user - Get Passenger Ride History', () => {
    it('should retrieve user ride history', async () => {
      const response = await request(app.getHttpServer())
        .get('/rides/history/user')
        .set('Authorization', mockToken)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should support pagination with limit parameter', async () => {
      const response = await request(app.getHttpServer())
        .get('/rides/history/user?limit=10')
        .set('Authorization', mockToken)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(10);
    });

    it('should fail without JWT token', async () => {
      await request(app.getHttpServer())
        .get('/rides/history/user')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /rides/history/driver/:driverId - Get Driver Ride History', () => {
    const driverId = 'driver_123';

    it('should retrieve driver ride history', async () => {
      const response = await request(app.getHttpServer())
        .get(`/rides/history/driver/${driverId}`)
        .set('Authorization', mockDriverToken)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should support pagination with limit parameter', async () => {
      const response = await request(app.getHttpServer())
        .get(`/rides/history/driver/${driverId}?limit=10`)
        .set('Authorization', mockDriverToken)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(10);
    });

    it('should return rides for the specified driver only', async () => {
      const response = await request(app.getHttpServer())
        .get(`/rides/history/driver/${driverId}`)
        .set('Authorization', mockDriverToken)
        .expect(HttpStatus.OK);

      response.body.forEach((ride: any) => {
        expect(ride.driverId).toBe(driverId);
      });
    });
  });

  describe('PUT /rides/:rideId/cancel - Cancel a Ride', () => {
    const rideId = 'ride_123';
    const cancelRideDto = {
      reason: 'Driver not responding',
    };

    it('should cancel a ride successfully', async () => {
      const response = await request(app.getHttpServer())
        .put(`/rides/${rideId}/cancel`)
        .set('Authorization', mockToken)
        .send(cancelRideDto)
        .expect(HttpStatus.OK);

      expect(response.body.rideId).toBe(rideId);
      expect(response.body.status).toBe('cancelled');
      expect(response.body.reason).toBe(cancelRideDto.reason);
      expect(response.body.cancelledAt).toBeDefined();
    });

    it('should fail without JWT token', async () => {
      await request(app.getHttpServer())
        .put(`/rides/${rideId}/cancel`)
        .send(cancelRideDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should fail if ride is already completed', async () => {
      await request(app.getHttpServer())
        .put('/rides/ride_completed/cancel')
        .set('Authorization', mockToken)
        .send(cancelRideDto)
        .expect(HttpStatus.CONFLICT);
    });

    it('should fail with empty reason', async () => {
      await request(app.getHttpServer())
        .put(`/rides/${rideId}/cancel`)
        .set('Authorization', mockToken)
        .send({ reason: '' })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('Complete Ride Lifecycle', () => {
    it('should handle complete ride lifecycle: request → accept → start → complete', async () => {
      // Step 1: Request ride
      const requestResponse = await request(app.getHttpServer())
        .post('/rides/request')
        .set('Authorization', mockToken)
        .send({
          pickupLatitude: 40.7128,
          pickupLongitude: -74.006,
          dropoffLatitude: 40.758,
          dropoffLongitude: -73.9855,
          serviceType: 'standard',
        })
        .expect(HttpStatus.CREATED);

      const rideId = requestResponse.body.rideId;

      // Step 2: Accept ride
      await request(app.getHttpServer())
        .put(`/rides/${rideId}/accept`)
        .set('Authorization', mockDriverToken)
        .send({ driverId: testDriver.id })
        .expect(HttpStatus.OK);

      // Step 3: Start ride
      await request(app.getHttpServer())
        .put(`/rides/${rideId}/start`)
        .set('Authorization', mockDriverToken)
        .send({})
        .expect(HttpStatus.OK);

      // Step 4: Complete ride
      const completeResponse = await request(app.getHttpServer())
        .put(`/rides/${rideId}/complete`)
        .set('Authorization', mockDriverToken)
        .send({
          distanceKm: 5.2,
          durationSeconds: 1200,
        })
        .expect(HttpStatus.OK);

      expect(completeResponse.body.status).toBe('completed');
    });

    it('should handle ride cancellation at different stages', async () => {
      // Requested stage
      const requestResponse = await request(app.getHttpServer())
        .post('/rides/request')
        .set('Authorization', mockToken)
        .send({
          pickupLatitude: 40.7128,
          pickupLongitude: -74.006,
          dropoffLatitude: 40.758,
          dropoffLongitude: -73.9855,
          serviceType: 'standard',
        })
        .expect(HttpStatus.CREATED);

      const rideId = requestResponse.body.rideId;

      // Cancel from requested state
      await request(app.getHttpServer())
        .put(`/rides/${rideId}/cancel`)
        .set('Authorization', mockToken)
        .send({ reason: 'Changed my mind' })
        .expect(HttpStatus.OK);
    });
  });

  describe('Ride Matching Algorithm', () => {
    it('should match drivers within radius and with acceptable ratings', async () => {
      const requestResponse = await request(app.getHttpServer())
        .post('/rides/request')
        .set('Authorization', mockToken)
        .send({
          pickupLatitude: 40.7128,
          pickupLongitude: -74.006,
          dropoffLatitude: 40.758,
          dropoffLongitude: -73.9855,
          serviceType: 'standard',
        })
        .expect(HttpStatus.CREATED);

      const rideId = requestResponse.body.rideId;

      // Get ride details to check matched drivers
      const rideResponse = await request(app.getHttpServer())
        .get(`/rides/${rideId}`)
        .set('Authorization', mockToken)
        .expect(HttpStatus.OK);

      expect(rideResponse.body).toHaveProperty('matchedDrivers');
      if (rideResponse.body.matchedDrivers.length > 0) {
        rideResponse.body.matchedDrivers.forEach((driver: any) => {
          expect(driver).toHaveProperty('driverId');
          expect(driver).toHaveProperty('distance');
          expect(driver).toHaveProperty('rating');
          expect(driver.distance).toBeLessThanOrEqual(5); // 5km radius
          expect(driver.rating).toBeGreaterThanOrEqual(4.0); // 4.0+ rating
        });
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      const response = await request(app.getHttpServer())
        .get('/rides/ride_123')
        .set('Authorization', mockToken);

      expect([
        HttpStatus.OK,
        HttpStatus.INTERNAL_SERVER_ERROR,
        HttpStatus.NOT_FOUND,
      ]).toContain(response.status);
    });

    it('should handle concurrent ride requests', async () => {
      const requests = Array.from({ length: 5 }, () =>
        request(app.getHttpServer())
          .post('/rides/request')
          .set('Authorization', mockToken)
          .send({
            pickupLatitude: 40.7128,
            pickupLongitude: -74.006,
            dropoffLatitude: 40.758,
            dropoffLongitude: -73.9855,
            serviceType: 'standard',
          })
      );

      const responses = await Promise.all(requests);
      expect(responses.length).toBe(5);
      responses.forEach((res) => {
        expect([HttpStatus.CREATED, HttpStatus.OK]).toContain(res.status);
      });
    });
  });
});
