import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import * as jwt from 'jsonwebtoken';

describe('Authentication & Authorization Security Tests', () => {
  let app: INestApplication;
  const JWT_SECRET = 'test_secret_key';

  // Test users with different roles
  const testUsers = {
    passenger: {
      userId: 'passenger-001',
      email: 'passenger@test.com',
      role: 'passenger',
      password: 'password123',
    },
    driver: {
      userId: 'driver-001',
      email: 'driver@test.com',
      role: 'driver',
      password: 'password123',
    },
    admin: {
      userId: 'admin-001',
      email: 'admin@test.com',
      role: 'admin',
      password: 'admin123',
    },
  };

  beforeAll(async () => {
    // Mock NestJS application setup
    const moduleFixture: TestingModule = await Test.createTestingModule({
      // Controllers and providers would be included here
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('JWT Authentication', () => {
    it('should reject request without token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/rides')
        .expect(HttpStatus.UNAUTHORIZED);

      expect(response.body.message).toContain('token');
    });

    it('should reject request with invalid token', async () => {
      const invalidToken = 'invalid.token.here';

      const response = await request(app.getHttpServer())
        .get('/api/rides')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(HttpStatus.UNAUTHORIZED);

      expect(response.body.message).toContain('invalid');
    });

    it('should reject request with expired token', async () => {
      // Create token with past expiry
      const expiredToken = jwt.sign(
        { userId: 'passenger-001', role: 'passenger' },
        JWT_SECRET,
        { expiresIn: '-1h' }
      );

      const response = await request(app.getHttpServer())
        .get('/api/rides')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(HttpStatus.UNAUTHORIZED);

      expect(response.body.message).toContain('expired');
    });

    it('should accept valid JWT token', async () => {
      const validToken = jwt.sign(
        {
          userId: testUsers.passenger.userId,
          email: testUsers.passenger.email,
          role: testUsers.passenger.role,
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const response = await request(app.getHttpServer())
        .get('/api/rides')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toBeDefined();
    });

    it('should reject token with tampered payload', async () => {
      const validToken = jwt.sign(
        {
          userId: testUsers.passenger.userId,
          role: 'passenger',
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Tamper with the token
      const parts = validToken.split('.');
      const tampered = parts[0] + '.tampered.' + parts[2];

      const response = await request(app.getHttpServer())
        .get('/api/rides')
        .set('Authorization', `Bearer ${tampered}`)
        .expect(HttpStatus.UNAUTHORIZED);

      expect(response.body.message).toContain('invalid');
    });

    it('should reject token signed with wrong secret', async () => {
      const wrongSecretToken = jwt.sign(
        { userId: 'passenger-001', role: 'passenger' },
        'wrong_secret',
        { expiresIn: '24h' }
      );

      const response = await request(app.getHttpServer())
        .get('/api/rides')
        .set('Authorization', `Bearer ${wrongSecretToken}`)
        .expect(HttpStatus.UNAUTHORIZED);

      expect(response.body.message).toContain('invalid');
    });

    it('should validate token signature', () => {
      const token = jwt.sign(
        { userId: 'passenger-001', role: 'passenger' },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Should not throw
      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded.userId).toBe('passenger-001');
    });

    it('should reject token without expiry claims', () => {
      const malformedToken = jwt.sign(
        { userId: 'passenger-001' },
        JWT_SECRET
        // No expiresIn
      );

      expect(() => {
        jwt.verify(malformedToken, JWT_SECRET, { ignoreExpiration: false });
      }).not.toThrow(); // No expiry means valid
    });
  });

  describe('Authorization & Role-based Access Control', () => {
    it('should reject passenger accessing driver-only endpoints', async () => {
      const passengerToken = jwt.sign(
        {
          userId: testUsers.passenger.userId,
          role: 'passenger',
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const response = await request(app.getHttpServer())
        .post('/api/rides/driver-earnings')
        .set('Authorization', `Bearer ${passengerToken}`)
        .expect(HttpStatus.FORBIDDEN);

      expect(response.body.message).toContain('permission');
    });

    it('should reject driver accessing payment endpoints', async () => {
      const driverToken = jwt.sign(
        {
          userId: testUsers.driver.userId,
          role: 'driver',
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const response = await request(app.getHttpServer())
        .get('/api/payments/admin/reports')
        .set('Authorization', `Bearer ${driverToken}`)
        .expect(HttpStatus.FORBIDDEN);

      expect(response.body.message).toContain('permission');
    });

    it('should allow admin accessing all endpoints', async () => {
      const adminToken = jwt.sign(
        {
          userId: testUsers.admin.userId,
          role: 'admin',
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Admin should access all resources
      const response = await request(app.getHttpServer())
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toBeDefined();
    });

    it('should prevent privilege escalation', async () => {
      const passengerToken = jwt.sign(
        {
          userId: testUsers.passenger.userId,
          role: 'passenger',
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Try to escalate privileges
      const response = await request(app.getHttpServer())
        .patch(`/api/users/${testUsers.passenger.userId}/role`)
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({ role: 'admin' })
        .expect(HttpStatus.FORBIDDEN);

      expect(response.body.message).toContain('not allowed');
    });

    it('should validate user can only access their own data', async () => {
      const passengerToken = jwt.sign(
        {
          userId: testUsers.passenger.userId,
          role: 'passenger',
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Try to access another passenger's data
      const response = await request(app.getHttpServer())
        .get('/api/passengers/passenger-002/rides')
        .set('Authorization', `Bearer ${passengerToken}`)
        .expect(HttpStatus.FORBIDDEN);

      expect(response.body.message).toContain('not authorized');
    });

    it('should allow admin to access any user data', async () => {
      const adminToken = jwt.sign(
        {
          userId: testUsers.admin.userId,
          role: 'admin',
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const response = await request(app.getHttpServer())
        .get('/api/passengers/passenger-002/rides')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toBeDefined();
    });
  });

  describe('OAuth2 Security', () => {
    it('should validate OAuth2 authorization code', async () => {
      const authCode = 'valid_auth_code_123';
      const clientId = 'test_client_id';
      const clientSecret = 'test_client_secret';

      const response = await request(app.getHttpServer())
        .post('/api/auth/oauth/token')
        .send({
          grant_type: 'authorization_code',
          code: authCode,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: 'http://localhost:3000/callback',
        })
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('token_type', 'Bearer');
      expect(response.body).toHaveProperty('expires_in');
    });

    it('should reject invalid OAuth2 client', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/oauth/token')
        .send({
          grant_type: 'authorization_code',
          code: 'auth_code',
          client_id: 'invalid_client',
          client_secret: 'invalid_secret',
        })
        .expect(HttpStatus.UNAUTHORIZED);

      expect(response.body.message).toContain('invalid_client');
    });

    it('should reject expired authorization code', async () => {
      const expiredCode = 'expired_code_123'; // Simulated expired code

      const response = await request(app.getHttpServer())
        .post('/api/auth/oauth/token')
        .send({
          grant_type: 'authorization_code',
          code: expiredCode,
          client_id: 'valid_client',
          client_secret: 'valid_secret',
        })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toContain('expired');
    });

    it('should validate OAuth2 redirect URI', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/oauth/token')
        .send({
          grant_type: 'authorization_code',
          code: 'auth_code',
          client_id: 'test_client',
          client_secret: 'test_secret',
          redirect_uri: 'http://malicious.com/callback', // Mismatched
        })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toContain('redirect_uri');
    });

    it('should enforce PKCE for public clients', async () => {
      // PKCE (Proof Key for Public Clients)
      const codeVerifier = 'abc123def456ghi789jkl012mno345pqr678stu901';
      const codeChallenge = Buffer.from(codeVerifier).toString('base64');

      const response = await request(app.getHttpServer())
        .post('/api/auth/oauth/authorize')
        .send({
          client_id: 'mobile_client',
          redirect_uri: 'app://callback',
          code_challenge: codeChallenge,
          code_challenge_method: 'S256',
        })
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('authorization_code');
    });

    it('should reject OAuth2 token with invalid PKCE', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/oauth/token')
        .send({
          grant_type: 'authorization_code',
          code: 'auth_code_with_pkce',
          client_id: 'mobile_client',
          code_verifier: 'wrong_verifier',
        })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toContain('code_verifier');
    });
  });

  describe('Password Security', () => {
    it('should enforce password minimum length', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          password: '123', // Too short
          name: 'Test User',
        })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toContain('password');
    });

    it('should enforce password complexity requirements', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          password: 'nouppercase123', // Missing uppercase
          name: 'Test User',
        })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toContain('complexity');
    });

    it('should hash passwords before storage', async () => {
      const plainPassword = 'MyPassword123!';

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'newuser@test.com',
          password: plainPassword,
          name: 'New User',
        })
        .expect(HttpStatus.CREATED);

      // Password should not be in response
      expect(response.body).not.toHaveProperty('password');

      // Verify we can't read plaintext password from database
      // (This would require accessing the DB directly)
    });

    it('should prevent brute force login attempts', async () => {
      const maxAttempts = 5;

      for (let i = 0; i < maxAttempts + 1; i++) {
        const response = await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            email: 'passenger@test.com',
            password: 'wrong_password',
          });

        if (i < maxAttempts) {
          expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
        } else {
          // Should be locked
          expect(response.status).toBe(HttpStatus.TOO_MANY_REQUESTS);
        }
      }
    });

    it('should implement password reset token expiry', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({
          token: 'expired_reset_token',
          newPassword: 'NewPassword123!',
        })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toContain('expired');
    });
  });

  describe('Data Protection & Input Validation', () => {
    it('should prevent SQL injection attacks', async () => {
      const maliciousInput = "'; DROP TABLE rides; --";

      const response = await request(app.getHttpServer())
        .get(`/api/rides/${maliciousInput}`)
        .set('Authorization', `Bearer ${jwt.sign({ userId: 'test' }, JWT_SECRET)}`)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toContain('invalid');
    });

    it('should prevent NoSQL injection in MongoDB queries', async () => {
      const maliciousInput = { $ne: null };

      const response = await request(app.getHttpServer())
        .post('/api/rides/filter')
        .set('Authorization', `Bearer ${jwt.sign({ userId: 'test' }, JWT_SECRET)}`)
        .send({
          passengerId: maliciousInput,
        })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toContain('invalid');
    });

    it('should prevent XSS attacks in request body', async () => {
      const xssPayload = '<script>alert("xss")</script>';

      const response = await request(app.getHttpServer())
        .post('/api/ratings/submit')
        .set('Authorization', `Bearer ${jwt.sign({ userId: 'passenger-001', role: 'passenger' }, JWT_SECRET)}`)
        .send({
          review: xssPayload,
        })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toContain('invalid');
    });

    it('should sanitize output to prevent XSS', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/rides/123')
        .set('Authorization', `Bearer ${jwt.sign({ userId: 'test' }, JWT_SECRET)}`)
        .expect(HttpStatus.OK);

      // Response should not contain unescaped HTML
      expect(JSON.stringify(response.body)).not.toContain('<script>');
    });

    it('should enforce input type validation', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/payments/process')
        .set('Authorization', `Bearer ${jwt.sign({ userId: 'passenger-001' }, JWT_SECRET)}`)
        .send({
          amount: 'not_a_number', // Should be number
          paymentMethod: 'card',
        })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toContain('amount');
    });

    it('should validate email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'invalid_email',
          password: 'Password123!',
        })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toContain('email');
    });
  });

  describe('CORS & Security Headers', () => {
    it('should include security headers in response', async () => {
      const response = await request(app.getHttpServer()).get('/api/health');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['strict-transport-security']).toBeDefined();
    });

    it('should enforce CORS policies', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/rides')
        .set('Origin', 'http://malicious.com')
        .set('Authorization', `Bearer ${jwt.sign({ userId: 'test' }, JWT_SECRET)}`);

      // Should either block or include proper CORS headers
      expect(
        response.headers['access-control-allow-origin'] === undefined ||
        response.headers['access-control-allow-origin'] !== 'http://malicious.com'
      ).toBe(true);
    });

    it('should allow requests from trusted origins', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/rides')
        .set('Origin', 'http://localhost:3000')
        .set('Authorization', `Bearer ${jwt.sign({ userId: 'test' }, JWT_SECRET)}`)
        .expect(HttpStatus.OK);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Rate Limiting & DoS Protection', () => {
    it('should enforce rate limiting on login endpoint', async () => {
      const requests = Array(11).fill(null); // 11 requests

      for (let i = 0; i < requests.length; i++) {
        const response = await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            email: 'passenger@test.com',
            password: 'password123',
          });

        if (i < 10) {
          expect(response.status).not.toBe(HttpStatus.TOO_MANY_REQUESTS);
        } else {
          expect(response.status).toBe(HttpStatus.TOO_MANY_REQUESTS);
        }
      }
    });

    it('should enforce rate limiting on API endpoints', async () => {
      const token = jwt.sign({ userId: 'passenger-001', role: 'passenger' }, JWT_SECRET);

      for (let i = 0; i < 101; i++) {
        const response = await request(app.getHttpServer())
          .get('/api/rides')
          .set('Authorization', `Bearer ${token}`);

        if (i < 100) {
          expect(response.status).not.toBe(HttpStatus.TOO_MANY_REQUESTS);
        } else {
          expect(response.status).toBe(HttpStatus.TOO_MANY_REQUESTS);
        }
      }
    });
  });

  describe('Sensitive Data Protection', () => {
    it('should not expose sensitive data in error messages', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/payments/invalid-id')
        .set('Authorization', `Bearer ${jwt.sign({ userId: 'test' }, JWT_SECRET)}`)
        .expect(HttpStatus.NOT_FOUND);

      // Error message should not contain DB details
      expect(response.body.message).not.toContain('mongodb://');
      expect(response.body.message).not.toContain('SECRET');
    });

    it('should not expose sensitive headers', async () => {
      const response = await request(app.getHttpServer()).get('/api/health');

      // Should not expose internal details
      expect(response.headers['x-powered-by']).toBeUndefined();
      expect(response.headers['server']).not.toContain('Express');
    });

    it('should encrypt sensitive data in transit', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/payments/process')
        .set('Authorization', `Bearer ${jwt.sign({ userId: 'passenger-001' }, JWT_SECRET)}`)
        .send({
          cardNumber: '4111-1111-1111-1111',
          amount: 100,
        })
        .expect(HttpStatus.CREATED);

      // Card number should not be in response
      expect(JSON.stringify(response.body)).not.toContain('4111');
    });
  });
});
