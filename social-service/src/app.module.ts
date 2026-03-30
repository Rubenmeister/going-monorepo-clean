import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SocialController } from './social.controller';
import { HealthController } from './health.controller';
import { SocialService } from './social.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [SocialController, HealthController],
  providers: [SocialService],
})
export class AppModule {}
