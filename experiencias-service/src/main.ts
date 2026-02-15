import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const port = process.env.PORT || 3004;

  const config = new DocumentBuilder()
    .setTitle('Experiencias Service')
    .setDescription('Servicio de gestión de experiencias')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('experiences', 'Endpoints de experiencias')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  Logger.log(
    `🚀 Experiencias-Service está corriendo en http://localhost:${port}/${globalPrefix}`,
  );
  Logger.log(
    `📄 Swagger UI disponible en http://localhost:${port}/api/docs`,
  );
}

bootstrap();
