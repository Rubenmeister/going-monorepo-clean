import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  const port = process.env.PORT || 3002;
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('Notifications Service')
    .setDescription('Servicio de notificaciones push, email y SMS')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('notifications', 'Endpoints de notificaciones')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  Logger.log(
    `🚀 Notifications-Service está corriendo en http://localhost:${port}`,
    'Bootstrap',
  );
  Logger.log(
    `📄 Swagger UI disponible en http://localhost:${port}/api/docs`,
    'Bootstrap',
  );
}
bootstrap();
