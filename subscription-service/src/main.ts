import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'reflect-metadata';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  const port = process.env.PORT || 3021;
  await app.listen(port);
  console.log(`Subscription Service running on port ${port}`);
}
bootstrap();
