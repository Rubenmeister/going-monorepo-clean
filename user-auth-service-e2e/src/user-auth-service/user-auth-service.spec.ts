import * as request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../../user-auth-service/src/app/app.module';

describe('Auth E2E Tests', () => {
  let app: INestApplication;

  // Test user data
  const testUser = {
    email: `test_e2e_${Date.now()}@going.com`,
    password: 'SecurePassword123!',
    firstName: 'Test',
    lastName: 'User',
    roles: ['USER'],
  };

  let authToken: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
    }));
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ============================================================
  // REGISTRATION TESTS
  // ============================================================

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toBeDefined();
      // The response should contain user info, not just ID
      expect(response.body.id || response.body.user).toBeDefined();
    });

    it('should fail when email is already registered', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(400); // or 409

      expect(response.body.message).toBeDefined();
    });

    it('should fail with invalid email format', async () => {
      const invalidUser = {
        ...testUser,
        email: 'invalid-email-format',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidUser)
        .expect(400);
    });

    it('should fail when password is too short', async () => {
      const invalidUser = {
        email: `weak_${Date.now()}@test.com`,
        password: 'weak',
        firstName: 'Test',
        lastName: 'User',
        roles: ['USER'],
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidUser)
        .expect(400);
    });

    it('should fail when required fields are missing', async () => {
      const incompleteUser = {
        email: `incomplete_${Date.now()}@test.com`,
        // password missing
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(incompleteUser)
        .expect(400);
    });
  });

  // ============================================================
  // LOGIN TESTS
  // ============================================================

  describe('POST /auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toBeDefined();
      // Should return a token
      expect(response.body.token || response.body.access_token || response.body.accessToken).toBeDefined();
      
      // Save token for authenticated tests
      authToken = response.body.token || response.body.access_token || response.body.accessToken;
    });

    it('should fail with incorrect password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'wrong_password123',
        })
        .expect(401);

      expect(response.body.message).toBeDefined();
    });

    it('should fail with non-existent email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'anypassword123',
        })
        .expect(401);

      expect(response.body.message).toBeDefined();
    });

    it('should fail with empty credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(400);
    });
  });

  // ============================================================
  // AUTHENTICATION FLOW TESTS
  // ============================================================

  describe('Authentication Flow', () => {
    it('should complete full registration and login flow', async () => {
      // 1. Register a new user
      const newUser = {
        email: `flow_${Date.now()}@test.com`,
        password: 'FlowTest123!',
        firstName: 'Flow',
        lastName: 'Test',
        roles: ['USER'],
      };

      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(newUser)
        .expect(201);

      expect(registerResponse.body).toBeDefined();

      // 2. Login with the new user
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: newUser.email,
          password: newUser.password,
        })
        .expect(200);

      expect(loginResponse.body.token || loginResponse.body.access_token).toBeDefined();
    });

    it('should return consistent user data between register and login', async () => {
      const newUser = {
        email: `consistency_${Date.now()}@test.com`,
        password: 'Consistent123!',
        firstName: 'Consistency',
        lastName: 'Test',
        roles: ['USER'],
      };

      // Register
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(newUser)
        .expect(201);

      // Login
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: newUser.email,
          password: newUser.password,
        })
        .expect(200);

      // User data should be consistent
      if (loginResponse.body.user) {
        expect(loginResponse.body.user.email).toBe(newUser.email);
      }
    });
  });
});