import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3006;
  
  app.enableCors();
  app.setGlobalPrefix('api');
  
  const { HttpAdapterHost } = await import('@nestjs/core');
  const { AllExceptionsFilter } = await import('@going-monorepo/shared');
  const { setupSwagger } = await import('@going-monorepo/shared-backend');
  
  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));
  
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  
  // Use Pino Logger
  // Note: Transport service imports Logger from @nestjs/common in original file, but we want Pino from app context
  // However, we need to ensure Logger is imported from nestjs-pino in bootstrap if we want to use its specific features, 
  // but app.get(Logger) works with the standard token if Pino replaces it.
  // Actually simplest is just:
  const { Logger } = await import('nestjs-pino');
  app.useLogger(app.get(Logger));

  await app.listen(port);
  setupSwagger(app, 'Transport Service', port);
  
  const logger = app.get(Logger);
  logger.log(`🚀 Transport-Service running on http://localhost:${port}/api`);
}
bootstrap();
