import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { UserAppModule } from './app/user-app.module';

async function bootstrap() {
  const app = await NestFactory.create(UserAppModule);
  // Allow all origins for dev simplicity
  app.enableCors({ origin: '*' }); 
  const port = process.env.PORT || 3009;
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(port);
  Logger.log(
    `🚀 User Auth Service is running on: http://localhost:${port}/api`
  );
}

bootstrap();