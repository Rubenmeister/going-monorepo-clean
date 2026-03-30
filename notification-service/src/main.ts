import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    const port = process.env.PORT || 3015;

    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.enableCors({ origin: '*' });

    await app.listen(port, '0.0.0.0');
    Logger.log(`Notification Service running on port ${port}`, 'Bootstrap');
  } catch (err) {
    console.error('STARTUP CRASH:', err);
    process.exit(1);
  }
}
bootstrap();
