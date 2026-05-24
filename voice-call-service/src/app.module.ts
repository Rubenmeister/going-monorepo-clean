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
import { CerebroPublisherService } from './voice/cerebro-publisher.service';
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
    CerebroPublisherService,
    VoiceCallRepository,
  ],
})
export class AppModule {}
