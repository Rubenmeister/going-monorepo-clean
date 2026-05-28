import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { initKnowledgeBase, getKbWarnings, countRutasPendientesRevision } from '@going-platform/going-kb';

async function bootstrap() {
  // ── 1) Cargar el Centro de Información Going antes de Nest bootstrap.
  // El loader busca knowledge-base/ desde cwd hacia arriba; en Cloud Run
  // está en /app/knowledge-base/ (Dockerfile copia esa carpeta al image).
  try {
    const kb = initKnowledgeBase();
    Logger.log(
      `🧠 KB loaded: ${kb.rutas.length} rutas, ${kb.lugares.length} lugares, ` +
        `${kb.coverage.active_cities.length} ciudades activas, ` +
        `${countRutasPendientesRevision()} tarifas pendientes de revisión`,
      'Bootstrap',
    );
    const warnings = getKbWarnings();
    if (warnings.length > 0) {
      Logger.warn(`KB cargado con ${warnings.length} warnings:`, 'Bootstrap');
      warnings.slice(0, 10).forEach(w => Logger.warn(`  · ${w}`, 'Bootstrap'));
    }
  } catch (e) {
    Logger.error(
      `❌ Failed to load Going KB: ${(e as Error).message}. ` +
        `Service will start but get_quote tool will fail.`,
      'Bootstrap',
    );
  }

  // ── 2) Bootstrap normal de Nest.
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3013;

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({ origin: '*' });

  await app.listen(port, '0.0.0.0');
  Logger.log(`🤖 Customer Support Service running on port ${port}`, 'Bootstrap');
}
bootstrap();
