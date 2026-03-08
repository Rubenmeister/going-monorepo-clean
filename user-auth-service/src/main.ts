import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false })
  );

  const port = process.env.PORT || 3009;

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('User Auth Service')
    .setDescription('User registration, login and JWT token management API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port, '0.0.0.0');
  Logger.log(
    `🚀 User-Auth-Service (Fastify) running on http://localhost:${port}`,
    'Bootstrap'
  );
  Logger.log(
    `📄 API docs available at http://localhost:${port}/docs`,
    'Bootstrap'
  );
}
bootstrap();
