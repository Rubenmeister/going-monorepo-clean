import { NestFactory } from '@nestjs/core';
import { TrackingAppModule } from './app/tracking-app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(TrackingAppModule);
  // Allow CORS for WebSockets/Frontend
  app.enableCors({ origin: '*' });
  const port = process.env.PORT || 3011;
  const { HttpAdapterHost } = await import('@nestjs/core');
  const { AllExceptionsFilter } = await import('@going-monorepo/shared');
  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

  const { setupSwagger } = await import('@going-monorepo/shared-backend');

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Use Pino
  const { Logger } = await import('nestjs-pino');
  app.useLogger(app.get(Logger));

  // Use Redis Adapter for WebSockets
  const { RedisIoAdapter } = await import('./adapters/redis-io.adapter');
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  await app.listen(port);
  setupSwagger(app, 'Tracking Service', port);
  
  const logger = app.get(Logger);
  logger.log(
    `🚀 Tracking-Service (HTTP y WebSocket) está corriendo en http://localhost:${port}`,
    'Bootstrap',
  );
}
bootstrap();