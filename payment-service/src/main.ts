import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // ¡ESENCIAL PARA STRIPE!
  });

  const port = process.env.PORT || 3001;
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.listen(port);
  Logger.log(
    `🚀 Payment-Service está corriendo en http://localhost:${port}`,
    'Bootstrap',
  );
}
bootstrap();