import { Logger } from 'nestjs-pino';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { UserAppModule } from './app/user-app.module';

async function bootstrap() {
  const app = await NestFactory.create(UserAppModule, { bufferLogs: true });
  
  // Use Pino structured logger
  app.useLogger(app.get(Logger));
  
  // Allow configured origins for CORS
  const allowedOrigins = process.env['ALLOWED_ORIGINS']?.split(',') || ['*'];
  app.enableCors({ origin: allowedOrigins });
  
  const port = process.env['PORT'] || 3009;
  const { HttpAdapterHost } = await import('@nestjs/core');
  const { AllExceptionsFilter } = await import('@going-monorepo/shared');
  const { setupSwagger } = await import('@going-monorepo/shared-backend');
  
  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Use Pino Logger
  app.useLogger(app.get(Logger));

  await app.listen(port, '0.0.0.0');
  
  setupSwagger(app, 'User Auth Service', port);
  
  const logger = app.get(Logger);
  logger.log(`🚀 User Auth Service running on http://localhost:${port}/api`);
}

bootstrap();