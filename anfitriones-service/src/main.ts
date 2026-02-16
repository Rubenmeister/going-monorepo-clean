import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const port = process.env.PORT || 3003;

  const config = new DocumentBuilder()
    .setTitle('Anfitriones Service')
    .setDescription('Servicio de gestión de alojamientos')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('accommodations', 'Endpoints de alojamientos')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  Logger.log(
    `🚀 Anfitriones-Service está corriendo en http://localhost:${port}/${globalPrefix}`,
  );
  Logger.log(
    `📄 Swagger UI disponible en http://localhost:${port}/api/docs`,
  );
}

bootstrap();
