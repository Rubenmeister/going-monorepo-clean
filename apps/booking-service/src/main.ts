import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT || 3010; // Puerto para este microservicio

  // Habilita la validación global de DTOs
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.listen(port);
  Logger.log(
    `🚀 Booking-Service está corriendo en http://localhost:${port}`,
    'Bootstrap',
  );
}
bootstrap();