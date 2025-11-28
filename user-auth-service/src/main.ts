import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  try {
    const app = await NestFactory.create(AppModule);
    
    // 👇 ESTO ES VITAL PARA QUE NO DE ERROR "FAILED TO FETCH"
    app.enableCors(); 
    app.setGlobalPrefix('api'); // Esto hace que la ruta sea /api/auth/login
    
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
    }));

    const port = process.env.PORT || 3333;
    await app.listen(port);
    
    logger.log(`🚀 BACKEND LISTO en: http://localhost:${port}/api`);
  } catch (error) {
    logger.error('❌ ERROR FATAL:', error);
    process.exit(1);
  }
}
bootstrap();