import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3007;
  const { HttpAdapterHost } = await import('@nestjs/core');
  const { AllExceptionsFilter } = await import('@going-monorepo/shared');
  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

  const { setupSwagger } = await import('@going-monorepo/shared-backend');

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Use Pino
  const { Logger } = await import('nestjs-pino');
  app.useLogger(app.get(Logger));

  await app.listen(port);
  setupSwagger(app, 'Envios Service', port);
  
  const logger = app.get(Logger);
  logger.log(`🚀 Envios-Service running on http://localhost:${port}`);
}
bootstrap();