import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app/app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RedisIoAdapter } from './infrastructure/redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const port = process.env.PORT || 3008;

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Socket.io multi-pod (auditoría Bloque 2 #12): tracking escala a 5 pods; sin
  // adaptador Redis los broadcasts de ubicación no cruzaban instancias.
  // Degradación gentil a in-memory si Redis no conecta.
  try {
    const redisAdapter = new RedisIoAdapter(app);
    await redisAdapter.connectToRedis(
      process.env.REDIS_URL || 'redis://localhost:6379',
    );
    app.useWebSocketAdapter(redisAdapter);
  } catch (e) {
    Logger.warn(
      `Socket.io Redis adapter no disponible (${(e as Error).message}) — usando in-memory (OK con 1 pod)`,
      'Bootstrap',
    );
  }

  const config = new DocumentBuilder()
    .setTitle('Tracking Service')
    .setDescription('Real-time driver location tracking API (HTTP + WebSocket)')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port, '0.0.0.0');
  Logger.log(
    `🚀 Tracking Service running on http://localhost:${port}`,
    'Bootstrap'
  );
  Logger.log(
    `📄 API docs available at http://localhost:${port}/docs`,
    'Bootstrap'
  );
}
bootstrap();
