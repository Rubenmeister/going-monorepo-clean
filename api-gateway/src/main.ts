import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const requiredEnvVars = ['JWT_SECRET'];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      Logger.error(`Missing required environment variable: ${envVar}`, 'Bootstrap');
      process.exit(1);
    }
  }

  const app = await NestFactory.create(AppModule);
  app.use(helmet());

  const port = process.env.PORT || 3000; // Puerto principal del Gateway

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Habilitar CORS para que los frontends se conecten
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:4200'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });

  await app.listen(port);
  Logger.log(
    `🚀 API Gateway está corriendo en http://localhost:${port}`,
    'Bootstrap',
  );
}
bootstrap();