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
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  
  await app.listen(port);
  
  const logger = app.get(Logger);
  logger.log(`🚀 User Auth Service running on http://localhost:${port}/api`);
}

bootstrap();