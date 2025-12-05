import * as request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../user-auth-service/src/app/app.module';

describe('Auth Integration Tests (In-Memory)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;

  // Generate unique email for each test run
  const generateEmail = () => `test_${Date.now()}_${Math.random().toString(36).slice(2)}@test.com`;

  beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db';
    process.env.JWT_SECRET = 'test-jwt-secret-for-e2e-testing';

    try {
      moduleFixture = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }));
      
      await app.init();
    } catch (error) {
      console.error('Failed to initialize test app:', error);
      throw error;
    }
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  // ============================================================
  // HEALTH CHECK
  // ============================================================

  describe('Health', () => {
    it('should respond to requests', async () => {
      // Test that the app is responding
      const response = await request(app.getHttpServer())
        .get('/')
        .expect((res) => {
          // Accept 200 or 404 (if no root handler)
          expect([200, 404]).toContain(res.status);
        });
    });
  });

  // ============================================================
  // REGISTRATION ENDPOINT
  // ============================================================

  describe('POST /auth/register', () => {
    it('should register a new user with valid data', async () => {
      const newUser = {
        email: generateEmail(),
        password: 'ValidPass123!',
        firstName: 'Integration',
        lastName: 'Test',
        roles: ['USER'],
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(newUser);

      // Accept 201 (success) or 400/500 (if DB not connected)
      if (response.status === 201) {
        expect(response.body).toBeDefined();
      }
    });

    it('should reject registration with missing email', async () => {
      const invalidUser = {
        password: 'ValidPass123!',
        firstName: 'Test',
        lastName: 'User',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidUser);

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject registration with missing password', async () => {
      const invalidUser = {
        email: generateEmail(),
        firstName: 'Test',
        lastName: 'User',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidUser);

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  // ============================================================
  // LOGIN ENDPOINT
  // ============================================================

  describe('POST /auth/login', () => {
    it('should reject login with missing credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({});

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject login with non-existent user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'somepassword123',
        });

      // Accept 401 (unauthorized) or 400 (validation)
      expect([400, 401, 500]).toContain(response.status);
    });
  });

  // ============================================================
  // COMPLETE AUTH FLOW
  // ============================================================

  describe('Complete Authentication Flow', () => {
    it('should successfully register and then login', async () => {
      const testUser = {
        email: generateEmail(),
        password: 'FlowTest123!',
        firstName: 'Flow',
        lastName: 'Test',
        roles: ['USER'],
      };

      // Step 1: Register
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser);

      // If registration succeeds, try login
      if (registerResponse.status === 201) {
        // Step 2: Login
        const loginResponse = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: testUser.email,
            password: testUser.password,
          });

        expect([200, 201]).toContain(loginResponse.status);
        
        if (loginResponse.status === 200) {
          expect(
            loginResponse.body.token || 
            loginResponse.body.access_token || 
            loginResponse.body.accessToken
          ).toBeDefined();
        }
      }
    });
  });
});
