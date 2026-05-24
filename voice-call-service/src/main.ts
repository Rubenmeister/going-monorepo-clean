/**
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  Uyari — voice-call-service                                          │
 * │  "uyari" = escuchar / oír (kichwa)                                   │
 * │                                                                       │
 * │  Atención de llamadas telefónicas 24/7 con AI. Bridge bidi entre     │
 * │  Twilio Voice (cliente que llama al número Going) y OpenAI Realtime  │
 * │  (voz-a-voz nativo, ~800ms latencia). Publica eventos al cerebro     │
 * │  (Pacha) para que mycortex razone y orchestrator actúe ante patrones │
 * │  detectados (llamadas perdidas, spikes de demanda, fraud, etc.).     │
 * │                                                                       │
 * │  PORT default 3018 — siguiente al stack actual                       │
 * │  (api-gateway 3000, user-auth 3001, ..., emergency 3014, ...)        │
 * └──────────────────────────────────────────────────────────────────────┘
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3018;

  // ValidationPipe con whitelist:true — descarta campos no declarados en DTOs.
  // IMPORTANTE: los DTOs con @ValidateNested() DEBEN llevar @IsDefined() en
  // los campos required (lección sistémica del audit SOS — sin @IsDefined,
  // undefined pasa el pipe y explota TypeError 500 al desreferenciar).
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Twilio webhooks vienen sin Origin — CORS abierto es seguro (auth se hace
  // por X-Twilio-Signature header en el controller).
  app.enableCors({ origin: '*' });

  await app.listen(port, '0.0.0.0');
  Logger.log(`🎙️  Uyari (voice-call-service) escuchando en port ${port}`, 'Bootstrap');
}
bootstrap();
