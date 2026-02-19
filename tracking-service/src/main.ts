import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT || 3008;

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('Tracking Service')
    .setDescription('Real-time driver location tracking API (HTTP + WebSocket)')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port);
  Logger.log(`🚀 Tracking-Service (HTTP + WebSocket) running on http://localhost:${port}`, 'Bootstrap');
  Logger.log(`📄 API docs available at http://localhost:${port}/docs`, 'Bootstrap');
}
bootstrap();
