import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT || 3010;
  await app.listen(port);
  console.log(`Analytics service is listening on port ${port}`);
}

bootstrap();
