import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // ¡ESENCIAL PARA STRIPE!
  });

  const port = process.env.PORT || 3001;
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('Payment Service')
    .setDescription('Servicio de pagos con integración Stripe')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('payments', 'Endpoints de pagos')
    .addTag('webhooks', 'Webhooks de Stripe')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  Logger.log(
    `🚀 Payment-Service está corriendo en http://localhost:${port}`,
    'Bootstrap',
  );
  Logger.log(
    `📄 Swagger UI disponible en http://localhost:${port}/api/docs`,
    'Bootstrap',
  );
}
bootstrap();
