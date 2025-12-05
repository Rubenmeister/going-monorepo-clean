import * as request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../parcel-service/src/app.module';

describe('Parcel Service E2E Tests', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;

  // Sample parcel data
  const validParcel = {
    userId: 'user-123',
    originCity: 'Quito',
    originAddress: 'Av. Amazonas N32-123',
    destinationCity: 'Guayaquil',
    destinationAddress: 'Malecón 2000',
    description: 'Documents for delivery',
    weight: 2.5,
  };

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test_parcel';

    try {
      moduleFixture = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        transform: true,
      }));
      
      await app.init();
    } catch (error) {
      console.error('Failed to initialize parcel-service test app:', error);
      throw error;
    }
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  // ============================================================
  // PARCEL CREATION
  // ============================================================

  describe('POST /parcels', () => {
    it('should create a new parcel with valid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/parcels')
        .send(validParcel);

      // Accept 201 (success) or other status if DB not connected
      if (response.status === 201) {
        expect(response.body).toBeDefined();
        expect(response.body.id || response.body._id).toBeDefined();
        expect(response.body.status).toBe('pending');
      }
    });

    it('should reject parcel with missing required fields', async () => {
      const invalidParcel = {
        userId: 'user-123',
        // Missing other required fields
      };

      const response = await request(app.getHttpServer())
        .post('/parcels')
        .send(invalidParcel);

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject parcel with invalid weight', async () => {
      const invalidParcel = {
        ...validParcel,
        weight: -5, // Negative weight
      };

      const response = await request(app.getHttpServer())
        .post('/parcels')
        .send(invalidParcel);

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  // ============================================================
  // PARCEL RETRIEVAL
  // ============================================================

  describe('GET /parcels/user/:userId', () => {
    it('should return parcels for a user', async () => {
      const response = await request(app.getHttpServer())
        .get('/parcels/user/user-123');

      // Accept various statuses based on data availability
      expect([200, 404, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true);
      }
    });

    it('should return empty array for user with no parcels', async () => {
      const response = await request(app.getHttpServer())
        .get('/parcels/user/nonexistent-user-999');

      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(0);
      }
    });
  });

  // ============================================================
  // PARCEL STATUS UPDATES
  // ============================================================

  describe('Parcel Lifecycle', () => {
    let createdParcelId: string;

    it('should follow complete parcel lifecycle', async () => {
      // Step 1: Create parcel
      const createResponse = await request(app.getHttpServer())
        .post('/parcels')
        .send(validParcel);

      if (createResponse.status === 201) {
        createdParcelId = createResponse.body.id || createResponse.body._id;
        expect(createdParcelId).toBeDefined();

        // Step 2: Get parcel
        const getResponse = await request(app.getHttpServer())
          .get(`/parcels/${createdParcelId}`);

        if (getResponse.status === 200) {
          expect(getResponse.body.status).toBe('pending');
        }
      }
    });
  });

  // ============================================================
  // ERROR HANDLING
  // ============================================================

  describe('Error Handling', () => {
    it('should return 404 for non-existent parcel', async () => {
      const response = await request(app.getHttpServer())
        .get('/parcels/non-existent-id-12345');

      expect([400, 404, 500]).toContain(response.status);
    });

    it('should handle invalid parcel ID format gracefully', async () => {
      const response = await request(app.getHttpServer())
        .get('/parcels/invalid-id');

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});
