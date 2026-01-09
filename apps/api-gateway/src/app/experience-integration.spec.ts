import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { ProxyModule } from '../proxy/proxy.module';
import { AuthModule } from '../auth/auth.module';

describe('Experience Integration (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Use a minimal module to avoid complex dependency initialization failures
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        AuthModule,
        ProxyModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should have the /api/experiences/experiences route defined', async () => {
    // Verify that the gateway doesn't return 404 for this route
    // It should return 401 if unauthorized (since ProxyModule protects it)
    const response = await request(app.getHttpServer()).get('/api/experiences/experiences');
    expect(response.status).not.toBe(404);
  });

  it('should return 401 Unauthorized for experience route without token', async () => {
    const response = await request(app.getHttpServer()).get('/api/experiences/experiences');
    expect(response.status).toBe(401); 
  });
});
