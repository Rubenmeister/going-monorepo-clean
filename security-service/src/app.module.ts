import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SecurityController } from './security.controller';
import { HealthController } from './health.controller';
import { SecurityService } from './security.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [SecurityController, HealthController],
  providers: [SecurityService],
})
export class AppModule {}
