import { NestFactory } from '@nestjs/core';
import { TrackingAppModule } from './app/tracking-app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(TrackingAppModule);
  // Allow CORS for WebSockets/Frontend
  app.enableCors({ origin: '*' });
  const port = process.env.PORT || 3011;
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(port);
  Logger.log(
    `🚀 Tracking-Service (HTTP y WebSocket) está corriendo en http://localhost:${port}`,
    'Bootstrap',
  );
}
bootstrap();