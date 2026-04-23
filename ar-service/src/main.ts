import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import 'reflect-metadata';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({ origin: '*' });
  const port = process.env.PORT || 3016;
  await app.listen(port, '0.0.0.0');
  Logger.log(`📍 AR Service running on port ${port}`, 'Bootstrap');
}
bootstrap();
