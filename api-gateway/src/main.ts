import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT || 3000; // Puerto principal del Gateway

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Habilitar CORS para que los frontends se conecten
  app.enableCors();

  await app.listen(port);
  Logger.log(
    `🚀 API Gateway está corriendo en http://localhost:${port}`,
    'Bootstrap',
  );
}
bootstrap();