import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT || 3010;

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('Booking Service')
    .setDescription('Servicio de gestión de reservas')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('bookings', 'Endpoints de reservas')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  Logger.log(
    `🚀 Booking-Service está corriendo en http://localhost:${port}`,
    'Bootstrap',
  );
  Logger.log(
    `📄 Swagger UI disponible en http://localhost:${port}/api/docs`,
    'Bootstrap',
  );
}
bootstrap();
