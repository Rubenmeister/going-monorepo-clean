import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'reflect-metadata';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  const port = process.env.PORT || 3020;
  await app.listen(port);
  console.log(`Recommendation Service running on port ${port}`);
}
bootstrap();
