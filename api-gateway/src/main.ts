import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Use Pino structured logger
  app.useLogger(app.get(Logger));

  const port = process.env['PORT'] || 3000;

  // Security headers
  app.use(helmet());

  // Validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // CORS - restrictive for production
  const allowedOrigins = process.env['ALLOWED_ORIGINS']?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:8081',
  ];
  
  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  // ============================================
  // OpenAPI / Swagger Configuration
  // ============================================
  const config = new DocumentBuilder()
    .setTitle('GOING API Gateway')
    .setDescription('API Gateway for GOING Tourism & Transport Platform')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('transport', 'Transport/Ride services')
    .addTag('tours', 'Tour booking services')
    .addTag('booking', 'General booking services')
    .addTag('payments', 'Payment processing')
    .addTag('tracking', 'Real-time tracking')
    .addTag('health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(port);
  
  const logger = app.get(Logger);
  logger.log(`🚀 API Gateway running on http://localhost:${port}`);
  logger.log(`📚 Swagger docs available at http://localhost:${port}/api/docs`);
}

bootstrap();