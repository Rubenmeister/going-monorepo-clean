import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    // bodyLimit alto no hace falta; NestJS ya registra el parser JSON. NOTA: no
    // agregar un addContentTypeParser('application/json') acá — Fastify tira
    // FST_ERR_CTP_ALREADY_PRESENT y crashea el boot. El 411 de POST sin body es
    // un caso borde de curl (el panel/fetch mandan body); se documenta el `-d '{}'`.
    new FastifyAdapter({ logger: false })
  );

  const port = process.env.PORT || 3011;
  await app.listen(port, '0.0.0.0');
  console.log(`Pricing service is listening on port ${port}`);
}

bootstrap();
