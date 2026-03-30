import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VoiceController } from './voice.controller';
import { HealthController } from './health.controller';
import { VoiceService } from './voice.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [VoiceController, HealthController],
  providers: [VoiceService],
})
export class AppModule {}
