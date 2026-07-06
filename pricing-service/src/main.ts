import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false })
  );

  // Tolera POST con body vacío / sin Content-Length (ej. POST /admin/lists/:id/activate
  // sin cuerpo) → lo trata como {} en vez de 411/400. El panel manda body igual.
  const fastify = app.getHttpAdapter().getInstance() as any;
  fastify.addContentTypeParser(
    'application/json',
    { parseAs: 'string' },
    (_req: unknown, body: string, done: (err: Error | null, val?: unknown) => void) => {
      if (!body) return done(null, {});
      try { done(null, JSON.parse(body)); } catch (e) { done(e as Error); }
    },
  );

  const port = process.env.PORT || 3011;
  await app.listen(port, '0.0.0.0');
  console.log(`Pricing service is listening on port ${port}`);
}

bootstrap();
