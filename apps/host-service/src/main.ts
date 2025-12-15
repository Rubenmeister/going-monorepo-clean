import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { HostAppModule } from './app/host-app.module';

async function bootstrap() {
  const app = await NestFactory.create(HostAppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const port = process.env.PORT || 3006;
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(port);
  Logger.log(
    `🚀 Host Service (Anfitriones) is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();