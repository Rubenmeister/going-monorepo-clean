import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';

export function setupSwagger(app: INestApplication, serviceName: string, port: number | string) {
  const config = new DocumentBuilder()
    .setTitle(`GOING - ${serviceName}`)
    .setDescription(`API Documentation for ${serviceName}`)
    .setVersion('1.0')
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
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  Logger.log(`📚 Swagger docs available at http://localhost:${port}/api/docs`, 'Swagger');
}
