import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const port = process.env.PORT || 3009;

  // Cookie support (needed for httpOnly refresh token cookie in future)
  app.use(cookieParser());

  // CORS — allow web + admin frontends
  const allowedOrigins = [
    'https://goingec.com',
    'https://admin.goingec.com',
    'https://empresas.goingec.com',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
  ];
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('User Auth Service')
    .setDescription('User registration, login and JWT token management API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port, '0.0.0.0');
  Logger.log(
    `🚀 User Auth Service running on http://localhost:${port}`,
    'Bootstrap'
  );
  Logger.log(
    `📄 API docs available at http://localhost:${port}/docs`,
    'Bootstrap'
  );
}
bootstrap();
