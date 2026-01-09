/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const { ValidationPipe } = await import('@nestjs/common');
  const { HttpAdapterHost } = await import('@nestjs/core');
  const { AllExceptionsFilter } = await import('@going-monorepo/shared');
  const { setupSwagger } = await import('@going-monorepo/shared-backend');
  
  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Use Pino
  const { Logger } = await import('nestjs-pino');
  app.useLogger(app.get(Logger));

  const port = process.env.PORT || 3000;
  await app.listen(port);
  setupSwagger(app, 'Experience Service', port);
  
  const logger = app.get(Logger);
  logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
