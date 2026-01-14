import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { HostAppModule } from './app/host-app.module';

async function bootstrap() {
  const app = await NestFactory.create(HostAppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const port = process.env.PORT || 3006;
  const { HttpAdapterHost } = await import('@nestjs/core');
  const { AllExceptionsFilter } = await import('@going-monorepo/shared');
  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

  const { setupSwagger } = await import('@going-monorepo/shared-backend');
  
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Use Pino
  const { Logger } = await import('nestjs-pino');
  app.useLogger(app.get(Logger));

  await app.listen(port, '0.0.0.0');
  setupSwagger(app, 'Host Service', port);
  
  const logger = app.get(Logger);
  logger.log(
    `🚀 Host Service (Anfitriones) is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();