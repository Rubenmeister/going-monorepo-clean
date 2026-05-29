import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
// API
import { TwilioController } from './api/twilio.controller';
import { VoiceCallsController } from './api/voice-calls.controller';
import { VoiceCommandController } from './api/voice-command.controller';
import { HealthController } from './api/health.controller';
// Voice flow
import { VoiceCallService } from './voice/voice-call.service';
import { VoiceCommandService } from './voice/voice-command.service';
import { CerebroPublisherService } from './voice/cerebro-publisher.service';
import { RealtimeBridgeService } from './voice/realtime-bridge.service';
import { HandoffNotifierService } from './voice/handoff-notifier.service';
import { VoicePreferenceClient } from './voice/voice-preference.client';
// OpenAI Realtime
import { OpenAIRealtimeAdapter } from './realtime/openai-realtime.adapter';
// Telegram (mínimo para handoff alerts)
import { TelegramService } from './infrastructure/telegram.service';
// Twilio media stream WS gateway
import { TwilioMediaStreamGateway } from './twilio/twilio-media-stream.gateway';
// Twilio REST client (Calls.update para PSTN transfer en handoff)
import { TwilioRestClient } from './twilio/twilio-rest.client';
// Infra
import { VoiceCallRepository } from './infrastructure/persistence/voice-call.repository';
import { VoiceCallSchema } from './infrastructure/schemas/voice-call.schema';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017',
      {
        // DB dedicada — separar voice calls de emergency/customer-support
        // simplifica retention policies (audio transcripts pueden tener
        // política distinta a SOS por LOPD Ecuador).
        dbName:                   'going-voice-calls',
        serverSelectionTimeoutMS: 30000,
        connectTimeoutMS:         30000,
        socketTimeoutMS:          45000,
        bufferCommands:           false,
      },
    ),
    MongooseModule.forFeature([
      { name: 'VoiceCall', schema: VoiceCallSchema },
    ]),
  ],
  controllers: [
    TwilioController,
    VoiceCallsController,
    VoiceCommandController,
    HealthController,
  ],
  providers: [
    VoiceCallService,
    // VoiceCommandService — backing store de los comandos ops (blocklist en
    // memoria, prompt override que delega al bridge, force handoff). Depende
    // de RealtimeBridgeService.
    VoiceCommandService,
    CerebroPublisherService,
    VoiceCallRepository,
    // OpenAI Realtime adapter + bridge.
    // Adapter es factory (createSession). Bridge mantiene una session por
    // call indexada por streamSid.
    OpenAIRealtimeAdapter,
    RealtimeBridgeService,
    // Voice preference lookup (Sem 3B) — consulta GET /auth/internal/voice-
    // preference?phone= al user-auth-service para resolver lang+voz por
    // caller. Cache en memoria 30min. Fallback a defaults si HTTP falla.
    VoicePreferenceClient,
    // Handoff a operador humano (Telegram alert + opcional PSTN transfer).
    TelegramService,
    HandoffNotifierService,
    // Twilio REST client — usado por el bridge para hacer Calls.update y
    // redirigir la PSTN al TwiML handoff cuando el AI invoca handoff tool.
    TwilioRestClient,
    // Gateway WS — se auto-hookea al httpServer en OnApplicationBootstrap.
    // No expone HTTP routes (no es un Controller), por eso va solo en
    // providers. Inyecta HttpAdapterHost del core de NestJS.
    TwilioMediaStreamGateway,
  ],
})
export class AppModule {}
