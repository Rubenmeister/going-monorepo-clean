import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
  const requiredEnvVars = ['JWT_SECRET', 'USER_DB_URL'];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      Logger.error(`Missing required environment variable: ${envVar}`, 'Bootstrap');
      process.exit(1);
    }
  }

  const app = await NestFactory.create(AppModule);
  app.use(helmet());

  const port = process.env.PORT || 3009;

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('User Auth Service')
    .setDescription('Servicio de autenticación y registro de usuarios')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Endpoints de autenticación')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  Logger.log(
    `🚀 User-Auth-Service está corriendo en http://localhost:${port}`,
    'Bootstrap',
  );
  Logger.log(
    `📄 Swagger UI disponible en http://localhost:${port}/api/docs`,
    'Bootstrap',
  );
}
bootstrap();
