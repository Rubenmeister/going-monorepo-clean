import { NestFactory } from '@nestjs/core';
import { TrackingAppModule } from './app/tracking-app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  console.log('BOOTSTRAP: Starting tracking-service...');
  try {
    const app = await NestFactory.create(TrackingAppModule);
    console.log('BOOTSTRAP: Nest application created.');
    
    // Allow CORS for WebSockets/Frontend
    app.enableCors({ origin: '*' });
    const port = process.env.PORT || 3011;
    console.log(`BOOTSTRAP: Using port ${port}`);

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
    console.log('BOOTSTRAP: Setting up Redis Adapter...');
    const { RedisIoAdapter } = await import('./adapters/redis-io.adapter');
    const redisIoAdapter = new RedisIoAdapter(app);
    // Connect to Redis asynchronously so it doesn't block the health check
    redisIoAdapter.connectToRedis().then(() => {
      console.log('BOOTSTRAP: Redis connected successfully (async).');
    }).catch((err) => {
      const logger = app.get(Logger);
      logger.error('Error connecting to Redis in Tracking-Service', err);
    });
    app.useWebSocketAdapter(redisIoAdapter);

    console.log('BOOTSTRAP: Starting to listen...');
    await app.listen(port, '0.0.0.0');
    console.log(`BOOTSTRAP: Listening on 0.0.0.0:${port}`);
    setupSwagger(app, 'Tracking Service', port);
    
    const logger = app.get(Logger);
    logger.log(
      `🚀 Tracking-Service (HTTP y WebSocket) está corriendo en http://localhost:${port}`,
      'Bootstrap',
    );
  } catch (error) {
    console.error('BOOTSTRAP FATAL ERROR:', error);
    process.exit(1);
  }
}
bootstrap().catch(err => {
  console.error('BOOTSTRAP UNCAUGHT FATAL ERROR:', err);
  process.exit(1);
});