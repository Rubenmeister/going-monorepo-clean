import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3009;
  
  app.enableCors();
  app.setGlobalPrefix('api');
  
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(port);
  Logger.log(
    `🚀 Tours-Service está corriendo en http://localhost:${port}/api`,
    'Bootstrap',
  );
}
bootstrap();