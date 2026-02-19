import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT || 3000;

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Request logging middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      Logger.log(
        `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`,
        'HTTP',
      );
    });
    next();
  });

  // CORS for frontend clients
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
  });

  const config = new DocumentBuilder()
    .setTitle('Going Platform - API Gateway')
    .setDescription('Central entry point routing to all Going microservices')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints (public)')
    .addTag('transport', 'Transportation services')
    .addTag('bookings', 'Booking management')
    .addTag('payments', 'Payment processing')
    .addTag('tours', 'Tours management')
    .addTag('accommodations', 'Accommodations management')
    .addTag('experiences', 'Experiences management')
    .addTag('parcels', 'Parcel shipping')
    .addTag('notifications', 'Notification delivery')
    .addTag('tracking', 'Real-time tracking')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port);
  Logger.log(`🚀 API Gateway running on http://localhost:${port}`, 'Bootstrap');
  Logger.log(`📄 API docs available at http://localhost:${port}/docs`, 'Bootstrap');
}
bootstrap();
