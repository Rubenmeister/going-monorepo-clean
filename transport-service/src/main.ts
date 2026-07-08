import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app/app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RedisIoAdapter } from './infrastructure/redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const port = process.env.PORT || 3006;

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Socket.io multi-pod: propaga los emits entre instancias vía Redis pub/sub
  // (auditoría #3). Degradación gentil a in-memory si Redis no conecta.
  try {
    const redisAdapter = new RedisIoAdapter(app);
    await redisAdapter.connectToRedis(process.env.REDIS_URL || 'redis://localhost:6379');
    app.useWebSocketAdapter(redisAdapter);
  } catch (e) {
    Logger.warn(
      `Socket.io Redis adapter no disponible (${(e as Error).message}) — usando in-memory (OK con 1 pod)`,
      'Bootstrap',
    );
  }

  const config = new DocumentBuilder()
    .setTitle('Transport Service')
    .setDescription('Transportation trip request & driver assignment API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port, '0.0.0.0');
  Logger.log(
    `🚀 Transport Service running on http://localhost:${port}`,
    'Bootstrap'
  );
  Logger.log(
    `📄 API docs available at http://localhost:${port}/docs`,
    'Bootstrap'
  );
}
bootstrap();
